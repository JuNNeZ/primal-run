'use strict';
// B7 Dagens jagt (PART_B_PLAN, FEATURES.dailyHunt): seed = YYYYMMDD, rotating species, local list per date, dailySeed.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const { runOne } = require('../tools/playstyle_sim.cjs');
const memory = () => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), m }; };
const day = (y, mo, d) => new Date(y, mo - 1, d, 12).getTime();
const die = g => { g.run.invulnerable = 0; g.damage(99999); };

test('seed is the local date as YYYYMMDD and the species rotates over the unlocked species', () => {
  const g = new C.Game({ random: () => .5 });
  assert.equal(g.dailyHunt(day(2026, 10, 10)).seed, 20261010);
  assert.equal(g.dailyHunt(day(2027, 1, 1)).seed, 20270101);
  assert.equal(C.dailyKey(new Date(2026, 11, 31, 23, 59)), 20261231, 'local, not UTC');
  const starters = new Set(); for (let i = 0; i < 6; i++) starters.add(g.dailyHunt(day(2026, 10, 1 + i)).species);
  assert.deepEqual([...starters].sort(), [...g.save.unlockedSpecies].sort(), 'a fresh save only rotates its starters');
  g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); const all = Object.keys(C.PLAYER_SPECIES), seen = [];
  for (let i = 0; i < all.length; i++) seen.push(g.dailyHunt(day(2026, 10, 1) + i * 864e5).species);
  assert.deepEqual([...seen].sort(), [...all].sort(), 'every unlocked species once per cycle');
  assert.notEqual(seen[0], seen[1], 'consecutive days differ');
});

test('the same date gives the same map and species; startDaily does not change the chosen species', () => {
  const a = new C.Game({ random: () => .5 }), b = new C.Game({ random: () => .3 });
  a.selectSpecies('velociraptor'); b.selectSpecies('deinonychus');
  a.startDaily(day(2026, 10, 10)); b.startDaily(day(2026, 10, 10));
  assert.equal(a.run.seed, 20261010); assert.equal(a.run.species, b.run.species);
  assert.deepEqual(a.run.map.rocks, b.run.map.rocks); assert.deepEqual(a.run.map.zones, b.run.map.zones);
  assert.equal(a.save.selectedSpecies, 'velociraptor'); assert.equal(a.run.partB.dailySeed, 20261010);
  const normal = new C.Game({ random: () => .5 }); normal.start({ seed: 20261010 }); assert.equal(normal.run.partB.dailySeed, 0, 'normal runs report dailySeed 0');
});

test('finishing a daily hunt stores a local top 5 for that date that survives save/load and corrupt data', () => {
  const storage = memory(), g = new C.Game({ storage, random: () => .5 });
  for (let i = 0; i < 7; i++) { g.phase = 'menu'; g.startDaily(day(2026, 10, 10)); g.run.score = 100 * i; die(g); }
  const list = g.save.dailyHunts['20261010'];
  assert.equal(list.length, 5); assert.deepEqual(list.map(e => e.score), [600, 500, 400, 300, 200]);
  assert.equal(g.run.daily.rank, 1); assert.equal(g.run.daily.entries, 5);
  g.phase = 'menu'; g.startDaily(day(2026, 10, 10)); g.run.score = 500; die(g); assert.equal(g.run.daily.rank, 3, 'a tie ranks after the earlier attempt');
  g.phase = 'menu'; g.startDaily(day(2026, 10, 10)); g.run.score = 1; die(g); assert.equal(g.run.daily.rank, null, 'outside the top 5');
  const loaded = new C.Game({ storage, random: () => .5 }); assert.deepEqual(loaded.save.dailyHunts, g.save.dailyHunts);
  const raw = { dailyHunts: { 20261010: [{ score: 5, species: 'nope', name: '<b>x</b>' }, { score: 'x' }, null], bad: [{ score: 1 }], 20260101: 'x' } };
  for (let i = 0; i < 20; i++) raw.dailyHunts[String(20260200 + i + 1)] = [{ score: i }];
  const clean = C.sanitizeSave(raw).dailyHunts;
  assert.equal(Object.keys(clean).length, 14, 'only the 14 newest dates'); assert.ok(!('bad' in clean));
  const save = C.sanitizeSave({ dailyHunts: { 20261010: [{ score: 5, species: 'nope', name: 'x' }, { score: 'x' }, null] } }).dailyHunts['20261010'];
  assert.deepEqual(save, [{ name: 'x', species: 'deinonychus', score: 5, level: 1, seconds: 0, victory: false }]);
  // A normal run never touches the daily list.
  g.phase = 'menu'; g.start({ seed: 3 }); die(g); assert.equal(g.save.dailyHunts['20261010'].length, 5);
});

test('RunSummary.dailySeed and the daily_champion title (cleared 4 levels in the daily hunt)', () => {
  const g = new C.Game({ random: () => .5 }); g.startDaily(day(2026, 10, 10));
  for (let i = 0; i < 4; i++) { g.phase = 'cleared'; g.run.bossDefeated = true; g.nextStage(); }
  die(g);
  assert.equal(g.run.summary.dailySeed, 20261010); assert.equal(g.run.summary.levelReached, 5);
  const t = C.RECORDS.TITLES ? C.RECORDS.TITLES.find(x => x.id === 'daily_champion') : require('../PRIMAL_RUN_Game/src/run_titles.js').titles.find(x => x.id === 'daily_champion');
  assert.notEqual(t.implementationStatus, 'needs Part B');
  assert.equal(t.test(g.run.summary), true);
  assert.ok(!t.test({ ...g.run.summary, dailySeed: 0 }), 'normal runs never get it');
  assert.ok(!t.test({ ...g.run.summary, levelReached: 4 }));
  const picked = C.RECORDS.pickTitles(g.run.summary); assert.ok([picked.primary.id, ...picked.secondary.map(x => x.id)].length >= 1);
});

test('flag off: no daily hunt (history kept); bots can play the daily hunt', () => {
  C.FEATURES.dailyHunt = false;
  try { const g = new C.Game({ random: () => .5 }); assert.equal(g.startDaily(day(2026, 10, 10)), false); g.start({ seed: 1 }); assert.equal('dailySeed' in g.run.partB, false);
    assert.deepEqual(C.sanitizeSave({ dailyHunts: { 20261010: [{ score: 9 }] } }).dailyHunts['20261010'].length, 1, 'history is kept while the flag is off'); }
  finally { C.FEATURES.dailyHunt = true; }
  const o = runOne(C, { species: 'compy', style: 'average', seed: 1, seconds: 40, dt: 1 / 30, daily: day(2026, 10, 10) });
  assert.equal(o.seed, 1); assert.ok(o.seconds > 0); assert.ok(Object.keys(C.PLAYER_SPECIES).includes(o.species));
});
