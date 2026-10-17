import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import fixture from '../../../packages/contracts/test/fixtures/helena-j2000.json' with { type: 'json' };
import { mockPortal, seedPortalSession } from './auth-fixtures';

test.beforeEach(async ({ page }, info) => {
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 375, height: 812 });
});

test('HELENA is unavailable to clients and requires admin MFA', async ({ page }) => {
  await mockPortal(page, 'client');
  await seedPortalSession(page, 'client');
  await page.goto('/admin/helena');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('link', { name: 'HELENA' })).toHaveCount(0);
});

test('HELENA redirects an admin without MFA', async ({ page }) => {
  await mockPortal(page, 'admin', 'aal1');
  await seedPortalSession(page, 'admin', 'aal1');
  await page.goto('/admin/helena');
  await expect(page).toHaveURL(/\/mfa$/);
});

test('admin calculates a synthetic chart and edits safely', async ({ page }, info) => {
  await mockPortal(page, 'admin', 'aal2');
  await seedPortalSession(page, 'admin', 'aal2');
  let attempts = 0;
  await page.route('**/admin/helena/natal', async (route) => {
    expect(route.request().postDataJSON()).not.toHaveProperty('subjectName');
    if (++attempts === 1) {
      await route.fulfill({
        status: 503,
        json: { message: 'O motor da HELENA está temporariamente indisponível', statusCode: 503 },
      });
      return;
    }
    await route.fulfill({ json: fixture });
  });
  await page.goto('/admin/helena');
  await expect(page.getByRole('heading', { name: 'HELENA', exact: true })).toBeVisible();
  await page.getByLabel('Nome do mapa').fill('Mapa sintético');
  await page.getByLabel('Data de nascimento').fill('2000-01-01');
  await page.getByLabel('Hora local de nascimento').fill('12:00:00');
  await page.getByLabel('Deslocamento UTC (minutos)').fill('0');
  await page.getByLabel('Latitude', { exact: true }).fill('-23.5505');
  await page.getByLabel('Longitude', { exact: true }).fill('-46.6333');
  await page.getByRole('button', { name: 'Calcular mapa natal' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'O motor da HELENA está temporariamente indisponível',
  );
  await page.getByRole('button', { name: 'Calcular mapa natal' }).click();
  await expect(page.getByRole('heading', { name: 'Posições planetárias' })).toBeVisible();
  await expect(page.getByRole('img', { name: /mandala natal/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportar JSON' })).toBeEnabled();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar JSON' }).click();
  const download = await downloading;
  const downloadedPath = await download.path();
  expect(download.suggestedFilename()).toBe('helena-2000-01-01.json');
  expect(JSON.parse(await readFile(downloadedPath!, 'utf8'))).toEqual({
    tool: 'HELENA',
    name: 'Mapa sintético',
    chart: fixture,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: info.outputPath('helena.png'), fullPage: true });
  await page.getByLabel('Longitude', { exact: true }).fill('-47');
  await expect(page.getByRole('heading', { name: 'Posições planetárias' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Exportar JSON' })).toHaveCount(0);
});
