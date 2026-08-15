import { buildApp } from './app.js';
import { createDatabase } from './db/index.js';
import { parseEnv } from './env.js';
import { createSupabaseClients } from './lib/supabase.js';

const env = parseEnv();
const database = createDatabase(env);
const app = await buildApp({ env, db: database.db, supabase: createSupabaseClients(env) });

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'Shutting down');
  await app.close();
  await database.close();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (error) {
  app.log.error(error);
  await database.close();
  process.exit(1);
}
