import { randomUUID } from 'node:crypto';
import type { MultipartFile } from '@fastify/multipart';
import type { Document } from '@juliana/contracts';
import { and, desc, eq } from 'drizzle-orm';
import { auditEvents, consultations, documents, profiles } from '../db/schema.js';
import { AppError, notFound } from '../lib/errors.js';
import { uploadStorageObject } from '../lib/storage.js';
import type { AppServices, AuthenticatedUser } from '../types.js';

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
]);

const toDocument = (row: typeof documents.$inferSelect): Document => ({
  id: row.id,
  userId: row.userId,
  consultationId: row.consultationId,
  displayName: row.displayName,
  mimeType: row.mimeType,
  sizeBytes: row.sizeBytes,
  createdAt: row.createdAt.toISOString(),
});

export const listDocuments = async (
  services: AppServices,
  user: AuthenticatedUser,
  requestedUserId?: string,
) => {
  const userId = user.role === 'admin' && requestedUserId ? requestedUserId : user.id;
  const rows = await services.db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));
  return rows.map(toDocument);
};

export const uploadDocument = async (
  services: AppServices,
  actor: AuthenticatedUser,
  metadata: { userId: string; consultationId?: string; displayName: string },
  file: MultipartFile,
) => {
  if (!allowedMimeTypes.has(file.mimetype))
    throw new AppError('Tipo de arquivo não permitido', 400);

  const [client] = await services.db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, metadata.userId), eq(profiles.role, 'client')))
    .limit(1);
  if (!client) throw notFound('Cliente não encontrado');

  if (metadata.consultationId) {
    const [consultation] = await services.db
      .select({ id: consultations.id })
      .from(consultations)
      .where(
        and(
          eq(consultations.id, metadata.consultationId),
          eq(consultations.userId, metadata.userId),
        ),
      )
      .limit(1);
    if (!consultation) throw notFound('Consulta não encontrada para este cliente');
  }

  const extension = file.filename.includes('.') ? file.filename.split('.').pop() : 'bin';
  const path = `${metadata.userId}/${randomUUID()}.${extension}`;
  let sizeBytes = 0;
  file.file.on('data', (chunk: Buffer) => {
    sizeBytes += chunk.byteLength;
  });
  await uploadStorageObject(services.env, path, file.file, file.mimetype);
  if (file.file.truncated) {
    await services.supabase.admin.storage.from(services.env.SUPABASE_STORAGE_BUCKET).remove([path]);
    throw new AppError('O arquivo excede o limite de 50 MB', 413);
  }

  try {
    const created = await services.db.transaction(async (tx) => {
      const rows = await tx
        .insert(documents)
        .values({
          userId: metadata.userId,
          consultationId: metadata.consultationId ?? null,
          storagePath: path,
          displayName: metadata.displayName,
          mimeType: file.mimetype,
          sizeBytes,
          createdBy: actor.id,
        })
        .returning();
      if (!rows[0]) throw new Error('Document was not created');
      await tx.insert(auditEvents).values({
        actorId: actor.id,
        action: 'document.uploaded',
        entityType: 'document',
        entityId: rows[0].id,
        metadata: { userId: metadata.userId, mimeType: file.mimetype, sizeBytes },
      });
      return rows[0];
    });
    return toDocument(created);
  } catch (error) {
    await services.supabase.admin.storage.from(services.env.SUPABASE_STORAGE_BUCKET).remove([path]);
    throw error;
  }
};

export const createDocumentDownload = async (
  services: AppServices,
  user: AuthenticatedUser,
  documentId: string,
) => {
  const ownership =
    user.role === 'admin'
      ? eq(documents.id, documentId)
      : and(eq(documents.id, documentId), eq(documents.userId, user.id));
  const [document] = await services.db.select().from(documents).where(ownership).limit(1);
  if (!document) throw notFound('Arquivo não encontrado');
  const expiresIn = 300;
  const { data, error } = await services.supabase.admin.storage
    .from(services.env.SUPABASE_STORAGE_BUCKET)
    .createSignedUrl(document.storagePath, expiresIn, { download: document.displayName });
  if (error) throw new AppError('Não foi possível preparar o download', 502);
  return { url: data.signedUrl, expiresIn };
};

export const deleteDocument = async (
  services: AppServices,
  actor: AuthenticatedUser,
  documentId: string,
) => {
  const [document] = await services.db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);
  if (!document) throw notFound('Arquivo não encontrado');
  const { error } = await services.supabase.admin.storage
    .from(services.env.SUPABASE_STORAGE_BUCKET)
    .remove([document.storagePath]);
  if (error) throw new AppError('Não foi possível remover o arquivo armazenado', 502);
  await services.db.transaction(async (tx) => {
    await tx.delete(documents).where(eq(documents.id, documentId));
    await tx.insert(auditEvents).values({
      actorId: actor.id,
      action: 'document.deleted',
      entityType: 'document',
      entityId: documentId,
    });
  });
};
