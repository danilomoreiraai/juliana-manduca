import { type HelenaNatalInput, helenaNatalResultSchema } from '@juliana/contracts';
import { apiRequest } from './api';

export const calculateNatal = async (input: HelenaNatalInput, signal?: AbortSignal) =>
  helenaNatalResultSchema.parse(
    await apiRequest('/admin/helena/natal', {
      method: 'POST',
      body: JSON.stringify(input),
      signal: signal ?? null,
    }),
  );
