import { idParamsSchema } from '@juliana/contracts';
import type { FastifyPluginAsync } from 'fastify';
import { createDocumentDownload, listDocuments } from '../functions/documents.js';
import { parseInput } from '../lib/validation.js';

export const documentRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: app.authenticate }, async (request) =>
    listDocuments(app.services, request.currentUser!),
  );
  app.post('/:id/download', { preHandler: app.authenticate }, async (request) => {
    const { id } = parseInput(idParamsSchema, request.params);
    return createDocumentDownload(app.services, request.currentUser!, id);
  });
};
