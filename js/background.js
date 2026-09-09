(function (global) {
  const SCROLL_SPEED = 40; // px/sec
  const TILE_SIZE = 256;
  const PLANET_SPEED = 20; // px/sec
  const PLANET_MIN_INTERVAL_MS = 8000;
  const PLANET_MAX_INTERVAL_MS = 15000;
  const PLANET_SIZE_MIN = 50;
  const PLANET_SIZE_MAX = 90;

  function createBackgroundState() {
    return {
      scrollY: 0,
      planets: [],
      timeSinceLastPlanet: 0,
      nextPlanetIntervalMs: null,
    };
  }

  function updateScroll(state, dt, speed, tileSize) {
    const nextScroll = (state.scrollY + speed * dt) % tileSize;
    return { ...state, scrollY: nextScroll };
  }

  function pickNextPlanetInterval(minMs, maxMs, rng) {
    return minMs + rng() * (maxMs - minMs);
  }

  function spawnPlanet(gameWidth, planetKeys, rng) {
    const size = PLANET_SIZE_MIN + rng() * (PLANET_SIZE_MAX - PLANET_SIZE_MIN);
    const x = size / 2 + rng() * (gameWidth - size);
    const key = planetKeys[Math.floor(rng() * planetKeys.length)];
    return { x, y: -size / 2, size, key };
  }

  function stepPlanetSpawner(state, deltaMs, minMs, maxMs, gameWidth, planetKeys, rng = Math.random) {
    if (state.nextPlanetIntervalMs === null) {
      state.nextPlanetIntervalMs = pickNextPlanetInterval(minMs, maxMs, rng);
    }
    state.timeSinceLastPlanet += deltaMs;
    while (state.timeSinceLastPlanet >= state.nextPlanetIntervalMs) {
      state.timeSinceLastPlanet -= state.nextPlanetIntervalMs;
      state.planets.push(spawnPlanet(gameWidth, planetKeys, rng));
      state.nextPlanetIntervalMs = pickNextPlanetInterval(minMs, maxMs, rng);
    }
  }

  function updatePlanets(planets, dt, speed, gameHeight) {
    return planets
      .map((planet) => ({ ...planet, y: planet.y + speed * dt }))
      .filter((planet) => planet.y - planet.size / 2 <= gameHeight);
  }

  function drawBackground(ctx, state, backgroundImage, gameWidth, gameHeight, getPlanetImage) {
    if (global.Assets.isUsable(backgroundImage)) {
      for (let y = -TILE_SIZE + (state.scrollY % TILE_SIZE); y < gameHeight; y += TILE_SIZE) {
        for (let x = 0; x < gameWidth; x += TILE_SIZE) {
          ctx.drawImage(backgroundImage, x, y, TILE_SIZE, TILE_SIZE);
        }
      }
    } else {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, gameWidth, gameHeight);
    }

    state.planets.forEach((planet) => {
      const img = getPlanetImage(planet.key);
      if (global.Assets.isUsable(img)) {
        ctx.drawImage(img, planet.x - planet.size / 2, planet.y - planet.size / 2, planet.size, planet.size);
      } else {
        ctx.fillStyle = '#555577';
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  global.Background = {
    SCROLL_SPEED,
    TILE_SIZE,
    PLANET_SPEED,
    PLANET_MIN_INTERVAL_MS,
    PLANET_MAX_INTERVAL_MS,
    PLANET_SIZE_MIN,
    PLANET_SIZE_MAX,
    createBackgroundState,
    updateScroll,
    stepPlanetSpawner,
    updatePlanets,
    drawBackground,
  };
})(typeof window !== 'undefined' ? window : globalThis);
