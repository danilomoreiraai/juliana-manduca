import { createServer, type Server } from 'node:http';
import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from 'jose';
import postgres from 'postgres';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { createDatabase } from '../src/db/index.js';
import { auditEvents, consultations, documents, profiles } from '../src/db/schema.js';
import { parseEnv, type Env } from '../src/env.js';
import type { AppServices } from '../src/types.js';

const integration = process.env.RUN_DB_INTEGRATION === 'true' ? describe : describe.skip;

const ids = {
  clientA: '10000000-0000-4000-8000-000000000001',
  clientB: '10000000-0000-4000-8000-000000000002',
  admin: '10000000-0000-4000-8000-000000000003',
  disabled: '10000000-0000-4000-8000-000000000004',
  documentA: '20000000-0000-4000-8000-000000000001',
  documentB: '20000000-0000-4000-8000-000000000002',
};

integration('API with isolated PostgreSQL and Supabase-compatible auth', () => {
  let jwksServer: Server;
  let privateKey: KeyLike;
  let env: Env;
  let database: ReturnType<typeof createDatabase>;
  let sql: ReturnType<typeof postgres>;

  const tokenFor = (subject: string, aal: 'aal1' | 'aal2' = 'aal1', expiresIn = '5m') =>
    new SignJWT({ aal, role: 'authenticated' })
      .setProtectedHeader({ alg: 'RS256', kid: 'integration-key' })
      .setIssuer(`${env.SUPABASE_URL}/auth/v1`)
      .setAudience('authenticated')
      .setSubject(subject)
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(privateKey);

  const buildTestApp = () => {
    const supabase = {
      admin: {
        storage: {
          from: () => ({
            createSignedUrl: async (path: string) => ({
              data: { signedUrl: `https://storage.test/${path}` },
              error: null,
            }),
            remove: async () => ({ data: [], error: null }),
          }),
        },
        auth: { admin: {} },
      },
    } as unknown as AppServices['supabase'];
    return buildApp({ env, db: database.db, supabase });
  };

  beforeAll(async () => {
    const keys = await generateKeyPair('RS256');
    privateKey = keys.privateKey;
    const publicJwk = await exportJWK(keys.publicKey);
    jwksServer = createServer((request, response) => {
      if (request.url !== '/auth/v1/.well-known/jwks.json') {
        response.writeHead(404).end();
        return;
      }
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({ keys: [{ ...publicJwk, alg: 'RS256', kid: 'integration-key' }] }),
      );
    });
    await new Promise<void>((resolve) => jwksServer.listen(0, '127.0.0.1', resolve));
    const address = jwksServer.address();
    if (!address || typeof address === 'string') throw new Error('JWKS server did not start');

    env = parseEnv({
      NODE_ENV: 'test',
      HOST: '127.0.0.1',
      PORT: '3333',
      DATABASE_URL: process.env.DATABASE_URL,
      WEB_URL: 'http://localhost:5173',
      CORS_ORIGINS: 'http://localhost:5173',
      SUPABASE_URL: `http://127.0.0.1:${address.port}`,
      SUPABASE_PUBLISHABLE_KEY: 'integration-publishable-key',
      SUPABASE_SECRET_KEY: 'integration-secret-key',
    });
    database = createDatabase(env);
    sql = postgres(env.DATABASE_URL, { max: 1 });
  });

  beforeEach(async () => {
    await database.db.delete(auditEvents);
    await database.db.delete(documents);
    await database.db.delete(consultations);
    await database.db.delete(profiles);
    await sql`delete from auth.users`;
    await sql`insert into auth.users (id) values (${ids.clientA}), (${ids.clientB}), (${ids.admin}), (${ids.disabled})`;
    await database.db.insert(profiles).values([
      {
        id: ids.clientA,
        email: 'ana@example.com',
        fullName: 'Ana Cliente',
        role: 'client',
        status: 'active',
      },
      {
        id: ids.clientB,
        email: 'bia@example.com',
        fullName: 'Bia Cliente',
        role: 'client',
        status: 'active',
      },
      {
        id: ids.admin,
        email: 'admin@example.com',
        fullName: 'Admin',
        role: 'admin',
        status: 'active',
      },
      {
        id: ids.disabled,
        email: 'off@example.com',
        fullName: 'Desativada',
        role: 'client',
        status: 'disabled',
      },
    ]);
    await database.db.insert(consultations).values([
      { userId: ids.clientA, title: 'Mapa de Ana', scheduledAt: new Date('2027-01-10T12:00:00Z') },
      { userId: ids.clientB, title: 'Mapa de Bia', scheduledAt: new Date('2027-01-11T12:00:00Z') },
    ]);
    await database.db.insert(documents).values([
      {
        id: ids.documentA,
        userId: ids.clientA,
        storagePath: 'ana/mapa.pdf',
        displayName: 'Mapa de Ana',
        mimeType: 'application/pdf',
        sizeBytes: 100,
        createdBy: ids.admin,
      },
      {
        id: ids.documentB,
        userId: ids.clientB,
        storagePath: 'bia/mapa.pdf',
        displayName: 'Mapa de Bia',
        mimeType: 'application/pdf',
        sizeBytes: 200,
        createdBy: ids.admin,
      },
    ]);
  });

  afterAll(async () => {
    await database?.close();
    await sql?.end();
    await new Promise<void>((resolve, reject) =>
      jwksServer?.close((error) => (error ? reject(error) : resolve())),
    );
  });

  it('enforces anonymous, client, admin aal1 and admin aal2 authorization', async () => {
    const app = await buildTestApp();
    const anonymous = await app.inject({ method: 'GET', url: '/documents' });
    expect(anonymous.statusCode).toBe(401);

    const clientToken = await tokenFor(ids.clientA);
    const clientAdmin = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: { authorization: `Bearer ${clientToken}` },
    });
    expect(clientAdmin.statusCode).toBe(403);

    const adminAal1 = await tokenFor(ids.admin, 'aal1');
    const missingMfa = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: { authorization: `Bearer ${adminAal1}` },
    });
    expect(missingMfa.statusCode).toBe(403);
    expect(missingMfa.json()).toMatchObject({
      message: 'Autenticação de dois fatores obrigatória',
    });

    const adminAal2 = await tokenFor(ids.admin, 'aal2');
    const allowed = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: { authorization: `Bearer ${adminAal2}` },
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json()).toMatchObject({ total: 3 });
    await app.close();
  });

  it('isolates consultations, document listing and downloads between clients', async () => {
    const app = await buildTestApp();
    const token = await tokenFor(ids.clientA);
    const headers = { authorization: `Bearer ${token}` };

    const consultationResponse = await app.inject({
      method: 'GET',
      url: '/consultations',
      headers,
    });
    expect(consultationResponse.json()).toEqual([
      expect.objectContaining({ title: 'Mapa de Ana', userId: ids.clientA }),
    ]);

    const documentResponse = await app.inject({ method: 'GET', url: '/documents', headers });
    expect(documentResponse.json()).toEqual([
      expect.objectContaining({ id: ids.documentA, userId: ids.clientA }),
    ]);

    const forbiddenDownload = await app.inject({
      method: 'POST',
      url: `/documents/${ids.documentB}/download`,
      headers,
    });
    expect(forbiddenDownload.statusCode).toBe(404);
    expect(forbiddenDownload.json()).toEqual({
      message: 'Arquivo não encontrado',
      statusCode: 404,
    });
    await app.close();
  });

  it('rejects expired sessions and disabled profiles', async () => {
    const app = await buildTestApp();
    const expired = await tokenFor(ids.clientA, 'aal1', '-1s');
    const expiredResponse = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: `Bearer ${expired}` },
    });
    expect(expiredResponse.statusCode).toBe(401);

    const disabled = await tokenFor(ids.disabled);
    const disabledResponse = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: `Bearer ${disabled}` },
    });
    expect(disabledResponse.statusCode).toBe(403);
    expect(disabledResponse.json()).toEqual({ message: 'Conta desativada', statusCode: 403 });
    await app.close();
  });
});
