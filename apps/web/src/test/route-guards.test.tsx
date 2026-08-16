import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminRoute } from '../components/AdminRoute';
import { ProtectedRoute } from '../components/ProtectedRoute';

const { useAuth, getAssuranceLevel } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  getAssuranceLevel: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({ useAuth }));
vi.mock('../services/auth', () => ({ getAssuranceLevel }));

const profile = {
  id: '10000000-0000-4000-8000-000000000001',
  email: 'ana@example.com',
  fullName: 'Ana Cliente',
  role: 'client',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const renderProtected = (admin = false) =>
  render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route path="/login" element={<p>Login</p>} />
        <Route path="/dashboard" element={<p>Dashboard</p>} />
        <Route element={<ProtectedRoute admin={admin} />}>
          <Route path="/private" element={<p>Private</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('route authorization matrix', () => {
  beforeEach(() => vi.clearAllMocks());

  it('redirects anonymous users to login', () => {
    useAuth.mockReturnValue({ session: null, profile: null, loading: false });
    renderProtected();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('allows clients in private routes but not in admin routes', () => {
    useAuth.mockReturnValue({ session: {}, profile, loading: false });
    const view = renderProtected();
    expect(screen.getByText('Private')).toBeInTheDocument();
    view.unmount();
    renderProtected(true);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('requires aal2 before rendering an administrative route', async () => {
    getAssuranceLevel.mockResolvedValue({ currentLevel: 'aal1' });
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/mfa" element={<p>MFA</p>} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<p>Admin</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('MFA')).toBeInTheDocument());
  });

  it('renders the admin route at aal2', async () => {
    getAssuranceLevel.mockResolvedValue({ currentLevel: 'aal2' });
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<p>Admin</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Admin')).toBeInTheDocument());
  });
});
