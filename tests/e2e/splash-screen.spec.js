import { test, expect } from '@playwright/test';

async function collideWithEnemy(page) {
  await page.evaluate(() => {
    window.__gameState.player.invulnerable = false;
    const player = window.__gameState.player;
    window.__gameState.enemies = [
      { x: player.x + player.width / 2, y: player.y + player.height / 2, radius: 15 },
    ];
  });
  await page.waitForTimeout(50);
}

test('the real intro-to-title sequence plays out on load without touching the debug hook', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#splash-intro')).toBeVisible();
  await expect(page.locator('.made-with')).toHaveText('Made using Claude Code');
  await expect(page.locator('#splash-title')).toBeHidden();

  // Gameplay must not run while the splash is up, for the whole intro window.
  expect(await page.evaluate(() => window.__frameCount)).toBe(0);

  const { introMs, fadeMs } = await page.evaluate(() => ({
    introMs: window.Splash.INTRO_DURATION_MS,
    fadeMs: window.Splash.FADE_DURATION_MS,
  }));

  await expect(page.locator('#splash-title')).toBeVisible({ timeout: introMs + fadeMs + 2000 });
  await expect(page.locator('.game-title')).toHaveText('Galactic Wars');
  await expect(page.locator('#start-button')).toBeVisible();

  await expect
    .poll(() => page.evaluate(() => window.__sfxLog || []), { timeout: 1000 })
    .toContain('title');

  expect(await page.evaluate(() => window.__frameCount)).toBe(0);
});

test('clicking Start after the real sequence hides the splash and begins gameplay', async ({ page }) => {
  await page.goto('/');

  const { introMs, fadeMs } = await page.evaluate(() => ({
    introMs: window.Splash.INTRO_DURATION_MS,
    fadeMs: window.Splash.FADE_DURATION_MS,
  }));
  await expect(page.locator('#start-button')).toBeVisible({ timeout: introMs + fadeMs + 2000 });

  await page.click('#start-button');

  await expect(page.locator('#splash-screen')).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__gameState.running), { timeout: 1000 })
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.__frameCount), { timeout: 1000 })
    .toBeGreaterThan(0);
});

test('a full play, game-over, real-timed splash return, and play-again cycle runs without console or page errors', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');
  await page.evaluate(() => window.__forceSplashTitle());
  await page.click('#start-button');

  await collideWithEnemy(page);
  await collideWithEnemy(page);
  await collideWithEnemy(page);

  await expect(page.locator('#game-over-screen')).toBeVisible();
  await expect(page.locator('#final-score')).toContainText('Score:');

  const returnDelayMs = await page.evaluate(() => window.Splash.GAME_OVER_RETURN_DELAY_MS);

  await expect(page.locator('#game-over-screen')).toBeHidden({ timeout: returnDelayMs + 2000 });
  await expect(page.locator('#splash-screen')).toBeVisible();
  await expect(page.locator('#splash-intro')).toBeVisible();

  const { introMs, fadeMs } = await page.evaluate(() => ({
    introMs: window.Splash.INTRO_DURATION_MS,
    fadeMs: window.Splash.FADE_DURATION_MS,
  }));
  await expect(page.locator('#start-button')).toBeVisible({ timeout: introMs + fadeMs + 2000 });

  await page.click('#start-button');
  await expect(page.locator('#splash-screen')).toBeHidden();

  await expect
    .poll(() => page.evaluate(() => window.__gameState.lives), { timeout: 1000 })
    .toBe(3);
  await expect
    .poll(() => page.evaluate(() => window.__gameState.score), { timeout: 1000 })
    .toBe(0);

  expect(errors).toEqual([]);
});
