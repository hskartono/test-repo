(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const ENEMY_SPAWN_INTERVAL_MS = 1000;
  const ENEMY_RADIUS = 16;
  const ENEMY_SPEED_PX_PER_SEC = 120;

  const state = {
    width: canvas.width,
    height: canvas.height,
    lastTime: 0,
  };

  const player = {
    x: state.width / 2,
    y: state.height - 50,
    width: 24,
    height: 28,
    speed: 300, // px/sec
  };

  state.bullets = [];
  state.enemies = [];
  state.spawnTimer = 0;
  state.score = 0;

  const BULLET_WIDTH = 4;
  const BULLET_HEIGHT = 10;
  const BULLET_SPEED = 480; // px/sec

  function spawnBullet() {
    state.bullets.push({
      x: player.x,
      y: player.y - player.height / 2,
    });
  }

  function spawnEnemy() {
    const x = ENEMY_RADIUS + Math.random() * (state.width - 2 * ENEMY_RADIUS);
    state.enemies.push({ x, y: -ENEMY_RADIUS, radius: ENEMY_RADIUS });
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

  const MAX_DT = 100; // ms; caps the movement step after a stalled/backgrounded frame

  // Distance check: bullet approximated as a circle since it's small and fast-moving.
  function circleHitsCircle(ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    const radii = ar + br;
    return dx * dx + dy * dy <= radii * radii;
  }

  // Bounding-box check: player has no radius, so treat it as an AABB against the enemy circle.
  function rectHitsCircle(px, py, halfW, halfH, cx, cy, cr) {
    const closestX = Math.min(Math.max(cx, px - halfW), px + halfW);
    const closestY = Math.min(Math.max(cy, py - halfH), py + halfH);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy <= cr * cr;
  }

  function update(dt) {
    const clampedDt = Math.min(dt, MAX_DT);
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

    const distance = player.speed * (clampedDt / 1000);
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

    const bulletDistance = BULLET_SPEED * (clampedDt / 1000);
    for (const bullet of state.bullets) {
      bullet.y -= bulletDistance;
    }
    state.bullets = state.bullets.filter((b) => b.y + BULLET_HEIGHT / 2 >= 0);

    state.spawnTimer += clampedDt;
    while (state.spawnTimer >= ENEMY_SPAWN_INTERVAL_MS) {
      state.spawnTimer -= ENEMY_SPAWN_INTERVAL_MS;
      spawnEnemy();
    }

    for (const enemy of state.enemies) {
      enemy.y += ENEMY_SPEED_PX_PER_SEC * (clampedDt / 1000);
    }
    state.enemies = state.enemies.filter(
      (enemy) => enemy.y - enemy.radius <= state.height
    );

    const bulletRadius = Math.max(BULLET_WIDTH, BULLET_HEIGHT) / 2;

    // Bullet-enemy pass first so a kill is credited even if the same enemy
    // would also reach the player this frame.
    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      for (const bullet of state.bullets) {
        if (bullet.dead) continue;
        if (
          circleHitsCircle(
            bullet.x,
            bullet.y,
            bulletRadius,
            enemy.x,
            enemy.y,
            enemy.radius
          )
        ) {
          bullet.dead = true;
          enemy.dead = true;
          state.score += 1;
          break;
        }
      }
    }

    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      if (
        rectHitsCircle(
          player.x,
          player.y,
          halfWidth,
          halfHeight,
          enemy.x,
          enemy.y,
          enemy.radius
        )
      ) {
        enemy.dead = true;
      }
    }

    state.bullets = state.bullets.filter((b) => !b.dead);
    state.enemies = state.enemies.filter((e) => !e.dead);
  }

  function render() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, state.width, state.height);

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

    ctx.fillStyle = '#e74c3c';
    for (const enemy of state.enemies) {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${state.score}`, 10, 10);
  }

  function loop(timestamp) {
    const dt = state.lastTime ? timestamp - state.lastTime : 0;
    state.lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);
})();
