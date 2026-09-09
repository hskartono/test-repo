import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../../js/enemies.js');
const { spawnEnemy, updateEnemies, stepEnemySpawner, SPAWN_INTERVAL_MS } = globalThis.Enemies;

const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;
const RADIUS = 15;

test('spawnEnemy spawns just above the top edge with x within bounds', () => {
  const enemy = spawnEnemy(GAME_WIDTH, RADIUS);
  assert.equal(enemy.y, -RADIUS);
  assert.equal(enemy.radius, RADIUS);
  assert.ok(enemy.x >= RADIUS);
  assert.ok(enemy.x <= GAME_WIDTH - RADIUS);
});

test('spawnEnemy maps rng=0 to the leftmost valid x and rng near 1 to the rightmost valid x', () => {
  const left = spawnEnemy(GAME_WIDTH, RADIUS, () => 0);
  assert.equal(left.x, RADIUS);

  const right = spawnEnemy(GAME_WIDTH, RADIUS, () => 0.999999);
  assert.ok(right.x > GAME_WIDTH - RADIUS - 1);
  assert.ok(right.x <= GAME_WIDTH - RADIUS);
});

test('updateEnemies moves an enemy down by speed * deltaMs / 1000', () => {
  const enemies = [{ x: 100, y: 50, radius: RADIUS }];
  const result = updateEnemies(enemies, 500, 120, GAME_HEIGHT);
  assert.equal(result.length, 1);
  assert.equal(result[0].y, 50 + (120 * 500) / 1000);
});

test('updateEnemies removes enemies once they move past the bottom of the canvas', () => {
  const enemies = [
    { x: 100, y: GAME_HEIGHT - 5, radius: RADIUS }, // on-screen, should survive
    { x: 200, y: GAME_HEIGHT + RADIUS + 50, radius: RADIUS }, // already off-screen
  ];
  const result = updateEnemies(enemies, 16, 120, GAME_HEIGHT);
  assert.equal(result.length, 1);
  assert.equal(result[0].x, 100);
});

test('updateEnemies on an empty array returns an empty array', () => {
  const result = updateEnemies([], 16, 120, GAME_HEIGHT);
  assert.deepEqual(result, []);
});

test('stepEnemySpawner does not spawn before the interval has elapsed', () => {
  const state = { enemies: [], timeSinceLastSpawn: 0 };
  stepEnemySpawner(state, SPAWN_INTERVAL_MS - 1, SPAWN_INTERVAL_MS, GAME_WIDTH, RADIUS);
  assert.equal(state.enemies.length, 0);
});

test('stepEnemySpawner spawns exactly one enemy once the interval elapses and resets its accumulator', () => {
  const state = { enemies: [], timeSinceLastSpawn: 0 };
  stepEnemySpawner(state, SPAWN_INTERVAL_MS, SPAWN_INTERVAL_MS, GAME_WIDTH, RADIUS);
  assert.equal(state.enemies.length, 1);
  assert.equal(state.timeSinceLastSpawn, 0);
});

test('stepEnemySpawner spawns multiple enemies in one call if elapsed time crosses the interval more than once', () => {
  const state = { enemies: [], timeSinceLastSpawn: 0 };
  stepEnemySpawner(state, SPAWN_INTERVAL_MS * 3.5, SPAWN_INTERVAL_MS, GAME_WIDTH, RADIUS);
  assert.equal(state.enemies.length, 3);
  assert.equal(state.timeSinceLastSpawn, SPAWN_INTERVAL_MS * 0.5);
});
