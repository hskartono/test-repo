import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../../js/gameState.js');
const { createGameState, computeCanvasLayout } = globalThis.GameState;

test('createGameState returns the expected default shape', () => {
  const state = createGameState();
  assert.deepEqual(state, { running: true, lastTimestamp: null });
});

test('computeCanvasLayout letterboxes left/right when viewport is wider than the aspect ratio', () => {
  const layout = computeCanvasLayout(1000, 640, 480, 640);
  assert.equal(layout.height, 640);
  assert.ok(layout.width < 1000);
  assert.ok(layout.offsetX > 0);
  assert.equal(layout.offsetY, 0);
});

test('computeCanvasLayout letterboxes top/bottom when viewport is taller/narrower than the aspect ratio', () => {
  const layout = computeCanvasLayout(480, 1200, 480, 640);
  assert.equal(layout.width, 480);
  assert.ok(layout.height < 1200);
  assert.equal(layout.offsetX, 0);
  assert.ok(layout.offsetY > 0);
});

test('computeCanvasLayout has no letterboxing when the viewport exactly matches the aspect ratio', () => {
  const layout = computeCanvasLayout(960, 1280, 480, 640);
  assert.equal(layout.width, 960);
  assert.equal(layout.height, 1280);
  assert.equal(layout.offsetX, 0);
  assert.equal(layout.offsetY, 0);
});
