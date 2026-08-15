import type { FastifyPluginAsync } from 'fastify';
import { listMyConsultations } from '../functions/consultations.js';

export const consultationRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: app.authenticate }, async (request) =>
    listMyConsultations(app.services, request.currentUser!.id),
  );
};
