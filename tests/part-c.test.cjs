'use strict';
// Part C (2026-10-12): mutation systems, full species sets, lab tracks, abilities, pack leash/command, growth and eggs.
const { test } = require('node:test'), assert = require('node:assert/strict'), C = require('../PRIMAL_RUN_Game/src/core.js');
function make(species = 'compy', seed = 123, save = {}) {
  const g = new C.Game({ random: () => .5 }); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); Object.assign(g.save.upgrades, save.upgrades || {});
  if (save.blueprints) g.save.blueprints = save.blueprints; if (save.mastery) g.save.mastery = save.mastery;
  g.selectSpecies(species); g.start({ seed }); g.run.enemies = []; g.run.spawnTimer = 999; return g;
}
const byId = id => C.MUTATIONS.find(m => m.id === id);
const offer = g => { g.run.xp = g.run.nextXP; g.maybeLevelUp(); assert.equal(g.phase, 'mutation'); return g.run.choices; };

test('every playable species owns five mutations: common, uncommon, rare, epic and legendary', () => {
  for (const id of Object.keys(C.PLAYER_SPECIES)) {
    const own = C.MUTATIONS.filter(m => m.species === id && !m.evolution && !m.twist);
    assert.deepEqual(own.map(m => m.rarity).sort(), ['common', 'epic', 'legendary', 'rare', 'uncommon'], id);
    assert.equal(C.MUTATIONS.filter(m => m.species === id && m.evolution).length, 1, id + ' has one species evolution');
  }
});

test('XP step 2: each dino level costs two more food than the last', () => {
  const g = make(); assert.equal(C.XP_CURVE.step, 2); offer(g); assert.equal(g.run.nextXP, C.XP_CURVE.first + C.XP_CURVE.step);
});

test('banish removes a card for the rest of the run, once per run', () => {
  const g = make(), r = g.run, choices = offer(g), gone = choices[0];
  assert.equal(g.banishLeft(), 1); assert.equal(g.banish(gone), true); assert.equal(g.banishLeft(), 0);
  assert.ok(!r.choices.includes(gone) && r.choices.length === choices.length, 'the card is replaced');
  assert.equal(g.banish(r.choices[0]), false, 'only once');
  assert.equal(g.mutationAvailable(byId(gone)), false); g.choose(r.choices[0]);
  for (let i = 0; i < 20; i++) { if (g.phase !== 'mutation') { r.xp = r.nextXP; g.maybeLevelUp(); } if (g.phase !== 'mutation') break; assert.ok(!r.choices.includes(gone)); g.choose(r.choices[0]); }
});

test('rarity pity: after three offers without rare or better, the next offer has one', () => {
  const g = make(), r = g.run; r.offersWithoutRare = C.PITY.after;
  const choices = offer(g); assert.ok(choices.some(id => ['rare', 'epic', 'legendary', 'evolution'].includes(byId(id).rarity)));
  assert.equal(r.offersWithoutRare, 0);
});

test('every ordinary mutation has a tag; three ranks of a tag switch its set bonus on', () => {
  for (const m of C.MUTATIONS) if (!m.evolution && !m.trophy) assert.ok(C.MUTATION_TAGS[m.tag], m.id + ' has a tag');
  const g = make('compy'), r = g.run, e = g.spawn('carnotaurus', { x: 520, y: 340 }); e.hp = e.maxHP = 500;
  r.mutations.keenClaws = 2; r.mutations.instinct = 0; assert.equal(C.tagCount(r, 'crit'), 2); assert.deepEqual(g.setBonuses(), []);
  r.mutations.keenClaws = 3; assert.deepEqual(g.setBonuses(), ['crit']);
  r.health = 50; g.random = () => 0; g.resolveBite('E'); assert.equal(r.health, 52, 'crits heal 2 with the crit set');
  const d = make('compy'); d.run.mutations.pounce = 3; assert.equal(C.abilityCost(d.run), Math.max(16, 28 - 15 - 6), 'ability set: −6 stamina');
});

test('evolutions: max rank plus partner puts the evolution card in the next offer', () => {
  const g = make('compy'), r = g.run; r.mutations.teeth = 3; r.mutations.quick = 2; r.mutations.keenClaws = 3; r.mutations.bonebreak = 1;
  assert.equal(g.mutationAvailable(byId('frenzyJaws')), false, 'quick is not at max yet');
  const choices = offer(g); assert.ok(choices.includes('killerInstinct'), 'Dræberinstinkt is offered');
  g.choose('killerInstinct'); assert.equal(r.mutations.killerInstinct, 1);
  const e = g.spawn('carnotaurus', { x: 520, y: 340 }); e.hp = e.maxHP = 500; g.random = () => 0; g.resolveBite('E');
  assert.ok(Math.abs(500 - e.hp - C.PLAYER_SPECIES.compy.damage * 2 * (1 + C.UPGRADE_STEP.damage * 0 + .2 * 3) * 1.1) < 1e-6, 'crits deal ×2');
  assert.equal(g.mutationAvailable(byId('swarmKing')), false, 'species evolutions need their own species mutation');
  assert.equal(make('velociraptor').mutationAvailable(byId('swarmKing')), false);
});

