(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const ENEMY_SPAWN_INTERVAL_MS = 1000;
  const ENEMY_RADIUS = 16;
  const ENEMY_SPEED_PX_PER_SEC = 120;
  const MAX_DT_MS = 100;

  const state = {
    width: canvas.width,
    height: canvas.height,
    lastTime: 0,
    enemies: [],
    spawnTimer: 0,
  };

  function spawnEnemy() {
    const x = ENEMY_RADIUS + Math.random() * (state.width - 2 * ENEMY_RADIUS);
    state.enemies.push({ x, y: -ENEMY_RADIUS, radius: ENEMY_RADIUS });
  }

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
