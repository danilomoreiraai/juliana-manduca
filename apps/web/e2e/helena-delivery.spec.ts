import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import fixture from '../../../packages/contracts/test/fixtures/helena-j2000.json' with { type: 'json' };
import { mockPortal, seedPortalSession } from './auth-fixtures';

test('admin saves, reopens, reviews and publishes a HELENA report', async ({ page }, info) => {
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 375, height: 812 });
  await mockPortal(page, 'admin', 'aal2');
  await seedPortalSession(page, 'admin', 'aal2');
  let saved: Record<string, unknown> | null = null;
  let report: Record<string, unknown> | null = null;
  let published = 0;
  const clientId = '10000000-0000-4000-8000-000000000001';
  const reportId = '80000000-0000-4000-8000-000000000001';
  await page.route('http://127.0.0.1:3333/admin/helena/**', async (route) => {
    const url = new URL(route.request().url()),
      method = route.request().method();
    if (url.pathname.endsWith('/natal')) {
      await route.fulfill({ json: fixture });
      return;
    }
    if (url.pathname.endsWith('/charts') && method === 'GET') {
      const items = saved ? [{ ...saved, analysis: undefined, result: undefined, report }] : [];
      await route.fulfill({ json: { items, total: items.length } });
      return;
    }
    if (url.pathname.endsWith('/charts') && method === 'POST') {
      const body = route.request().postDataJSON();
      expect(body).not.toHaveProperty('result');
      saved = {
        id: body.id,
        clientId,
        subjectName: body.subjectName,
        title: body.title,
        analysis: body.analysis,
        revision: 1,
        result: fixture,
        report: null,
        createdAt: '2026-01-01T12:00:00Z',
        updatedAt: '2026-01-01T12:00:00Z',
      };
      await route.fulfill({ status: 201, json: saved });
      return;
    }
    if (url.pathname.endsWith('/preview')) {
      report = { id: reportId, revision: 1, documentId: null, publishedAt: null };
      await route.fulfill({
        json: {
          reportId,
          revision: 1,
          expiresIn: 300,
          url: 'http://127.0.0.1:4173/synthetic-helena-review',
        },
      });
      return;
    }
    if (url.pathname.endsWith('/publish')) {
      expect(route.request().postDataJSON()).toEqual({ reportId, revision: 1 });
      published++;
      report = {
        id: reportId,
        revision: 1,
        documentId: '20000000-0000-4000-8000-000000000009',
        publishedAt: '2026-01-01T12:00:00Z',
      };
      await route.fulfill({ json: { documentId: report.documentId, revision: 1 } });
      return;
    }
    await route.fulfill({ json: { ...saved, report } });
  });
  await page.goto('/admin/helena');
  await page.getByLabel('Nome do mapa').fill('João sintético');
  await page.getByLabel('Data de nascimento').fill('2000-01-01');
  await page.getByLabel('Hora local de nascimento').fill('12:00:00');
  await page.getByLabel('Deslocamento UTC (minutos)').fill('0');
  await page.getByLabel('Latitude', { exact: true }).fill('-23.5505');
  await page.getByLabel('Longitude', { exact: true }).fill('-46.6333');
  await page.getByRole('button', { name: 'Calcular mapa natal' }).click();
  await expect(page.getByRole('heading', { name: 'Posições planetárias' })).toBeVisible();
  await page.getByLabel('Cliente destinatário').selectOption(clientId);
  await page.getByLabel('Título do material').fill('Mapa natal revisado');
  await page.getByLabel('Análise para o cliente').fill('Análise sintética para revisão.');
  await page.getByRole('button', { name: 'Salvar mapa' }).click();
  await expect(page.getByText('Versão salva: 1', { exact: true })).toBeVisible();
  await page.getByText('Mapas salvos', { exact: true }).click();
  await page.getByRole('button', { name: 'Abrir Mapa natal revisado' }).click();
  await expect(page.getByLabel('Análise para o cliente')).toHaveValue(
    'Análise sintética para revisão.',
  );
  await page.getByRole('button', { name: 'Gerar PDF para revisão' }).click();
  const link = page.getByRole('link', { name: 'Abrir PDF para revisão' });
  await expect(link).toBeVisible();
  await expect(page.getByRole('checkbox')).toBeDisabled();
  const popupPromise = page.waitForEvent('popup');
  await link.click();
  const popup = await popupPromise;
  await popup.close();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Liberar para o cliente' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Material disponível' })).toBeVisible();
  expect(published).toBe(1);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: info.outputPath('helena-delivery.png'), fullPage: true });
});