test('boss trophies: pick 1 of 2 after each boss but the last, then the level is cleared', () => {
  const g = make('utahraptor'), r = g.run; r.meat = g.currentLevel().target; g.step(.01);
  const boss = r.enemies.find(e => e.boss); boss.hp = 0; g.step(.01);
  assert.equal(g.phase, 'mutation'); assert.equal(r.trophySelection, true); assert.deepEqual(r.choices, ['thickBrow', 'bullyNeck']);
  assert.equal(g.reroll(), false, 'no rerolls on trophies'); assert.equal(g.banish('thickBrow'), false);
  const max = r.maxHealth; assert.equal(g.choose('bullyNeck'), true); assert.equal(r.maxHealth, max + 20); assert.equal(g.phase, 'cleared');
  assert.equal(g.mutationAvailable(byId('thickBrow')), false, 'trophies never appear in normal offers');
  assert.equal(g.nextStage(), true); assert.equal(r.pendingTrophy, false);
});

test('growth stages: each boss adds 6 % species health and 4 % size, up to 7 stages', () => {
  const g = make('carnotaurus'), r = g.run, max = r.maxHealth;
  g.kill(g.spawn('pachycephalosaurus', { x: 900, y: 900 }, true));
  assert.equal(r.growth, 1); assert.equal(r.maxHealth, max + Math.round(C.PLAYER_SPECIES.carnotaurus.hp * C.GROWTH.hp));
  for (let i = 0; i < 10; i++) { g.phase = 'playing'; g.kill(g.spawn('pachycephalosaurus', { x: 900, y: 900 }, true)); }
  assert.equal(r.growth, C.GROWTH.max);
});

test('nest eggs are the reroll currency', () => {
  const g = make(), r = g.run; r.rerolls = 0; const site = { id: 'nest:test', type: 'nest', x: r.player.x + 20, y: r.player.y, claimed: false };
  r.map.sites.push(site); assert.equal(g.interact(), true); assert.equal(g.phase, 'exploration'); g.explore(true);
  assert.equal(r.eggs, 1); assert.equal(g.rerollsLeft(), 1); assert.ok(r.effects.some(e => /ÆG/.test(e.text)));
});

test('lab tracks unlock in order and change the run; prices come from the track', () => {
  const g = new C.Game(); g.save.dna = 1000; g.phase = 'shop';
  const innate = C.UPGRADES.find(u => u.id === 'innate'), wind = C.UPGRADES.find(u => u.id === 'secondWind');
  assert.equal(C.upgradeUnlocked(g.save, innate), false); assert.equal(g.purchase('innate'), false);
  for (const id of ['health', 'damage', 'regen']) assert.equal(g.purchase(id), true);
  assert.equal(C.upgradeUnlocked(g.save, innate), true); assert.equal(C.upgradeUnlocked(g.save, wind), false);
  const dna = g.save.dna; assert.equal(g.purchase('innate'), true); assert.equal(g.save.dna, dna - C.upgradePrice(innate, 0));
  assert.equal(C.upgradeUnlocked(g.save, wind), true);
  const h = make('compy', 123, { upgrades: { innate: 1, memory: 2 } }); assert.equal(h.phase, 'mutation', 'innate: a pick before the run');
  assert.equal(h.run.innateSelection, true); assert.equal(h.rerollsLeft(), C.REROLLS.max, 'memory: +2 rerolls, capped');
  h.choose(h.run.choices[0]); assert.equal(h.phase, 'playing'); assert.equal(h.run.stats.mutations, 1);
});

test('blueprints: bought mutations join the pool; trade-offs pay their price', () => {
  const g = make('compy'); assert.equal(g.mutationAvailable(byId('bloodthirst')), false);
  const b = make('compy', 123, { blueprints: ['bloodthirst', 'thickHide'] }), r = b.run; assert.equal(b.mutationAvailable(byId('bloodthirst')), true);
  r.mutations.bloodthirst = 1; const e = b.spawn('carnotaurus', { x: 520, y: 340 }); e.hp = e.maxHP = 500; b.resolveBite('E');
  assert.ok(Math.abs(500 - e.hp - 6 * 1.3) < 1e-6); r.health = 10; b.awardFood(3, 0, 0); assert.equal(r.health, 10, 'no healing from food');
  r.mutations.thickHide = 1; r.invulnerable = 0; r.health = 50; b.damage(10); assert.ok(Math.abs(r.health - 42) < 1e-9);
  const shop = new C.Game(); shop.save.dna = 100; shop.phase = 'shop'; assert.equal(shop.buyBlueprint('lifeBite'), true); assert.equal(shop.save.dna, 40);
  assert.deepEqual(C.sanitizeSave(JSON.parse(JSON.stringify(shop.save))).blueprints, ['lifeBite']);
});

