import type { ZodType } from 'zod';
import { AppError } from './errors.js';

export const parseInput = <T>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'Dados inválidos';
    throw new AppError(message, 400);
  }
  return result.data;
};
