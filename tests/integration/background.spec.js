import { test, expect } from '@playwright/test';

test('exposes a background state object with a scroll position', async ({ page }) => {
  await page.goto('/');
  const background = await page.evaluate(() => window.__gameState.background);
  expect(background).toHaveProperty('scrollY');
  expect(background).toHaveProperty('planets');
  expect(Array.isArray(background.planets)).toBe(true);
});

test('the background scroll position advances over time without throwing', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err));

  await page.goto('/');
  const first = await page.evaluate(() => window.__gameState.background.scrollY);
  await page.waitForTimeout(300);
  const second = await page.evaluate(() => window.__gameState.background.scrollY);

  expect(second).not.toBe(first);
  expect(errors).toHaveLength(0);
});
