import { describe, expect, it, vi } from 'vitest';
import { provisionUser } from '../src/functions/provision-user.js';

const createServices = (existingUserId?: string) => {
  const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
  const values = vi.fn(() => ({ onConflictDoUpdate }));
  const insert = vi.fn(() => ({ values }));
  const listUsers = vi.fn().mockResolvedValue({
    data: {
      users: existingUserId ? [{ id: existingUserId, email: 'admin@example.com' }] : [],
      nextPage: null,
    },
    error: null,
  });
  const createUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'created-user', email: 'admin@example.com' } },
    error: null,
  });
  const updateUserById = vi.fn().mockResolvedValue({
    data: { user: { id: existingUserId, email: 'admin@example.com' } },
    error: null,
  });

  return {
    calls: { createUser, insert, listUsers, onConflictDoUpdate, updateUserById, values },
    services: {
      db: { insert },
      supabase: { admin: { auth: { admin: { createUser, listUsers, updateUserById } } } },
    } as never,
  };
};

describe('provisionUser', () => {
  it('creates and activates a new user without persisting the password in the profile', async () => {
    const { calls, services } = createServices();

    const result = await provisionUser(services, {
      email: ' Admin@Example.com ',
      fullName: 'Admin Validação',
      password: 'temporary-password',
      role: 'admin',
    });

    expect(calls.createUser).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'temporary-password',
      email_confirm: true,
    });
    expect(calls.values).toHaveBeenCalledWith({
      id: 'created-user',
      email: 'admin@example.com',
      fullName: 'Admin Validação',
      role: 'admin',
      status: 'active',
    });
    expect(calls.values.mock.calls[0]?.[0]).not.toHaveProperty('password');
    expect(result).toEqual({ email: 'admin@example.com', id: 'created-user', role: 'admin' });
  });

  it('updates an existing auth user and upserts its profile', async () => {
    const { calls, services } = createServices('existing-user');

    await provisionUser(services, {
      email: 'admin@example.com',
      fullName: 'Admin Validação',
      password: 'rotated-password',
      role: 'admin',
    });

    expect(calls.createUser).not.toHaveBeenCalled();
    expect(calls.updateUserById).toHaveBeenCalledWith('existing-user', {
      email: 'admin@example.com',
      password: 'rotated-password',
      email_confirm: true,
    });
    expect(calls.onConflictDoUpdate).toHaveBeenCalledOnce();
  });
});
