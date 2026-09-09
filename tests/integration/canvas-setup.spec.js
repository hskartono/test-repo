import { test, expect } from '@playwright/test';

test('creates a canvas with the fixed internal resolution', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas#game');
  await expect(canvas).toHaveAttribute('width', '480');
  await expect(canvas).toHaveAttribute('height', '640');
});

test('exposes a game state object matching the expected shape', async ({ page }) => {
  await page.goto('/');
  const state = await page.evaluate(() => window.__gameState);
  expect(state).toHaveProperty('running', true);
  expect(state).toHaveProperty('lastTimestamp');
});

test('resizing the window updates the canvas CSS size without throwing', async ({ page }) => {
  await page.goto('/');
  const errors = [];
  page.on('pageerror', (err) => errors.push(err));

  await page.setViewportSize({ width: 800, height: 600 });
  await page.waitForTimeout(50);

  const style = await page.evaluate(() => {
    const canvas = document.getElementById('game');
    return { width: canvas.style.width, height: canvas.style.height };
  });

  expect(style.width).not.toBe('');
  expect(style.height).not.toBe('');
  expect(errors).toHaveLength(0);
});
