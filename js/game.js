(function () {
  const { GAME_WIDTH, GAME_HEIGHT, createGameState, computeCanvasLayout } = window.GameState;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;

  const gameOverScreen = document.getElementById('game-over-screen');
  const finalScoreEl = document.getElementById('final-score');
  const restartButton = document.getElementById('restart-button');

  const gameState = createGameState();
  gameState.player = window.Player.createPlayer(GAME_WIDTH, GAME_HEIGHT);
  gameState.bullets = [];
  gameState.score = 0;
  gameState.lives = window.GameOver.STARTING_LIVES;
  window.__gameState = gameState;
  window.__frameCount = 0;

  const input = window.InputState.createKeyboardInput();
  let shootHeldLastFrame = false;

  function triggerGameOver() {
    gameState.running = false;
    finalScoreEl.textContent = `Score: ${gameState.score}`;
    gameOverScreen.classList.remove('hidden');
  }

  function resetGame() {
    gameState.player = window.Player.createPlayer(GAME_WIDTH, GAME_HEIGHT);
    gameState.bullets = [];
    gameState.enemies = [];
    gameState.score = 0;
    gameState.lives = window.GameOver.STARTING_LIVES;
    gameState.timeSinceLastSpawn = 0;
    gameState.lastTimestamp = null;
    gameState.running = true;
    gameOverScreen.classList.add('hidden');
    requestAnimationFrame(render);
  }

  restartButton.addEventListener('click', resetGame);

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

  function drawBullets(bullets) {
    ctx.fillStyle = '#ffffff';
    bullets.forEach((bullet) => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
  }

  function drawScore(score) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${score}`, 10, 10);
  }

  function drawLives(lives) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(`Lives: ${lives}`, 10, 34);
  }

  function render(timestamp) {
    if (!gameState.running) return;

    const deltaMs = gameState.lastTimestamp === null ? 0 : timestamp - gameState.lastTimestamp;
    const dt = deltaMs / 1000;
    gameState.lastTimestamp = timestamp;

    gameState.player = window.Player.movePlayer(gameState.player, input, dt, GAME_WIDTH, GAME_HEIGHT);

    if (window.Bullets.shouldFire(input.shoot, shootHeldLastFrame)) {
      gameState.bullets = window.Bullets.fireBullet(gameState.bullets, gameState.player);
    }
    shootHeldLastFrame = input.shoot;
    gameState.bullets = window.Bullets.updateBullets(gameState.bullets, dt);

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

    const bulletHits = window.Collisions.resolveBulletEnemyCollisions(gameState.bullets, gameState.enemies);
    gameState.bullets = bulletHits.bullets;
    gameState.enemies = bulletHits.enemies;
    gameState.score += bulletHits.hits;

    const playerHit = window.Collisions.resolvePlayerEnemyCollisions(gameState.player, gameState.enemies);
    gameState.enemies = playerHit.enemies;

    if (playerHit.hit) {
      const livesResult = window.GameOver.applyLivesLoss(gameState.lives);
      gameState.lives = livesResult.lives;
      if (livesResult.gameOver) {
        triggerGameOver();
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPlayer(gameState.player);
    drawBullets(gameState.bullets);

    ctx.fillStyle = 'red';
    for (const enemy of gameState.enemies) {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    drawScore(gameState.score);
    drawLives(gameState.lives);

    window.__frameCount += 1;
    if (gameState.running) {
      requestAnimationFrame(render);
    }
  }

  window.addEventListener('resize', resizeCanvasToFit);
  resizeCanvasToFit();
  requestAnimationFrame(render);
})();
