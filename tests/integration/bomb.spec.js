import { test, expect } from '@playwright/test';
import { gotoAndStart } from '../helpers/start-game.js';

test('starts with 3 bombs and 0 kill progress before any input', async ({ page }) => {
  await gotoAndStart(page);
  const bomb = await page.evaluate(() => window.__gameState.bomb);
  expect(bomb).toEqual({ count: 3, killProgress: 0 });
});

test('a single simulated KeyB press clears seeded enemies and bullets and decrements the bomb count', async ({ page }) => {
  await gotoAndStart(page);

  await page.evaluate(() => {
    window.__gameState.enemies = [
      { x: 50, y: 50, radius: 15 },
      { x: 300, y: 400, radius: 15 },
    ];
    window.__gameState.bullets = [{ x: 100, y: 100, width: 4, height: 12, speed: 480 }];
  });

  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyB' })));
  await page.waitForTimeout(50);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyB' })));
  await page.waitForTimeout(50);

  const state = await page.evaluate(() => ({
    enemies: window.__gameState.enemies,
    bullets: window.__gameState.bullets,
    bombCount: window.__gameState.bomb.count,
  }));

  expect(state.enemies).toHaveLength(0);
  expect(state.bullets).toHaveLength(0);
  expect(state.bombCount).toBe(2);
});

test('pressing KeyB with 0 bombs available leaves enemies untouched and the count stays 0', async ({ page }) => {
  await gotoAndStart(page);

  await page.evaluate(() => {
    window.__gameState.bomb = { count: 0, killProgress: 0 };
    window.__gameState.enemies = [{ x: 300, y: 400, radius: 15 }];
  });

  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyB' })));
  await page.waitForTimeout(50);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyB' })));
  await page.waitForTimeout(50);

  const state = await page.evaluate(() => ({
    enemies: window.__gameState.enemies,
    bombCount: window.__gameState.bomb.count,
  }));

  expect(state.enemies).toHaveLength(1);
  expect(state.bombCount).toBe(0);
});

test('destroying 10 enemies via bullet hits grants exactly one extra bomb without any KeyB press', async ({ page }) => {
  await gotoAndStart(page);

  await page.evaluate(() => {
    const pairs = Array.from({ length: 10 }, (_, i) => ({
      bullet: { x: 20 + i * 40, y: 100, width: 4, height: 12, speed: 480 },
      enemy: { x: 20 + i * 40, y: 105, radius: 15 },
    }));
    window.__gameState.bullets = pairs.map((p) => p.bullet);
    window.__gameState.enemies = pairs.map((p) => p.enemy);
  });

  await expect
    .poll(() => page.evaluate(() => window.__gameState.bomb.count), { timeout: 2000 })
    .toBe(4);
});

test('destroying enemies with a bomb does not change the score', async ({ page }) => {
  await gotoAndStart(page);

  await page.evaluate(() => {
    window.__gameState.score = 7;
    window.__gameState.enemies = [{ x: 50, y: 50, radius: 15 }];
  });

  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyB' })));
  await page.waitForTimeout(50);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyB' })));
  await page.waitForTimeout(50);

  const state = await page.evaluate(() => ({
    score: window.__gameState.score,
    enemies: window.__gameState.enemies,
  }));

  expect(state.enemies).toHaveLength(0);
  expect(state.score).toBe(7);
});

test('the Bombs HUD text is actually drawn on the canvas and changes after a bomb is used', async ({ page }) => {
  await gotoAndStart(page);
  await page.waitForTimeout(50);

  const beforePixels = await page.evaluate(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    return Array.from(ctx.getImageData(10, 58, 80, 15).data);
  });

  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyB' })));
  await page.waitForTimeout(50);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyB' })));
  await page.waitForTimeout(50);

  const afterPixels = await page.evaluate(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    return Array.from(ctx.getImageData(10, 58, 80, 15).data);
  });

  const hasNonBackgroundPixel = beforePixels.some((value, index) => index % 4 !== 3 && value !== 0);
  expect(hasNonBackgroundPixel).toBe(true);
  expect(afterPixels).not.toEqual(beforePixels);
});
