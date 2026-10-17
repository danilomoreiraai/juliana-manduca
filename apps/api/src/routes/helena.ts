import {
  helenaCreateDraftSchema,
  helenaNatalInputSchema,
  helenaPublishSchema,
  helenaRevisionSchema,
  helenaUpdateDraftSchema,
  idParamsSchema,
  paginationSchema,
} from '@juliana/contracts';
import type { FastifyPluginAsync } from 'fastify';
import { calculateHelenaNatal } from '../functions/helena.js';
import {
  createHelenaDraft,
  getHelenaDraft,
  listHelenaDrafts,
  updateHelenaDraft,
} from '../functions/helena-drafts.js';
import { previewHelenaReport, publishHelenaReport } from '../functions/helena-reports.js';
import { parseInput } from '../lib/validation.js';

export const helenaRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (_request, reply) => {
    reply.header('cache-control', 'no-store');
  });
  app.addHook('preHandler', app.requireAdmin);
  app.post('/natal', async (request, reply) => {
    reply.header('cache-control', 'no-store');
    const input = parseInput(helenaNatalInputSchema, request.body);
    return calculateHelenaNatal(app.services, input);
  });
  app.get('/charts', async (request) =>
    listHelenaDrafts(app.services, parseInput(paginationSchema, request.query).offset),
  );
  app.post('/charts', async (request, reply) =>
    reply
      .status(201)
      .send(
        await createHelenaDraft(
          app.services,
          request.currentUser!,
          parseInput(helenaCreateDraftSchema, request.body),
        ),
      ),
  );
  app.get('/charts/:id', async (request) =>
    getHelenaDraft(app.services, parseInput(idParamsSchema, request.params).id),
  );
  app.put('/charts/:id', async (request) =>
    updateHelenaDraft(
      app.services,
      request.currentUser!,
      parseInput(idParamsSchema, request.params).id,
      parseInput(helenaUpdateDraftSchema, request.body),
    ),
  );
  app.post('/charts/:id/preview', async (request) =>
    previewHelenaReport(
      app.services,
      request.currentUser!,
      parseInput(idParamsSchema, request.params).id,
      parseInput(helenaRevisionSchema, request.body).revision,
    ),
  );
  app.post('/charts/:id/publish', async (request) =>
    publishHelenaReport(
      app.services,
      request.currentUser!,
      parseInput(idParamsSchema, request.params).id,
      parseInput(helenaPublishSchema, request.body),
    ),
  );
};
