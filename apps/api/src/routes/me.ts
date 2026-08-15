import { updateProfileSchema } from '@juliana/contracts';
import type { FastifyPluginAsync } from 'fastify';
import { getMe, updateMe } from '../functions/profiles.js';
import { parseInput } from '../lib/validation.js';

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: app.authenticate }, async (request) => getMe(request.currentUser!));
  app.patch('/', { preHandler: app.authenticate }, async (request) => {
    const input = parseInput(updateProfileSchema, request.body);
    return updateMe(app.services, request.currentUser!, input);
  });
};
