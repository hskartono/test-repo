import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../../js/background.js');
const { createBackgroundState, updateScroll, stepPlanetSpawner, updatePlanets } = globalThis.Background;

const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;
const PLANET_KEYS = ['planet1', 'planet2', 'planet3'];

test('createBackgroundState starts at scroll 0 with no planets', () => {
  const state = createBackgroundState();
  assert.equal(state.scrollY, 0);
  assert.deepEqual(state.planets, []);
});

test('updateScroll increases scrollY by speed * dt', () => {
  const state = createBackgroundState();
  const updated = updateScroll(state, 1, 40, 256);
  assert.equal(updated.scrollY, 40);
});

test('updateScroll wraps around the tile size instead of growing unbounded', () => {
  const state = { ...createBackgroundState(), scrollY: 250 };
  const updated = updateScroll(state, 1, 40, 256);
  assert.equal(updated.scrollY, (250 + 40) % 256);
  assert.ok(updated.scrollY < 256);
});

test('stepPlanetSpawner spawns exactly one planet once the randomized interval elapses', () => {
  const state = createBackgroundState();
  const rng = () => 0; // minimizes both the interval and spawn position/key roll
  stepPlanetSpawner(state, 8000, 8000, 15000, GAME_WIDTH, PLANET_KEYS, rng);
  assert.equal(state.planets.length, 1);
  assert.equal(state.planets[0].key, PLANET_KEYS[0]);
});

test('stepPlanetSpawner spawns nothing before the interval elapses', () => {
  const state = createBackgroundState();
  const rng = () => 0;
  stepPlanetSpawner(state, 100, 8000, 15000, GAME_WIDTH, PLANET_KEYS, rng);
  assert.equal(state.planets.length, 0);
});

test('stepPlanetSpawner can spawn multiple planets across a long delta', () => {
  const state = createBackgroundState();
  const rng = () => 0; // interval collapses to the min (8000ms) every time
  stepPlanetSpawner(state, 8000 * 3, 8000, 8000, GAME_WIDTH, PLANET_KEYS, rng);
  assert.equal(state.planets.length, 3);
});

test('updatePlanets moves planets downward by speed * dt', () => {
  const planets = [{ x: 100, y: 0, size: 60, key: 'planet1' }];
  const updated = updatePlanets(planets, 1, 20, GAME_HEIGHT);
  assert.equal(updated[0].y, 20);
});

test('updatePlanets removes planets that have scrolled past the bottom edge', () => {
  const planets = [{ x: 100, y: GAME_HEIGHT + 100, size: 60, key: 'planet1' }];
  const updated = updatePlanets(planets, 1, 20, GAME_HEIGHT);
  assert.equal(updated.length, 0);
});
