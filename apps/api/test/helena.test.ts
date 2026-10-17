import { afterEach, describe, expect, it, vi } from 'vitest';
import fixture from '../../../packages/contracts/test/fixtures/helena-j2000.json' with { type: 'json' };
import { buildApp } from '../src/app.js';
import { parseEnv } from '../src/env.js';
import { calculateHelenaNatal } from '../src/functions/helena.js';

const baseEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost/test',
  WEB_URL: 'http://localhost:5173',
  CORS_ORIGINS: 'http://localhost:5173',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'synthetic-publishable',
  SUPABASE_SECRET_KEY: 'synthetic-secret',
};
const token = 'helena-internal-synthetic-token-000000';
const env = parseEnv({
  ...baseEnv,
  HELENA_ENGINE_URL: 'http://helena.internal:8000',
  HELENA_ENGINE_TOKEN: token,
});
const services = { env, db: {} as never, supabase: { admin: {} } as never };

afterEach(() => vi.unstubAllGlobals());

describe('HELENA engine boundary', () => {
  it('uses a server-only credential and validates a real engine result', async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture)));
    vi.stubGlobal('fetch', request);
    const result = await calculateHelenaNatal(services, fixture.input);
    expect(result).toEqual(fixture);
    expect(request).toHaveBeenCalledWith(
      'http://helena.internal:8000/natal',
      expect.objectContaining({
        method: 'POST',
        redirect: 'error',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      }),
    );
  });

  it('reports an unconfigured optional engine without attempting a request', async () => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    await expect(
      calculateHelenaNatal({ ...services, env: parseEnv(baseEnv) }, fixture.input),
    ).rejects.toMatchObject({ statusCode: 503 });
    expect(request).not.toHaveBeenCalled();
  });

  it.each([
    { ...fixture, protocol: 'wrong' },
    { ...fixture, input: { ...fixture.input, date: '2000-01-02' } },
    { body: 'invalid' },
  ])('rejects malformed or mismatched output', async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
    await expect(calculateHelenaNatal(services, fixture.input)).rejects.toMatchObject({
      statusCode: 502,
    });
  });

  it('rejects oversized output', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('x'.repeat(70000))));
    await expect(calculateHelenaNatal(services, fixture.input)).rejects.toMatchObject({
      statusCode: 502,
    });
  });

  it.each([400, 401, 422, 500])('sanitizes internal HTTP errors (%s)', async (status) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(token + ' sensitive body', { status })),
    );
    await expect(calculateHelenaNatal(services, fixture.input)).rejects.toMatchObject({
      statusCode: status === 422 ? 422 : 502,
      message: expect.not.stringContaining(token),
    });
  });

  it('turns timeouts into a stable gateway timeout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('private', 'TimeoutError')));
    await expect(calculateHelenaNatal(services, fixture.input)).rejects.toMatchObject({
      statusCode: 504,
    });
  });

  it('requires configuration as a pair and accepts an unset engine', () => {
    expect(() => parseEnv({ ...baseEnv, HELENA_ENGINE_TOKEN: token })).toThrow();
    expect(() => parseEnv({ ...baseEnv, HELENA_ENGINE_URL: 'http://internal:8000' })).toThrow();
    expect(() => parseEnv({ ...baseEnv, HELENA_ENGINE_URL: 'file:///tmp' })).toThrow();
    expect(() => parseEnv(baseEnv)).not.toThrow();
  });

  it('protects the HELENA endpoint before any calculation', async () => {
    const app = await buildApp(services);
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/admin/helena/natal',
        payload: fixture.input,
      });
      expect(response.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });
});
