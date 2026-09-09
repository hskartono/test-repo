(function (global) {
  const IMAGE_MANIFEST = {
    playerShip: 'assets/images/player-ship.png',
    enemyShip: 'assets/images/enemy-ship.png',
    bullet: 'assets/images/bullet.png',
    background: 'assets/images/background-stars.png',
    planet1: 'assets/images/planet-1.png',
    planet2: 'assets/images/planet-2.png',
    planet3: 'assets/images/planet-3.png',
    fire0: 'assets/images/fire/fire00.png',
    fire1: 'assets/images/fire/fire03.png',
    fire2: 'assets/images/fire/fire06.png',
    fire3: 'assets/images/fire/fire09.png',
    fire4: 'assets/images/fire/fire12.png',
    fire5: 'assets/images/fire/fire15.png',
    explosion0: 'assets/images/explosion/explosion00.png',
    explosion1: 'assets/images/explosion/explosion01.png',
    explosion2: 'assets/images/explosion/explosion02.png',
    explosion3: 'assets/images/explosion/explosion03.png',
    explosion4: 'assets/images/explosion/explosion04.png',
    explosion5: 'assets/images/explosion/explosion05.png',
    explosion6: 'assets/images/explosion/explosion06.png',
    explosion7: 'assets/images/explosion/explosion07.png',
    explosion8: 'assets/images/explosion/explosion08.png',
  };

  const FIRE_FRAMES = ['fire0', 'fire1', 'fire2', 'fire3', 'fire4', 'fire5'];
  const EXPLOSION_FRAMES = [
    'explosion0', 'explosion1', 'explosion2', 'explosion3', 'explosion4',
    'explosion5', 'explosion6', 'explosion7', 'explosion8',
  ];
  const PLANET_KEYS = ['planet1', 'planet2', 'planet3'];

  const AUDIO_MANIFEST = {
    shoot: 'assets/audio/shoot.ogg',
  };

  const images = {};
  const audio = {};
  let pending = 0;
  let ready = false;

  function loadAll(doc) {
    const targetDoc = doc || (typeof document !== 'undefined' ? document : null);
    if (!targetDoc) {
      ready = true;
      return;
    }
    const keys = Object.keys(IMAGE_MANIFEST);
    pending = keys.length;
    if (pending === 0) {
      ready = true;
      return;
    }
    keys.forEach((key) => {
      const img = new Image();
      img.onload = onOneSettled;
      img.onerror = onOneSettled;
      img.src = IMAGE_MANIFEST[key];
      images[key] = img;
    });

    Object.keys(AUDIO_MANIFEST).forEach((key) => {
      audio[key] = AUDIO_MANIFEST[key];
    });
  }

  function onOneSettled() {
    pending -= 1;
    if (pending <= 0) ready = true;
  }

  function isReady() {
    return ready;
  }

  function isUsable(img) {
    return Boolean(img && img.complete && img.naturalWidth > 0);
  }

  function isImageUsable(key) {
    return isUsable(images[key]);
  }

  function get(key) {
    return images[key];
  }

  function getAudioSrc(key) {
    return audio[key];
  }

  global.Assets = {
    IMAGE_MANIFEST,
    AUDIO_MANIFEST,
    FIRE_FRAMES,
    EXPLOSION_FRAMES,
    PLANET_KEYS,
    loadAll,
    isReady,
    isUsable,
    isImageUsable,
    get,
    getAudioSrc,
  };
})(typeof window !== 'undefined' ? window : globalThis);
