import type {
  Consultation,
  CreateConsultationInput,
  UpdateConsultationInput,
} from '@juliana/contracts';
import { and, asc, desc, eq } from 'drizzle-orm';
import { auditEvents, consultations, profiles } from '../db/schema.js';
import { notFound } from '../lib/errors.js';
import type { AppServices, AuthenticatedUser } from '../types.js';

type ConsultationRow = typeof consultations.$inferSelect & { clientName?: string };

const toConsultation = (row: ConsultationRow): Consultation => ({
  id: row.id,
  userId: row.userId,
  ...(row.clientName ? { clientName: row.clientName } : {}),
  title: row.title,
  scheduledAt: row.scheduledAt.toISOString(),
  status: row.status,
  summary: row.summary,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const listMyConsultations = async (services: AppServices, userId: string) => {
  const rows = await services.db
    .select()
    .from(consultations)
    .where(eq(consultations.userId, userId))
    .orderBy(desc(consultations.scheduledAt));
  return rows.map(toConsultation);
};

export const listAllConsultations = async (services: AppServices) => {
  const rows = await services.db
    .select({
      id: consultations.id,
      userId: consultations.userId,
      clientName: profiles.fullName,
      title: consultations.title,
      scheduledAt: consultations.scheduledAt,
      status: consultations.status,
      summary: consultations.summary,
      createdAt: consultations.createdAt,
      updatedAt: consultations.updatedAt,
    })
    .from(consultations)
    .innerJoin(profiles, eq(profiles.id, consultations.userId))
    .orderBy(asc(consultations.scheduledAt));
  return rows.map(toConsultation);
};

export const createConsultation = async (
  services: AppServices,
  actor: AuthenticatedUser,
  input: CreateConsultationInput,
) => {
  const [client] = await services.db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, input.userId), eq(profiles.role, 'client')))
    .limit(1);
  if (!client) throw notFound('Cliente não encontrado');

  const created = await services.db.transaction(async (tx) => {
    const rows = await tx
      .insert(consultations)
      .values({
        userId: input.userId,
        title: input.title,
        scheduledAt: new Date(input.scheduledAt),
        status: input.status,
        summary: input.summary ?? null,
      })
      .returning();
    if (!rows[0]) throw new Error('Consultation was not created');
    await tx.insert(auditEvents).values({
      actorId: actor.id,
      action: 'consultation.created',
      entityType: 'consultation',
      entityId: rows[0].id,
    });
    return rows[0];
  });
  return toConsultation(created);
};

export const updateConsultation = async (
  services: AppServices,
  actor: AuthenticatedUser,
  consultationId: string,
  input: UpdateConsultationInput,
) => {
  const values = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.scheduledAt !== undefined ? { scheduledAt: new Date(input.scheduledAt) } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    updatedAt: new Date(),
  };
  const updated = await services.db.transaction(async (tx) => {
    const rows = await tx
      .update(consultations)
      .set(values)
      .where(eq(consultations.id, consultationId))
      .returning();
    if (!rows[0]) throw notFound('Consulta não encontrada');
    await tx.insert(auditEvents).values({
      actorId: actor.id,
      action: 'consultation.updated',
      entityType: 'consultation',
      entityId: consultationId,
      metadata: input,
    });
    return rows[0];
  });
  return toConsultation(updated);
};

export const deleteConsultation = async (
  services: AppServices,
  actor: AuthenticatedUser,
  consultationId: string,
) => {
  await services.db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(consultations)
      .where(eq(consultations.id, consultationId))
      .returning({ id: consultations.id });
    if (!deleted) throw notFound('Consulta não encontrada');
    await tx.insert(auditEvents).values({
      actorId: actor.id,
      action: 'consultation.deleted',
      entityType: 'consultation',
      entityId: consultationId,
    });
  });
};
