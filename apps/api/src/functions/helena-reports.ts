import { createHash, randomUUID } from 'node:crypto';
import type { HelenaPublish } from '@juliana/contracts';
import { and, eq } from 'drizzle-orm';
import { auditEvents, documents, helenaDrafts, helenaReports } from '../db/schema.js';
import { AppError, notFound } from '../lib/errors.js';
import { helenaPdfVersion, renderHelenaPdf } from '../lib/helena-pdf.js';
import type { AppServices, AuthenticatedUser } from '../types.js';
import { getHelenaDraft, requireActiveHelenaClient, staleHelenaDraft } from './helena-drafts.js';

const reportFilter = (id: string, revision: number) =>
  and(eq(helenaReports.draftId, id), eq(helenaReports.revision, revision));
const storage = (services: AppServices) =>
  services.supabase.admin.storage.from(services.env.SUPABASE_STORAGE_BUCKET);
const reportAvailable = (report: typeof helenaReports.$inferSelect) => {
  if (report.publishedAt && !report.documentId)
    throw new AppError(
      'Este material foi removido. Salve uma nova revisão para gerar outro PDF',
      410,
    );
};

export const previewHelenaReport = async (
  services: AppServices,
  actor: AuthenticatedUser,
  id: string,
  revision: number,
) => {
  const draft = await getHelenaDraft(services, id);
  if (draft.revision !== revision) throw staleHelenaDraft();
  let [report] = await services.db
    .select()
    .from(helenaReports)
    .where(reportFilter(id, revision))
    .limit(1);
  if (!report) {
    const pdf = await renderHelenaPdf(draft);
    if (pdf.byteLength > 3_000_000)
      throw new AppError('O relatório excede o limite de tamanho', 413);
    const path = `helena-private/${id}/${revision}/${randomUUID()}.pdf`;
    const { error } = await storage(services).upload(path, pdf, {
      contentType: 'application/pdf',
      upsert: false,
      cacheControl: '0',
    });
    if (error) throw new AppError('Não foi possível armazenar o PDF da HELENA', 502);
    const removeOwnUnusedObject = async () => {
      try {
        await storage(services).remove([path]);
      } catch {
        /* Private orphan; never remove another attempt's object. */
      }
    };
    try {
      report = await services.db.transaction(async (tx) => {
        const [current] = await tx
          .select()
          .from(helenaDrafts)
          .where(eq(helenaDrafts.id, id))
          .for('update');
        if (!current || current.revision !== revision) throw staleHelenaDraft();
        const [cached] = await tx
          .select()
          .from(helenaReports)
          .where(reportFilter(id, revision))
          .limit(1);
        if (cached) return cached;
        const [created] = await tx
          .insert(helenaReports)
          .values({
            draftId: id,
            revision,
            clientId: draft.clientId,
            storagePath: path,
            sizeBytes: pdf.byteLength,
            sha256: createHash('sha256').update(pdf).digest('hex'),
            formatVersion: helenaPdfVersion,
          })
          .returning();
        if (!created) throw new Error('Report was not created');
        await tx.insert(auditEvents).values({
          actorId: actor.id,
          action: 'helena.report.generated',
          entityType: 'helena_report',
          entityId: created.id,
          metadata: { revision },
        });
        return created;
      });
      if (report.storagePath !== path) await removeOwnUnusedObject();
    } catch (caught) {
      // A known precondition abort is safe to clean up. An uncertain DB commit is not.
      if (caught instanceof AppError && caught.statusCode < 500) await removeOwnUnusedObject();
      throw caught;
    }
  }
  reportAvailable(report);
  const { data, error } = await storage(services).createSignedUrl(report.storagePath, 300, {
    download: `${draft.title}.pdf`,
  });
  if (error || !data?.signedUrl)
    throw new AppError('Não foi possível preparar a revisão do PDF', 502);
  return { reportId: report.id, revision, url: data.signedUrl, expiresIn: 300 as const };
};

export const publishHelenaReport = async (
  services: AppServices,
  actor: AuthenticatedUser,
  id: string,
  input: HelenaPublish,
) =>
  services.db.transaction(async (tx) => {
    const [draft] = await tx
      .select()
      .from(helenaDrafts)
      .where(eq(helenaDrafts.id, id))
      .for('update');
    if (!draft) throw notFound('Mapa não encontrado');
    if (draft.revision !== input.revision) throw staleHelenaDraft();
    await requireActiveHelenaClient(tx, draft.clientId);
    const [report] = await tx
      .select()
      .from(helenaReports)
      .where(and(reportFilter(id, input.revision), eq(helenaReports.id, input.reportId)))
      .limit(1);
    if (!report || report.clientId !== draft.clientId)
      throw new AppError('Gere e revise o PDF desta versão antes de liberar', 409);
    reportAvailable(report);
    if (report.documentId) return { documentId: report.documentId, revision: input.revision };
    const [document] = await tx
      .insert(documents)
      .values({
        userId: draft.clientId,
        storagePath: report.storagePath,
        displayName: `${draft.title} · HELENA.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: report.sizeBytes,
        createdBy: actor.id,
      })
      .returning({ id: documents.id });
    if (!document) throw new Error('Document was not created');
    await tx
      .update(helenaReports)
      .set({ documentId: document.id, publishedBy: actor.id, publishedAt: new Date() })
      .where(eq(helenaReports.id, report.id));
    await tx.insert(auditEvents).values({
      actorId: actor.id,
      action: 'helena.report.published',
      entityType: 'document',
      entityId: document.id,
      metadata: { draftId: id, reportId: report.id, revision: input.revision },
    });
    return { documentId: document.id, revision: input.revision };
  });
