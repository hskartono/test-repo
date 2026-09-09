import { test, expect } from '@playwright/test';

test('a player-enemy collision decrements lives in addition to removing the enemy', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    const player = window.__gameState.player;
    window.__gameState.enemies = [
      { x: player.x + player.width / 2, y: player.y + player.height / 2, radius: 15 },
    ];
  });
  await page.waitForTimeout(50);

  const state = await page.evaluate(() => ({
    lives: window.__gameState.lives,
    enemies: window.__gameState.enemies,
  }));

  expect(state.lives).toBe(2);
  expect(state.enemies).toHaveLength(0);
});

test('losing the last life stops the render loop', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__gameState.lives = 1;
    const player = window.__gameState.player;
    window.__gameState.enemies = [
      { x: player.x + player.width / 2, y: player.y + player.height / 2, radius: 15 },
    ];
  });

  await expect
    .poll(() => page.evaluate(() => window.__gameState.lives), { timeout: 1000 })
    .toBe(0);

  const running = await page.evaluate(() => window.__gameState.running);
  expect(running).toBe(false);

  const first = await page.evaluate(() => window.__frameCount);
  await page.waitForTimeout(200);
  const second = await page.evaluate(() => window.__frameCount);
  expect(second).toBe(first);
});

test('the Game Over screen becomes visible with the final score when lives reach 0', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    window.__gameState.lives = 1;
    window.__gameState.score = 5;
    const player = window.__gameState.player;
    window.__gameState.enemies = [
      { x: player.x + player.width / 2, y: player.y + player.height / 2, radius: 15 },
    ];
  });

  await expect
    .poll(() => page.evaluate(() => window.__gameState.running), { timeout: 1000 })
    .toBe(false);

  await expect(page.locator('#game-over-screen')).toBeVisible();
  await expect(page.locator('#final-score')).toHaveText('Score: 5');
});

test('the Game Over screen is hidden during normal play', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#game-over-screen')).toBeHidden();

  await page.evaluate(() => {
    const player = window.__gameState.player;
    window.__gameState.enemies = [
      { x: player.x + player.width / 2, y: player.y + player.height / 2, radius: 15 },
    ];
  });
  await page.waitForTimeout(50);

  await expect(page.locator('#game-over-screen')).toBeHidden();
});

test('clicking Restart after game over resets score, lives, enemies, bullets, and player position', async ({ page }) => {
  await page.goto('/');

  const initialPlayer = await page.evaluate(() => window.__gameState.player);

  await page.evaluate(() => {
    // Displace the player away from its default spawn position first, so the
    // later assertion actually exercises resetGame()'s position reset rather
    // than trivially matching a player that was never moved.
    window.__gameState.player = { ...window.__gameState.player, x: 5, y: 5 };
    window.__gameState.lives = 1;
    window.__gameState.score = 7;
    // Kept far from the player/enemy overlap below so it isn't the one that
    // consumes the enemy via a bullet-enemy collision instead of a
    // player-enemy one.
    window.__gameState.bullets = [{ x: 400, y: 400, width: 4, height: 12, speed: 480 }];
    const player = window.__gameState.player;
    window.__gameState.enemies = [
      { x: player.x + player.width / 2, y: player.y + player.height / 2, radius: 15 },
      { x: 200, y: 400, radius: 15 },
    ];
  });

  await expect
    .poll(() => page.evaluate(() => window.__gameState.running), { timeout: 1000 })
    .toBe(false);

  await page.click('#restart-button');

  const state = await page.evaluate(() => ({
    score: window.__gameState.score,
    lives: window.__gameState.lives,
    enemies: window.__gameState.enemies,
    bullets: window.__gameState.bullets,
    running: window.__gameState.running,
    player: window.__gameState.player,
  }));

  expect(state.score).toBe(0);
  expect(state.lives).toBe(3);
  expect(state.enemies).toHaveLength(0);
  expect(state.bullets).toHaveLength(0);
  expect(state.running).toBe(true);
  expect(state.player).toEqual(initialPlayer);
  await expect(page.locator('#game-over-screen')).toBeHidden();
});

test('after restart the render loop resumes advancing frames', async ({ page }) => {
  await page.goto('/');

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

  await page.click('#restart-button');

  const first = await page.evaluate(() => window.__frameCount);
  await page.waitForTimeout(200);
  const second = await page.evaluate(() => window.__frameCount);
  expect(second).toBeGreaterThan(first);
});
