import type {
  InviteUserInput,
  Profile,
  UpdateProfileInput,
  UpdateUserStatusInput,
} from '@juliana/contracts';
import { and, asc, count, eq, ilike, or } from 'drizzle-orm';
import { auditEvents, profiles } from '../db/schema.js';
import { AppError, notFound } from '../lib/errors.js';
import type { AppServices, AuthenticatedUser } from '../types.js';

const toProfile = (row: typeof profiles.$inferSelect): Profile => ({
  id: row.id,
  email: row.email,
  fullName: row.fullName,
  role: row.role,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const getMe = (user: AuthenticatedUser) => user;

export const updateMe = async (
  services: AppServices,
  user: AuthenticatedUser,
  input: UpdateProfileInput,
) => {
  const [profile] = await services.db
    .update(profiles)
    .set({ fullName: input.fullName, status: 'active', updatedAt: new Date() })
    .where(eq(profiles.id, user.id))
    .returning();
  if (!profile) throw notFound('Perfil não encontrado');
  return toProfile(profile);
};

export const listUsers = async (
  services: AppServices,
  input: { search?: string; limit: number; offset: number },
) => {
  const filter = input.search
    ? or(ilike(profiles.fullName, `%${input.search}%`), ilike(profiles.email, `%${input.search}%`))
    : undefined;
  const rows = await services.db
    .select()
    .from(profiles)
    .where(and(eq(profiles.role, 'client'), filter))
    .orderBy(asc(profiles.fullName))
    .limit(input.limit)
    .offset(input.offset);
  const [{ total = 0 } = {}] = await services.db
    .select({ total: count() })
    .from(profiles)
    .where(and(eq(profiles.role, 'client'), filter));
  return { items: rows.map(toProfile), total };
};

export const inviteUser = async (
  services: AppServices,
  actor: AuthenticatedUser,
  input: InviteUserInput,
) => {
  const { data, error } = await services.supabase.admin.auth.admin.inviteUserByEmail(input.email, {
    data: { full_name: input.fullName },
    redirectTo: `${services.env.WEB_URL}/auth/callback`,
  });
  if (error || !data.user) {
    if (error?.message.toLowerCase().includes('already')) {
      throw new AppError('Este e-mail já está cadastrado', 409);
    }
    throw new AppError('Não foi possível enviar o convite', 502);
  }

  try {
    const [profile] = await services.db.transaction(async (tx) => {
      const created = await tx
        .insert(profiles)
        .values({ id: data.user.id, email: input.email, fullName: input.fullName })
        .returning();
      await tx.insert(auditEvents).values({
        actorId: actor.id,
        action: 'user.invited',
        entityType: 'profile',
        entityId: data.user.id,
        metadata: { email: input.email },
      });
      return created;
    });
    if (!profile) throw new Error('Profile was not created');
    return toProfile(profile);
  } catch (databaseError) {
    await services.supabase.admin.auth.admin.deleteUser(data.user.id);
    throw databaseError;
  }
};

export const updateUserStatus = async (
  services: AppServices,
  actor: AuthenticatedUser,
  userId: string,
  input: UpdateUserStatusInput,
) => {
  const profile = await services.db.transaction(async (tx) => {
    const updated = await tx
      .update(profiles)
      .set({ status: input.status, updatedAt: new Date() })
      .where(and(eq(profiles.id, userId), eq(profiles.role, 'client')))
      .returning();
    if (!updated[0]) throw notFound('Cliente não encontrado');
    await tx.insert(auditEvents).values({
      actorId: actor.id,
      action: 'user.status_changed',
      entityType: 'profile',
      entityId: userId,
      metadata: { status: input.status },
    });
    return updated[0];
  });
  return toProfile(profile);
};
