import type { Profile } from '@juliana/contracts';
import type { Database } from './db/index.js';
import type { Env } from './env.js';
import type { SupabaseClients } from './lib/supabase.js';

export type AuthenticatedUser = Profile & { aal: 'aal1' | 'aal2' };

export interface AppServices {
  env: Env;
  db: Database;
  supabase: SupabaseClients;
}

declare module 'fastify' {
  interface FastifyRequest {
    currentUser: AuthenticatedUser | null;
  }

  interface FastifyInstance {
    services: AppServices;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
