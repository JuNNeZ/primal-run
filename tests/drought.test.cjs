'use strict';
// B4 Tørke og vandhuller (PART_B_PLAN, FEATURES.drought): ponds shrink after 60 % of the level time; thirsty animals seek water.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const DT = 1 / 30;
function level(seed = 3) { const g = new C.Game({ random: () => .5 }); g.start({ seed }); const r = g.run; r.enemies = []; r.spawnTimer = 1e9; r.invulnerable = 1e9; return { g, r }; }
const at = (g, seconds) => { g.run.seconds = (g.run.levelStart || 0) + seconds; g.step(DT, {}); };

test('ponds keep their size for 180 s, then shrink over 120 s to 35 % (the seeded last water to 70 %)', () => {
  const { g, r } = level(), base = r.map.ponds.map(p => p.radius), last = r.map.seed % r.map.ponds.length;
  at(g, 170); assert.deepEqual(r.map.ponds.map(p => p.radius), base); assert.equal(r.drought, false);
  at(g, 240); r.map.ponds.forEach((p, i) => assert.ok(Math.abs(p.radius - base[i] * (1 - (i === last ? .3 : .65) * .5)) < .05, 'half way ' + i)); assert.equal(r.drought, true);
  at(g, 400); r.map.ponds.forEach((p, i) => assert.ok(Math.abs(p.radius - base[i] * (i === last ? .7 : .35)) < 1e-6, 'final ' + i));
  assert.ok(r.effects.some(e => /TØRKE/.test(e.text)), 'the player is told once');
  const pond = r.map.ponds[(last + 1) % r.map.ponds.length], spot = { x: pond.x + pond.baseRadius * .6, y: pond.y };
  assert.equal(C.isWater(r.stage, r.map, spot), false, 'the dried edge is dry land now');
  assert.equal(C.isWater(r.stage, r.map, { ...spot, x: pond.x }), true, 'the middle is still water');
});

test('a new level brings fresh ponds and restarts the clock', () => {
  const { g, r } = level(); at(g, 400); assert.equal(r.drought, true);
  g.phase = 'cleared'; r.bossDefeated = true; g.nextStage(); g.step(DT, {});
  assert.equal(g.run.drought, false); assert.ok(g.run.map.ponds.every(p => p.radius === p.baseRadius));
  assert.ok(Math.abs(g.run.levelStart - g.run.seconds) < .1);
});

test('thirsty herbivores walk to the remaining water and drink; the last water wins over a nearer dry hole', () => {
  const { g, r } = level(); at(g, 400);
  const last = r.map.ponds[r.map.seed % r.map.ponds.length], other = r.map.ponds.find(p => p !== last);
  const e = g.spawn('parasaurolophus', { x: last.x + 360, y: last.y + 40 }); Object.assign(e, { alert: false, thirst: 1, naturalTime: 0, homeX: e.x, homeY: e.y });
  Object.assign(r.player, { x: last.x - 1500, y: last.y - 900 });
  const w = g.lastWater(e); assert.ok(w, 'some water');
  let drank = false; const start = Math.hypot(e.x - w.x, e.y - w.y);
  for (let i = 0; i < 30 * 25 && !drank; i++) { r.seconds += DT; g.naturalBehavior(e, DT); drank = e.thirst < .9; }
  assert.ok(drank, 'it reached water and drank (thirst ' + e.thirst.toFixed(2) + ')'); assert.ok(Math.hypot(e.x - w.x, e.y - w.y) < start);
  assert.equal(e.activity === 'drink' || e.activity === 'graze', true);
  const probe = { x: (last.x + other.x) / 2 + (other.x - last.x) * .15, y: (last.y + other.y) / 2 + (other.y - last.y) * .15 }; // a bit nearer the dried hole
  const choice = g.lastWater(probe); assert.equal(choice.x, last.x, 'prefers the bigger last water');
});

test('flag off: ponds never shrink and animals behave as before', () => {
  C.FEATURES.drought = false;
  try { const { g, r } = level(); const base = r.map.ponds.map(p => p.radius); at(g, 400); assert.deepEqual(r.map.ponds.map(p => p.radius), base); assert.ok(!r.drought); }
  finally { C.FEATURES.drought = true; }
});
