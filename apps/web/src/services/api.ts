import type { ApiError } from '@juliana/contracts';
import { config } from '../config';
import { supabase } from '../lib/supabase';
import { recordApiFailure } from '../observability';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly requestId?: string,
  ) {
    super(message);
  }
}

export const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init?.headers);
  if (data.session?.access_token)
    headers.set('authorization', `Bearer ${data.session.access_token}`);
  if (init?.body && !(init.body instanceof FormData))
    headers.set('content-type', 'application/json');

  const response = await fetch(`${config.apiUrl}${path}`, { ...init, headers });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    const requestId = response.headers.get('x-request-id') ?? undefined;
    void recordApiFailure({
      kind: path.startsWith('/admin/documents') && init?.method === 'POST' ? 'upload' : 'api',
      path,
      ...(requestId ? { requestId } : {}),
      statusCode: response.status,
    });
    throw new ApiRequestError(
      error?.message ?? 'Não foi possível concluir a solicitação',
      response.status,
      requestId,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};
