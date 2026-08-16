import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mockPortal, seedPortalSession, signInThroughUi } from './auth-fixtures';

const expectAccessible = async (page: Parameters<typeof AxeBuilder>[0]['page']) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
};

test('anonymous users are redirected and password recovery does not disclose accounts', async ({
  page,
}) => {
  await mockPortal(page, 'client');
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/esqueci-a-senha');
  await page.getByLabel('E-mail').fill('pessoa@example.com');
  await page.getByRole('button', { name: 'Enviar link' }).click();
  await expect(page.getByText(/se o e-mail estiver cadastrado/i)).toBeVisible();
});

test('client login opens an isolated dashboard with consultations and documents', async ({
  page,
}) => {
  await mockPortal(page, 'client');
  await signInThroughUi(page);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /olá, ana/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Leitura de mapa natal' }).first()).toBeVisible();
  await expect(page.getByText('Mapa natal.pdf')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Clientes' })).toHaveCount(0);
  await expectAccessible(page);
});

test('admin aal1 is sent to MFA', async ({ page }) => {
  await mockPortal(page, 'admin', 'aal1');
  await seedPortalSession(page, 'admin', 'aal1');
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/mfa$/);
  await expect(page.getByRole('heading', { name: /verificação em duas etapas/i })).toBeVisible();
});

test('admin aal2 can invite a client', async ({ page }) => {
  await mockPortal(page, 'admin', 'aal2');
  await seedPortalSession(page, 'admin', 'aal2');
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
  await page.getByLabel('Nome').fill('Nova Cliente');
  await page.getByLabel('E-mail').fill('nova@example.com');
  await page.getByRole('button', { name: 'Enviar convite' }).click();
  await expect(page.getByText('Convite enviado.')).toBeVisible();
  await expectAccessible(page);
});
