import { test, expect } from '@playwright/test';

test('all declared sprite/audio assets resolve with a 200 response', async ({ page }) => {
  const failedAssetRequests = [];
  page.on('response', (response) => {
    if (response.url().includes('/assets/') && response.status() >= 400) {
      failedAssetRequests.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => window.Assets.isReady()), { timeout: 2000 })
    .toBe(true);

  expect(failedAssetRequests).toEqual([]);
});

test('the player, enemy, and bullet sprites are usable after loading', async ({ page }) => {
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => window.Assets.isReady()), { timeout: 2000 })
    .toBe(true);

  const usable = await page.evaluate(() => ({
    playerShip: window.Assets.isImageUsable('playerShip'),
    enemyShip: window.Assets.isImageUsable('enemyShip'),
    bullet: window.Assets.isImageUsable('bullet'),
    background: window.Assets.isImageUsable('background'),
  }));

  expect(usable).toEqual({ playerShip: true, enemyShip: true, bullet: true, background: true });
});
