import { test, expect } from '@playwright/test';
import { gotoAndStart } from '../helpers/start-game.js';

// Match the down/wait/up pattern used in shooting.spec.js rather than the
// keyboard.press() shorthand: shooting is edge-triggered off a rising `shoot` flag
// sampled once per animation frame, and an instantaneous down+up can race past every
// frame without ever being observed as held.
async function fireOnce(page) {
  await page.keyboard.down('Space');
  await page.waitForTimeout(50);
  await page.keyboard.up('Space');
}

test('shooting an enemy removes both the bullet and the enemy and increases the visible score', async ({ page }) => {
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

  const state = await page.evaluate(() => ({
    bullets: window.__gameState.bullets,
    enemies: window.__gameState.enemies,
  }));

  expect(state.bullets).toHaveLength(0);
  // Don't assert enemies is empty outright: the game's own enemy spawner keeps
  // running in the background and may have added a freshly-spawned enemy near
  // the top of the screen (y close to 0) by the time we read this state. Only
  // the seeded enemy could plausibly still be near y:300, so check that one
  // specifically is gone rather than the array as a whole.
  const enemiesNearSeededPosition = state.enemies.filter((enemy) => enemy.y > 100);
  expect(enemiesNearSeededPosition).toHaveLength(0);
});

test('the score overlay updates on-screen after a kill', async ({ page }) => {
  await gotoAndStart(page);

  const blankPixels = await page.evaluate(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    return Array.from(ctx.getImageData(10, 10, 80, 15).data);
  });

  const player = await page.evaluate(() => window.__gameState.player);
  const enemyX = player.x + player.width / 2;
  await page.evaluate((x) => {
    window.__gameState.enemies = [{ x, y: 300, radius: 15 }];
  }, enemyX);

  await fireOnce(page);

  await expect
    .poll(() => page.evaluate(() => window.__gameState.score), { timeout: 2000 })
    .toBe(1);

  const afterPixels = await page.evaluate(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    return Array.from(ctx.getImageData(10, 10, 80, 15).data);
  });

  expect(afterPixels).not.toEqual(blankPixels);
});

test('the player ship colliding with an enemy removes that enemy', async ({ page }) => {
  await gotoAndStart(page);

  await page.evaluate(() => {
    const player = window.__gameState.player;
    window.__gameState.enemies = [
      { x: player.x + player.width / 2, y: player.y + player.height / 2, radius: 15 },
    ];
  });

  await expect
    .poll(() => page.evaluate(() => window.__gameState.enemies.length), { timeout: 1000 })
    .toBe(0);
});

test('a normal play session with organic spawns, movement, and firing runs without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await gotoAndStart(page);

  await page.keyboard.down('ArrowLeft');
  for (let i = 0; i < 5; i += 1) {
    await fireOnce(page);
    await page.waitForTimeout(350);
  }
  await page.keyboard.up('ArrowLeft');

  expect(errors).toEqual([]);
});
