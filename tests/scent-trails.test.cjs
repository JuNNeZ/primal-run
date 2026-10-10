'use strict';
// B3 Spor og lugt (PART_B_PLAN, FEATURES.scentTrails): ≤ 200 track points, 40 s fade (rain faster), predators follow them.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const DT = 1 / 30;
function field(species = 'velociraptor', seed = 11) {
  const g = new C.Game({ random: () => .5 }); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.selectSpecies(species); g.start({ seed });
  const r = g.run; r.enemies = []; r.spawnTimer = 1e9; r.map.rocks = []; r.map.ponds = []; r.map.mud = []; r.map.cover = []; Object.assign(r.player, { x: 1500, y: 1200 }); r.invulnerable = 1e9;
  return { g, r };
}
const walk = (g, seconds, input = { x: 1, y: 0 }) => { for (let i = 0; i < seconds * 30; i++) g.step(DT, input); };

test('tracks every 40 px (80 px sneaking), at most 200, oldest dropped first', () => {
  const { g, r } = field(); walk(g, 2);
  const gaps = r.tracks.slice(1).map((p, i) => Math.hypot(p.x - r.tracks[i].x, p.y - r.tracks[i].y));
  assert.ok(r.tracks.length >= 7 && gaps.every(gap => gap >= 39 && gap <= 47), JSON.stringify(gaps));
  const sneak = field(); walk(sneak.g, 5, { x: 1, y: 0, sneak: true });
  const sg = sneak.r.tracks.slice(1).map((p, i) => Math.hypot(p.x - sneak.r.tracks[i].x, p.y - sneak.r.tracks[i].y));
  assert.ok(sg.length && sg.every(gap => gap >= 79), JSON.stringify(sg));
  const long = field(); for (let k = 0; k < 6; k++) { walk(long.g, 5, { x: 1, y: 0 }); walk(long.g, 5, { x: -1, y: 0 }); }
  assert.ok(long.r.tracks.length <= 200); const t = long.r.tracks.map(p => p.t); assert.deepEqual(t, [...t].sort((a, b) => a - b));
  const idle = field(); walk(idle.g, 3, {}); assert.equal(idle.r.tracks.length, 0, 'standing still leaves no tracks');
});

test('tracks fade after 40 s, after 20 s in rain; a wounded player leaves blood scent', () => {
  const { g, r } = field(); walk(g, 1); const n = r.tracks.length; assert.ok(n > 0);
  walk(g, 30, {}); assert.equal(r.tracks.length, n, 'still there after 30 s'); walk(g, 11, {}); assert.equal(r.tracks.length, 0, 'gone after 40 s');
  const rain = field(); rain.r.map.weather = 'rain'; walk(rain.g, 1); walk(rain.g, 21, {}); assert.equal(rain.r.tracks.length, 0, 'rain washes them out in 20 s');
  const hurt = field(); hurt.r.health = hurt.r.maxHealth * .3; walk(hurt.g, 1); assert.ok(hurt.r.tracks.every(p => p.w), 'blood scent below 35 % HP');
  const fine = field(); walk(fine.g, 1); assert.ok(fine.r.tracks.every(p => !p.w));
});

test('an idle predator follows the scent to the player; herbivores and bosses ignore it', () => {
  const { g, r } = field(); walk(g, 4);
  const hunter = g.spawn('carnotaurus', { x: 1420, y: 1300 }); Object.assign(hunter, { alert: false, mode: 'roam', activity: 'roam' });
  const herb = g.spawn('parasaurolophus', { x: 1440, y: 1100 }); Object.assign(herb, { alert: false });
  let found = null, tracked = false;
  for (let i = 0; i < 25 * 30 && found === null; i++) { g.step(DT, {}); tracked ||= hunter.activity === 'track'; if (hunter.alert) found = r.seconds; }
  assert.ok(tracked, 'it tracks'); assert.ok(found !== null, 'and finds the player'); assert.ok(Math.hypot(hunter.x - r.player.x, hunter.y - r.player.y) < 240);
  assert.notEqual(herb.activity, 'track');
  C.FEATURES.scentTrails = false;
  try { const off = field(); walk(off.g, 4); const h = off.g.spawn('carnotaurus', { x: 1420, y: 1300 }); Object.assign(h, { alert: false, mode: 'roam', activity: 'roam' }); for (let i = 0; i < 25 * 30; i++) off.g.step(DT, {}); assert.notEqual(h.activity, 'track'); assert.equal(off.r.tracks, undefined); }
  finally { C.FEATURES.scentTrails = true; }
});

test('blood scent carries 320 px instead of 200; a hidden player is only found at 90 px; LOD beyond 900 px', () => {
  const smell = wounded => { const { g, r } = field(); if (wounded) r.health = r.maxHealth * .3; walk(g, 2); walk(g, .2, {});
    const e = g.spawn('carnotaurus', { x: r.tracks[0].x, y: r.tracks[0].y + 260 }); Object.assign(e, { alert: false, mode: 'roam', activity: 'roam' });
    g.followScent(e, DT, Math.hypot(e.x - r.player.x, e.y - r.player.y)); return !!e.scent; };
  assert.equal(smell(false), false, '260 px from normal tracks: nothing'); assert.equal(smell(true), true, '260 px from blood: smelled');
  const { g, r } = field(); walk(g, 2);
  const far = g.spawn('carnotaurus', { x: r.player.x + 950, y: r.player.y }); Object.assign(far, { alert: false });
  assert.equal(g.followScent(far, DT, 950), false, 'LOD: no scan beyond 900 px');
  const hidden = field(); walk(hidden.g, 3); const e = hidden.g.spawn('carnotaurus', { x: hidden.r.tracks[1].x, y: hidden.r.tracks[1].y + 40 }); Object.assign(e, { alert: false, mode: 'roam', activity: 'roam' });
  hidden.r.hidden = true; let closest = Infinity;
  for (let i = 0; i < 400 && !e.alert; i++) { hidden.g.followScent(e, DT, Math.hypot(e.x - hidden.r.player.x, e.y - hidden.r.player.y)); closest = Math.min(closest, Math.hypot(e.x - hidden.r.player.x, e.y - hidden.r.player.y)); }
  assert.ok(e.alert ? closest < 92 : true, 'hidden: alerts only within 90 px (closest ' + closest.toFixed(0) + ')');
});

test('cost: a scent scan over a full 200-point trail is cheap (≤ 0.05 ms per predator scan, best of 5)', () => {
  const { g, r } = field(); r.tracks = Array.from({ length: 200 }, (_, i) => ({ x: 1500 + i * 8, y: 1200, t: r.seconds, w: i % 5 === 0 }));
  const preds = Array.from({ length: 30 }, (_, i) => { const e = g.spawn('carnotaurus', { x: 1500 + i * 50, y: 1300 }); e.alert = false; return e; });
  let best = Infinity;
  for (let k = 0; k < 5; k++) { const t0 = process.hrtime.bigint(); for (let j = 0; j < 20; j++) for (const e of preds) { e.scentAt = -1; g.followScent(e, DT, 300); } best = Math.min(best, Number(process.hrtime.bigint() - t0) / 1e6 / (20 * preds.length)); }
  assert.ok(best <= .05, best.toFixed(4) + ' ms');
});
