'use strict';
// Flok 2.0 (2026-10-23): FEATURES.kinPack (own species, size budget, alpha, juveniles, quarrels), packFollow,
// packOrders (Q cycles Angrib / Forsvar mig / Hold dig væk), packFeedback and the 60 % aggro share.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const DT = 1 / 30;
function setup(species = 'velociraptor', seed = 3) {
  const g = new C.Game({ random: () => .5 }); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.selectSpecies(species);
  g.start({ seed }); const r = g.run; r.enemies = []; r.spawnTimer = 1e9; r.invulnerable = 1e9; g.phase = 'playing';
  return { g, r };
}
const hire = (r, n = r.raptors.length) => r.raptors.slice(0, n).forEach((a, i) => Object.assign(a, { ally: true, mode: 'follow', slot: i, x: r.player.x - 40 - 20 * i, y: r.player.y + 30 }));
const limit = (species, third = 0) => { const { r } = setup(species); r.mutations.thirdMate = third; return C.packLimitOf(r); };

test('wild recruits are your own species with a share of its stats', () => {
  for (const species of ['velociraptor', 'tyrannosaurus', 'compy']) {
    const { r } = setup(species), sp = C.PLAYER_SPECIES[species], wild = r.raptors.filter(a => !a.ally);
    assert.ok(wild.length > 0, species);
    for (const a of wild) {
      assert.equal(a.kind, species); assert.equal(a.kin, true);
      const k = a.alpha ? C.KIN.alpha : 1;
      assert.equal(a.maxHP, Math.max(8, Math.round(sp.hp * C.KIN.hp * k))); assert.ok(Math.abs(a.damage - sp.damage * C.KIN.damage * k) < 1e-9);
      assert.equal(a.speed, sp.speed);
    }
  }
});

test('the pack budget follows body size; Tredje fælle adds one point', () => {
  assert.equal(limit('velociraptor'), 2); assert.equal(limit('velociraptor', 1), 3);
  assert.equal(limit('compy'), 4); assert.equal(limit('compy', 1), 6);
  assert.equal(limit('tyrannosaurus'), 1); assert.equal(limit('tyrannosaurus', 1), 1);
  assert.equal(limit('parasaurolophus'), 3); assert.equal(limit('spinosaurus'), 0); assert.equal(limit('spinosaurus', 1), 0);
  const { r } = setup('spinosaurus'); assert.equal(r.raptors.length, 0, 'no wild kin for a lone hunter');
  assert.equal(setup('parasaurolophus').r.raptors.length, 3, 'the biggest herd');
});

test('flag off: the old velociraptor recruits and count limits come back', () => {
  C.FEATURES.kinPack = false;
  try { const { r } = setup('tyrannosaurus'); assert.ok(r.raptors.every(a => a.kind === 'velociraptor')); assert.equal(C.packLimitOf(r), 2); }
  finally { C.FEATURES.kinPack = true; }
});

test('an alpha costs twice the food and is bigger', () => {
  const { g, r } = setup(); const wild = r.raptors[0]; Object.assign(wild, { alpha: true }); r.raptors.length = 1;
  Object.assign(r.player, { x: wild.x + 40, y: wild.y }); r.meat = 100;
  let presses = 0; while (!wild.ally && presses < 20) { g.feedRaptor(); presses++; }
  assert.equal(wild.ally, true); assert.equal(wild.fed, C.PACK.donate * 2); assert.equal(C.PACK.donate, 8, 'the price is restored');
  const { r: r2 } = setup('velociraptor', 11); const any = r2.raptors.find(a => a.alpha);
  if (any) { assert.equal(any.visualScale, C.KIN.alphaScale); assert.equal(any.maxHP, Math.round(C.PLAYER_SPECIES.velociraptor.hp * C.KIN.hp * C.KIN.alpha)); }
});

test('Ankylosaurus recruits are juveniles that grow each level', () => {
  const { g, r } = setup('ankylosaurus'); const a = r.raptors[0]; a.alpha = false; hire(r, 1);
  assert.equal(a.juvenile, true); assert.equal(a.growth, C.KIN.juvenile); assert.ok(a.visualScale < 1);
  const damage = a.damage; g.stepRaptors(DT); const hp = a.maxHP;
  g.phase = 'cleared'; g.nextStage(); assert.equal(r.levelIndex, 1); assert.ok(r.raptors.includes(a));
  assert.ok(Math.abs(a.growth - (C.KIN.juvenile + C.KIN.grow)) < 1e-9); assert.ok(a.damage > damage); g.stepRaptors(DT); assert.ok(a.maxHP > hp);
  for (let i = 0; i < 5; i++) { g.phase = 'cleared'; g.nextStage(); } assert.equal(a.growth, 1, 'fully grown'); assert.equal(a.visualScale, 1);
});

