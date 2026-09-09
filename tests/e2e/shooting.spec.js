import { test, expect } from '@playwright/test';
import { gotoAndStart } from '../helpers/start-game.js';

async function getBullets(page) {
  return page.evaluate(() => window.__gameState.bullets);
}

test('pressing Space once spawns a bullet that moves upward at a constant rate', async ({ page }) => {
  await gotoAndStart(page);
  await page.keyboard.down('Space');
  await page.waitForTimeout(50);
  await page.keyboard.up('Space');
  await page.waitForTimeout(50);

  const bullets = await getBullets(page);
  expect(bullets).toHaveLength(1);
  const firstY = bullets[0].y;

  await page.waitForTimeout(200);
  const laterBullets = await getBullets(page);
  expect(laterBullets).toHaveLength(1);
  expect(laterBullets[0].y).toBeLessThan(firstY);
});

test('pressing Space multiple times fires a bullet on each discrete press', async ({ page }) => {
  await gotoAndStart(page);

  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.down('Space');
    await page.waitForTimeout(50);
    await page.keyboard.up('Space');
    await page.waitForTimeout(100);
  }

  const bullets = await getBullets(page);
  expect(bullets).toHaveLength(3);
});

test('holding Space down continuously fires only one bullet', async ({ page }) => {
  await gotoAndStart(page);

  await page.keyboard.down('Space');
  await page.waitForTimeout(300);
  await page.keyboard.up('Space');

  const bullets = await getBullets(page);
  expect(bullets).toHaveLength(1);
});

test('a fired bullet is removed from state once it travels past the top of the canvas', async ({ page }) => {
  await gotoAndStart(page);

  await page.keyboard.down('Space');
  await page.waitForTimeout(50);
  await page.keyboard.up('Space');

  await page.waitForTimeout(1600);

  const bullets = await getBullets(page);
  expect(bullets).toHaveLength(0);
});

test('firing does not move the ship', async ({ page }) => {
  await gotoAndStart(page);
  const before = await page.evaluate(() => ({ x: window.__gameState.player.x, y: window.__gameState.player.y }));

  await page.keyboard.down('Space');
  await page.waitForTimeout(100);
  await page.keyboard.up('Space');
  await page.waitForTimeout(50);

  const after = await page.evaluate(() => ({ x: window.__gameState.player.x, y: window.__gameState.player.y }));
  expect(after.x).toBe(before.x);
  expect(after.y).toBe(before.y);
});
