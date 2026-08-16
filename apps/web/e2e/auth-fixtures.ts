import type { Page, Route } from '@playwright/test';

type Role = 'client' | 'admin';
type Assurance = 'aal1' | 'aal2';

const ids = {
  client: '10000000-0000-4000-8000-000000000001',
  admin: '10000000-0000-4000-8000-000000000003',
};

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

const token = (role: Role, aal: Assurance) =>
  `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: ids[role], role: 'authenticated', aal, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.${encode('signature')}`;

const profileFor = (role: Role) => ({
  id: ids[role],
  email: role === 'admin' ? 'admin@example.com' : 'ana@example.com',
  fullName: role === 'admin' ? 'Juliana Admin' : 'Ana Cliente',
  role,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const sessionFor = (role: Role, aal: Assurance) => {
  const profile = profileFor(role);
  return {
    access_token: token(role, aal),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: `refresh-${role}`,
    user: {
      id: profile.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: profile.email,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      identities: [],
      factors: [],
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
    },
  };
};

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

export const mockPortal = async (page: Page, role: Role, aal: Assurance = 'aal1') => {
  const profile = profileFor(role);
  const session = sessionFor(role, aal);

  await page.route('**/auth/v1/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/token')) {
      await json(route, session);
      return;
    }
    if (url.pathname.endsWith('/recover')) {
      await json(route, {});
      return;
    }
    if (url.pathname.endsWith('/user')) {
      await json(route, session.user);
      return;
    }
    if (url.pathname.endsWith('/logout')) {
      await json(route, {});
      return;
    }
    if (url.pathname.endsWith('/factors') && route.request().method() === 'POST') {
      await json(route, {
        id: 'factor-1',
        type: 'totp',
        totp: { qr_code: 'data:image/svg+xml;base64,PHN2Zy8+', secret: 'SECRET' },
      });
      return;
    }
    await json(route, {});
  });

  await page.route('http://127.0.0.1:3333/**', async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (url.pathname === '/me') {
      await json(route, profile);
      return;
    }
    if (url.pathname === '/consultations') {
      await json(route, [
        {
          id: '30000000-0000-4000-8000-000000000001',
          userId: ids.client,
          title: 'Leitura de mapa natal',
          scheduledAt: '2027-02-12T14:00:00.000Z',
          status: 'scheduled',
          summary: 'Preparação para o novo ciclo.',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
      return;
    }
    if (url.pathname === '/documents') {
      await json(route, [
        {
          id: '20000000-0000-4000-8000-000000000001',
          userId: ids.client,
          consultationId: null,
          displayName: 'Mapa natal.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 250000,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
      return;
    }
    if (url.pathname === '/admin/users' && method === 'GET') {
      await json(route, { items: [profileFor('client')], total: 1 });
      return;
    }
    if (url.pathname === '/admin/users/invite' && method === 'POST') {
      const input = route.request().postDataJSON();
      await json(route, { ...profileFor('client'), ...input, status: 'invited' }, 201);
      return;
    }
    if (url.pathname === '/admin/consultations') {
      await json(route, []);
      return;
    }
    await json(route, { message: 'Rota simulada não encontrada', statusCode: 404 }, 404);
  });
};

export const seedPortalSession = async (page: Page, role: Role, aal: Assurance = 'aal1') => {
  await page.addInitScript(
    (session) => {
      localStorage.setItem('sb-127-auth-token', JSON.stringify(session));
    },
    sessionFor(role, aal),
  );
};

export const signInThroughUi = async (page: Page) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('user@example.com');
  await page.getByLabel('Senha').fill('senha-segura');
  await page.getByRole('button', { name: 'Entrar' }).click();
};
