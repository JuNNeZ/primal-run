'use strict';
// FEATURES.bounties / deathTips (2026-10-16): one marked animal per level pays extra DNA, a heal and score; the end
// screen adds one concrete tip to the cause of death.
const { test } = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
function run(seed = 11) {
  const g = new C.Game({}); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.selectSpecies('velociraptor'); g.start({ seed });
  return { g, r: g.run };
}
test('a bounty is marked after the delay and pays out once when killed', () => {
  assert.equal(C.FEATURES.bounties, true);
  const { g, r } = run(); r.invulnerable = 1e9;
  for (let t = 0; t < 30 * (C.BOUNTY.delay + 1) && !(r.bounty && r.bounty.id !== null); t++) g.step(1 / 30, {});
  assert.ok(r.bounty && r.bounty.id !== null, 'bounty marked');
  const e = r.enemies.find(x => x.id === r.bounty.id);
  assert.ok(e && e.bounty && !e.boss && !e.miniboss, 'a normal animal carries the mark');
  const dna = r.dna, score = r.score; r.health = r.maxHealth - 30;
  e.hp = 0; g.kill(e);
  assert.equal(r.bounty.done, true); assert.equal(r.stats.bounties, 1);
  assert.ok(r.dna >= dna + C.BOUNTY.dna, `dna ${dna} -> ${r.dna}`); assert.ok(r.score >= score + C.BOUNTY.score);
  assert.ok(r.effects.some(x => /^DUSØR \+\d+ DNA$/.test(x.text)));
});
test('a lost bounty is replaced after a short wait', () => {
  const { g, r } = run(); r.invulnerable = 1e9;
  for (let t = 0; t < 30 * (C.BOUNTY.delay + 1) && !(r.bounty && r.bounty.id !== null); t++) g.step(1 / 30, {});
  const first = r.bounty.id; r.enemies = r.enemies.filter(e => e.id !== first); g.step(1 / 30, {});
  assert.equal(r.bounty.id, null); assert.ok(r.bounty.at > r.seconds);
});
test('death tips follow the cause of death', () => {
  assert.equal(C.FEATURES.deathTips, true);
  const base = { result: { victory: false }, stats: { damageTaken: 0, healing: 0 } };
  assert.match(C.deathTip({ ...base, summary: { deathCauseType: 'lava' } }), /^Lava/);
  assert.match(C.deathTip({ ...base, summary: { deathBossId: 'x' } }), /^Bossens/);
  assert.match(C.deathTip({ ...base, summary: { deathRival: true } }), /^Rivalen/);
  assert.match(C.deathTip({ ...base, summary: {}, stats: { damageTaken: 200, healing: 10 } }), /^Spis/);
  assert.equal(C.deathTip({ ...base, result: { victory: true } }), '');
  assert.equal(C.deathTip({ ...base, summary: { abandoned: true } }), '');
});