test('species mastery: bosses banked per species; tier 2 starts with the common mutation, tier 3 adds a reroll', () => {
  const g = make('velociraptor'); g.run.bosses = 4; g.run.invulnerable = 0; g.damage(99999);
  assert.equal(g.save.mastery.velociraptor, 4); assert.equal(g.masteryTier('velociraptor'), 2);
  g.phase = 'menu'; g.start({ seed: 5 }); assert.equal(g.run.mutations.packHunter, 1, 'starts with Flokjæger');
  const h = make('velociraptor', 123, { mastery: { velociraptor: 10 } }); assert.equal(h.rerollsLeft(), C.REROLLS.start + 1);
  assert.deepEqual(C.sanitizeSave({ mastery: { velociraptor: 4, nonsense: 9, compy: -3 } }).mastery, { velociraptor: 4 });
});

test('old saves keep their bindings; the pack command takes Q or the first free key', () => {
  assert.equal(C.sanitizeSave({}).bindings.command, 'KeyQ');
  const old = C.sanitizeSave({ bindings: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', attack: 'Space', ability: 'ShiftLeft', sneak: 'KeyQ', eat: 'KeyF', interact: 'KeyE' } });
  assert.equal(old.bindings.sneak, 'KeyQ'); assert.equal(old.bindings.command, 'KeyG');
  assert.equal(new Set(Object.values(old.bindings)).size, Object.keys(old.bindings).length);
});

test('allies stay on a leash: they ignore far animals and come back; Q sends them after your prey', () => {
  const g = make('velociraptor'), r = g.run; r.invulnerable = 1e9;
  const a = r.raptors[0]; Object.assign(a, { ally: true, mode: 'follow', slot: 0, x: r.player.x - 40, y: r.player.y });
  const far = g.spawn('carnotaurus', { x: r.player.x + 320, y: r.player.y }); Object.assign(far, { alert: true, speed: 0, cooldown: 1e9 }); far.lastAttackedAt = r.seconds;
  for (let i = 0; i < 60; i++) { far.lastAttackedAt = r.seconds; g.step(1 / 30, {}); }
  assert.notEqual(g.packTarget(), far, 'beyond the leash'); assert.ok(Math.hypot(a.x - r.player.x, a.y - r.player.y) < C.PACK.leash);
  assert.equal(g.packCommand(), true); assert.equal(g.packTarget(), far, 'the command reaches farther');
  for (let i = 0; i < 90; i++) g.step(1 / 30, {}); assert.ok(far.hp < far.maxHP, 'and they bite it');
  r.packFocus.until = 0; r.player.x -= 600; for (let i = 0; i < 150; i++) g.step(1 / 30, {});
  assert.ok(Math.hypot(a.x - r.player.x, a.y - r.player.y) < C.PACK.leash + 60, 'they come back when you leave');
});

test('Compy pack call: the dodge calls wild compies for 8 s, at most every 10 s', () => {
  const g = make('compy'), r = g.run; r.stamina = 100; g.step(1 / 30, { pounce: true, x: 1 });
  const called = r.raptors.filter(a => a.temp && a.kind === 'compy'); assert.equal(called.length, 2);
  r.pounceCooldown = 0; r.stamina = 100; g.step(1 / 30, { pounce: true, x: 1 }); assert.equal(r.raptors.filter(a => a.temp).length, 2, 'cooldown');
  for (let i = 0; i < 9 * 30; i++) g.step(1 / 30, {}); assert.equal(r.raptors.filter(a => a.temp).length, 0, 'they leave after 8 s');
  assert.equal(r.raptors.filter(a => a.ally && !a.temp).length, 0, 'called compies are not pack members');
});

test('legendary species mutations change the ability: T. rex roar crit, Pachycephalosaurus meteor', () => {
  const t = make('tyrannosaurus'), tr = t.run; tr.mutations.rexKing = 1; tr.stamina = 100; t.step(1 / 30, { pounce: true });
  assert.equal(tr.roarCrit, 1); const e = t.spawn('carnotaurus', { x: 520, y: 340 }); e.hp = e.maxHP = 900; t.random = () => .99; t.resolveBite('E');
  assert.equal(tr.roarCrit, 0, 'the next bite was a crit'); assert.equal(tr.stats.crits, 1);
  const p = make('pachycephalosaurus'), pr = p.run; pr.mutations.pachyMeteor = 1; pr.stamina = 100;
  const hit = p.spawn('parasaurolophus', { x: pr.player.x, y: pr.player.y + 30 }), near = p.spawn('compy', { x: pr.player.x + 40, y: pr.player.y + 60 }); near.hp = near.maxHP = 100;
  p.step(1 / 30, { pounce: true, x: 0, y: 1 }); assert.ok(hit.hp < hit.maxHP); assert.equal(near.hp, 75, 'the meteor hits animals around the target'); assert.ok(near.stagger >= 1);
});
