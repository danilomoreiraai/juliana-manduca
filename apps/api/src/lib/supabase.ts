import { createClient } from '@supabase/supabase-js';
import type { Env } from '../env.js';

export const createSupabaseClients = (env: Env) => ({
  admin: createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  }),
});

export type SupabaseClients = ReturnType<typeof createSupabaseClients>;
