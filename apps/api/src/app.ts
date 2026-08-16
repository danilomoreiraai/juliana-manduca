import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import Fastify, { type FastifyError, LogController } from 'fastify';
import { AppError } from './lib/errors.js';
import {
  activeTraceId,
  captureServerError,
  recordFailure,
  recordHttpResponse,
  safeErrorForLog,
} from './observability.js';
import { authPlugin } from './plugins/auth.js';
import { servicesPlugin } from './plugins/services.js';
import { adminRoutes } from './routes/admin.js';
import { consultationRoutes } from './routes/consultations.js';
import { documentRoutes } from './routes/documents.js';
import { healthRoutes } from './routes/health.js';
import { meRoutes } from './routes/me.js';
import type { AppServices } from './types.js';

export const buildApp = async (services: AppServices) => {
  const app = Fastify({
    logController: new LogController({ disableRequestLogging: true }),
    logger: {
      level: services.env.NODE_ENV === 'production' ? 'info' : 'debug',
      redact: {
        censor: '[REDACTED]',
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          '*.authorization',
          '*.cookie',
          '*.password',
          '*.token',
          '*.secret',
          '*.email',
          '*.fullName',
        ],
      },
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
    exposedHeaders: ['x-request-id'],
  });
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024, files: 1 } });
  await app.register(authPlugin);

  app.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  app.addHook('onResponse', async (request, reply) => {
    const route = request.routeOptions.url ?? 'unmatched';
    const traceId = activeTraceId();
    recordHttpResponse({
      durationMs: reply.elapsedTime,
      method: request.method,
      route,
      statusCode: reply.statusCode,
    });
    if (reply.statusCode >= 500) recordFailure('server', reply.statusCode);
    if ([401, 403].includes(reply.statusCode)) recordFailure('authentication', reply.statusCode);
    if (route.endsWith('/documents') && request.method === 'POST' && reply.statusCode >= 400) {
      recordFailure('upload', reply.statusCode);
    }
    request.log.info(
      {
        durationMs: reply.elapsedTime,
        method: request.method,
        route,
        statusCode: reply.statusCode,
        ...(traceId ? { traceId } : {}),
      },
      'Request completed',
    );
  });

  app.setNotFoundHandler((_request, reply) =>
    reply.status(404).send({ message: 'Rota não encontrada', statusCode: 404 }),
  );
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error instanceof AppError ? error.statusCode : (error.statusCode ?? 500);
    const message = statusCode >= 500 ? 'Erro interno do servidor' : error.message;
    if (statusCode >= 500) {
      request.log.error(
        { err: safeErrorForLog(error), traceId: activeTraceId() },
        'Request failed',
      );
      captureServerError(error, request.id);
    }
    return reply.status(statusCode).send({ message, statusCode });
  });

  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(meRoutes, { prefix: '/me' });
  await app.register(consultationRoutes, { prefix: '/consultations' });
  await app.register(documentRoutes, { prefix: '/documents' });
  await app.register(adminRoutes, { prefix: '/admin' });

  return app;
};
