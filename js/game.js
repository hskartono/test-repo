(function () {
  const { GAME_WIDTH, GAME_HEIGHT, createGameState, computeCanvasLayout } = window.GameState;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;

  const gameState = createGameState();
  gameState.player = window.Player.createPlayer(GAME_WIDTH, GAME_HEIGHT);
  window.__gameState = gameState;
  window.__frameCount = 0;

  const input = window.InputState.createKeyboardInput();

  function resizeCanvasToFit() {
    const layout = computeCanvasLayout(window.innerWidth, window.innerHeight, GAME_WIDTH, GAME_HEIGHT);
    canvas.style.width = `${layout.width}px`;
    canvas.style.height = `${layout.height}px`;
    canvas.style.marginLeft = `${layout.offsetX}px`;
    canvas.style.marginTop = `${layout.offsetY}px`;
  }

  function drawPlayer(player) {
    const centerX = player.x + player.width / 2;
    ctx.fillStyle = '#00ff99';
    ctx.beginPath();
    ctx.moveTo(centerX, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.closePath();
    ctx.fill();
  }

  function render(timestamp) {
    if (!gameState.running) return;

    const dt = gameState.lastTimestamp ? (timestamp - gameState.lastTimestamp) / 1000 : 0;
    gameState.lastTimestamp = timestamp;

    gameState.player = window.Player.movePlayer(gameState.player, input, dt, GAME_WIDTH, GAME_HEIGHT);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPlayer(gameState.player);

    window.__frameCount += 1;
    requestAnimationFrame(render);
  }

  window.addEventListener('resize', resizeCanvasToFit);
  resizeCanvasToFit();
  requestAnimationFrame(render);
})();
