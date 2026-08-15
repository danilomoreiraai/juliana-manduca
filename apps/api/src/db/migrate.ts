import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { parseEnv } from '../env.js';
import { createDatabase } from './index.js';

const env = parseEnv();
const { db, close } = createDatabase(env);

try {
  await migrate(db, { migrationsFolder: new URL('../../drizzle', import.meta.url).pathname });
  console.info('Database migrations completed');
} finally {
  await close();
}
