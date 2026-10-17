import { isDeepStrictEqual } from 'node:util';
import type {
  HelenaCreateDraft,
  HelenaDraft,
  HelenaDraftSummary,
  HelenaUpdateDraft,
} from '@juliana/contracts';
import { and, count, desc, eq } from 'drizzle-orm';
import { auditEvents, helenaDrafts, helenaReports, profiles } from '../db/schema.js';
import { AppError, notFound } from '../lib/errors.js';
import type { AppServices, AuthenticatedUser } from '../types.js';
import { calculateHelenaNatal } from './helena.js';

type DraftRow = typeof helenaDrafts.$inferSelect;
type ReportRow = typeof helenaReports.$inferSelect;
export const staleHelenaDraft = () =>
  new AppError('O mapa foi alterado. Reabra a versão atual antes de continuar', 409);

const toSummary = (draft: DraftRow, report: ReportRow | null): HelenaDraftSummary => ({
  id: draft.id,
  clientId: draft.clientId,
  subjectName: draft.subjectName,
  title: draft.title,
  revision: draft.revision,
  createdAt: draft.createdAt.toISOString(),
  updatedAt: draft.updatedAt.toISOString(),
  report: report
    ? {
        id: report.id,
        revision: report.revision,
        documentId: report.documentId,
        publishedAt: report.publishedAt?.toISOString() ?? null,
      }
    : null,
});

export const requireActiveHelenaClient = async (
  db: Pick<AppServices['db'], 'select'>,
  clientId: string,
) => {
  const [client] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(
      and(eq(profiles.id, clientId), eq(profiles.role, 'client'), eq(profiles.status, 'active')),
    )
    .limit(1)
    .for('share');
  if (!client) throw new AppError('Selecione um cliente ativo para este material', 409);
};

export const getHelenaDraft = async (services: AppServices, id: string): Promise<HelenaDraft> => {
  const [row] = await services.db
    .select({ draft: helenaDrafts, report: helenaReports })
    .from(helenaDrafts)
    .leftJoin(
      helenaReports,
      and(
        eq(helenaReports.draftId, helenaDrafts.id),
        eq(helenaReports.revision, helenaDrafts.revision),
      ),
    )
    .where(eq(helenaDrafts.id, id))
    .limit(1);
  if (!row) throw notFound('Mapa não encontrado');
  return {
    ...toSummary(row.draft, row.report),
    analysis: row.draft.analysis,
    result: row.draft.result,
  };
};

export const listHelenaDrafts = async (services: AppServices, offset: number) => {
  const rows = await services.db
    .select({ draft: helenaDrafts, report: helenaReports })
    .from(helenaDrafts)
    .leftJoin(
      helenaReports,
      and(
        eq(helenaReports.draftId, helenaDrafts.id),
        eq(helenaReports.revision, helenaDrafts.revision),
      ),
    )
    .orderBy(desc(helenaDrafts.updatedAt), desc(helenaDrafts.id))
    .limit(25)
    .offset(offset);
  const [totals] = await services.db.select({ total: count() }).from(helenaDrafts);
  return { items: rows.map((row) => toSummary(row.draft, row.report)), total: totals?.total ?? 0 };
};

const sameCreation = (row: DraftRow, input: HelenaCreateDraft, actor: AuthenticatedUser) =>
  row.createdBy === actor.id &&
  row.revision === 1 &&
  row.clientId === input.clientId &&
  row.subjectName === input.subjectName &&
  row.title === input.title &&
  row.analysis === input.analysis &&
  isDeepStrictEqual(row.result.input, input.natal);

export const createHelenaDraft = async (
  services: AppServices,
  actor: AuthenticatedUser,
  input: HelenaCreateDraft,
) => {
  const [existing] = await services.db
    .select()
    .from(helenaDrafts)
    .where(eq(helenaDrafts.id, input.id))
    .limit(1);
  if (existing) {
    if (!sameCreation(existing, input, actor)) throw staleHelenaDraft();
    return getHelenaDraft(services, input.id);
  }
  const result = await calculateHelenaNatal(services, input.natal);
  await services.db.transaction(async (tx) => {
    await requireActiveHelenaClient(tx, input.clientId);
    const rows = await tx
      .insert(helenaDrafts)
      .values({
        id: input.id,
        clientId: input.clientId,
        subjectName: input.subjectName,
        title: input.title,
        analysis: input.analysis,
        result,
        createdBy: actor.id,
      })
      .onConflictDoNothing()
      .returning();
    if (!rows[0]) {
      const [conflict] = await tx
        .select()
        .from(helenaDrafts)
        .where(eq(helenaDrafts.id, input.id))
        .limit(1);
      if (!conflict || !sameCreation(conflict, input, actor)) throw staleHelenaDraft();
      return;
    }
    await tx.insert(auditEvents).values({
      actorId: actor.id,
      action: 'helena.draft.created',
      entityType: 'helena_draft',
      entityId: input.id,
      metadata: { revision: 1 },
    });
  });
  return getHelenaDraft(services, input.id);
};

export const updateHelenaDraft = async (
  services: AppServices,
  actor: AuthenticatedUser,
  id: string,
  input: HelenaUpdateDraft,
) => {
  const existing = await getHelenaDraft(services, id);
  if (existing.revision !== input.revision) throw staleHelenaDraft();
  const result = isDeepStrictEqual(existing.result.input, input.natal)
    ? existing.result
    : await calculateHelenaNatal(services, input.natal);
  await services.db.transaction(async (tx) => {
    await requireActiveHelenaClient(tx, input.clientId);
    const rows = await tx
      .update(helenaDrafts)
      .set({
        clientId: input.clientId,
        subjectName: input.subjectName,
        title: input.title,
        analysis: input.analysis,
        result,
        revision: input.revision + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(helenaDrafts.id, id), eq(helenaDrafts.revision, input.revision)))
      .returning({ id: helenaDrafts.id });
    if (!rows[0]) throw staleHelenaDraft();
    await tx.insert(auditEvents).values({
      actorId: actor.id,
      action: 'helena.draft.updated',
      entityType: 'helena_draft',
      entityId: id,
      metadata: { revision: input.revision + 1 },
    });
  });
  return getHelenaDraft(services, id);
};
