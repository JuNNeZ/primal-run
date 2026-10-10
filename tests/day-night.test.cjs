'use strict';
// B2 Dag og nat (PART_B_PLAN, FEATURES.dayNight): 240 s cycle, shorter sight, bold compys, sleeping herds, nightKills.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const DT = 1 / 30;
function field(seed = 3, species = 'velociraptor') { const g = new C.Game({ random: () => .5 }); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.selectSpecies(species); g.start({ seed }); const r = g.run; r.enemies = []; r.spawnTimer = 1e9; r.invulnerable = 1e9; r.map.rocks = []; return { g, r }; }

test('the cycle: day 0–150 s, dusk, night 165–225 s, dawn, repeating every 240 s', () => {
  const d = C.darknessAt;
  assert.equal(d(0), 0); assert.equal(d(149), 0); assert.ok(Math.abs(d(157.5) - .5) < 1e-9); assert.equal(d(170), 1); assert.equal(d(224), 1);
  assert.ok(Math.abs(d(232.5) - .5) < 1e-9); assert.equal(d(240), 0); assert.equal(d(240 + 200), 1);
  const { g, r } = field(); g.step(DT, {}); assert.equal(r.night, false);
  r.seconds = 170; g.step(DT, {}); assert.equal(r.night, true); assert.equal(r.darkness, 1);
  r.seconds = 250; g.step(DT, {}); assert.equal(r.night, false);
});

test('herbivores sleep in a huddle at night and notice a moving player later', () => {
  const run = night => {
    const { g, r } = field(); r.seconds = night ? 170 : 20; g.step(DT, {});
    const herd = [0, 1, 2].map(i => { const e = g.spawn('parasaurolophus', { x: 1400 + i * 150, y: 1200 + (i % 2) * 120 }); Object.assign(e, { alert: false, herdId: 'h1', naturalTime: 0, fleeUntil: 0 }); return e; });
    const spread = () => Math.max(...herd.map(a => Math.max(...herd.map(b => Math.hypot(a.x - b.x, a.y - b.y)))));
    const before = spread(); Object.assign(r.player, { x: 300, y: 300 });
    for (let i = 0; i < 6 * 30; i++) g.step(DT, {});
    const huddle = spread(), sleeping = herd.every(e => e.activity === 'sleep');
    Object.assign(r.player, { x: herd[0].x + 200, y: herd[0].y }); r.player.moving = true; // a moving hunter at 200 px
    for (let i = 0; i < 10; i++) g.step(DT, { x: .01, y: 0 });
    return { before, huddle, sleeping, fled: herd[0].fleeUntil > r.seconds };
  };
  const day = run(false), night = run(true);
  assert.equal(night.sleeping, true); assert.ok(night.huddle < night.before, 'they move together ' + night.before.toFixed(0) + ' → ' + night.huddle.toFixed(0));
  assert.equal(day.sleeping, false); assert.equal(day.fled, true, 'by day they flee at 200 px'); assert.equal(night.fled, false, 'asleep they do not');
});

test('compy packs are bold at night: two alert compys attack instead of rallying/watching for 4', () => {
  const run = night => { const { g, r } = field(); r.seconds = night ? 170 : 20; g.step(DT, {});
    const pack = [0, 1].map(i => { const e = g.spawn('compy', { x: r.player.x + 200 + i * 30, y: r.player.y }); Object.assign(e, { alert: true, herdId: 'c1', hunger: .3, mode: 'chase', lastAttackedAt: -1000 }); return e; });
    let watched = 0; for (let i = 0; i < 60; i++) { g.step(DT, {}); watched += pack.filter(e => ['watch', 'rally'].includes(e.activity)).length; }
    return { watched, close: Math.min(...pack.map(e => Math.hypot(e.x - r.player.x, e.y - r.player.y))) }; };
  const day = run(false), night = run(true);
  assert.ok(day.watched > 0, 'by day a pair keeps its distance'); assert.equal(night.watched, 0, 'at night they come in');
  assert.ok(night.close < day.close);
});

test('kills at night count as nightKills; the night_stalker title needs 15', () => {
  const { g, r } = field(); r.seconds = 20; g.step(DT, {});
  const kill = () => { const e = g.spawn('compy', { x: r.player.x + 400, y: r.player.y }); e.hp = 0; g.kill(e); };
  kill(); assert.equal(r.partB.nightKills, 0, 'day kill');
  r.seconds = 170; g.step(DT, {}); for (let i = 0; i < 15; i++) kill(); assert.equal(r.partB.nightKills, 15);
  r.invulnerable = 0; g.damage(99999); assert.equal(r.summary.nightKills, 15);
  const t = require('../PRIMAL_RUN_Game/src/run_titles.js').titles.find(x => x.id === 'night_stalker');
  assert.notEqual(t.implementationStatus, 'needs Part B'); assert.ok(t.test(r.summary)); assert.ok(!t.test({ ...r.summary, nightKills: 14 }));
});

test('flag off: always day, no nightKills field', () => {
  C.FEATURES.dayNight = false;
  try { const { g, r } = field(); r.seconds = 170; g.step(DT, {}); assert.equal(r.night, false); assert.equal(r.darkness, 0); assert.equal('nightKills' in r.partB, false); }
  finally { C.FEATURES.dayNight = true; }
});
