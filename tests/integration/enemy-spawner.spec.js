import { test, expect } from '@playwright/test';
import { gotoAndStart } from '../helpers/start-game.js';

test('enemies spawn into the game state after a short wait', async ({ page }) => {
  await gotoAndStart(page);
  await page.waitForTimeout(1000);

  const count = await page.evaluate(() => window.__gameState.enemies.length);
  expect(count).toBeGreaterThan(0);
});

test('enemies spawn at varying x positions over time', async ({ page }) => {
  await gotoAndStart(page);
  await page.waitForTimeout(3000);

  const xs = await page.evaluate(() => window.__gameState.enemies.map((e) => e.x));
  expect(xs.length).toBeGreaterThan(1);
  const uniqueXs = new Set(xs.map((x) => Math.round(x)));
  expect(uniqueXs.size).toBeGreaterThan(1);
});

test('enemies present at any sampled moment stay within the expected vertical range', async ({ page }) => {
  await gotoAndStart(page);
  await page.waitForTimeout(2000);

  const { enemies, gameHeight } = await page.evaluate(() => ({
    enemies: window.__gameState.enemies,
    gameHeight: document.getElementById('game').height,
  }));

  for (const enemy of enemies) {
    expect(enemy.y).toBeGreaterThanOrEqual(-enemy.radius);
    expect(enemy.y - enemy.radius).toBeLessThanOrEqual(gameHeight);
  }
});