test('raptors quarrel over meat when your food is low', () => {
  const { g, r } = setup(); hire(r, 2); r.meat = 0;
  const [a, b] = r.raptors; r.pickups.push({ x: a.x + 10, y: a.y, corpseId: 99, value: 3 }); b.x = a.x + 20; b.y = a.y;
  r.player.x = a.x; r.player.y = a.y - 40; for (const x of [a, b]) x.mode = 'follow';
  g.stepRaptors(DT);
  assert.equal(r.pickups.find(p => p.corpseId === 99).value, 2); assert.ok(a.quarrelUntil > r.seconds && b.quarrelUntil > r.seconds);
  assert.ok(r.effects.some(e => e.text === 'SKÆNDES OM KØDET'));
  g.stepRaptors(DT); assert.equal(r.pickups.find(p => p.corpseId === 99).value, 2, 'only once in a while');
  const { g: h, r: q } = setup('tyrannosaurus'); q.raptors.forEach(x => { x.ally = true; x.mode = 'follow'; }); q.meat = 0; h.stepRaptors(DT);
  assert.equal(q.stats.packQuarrels, undefined, 'not other species');
});

test('pack orders: Q cycles Angrib, Forsvar mig, Hold dig væk', () => {
  const { g, r } = setup(); hire(r, 2);
  const prey = g.spawn('parasaurolophus', { x: r.player.x + 100, y: r.player.y }); Object.assign(prey, { speed: 0, alert: true, damage: 4, mode: 'idle', lastAttackedAt: r.seconds });
  assert.equal(C.packOrderOf(r), 'attack'); assert.ok(g.allyTargets(g.packTarget()).size > 0, 'attack: your target');
  assert.equal(g.packCommand(), true); assert.equal(r.packOrder, 'defend');
  assert.equal(g.allyTargets(g.packTarget()).size, 0, 'defend: not your prey');
  Object.assign(prey, { mode: 'windup', timer: 5, windupDuration: 5 }); assert.equal(g.allyTargets(g.packTarget()).get(r.raptors[0]), prey, 'defend: what attacks you');
  g.packCommand(); assert.equal(r.packOrder, 'passive'); assert.equal(g.allyTargets(g.packTarget()).size, 0); assert.equal(g.packTarget(), null);
  g.packCommand(); assert.equal(r.packOrder, 'attack'); assert.ok(r.packFocus, 'entering Angrib sends the pack');
});

test('calmer following: a fight breaks off only beyond 400 px, and far allies sprint', () => {
  const { g, r } = setup(); hire(r, 1); r.raptors.length = 1; const a = r.raptors[0];
  const foe = g.spawn('carnotaurus', { x: r.player.x + 150, y: r.player.y }); Object.assign(foe, { speed: 0, alert: true, damage: 5, hp: 999, maxHP: 999, lastAttackedAt: r.seconds });
  Object.assign(a, { x: foe.x - 30, y: foe.y, mode: 'follow', cooldown: 1 }); g.stepRaptors(DT); assert.equal(a.mode, 'attack');
  r.player.x -= 180; r.seconds += 7; g.stepRaptors(DT); assert.equal(a.mode, 'attack', 'keeps fighting at 330 px');
  C.FEATURES.packFollow = false; try { a.mode = 'attack'; g.stepRaptors(DT); assert.equal(a.mode, 'follow', 'old leash'); } finally { C.FEATURES.packFollow = true; }
  r.enemies = []; Object.assign(a, { x: r.player.x - 400, y: r.player.y, mode: 'follow' }); const x0 = a.x; g.stepRaptors(DT);
  assert.ok(a.x - x0 > a.speed * DT * 1.9, 'sprints to catch up');
});

test('aggro share and visible help: the ally takes 60 % and it is counted; a pack kill says so', () => {
  const { g, r } = setup(); hire(r, 1); r.raptors.length = 1; const a = r.raptors[0];
  const foe = g.spawn('carnotaurus', { x: r.player.x + 160, y: r.player.y }); Object.assign(foe, { alert: true, damage: 10 });
  assert.equal(g.allyProvoke(foe, a), true); assert.ok(foe.allyMarkUntil > r.seconds, 'marked as taken by the pack');
  Object.assign(r.player, { x: r.player.x - 120 }); a.x = foe.x - 40; a.y = foe.y; a.cooldown = 99; a.hp = a.maxHP = a.baseMaxHP = 200;
  let lost = 0; for (let i = 0; i < 4 * 30 && !lost; i++) { const before = a.hp; g.step(DT, {}); lost = before - a.hp; }
  assert.ok(Math.abs(lost - foe.damage * .6) < 1e-6, 'bite x0.6'); assert.ok(Math.abs(r.stats.packDamageAbsorbed - lost) < 1e-6);
  const prey = g.spawn('compy', { x: r.player.x + 500, y: r.player.y }); prey.packKill = a.kind; prey.hp = 0; g.kill(prey);
  assert.ok(r.effects.some(e => e.text === 'FLOKDRAB')); assert.equal(r.stats.packKills, 1);
});
