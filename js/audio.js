(function (global) {
  const POOL_SIZE = 4;
  const pools = {};
  let audioCtx = null;

  function getAudioContext() {
    if (audioCtx) return audioCtx;
    const AudioContextClass = global.AudioContext || global.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
    return audioCtx;
  }

  function getPool(name, src) {
    if (!pools[name]) {
      const elements = [];
      for (let i = 0; i < POOL_SIZE; i += 1) {
        const el = new Audio(src);
        el.preload = 'auto';
        elements.push(el);
      }
      pools[name] = { elements, next: 0 };
    }
    return pools[name];
  }

  function playSample(name) {
    const src = global.Assets && global.Assets.getAudioSrc(name);
    if (!src) return;
    const pool = getPool(name, src);
    const el = pool.elements[pool.next];
    pool.next = (pool.next + 1) % pool.elements.length;
    try {
      el.currentTime = 0;
      const playResult = el.play();
      if (playResult && typeof playResult.catch === 'function') playResult.catch(() => {});
    } catch (e) {
      // Autoplay/decoding errors are non-fatal for gameplay.
    }
  }

  function playExplosion() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const duration = 0.4;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  function playTitleFanfare() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 - short ascending arpeggio

    notes.forEach((freq, i) => {
      const start = now + i * 0.12;
      const duration = 0.25;

      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration + 0.05);
    });
  }

  function unlock() {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function play(name) {
    global.__sfxLog = global.__sfxLog || [];
    global.__sfxLog.push(name);

    if (name === 'explosion') {
      playExplosion();
      return;
    }
    if (name === 'title') {
      playTitleFanfare();
      return;
    }
    playSample(name);
  }

  global.Sfx = { unlock, play };
})(typeof window !== 'undefined' ? window : globalThis);
