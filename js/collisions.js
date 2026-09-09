(function (global) {
  function boundingBoxOf(entity) {
    if (typeof entity.radius === 'number') {
      return {
        x: entity.x - entity.radius,
        y: entity.y - entity.radius,
        width: entity.radius * 2,
        height: entity.radius * 2,
      };
    }
    return { x: entity.x, y: entity.y, width: entity.width, height: entity.height };
  }

  function boxesIntersect(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function intersects(a, b) {
    return boxesIntersect(boundingBoxOf(a), boundingBoxOf(b));
  }

  function resolveBulletEnemyCollisions(bullets, enemies) {
    const hitBulletIndices = new Set();
    const hitEnemyIndices = new Set();

    bullets.forEach((bullet, bulletIndex) => {
      const enemyIndex = enemies.findIndex((enemy, index) => !hitEnemyIndices.has(index) && intersects(bullet, enemy));
      if (enemyIndex !== -1) {
        hitBulletIndices.add(bulletIndex);
        hitEnemyIndices.add(enemyIndex);
      }
    });

    return {
      bullets: bullets.filter((_, index) => !hitBulletIndices.has(index)),
      enemies: enemies.filter((_, index) => !hitEnemyIndices.has(index)),
      hits: hitEnemyIndices.size,
    };
  }

  function resolvePlayerEnemyCollisions(player, enemies) {
    const survivors = enemies.filter((enemy) => !intersects(player, enemy));
    return { enemies: survivors, hit: survivors.length !== enemies.length };
  }

  global.Collisions = {
    boundingBoxOf,
    boxesIntersect,
    intersects,
    resolveBulletEnemyCollisions,
    resolvePlayerEnemyCollisions,
  };
})(typeof window !== 'undefined' ? window : globalThis);
