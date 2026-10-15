'use strict';
// Askebanen (FEATURES.ashLevel): the secret 9th level after Ragnar, opened only when every secret of the run was found.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const DT = 1 / 30;
function atRagnar(seed = 5) {
  const g = new C.Game({}); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.selectSpecies('allosaurus'); g.start({ seed });
  for (let i = 0; i < 7; i++) { g.phase = 'cleared'; g.run.bossDefeated = true; g.nextStage(); }
  return g;
}
function findAll(r) { r.missedSecrets = 0; for (const s of r.map.sites) s.claimed = true; for (const e of r.map.events) e.claimed = true; }
const clear = g => { g.phase = 'cleared'; g.run.bossDefeated = true; return g.nextStage(); };
const steps = (g, seconds) => { for (let i = 0; i < seconds / DT && g.phase === 'playing'; i++) g.step(DT, {}); };

test('a missed secret ends the run with the normal victory after Ragnar', () => {
  const g = atRagnar(); clear(g);
  assert.equal(g.phase, 'result'); assert.equal(g.run.result.victory, true); assert.equal(g.run.ashWorld, undefined);
});

test('with the flag off, finding every secret changes nothing', () => {
  const old = C.FEATURES.ashLevel; C.FEATURES.ashLevel = false;
  try { const g = atRagnar(); findAll(g.run); clear(g); assert.equal(g.phase, 'result'); assert.equal(g.run.ashWorld, undefined); }
  finally { C.FEATURES.ashLevel = old; }
});

test('every secret found: the meteor opens a hidden 9th level with scarce life and no ordinary T-rex', () => {
  const g = atRagnar(), r = g.run, before = r.enemies.length; findAll(r); clear(g);
  assert.equal(g.phase, 'playing'); assert.equal(r.ashWorld, true); assert.equal(r.levelIndex, 8);
  assert.equal(g.currentLevel().name, 'Askebanen'); assert.equal(C.LEVELS.length, 8, 'the shared level list is untouched');
  assert.ok(r.enemies.length < before * .5, 'most animals are gone'); assert.ok(r.ashCraters.length > 0);
  assert.ok(g.drainEvents().some(e => e.type === 'meteor'));
  steps(g, 15); assert.equal(r.enemies.filter(e => e.kind === 'tyrannosaurus' && !e.ashStalker).length, 0);
});

test('hunger drains health without food but never below the floor', () => {
  const g = atRagnar(); findAll(g.run); clear(g); const r = g.run;
  r.enemies = []; r.spawnTimer = 1e9; r.ashStalker = null; r.invulnerable = 1e9;
  steps(g, 30); assert.ok(r.health < r.maxHealth, 'hungry'); steps(g, 400);
  assert.ok(Math.abs(r.health - r.maxHealth * C.ASH.hungerFloor) < 1, 'stops at the floor');
});

test('Ragnar den Arrede stalks the player, cannot be killed early and retreats when wounded', () => {
  const g = atRagnar(); findAll(g.run); clear(g); const r = g.run; r.invulnerable = 1e9;
  steps(g, C.ASH.stalkerAt + 1); const s = r.enemies.find(e => e.ashStalker);
  assert.ok(s && s.scarred, 'he arrives'); steps(g, 4); assert.equal(s.mode === 'chase' || s.alert, true);
  s.hp = 0; g.kill(s); assert.equal(r.enemies.includes(s), false, 'he flees instead of dying');
  assert.ok(r.ashStalker && r.ashStalker.hp > 0 && r.ashStalker.back > r.seconds);
});

test('the final fight is a bigger, scarred and stronger Ragnar; beating him banks the survivor bonus', () => {
  const g = atRagnar(); findAll(g.run); clear(g); const r = g.run; r.invulnerable = 1e9;
  r.meat = 99; steps(g, 2); const boss = r.enemies.find(e => e.boss);
  assert.ok(boss && boss.scarred && boss.visualScale > 2); assert.equal(boss.bossName, C.ASH.level.bossName);
  const score = r.score; g.kill(boss); boss.hp = 0; r.enemies = r.enemies.filter(e => e !== boss); r.bossDefeated = true; g.phase = 'cleared'; g.nextStage();
  assert.equal(r.result.victory, true); assert.equal(r.result.ashSurvivor, true); assert.equal(r.result.stage, 9);
  assert.ok(r.result.score >= score + C.ASH.bonus); assert.ok(g.save.achievements.ashSurvivor);
});

test('dying in the ash keeps the victory and marks the score', () => {
  const g = atRagnar(); findAll(g.run); clear(g); const r = g.run; g.finish(false);
  assert.equal(r.result.victory, true); assert.equal(r.result.ash, true); assert.equal(r.result.ashSurvivor, false);
  const saved = C.sanitizeSave(JSON.parse(JSON.stringify(g.save))); assert.equal(saved.scores[0].ash, true); assert.equal(saved.scores[0].stage, 9);
});

test('daily hunts never open the ash level', () => {
  const g = new C.Game({}); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.startDaily(Date.UTC(2026, 9, 15));
  for (let i = 0; i < 7; i++) clear(g); assert.ok(g.run.daily); findAll(g.run); clear(g); assert.equal(g.phase, 'result'); assert.equal(g.run.ashWorld, undefined);
});
