import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../../js/player.js');
const {
  createPlayer,
  clampPlayer,
  movePlayer,
  respawnPlayer,
  updateInvulnerability,
  INVULNERABILITY_DURATION_MS,
  BLINK_INTERVAL_MS,
} = globalThis.Player;

const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;

test('createPlayer spawns horizontally centered and within bounds near the bottom', () => {
  const player = createPlayer(GAME_WIDTH, GAME_HEIGHT);
  assert.equal(player.x + player.width / 2, GAME_WIDTH / 2);
  assert.ok(player.x >= 0 && player.x + player.width <= GAME_WIDTH);
  assert.ok(player.y >= 0 && player.y + player.height <= GAME_HEIGHT);
  assert.ok(player.y + player.height < GAME_HEIGHT, 'ship should not touch the very bottom edge');
});

test('createPlayer starts not invulnerable and visible', () => {
  const player = createPlayer(GAME_WIDTH, GAME_HEIGHT);
  assert.equal(player.invulnerable, false);
  assert.equal(player.blinkVisible, true);
});

test('respawnPlayer places the ship back at the bottom-center spawn point and marks it invulnerable', () => {
  const player = respawnPlayer(GAME_WIDTH, GAME_HEIGHT);
  const fresh = createPlayer(GAME_WIDTH, GAME_HEIGHT);
  assert.equal(player.x, fresh.x);
  assert.equal(player.y, fresh.y);
  assert.equal(player.invulnerable, true);
  assert.equal(player.invulnerableElapsedMs, 0);
});

test('updateInvulnerability leaves invulnerable true just before the duration threshold', () => {
  const player = respawnPlayer(GAME_WIDTH, GAME_HEIGHT);
  const updated = updateInvulnerability(player, INVULNERABILITY_DURATION_MS - 1);
  assert.equal(updated.invulnerable, true);
});

test('updateInvulnerability clears invulnerable once the duration has elapsed', () => {
  const player = respawnPlayer(GAME_WIDTH, GAME_HEIGHT);
  const updated = updateInvulnerability(player, INVULNERABILITY_DURATION_MS);
  assert.equal(updated.invulnerable, false);
  assert.equal(updated.blinkVisible, true);
});

test('updateInvulnerability is a no-op when the player is not invulnerable', () => {
  const player = createPlayer(GAME_WIDTH, GAME_HEIGHT);
  const updated = updateInvulnerability(player, 500);
  assert.equal(updated, player);
});

test('updateInvulnerability toggles blinkVisible deterministically at the blink interval', () => {
  const player = respawnPlayer(GAME_WIDTH, GAME_HEIGHT);
  const onFrame = updateInvulnerability(player, 0);
  assert.equal(onFrame.blinkVisible, true);

  const offFrame = updateInvulnerability(player, BLINK_INTERVAL_MS);
  assert.equal(offFrame.blinkVisible, false);

  const onAgain = updateInvulnerability(player, BLINK_INTERVAL_MS * 2);
  assert.equal(onAgain.blinkVisible, true);
});

test('clampPlayer pulls a negative x up to 0', () => {
  const player = { x: -10, y: 100, width: 30, height: 30 };
  const clamped = clampPlayer(player, GAME_WIDTH, GAME_HEIGHT);
  assert.equal(clamped.x, 0);
});

test('clampPlayer pulls an over-max x back down to gameWidth - width', () => {
  const player = { x: GAME_WIDTH + 50, y: 100, width: 30, height: 30 };
  const clamped = clampPlayer(player, GAME_WIDTH, GAME_HEIGHT);
  assert.equal(clamped.x, GAME_WIDTH - 30);
});

test('clampPlayer pulls a negative y up to 0 and an over-max y down to gameHeight - height', () => {
  const above = clampPlayer({ x: 0, y: -20, width: 30, height: 30 }, GAME_WIDTH, GAME_HEIGHT);
  assert.equal(above.y, 0);

  const below = clampPlayer({ x: 0, y: GAME_HEIGHT + 20, width: 30, height: 30 }, GAME_WIDTH, GAME_HEIGHT);
  assert.equal(below.y, GAME_HEIGHT - 30);
});

test('clampPlayer leaves an in-bounds position unchanged', () => {
  const player = { x: 100, y: 200, width: 30, height: 30 };
  const clamped = clampPlayer(player, GAME_WIDTH, GAME_HEIGHT);
  assert.equal(clamped.x, 100);
  assert.equal(clamped.y, 200);
});

test('movePlayer moves right when input.right is set', () => {
  const player = { x: 100, y: 100, width: 30, height: 30, speed: 240 };
  const moved = movePlayer(player, { right: true }, 0.5, GAME_WIDTH, GAME_HEIGHT);
  assert.equal(moved.x, 220);
});

test('movePlayer moves left/up/down according to input flags', () => {
  const base = { x: 200, y: 200, width: 30, height: 30, speed: 240 };

  const left = movePlayer(base, { left: true }, 0.5, GAME_WIDTH, GAME_HEIGHT);
  assert.equal(left.x, 80);

  const up = movePlayer(base, { up: true }, 0.5, GAME_WIDTH, GAME_HEIGHT);
  assert.equal(up.y, 80);

  const down = movePlayer(base, { down: true }, 0.5, GAME_WIDTH, GAME_HEIGHT);
  assert.equal(down.y, 320);
});

test('movePlayer results in no net x movement when opposing keys are both held', () => {
  const player = { x: 200, y: 200, width: 30, height: 30, speed: 240 };
  const moved = movePlayer(player, { left: true, right: true }, 0.5, GAME_WIDTH, GAME_HEIGHT);
  assert.equal(moved.x, 200);
});

test('movePlayer clamps exactly to the boundary instead of overshooting with a large dt', () => {
  const player = { x: 10, y: 100, width: 30, height: 30, speed: 240 };
  const moved = movePlayer(player, { left: true }, 5, GAME_WIDTH, GAME_HEIGHT);
  assert.equal(moved.x, 0);
});
