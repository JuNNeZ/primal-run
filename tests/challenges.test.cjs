'use strict';
// B6 Udfordringer (PART_B_PLAN, FEATURES.challenges): ≤ 3 modifiers, +15 % DNA each, challengeCount, masochist.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const { runOne } = require('../tools/playstyle_sim.cjs');
const DT = 1 / 30;
const game = (ids, seed = 3) => { const g = new C.Game({ random: () => .5 }); g.setChallenges(ids); g.start({ seed }); return g; };

test('at most 3 known challenges; unknown ids and duplicates are dropped; normal runs report challengeCount 0', () => {
  const g = new C.Game({ random: () => .5 });
  assert.deepEqual(g.setChallenges(['fragile', 'fragile', 'nope', 'toughBosses', 'swiftFoes', 'weakHealing']), ['fragile', 'toughBosses', 'swiftFoes']);
  g.start({ seed: 3 }); assert.equal(g.run.partB.challengeCount, 3);
  const plain = game([]); assert.equal(plain.run.partB.challengeCount, 0); assert.deepEqual(plain.run.challenges, []);
  assert.equal(C.CHALLENGES.length >= 5, true);
});

test('each modifier changes exactly its rule', () => {
  const base = game([]), fragile = game(['fragile']);
  assert.equal(fragile.run.maxHealth, Math.round(base.run.maxHealth * .7)); assert.ok(fragile.run.health <= fragile.run.maxHealth);
  const tough = game(['toughBosses']), normal = game([]);
  const b1 = normal.spawn('carnotaurus', { x: 900, y: 900 }, true), b2 = tough.spawn('carnotaurus', { x: 900, y: 900 }, true);
  assert.ok(Math.abs(b2.maxHP - b1.maxHP * 1.3) < 1e-6 && b2.hp === b2.maxHP);
  const n1 = normal.spawn('compy', { x: 900, y: 900 }), n2 = tough.spawn('compy', { x: 900, y: 900 }); assert.equal(n2.maxHP, n1.maxHP, 'tough bosses only');
  const swift = game(['swiftFoes']);
  assert.ok(swift.run.enemies.length > 0 && swift.run.enemies.every((e, i) => Math.abs(e.speed - normal.run.enemies[i].speed * 1.15) < 1e-6), 'animals placed at start are faster too');
  // Weak healing: the same healing step heals half as much.
  // Weak healing: inject a 10 HP heal inside step() (separateDinosaurs runs inside every step).
  const healed = ids => { const g = game(ids); g.run.enemies = []; g.run.spawnTimer = 1e9; g.run.health = 20; g.separateDinosaurs = () => { g.run.health += 10; }; g.step(DT, {}); return g.run.health - 20; };
  assert.equal(healed([]), 10); assert.equal(healed(['weakHealing']), 5);
  // Costly skills: one ability use costs 30 % more stamina.
  const use = ids => { const g = game(ids, 4); g.run.enemies = []; g.run.spawnTimer = 1e9; g.run.stamina = 100; g.step(DT, { x: 1, pounce: true }); return 100 - g.run.stamina; };
  const plainCost = use([]), costly = use(['costlySkills']);
  assert.ok(plainCost > 0); assert.ok(Math.abs(costly - plainCost * 1.3) < 1.5, costly + ' vs ' + plainCost);
});

test('DNA bonus: +15 % per challenge, fractions carried (1-DNA pickups count too)', () => {
  for (const [ids, expect] of [[[], 20], [['fragile'], 23], [['fragile', 'toughBosses', 'swiftFoes'], 29]]) {
    const g = game(ids), start = g.save.dna; for (let i = 0; i < 20; i++) g.addDNA(1);
    assert.equal(g.run.dna, expect, ids.join(',')); assert.equal(g.save.dna - start, expect);
  }
});

test('RunSummary.challengeCount and the masochist title (victory with 3 challenges)', () => {
  const titles = require('../PRIMAL_RUN_Game/src/run_titles.js').titles, t = titles.find(x => x.id === 'masochist');
  assert.notEqual(t.implementationStatus, 'needs Part B');
  const g = game(['fragile', 'toughBosses', 'swiftFoes']);
  for (let i = 0; i < 7; i++) { g.phase = 'cleared'; g.run.bossDefeated = true; g.nextStage(); }
  g.phase = 'cleared'; g.run.bossDefeated = true; g.nextStage(); // last level → victory
  assert.equal(g.run.result.victory, true); assert.equal(g.run.summary.challengeCount, 3);
  assert.ok(t.test(g.run.summary)); assert.equal(g.run.titles.primary, 'masochist', 'legendary priority 96 wins');
  assert.ok(!t.test({ ...g.run.summary, challengeCount: 2 })); assert.ok(!t.test({ ...g.run.summary, victory: false }));
});

test('daily hunt ignores challenges; flag off disables everything; bots can play with challenges', () => {
  const g = new C.Game({ random: () => .5 }); g.setChallenges(['fragile']); g.startDaily(new Date(2026, 9, 10).getTime());
  assert.deepEqual(g.run.challenges, []); assert.equal(g.run.partB.challengeCount, 0);
  C.FEATURES.challenges = false;
  try { const off = new C.Game({ random: () => .5 }); assert.deepEqual(off.setChallenges(['fragile']), []); off.start({ seed: 3 }); assert.equal(off.run.partB.challengeCount, undefined); off.addDNA(1); assert.equal(off.run.dna, 1); }
  finally { C.FEATURES.challenges = true; }
  const o = runOne(C, { species: 'velociraptor', style: 'average', seed: 2, seconds: 60, dt: DT, challenges: ['fragile', 'swiftFoes'] });
  assert.ok(o.seconds > 0);
});
