(function (global) {
  const KEY_MAP = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    Space: 'shoot',
    KeyB: 'bomb',
  };

  function createKeyboardInput(target) {
    const eventTarget = target || global;
    const state = { up: false, down: false, left: false, right: false, shoot: false, bomb: false };

    eventTarget.addEventListener('keydown', (event) => {
      const direction = KEY_MAP[event.code];
      if (direction) state[direction] = true;
    });

    eventTarget.addEventListener('keyup', (event) => {
      const direction = KEY_MAP[event.code];
      if (direction) state[direction] = false;
    });

    return state;
  }

  global.InputState = { createKeyboardInput };
})(typeof window !== 'undefined' ? window : globalThis);
