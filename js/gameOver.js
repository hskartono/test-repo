(function (global) {
  const STARTING_LIVES = 3;

  function applyLivesLoss(lives) {
    const nextLives = Math.max(0, lives - 1);
    return { lives: nextLives, gameOver: nextLives === 0 };
  }

  global.GameOver = { STARTING_LIVES, applyLivesLoss };
})(typeof window !== 'undefined' ? window : globalThis);
