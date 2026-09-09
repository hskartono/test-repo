import { test, expect } from '@playwright/test';
import { gotoAndStart } from '../helpers/start-game.js';

async function useBombOnce(page) {
  await page.keyboard.down('KeyB');
  await page.waitForTimeout(50);
  await page.keyboard.up('KeyB');
}

test('pressing B once destroys all enemies and in-flight bullets and decrements the bomb count', async ({ page }) => {
  await gotoAndStart(page);

  await page.evaluate(() => {
    window.__gameState.enemies = [
      { x: 50, y: 200, radius: 15 },
      { x: 300, y: 400, radius: 15 },
    ];
    window.__gameState.bullets = [{ x: 100, y: 100, width: 4, height: 12, speed: 480 }];
  });

  await useBombOnce(page);

  await expect
    .poll(() => page.evaluate(() => window.__gameState.bomb.count), { timeout: 2000 })
    .toBe(2);

  const state = await page.evaluate(() => ({
    enemies: window.__gameState.enemies,
    bullets: window.__gameState.bullets,
  }));

  expect(state.enemies).toHaveLength(0);
  expect(state.bullets).toHaveLength(0);
});

test('holding B down continuously consumes only a single bomb', async ({ page }) => {
  await gotoAndStart(page);

  await page.keyboard.down('KeyB');
  await page.waitForTimeout(300);
  await page.keyboard.up('KeyB');

  const bombCount = await page.evaluate(() => window.__gameState.bomb.count);
  expect(bombCount).toBe(2);
});

test('pressing B repeatedly consumes bombs down to 0 and a further press does nothing', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await gotoAndStart(page);

  for (let i = 0; i < 3; i += 1) {
    await useBombOnce(page);
    await page.waitForTimeout(100);
  }

  await expect
    .poll(() => page.evaluate(() => window.__gameState.bomb.count), { timeout: 2000 })
    .toBe(0);

  await useBombOnce(page);
  await page.waitForTimeout(100);

  const bombCount = await page.evaluate(() => window.__gameState.bomb.count);
  expect(bombCount).toBe(0);
  expect(errors).toEqual([]);
});

test('destroying enemies with a bomb does not increase the on-screen score', async ({ page }) => {
  await gotoAndStart(page);

  await page.evaluate(() => {
    window.__gameState.enemies = [{ x: 50, y: 200, radius: 15 }];
  });

  await useBombOnce(page);
  await page.waitForTimeout(50);

  const state = await page.evaluate(() => ({
    score: window.__gameState.score,
    enemies: window.__gameState.enemies,
  }));

  expect(state.enemies).toHaveLength(0);
  expect(state.score).toBe(0);
});

test('the bomb count resets to 3 after a game over and restart', async ({ page }) => {
  await gotoAndStart(page);

  await useBombOnce(page);
  await page.waitForTimeout(50);
  const bombCountAfterUse = await page.evaluate(() => window.__gameState.bomb.count);
  expect(bombCountAfterUse).toBe(2);

  await page.evaluate(() => {
    window.__gameState.lives = 1;
    const player = window.__gameState.player;
    window.__gameState.enemies = [
      { x: player.x + player.width / 2, y: player.y + player.height / 2, radius: 15 },
    ];
  });

  await expect
    .poll(() => page.evaluate(() => window.__gameState.running), { timeout: 1000 })
    .toBe(false);

  await page.evaluate(() => window.__forceGameOverReturn());
  await page.evaluate(() => window.__forceSplashTitle());
  await page.click('#start-button');

  const bombCountAfterRestart = await page.evaluate(() => window.__gameState.bomb.count);
  expect(bombCountAfterRestart).toBe(3);
});

test('a full play session with movement, firing, and a bomb use runs without console or page errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await gotoAndStart(page);

  await page.keyboard.down('ArrowLeft');
  await page.keyboard.down('Space');
  await page.waitForTimeout(100);
  await page.keyboard.up('Space');
  await page.waitForTimeout(200);
  await useBombOnce(page);
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowLeft');

  expect(errors).toEqual([]);
});
