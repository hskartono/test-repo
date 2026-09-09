import { test, expect } from '@playwright/test';

async function fireOnce(page) {
  await page.keyboard.down('Space');
  // Wait for actual frames to elapse rather than a fixed real-time delay: on a
  // stalled/contended machine a fixed wait can complete without the render
  // loop ever observing "shoot" as held, silently dropping the edge-triggered
  // fire entirely.
  const before = await page.evaluate(() => window.__frameCount);
  await expect.poll(() => page.evaluate(() => window.__frameCount), { timeout: 5000 }).toBeGreaterThan(before + 1);
  await page.keyboard.up('Space');
}

test('a bullet-enemy collision spawns an explosion that later clears itself', async ({ page }) => {
  await page.goto('/');

  const player = await page.evaluate(() => window.__gameState.player);
  const enemyX = player.x + player.width / 2;
  await page.evaluate((x) => {
    window.__gameState.enemies = [{ x, y: 300, radius: 15 }];
  }, enemyX);

  await fireOnce(page);

  await expect
    .poll(() => page.evaluate(() => window.__gameState.explosions.length), { timeout: 8000 })
    .toBeGreaterThan(0);

  await expect
    .poll(() => page.evaluate(() => window.__gameState.explosions.length), { timeout: 8000 })
    .toBe(0);
});

test('a lethal player-enemy collision spawns an explosion at the player position', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__gameState.lives = 1;
    const player = window.__gameState.player;
    window.__gameState.enemies = [
      { x: player.x + player.width / 2, y: player.y + player.height / 2, radius: 15 },
    ];
  });

  await expect
    .poll(() => page.evaluate(() => window.__gameState.explosions.length), { timeout: 1000 })
    .toBeGreaterThan(0);
});
