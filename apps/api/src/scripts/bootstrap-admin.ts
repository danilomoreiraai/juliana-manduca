import { eq } from 'drizzle-orm';
import { createDatabase } from '../db/index.js';
import { profiles } from '../db/schema.js';
import { parseEnv } from '../env.js';
import { createSupabaseClients } from '../lib/supabase.js';

const email = process.env.INITIAL_ADMIN_EMAIL;
const password = process.env.INITIAL_ADMIN_PASSWORD;
const fullName = process.env.INITIAL_ADMIN_NAME;
if (!email || !password || !fullName) {
  throw new Error(
    'INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD and INITIAL_ADMIN_NAME are required',
  );
}

const env = parseEnv();
const database = createDatabase(env);
const supabase = createSupabaseClients(env);

try {
  const { data, error } = await supabase.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('Admin user was not created');
  await database.db
    .insert(profiles)
    .values({ id: data.user.id, email, fullName, role: 'admin', status: 'active' })
    .onConflictDoUpdate({
      target: profiles.id,
      set: { email, fullName, role: 'admin', status: 'active', updatedAt: new Date() },
    });
  const [admin] = await database.db
    .select({ id: profiles.id, email: profiles.email })
    .from(profiles)
    .where(eq(profiles.id, data.user.id));
  console.info(`Admin ready: ${admin?.email ?? email}`);
} finally {
  await database.close();
}
