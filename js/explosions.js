(function (global) {
  const EXPLOSION_DURATION_MS = 450;
  const EXPLOSION_FRAME_COUNT = 9;
  const EXPLOSION_SIZE = 40;

  function spawnExplosion(x, y) {
    return { x, y, elapsed: 0, frame: 0 };
  }

  function frameForElapsed(elapsed) {
    const ratio = Math.min(elapsed / EXPLOSION_DURATION_MS, 1);
    return Math.min(EXPLOSION_FRAME_COUNT - 1, Math.floor(ratio * EXPLOSION_FRAME_COUNT));
  }

  function updateExplosions(explosions, dt) {
    return explosions
      .map((explosion) => {
        const elapsed = explosion.elapsed + dt * 1000;
        return { ...explosion, elapsed, frame: frameForElapsed(elapsed) };
      })
      .filter((explosion) => explosion.elapsed < EXPLOSION_DURATION_MS);
  }

  function drawExplosions(ctx, explosions, getFrameImage) {
    explosions.forEach((explosion) => {
      const img = getFrameImage(explosion.frame);
      if (global.Assets.isUsable(img)) {
        ctx.drawImage(
          img,
          explosion.x - EXPLOSION_SIZE / 2,
          explosion.y - EXPLOSION_SIZE / 2,
          EXPLOSION_SIZE,
          EXPLOSION_SIZE
        );
      } else {
        const radius = (EXPLOSION_SIZE / 2) * (1 - explosion.elapsed / EXPLOSION_DURATION_MS);
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, Math.max(radius, 0), 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  global.Explosions = {
    EXPLOSION_DURATION_MS,
    EXPLOSION_FRAME_COUNT,
    EXPLOSION_SIZE,
    spawnExplosion,
    updateExplosions,
    drawExplosions,
  };
})(typeof window !== 'undefined' ? window : globalThis);
