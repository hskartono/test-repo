import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../../js/bullets.js');
const {
  createBullet,
  fireBullet,
  moveBullets,
  isOnscreen,
  removeOffscreenBullets,
  updateBullets,
  shouldFire,
} = globalThis.Bullets;

const player = { x: 100, y: 200, width: 30, height: 30 };

test('createBullet spawns horizontally centered on the player and at the player top edge', () => {
  const bullet = createBullet(player);
  assert.equal(bullet.x + bullet.width / 2, player.x + player.width / 2);
  assert.equal(bullet.y, player.y);
});

test('fireBullet returns a new array with one more bullet, without mutating the input', () => {
  const bullets = [];
  const fired = fireBullet(bullets, player);
  assert.equal(fired.length, 1);
  assert.equal(bullets.length, 0);
  assert.notEqual(fired, bullets);
});

test('moveBullets decreases y by speed * dt for every bullet', () => {
  const bullets = [
    { x: 0, y: 100, width: 4, height: 12, speed: 480 },
    { x: 10, y: 200, width: 4, height: 12, speed: 480 },
  ];
  const moved = moveBullets(bullets, 0.5);
  assert.equal(moved[0].y, 100 - 240);
  assert.equal(moved[1].y, 200 - 240);
});

test('moveBullets returns new bullet objects without mutating the originals', () => {
  const bullets = [{ x: 0, y: 100, width: 4, height: 12, speed: 480 }];
  const moved = moveBullets(bullets, 0.5);
  assert.notEqual(moved[0], bullets[0]);
  assert.equal(bullets[0].y, 100);
});

test('isOnscreen is true while any part of the bullet is within the canvas and false once fully past the top', () => {
  assert.equal(isOnscreen({ y: 0, height: 12 }), true);
  assert.equal(isOnscreen({ y: -1, height: 12 }), true);
  assert.equal(isOnscreen({ y: -11, height: 12 }), true);
  assert.equal(isOnscreen({ y: -12, height: 12 }), false);
  assert.equal(isOnscreen({ y: -50, height: 12 }), false);
});

test('removeOffscreenBullets drops only the bullets that have fully scrolled past the top', () => {
  const bullets = [
    { y: 100, height: 12 },
    { y: -50, height: 12 },
    { y: 5, height: 12 },
  ];
  const kept = removeOffscreenBullets(bullets);
  assert.deepEqual(kept, [
    { y: 100, height: 12 },
    { y: 5, height: 12 },
  ]);
});

test('updateBullets moves bullets and removes any that end up off-screen in the same call', () => {
  const bullets = [
    { x: 0, y: 500, width: 4, height: 12, speed: 480 },
    { x: 0, y: 5, width: 4, height: 12, speed: 480 },
  ];
  const updated = updateBullets(bullets, 1);
  assert.equal(updated.length, 1);
  assert.equal(updated[0].y, 500 - 480);
});

test('shouldFire is true only on the false->true transition', () => {
  assert.equal(shouldFire(true, false), true);
  assert.equal(shouldFire(true, true), false);
  assert.equal(shouldFire(false, false), false);
  assert.equal(shouldFire(false, true), false);
});
