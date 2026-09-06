(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const ENEMY_SPAWN_INTERVAL_MS = 1000;
  const ENEMY_RADIUS = 16;
  const ENEMY_SPEED_PX_PER_SEC = 120;
  const BULLET_WIDTH = 4;
  const BULLET_HEIGHT = 10;
  const BULLET_SPEED = 480; // px/sec
  const MAX_DT_MS = 100;

  const state = {
    width: canvas.width,
    height: canvas.height,
    lastTime: 0,
    enemies: [],
    spawnTimer: 0,
    bullets: [],
  };

  const player = {
    x: state.width / 2,
    y: state.height - 50,
    width: 24,
    height: 28,
    speed: 300, // px/sec
  };

  function spawnEnemy() {
    const x = ENEMY_RADIUS + Math.random() * (state.width - 2 * ENEMY_RADIUS);
    state.enemies.push({ x, y: -ENEMY_RADIUS, radius: ENEMY_RADIUS });
  }

  function spawnBullet() {
    state.bullets.push({
      x: player.x,
      y: player.y - player.height / 2,
    });
  }

  const KEY_DIRECTIONS = {
    arrowup: 'up',
    w: 'up',
    arrowdown: 'down',
    s: 'down',
    arrowleft: 'left',
    a: 'left',
    arrowright: 'right',
    d: 'right',
  };

  const activeDirections = new Set();

  function handleKeyEvent(e, isDown) {
    const direction = KEY_DIRECTIONS[e.key.toLowerCase()];
    if (!direction) return;
    e.preventDefault();
    if (isDown) {
      activeDirections.add(direction);
    } else {
      activeDirections.delete(direction);
    }
  }

  window.addEventListener('keydown', (e) => handleKeyEvent(e, true));
  window.addEventListener('keyup', (e) => handleKeyEvent(e, false));
  window.addEventListener('blur', () => activeDirections.clear());

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    e.preventDefault();
    if (e.repeat) return; // ignore OS auto-repeat; one press = one bullet
    spawnBullet();
  });

  function resize() {
    const dpr = window.devicePixelRatio || 1;

    canvas.width = state.width * dpr;
    canvas.height = state.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scale = Math.min(
      window.innerWidth / state.width,
      window.innerHeight / state.height
    );
    canvas.style.width = `${state.width * scale}px`;
    canvas.style.height = `${state.height * scale}px`;
  }

  function update(dt) {
    // Scoring is implemented in a later task.
    state.spawnTimer += dt;
    while (state.spawnTimer >= ENEMY_SPAWN_INTERVAL_MS) {
      state.spawnTimer -= ENEMY_SPAWN_INTERVAL_MS;
      spawnEnemy();
    }

    for (const enemy of state.enemies) {
      enemy.y += ENEMY_SPEED_PX_PER_SEC * (dt / 1000);
    }

    state.enemies = state.enemies.filter(
      (enemy) => enemy.y - enemy.radius <= state.height
    );

    let dx = 0;
    let dy = 0;

    if (activeDirections.has('left')) dx -= 1;
    if (activeDirections.has('right')) dx += 1;
    if (activeDirections.has('up')) dy -= 1;
    if (activeDirections.has('down')) dy += 1;

    if (dx !== 0 && dy !== 0) {
      const norm = Math.SQRT1_2;
      dx *= norm;
      dy *= norm;
    }

    const distance = player.speed * (dt / 1000);
    dx *= distance;
    dy *= distance;

    const halfWidth = player.width / 2;
    const halfHeight = player.height / 2;

    player.x = Math.min(
      state.width - halfWidth,
      Math.max(halfWidth, player.x + dx)
    );
    player.y = Math.min(
      state.height - halfHeight,
      Math.max(halfHeight, player.y + dy)
    );

    const bulletDistance = BULLET_SPEED * (dt / 1000);
    for (const bullet of state.bullets) {
      bullet.y -= bulletDistance;
    }
    state.bullets = state.bullets.filter((b) => b.y + BULLET_HEIGHT / 2 >= 0);
  }

  function render() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.fillStyle = '#e74c3c';
    for (const enemy of state.enemies) {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const halfWidth = player.width / 2;
    const halfHeight = player.height / 2;

    ctx.fillStyle = '#7fffd4';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - halfHeight);
    ctx.lineTo(player.x - halfWidth, player.y + halfHeight);
    ctx.lineTo(player.x + halfWidth, player.y + halfHeight);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffe066';
    for (const bullet of state.bullets) {
      ctx.fillRect(
        bullet.x - BULLET_WIDTH / 2,
        bullet.y - BULLET_HEIGHT / 2,
        BULLET_WIDTH,
        BULLET_HEIGHT
      );
    }
  }

  function loop(timestamp) {
    const rawDt = state.lastTime ? timestamp - state.lastTime : 0;
    const dt = Math.min(rawDt, MAX_DT_MS);
    state.lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);
})();
