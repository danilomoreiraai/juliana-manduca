import { helenaNatalInputSchema } from '@juliana/contracts';
import type { FastifyPluginAsync } from 'fastify';
import { calculateHelenaNatal } from '../functions/helena.js';
import { parseInput } from '../lib/validation.js';

export const helenaRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.requireAdmin);
  app.post('/natal', async (request, reply) => {
    reply.header('cache-control', 'no-store');
    const input = parseInput(helenaNatalInputSchema, request.body);
    return calculateHelenaNatal(app.services, input);
  });
};
