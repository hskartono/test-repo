import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../../js/collisions.js');
const { intersects, resolveBulletEnemyCollisions, resolvePlayerEnemyCollisions } = globalThis.Collisions;

test('intersects is true for overlapping rects and false when clearly separated', () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };
  const b = { x: 5, y: 5, width: 10, height: 10 };
  const c = { x: 100, y: 100, width: 10, height: 10 };
  assert.equal(intersects(a, b), true);
  assert.equal(intersects(a, c), false);
});

test('intersects converts a circle entity to its bounding square and detects overlap with a rect', () => {
  const enemy = { x: 50, y: 50, radius: 15 };
  const overlappingBullet = { x: 45, y: 45, width: 4, height: 12 };
  const distantBullet = { x: 400, y: 400, width: 4, height: 12 };
  assert.equal(intersects(overlappingBullet, enemy), true);
  assert.equal(intersects(distantBullet, enemy), false);
});

test('intersects is false when bounding boxes merely touch at an edge', () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };
  const b = { x: 10, y: 0, width: 10, height: 10 };
  assert.equal(intersects(a, b), false);
});

test('resolveBulletEnemyCollisions removes exactly the colliding pair and reports hits', () => {
  const bullets = [{ x: 100, y: 100, width: 4, height: 12 }];
  const enemies = [{ x: 100, y: 105, radius: 15 }];
  const result = resolveBulletEnemyCollisions(bullets, enemies);
  assert.equal(result.bullets.length, 0);
  assert.equal(result.enemies.length, 0);
  assert.equal(result.hits, 1);
});

test('resolveBulletEnemyCollisions with no collisions returns unchanged arrays and hits 0', () => {
  const bullets = [{ x: 0, y: 0, width: 4, height: 12 }];
  const enemies = [{ x: 400, y: 400, radius: 15 }];
  const result = resolveBulletEnemyCollisions(bullets, enemies);
  assert.equal(result.bullets.length, 1);
  assert.equal(result.enemies.length, 1);
  assert.equal(result.hits, 0);
});

test('resolveBulletEnemyCollisions removes two independent pairs and reports hits 2', () => {
  const bullets = [
    { x: 10, y: 10, width: 4, height: 12 },
    { x: 200, y: 200, width: 4, height: 12 },
  ];
  const enemies = [
    { x: 10, y: 15, radius: 15 },
    { x: 200, y: 205, radius: 15 },
  ];
  const result = resolveBulletEnemyCollisions(bullets, enemies);
  assert.equal(result.bullets.length, 0);
  assert.equal(result.enemies.length, 0);
  assert.equal(result.hits, 2);
});

test('resolveBulletEnemyCollisions only consumes one bullet when two bullets overlap the same enemy', () => {
  const bullets = [
    { x: 100, y: 100, width: 4, height: 12 },
    { x: 101, y: 101, width: 4, height: 12 },
  ];
  const enemies = [{ x: 100, y: 105, radius: 15 }];
  const result = resolveBulletEnemyCollisions(bullets, enemies);
  assert.equal(result.bullets.length, 1);
  assert.equal(result.enemies.length, 0);
  assert.equal(result.hits, 1);
});

test('resolveBulletEnemyCollisions does not mutate its input arrays', () => {
  const bullets = [{ x: 100, y: 100, width: 4, height: 12 }];
  const enemies = [{ x: 100, y: 105, radius: 15 }];
  resolveBulletEnemyCollisions(bullets, enemies);
  assert.equal(bullets.length, 1);
  assert.equal(enemies.length, 1);
});

test('resolvePlayerEnemyCollisions removes an enemy overlapping the player and reports hit true', () => {
  const player = { x: 100, y: 500, width: 30, height: 30 };
  const enemies = [{ x: 110, y: 510, radius: 15 }];
  const result = resolvePlayerEnemyCollisions(player, enemies);
  assert.equal(result.enemies.length, 0);
  assert.equal(result.hit, true);
});

test('resolvePlayerEnemyCollisions with no overlap returns hit false and enemies unchanged', () => {
  const player = { x: 100, y: 500, width: 30, height: 30 };
  const enemies = [{ x: 400, y: 50, radius: 15 }];
  const result = resolvePlayerEnemyCollisions(player, enemies);
  assert.equal(result.enemies.length, 1);
  assert.equal(result.hit, false);
});

test('resolvePlayerEnemyCollisions removes multiple enemies overlapping the player at once', () => {
  const player = { x: 100, y: 500, width: 30, height: 30 };
  const enemies = [
    { x: 105, y: 505, radius: 15 },
    { x: 120, y: 515, radius: 15 },
    { x: 400, y: 50, radius: 15 },
  ];
  const result = resolvePlayerEnemyCollisions(player, enemies);
  assert.equal(result.enemies.length, 1);
  assert.equal(result.hit, true);
});
