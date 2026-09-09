import { test, expect } from '@playwright/test';

async function fireOnce(page) {
  await page.keyboard.down('Space');
  await page.waitForTimeout(50);
  await page.keyboard.up('Space');
}

async function collideWithEnemy(page) {
  await page.evaluate(() => {
    const player = window.__gameState.player;
    window.__gameState.enemies = [
      { x: player.x + player.width / 2, y: player.y + player.height / 2, radius: 15 },
    ];
  });
  await page.waitForTimeout(50);
}

test('losing all 3 lives to sequential collisions shows the Game Over screen with the final score', async ({ page }) => {
  await page.goto('/');

  const player = await page.evaluate(() => window.__gameState.player);
  const enemyX = player.x + player.width / 2;
  await page.evaluate((x) => {
    window.__gameState.enemies = [{ x, y: 300, radius: 15 }];
  }, enemyX);
  await fireOnce(page);
  await expect
    .poll(() => page.evaluate(() => window.__gameState.score), { timeout: 2000 })
    .toBe(1);

  await collideWithEnemy(page);
  await collideWithEnemy(page);
  await collideWithEnemy(page);

  await expect
    .poll(() => page.evaluate(() => window.__gameState.lives), { timeout: 1000 })
    .toBe(0);

  await expect(page.locator('#game-over-screen')).toBeVisible();
  await expect(page.locator('#final-score')).toHaveText('Score: 1');
});

test('clicking Restart after game over lets play continue normally', async ({ page }) => {
  await page.goto('/');

  await collideWithEnemy(page);
  await collideWithEnemy(page);
  await collideWithEnemy(page);

  await expect
    .poll(() => page.evaluate(() => window.__gameState.running), { timeout: 1000 })
    .toBe(false);

  await page.click('#restart-button');

  await expect(page.locator('#game-over-screen')).toBeHidden();

  const player = await page.evaluate(() => window.__gameState.player);
  const enemyX = player.x + player.width / 2;
  await page.evaluate((x) => {
    window.__gameState.enemies = [{ x, y: 300, radius: 15 }];
  }, enemyX);
  await fireOnce(page);

  await expect
    .poll(() => page.evaluate(() => window.__gameState.score), { timeout: 2000 })
    .toBe(1);

  await expect
    .poll(() => page.evaluate(() => window.__gameState.lives), { timeout: 1000 })
    .toBe(3);
});

test('the Restart button is not visible during normal gameplay', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#restart-button')).toBeHidden();
});

test('a full play, game-over, restart, and play-again cycle runs without console or page errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');

  await collideWithEnemy(page);
  await collideWithEnemy(page);
  await collideWithEnemy(page);

  await expect
    .poll(() => page.evaluate(() => window.__gameState.running), { timeout: 1000 })
    .toBe(false);

  await page.click('#restart-button');

  await page.keyboard.down('ArrowLeft');
  await fireOnce(page);
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowLeft');

  expect(errors).toEqual([]);
});
