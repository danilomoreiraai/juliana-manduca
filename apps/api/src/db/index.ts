import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { Env } from '../env.js';
import * as schema from './schema.js';

export const createDatabase = (env: Env) => {
  const client = postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === 'production' ? 10 : 3,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return {
    db: drizzle(client, { schema }),
    close: async () => client.end(),
  };
};

export type Database = ReturnType<typeof createDatabase>['db'];
