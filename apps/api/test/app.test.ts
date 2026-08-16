import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { parseEnv } from '../src/env.js';

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
});
