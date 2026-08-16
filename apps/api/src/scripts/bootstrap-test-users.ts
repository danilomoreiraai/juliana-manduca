import { z } from 'zod';
import { createDatabase } from '../db/index.js';
import { parseEnv } from '../env.js';
import { provisionUser } from '../functions/provision-user.js';
import { createSupabaseClients } from '../lib/supabase.js';

const testUsersEnvSchema = z.object({
  TEST_ADMIN_EMAIL: z.email().default('admin.validacao@julianamanduca.com.br'),
  TEST_ADMIN_NAME: z.string().trim().min(2).default('Admin Validação'),
  TEST_ADMIN_PASSWORD: z.string().min(12),
  TEST_CLIENT_EMAIL: z.email().default('cliente.validacao@julianamanduca.com.br'),
  TEST_CLIENT_NAME: z.string().trim().min(2).default('Cliente Validação'),
  TEST_CLIENT_PASSWORD: z.string().min(12),
});

const env = parseEnv();
const testUsersEnv = testUsersEnvSchema.parse(process.env);
const database = createDatabase(env);
const supabase = createSupabaseClients(env);
const services = { env, ...database, supabase };

try {
  const admin = await provisionUser(services, {
    email: testUsersEnv.TEST_ADMIN_EMAIL,
    fullName: testUsersEnv.TEST_ADMIN_NAME,
    password: testUsersEnv.TEST_ADMIN_PASSWORD,
    role: 'admin',
  });
  const client = await provisionUser(services, {
    email: testUsersEnv.TEST_CLIENT_EMAIL,
    fullName: testUsersEnv.TEST_CLIENT_NAME,
    password: testUsersEnv.TEST_CLIENT_PASSWORD,
    role: 'client',
  });

  console.info(`Validation users ready: ${admin.email} (admin), ${client.email} (client)`);
  console.info('Passwords were read from the environment and were not logged.');
} finally {
  await database.close();
}
