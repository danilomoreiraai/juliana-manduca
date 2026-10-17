import { createServer, type Server } from 'node:http';
import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from 'jose';
import postgres from 'postgres';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import natalFixture from '../../../packages/contracts/test/fixtures/helena-j2000.json' with { type: 'json' };
import * as helenaEngine from '../src/functions/helena.js';
import { buildApp } from '../src/app.js';
import { createDatabase } from '../src/db/index.js';
import {
  auditEvents,
  consultations,
  documents,
  profiles,
  helenaDrafts,
  helenaReports,
} from '../src/db/schema.js';
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
  const uploadReport = vi.fn();
  const removeReport = vi.fn();
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
            upload: uploadReport,
            createSignedUrl: async (path: string) => ({
              data: { signedUrl: `https://storage.test/${path}` },
              error: null,
            }),
            remove: removeReport,
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
    uploadReport.mockReset().mockResolvedValue({ data: {}, error: null });
    removeReport.mockReset().mockResolvedValue({ data: [], error: null });
    await database.db.delete(helenaReports);
    await database.db.delete(helenaDrafts);
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
  afterEach(() => vi.restoreAllMocks());

  const savedInput = () => ({
    id: '90000000-0000-4000-8000-000000000001',
    clientId: ids.clientA,
    subjectName: 'João sintético',
    title: 'Mapa natal sintético',
    analysis: 'Análise revisada, com acentos.',
    natal: natalFixture.input,
  });

  it('blocks direct client Storage access to HELENA even with a broad permissive policy', async () => {
    await sql.begin(async (tx) => {
      await tx.unsafe(
        'GRANT USAGE ON SCHEMA storage TO authenticated; GRANT SELECT ON storage.objects TO authenticated',
      );
      await tx.unsafe(
        'CREATE POLICY helena_test_permissive ON storage.objects FOR SELECT TO authenticated USING (true)',
      );
      await tx`insert into storage.objects (bucket_id, name) values ('consultation-files', 'helena-private/synthetic.pdf'), ('consultation-files', 'synthetic-other.pdf')`;
      await tx.unsafe('SET LOCAL ROLE authenticated');
      const rows = await tx<{ name: string }[]>`select name from storage.objects`;
      expect(rows.map((row) => row.name)).toContain('synthetic-other.pdf');
      expect(rows.map((row) => row.name)).not.toContain('helena-private/synthetic.pdf');
      await tx.unsafe('SET LOCAL ROLE NONE');
      await tx.unsafe('DROP POLICY helena_test_permissive ON storage.objects');
      await tx`delete from storage.objects where name in ('helena-private/synthetic.pdf', 'synthetic-other.pdf')`;
    });
  });

  it('saves server-calculated snapshots and publishes the exact reviewed PDF only once', async () => {
    const calculate = vi
      .spyOn(helenaEngine, 'calculateHelenaNatal')
      .mockResolvedValue(natalFixture as never);
    const app = await buildTestApp();
    const headers = { authorization: `Bearer ${await tokenFor(ids.admin, 'aal2')}` };
    const payload = savedInput();
    const request = (method: 'GET' | 'POST' | 'PUT', suffix = '', body?: unknown) =>
      app.inject({
        method,
        url: `/admin/helena/charts${suffix}`,
        headers,
        ...(body ? { payload: body } : {}),
      });
    try {
      expect((await request('POST', '', { ...payload, result: natalFixture })).statusCode).toBe(
        400,
      );
      const created = await request('POST', '', payload);
      expect(created.statusCode).toBe(201);
      expect(created.json()).toMatchObject({
        id: payload.id,
        revision: 1,
        result: natalFixture,
        report: null,
      });
      const replay = await request('POST', '', payload);
      expect(replay.json().id).toBe(payload.id);
      expect(calculate).toHaveBeenCalledOnce();
      expect((await request('GET')).json().total).toBe(1);
      expect((await request('GET', `/${payload.id}`)).json().analysis).toBe(payload.analysis);
      expect(
        (await request('POST', `/${payload.id}/publish`, { revision: 1, reportId: payload.id }))
          .statusCode,
      ).toBe(409);
      const preview = await request('POST', `/${payload.id}/preview`, { revision: 1 });
      expect(preview.statusCode).toBe(200);
      expect(preview.json()).toMatchObject({ revision: 1, expiresIn: 300 });
      await request('POST', `/${payload.id}/preview`, { revision: 1 });
      expect(uploadReport).toHaveBeenCalledOnce();
      const pdf = uploadReport.mock.calls[0]?.[1] as Buffer;
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      const before = await app.inject({
        method: 'GET',
        url: '/documents',
        headers: { authorization: `Bearer ${await tokenFor(ids.clientA)}` },
      });
      expect(before.json()).toHaveLength(1);
      const body = { revision: 1, reportId: preview.json().reportId };
      const [first, second] = await Promise.all([
        request('POST', `/${payload.id}/publish`, body),
        request('POST', `/${payload.id}/publish`, body),
      ]);
      expect(first.statusCode).toBe(200);
      expect(second.json()).toEqual(first.json());
      const deliveredId = first.json().documentId;
      const [stored] = await database.db
        .select()
        .from(documents)
        .where(eq(documents.id, deliveredId));
      expect(stored?.storagePath).toBe(uploadReport.mock.calls[0]?.[0]);
      const own = await app.inject({
        method: 'POST',
        url: `/documents/${deliveredId}/download`,
        headers: { authorization: `Bearer ${await tokenFor(ids.clientA)}` },
      });
      const other = await app.inject({
        method: 'POST',
        url: `/documents/${deliveredId}/download`,
        headers: { authorization: `Bearer ${await tokenFor(ids.clientB)}` },
      });
      expect(own.statusCode).toBe(200);
      expect(other.statusCode).toBe(404);
      const content = {
        clientId: payload.clientId,
        subjectName: payload.subjectName,
        title: payload.title,
        analysis: payload.analysis,
        natal: payload.natal,
      };
      const updated = await request('PUT', `/${payload.id}`, {
        ...content,
        analysis: 'Nova revisão.',
        revision: 1,
      });
      expect(updated.json()).toMatchObject({ revision: 2, report: null });
      expect(calculate).toHaveBeenCalledOnce();
      expect((await request('PUT', `/${payload.id}`, { ...content, revision: 1 })).statusCode).toBe(
        409,
      );
      expect((await request('POST', `/${payload.id}/publish`, body)).statusCode).toBe(409);
      expect(await database.db.select().from(documents)).toHaveLength(3);
    } finally {
      await app.close();
    }
  });

  it('keeps failures private, rejects inactive recipients and does not resurrect deleted documents', async () => {
    vi.spyOn(helenaEngine, 'calculateHelenaNatal').mockResolvedValue(natalFixture as never);
    const app = await buildTestApp();
    const headers = { authorization: `Bearer ${await tokenFor(ids.admin, 'aal2')}` };
    const payload = savedInput();
    try {
      await app.inject({ method: 'POST', url: '/admin/helena/charts', headers, payload });
      uploadReport.mockResolvedValueOnce({
        data: null,
        error: { message: 'private storage details' },
      });
      const failed = await app.inject({
        method: 'POST',
        url: `/admin/helena/charts/${payload.id}/preview`,
        headers,
        payload: { revision: 1 },
      });
      expect(failed.statusCode).toBe(502);
      expect(JSON.stringify(failed.json())).not.toContain('private storage details');
      expect(await database.db.select().from(helenaReports)).toHaveLength(0);
      const preview = await app.inject({
        method: 'POST',
        url: `/admin/helena/charts/${payload.id}/preview`,
        headers,
        payload: { revision: 1 },
      });
      const publishPayload = { revision: 1, reportId: preview.json().reportId };
      await database.db
        .update(profiles)
        .set({ status: 'disabled' })
        .where(eq(profiles.id, ids.clientA));
      const inactive = await app.inject({
        method: 'POST',
        url: `/admin/helena/charts/${payload.id}/publish`,
        headers,
        payload: publishPayload,
      });
      expect(inactive.statusCode).toBe(409);
      await database.db
        .update(profiles)
        .set({ status: 'active' })
        .where(eq(profiles.id, ids.clientA));
      const published = await app.inject({
        method: 'POST',
        url: `/admin/helena/charts/${payload.id}/publish`,
        headers,
        payload: publishPayload,
      });
      expect(published.statusCode).toBe(200);
      await app.inject({
        method: 'DELETE',
        url: `/admin/documents/${published.json().documentId}`,
        headers,
      });
      const retry = await app.inject({
        method: 'POST',
        url: `/admin/helena/charts/${payload.id}/publish`,
        headers,
        payload: publishPayload,
      });
      expect(retry.statusCode).toBe(410);
    } finally {
      await app.close();
    }
  });

  it('denies every saved-map operation to clients and admins without MFA', async () => {
    const app = await buildTestApp();
    try {
      for (const [subject, aal] of [
        [ids.clientA, 'aal2'],
        [ids.admin, 'aal1'],
      ] as const) {
        const headers = { authorization: `Bearer ${await tokenFor(subject, aal)}` };
        for (const [method, suffix, payload] of [
          ['GET', '', undefined],
          ['POST', '', savedInput()],
          ['GET', `/${savedInput().id}`, undefined],
          ['PUT', `/${savedInput().id}`, {}],
          ['POST', `/${savedInput().id}/preview`, { revision: 1 }],
          ['POST', `/${savedInput().id}/publish`, { revision: 1, reportId: savedInput().id }],
        ] as const) {
          expect(
            (
              await app.inject({
                method,
                url: `/admin/helena/charts${suffix}`,
                headers,
                ...(payload ? { payload } : {}),
              })
            ).statusCode,
          ).toBe(403);
        }
      }
    } finally {
      await app.close();
    }
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

  it('restricts HELENA to active admins with AAL2 before invoking the engine', async () => {
    const app = await buildTestApp();
    const payload = {
      date: '2000-01-01',
      time: '12:00:00',
      utcOffsetMinutes: 0,
      latitude: -23.5505,
      longitude: -46.6333,
      houseSystem: 'P',
      zodiac: 'tropical',
    };
    try {
      const anonymous = await app.inject({ method: 'POST', url: '/admin/helena/natal', payload });
      expect(anonymous.statusCode).toBe(401);
      for (const [subject, aal, status] of [
        [ids.clientA, 'aal2', 403],
        [ids.disabled, 'aal2', 403],
        [ids.admin, 'aal1', 403],
        [ids.admin, 'aal2', 503],
      ] as const) {
        const token = await tokenFor(subject, aal);
        const response = await app.inject({
          method: 'POST',
          url: '/admin/helena/natal',
          payload,
          headers: { authorization: `Bearer ${token}` },
        });
        expect(response.statusCode).toBe(status);
      }
      const token = await tokenFor(ids.admin, 'aal2');
      const invalid = await app.inject({
        method: 'POST',
        url: '/admin/helena/natal',
        payload: {},
        headers: { authorization: `Bearer ${token}` },
      });
      expect(invalid.statusCode).toBe(400);
    } finally {
      await app.close();
    }
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
