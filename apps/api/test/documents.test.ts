import { Readable } from 'node:stream';
import type { MultipartFile } from '@fastify/multipart';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDocumentDownload, uploadDocument } from '../src/functions/documents.js';
import { parseEnv } from '../src/env.js';
import type { AppServices, AuthenticatedUser } from '../src/types.js';

const env = parseEnv({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test',
  WEB_URL: 'http://localhost:5173',
  CORS_ORIGINS: 'http://localhost:5173',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'publishable-test',
  SUPABASE_SECRET_KEY: 'secret-test',
});

const actor: AuthenticatedUser = {
  id: '10000000-0000-4000-8000-000000000003',
  email: 'admin@example.com',
  fullName: 'Admin',
  role: 'admin',
  status: 'active',
  aal: 'aal2',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const multipartFile = (mimetype: string, truncated = false) => {
  const stream = Readable.from([Buffer.from('test')]);
  Object.assign(stream, { truncated });
  return {
    fieldname: 'file',
    filename: 'material.pdf',
    encoding: '7bit',
    mimetype,
    file: stream,
    fields: {},
    toBuffer: async () => Buffer.from('test'),
  } as unknown as MultipartFile;
};

const selectionDb = (rows: unknown[]) =>
  ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => rows,
        }),
      }),
    }),
  }) as unknown as AppServices['db'];

afterEach(() => vi.unstubAllGlobals());

describe('document failure rules', () => {
  it('rejects unsupported uploads before touching storage', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const services = {
      env,
      db: selectionDb([]),
      supabase: { admin: {} },
    } as unknown as AppServices;

    await expect(
      uploadDocument(
        services,
        actor,
        { userId: actor.id, displayName: 'Executável' },
        multipartFile('application/x-msdownload'),
      ),
    ).rejects.toMatchObject({ message: 'Tipo de arquivo não permitido', statusCode: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('removes a truncated upload and reports the 50 MB limit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    const remove = vi.fn().mockResolvedValue({ data: [], error: null });
    const services = {
      env,
      db: selectionDb([{ id: actor.id }]),
      supabase: { admin: { storage: { from: () => ({ remove }) } } },
    } as unknown as AppServices;

    await expect(
      uploadDocument(
        services,
        actor,
        { userId: actor.id, displayName: 'Arquivo grande' },
        multipartFile('application/pdf', true),
      ),
    ).rejects.toMatchObject({ message: 'O arquivo excede o limite de 50 MB', statusCode: 413 });
    expect(remove).toHaveBeenCalledOnce();
  });

  it('maps a signed URL provider failure to a stable 502 response', async () => {
    const services = {
      env,
      db: selectionDb([
        {
          id: '20000000-0000-4000-8000-000000000001',
          userId: actor.id,
          storagePath: 'client/material.pdf',
          displayName: 'Material',
        },
      ]),
      supabase: {
        admin: {
          storage: {
            from: () => ({
              createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: new Error('down') }),
            }),
          },
        },
      },
    } as unknown as AppServices;

    await expect(
      createDocumentDownload(services, actor, '20000000-0000-4000-8000-000000000001'),
    ).rejects.toMatchObject({ message: 'Não foi possível preparar o download', statusCode: 502 });
  });
});
