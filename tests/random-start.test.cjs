'use strict';
// FEATURES.randomStart: each map starts anywhere (seeded), never in water/lava, near the river or against a rock.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');

test('start position varies over the whole map, is deterministic and is safe ground', () => {
  const areas = new Set();
  for (let stage = 0; stage < 4; stage++) for (let seed = 1; seed <= 80; seed++) {
    const m = C.createMap(stage, seed), s = m.start;
    assert.deepEqual(s, C.createMap(stage, seed).start, 'same seed, same start');
    areas.add(Math.floor(3 * s.x / m.width) + ',' + Math.floor(3 * s.y / m.height));
    assert.ok(s.x > 200 && s.y > 150 && s.x < m.width - 200 && s.y < m.height - 150, 'inside the map ' + stage + '/' + seed);
    assert.ok(!C.isWater(stage, m, s, 40) && !C.isLava(stage, m, s) && C.riverDistance(m, s) >= 340, 'dry start away from the river/lava ' + stage + '/' + seed);
    assert.ok(m.rocks.every(r => Math.hypot(r.x - s.x, r.y - s.y) > 150), 'no rock on the start ' + stage + '/' + seed);
  }
  assert.equal(areas.size, 9, 'corners, edges and the middle are all used');
});

test('a run and every later stage put the player on the map start', () => {
  const g = new C.Game({ random: () => .5 }); g.start({ seed: 7 }); const r = g.run;
  assert.deepEqual({ x: r.player.x, y: r.player.y }, r.map.start);
  g.phase = 'cleared'; assert.ok(g.nextStage());
  assert.deepEqual({ x: r.player.x, y: r.player.y }, r.map.start);
});

test('flag off keeps the classic top-left start', () => {
  C.FEATURES.randomStart = false;
  try { assert.deepEqual(C.createMap(2, 9).start, { x: 480, y: 340 }); } finally { C.FEATURES.randomStart = true; }
});
