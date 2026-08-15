import { sql } from 'drizzle-orm';
import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/live', async () => ({ status: 'ok' }));
  app.get('/ready', async () => {
    await app.services.db.execute(sql`select 1`);
    return { status: 'ready' };
  });
};
