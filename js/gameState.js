(function (global) {
  const GAME_WIDTH = 480;
  const GAME_HEIGHT = 640;

  function createGameState() {
    return {
      running: true,
      lastTimestamp: null,
      enemies: [],
      timeSinceLastSpawn: 0,
    };
  }

  function computeCanvasLayout(viewportW, viewportH, gameW, gameH) {
    const scale = Math.min(viewportW / gameW, viewportH / gameH);
    const width = gameW * scale;
    const height = gameH * scale;
    const offsetX = (viewportW - width) / 2;
    const offsetY = (viewportH - height) / 2;
    return { width, height, offsetX, offsetY };
  }

  global.GameState = { GAME_WIDTH, GAME_HEIGHT, createGameState, computeCanvasLayout };
})(typeof window !== 'undefined' ? window : globalThis);
