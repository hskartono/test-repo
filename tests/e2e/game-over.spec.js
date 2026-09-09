import { test, expect } from '@playwright/test';
import { gotoAndStart } from '../helpers/start-game.js';

async function fireOnce(page) {
  await page.keyboard.down('Space');
  await page.waitForTimeout(50);
  await page.keyboard.up('Space');
}

async function collideWithEnemy(page) {
  await page.evaluate(() => {
    // Force-clear invulnerability so each call in a rapid sequence still lands a
    // hit - respawn now grants a temporary invulnerability window that would
    // otherwise absorb these back-to-back forced collisions.
    window.__gameState.player.invulnerable = false;
    const player = window.__gameState.player;
    window.__gameState.enemies = [
      { x: player.x + player.width / 2, y: player.y + player.height / 2, radius: 15 },
    ];
  });
  await page.waitForTimeout(50);
}

test('losing all 3 lives to sequential collisions shows the Game Over screen with the final score', async ({ page }) => {
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

  await collideWithEnemy(page);
  await collideWithEnemy(page);
  await collideWithEnemy(page);

  await expect
    .poll(() => page.evaluate(() => window.__gameState.lives), { timeout: 1000 })
    .toBe(0);

  await expect(page.locator('#game-over-screen')).toBeVisible();
  await expect(page.locator('#final-score')).toHaveText('Score: 1');
});

test('a few seconds after game over, the splash screen automatically reappears with the title and clicking Start lets play continue normally', async ({
  page,
}) => {
  await gotoAndStart(page);

  await collideWithEnemy(page);
  await collideWithEnemy(page);
  await collideWithEnemy(page);

  await expect
    .poll(() => page.evaluate(() => window.__gameState.running), { timeout: 1000 })
    .toBe(false);

  // Skip the real GAME_OVER_RETURN_DELAY_MS/INTRO_DURATION_MS waits - the real
  // timings are covered by tests/e2e/splash-screen.spec.js; this test is about
  // the resulting play-again flow.
  await page.evaluate(() => window.__forceGameOverReturn());
  await expect(page.locator('#game-over-screen')).toBeHidden();
  await expect(page.locator('#splash-screen')).toBeVisible();

  await page.evaluate(() => window.__forceSplashTitle());
  await expect(page.locator('#splash-title')).toBeVisible();

  await page.click('#start-button');
  await expect(page.locator('#splash-screen')).toBeHidden();

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

test('the splash screen is not visible during normal gameplay', async ({ page }) => {
  await gotoAndStart(page);
  await expect(page.locator('#splash-screen')).toBeHidden();
});

test('a full play, game-over, splash-return, and play-again cycle runs without console or page errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await gotoAndStart(page);

  await collideWithEnemy(page);
  await collideWithEnemy(page);
  await collideWithEnemy(page);

  await expect
    .poll(() => page.evaluate(() => window.__gameState.running), { timeout: 1000 })
    .toBe(false);

  await page.evaluate(() => window.__forceGameOverReturn());
  await page.evaluate(() => window.__forceSplashTitle());
  await page.click('#start-button');

  await page.keyboard.down('ArrowLeft');
  await fireOnce(page);
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowLeft');

  expect(errors).toEqual([]);
});
