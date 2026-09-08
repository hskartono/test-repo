(function () {
  var MAX_DT = 0.1;
  var ENEMY_SPAWN_INTERVAL = 1;
  var ENEMY_SPEED_PX_PER_SEC = 150;
  var ENEMY_RADIUS = 15;
  var STARTING_LIVES = 3;
  var EXPLOSION_DURATION = 0.4;
  var INVULNERABLE_DURATION = 1.5;
  var BLINK_INTERVAL = 0.1;

  var PLAYER_SPRITE_WIDTH = 30;
  var PLAYER_SPRITE_HEIGHT = 23;
  var ENEMY_SPRITE_WIDTH = 32;
  var ENEMY_SPRITE_HEIGHT = 28;
  var ENEMY_SPAWN_MARGIN = Math.max(ENEMY_RADIUS, ENEMY_SPRITE_WIDTH / 2);
  var BULLET_SPRITE_HEIGHT = 24;
  var BULLET_FRAME_INTERVAL = 0.08;
  var BACKGROUND_TILE_SIZE = 256;
  var BACKGROUND_SCROLL_SPEED = 80;

  var ASSET_PATHS = {
    player: 'assets/player.png',
    enemy: 'assets/enemy.png',
    bulletFrames: ['assets/bullet-1.png', 'assets/bullet-2.png'],
    background: 'assets/background.png'
  };

  var sprites = {
    player: null,
    enemy: null,
    bulletFrames: [],
    background: null
  };

  var gameState = {
    canvas: null,
    ctx: null,
    width: 480,
    height: 640,
    running: true,
    lastTimestamp: 0,
    enemies: [],
    enemySpawnTimer: 0,
    explosions: [],
    backgroundY: 0,
    score: 0,
    lives: STARTING_LIVES,
    gameOverScreen: null,
    finalScoreEl: null,
    restartButton: null
  };

  var INITIAL_PLAYER_X = gameState.width / 2;
  var INITIAL_PLAYER_Y = gameState.height - 40;

  var player = {
    x: INITIAL_PLAYER_X,
    y: INITIAL_PLAYER_Y,
    width: 24,
    height: 28,
    speed: 220,
    invulnerable: false,
    invulnerableTimer: 0,
    blinkTimer: 0,
    visible: true
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

  function createExplosion(x, y) {
    return { x: x, y: y, age: 0 };
  }

  function advanceExplosions(explosions, dt, duration) {
    return explosions
      .map(function (explosion) {
        return { x: explosion.x, y: explosion.y, age: explosion.age + dt };
      })
      .filter(function (explosion) {
        return explosion.age < duration;
      });
  }

  function startInvulnerability(duration) {
    return { invulnerable: true, timer: duration, blinkTimer: 0, visible: true };
  }

  function advanceInvulnerability(state, dt, blinkInterval) {
    if (!state.invulnerable) {
      return state;
    }
    var timer = state.timer - dt;
    if (timer <= 0) {
      return { invulnerable: false, timer: 0, blinkTimer: 0, visible: true };
    }
    var blinkTimer = state.blinkTimer + dt;
    var visible = state.visible;
    while (blinkTimer >= blinkInterval) {
      blinkTimer -= blinkInterval;
      visible = !visible;
    }
    return { invulnerable: true, timer: timer, blinkTimer: blinkTimer, visible: visible };
  }

  function readInvulnerabilityState(target) {
    return {
      invulnerable: target.invulnerable,
      timer: target.invulnerableTimer,
      blinkTimer: target.blinkTimer,
      visible: target.visible
    };
  }

  function applyInvulnerabilityState(target, state) {
    target.invulnerable = state.invulnerable;
    target.invulnerableTimer = state.timer;
    target.blinkTimer = state.blinkTimer;
    target.visible = state.visible;
  }

  function createSoundManager(getAudioContextCtor) {
    var audioCtx = null;

    function getContext() {
      if (audioCtx) {
        return audioCtx;
      }
      var Ctor = getAudioContextCtor();
      if (!Ctor) {
        return null;
      }
      audioCtx = new Ctor();
      return audioCtx;
    }

    function playTone(frequency, duration, type) {
      try {
        var ctx = getContext();
        if (!ctx) {
          return;
        }
        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
          ctx.resume();
        }
        var oscillator = ctx.createOscillator();
        var gain = ctx.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + duration);
      } catch (e) {
        // Web Audio unavailable or blocked; fail silently.
      }
    }

    return {
      playShoot: function () {
        playTone(880, 0.08, 'square');
      },
      playEnemyHit: function () {
        playTone(220, 0.12, 'sawtooth');
      },
      playCollision: function () {
        playTone(110, 0.25, 'triangle');
      }
    };
  }

  var soundManager = createSoundManager(function () {
    return typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  });

  function spawnBullet() {
    bullets.push({
      x: player.x,
      y: player.y - player.height / 2,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
      frameIndex: 0,
      frameTimer: 0
    });
    soundManager.playShoot();
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
      x: Math.random() * (gameState.width - 2 * ENEMY_SPAWN_MARGIN) + ENEMY_SPAWN_MARGIN,
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

    gameState.explosions = advanceExplosions(gameState.explosions, dt, EXPLOSION_DURATION);

    if (player.invulnerable) {
      applyInvulnerabilityState(player, advanceInvulnerability(readInvulnerabilityState(player), dt, BLINK_INTERVAL));
    }

    gameState.backgroundY = (gameState.backgroundY + BACKGROUND_SCROLL_SPEED * dt) % BACKGROUND_TILE_SIZE;
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

  function loseLife() {
    gameState.lives = Math.max(0, gameState.lives - 1);
    if (gameState.lives === 0) {
      triggerGameOver();
    }
  }

  function triggerGameOver() {
    gameState.running = false;
    gameState.finalScoreEl.textContent = gameState.score;
    gameState.gameOverScreen.classList.remove('hidden');
  }

  function resetGame() {
    gameState.score = 0;
    gameState.lives = STARTING_LIVES;
    gameState.enemies = [];
    gameState.enemySpawnTimer = 0;
    gameState.explosions = [];
    gameState.backgroundY = 0;
    gameState.lastTimestamp = 0;
    bullets = [];
    player.x = INITIAL_PLAYER_X;
    player.y = INITIAL_PLAYER_Y;
    player.invulnerable = false;
    player.invulnerableTimer = 0;
    player.blinkTimer = 0;
    player.visible = true;
    clearKeys();
    gameState.gameOverScreen.classList.add('hidden');
    gameState.running = true;
    requestAnimationFrame(render);
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
          gameState.explosions.push(createExplosion(enemy.x, enemy.y));
          soundManager.playEnemyHit();
          break;
        }
      }
    });

    var playerRadius = (player.width + player.height) / 4;
    gameState.enemies.forEach(function (enemy, enemyIndex) {
      if (hitEnemies[enemyIndex] || !gameState.running || player.invulnerable) {
        return;
      }
      if (circleCollide(player, playerRadius, enemy, enemy.radius)) {
        hitEnemies[enemyIndex] = true;
        gameState.explosions.push(createExplosion(player.x, player.y));
        soundManager.playCollision();
        loseLife();
        if (gameState.lives > 0) {
          player.x = INITIAL_PLAYER_X;
          player.y = INITIAL_PLAYER_Y;
          applyInvulnerabilityState(player, startInvulnerability(INVULNERABLE_DURATION));
        }
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
      bullet.frameTimer += dt;
      while (bullet.frameTimer >= BULLET_FRAME_INTERVAL) {
        bullet.frameTimer -= BULLET_FRAME_INTERVAL;
        bullet.frameIndex = (bullet.frameIndex + 1) % sprites.bulletFrames.length;
      }
    });

    bullets = bullets.filter(function (bullet) {
      return bullet.y + bullet.height / 2 >= 0;
    });
  }

  function isSpriteReady(img) {
    return !!img && img.complete && img.naturalWidth > 0;
  }

  function drawPlayer(ctx) {
    if (!isSpriteReady(sprites.player)) {
      return;
    }
    if (player.invulnerable && !player.visible) {
      return;
    }
    ctx.drawImage(
      sprites.player,
      player.x - PLAYER_SPRITE_WIDTH / 2,
      player.y - PLAYER_SPRITE_HEIGHT / 2,
      PLAYER_SPRITE_WIDTH,
      PLAYER_SPRITE_HEIGHT
    );
  }

  var EXPLOSION_LAYERS = [
    { color: '255, 255, 255', radius: 6, growth: 18 },
    { color: '255, 200, 0', radius: 8, growth: 24 },
    { color: '255, 80, 0', radius: 10, growth: 30 }
  ];

  function drawExplosions(ctx) {
    gameState.explosions.forEach(function (explosion) {
      var progress = Math.min(1, explosion.age / EXPLOSION_DURATION);
      var alpha = 1 - progress;
      EXPLOSION_LAYERS.forEach(function (layer) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + layer.color + ', ' + alpha + ')';
        ctx.arc(explosion.x, explosion.y, layer.radius + progress * layer.growth, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  function drawBullets(ctx) {
    bullets.forEach(function (bullet) {
      var sprite = sprites.bulletFrames[bullet.frameIndex];
      if (!isSpriteReady(sprite)) {
        return;
      }
      var drawHeight = BULLET_SPRITE_HEIGHT;
      var drawWidth = drawHeight * (sprite.naturalWidth / sprite.naturalHeight);
      ctx.drawImage(
        sprite,
        bullet.x - drawWidth / 2,
        bullet.y - drawHeight / 2,
        drawWidth,
        drawHeight
      );
    });
  }

  function drawEnemies(ctx) {
    if (!isSpriteReady(sprites.enemy)) {
      return;
    }
    gameState.enemies.forEach(function (enemy) {
      ctx.drawImage(
        sprites.enemy,
        enemy.x - ENEMY_SPRITE_WIDTH / 2,
        enemy.y - ENEMY_SPRITE_HEIGHT / 2,
        ENEMY_SPRITE_WIDTH,
        ENEMY_SPRITE_HEIGHT
      );
    });
  }

  function drawBackground(ctx) {
    if (!isSpriteReady(sprites.background)) {
      return;
    }
    var startY = gameState.backgroundY - BACKGROUND_TILE_SIZE;
    for (var y = startY; y < gameState.height; y += BACKGROUND_TILE_SIZE) {
      for (var x = 0; x < gameState.width; x += BACKGROUND_TILE_SIZE) {
        ctx.drawImage(sprites.background, x, y, BACKGROUND_TILE_SIZE, BACKGROUND_TILE_SIZE);
      }
    }
  }

  function drawScore(ctx) {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('Score: ' + gameState.score, 8, 8);
  }

  function drawLives(ctx) {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'right';
    ctx.fillText('Lives: ' + gameState.lives, gameState.width - 8, 8);
    ctx.textAlign = 'left';
  }

  function draw() {
    var ctx = gameState.ctx;
    ctx.clearRect(0, 0, gameState.width, gameState.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, gameState.width, gameState.height);
    drawBackground(ctx);

    drawPlayer(ctx);
    drawBullets(ctx);
    drawEnemies(ctx);
    drawExplosions(ctx);
    drawScore(ctx);
    drawLives(ctx);
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
    gameState.gameOverScreen = document.getElementById('gameOverScreen');
    gameState.finalScoreEl = document.getElementById('finalScore');
    gameState.restartButton = document.getElementById('restartButton');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearKeys);
    gameState.restartButton.addEventListener('click', resetGame);

    requestAnimationFrame(render);
  }

  function loadAssets(onReady) {
    function queueImage(src, onLoaded) {
      var img = new Image();
      img.onload = onLoaded;
      img.onerror = onLoaded;
      img.src = src;
      return img;
    }

    var remaining = 3 + ASSET_PATHS.bulletFrames.length;

    function onSourceSettled() {
      remaining--;
      if (remaining === 0) {
        onReady();
      }
    }

    sprites.player = queueImage(ASSET_PATHS.player, onSourceSettled);
    sprites.enemy = queueImage(ASSET_PATHS.enemy, onSourceSettled);
    sprites.background = queueImage(ASSET_PATHS.background, onSourceSettled);
    ASSET_PATHS.bulletFrames.forEach(function (src, index) {
      sprites.bulletFrames[index] = queueImage(src, onSourceSettled);
    });
  }

  if (typeof window !== 'undefined') {
    var domReady = false;
    var assetsReady = false;

    var startWhenReady = function () {
      if (domReady && assetsReady) {
        init();
      }
    };

    window.addEventListener('DOMContentLoaded', function () {
      domReady = true;
      startWhenReady();
    });

    loadAssets(function () {
      assetsReady = true;
      startWhenReady();
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      circleCollide: circleCollide,
      circleRectCollide: circleRectCollide,
      createExplosion: createExplosion,
      advanceExplosions: advanceExplosions,
      startInvulnerability: startInvulnerability,
      advanceInvulnerability: advanceInvulnerability,
      readInvulnerabilityState: readInvulnerabilityState,
      applyInvulnerabilityState: applyInvulnerabilityState,
      createSoundManager: createSoundManager,
      EXPLOSION_DURATION: EXPLOSION_DURATION,
      INVULNERABLE_DURATION: INVULNERABLE_DURATION,
      BLINK_INTERVAL: BLINK_INTERVAL
    };
  }
})();
