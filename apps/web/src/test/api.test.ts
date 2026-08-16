import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession, recordApiFailure } = vi.hoisted(() => ({
  getSession: vi.fn(),
  recordApiFailure: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({ supabase: { auth: { getSession } } }));
vi.mock('../observability', () => ({ recordApiFailure }));

import { apiRequest } from '../services/api';

describe('apiRequest', () => {
  beforeEach(() => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'access-token' } } });
    recordApiFailure.mockReset();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('adds the session and JSON headers and returns typed data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      apiRequest('/me', { method: 'PATCH', body: JSON.stringify({ fullName: 'Ana' }) }),
    ).resolves.toEqual({ status: 'ok' });
    const request = fetchMock.mock.calls.at(0)?.[1] as RequestInit;
    const headers = request.headers as Headers;
    expect(headers.get('authorization')).toBe('Bearer access-token');
    expect(headers.get('content-type')).toBe('application/json');
  });

  it('returns undefined for 204 and preserves FormData content negotiation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const body = new FormData();
    body.set('file', new File(['data'], 'mapa.pdf'));

    await expect(apiRequest('/admin/documents', { method: 'POST', body })).resolves.toBeUndefined();
    const request = fetchMock.mock.calls.at(0)?.[1] as RequestInit;
    expect((request.headers as Headers).has('content-type')).toBe(false);
  });

  it('normalizes API errors with status and request id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Sessão expirada', statusCode: 401 }), {
          status: 401,
          headers: { 'x-request-id': 'request-123' },
        }),
      ),
    );

    await expect(apiRequest('/me')).rejects.toMatchObject({
      message: 'Sessão expirada',
      statusCode: 401,
      requestId: 'request-123',
    });
    expect(recordApiFailure).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/me', requestId: 'request-123', statusCode: 401 }),
    );
  });
});
