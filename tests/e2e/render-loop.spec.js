import { test, expect } from '@playwright/test';

test('opening the page shows a solid black canvas', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(100);

  const pixels = await page.evaluate(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const points = [
      [0, 0],
      [canvas.width - 1, 0],
      [0, canvas.height - 1],
      [canvas.width - 1, canvas.height - 1],
      [Math.floor(canvas.width / 2), Math.floor(canvas.height / 2)],
    ];
    return points.map(([x, y]) => Array.from(ctx.getImageData(x, y, 1, 1).data));
  });

  for (const pixel of pixels) {
    expect(pixel).toEqual([0, 0, 0, 255]);
  }
});

test('no console errors or page errors occur during load and while the loop runs', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err));

  await page.goto('/');
  await page.waitForTimeout(1000);

  expect(consoleErrors).toHaveLength(0);
  expect(pageErrors).toHaveLength(0);
});

test('the render loop runs continuously rather than a single frame', async ({ page }) => {
  await page.goto('/');

  const first = await page.evaluate(() => window.__frameCount);
  await page.waitForTimeout(300);
  const second = await page.evaluate(() => window.__frameCount);

  expect(second).toBeGreaterThan(first);
});

test('resizing the viewport mid-run does not throw and the canvas stays black', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await page.goto('/');
  await page.waitForTimeout(100);

  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(100);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(100);

  const pixel = await page.evaluate(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    return Array.from(ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data);
  });

  expect(pixel).toEqual([0, 0, 0, 255]);
  expect(pageErrors).toHaveLength(0);
});
