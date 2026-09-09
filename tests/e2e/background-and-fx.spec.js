import { test, expect } from '@playwright/test';
import { gotoAndStart } from '../helpers/start-game.js';

async function fireOnce(page) {
  await page.keyboard.down('Space');
  await page.waitForTimeout(50);
  await page.keyboard.up('Space');
}

test('the background scrolls continuously during play', async ({ page }) => {
  await gotoAndStart(page);

  const readings = [];
  for (let i = 0; i < 3; i += 1) {
    readings.push(await page.evaluate(() => window.__gameState.background.scrollY));
    await page.waitForTimeout(150);
  }

  expect(readings[1]).not.toBe(readings[0]);
  expect(readings[2]).not.toBe(readings[1]);
});

test('a planet eventually scrolls through and later leaves the screen', async ({ page }) => {
  await gotoAndStart(page);

  // Force a spawn almost immediately instead of waiting out the real 8-15s
  // window. The spawner already picked and cached its first interval (from
  // the real 8-15s range) on the very first frame after page load, so the
  // MIN/MAX override alone wouldn't affect it until after a spawn already
  // happened - also override the cached value directly to unblock the first one.
  await page.evaluate(() => {
    window.Background.PLANET_MIN_INTERVAL_MS = 50;
    window.Background.PLANET_MAX_INTERVAL_MS = 80;
    window.__gameState.background.nextPlanetIntervalMs = 50;
  });

  await expect
    .poll(() => page.evaluate(() => window.__gameState.background.planets.length), { timeout: 2000 })
    .toBeGreaterThan(0);

  // Stop further spawns and speed up travel so the existing planet(s) clear
  // the bottom edge quickly instead of taking the real ~35s at normal speed.
  await page.evaluate(() => {
    window.Background.PLANET_MIN_INTERVAL_MS = 999999;
    window.Background.PLANET_MAX_INTERVAL_MS = 999999;
    window.Background.PLANET_SPEED = 4000;
  });

  await expect
    .poll(() => page.evaluate(() => window.__gameState.background.planets.length), { timeout: 2000 })
    .toBe(0);
});

test('firing plays the shoot sound and a kill plays the explosion sound', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await gotoAndStart(page);

  const player = await page.evaluate(() => window.__gameState.player);
  const enemyX = player.x + player.width / 2;
  await page.evaluate((x) => {
    window.__gameState.enemies = [{ x, y: 300, radius: 15 }];
  }, enemyX);

  await fireOnce(page);

  await expect
    .poll(() => page.evaluate(() => window.__gameState.score), { timeout: 2000 })
    .toBe(1);

  const sfxLog = await page.evaluate(() => window.__sfxLog || []);
  expect(sfxLog).toContain('shoot');
  expect(sfxLog).toContain('explosion');
  expect(errors).toEqual([]);
});
