import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis;
await import('../../js/input.js');
const { createKeyboardInput } = globalThis.InputState;

function dispatch(target, type, code) {
  const event = new Event(type);
  event.code = code;
  target.dispatchEvent(event);
}

test('createKeyboardInput starts with all directions and shoot false', () => {
  const target = new EventTarget();
  const state = createKeyboardInput(target);
  assert.deepEqual(state, { up: false, down: false, left: false, right: false, shoot: false, bomb: false });
});

test('ArrowUp/KeyW set and clear "up"', () => {
  const target = new EventTarget();
  const state = createKeyboardInput(target);

  dispatch(target, 'keydown', 'ArrowUp');
  assert.equal(state.up, true);
  dispatch(target, 'keyup', 'ArrowUp');
  assert.equal(state.up, false);

  dispatch(target, 'keydown', 'KeyW');
  assert.equal(state.up, true);
  dispatch(target, 'keyup', 'KeyW');
  assert.equal(state.up, false);
});

test('ArrowDown/KeyS set and clear "down"', () => {
  const target = new EventTarget();
  const state = createKeyboardInput(target);

  dispatch(target, 'keydown', 'ArrowDown');
  assert.equal(state.down, true);
  dispatch(target, 'keyup', 'ArrowDown');
  assert.equal(state.down, false);

  dispatch(target, 'keydown', 'KeyS');
  assert.equal(state.down, true);
  dispatch(target, 'keyup', 'KeyS');
  assert.equal(state.down, false);
});

test('ArrowLeft/KeyA set and clear "left"', () => {
  const target = new EventTarget();
  const state = createKeyboardInput(target);

  dispatch(target, 'keydown', 'ArrowLeft');
  assert.equal(state.left, true);
  dispatch(target, 'keyup', 'ArrowLeft');
  assert.equal(state.left, false);

  dispatch(target, 'keydown', 'KeyA');
  assert.equal(state.left, true);
  dispatch(target, 'keyup', 'KeyA');
  assert.equal(state.left, false);
});

test('ArrowRight/KeyD set and clear "right"', () => {
  const target = new EventTarget();
  const state = createKeyboardInput(target);

  dispatch(target, 'keydown', 'ArrowRight');
  assert.equal(state.right, true);
  dispatch(target, 'keyup', 'ArrowRight');
  assert.equal(state.right, false);

  dispatch(target, 'keydown', 'KeyD');
  assert.equal(state.right, true);
  dispatch(target, 'keyup', 'KeyD');
  assert.equal(state.right, false);
});

test('Space sets and clears "shoot"', () => {
  const target = new EventTarget();
  const state = createKeyboardInput(target);

  dispatch(target, 'keydown', 'Space');
  assert.equal(state.shoot, true);
  dispatch(target, 'keyup', 'Space');
  assert.equal(state.shoot, false);
});

test('KeyB sets and clears "bomb"', () => {
  const target = new EventTarget();
  const state = createKeyboardInput(target);

  dispatch(target, 'keydown', 'KeyB');
  assert.equal(state.bomb, true);
  dispatch(target, 'keyup', 'KeyB');
  assert.equal(state.bomb, false);
});

test('an unrelated key leaves all flags false', () => {
  const target = new EventTarget();
  const state = createKeyboardInput(target);

  dispatch(target, 'keydown', 'KeyQ');
  assert.deepEqual(state, { up: false, down: false, left: false, right: false, shoot: false, bomb: false });
});
