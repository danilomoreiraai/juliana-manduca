import { type HelenaNatalInput, helenaNatalResultSchema } from '@juliana/contracts';
import { AppError } from '../lib/errors.js';
import { HelenaEngineError } from '../lib/helena-error.js';
import type { AppServices } from '../types.js';

const invalidOutput = () => new HelenaEngineError('invalid');

const readResult = async (response: Response): Promise<unknown> => {
  if (!response.body) throw invalidOutput();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65_536) {
        await reader.cancel();
        throw invalidOutput();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw invalidOutput();
  }
};

export const calculateHelenaNatal = async (services: AppServices, input: HelenaNatalInput) => {
  const { HELENA_ENGINE_URL: url, HELENA_ENGINE_TOKEN: token } = services.env;
  if (!url || !token) {
    throw new HelenaEngineError('unconfigured');
  }
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/natal`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(10_000),
      redirect: 'error',
    });
    if (response.status === 422) {
      throw new AppError(
        'Não foi possível calcular com essa data, latitude e sistema de casas',
        422,
      );
    }
    if (!response.ok) throw new HelenaEngineError('failed');
    const result = helenaNatalResultSchema.safeParse(await readResult(response));
    if (!result.success || JSON.stringify(result.data.input) !== JSON.stringify(input))
      throw invalidOutput();
    return result.data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) {
      throw new HelenaEngineError('timeout');
    }
    throw new HelenaEngineError('unavailable');
  }
};
