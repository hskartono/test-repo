import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../../js/explosions.js');
const { spawnExplosion, updateExplosions, EXPLOSION_DURATION_MS, EXPLOSION_FRAME_COUNT } = globalThis.Explosions;

test('spawnExplosion creates an entry at the given position with frame 0 and elapsed 0', () => {
  const explosion = spawnExplosion(120, 340);
  assert.equal(explosion.x, 120);
  assert.equal(explosion.y, 340);
  assert.equal(explosion.frame, 0);
  assert.equal(explosion.elapsed, 0);
});

test('updateExplosions advances elapsed time and frame, keeping entries mid-animation', () => {
  const explosions = [spawnExplosion(0, 0)];
  const updated = updateExplosions(explosions, EXPLOSION_DURATION_MS / 1000 / 2);
  assert.equal(updated.length, 1);
  assert.ok(updated[0].elapsed > 0);
  assert.ok(updated[0].frame >= 0 && updated[0].frame < EXPLOSION_FRAME_COUNT);
});

test('updateExplosions removes an entry once its duration has fully elapsed', () => {
  const explosions = [spawnExplosion(0, 0)];
  const updated = updateExplosions(explosions, EXPLOSION_DURATION_MS / 1000 + 1);
  assert.equal(updated.length, 0);
});

test('updateExplosions does not mutate the input array or its entries', () => {
  const original = spawnExplosion(5, 5);
  const explosions = [original];
  updateExplosions(explosions, 0.1);
  assert.equal(explosions[0], original);
  assert.equal(original.elapsed, 0);
});
