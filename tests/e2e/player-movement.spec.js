import { test, expect } from '@playwright/test';

async function getPlayer(page) {
  return page.evaluate(() => window.__gameState.player);
}

test('holding ArrowRight moves the ship right, releasing stops it', async ({ page }) => {
  await page.goto('/');
  const before = await getPlayer(page);

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowRight');

  const after = await getPlayer(page);
  expect(after.x).toBeGreaterThan(before.x);

  await page.waitForTimeout(150);
  const afterRelease = await getPlayer(page);
  expect(afterRelease.x).toBeCloseTo(after.x, 0);
});

test('holding KeyD also moves the ship right (WASD parity)', async ({ page }) => {
  await page.goto('/');
  const before = await getPlayer(page);

  await page.keyboard.down('KeyD');
  await page.waitForTimeout(200);
  await page.keyboard.up('KeyD');

  const after = await getPlayer(page);
  expect(after.x).toBeGreaterThan(before.x);
});

test('holding ArrowLeft/KeyA moves the ship left', async ({ page }) => {
  await page.goto('/');
  const before = await getPlayer(page);

  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowLeft');

  const afterArrow = await getPlayer(page);
  expect(afterArrow.x).toBeLessThan(before.x);

  await page.keyboard.down('KeyA');
  await page.waitForTimeout(200);
  await page.keyboard.up('KeyA');

  const afterWasd = await getPlayer(page);
  expect(afterWasd.x).toBeLessThan(afterArrow.x);
});

test('holding ArrowUp/KeyW moves up and ArrowDown/KeyS moves down', async ({ page }) => {
  await page.goto('/');
  const before = await getPlayer(page);

  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowUp');

  const afterUp = await getPlayer(page);
  expect(afterUp.y).toBeLessThan(before.y);

  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowDown');

  const afterDown = await getPlayer(page);
  expect(afterDown.y).toBeGreaterThan(afterUp.y);
});

test('holding ArrowLeft long enough clamps the ship to the left edge', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(2000);
  await page.keyboard.up('ArrowLeft');

  const player = await getPlayer(page);
  expect(player.x).toBe(0);

  await page.waitForTimeout(100);
  const stillClamped = await getPlayer(page);
  expect(stillClamped.x).toBe(0);
});

test('holding ArrowRight long enough clamps the ship to the right edge', async ({ page }) => {
  await page.goto('/');
  const { gameWidth } = await page.evaluate(() => ({ gameWidth: window.GameState.GAME_WIDTH }));

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2000);
  await page.keyboard.up('ArrowRight');

  const player = await getPlayer(page);
  expect(player.x).toBe(gameWidth - player.width);
});

test('holding ArrowUp long enough clamps the ship to the top edge', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(3000);
  await page.keyboard.up('ArrowUp');

  const player = await getPlayer(page);
  expect(player.y).toBe(0);
});

test('holding ArrowDown long enough clamps the ship to the bottom edge', async ({ page }) => {
  await page.goto('/');
  const { gameHeight } = await page.evaluate(() => ({ gameHeight: window.GameState.GAME_HEIGHT }));

  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(3000);
  await page.keyboard.up('ArrowDown');

  const player = await getPlayer(page);
  expect(player.y).toBe(gameHeight - player.height);
});
