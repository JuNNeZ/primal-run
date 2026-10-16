'use strict';
// FEATURES.titleTips / titleBook / titleAchievements (2026-10-16): the two secret titles are reachable through the ash
// level, title achievements pay out after records.js has awarded the run's titles, and every new text is translated.
const { test } = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const DT = 1 / 30;
function atRagnar(seed = 5) {
  const g = new C.Game({}); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.selectSpecies('allosaurus'); g.start({ seed });
  for (let i = 0; i < 7; i++) { g.phase = 'cleared'; g.run.bossDefeated = true; g.nextStage(); }
  return g;
}
function findAll(r) { r.ashSecrets = r.ashSecrets.map(t => ({ ...t, found: Math.ceil(t.total / 2) })); for (const s of r.map.sites) s.claimed = true; for (const e of r.map.events) e.claimed = true; }
const clear = g => { g.phase = 'cleared'; g.run.bossDefeated = true; return g.nextStage(); };

test('flags are on and the title achievements are registered', () => {
  for (const f of ['titleTips', 'titleBook', 'titleAchievements']) assert.equal(C.FEATURES[f], true, f);
  for (const id of ['titles10', 'titles25', 'titles50', 'titleVeteran', 'titleTriple', 'titleLegendary', 'titleSecret']) assert.ok(C.ACHIEVEMENTS.some(a => a.id === id), id);
});

test('reaching the ash world fills secretLevel; beating Ragnar also fills secretEnding and awards both secret titles', () => {
  const g = atRagnar(); findAll(g.run); clear(g); const r = g.run; r.invulnerable = 1e9; r.meat = 99;
  for (let i = 0; i < 60 && g.phase === 'playing'; i++) g.step(DT, {});
  const boss = r.enemies.find(e => e.boss); g.kill(boss); boss.hp = 0; r.enemies = r.enemies.filter(e => e !== boss); r.bossDefeated = true; g.phase = 'cleared'; g.nextStage();
  assert.equal(r.summary.secretLevel, true); assert.equal(r.summary.secretEnding, true);
  assert.ok(g.save.titles.they_became_birds, 'secret ending title saved');
  assert.ok(g.save.achievements.titleSecret, 'secret title achievement');
});

test('dying in the ash world gives secretLevel but not secretEnding', () => {
  const g = atRagnar(); findAll(g.run); clear(g); const r = g.run; g.finish(false);
  assert.equal(r.summary.secretLevel, true); assert.equal(r.summary.secretEnding, false);
});

test('normal runs leave the secret stats unreported, so the titles stay gated', () => {
  const g = new C.Game({}); g.start({ seed: 3 }); g.finish(false);
  assert.equal(g.run.summary.secretLevel, null); assert.equal(g.run.summary.secretEnding, null);
});

test('collection, repeat and per-run title achievements', () => {
  const g = new C.Game({}), ids = C.RECORDS.TITLES.filter(t => t.rarity === 'common' || t.rarity === 'uncommon').map(t => t.id);
  g.save.titles = Object.fromEntries(ids.slice(0, 9).map(id => [id, { first: '2026-10-16', count: 1 }]));
  g.start({ seed: 2 }); g.finish(false);
  const n = Object.keys(g.save.titles).length;
  assert.equal(!!g.save.achievements.titles10, n >= 10);
  g.save.titles[ids[0]].count = 10; g.start({ seed: 4 }); g.finish(false);
  assert.ok(g.save.achievements.titleVeteran);
  const ach = C.ACHIEVEMENTS.find(a => a.id === 'titleTriple');
  assert.equal(ach.check({ save: g.save, run: { titles: { primary: 'a', secondary: ['b', 'c'] } }, flags: {} }), true);
  assert.equal(ach.check({ save: g.save, run: { titles: { primary: 'a', secondary: ['b'] } }, flags: {} }), false);
});

test('title book texts exist in every full language', () => {
  const I = require('../PRIMAL_RUN_Game/src/i18n.js'); globalThis.PrimalI18n = I; require('../PRIMAL_RUN_Game/src/lang.js');
  const texts = require('../tools/i18n/source/chunk15.json').map(r => r.da.replace(/#/g, '10'));
  for (const lang of I.LANGUAGES.map(l => l.id).filter(l => l !== 'da' && I.coverage(l).entries > 1000 && !['tlh', 'sjn'].includes(l))) {
    I.setLanguage(lang); I.missing.clear(); texts.forEach(t => I.t(t)); assert.deepEqual([...I.missing], [], lang);
  }
  I.setLanguage('da');
});
