(function () {
  var gameState = {
    canvas: null,
    ctx: null,
    width: 480,
    height: 640,
    running: true,
    lastTimestamp: 0
  };

  function resizeCanvas() {
    var aspectRatio = gameState.width / gameState.height;
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;
    var viewportAspectRatio = viewportWidth / viewportHeight;

    var displayWidth;
    var displayHeight;
    if (viewportAspectRatio > aspectRatio) {
      displayHeight = viewportHeight;
      displayWidth = displayHeight * aspectRatio;
    } else {
      displayWidth = viewportWidth;
      displayHeight = displayWidth / aspectRatio;
    }

    gameState.canvas.style.width = displayWidth + 'px';
    gameState.canvas.style.height = displayHeight + 'px';
  }

  function render(timestamp) {
    var ctx = gameState.ctx;
    ctx.clearRect(0, 0, gameState.width, gameState.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, gameState.width, gameState.height);

    gameState.lastTimestamp = timestamp;

    if (gameState.running) {
      requestAnimationFrame(render);
    }
  }

  function init() {
    gameState.canvas = document.getElementById('gameCanvas');
    gameState.ctx = gameState.canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    requestAnimationFrame(render);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
