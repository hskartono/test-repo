(function (global) {
  const BULLET_WIDTH = 4;
  const BULLET_HEIGHT = 12;
  const BULLET_SPEED = 480;

  function createBullet(player) {
    return {
      x: player.x + player.width / 2 - BULLET_WIDTH / 2,
      y: player.y,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
      speed: BULLET_SPEED,
    };
  }

  function fireBullet(bullets, player) {
    return [...bullets, createBullet(player)];
  }

  function moveBullets(bullets, dt) {
    return bullets.map((bullet) => ({ ...bullet, y: bullet.y - bullet.speed * dt }));
  }

  function isOnscreen(bullet) {
    return bullet.y + bullet.height > 0;
  }

  function removeOffscreenBullets(bullets) {
    return bullets.filter(isOnscreen);
  }

  function updateBullets(bullets, dt) {
    return removeOffscreenBullets(moveBullets(bullets, dt));
  }

  function shouldFire(shootHeld, prevShootHeld) {
    return Boolean(shootHeld) && !prevShootHeld;
  }

  global.Bullets = {
    BULLET_WIDTH,
    BULLET_HEIGHT,
    BULLET_SPEED,
    createBullet,
    fireBullet,
    moveBullets,
    isOnscreen,
    removeOffscreenBullets,
    updateBullets,
    shouldFire,
  };
})(typeof window !== 'undefined' ? window : globalThis);
