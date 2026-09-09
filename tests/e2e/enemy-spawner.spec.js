import { test, expect } from '@playwright/test';

test('enemies fall down the screen over time', async ({ page }) => {
  await page.goto('/');
  // Wait past one spawn interval (800ms) so an enemy is guaranteed to exist.
  await page.waitForTimeout(900);

  const before = await page.evaluate(() => window.__gameState.enemies[0]?.y);
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.__gameState.enemies[0]?.y);

  expect(before).not.toBeUndefined();
  expect(after).toBeGreaterThan(before);
});

test('enemy count stabilizes rather than growing unboundedly', async ({ page }) => {
  await page.goto('/');

  // Enemies fall for ~5.5s (640px / 120px/s, plus radius) and spawn every
  // 0.8s. During that first ~5.5s, count naturally ramps up from 0 as no
  // enemy has had time to fall off-screen yet - that's expected, not a leak.
  // Wait past that ramp-up window before asserting steady-state behavior.
  await page.waitForTimeout(6500);
  const countAtWarm = await page.evaluate(() => window.__gameState.enemies.length);

  await page.waitForTimeout(3000);
  const countLater = await page.evaluate(() => window.__gameState.enemies.length);

  await page.waitForTimeout(3000);
  const countLatest = await page.evaluate(() => window.__gameState.enemies.length);

  // Steady-state count should hover around lifetime/interval (~6-7) rather
  // than climbing indefinitely. Allow generous slack for timing jitter while
  // still catching real unbounded growth.
  expect(countAtWarm).toBeLessThanOrEqual(15);
  expect(countLater).toBeLessThanOrEqual(15);
  expect(countLatest).toBeLessThanOrEqual(15);
  expect(countLatest).toBeLessThanOrEqual(countAtWarm + 4);
});

test('no console errors or page errors occur while enemies are active', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err));

  await page.goto('/');
  await page.waitForTimeout(2000);

  expect(consoleErrors).toHaveLength(0);
  expect(pageErrors).toHaveLength(0);
});
