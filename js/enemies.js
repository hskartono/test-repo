(function (global) {
  const ENEMY_RADIUS = 15;
  const ENEMY_SPEED = 120; // px/sec
  const SPAWN_INTERVAL_MS = 800;

  function spawnEnemy(gameWidth, radius, rng = Math.random) {
    const x = radius + rng() * (gameWidth - 2 * radius);
    return { x, y: -radius, radius };
  }

  function updateEnemies(enemies, deltaMs, speed, gameHeight) {
    const moved = enemies.map((enemy) => ({
      ...enemy,
      y: enemy.y + (speed * deltaMs) / 1000,
    }));
    return moved.filter((enemy) => enemy.y - enemy.radius <= gameHeight);
  }

  function stepEnemySpawner(state, deltaMs, spawnIntervalMs, gameWidth, radius, rng = Math.random) {
    state.timeSinceLastSpawn += deltaMs;
    while (state.timeSinceLastSpawn >= spawnIntervalMs) {
      state.timeSinceLastSpawn -= spawnIntervalMs;
      state.enemies.push(spawnEnemy(gameWidth, radius, rng));
    }
  }

  global.Enemies = {
    ENEMY_RADIUS,
    ENEMY_SPEED,
    SPAWN_INTERVAL_MS,
    spawnEnemy,
    updateEnemies,
    stepEnemySpawner,
  };
})(typeof window !== 'undefined' ? window : globalThis);
