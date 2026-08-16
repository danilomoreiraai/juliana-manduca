import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  readDemoSession: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock('../config', () => ({
  config: {
    demoMode: true,
    demoAdminEmail: 'teste@teste.com',
    demoClientEmail: 'usuario@teste.com',
    demoPassword: '1q2w3e4r',
    demoMfaCode: '123456',
  },
}));
vi.mock('../services/demo', () => ({
  DEMO_AUTH_EVENT: 'juliana-demo-auth',
  readDemoSession: mocks.readDemoSession,
}));
vi.mock('../services/portal', () => ({ getProfile: mocks.getProfile }));
vi.mock('../services/auth', () => ({
  getAssuranceLevel: vi.fn(),
  signIn: mocks.signIn,
}));
vi.mock('../lib/supabase', () => ({ supabase: { auth: {} } }));

import { AuthProvider, useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';

const profile = {
  id: '10000000-0000-4000-8000-000000000002',
  email: 'usuario@teste.com',
  fullName: 'Cliente Validação',
  role: 'client' as const,
  status: 'active' as const,
  createdAt: '2026-08-16T12:00:00.000Z',
  updatedAt: '2026-08-16T12:00:00.000Z',
};
const session = { access_token: 'demo', user: { email: profile.email } };

const AuthProbe = () => {
  const auth = useAuth();
  return <p>{auth.loading ? 'carregando' : (auth.profile?.email ?? 'sem sessão')}</p>;
};

describe('demo authentication UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readDemoSession.mockReturnValue(session);
    mocks.getProfile.mockResolvedValue(profile);
  });

  it('hydrates and clears the local demo session through the auth event', async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText('usuario@teste.com')).toBeInTheDocument();

    mocks.readDemoSession.mockReturnValue(null);
    window.dispatchEvent(new Event('juliana-demo-auth'));
    await waitFor(() => expect(screen.getByText('sem sessão')).toBeInTheDocument());
  });

  it('shows the configured local credentials on the login screen', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByText('Ambiente de demonstração')).toBeInTheDocument();
    expect(screen.getByText('Admin: teste@teste.com')).toBeInTheDocument();
    expect(screen.getByText('Cliente: usuario@teste.com')).toBeInTheDocument();
    expect(screen.getByText('Senha temporária: 1q2w3e4r')).toBeInTheDocument();
    expect(screen.getByText('MFA do admin: 123456')).toBeInTheDocument();
    await waitFor(() => expect(mocks.getProfile).toHaveBeenCalled());
  });
});
