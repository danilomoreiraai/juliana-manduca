import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { parseEnv } from '../src/env.js';
import { AppError } from '../src/lib/errors.js';
import { calculateHelenaNatal } from '../src/functions/helena.js';
import { helenaNatalInputSchema } from '@juliana/contracts';

const env = parseEnv({
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  PORT: '3333',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test',
  WEB_URL: 'http://localhost:5173',
  CORS_ORIGINS: 'http://localhost:5173',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'publishable-test',
  SUPABASE_SECRET_KEY: 'secret-test',
});

describe('api app', () => {
  it('preserves safe HELENA unavailability messages but masks unexpected server errors', async () => {
    const services = { env, db: {} as never, supabase: { admin: {} } as never };
    const app = await buildApp(services);
    await app.register(async (scope) => {
      scope.post('/engine-error', async () =>
        calculateHelenaNatal(
          services,
          helenaNatalInputSchema.parse({
            date: '2000-01-01',
            time: '12:00',
            utcOffsetMinutes: 0,
            latitude: 0,
            longitude: 0,
            houseSystem: 'E',
            zodiac: 'tropical',
          }),
        ),
      );
      scope.get('/private-error', async () => {
        throw new Error('private internal secret');
      });
    });
    try {
      const response = await app.inject({ method: 'POST', url: '/engine-error' });
      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({
        message: 'O motor da HELENA ainda não está configurado neste ambiente',
        statusCode: 503,
      });
      const privateError = await app.inject({ method: 'GET', url: '/private-error' });
      expect(privateError.json()).toEqual({ message: 'Erro interno do servidor', statusCode: 500 });
    } finally {
      await app.close();
    }
  });
  it('exposes liveness without external dependencies', async () => {
    const app = await buildApp({ env, db: {} as never, supabase: { admin: {} } as never });
    const response = await app.inject({ method: 'GET', url: '/health/live' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.json()).toEqual({ status: 'ok' });
    await app.close();
  });

  it('uses the consistent error response contract', async () => {
    const app = await buildApp({ env, db: {} as never, supabase: { admin: {} } as never });
    const response = await app.inject({ method: 'GET', url: '/unknown' });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ message: 'Rota não encontrada', statusCode: 404 });
    await app.close();
  });

  it('applies the error response contract inside registered route scopes', async () => {
    const app = await buildApp({ env, db: {} as never, supabase: { admin: {} } as never });
    await app.register(async (scope) => {
      scope.get('/scoped-error', async () => {
        throw new AppError('Conta desativada', 403);
      });
    });

    const response = await app.inject({ method: 'GET', url: '/scoped-error' });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ message: 'Conta desativada', statusCode: 403 });
    await app.close();
  });
});
