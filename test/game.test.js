'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var game = require('../game.js');

test('circleCollide', async function (t) {
  await t.test('detects overlapping circles', function () {
    assert.equal(game.circleCollide({ x: 0, y: 0 }, 5, { x: 6, y: 0 }, 5), true);
  });

  await t.test('detects circles too far apart', function () {
    assert.equal(game.circleCollide({ x: 0, y: 0 }, 5, { x: 20, y: 0 }, 5), false);
  });

  await t.test('treats exactly-touching circles as colliding', function () {
    assert.equal(game.circleCollide({ x: 0, y: 0 }, 5, { x: 10, y: 0 }, 5), true);
  });
});

test('circleRectCollide', async function (t) {
  await t.test('detects a circle overlapping a rect', function () {
    var circle = { x: 10, y: 10, radius: 3 };
    var rect = { x: 10, y: 10, width: 4, height: 4 };
    assert.equal(game.circleRectCollide(circle, rect), true);
  });

  await t.test('detects a circle far from a rect as a miss', function () {
    var circle = { x: 100, y: 100, radius: 3 };
    var rect = { x: 10, y: 10, width: 4, height: 4 };
    assert.equal(game.circleRectCollide(circle, rect), false);
  });
});

test('createExplosion', function () {
  var explosion = game.createExplosion(42, 99);
  assert.deepEqual(explosion, { x: 42, y: 99, age: 0 });
});

test('advanceExplosions', async function (t) {
  await t.test('ages entries by dt', function () {
    var result = game.advanceExplosions([{ x: 1, y: 2, age: 0 }], 0.1, 0.4);
    assert.equal(result.length, 1);
    assert.ok(Math.abs(result[0].age - 0.1) < 1e-9);
  });

  await t.test('drops entries once age reaches the duration', function () {
    var result = game.advanceExplosions([{ x: 1, y: 2, age: 0.35 }], 0.1, 0.4);
    assert.deepEqual(result, []);
  });

  await t.test('keeps unexpired entries when only some expire', function () {
    var result = game.advanceExplosions(
      [
        { x: 1, y: 2, age: 0.35 },
        { x: 3, y: 4, age: 0 }
      ],
      0.1,
      0.4
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].x, 3);
    assert.equal(result[0].y, 4);
  });
});

test('startInvulnerability', function () {
  var state = game.startInvulnerability(1.5);
  assert.deepEqual(state, { invulnerable: true, timer: 1.5, blinkTimer: 0, visible: true });
});

test('advanceInvulnerability', async function (t) {
  await t.test('counts the timer down and stays invulnerable while time remains', function () {
    var state = game.startInvulnerability(1.5);
    var next = game.advanceInvulnerability(state, 0.5, 0.1);
    assert.equal(next.invulnerable, true);
    assert.ok(Math.abs(next.timer - 1.0) < 1e-9);
  });

  await t.test('becomes non-invulnerable once the timer reaches zero', function () {
    var state = game.startInvulnerability(0.2);
    var next = game.advanceInvulnerability(state, 0.5, 0.1);
    assert.deepEqual(next, { invulnerable: false, timer: 0, blinkTimer: 0, visible: true });
  });

  await t.test('is a no-op once no longer invulnerable', function () {
    var state = { invulnerable: false, timer: 0, blinkTimer: 0, visible: true };
    var next = game.advanceInvulnerability(state, 0.5, 0.1);
    assert.deepEqual(next, state);
  });

  await t.test('flips visibility each time blinkTimer crosses the blink interval', function () {
    var state = game.startInvulnerability(1.5);
    var next = game.advanceInvulnerability(state, 0.1, 0.1);
    assert.equal(next.visible, false);
    assert.ok(Math.abs(next.blinkTimer - 0) < 1e-9);
  });

  await t.test('does not flip visibility before crossing the blink interval', function () {
    var state = game.startInvulnerability(1.5);
    var next = game.advanceInvulnerability(state, 0.05, 0.1);
    assert.equal(next.visible, true);
    assert.ok(Math.abs(next.blinkTimer - 0.05) < 1e-9);
  });
});

