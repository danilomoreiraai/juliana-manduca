import { Readable } from 'node:stream';
import type { Env } from '../env.js';
import { AppError } from './errors.js';

const encodeStoragePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

export const uploadStorageObject = async (
  env: Env,
  path: string,
  stream: NodeJS.ReadableStream,
  mimeType: string,
) => {
  const response = await fetch(
    `${env.SUPABASE_URL}/storage/v1/object/${encodeURIComponent(env.SUPABASE_STORAGE_BUCKET)}/${encodeStoragePath(path)}`,
    {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SECRET_KEY,
        authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
        'content-type': mimeType,
        'x-upsert': 'false',
      },
      body: Readable.toWeb(stream as Readable),
      duplex: 'half',
    } as RequestInit & { duplex: 'half' },
  );

  if (!response.ok) {
    throw new AppError('Não foi possível armazenar o arquivo', 502);
  }
};
