(function (global) {
  const PLAYER_WIDTH = 30;
  const PLAYER_HEIGHT = 30;
  const PLAYER_SPEED = 240;
  const BOTTOM_MARGIN = 40;

  function createPlayer(gameWidth, gameHeight) {
    return {
      x: (gameWidth - PLAYER_WIDTH) / 2,
      y: gameHeight - BOTTOM_MARGIN - PLAYER_HEIGHT,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      speed: PLAYER_SPEED,
    };
  }

  function clampPlayer(player, gameWidth, gameHeight) {
    const maxX = gameWidth - player.width;
    const maxY = gameHeight - player.height;
    return {
      ...player,
      x: Math.min(Math.max(player.x, 0), maxX),
      y: Math.min(Math.max(player.y, 0), maxY),
    };
  }

  function movePlayer(player, input, dt, gameWidth, gameHeight) {
    const distance = player.speed * dt;
    let x = player.x;
    let y = player.y;

    if (input.left) x -= distance;
    if (input.right) x += distance;
    if (input.up) y -= distance;
    if (input.down) y += distance;

    return clampPlayer({ ...player, x, y }, gameWidth, gameHeight);
  }

  global.Player = { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED, createPlayer, clampPlayer, movePlayer };
})(typeof window !== 'undefined' ? window : globalThis);
