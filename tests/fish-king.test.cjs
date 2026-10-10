'use strict';
// B8 Baryonyx-fiskekonge (PART_B_PLAN, FEATURES.fishKing): 30 fish as Baryonyx → achievement + palette-swap skin.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const { runOne } = require('../tools/playstyle_sim.cjs');
const memory = () => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)) }; };
function river(species, storage = null) {
  const g = new C.Game({ storage, random: () => .5 }); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.selectSpecies(species); g.start({ seed: 5 });
  const r = g.run; r.stage = 1; r.map = C.createMap(1, 5); const school = r.map.fishSchools.find(f => f.stock > 0 && C.isWater(1, r.map, f, 14)); school.stock = 99;
  return { g, school };
}

test('only fish caught as Baryonyx count; 30 unlock "Fiskekonge" (+15 DNA) and its skin, once', () => {
  const { g, school } = river('baryonyx');
  assert.equal(g.save.baryonyxFish, 0); assert.equal(g.save.skins.includes('fishKing'), false);
  for (let i = 0; i < 29; i++) g.catchFish(school);
  g.checkAchievements(); assert.equal(g.save.achievements.fishKing, undefined, '29 is not enough');
  const dna = g.save.dna; g.catchFish(school); g.checkAchievements();
  assert.equal(g.save.baryonyxFish, 30); assert.ok(g.save.achievements.fishKing > 0); assert.ok(g.save.skins.includes('fishKing'));
  assert.equal(g.save.dna - dna, 15);
  g.checkAchievements(); assert.equal(g.save.skins.filter(s => s === 'fishKing').length, 1);
  const a = C.ACHIEVEMENTS.find(x => x.id === 'fishKing'); assert.match(a.text, /30 fisk som Baryonyx/);
  assert.equal(C.SKINS.fishKing.achievement, 'fishKing'); assert.equal(C.SKINS.fishKing.species, 'baryonyx');
});

test('other species never count (their catchFish is a no-op for non-piscivores)', () => {
  for (const species of ['deinosuchus', 'velociraptor', 'compy']) { const { g, school } = river(species); for (let i = 0; i < 40; i++) g.catchFish(school); assert.equal(g.save.baryonyxFish, 0, species); }
});

test('the count and the skin survive save/load; old skins and unlocks are preserved; corrupt counts become 0', () => {
  const storage = memory(), { g, school } = river('baryonyx', storage);
  for (let i = 0; i < 30; i++) g.catchFish(school); g.checkAchievements(); g.persist();
  const loaded = new C.Game({ storage, random: () => .5 });
  assert.equal(loaded.save.baryonyxFish, 30); assert.ok(loaded.save.skins.includes('fishKing'));
  const old = C.sanitizeSave({ version: 2, skins: ['classic', 'male', 'albino'], skin: 'albino', unlockedSpecies: ['baryonyx', 'compy'], achievements: { firstBoss: 1 } });
  assert.deepEqual(old.skins, ['classic', 'male', 'albino']); assert.equal(old.skin, 'albino'); assert.ok(old.unlockedSpecies.includes('baryonyx'));
  assert.equal(old.baryonyxFish, 0, 'no invented history');
  for (const bad of [-5, 'x', NaN, null, 1e12]) assert.ok(Number.isInteger(C.sanitizeSave({ baryonyxFish: bad }).baryonyxFish));
  assert.equal(C.sanitizeSave({ baryonyxFish: -5 }).baryonyxFish, 0);
  assert.equal(C.sanitizeSave({ skins: ['fishKing'], skin: 'fishKing' }).skin, 'fishKing', 'a saved fishKing skin stays selected');
});

test('the skin only applies to Baryonyx; the flag off stops counting; the Baryonyx bot fishes toward it', () => {
  assert.equal(C.skinFits('fishKing', 'baryonyx'), true); assert.equal(C.skinFits('fishKing', 'tyrannosaurus'), false); assert.equal(C.skinFits('male', 'compy'), true);
  C.FEATURES.fishKing = false;
  try { const { g, school } = river('baryonyx'); g.catchFish(school); assert.equal(g.save.baryonyxFish, 0); } finally { C.FEATURES.fishKing = true; }
  const fish = []; const core = C.Game.prototype.catchFish;
  C.Game.prototype.catchFish = function (...a) { const n = core.apply(this, a); fish.push(this.save.baryonyxFish); return n; };
  try { const o = runOne(C, { species: 'baryonyx', style: 'average', seed: 7, seconds: 240, dt: 1 / 30 }); assert.ok(o.fishCaught > 0, 'the bot fishes'); assert.equal(fish[fish.length - 1], o.fishCaught); }
  finally { C.Game.prototype.catchFish = core; }
});
