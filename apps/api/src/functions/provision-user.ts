import type { User } from '@supabase/supabase-js';
import { profiles } from '../db/schema.js';
import type { AppServices } from '../types.js';

export interface ProvisionUserInput {
  email: string;
  fullName: string;
  password: string;
  role: 'admin' | 'client';
}

const findAuthUserByEmail = async (
  admin: AppServices['supabase']['admin']['auth']['admin'],
  email: string,
): Promise<User | null> => {
  const normalizedEmail = email.toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail);
    if (user) return user;
    if (!data.nextPage) return null;

    page = data.nextPage;
  }
};

const ensureAuthUser = async (services: AppServices, input: ProvisionUserInput): Promise<User> => {
  const admin = services.supabase.admin.auth.admin;
  const existingUser = await findAuthUserByEmail(admin, input.email);
  const attributes = {
    email: input.email,
    password: input.password,
    email_confirm: true,
  };
  const result = existingUser
    ? await admin.updateUserById(existingUser.id, attributes)
    : await admin.createUser(attributes);

  if (result.error || !result.data.user) {
    throw result.error ?? new Error(`Auth user was not provisioned: ${input.email}`);
  }

  return result.data.user;
};

export const provisionUser = async (services: AppServices, input: ProvisionUserInput) => {
  const normalizedInput = { ...input, email: input.email.trim().toLowerCase() };
  const user = await ensureAuthUser(services, normalizedInput);

  await services.db
    .insert(profiles)
    .values({
      id: user.id,
      email: normalizedInput.email,
      fullName: normalizedInput.fullName,
      role: normalizedInput.role,
      status: 'active',
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        email: normalizedInput.email,
        fullName: normalizedInput.fullName,
        role: normalizedInput.role,
        status: 'active',
        updatedAt: new Date(),
      },
    });

  return { email: normalizedInput.email, id: user.id, role: normalizedInput.role };
};
