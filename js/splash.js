(function (global) {
  const PHASES = { INTRO: 'intro', TITLE: 'title' };

  const INTRO_DURATION_MS = 2500;
  const FADE_DURATION_MS = 500;
  const GAME_OVER_RETURN_DELAY_MS = 3000;

  function createSplashState() {
    return { phase: PHASES.INTRO };
  }

  global.Splash = {
    PHASES,
    INTRO_DURATION_MS,
    FADE_DURATION_MS,
    GAME_OVER_RETURN_DELAY_MS,
    createSplashState,
  };
})(typeof window !== 'undefined' ? window : globalThis);
