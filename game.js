(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const state = {
    width: canvas.width,
    height: canvas.height,
    lastTime: 0,
  };

  const player = {
    x: state.width / 2,
    y: state.height - 50,
    width: 24,
    height: 28,
    speed: 300, // px/sec
  };

  const KEY_DIRECTIONS = {
    arrowup: 'up',
    w: 'up',
    arrowdown: 'down',
    s: 'down',
    arrowleft: 'left',
    a: 'left',
    arrowright: 'right',
    d: 'right',
  };

  const activeDirections = new Set();

  function handleKeyEvent(e, isDown) {
    const direction = KEY_DIRECTIONS[e.key.toLowerCase()];
    if (!direction) return;
    e.preventDefault();
    if (isDown) {
      activeDirections.add(direction);
    } else {
      activeDirections.delete(direction);
    }
  }

  window.addEventListener('keydown', (e) => handleKeyEvent(e, true));
  window.addEventListener('keyup', (e) => handleKeyEvent(e, false));
  window.addEventListener('blur', () => activeDirections.clear());

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

  const MAX_DT = 100; // ms; caps the movement step after a stalled/backgrounded frame

  function update(dt) {
    // Enemies, bullets, and scoring are implemented in later tasks.
    const clampedDt = Math.min(dt, MAX_DT);

    let dx = 0;
    let dy = 0;

    if (activeDirections.has('left')) dx -= 1;
    if (activeDirections.has('right')) dx += 1;
    if (activeDirections.has('up')) dy -= 1;
    if (activeDirections.has('down')) dy += 1;

    if (dx !== 0 && dy !== 0) {
      const norm = Math.SQRT1_2;
      dx *= norm;
      dy *= norm;
    }

    const distance = player.speed * (clampedDt / 1000);
    dx *= distance;
    dy *= distance;

    const halfWidth = player.width / 2;
    const halfHeight = player.height / 2;

    player.x = Math.min(
      state.width - halfWidth,
      Math.max(halfWidth, player.x + dx)
    );
    player.y = Math.min(
      state.height - halfHeight,
      Math.max(halfHeight, player.y + dy)
    );
  }

  function render() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, state.width, state.height);

    const halfWidth = player.width / 2;
    const halfHeight = player.height / 2;

    ctx.fillStyle = '#7fffd4';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - halfHeight);
    ctx.lineTo(player.x - halfWidth, player.y + halfHeight);
    ctx.lineTo(player.x + halfWidth, player.y + halfHeight);
    ctx.closePath();
    ctx.fill();
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
