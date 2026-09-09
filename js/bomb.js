(function (global) {
  const STARTING_BOMBS = 3;
  const KILLS_PER_BOMB = 10;

  function createBombState() {
    return { count: STARTING_BOMBS, killProgress: 0 };
  }

  function awardBombsForKills(bombState, killCount) {
    let progress = bombState.killProgress + killCount;
    let count = bombState.count;
    while (progress >= KILLS_PER_BOMB) {
      progress -= KILLS_PER_BOMB;
      count += 1;
    }
    return { count, killProgress: progress };
  }

  function shouldLaunchBomb(bombHeld, prevBombHeld) {
    return Boolean(bombHeld) && !prevBombHeld;
  }

  function launchBomb(bombState) {
    if (bombState.count <= 0) {
      return { bombState, launched: false };
    }
    return { bombState: { ...bombState, count: bombState.count - 1 }, launched: true };
  }

  function detonateBomb(enemies, bullets) {
    return { enemies: [], bullets: [], destroyedEnemies: [...enemies] };
  }

  global.Bomb = {
    STARTING_BOMBS,
    KILLS_PER_BOMB,
    createBombState,
    awardBombsForKills,
    shouldLaunchBomb,
    launchBomb,
    detonateBomb,
  };
})(typeof window !== 'undefined' ? window : globalThis);
