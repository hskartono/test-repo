import { test, expect } from '@playwright/test';

test('the splash intro (logo + "Made using Claude Code") is shown on load and gameplay has not started', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('#splash-screen')).toBeVisible();
  await expect(page.locator('#splash-intro')).toBeVisible();
  await expect(page.locator('.claude-logo')).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const logo = document.querySelector('.claude-logo');
    return Boolean(logo && logo.complete && logo.naturalWidth > 0);
  })).toBe(true);
  await expect(page.locator('.made-with')).toHaveText('Made using Claude Code');
  await expect(page.locator('#splash-title')).toBeHidden();
  expect(await page.evaluate(() => window.__splashState.phase)).toBe('intro');

  const first = await page.evaluate(() => window.__frameCount);
  await page.waitForTimeout(150);
  const second = await page.evaluate(() => window.__frameCount);
  expect(second).toBe(first);
});

test('forcing the title reveal shows the game title, the Start button, and plays the title sound effect', async ({
  page,
}) => {
  await page.goto('/');

  await page.evaluate(() => window.__forceSplashTitle());

  await expect(page.locator('#splash-intro')).toBeHidden();
  await expect(page.locator('#splash-title')).toBeVisible();
  await expect(page.locator('.game-title')).toHaveText('Galactic Wars');
  await expect(page.locator('#start-button')).toBeVisible();
  expect(await page.evaluate(() => window.__splashState.phase)).toBe('title');

  const sfxLog = await page.evaluate(() => window.__sfxLog || []);
  expect(sfxLog).toContain('title');
});

test('clicking Start hides the splash screen and starts the render loop', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.__forceSplashTitle());

  await page.click('#start-button');

  await expect(page.locator('#splash-screen')).toBeHidden();

  const first = await page.evaluate(() => window.__frameCount);
  await page.waitForTimeout(150);
  const second = await page.evaluate(() => window.__frameCount);
  expect(second).toBeGreaterThan(first);
});

test('the old manual restart button no longer exists', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#restart-button')).toHaveCount(0);
});
