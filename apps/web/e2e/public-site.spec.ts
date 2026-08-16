import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('public landing page and 404 are usable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /entender seus ciclos/i })).toBeVisible();
  await expect(
    page.getByRole('link', { name: /área do cliente/i, includeHidden: true }).first(),
  ).toHaveAttribute('href', '/login');
  await expect(page.locator('[src*="juliana-atlantic"]')).toHaveCount(0);
  await expect(page.getByRole('img', { name: /instrumento celeste abstrato/i })).toBeVisible();
  await page.goto('/pagina-inexistente');
  await expect(page.getByRole('heading', { name: /constelação não existe/i })).toBeVisible();
});

test('reduced motion keeps the primary experience available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /entender seus ciclos/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /conhecer atendimentos/i })).toBeVisible();
});

test('mobile navigation opens without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: /abrir menu/i }).click();
  await expect(page.getByRole('navigation', { name: /navegação móvel/i })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('public pages have no automatically detectable accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /entender seus ciclos/i })).toBeVisible();
  const home = await new AxeBuilder({ page }).analyze();
  expect(home.violations).toEqual([]);

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /boas-vindas/i })).toBeVisible();
  const login = await new AxeBuilder({ page }).analyze();
  expect(login.violations).toEqual([]);
});

test('375 px home layout matches the approved visual baseline', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /entender seus ciclos/i })).toBeVisible();
  const heroImage = page.getByRole('img', { name: /instrumento celeste abstrato/i });
  await expect
    .poll(() => heroImage.evaluate((image: HTMLImageElement) => image.complete))
    .toBe(true);
  await expect(page).toHaveScreenshot('home-375.png', {
    animations: 'disabled',
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
});
