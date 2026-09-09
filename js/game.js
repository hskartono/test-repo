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

    gameState.lastTimestamp = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    window.__frameCount += 1;
    requestAnimationFrame(render);
  }

  window.addEventListener('resize', resizeCanvasToFit);
  resizeCanvasToFit();
  requestAnimationFrame(render);
})();
