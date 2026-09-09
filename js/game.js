(function () {
  const { GAME_WIDTH, GAME_HEIGHT, createGameState, computeCanvasLayout } = window.GameState;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;

  const gameOverScreen = document.getElementById('game-over-screen');
  const finalScoreEl = document.getElementById('final-score');
  const restartButton = document.getElementById('restart-button');

  window.Assets.loadAll(document);

  const gameState = createGameState();
  gameState.player = window.Player.createPlayer(GAME_WIDTH, GAME_HEIGHT);
  gameState.bullets = [];
  gameState.score = 0;
  gameState.lives = window.GameOver.STARTING_LIVES;
  gameState.explosions = [];
  gameState.background = window.Background.createBackgroundState();
  window.__gameState = gameState;
  window.__frameCount = 0;

  const input = window.InputState.createKeyboardInput();
  let shootHeldLastFrame = false;

  window.addEventListener('keydown', () => window.Sfx.unlock(), { once: true });

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
    gameState.explosions = [];
    gameState.background = window.Background.createBackgroundState();
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

  function drawAfterburner(player, timestamp) {
    const frames = window.Assets.FIRE_FRAMES;
    const frameKey = frames[Math.floor(timestamp / 60) % frames.length];
    const img = window.Assets.get(frameKey);
    const flameWidth = player.width * 0.4;
    const flameHeight = player.height * 0.6;
    const flameX = player.x + player.width / 2 - flameWidth / 2;
    const flameY = player.y + player.height - flameHeight * 0.3;

    if (window.Assets.isUsable(img)) {
      ctx.drawImage(img, flameX, flameY, flameWidth, flameHeight);
    } else {
      ctx.fillStyle = 'rgba(255, 150, 0, 0.8)';
      ctx.beginPath();
      ctx.moveTo(flameX, flameY);
      ctx.lineTo(flameX + flameWidth, flameY);
      ctx.lineTo(flameX + flameWidth / 2, flameY + flameHeight);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawPlayer(player, timestamp) {
    if (player.invulnerable && !player.blinkVisible) return;

    const sprite = window.Assets.get('playerShip');
    if (window.Assets.isUsable(sprite)) {
      ctx.drawImage(sprite, player.x, player.y, player.width, player.height);
    } else {
      const centerX = player.x + player.width / 2;
      ctx.fillStyle = '#00ff99';
      ctx.beginPath();
      ctx.moveTo(centerX, player.y);
      ctx.lineTo(player.x + player.width, player.y + player.height);
      ctx.lineTo(player.x, player.y + player.height);
      ctx.closePath();
      ctx.fill();
    }

    drawAfterburner(player, timestamp);
  }

  function drawEnemies(enemies) {
    const sprite = window.Assets.get('enemyShip');
    enemies.forEach((enemy) => {
      if (window.Assets.isUsable(sprite)) {
        ctx.drawImage(sprite, enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius * 2, enemy.radius * 2);
      } else {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function drawBullets(bullets) {
    const sprite = window.Assets.get('bullet');
    bullets.forEach((bullet) => {
      if (window.Assets.isUsable(sprite)) {
        ctx.drawImage(sprite, bullet.x, bullet.y, bullet.width, bullet.height);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      }
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
      window.Sfx.play('shoot');
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

    gameState.background = window.Background.updateScroll(
      gameState.background,
      dt,
      window.Background.SCROLL_SPEED,
      window.Background.TILE_SIZE
    );
    window.Background.stepPlanetSpawner(
      gameState.background,
      deltaMs,
      window.Background.PLANET_MIN_INTERVAL_MS,
      window.Background.PLANET_MAX_INTERVAL_MS,
      GAME_WIDTH,
      window.Assets.PLANET_KEYS
    );
    gameState.background.planets = window.Background.updatePlanets(
      gameState.background.planets,
      dt,
      window.Background.PLANET_SPEED,
      GAME_HEIGHT
    );

    const bulletHits = window.Collisions.resolveBulletEnemyCollisions(gameState.bullets, gameState.enemies);
    gameState.bullets = bulletHits.bullets;
    gameState.enemies = bulletHits.enemies;
    gameState.score += bulletHits.hits;
    bulletHits.destroyedEnemies.forEach((enemy) => {
      gameState.explosions.push(window.Explosions.spawnExplosion(enemy.x, enemy.y));
      window.Sfx.play('explosion');
    });

    if (window.Collisions.shouldResolvePlayerCollision(gameState.player)) {
      const playerHit = window.Collisions.resolvePlayerEnemyCollisions(gameState.player, gameState.enemies);
      gameState.enemies = playerHit.enemies;

      if (playerHit.hit) {
        const hitPlayer = gameState.player;
        gameState.explosions.push(
          window.Explosions.spawnExplosion(hitPlayer.x + hitPlayer.width / 2, hitPlayer.y + hitPlayer.height / 2)
        );
        window.Sfx.play('explosion');

        const livesResult = window.GameOver.applyLivesLoss(gameState.lives);
        gameState.lives = livesResult.lives;
        if (livesResult.gameOver) {
          triggerGameOver();
        } else {
          gameState.player = window.Player.respawnPlayer(GAME_WIDTH, GAME_HEIGHT);
        }
      }
    }

    gameState.player = window.Player.updateInvulnerability(gameState.player, deltaMs);
    gameState.explosions = window.Explosions.updateExplosions(gameState.explosions, dt);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    window.Background.drawBackground(
      ctx,
      gameState.background,
      window.Assets.get('background'),
      GAME_WIDTH,
      GAME_HEIGHT,
      (key) => window.Assets.get(key)
    );
    drawPlayer(gameState.player, timestamp);
    drawBullets(gameState.bullets);
    drawEnemies(gameState.enemies);
    window.Explosions.drawExplosions(ctx, gameState.explosions, (frameIndex) =>
      window.Assets.get(window.Assets.EXPLOSION_FRAMES[frameIndex])
    );

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
