import { test, expect } from '@playwright/test';

test('an overlapping seeded bullet and enemy are both removed and score increments', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__gameState.bullets = [{ x: 100, y: 100, width: 4, height: 12, speed: 480 }];
    window.__gameState.enemies = [{ x: 100, y: 105, radius: 15 }];
  });
  await page.waitForTimeout(50);

  const state = await page.evaluate(() => ({
    bullets: window.__gameState.bullets,
    enemies: window.__gameState.enemies,
    score: window.__gameState.score,
  }));

  expect(state.bullets).toHaveLength(0);
  expect(state.enemies).toHaveLength(0);
  expect(state.score).toBe(1);
});

test('a non-overlapping seeded bullet and enemy both survive and score is unchanged', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__gameState.bullets = [{ x: 10, y: 300, width: 4, height: 12, speed: 480 }];
    window.__gameState.enemies = [{ x: 400, y: 400, radius: 15 }];
  });
  await page.waitForTimeout(50);

  const state = await page.evaluate(() => ({
    bullets: window.__gameState.bullets,
    enemies: window.__gameState.enemies,
    score: window.__gameState.score,
  }));

  expect(state.bullets).toHaveLength(1);
  expect(state.enemies).toHaveLength(1);
  expect(state.score).toBe(0);
});

test('an enemy overlapping the player is removed without affecting score', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const player = window.__gameState.player;
    window.__gameState.enemies = [{ x: player.x + player.width / 2, y: player.y + player.height / 2, radius: 15 }];
  });
  await page.waitForTimeout(50);

  const state = await page.evaluate(() => ({
    enemies: window.__gameState.enemies,
    score: window.__gameState.score,
  }));

  expect(state.enemies).toHaveLength(0);
  expect(state.score).toBe(0);
});

test('the score overlay is actually drawn on the canvas', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__gameState.bullets = [{ x: 100, y: 100, width: 4, height: 12, speed: 480 }];
    window.__gameState.enemies = [{ x: 100, y: 105, radius: 15 }];
  });
  await page.waitForTimeout(50);

  const pixels = await page.evaluate(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    return Array.from(ctx.getImageData(10, 10, 60, 15).data);
  });

  const hasNonBackgroundPixel = pixels.some((value, index) => index % 4 !== 3 && value !== 0);
  expect(hasNonBackgroundPixel).toBe(true);
});
