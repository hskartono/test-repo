(function () {
  var ENEMY_SPAWN_INTERVAL_MS = 1000;
  var ENEMY_SPEED_PX_PER_SEC = 150;
  var ENEMY_RADIUS = 15;
  var MAX_FRAME_DT_MS = 250;

  var gameState = {
    canvas: null,
    ctx: null,
    width: 480,
    height: 640,
    running: true,
    lastTimestamp: 0,
    enemies: [],
    enemySpawnTimer: 0
  };

  function resizeCanvas() {
    var aspectRatio = gameState.width / gameState.height;
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;
    var viewportAspectRatio = viewportWidth / viewportHeight;

    var displayWidth;
    var displayHeight;
    if (viewportAspectRatio > aspectRatio) {
      displayHeight = viewportHeight;
      displayWidth = displayHeight * aspectRatio;
    } else {
      displayWidth = viewportWidth;
      displayHeight = displayWidth / aspectRatio;
    }

    gameState.canvas.style.width = displayWidth + 'px';
    gameState.canvas.style.height = displayHeight + 'px';
  }

  function spawnEnemy() {
    gameState.enemies.push({
      x: Math.random() * (gameState.width - 2 * ENEMY_RADIUS) + ENEMY_RADIUS,
      y: -ENEMY_RADIUS,
      radius: ENEMY_RADIUS
    });
  }

  function updateEnemies(dt) {
    gameState.enemySpawnTimer += dt;
    while (gameState.enemySpawnTimer >= ENEMY_SPAWN_INTERVAL_MS) {
      spawnEnemy();
      gameState.enemySpawnTimer -= ENEMY_SPAWN_INTERVAL_MS;
    }

    var dtSeconds = dt / 1000;
    gameState.enemies.forEach(function (enemy) {
      enemy.y += ENEMY_SPEED_PX_PER_SEC * dtSeconds;
    });

    gameState.enemies = gameState.enemies.filter(function (enemy) {
      return enemy.y - enemy.radius <= gameState.height;
    });
  }

  function drawEnemies() {
    var ctx = gameState.ctx;
    ctx.fillStyle = '#e33';
    gameState.enemies.forEach(function (enemy) {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function render(timestamp) {
    var ctx = gameState.ctx;
    ctx.clearRect(0, 0, gameState.width, gameState.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, gameState.width, gameState.height);

    var dt = gameState.lastTimestamp ? timestamp - gameState.lastTimestamp : 0;
    // Clamp so a backgrounded/suspended tab's huge dt on resume can't
    // trigger a synchronous burst of catch-up spawns in updateEnemies.
    dt = Math.min(dt, MAX_FRAME_DT_MS);
    updateEnemies(dt);
    drawEnemies();

    gameState.lastTimestamp = timestamp;

    if (gameState.running) {
      requestAnimationFrame(render);
    }
  }

  function init() {
    gameState.canvas = document.getElementById('gameCanvas');
    gameState.ctx = gameState.canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    requestAnimationFrame(render);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
