import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../../js/bomb.js');
const { createBombState, awardBombsForKills, shouldLaunchBomb, launchBomb, detonateBomb } = globalThis.Bomb;

test('createBombState starts with 3 bombs and 0 kill progress', () => {
  assert.deepEqual(createBombState(), { count: 3, killProgress: 0 });
});

test('awardBombsForKills grants exactly 1 bomb after a single call with killCount 10 and resets progress', () => {
  const result = awardBombsForKills({ count: 3, killProgress: 0 }, 10);
  assert.equal(result.count, 4);
  assert.equal(result.killProgress, 0);
});

test('awardBombsForKills accumulates partial progress across calls and grants the bomb once the total reaches 10', () => {
  const afterFirst = awardBombsForKills({ count: 3, killProgress: 0 }, 6);
  assert.equal(afterFirst.count, 3);
  assert.equal(afterFirst.killProgress, 6);

  const afterSecond = awardBombsForKills(afterFirst, 4);
  assert.equal(afterSecond.count, 4);
  assert.equal(afterSecond.killProgress, 0);
});

test('awardBombsForKills grants multiple bombs in one call when killCount spans more than one threshold', () => {
  const result = awardBombsForKills({ count: 3, killProgress: 0 }, 25);
  assert.equal(result.count, 5);
  assert.equal(result.killProgress, 5);
});

test('awardBombsForKills with killCount 0 leaves count and progress unchanged', () => {
  const result = awardBombsForKills({ count: 3, killProgress: 4 }, 0);
  assert.equal(result.count, 3);
  assert.equal(result.killProgress, 4);
});

test('awardBombsForKills does not mutate its input bombState', () => {
  const bombState = { count: 3, killProgress: 4 };
  awardBombsForKills(bombState, 10);
  assert.deepEqual(bombState, { count: 3, killProgress: 4 });
});

test('launchBomb decrements count by 1 and reports launched true when count is greater than 0', () => {
  const result = launchBomb({ count: 3, killProgress: 0 });
  assert.equal(result.bombState.count, 2);
  assert.equal(result.launched, true);
});

test('launchBomb leaves count at 0 and reports launched false when count is already 0', () => {
  const result = launchBomb({ count: 0, killProgress: 0 });
  assert.equal(result.bombState.count, 0);
  assert.equal(result.launched, false);
});

test('launchBomb does not mutate its input bombState', () => {
  const bombState = { count: 3, killProgress: 0 };
  launchBomb(bombState);
  assert.deepEqual(bombState, { count: 3, killProgress: 0 });
});

test('detonateBomb clears enemies and bullets and reports the destroyed enemies', () => {
  const enemies = [{ x: 10, y: 10, radius: 15 }, { x: 200, y: 200, radius: 15 }];
  const bullets = [{ x: 5, y: 5, width: 4, height: 12 }];
  const result = detonateBomb(enemies, bullets);
  assert.deepEqual(result.enemies, []);
  assert.deepEqual(result.bullets, []);
  assert.deepEqual(result.destroyedEnemies, enemies);
});

test('detonateBomb with empty enemies and bullets returns empty arrays and no destroyed enemies', () => {
  const result = detonateBomb([], []);
  assert.deepEqual(result.enemies, []);
  assert.deepEqual(result.bullets, []);
  assert.deepEqual(result.destroyedEnemies, []);
});

test('detonateBomb does not mutate its input arrays', () => {
  const enemies = [{ x: 10, y: 10, radius: 15 }];
  const bullets = [{ x: 5, y: 5, width: 4, height: 12 }];
  detonateBomb(enemies, bullets);
  assert.equal(enemies.length, 1);
  assert.equal(bullets.length, 1);
});

test('shouldLaunchBomb is true only on the false->true transition', () => {
  assert.equal(shouldLaunchBomb(true, false), true);
  assert.equal(shouldLaunchBomb(true, true), false);
  assert.equal(shouldLaunchBomb(false, false), false);
  assert.equal(shouldLaunchBomb(false, true), false);
});
