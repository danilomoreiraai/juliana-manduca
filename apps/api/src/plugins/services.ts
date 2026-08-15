import fp from 'fastify-plugin';
import type { AppServices } from '../types.js';

export const servicesPlugin = (services: AppServices) =>
  fp(async (app) => {
    app.decorate('services', services);
  });
