import { parseEnv } from './env.js';
import { startObservability } from './observability.js';

const env = parseEnv();
const observability = startObservability(env);
const [{ buildApp }, { createDatabase }, { createSupabaseClients }] = await Promise.all([
  import('./app.js'),
  import('./db/index.js'),
  import('./lib/supabase.js'),
]);
const database = createDatabase(env);
const app = await buildApp({ env, db: database.db, supabase: createSupabaseClients(env) });

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'Shutting down');
  await app.close();
  await database.close();
  await observability.shutdown();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (error) {
  app.log.error(error);
  await database.close();
  await observability.shutdown();
  process.exit(1);
}
