(function () {
  const { GAME_WIDTH, GAME_HEIGHT, createGameState, computeCanvasLayout } = window.GameState;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;

  const gameState = createGameState();
  window.__gameState = gameState;
  window.__frameCount = 0;

  function resizeCanvasToFit() {
    const layout = computeCanvasLayout(window.innerWidth, window.innerHeight, GAME_WIDTH, GAME_HEIGHT);
    canvas.style.width = `${layout.width}px`;
    canvas.style.height = `${layout.height}px`;
    canvas.style.marginLeft = `${layout.offsetX}px`;
    canvas.style.marginTop = `${layout.offsetY}px`;
  }

  function render(timestamp) {
    if (!gameState.running) return;

    const deltaMs = gameState.lastTimestamp === null ? 0 : timestamp - gameState.lastTimestamp;
    gameState.lastTimestamp = timestamp;

    // Move existing enemies by this frame's delta first, then spawn new ones -
    // otherwise a large catch-up delta (e.g. after the tab was backgrounded)
    // would immediately move freshly spawned enemies off-screen in the same tick.
    gameState.enemies = window.Enemies.updateEnemies(gameState.enemies, deltaMs, window.Enemies.ENEMY_SPEED, GAME_HEIGHT);
    window.Enemies.stepEnemySpawner(
      gameState,
      deltaMs,
      window.Enemies.SPAWN_INTERVAL_MS,
      GAME_WIDTH,
      window.Enemies.ENEMY_RADIUS
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'red';
    for (const enemy of gameState.enemies) {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    window.__frameCount += 1;
    requestAnimationFrame(render);
  }

  window.addEventListener('resize', resizeCanvasToFit);
  resizeCanvasToFit();
  requestAnimationFrame(render);
})();
