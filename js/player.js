(function (global) {
  const PLAYER_WIDTH = 30;
  const PLAYER_HEIGHT = 30;
  const PLAYER_SPEED = 240;
  const BOTTOM_MARGIN = 40;
  const INVULNERABILITY_DURATION_MS = 2000;
  const BLINK_INTERVAL_MS = 120;

  function createPlayer(gameWidth, gameHeight) {
    return {
      x: (gameWidth - PLAYER_WIDTH) / 2,
      y: gameHeight - BOTTOM_MARGIN - PLAYER_HEIGHT,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      speed: PLAYER_SPEED,
      invulnerable: false,
      invulnerableElapsedMs: 0,
      blinkVisible: true,
    };
  }

  function respawnPlayer(gameWidth, gameHeight) {
    return {
      ...createPlayer(gameWidth, gameHeight),
      invulnerable: true,
      invulnerableElapsedMs: 0,
      blinkVisible: true,
    };
  }

  function updateInvulnerability(player, deltaMs) {
    if (!player.invulnerable) return player;

    const elapsed = player.invulnerableElapsedMs + deltaMs;
    if (elapsed >= INVULNERABILITY_DURATION_MS) {
      return { ...player, invulnerable: false, invulnerableElapsedMs: 0, blinkVisible: true };
    }

    const blinkVisible = Math.floor(elapsed / BLINK_INTERVAL_MS) % 2 === 0;
    return { ...player, invulnerableElapsedMs: elapsed, blinkVisible };
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

  global.Player = {
    PLAYER_WIDTH,
    PLAYER_HEIGHT,
    PLAYER_SPEED,
    INVULNERABILITY_DURATION_MS,
    BLINK_INTERVAL_MS,
    createPlayer,
    clampPlayer,
    movePlayer,
    respawnPlayer,
    updateInvulnerability,
  };
})(typeof window !== 'undefined' ? window : globalThis);
