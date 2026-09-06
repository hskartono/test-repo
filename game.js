(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const state = {
    width: canvas.width,
    height: canvas.height,
    lastTime: 0,
  };

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
    // No gameplay logic yet: movement, enemies, bullets, and scoring
    // are implemented in later tasks.
  }

  function render() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function loop(timestamp) {
    const dt = state.lastTime ? timestamp - state.lastTime : 0;
    state.lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);
})();
