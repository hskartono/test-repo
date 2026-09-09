import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../../js/gameOver.js');
const { STARTING_LIVES, applyLivesLoss } = globalThis.GameOver;

test('STARTING_LIVES is 3', () => {
  assert.equal(STARTING_LIVES, 3);
});

test('applyLivesLoss decrements lives by 1 and reports gameOver false when lives remain', () => {
  const result = applyLivesLoss(3);
  assert.equal(result.lives, 2);
  assert.equal(result.gameOver, false);
});

test('applyLivesLoss decrements from 1 to 0 and reports gameOver true', () => {
  const result = applyLivesLoss(1);
  assert.equal(result.lives, 0);
  assert.equal(result.gameOver, true);
});

test('applyLivesLoss floors at 0 and keeps reporting gameOver true when already at 0', () => {
  const result = applyLivesLoss(0);
  assert.equal(result.lives, 0);
  assert.equal(result.gameOver, true);
});
