(function () {
  var MAX_DT = 0.1;
  var ENEMY_SPAWN_INTERVAL = 1;
  var ENEMY_SPEED_PX_PER_SEC = 150;
  var ENEMY_RADIUS = 15;

  var gameState = {
    canvas: null,
    ctx: null,
    width: 480,
    height: 640,
    running: true,
    lastTimestamp: 0,
    enemies: [],
    enemySpawnTimer: 0,
    score: 0
  };

  var player = {
    x: gameState.width / 2,
    y: gameState.height - 40,
    width: 24,
    height: 28,
    speed: 220
  };

  var bullets = [];
  var BULLET_SPEED = 480;
  var BULLET_WIDTH = 4;
  var BULLET_HEIGHT = 12;
  var FIRE_CODE = 'Space';

  var keys = {};

  var DIRECTION_CODES = {
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD']
  };

  var HANDLED_CODES = {};
  Object.keys(DIRECTION_CODES).forEach(function (direction) {
    DIRECTION_CODES[direction].forEach(function (code) {
      HANDLED_CODES[code] = true;
    });
  });
  HANDLED_CODES[FIRE_CODE] = true;

  function spawnBullet() {
    bullets.push({
      x: player.x,
      y: player.y - player.height / 2,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT
    });
  }

  function handleKeyDown(event) {
    if (HANDLED_CODES[event.code]) {
      if (event.code === FIRE_CODE && !keys[event.code]) {
        spawnBullet();
      }
      keys[event.code] = true;
      event.preventDefault();
    }
  }

  function handleKeyUp(event) {
    if (HANDLED_CODES[event.code]) {
      keys[event.code] = false;
      event.preventDefault();
    }
  }

  function clearKeys() {
    keys = {};
  }

  function isDirectionActive(direction) {
    return DIRECTION_CODES[direction].some(function (code) {
      return !!keys[code];
    });
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
    while (gameState.enemySpawnTimer >= ENEMY_SPAWN_INTERVAL) {
      spawnEnemy();
      gameState.enemySpawnTimer -= ENEMY_SPAWN_INTERVAL;
    }

    gameState.enemies.forEach(function (enemy) {
      enemy.y += ENEMY_SPEED_PX_PER_SEC * dt;
    });

    gameState.enemies = gameState.enemies.filter(function (enemy) {
      return enemy.y - enemy.radius <= gameState.height;
    });
  }

  function update(dt) {
    dt = Math.min(dt, MAX_DT);

    var vx = (isDirectionActive('right') ? 1 : 0) - (isDirectionActive('left') ? 1 : 0);
    var vy = (isDirectionActive('down') ? 1 : 0) - (isDirectionActive('up') ? 1 : 0);

    if (vx !== 0 && vy !== 0) {
      var norm = Math.SQRT1_2;
      vx *= norm;
      vy *= norm;
    }

    player.x += vx * player.speed * dt;
    player.y += vy * player.speed * dt;

    var halfWidth = player.width / 2;
    var halfHeight = player.height / 2;
    player.x = Math.min(Math.max(player.x, halfWidth), gameState.width - halfWidth);
    player.y = Math.min(Math.max(player.y, halfHeight), gameState.height - halfHeight);

    updateBullets(dt);
    updateEnemies(dt);
    checkCollisions();
  }

  function circleRectCollide(circle, rect) {
    var halfWidth = rect.width / 2;
    var halfHeight = rect.height / 2;
    var closestX = Math.min(Math.max(circle.x, rect.x - halfWidth), rect.x + halfWidth);
    var closestY = Math.min(Math.max(circle.y, rect.y - halfHeight), rect.y + halfHeight);
    var dx = circle.x - closestX;
    var dy = circle.y - closestY;
    return dx * dx + dy * dy <= circle.radius * circle.radius;
  }

  function circleCollide(a, aRadius, b, bRadius) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var radii = aRadius + bRadius;
    return dx * dx + dy * dy <= radii * radii;
  }

  function checkCollisions() {
    var hitBullets = [];
    var hitEnemies = [];

    gameState.enemies.forEach(function (enemy, enemyIndex) {
      for (var i = 0; i < bullets.length; i++) {
        if (hitBullets[i]) {
          continue;
        }
        if (circleRectCollide(enemy, bullets[i])) {
          hitBullets[i] = true;
          hitEnemies[enemyIndex] = true;
          gameState.score++;
          break;
        }
      }
    });

    var playerRadius = (player.width + player.height) / 4;
    gameState.enemies.forEach(function (enemy, enemyIndex) {
      if (hitEnemies[enemyIndex]) {
        return;
      }
      if (circleCollide(player, playerRadius, enemy, enemy.radius)) {
        hitEnemies[enemyIndex] = true;
      }
    });

    bullets = bullets.filter(function (bullet, index) {
      return !hitBullets[index];
    });
    gameState.enemies = gameState.enemies.filter(function (enemy, index) {
      return !hitEnemies[index];
    });
  }

  function updateBullets(dt) {
    bullets.forEach(function (bullet) {
      bullet.y -= BULLET_SPEED * dt;
    });

    bullets = bullets.filter(function (bullet) {
      return bullet.y + bullet.height / 2 >= 0;
    });
  }

  function drawPlayer(ctx) {
    var halfWidth = player.width / 2;
    var halfHeight = player.height / 2;

    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - halfHeight);
    ctx.lineTo(player.x - halfWidth, player.y + halfHeight);
    ctx.lineTo(player.x + halfWidth, player.y + halfHeight);
    ctx.closePath();
    ctx.fill();
  }

  function drawBullets(ctx) {
    ctx.fillStyle = '#ff0';
    bullets.forEach(function (bullet) {
      ctx.fillRect(
        bullet.x - bullet.width / 2,
        bullet.y - bullet.height / 2,
        bullet.width,
        bullet.height
      );
    });
  }

  function drawEnemies(ctx) {
    ctx.fillStyle = '#e33';
    gameState.enemies.forEach(function (enemy) {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawScore(ctx) {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('Score: ' + gameState.score, 8, 8);
  }

  function draw() {
    var ctx = gameState.ctx;
    ctx.clearRect(0, 0, gameState.width, gameState.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, gameState.width, gameState.height);

    drawPlayer(ctx);
    drawBullets(ctx);
    drawEnemies(ctx);
    drawScore(ctx);
  }

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

  function render(timestamp) {
    var dt = gameState.lastTimestamp ? (timestamp - gameState.lastTimestamp) / 1000 : 0;
    gameState.lastTimestamp = timestamp;

    update(dt);
    draw();

    if (gameState.running) {
      requestAnimationFrame(render);
    }
  }

  function init() {
    gameState.canvas = document.getElementById('gameCanvas');
    gameState.ctx = gameState.canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearKeys);

    requestAnimationFrame(render);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