test('readInvulnerabilityState / applyInvulnerabilityState', async function (t) {
  await t.test('reads the invulnerability fields off a player-shaped object', function () {
    var player = { invulnerable: true, invulnerableTimer: 0.7, blinkTimer: 0.02, visible: false, x: 1, y: 2 };
    assert.deepEqual(game.readInvulnerabilityState(player), {
      invulnerable: true,
      timer: 0.7,
      blinkTimer: 0.02,
      visible: false
    });
  });

  await t.test('writes an invulnerability state back onto a player-shaped object without touching other fields', function () {
    var player = { invulnerable: false, invulnerableTimer: 0, blinkTimer: 0, visible: true, x: 1, y: 2 };
    game.applyInvulnerabilityState(player, { invulnerable: true, timer: 1.5, blinkTimer: 0, visible: true });
    assert.equal(player.invulnerable, true);
    assert.equal(player.invulnerableTimer, 1.5);
    assert.equal(player.blinkTimer, 0);
    assert.equal(player.visible, true);
    assert.equal(player.x, 1);
    assert.equal(player.y, 2);
  });

  await t.test('round-trips through advanceInvulnerability', function () {
    var player = { invulnerable: true, invulnerableTimer: 1.5, blinkTimer: 0, visible: true };
    game.applyInvulnerabilityState(player, game.advanceInvulnerability(game.readInvulnerabilityState(player), 0.5, 0.1));
    assert.equal(player.invulnerable, true);
    assert.ok(Math.abs(player.invulnerableTimer - 1.0) < 1e-9);
  });
});

function createFakeAudioContext() {
  var calls = [];
  var fakeParam = function (name) {
    return {
      setValueAtTime: function (value) {
        calls.push([name, 'setValueAtTime', value]);
      },
      exponentialRampToValueAtTime: function (value) {
        calls.push([name, 'exponentialRampToValueAtTime', value]);
      }
    };
  };

  function FakeAudioContext() {
    this.currentTime = 0;
    this.destination = {};
    this.state = 'suspended';
  }

  FakeAudioContext.prototype.resume = function () {
    calls.push(['context', 'resume']);
    this.state = 'running';
  };

  FakeAudioContext.prototype.createOscillator = function () {
    var oscillator = {
      frequency: fakeParam('frequency'),
      connect: function () {
        calls.push(['oscillator', 'connect']);
      },
      start: function () {
        calls.push(['oscillator', 'start']);
      },
      stop: function () {
        calls.push(['oscillator', 'stop']);
      }
    };
    return oscillator;
  };

  FakeAudioContext.prototype.createGain = function () {
    return {
      gain: fakeParam('gain'),
      connect: function () {
        calls.push(['gain', 'connect']);
      }
    };
  };

  return { Ctor: FakeAudioContext, calls: calls };
}

test('createSoundManager', async function (t) {
  await t.test('plays a tone through the injected AudioContext without throwing', function () {
    var fake = createFakeAudioContext();
    var soundManager = game.createSoundManager(function () {
      return fake.Ctor;
    });

    assert.doesNotThrow(function () {
      soundManager.playShoot();
      soundManager.playEnemyHit();
      soundManager.playCollision();
    });

    var startedCount = fake.calls.filter(function (call) {
      return call[0] === 'oscillator' && call[1] === 'start';
    }).length;
    assert.equal(startedCount, 3);
  });

  await t.test('resumes a suspended AudioContext before playing', function () {
    var fake = createFakeAudioContext();
    var soundManager = game.createSoundManager(function () {
      return fake.Ctor;
    });

    soundManager.playShoot();

    var resumedCount = fake.calls.filter(function (call) {
      return call[0] === 'context' && call[1] === 'resume';
    }).length;
    assert.equal(resumedCount, 1);
  });

  await t.test('is a silent no-op when no AudioContext is available', function () {
    var soundManager = game.createSoundManager(function () {
      return undefined;
    });

    assert.doesNotThrow(function () {
      soundManager.playShoot();
      soundManager.playEnemyHit();
      soundManager.playCollision();
    });
  });
});
