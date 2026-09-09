import { test, expect } from '@playwright/test';
import { gotoAndStart } from '../helpers/start-game.js';

test('exposes a player object with the expected shape', async ({ page }) => {
  await gotoAndStart(page);
  const player = await page.evaluate(() => window.__gameState.player);
  expect(player).toHaveProperty('x');
  expect(player).toHaveProperty('y');
  expect(player).toHaveProperty('width');
  expect(player).toHaveProperty('height');
  expect(player).toHaveProperty('speed');
  expect(player).toHaveProperty('invulnerable', false);
  expect(player).toHaveProperty('blinkVisible', true);
});

test('initial player position is horizontally centered and within canvas bounds', async ({ page }) => {
  await gotoAndStart(page);
  const { player, gameWidth, gameHeight } = await page.evaluate(() => ({
    player: window.__gameState.player,
    gameWidth: window.GameState.GAME_WIDTH,
    gameHeight: window.GameState.GAME_HEIGHT,
  }));

  expect(player.x + player.width / 2).toBeCloseTo(gameWidth / 2, 5);
  expect(player.x).toBeGreaterThanOrEqual(0);
  expect(player.x + player.width).toBeLessThanOrEqual(gameWidth);
  expect(player.y).toBeGreaterThanOrEqual(0);
  expect(player.y + player.height).toBeLessThanOrEqual(gameHeight);
});

test('the ship is actually drawn at its initial position', async ({ page }) => {
  await gotoAndStart(page);
  await page.waitForTimeout(100);

  const pixel = await page.evaluate(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const player = window.__gameState.player;
    const x = Math.floor(player.x + player.width / 2);
    const y = Math.floor(player.y + player.height * 0.75);
    return Array.from(ctx.getImageData(x, y, 1, 1).data);
  });

  expect(pixel).not.toEqual([0, 0, 0, 255]);
});
