import * as Sentry from '@sentry/node';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import Fastify, { type FastifyError } from 'fastify';
import { AppError } from './lib/errors.js';
import { authPlugin } from './plugins/auth.js';
import { servicesPlugin } from './plugins/services.js';
import { adminRoutes } from './routes/admin.js';
import { consultationRoutes } from './routes/consultations.js';
import { documentRoutes } from './routes/documents.js';
import { healthRoutes } from './routes/health.js';
import { meRoutes } from './routes/me.js';
import type { AppServices } from './types.js';

export const buildApp = async (services: AppServices) => {
  if (services.env.SENTRY_DSN) {
    Sentry.init({
      dsn: services.env.SENTRY_DSN,
      environment: services.env.NODE_ENV,
      release: services.env.SENTRY_RELEASE,
      sendDefaultPii: false,
    });
  }

  const app = Fastify({
    logger: {
      level: services.env.NODE_ENV === 'production' ? 'info' : 'debug',
      redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
      ...(services.env.NODE_ENV === 'development' ? { transport: { target: 'pino-pretty' } } : {}),
    },
    genReqId: () => crypto.randomUUID(),
    bodyLimit: 1_048_576,
  });

  await app.register(servicesPlugin(services));
  await app.register(sensible);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: services.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    credentials: true,
  });
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024, files: 1 } });
  await app.register(authPlugin);

  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(meRoutes, { prefix: '/me' });
  await app.register(consultationRoutes, { prefix: '/consultations' });
  await app.register(documentRoutes, { prefix: '/documents' });
  await app.register(adminRoutes, { prefix: '/admin' });

  app.setNotFoundHandler((_request, reply) =>
    reply.status(404).send({ message: 'Rota não encontrada', statusCode: 404 }),
  );
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error instanceof AppError ? error.statusCode : (error.statusCode ?? 500);
    const message = statusCode >= 500 ? 'Erro interno do servidor' : error.message;
    if (statusCode >= 500) {
      request.log.error({ err: error }, 'Request failed');
      Sentry.captureException(error, { tags: { requestId: request.id } });
    }
    return reply.status(statusCode).send({ message, statusCode });
  });

  return app;
};
