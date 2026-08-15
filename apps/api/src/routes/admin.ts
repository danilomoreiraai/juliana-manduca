import {
  createConsultationSchema,
  documentMetadataSchema,
  idParamsSchema,
  inviteUserSchema,
  paginationSchema,
  updateConsultationSchema,
  updateUserStatusSchema,
  userIdQuerySchema,
} from '@juliana/contracts';
import type { FastifyPluginAsync } from 'fastify';
import {
  createConsultation,
  deleteConsultation,
  listAllConsultations,
  updateConsultation,
} from '../functions/consultations.js';
import { deleteDocument, listDocuments, uploadDocument } from '../functions/documents.js';
import { inviteUser, listUsers, updateUserStatus } from '../functions/profiles.js';
import { AppError } from '../lib/errors.js';
import { parseInput } from '../lib/validation.js';

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.requireAdmin);

  app.get('/users', async (request) => {
    const query = parseInput(paginationSchema, request.query);
    return listUsers(app.services, {
      limit: query.limit,
      offset: query.offset,
      ...(query.search ? { search: query.search } : {}),
    });
  });

  app.post('/users/invite', async (request, reply) => {
    const input = parseInput(inviteUserSchema, request.body);
    const profile = await inviteUser(app.services, request.currentUser!, input);
    return reply.status(201).send(profile);
  });

  app.patch('/users/:id', async (request) => {
    const { id } = parseInput(idParamsSchema, request.params);
    const input = parseInput(updateUserStatusSchema, request.body);
    return updateUserStatus(app.services, request.currentUser!, id, input);
  });

  app.get('/consultations', async () => listAllConsultations(app.services));

  app.post('/consultations', async (request, reply) => {
    const input = parseInput(createConsultationSchema, request.body);
    const consultation = await createConsultation(app.services, request.currentUser!, input);
    return reply.status(201).send(consultation);
  });

  app.patch('/consultations/:id', async (request) => {
    const { id } = parseInput(idParamsSchema, request.params);
    const input = parseInput(updateConsultationSchema, request.body);
    return updateConsultation(app.services, request.currentUser!, id, input);
  });

  app.delete('/consultations/:id', async (request, reply) => {
    const { id } = parseInput(idParamsSchema, request.params);
    await deleteConsultation(app.services, request.currentUser!, id);
    return reply.status(204).send();
  });

  app.get('/documents', async (request) => {
    const query = parseInput(userIdQuerySchema, request.query);
    return listDocuments(app.services, request.currentUser!, query.userId);
  });

  app.post('/documents', async (request, reply) => {
    const metadata = parseInput(documentMetadataSchema, request.query);
    const file = await request.file({ limits: { fileSize: 50 * 1024 * 1024, files: 1 } });
    if (!file) throw new AppError('Selecione um arquivo', 400);
    const document = await uploadDocument(
      app.services,
      request.currentUser!,
      {
        userId: metadata.userId,
        displayName: metadata.displayName,
        ...(metadata.consultationId ? { consultationId: metadata.consultationId } : {}),
      },
      file,
    );
    return reply.status(201).send(document);
  });

  app.delete('/documents/:id', async (request, reply) => {
    const { id } = parseInput(idParamsSchema, request.params);
    await deleteDocument(app.services, request.currentUser!, id);
    return reply.status(204).send();
  });
};
