import { test, expect } from '@playwright/test';
import { gotoAndStart } from '../helpers/start-game.js';

test('starts with an empty bullets array before any input', async ({ page }) => {
  await gotoAndStart(page);
  const bullets = await page.evaluate(() => window.__gameState.bullets);
  expect(Array.isArray(bullets)).toBe(true);
  expect(bullets).toHaveLength(0);
});

test('a single simulated Space press spawns exactly one bullet with the expected shape', async ({ page }) => {
  await gotoAndStart(page);

  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })));
  await page.waitForTimeout(50);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' })));
  await page.waitForTimeout(50);

  const bullets = await page.evaluate(() => window.__gameState.bullets);
  expect(bullets).toHaveLength(1);
  expect(bullets[0]).toHaveProperty('x');
  expect(bullets[0]).toHaveProperty('y');
  expect(bullets[0]).toHaveProperty('width');
  expect(bullets[0]).toHaveProperty('height');
  expect(bullets[0]).toHaveProperty('speed');
});

test('a newly spawned bullet is actually drawn on the canvas', async ({ page }) => {
  await gotoAndStart(page);

  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })));
  await page.waitForTimeout(50);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' })));
  await page.waitForTimeout(50);

  const pixel = await page.evaluate(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const bullet = window.__gameState.bullets[0];
    const x = Math.floor(bullet.x + bullet.width / 2);
    const y = Math.floor(bullet.y + bullet.height / 2);
    return Array.from(ctx.getImageData(x, y, 1, 1).data);
  });

  expect(pixel).not.toEqual([0, 0, 0, 255]);
});
