import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../../js/splash.js');
const { PHASES, INTRO_DURATION_MS, FADE_DURATION_MS, GAME_OVER_RETURN_DELAY_MS, createSplashState } =
  globalThis.Splash;

test('PHASES exposes the intro and title phase names', () => {
  assert.equal(PHASES.INTRO, 'intro');
  assert.equal(PHASES.TITLE, 'title');
});

test('timing constants are positive numbers', () => {
  assert.equal(typeof INTRO_DURATION_MS, 'number');
  assert.ok(INTRO_DURATION_MS > 0);
  assert.equal(typeof FADE_DURATION_MS, 'number');
  assert.ok(FADE_DURATION_MS > 0);
  assert.equal(typeof GAME_OVER_RETURN_DELAY_MS, 'number');
  assert.ok(GAME_OVER_RETURN_DELAY_MS > 0);
});

test('createSplashState returns the intro phase by default', () => {
  assert.deepEqual(createSplashState(), { phase: PHASES.INTRO });
});
