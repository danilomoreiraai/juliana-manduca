import { expect, test } from '@playwright/test';

test('public landing page and 404 are usable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /entender seus ciclos/i })).toBeVisible();
  await expect(
    page.getByRole('link', { name: /área do cliente/i, includeHidden: true }).first(),
  ).toHaveAttribute('href', '/login');
  await expect(page.locator('[src*="juliana-atlantic"]')).toHaveCount(0);
  await page.goto('/pagina-inexistente');
  await expect(page.getByRole('heading', { name: /constelação não existe/i })).toBeVisible();
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
