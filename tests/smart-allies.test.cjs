'use strict';
// FEATURES.smartAllies: allies defend you first, split two attackers, delay a windup, flee later and catch up.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const DT = 1 / 30;
function field(seed = 3) {
  const g = new C.Game({ random: () => .5 }); g.start({ seed }); const r = g.run; r.enemies = []; r.spawnTimer = 1e9; r.invulnerable = 1e9;
  r.raptors.forEach((a, i) => Object.assign(a, { ally: true, mode: 'follow', slot: i, x: r.player.x - 40 - 20 * i, y: r.player.y + 30 }));
  return { g, r, allies: r.raptors };
}
const attacker = (g, dx, dy) => { const r = g.run, e = g.spawn('carnotaurus', { x: r.player.x + dx, y: r.player.y + dy }); Object.assign(e, { alert: true, speed: 0, mode: 'windup', timer: 5, windupDuration: 5 }); return e; };

test('an animal winding up at you is the first target, even when you fight something else', () => {
  const { g, r, allies } = field();
  const prey = g.spawn('parasaurolophus', { x: r.player.x - 120, y: r.player.y }); prey.lastAttackedAt = r.seconds; prey.speed = 0;
  const foe = attacker(g, 150, 0);
  const picks = g.allyTargets(g.packTarget());
  assert.equal(picks.get(allies[0]), foe); assert.equal(picks.get(allies[1]), foe);
});

test('two attackers: each ally takes one', () => {
  const { g, allies } = field(); const a = attacker(g, 120, 0), b = attacker(g, -130, 0);
  const picks = g.allyTargets(g.packTarget());
  assert.deepEqual(new Set([picks.get(allies[0]), picks.get(allies[1])]), new Set([a, b]));
});

test('a bite during a windup holds it back once; bosses are not delayed', () => {
  const { g, r } = field(); const e = attacker(g, 100, 0); e.timer = .5;
  g.allyInterrupt(e); assert.ok(Math.abs(e.timer - .85) < 1e-9); g.allyInterrupt(e); assert.ok(Math.abs(e.timer - .85) < 1e-9, 'once per windup');
  const boss = attacker(g, -100, 0); boss.boss = true; boss.timer = .5; g.allyInterrupt(boss); assert.equal(boss.timer, .5);
  r.seconds += 2; e.timer = .5; g.allyInterrupt(e); assert.ok(e.timer > .5, 'the next windup can be delayed again');
});

test('allies stay in the fight down to 25 % HP and return at 50 %', () => {
  const { g, r, allies } = field(); const ally = allies[0]; allies[1].ally = false; allies[1].x = allies[1].homeX = r.player.x + 2000;
  const foe = attacker(g, 90, 0); ally.x = foe.x - 40; ally.y = foe.y; ally.hp = ally.maxHP * .3; ally.cooldown = 1;
  g.stepRaptors(DT); assert.equal(ally.mode, 'attack');
  r.enemies = []; ally.mode = 'flee'; ally.hp = ally.maxHP * .45; g.stepRaptors(DT); assert.equal(ally.mode, 'flee');
  ally.hp = ally.maxHP * .5; g.stepRaptors(DT); assert.equal(ally.mode, 'follow');
});

test('an ally far away reappears beside you', () => {
  const { g, r, allies } = field(); const ally = allies[0]; ally.x = r.player.x + 900; ally.y = r.player.y;
  g.stepRaptors(DT); assert.ok(Math.hypot(ally.x - r.player.x, ally.y - r.player.y) < 150);
});

test('flag off: the whole pack shares one target and flees at 35 %', () => {
  C.FEATURES.smartAllies = false;
  try {
    const { g, r, allies } = field(); const a = attacker(g, 120, 0); attacker(g, -130, 0); a.lastAttackedAt = r.seconds;
    g.stepRaptors(DT); const ally = allies[0]; ally.x = r.player.x + 900; g.stepRaptors(DT);
    assert.ok(Math.hypot(ally.x - r.player.x, ally.y - r.player.y) > 700, 'no catch-up');
  } finally { C.FEATURES.smartAllies = true; }
});

// FEATURES.packMutations: Flokbånd, Alfabrøl, Tredje fælle.
test('Flokbånd: allies get +20 % damage and +15 % HP per rank', () => {
  const { g, r, allies } = field(); const ally = allies[0]; allies[1].ally = false; allies[1].x = r.player.x + 2000;
  r.mutations.packBond = 2; g.stepRaptors(DT); assert.equal(ally.maxHP, Math.round(C.PACK.hp * 1.3));
  const prey = g.spawn('parasaurolophus', { x: ally.x + 20, y: ally.y }); Object.assign(prey, { speed: 0, hp: 500, maxHP: 500, lastAttackedAt: r.seconds });
  ally.cooldown = 0; ally.mode = 'follow'; const before = prey.hp; g.stepRaptors(DT);
  const plain = C.PACK.damage * (1 + r.stage * .25) * 1.5; assert.ok(Math.abs((before - prey.hp) - plain * 1.4) < 1e-6, 'bite x1.4');
});

test('Alfabrøl: the pack command heals allies 30 % and speeds them up for 6 s', () => {
  const { g, r, allies } = field(); r.mutations.alphaRoar = 1; g.phase = 'playing';
  for (const a of allies) a.hp = a.maxHP * .2;
  g.spawn('parasaurolophus', { x: r.player.x + 100, y: r.player.y });
  assert.equal(g.packCommand(), true);
  for (const a of allies) { assert.ok(Math.abs(a.hp - a.maxHP * .5) < 1e-6); assert.ok(a.hasteUntil > r.seconds + 5); }
});

test('Tredje fælle: one more raptor than the species allows; none of the pack mutations for Spinosaurus', () => {
  const { g, r } = field(); r.raptors.forEach(a => { a.ally = false; });
  assert.equal(C.packLimitOf(r), 2); r.mutations.thirdMate = 1; assert.equal(C.packLimitOf(r), 3);
  r.species = 'baryonyx'; assert.equal(C.packLimitOf(r), 2);
  r.species = 'spinosaurus'; assert.equal(C.packLimitOf(r), 0);
  for (const id of ['packBond', 'alphaRoar', 'thirdMate']) assert.equal(g.mutationAvailable(C.MUTATIONS.find(m => m.id === id)), false, id);
  C.FEATURES.packMutations = false;
  try { r.species = 'velociraptor'; assert.equal(C.packLimitOf(r), 2); assert.equal(g.mutationAvailable(C.MUTATIONS.find(m => m.id === 'packBond')), false); }
  finally { C.FEATURES.packMutations = true; }
});

test('Tredje fælle lets you feed a third raptor', () => {
  const { g, r } = field(); r.mutations.thirdMate = 1; g.phase = 'playing';
  const wild = { ...r.raptors[0], id: 'extra', ally: false, mode: 'wild', fed: 0, x: r.player.x + 300, y: r.player.y, homeX: r.player.x + 300, homeY: r.player.y }; r.raptors.push(wild);
  Object.assign(r.player, { x: wild.x + 40, y: wild.y }); r.meat = 50;
  for (let i = 0; i < 10 && !wild.ally; i++) g.feedRaptor();
  assert.equal(wild.ally, true); assert.equal(r.raptors.filter(a => a.ally).length, 3);
});

// FEATURES.allyAggro: an animal turns on whoever hit it last, with a switch lock.
test('aggro: a bitten animal turns on the ally and really hurts it; you are left alone', () => {
  const { g, r, allies } = field(); const ally = allies[0]; allies[1].ally = false; allies[1].x = r.player.x + 3000;
  r.invulnerable = 0; const hp = r.health;
  const foe = g.spawn('carnotaurus', { x: r.player.x + 160, y: r.player.y }); Object.assign(foe, { alert: true, damage: 10 });
  assert.equal(g.allyProvoke(foe, ally), true); assert.equal(foe.allyFoe, ally.id);
  Object.assign(r.player, { x: r.player.x - 120 }); ally.x = foe.x - 40; ally.y = foe.y; ally.cooldown = 99;
  let bitten = false; for (let i = 0; i < 4 * 30 && !bitten; i++) { const before = ally.hp; g.step(DT, {}); bitten = ally.hp < before; }
  assert.ok(bitten, 'the animal bites the ally'); assert.equal(r.health, hp, 'not you');
});

test('aggro lock: no switching back and forth within 3 s; bosses never switch', () => {
  const { g, r, allies } = field(); const [a, b] = allies;
  const foe = g.spawn('carnotaurus', { x: r.player.x + 160, y: r.player.y }); foe.alert = true;
  g.allyProvoke(foe, a); assert.equal(g.allyProvoke(foe, b), false, 'second ally within the lock'); assert.equal(foe.allyFoe, a.id);
  g.provoke(foe); assert.equal(foe.allyFoe, a.id, 'your hit within the lock does not take it back');
  r.seconds += 3.1; g.provoke(foe); assert.equal(foe.allyFoe, null, 'after the lock your hit wins it back');
  assert.equal(g.allyProvoke(foe, b), false, 'and that switch is locked too');
  const boss = g.spawn('carnotaurus', { x: r.player.x - 160, y: r.player.y }); boss.boss = true;
  assert.equal(g.allyProvoke(boss, a), false); assert.equal(boss.allyFoe, undefined);
});

test('aggro: the animal lets go when the ally flees', () => {
  const { g, r, allies } = field(); const ally = allies[0];
  const foe = g.spawn('carnotaurus', { x: r.player.x + 160, y: r.player.y }); foe.alert = true;
  g.allyProvoke(foe, ally); ally.mode = 'flee'; ally.hp = 1;
  g.ecologyAI(foe, DT, r.player.x - foe.x, r.player.y - foe.y, 160); assert.equal(foe.allyFoe, null);
});

test('aggro flag off: allies only take the 30 % chip and animals never turn on them', () => {
  C.FEATURES.allyAggro = false;
  try {
    const { g, r, allies } = field(); const ally = allies[0]; allies[1].ally = false; allies[1].x = r.player.x + 3000;
    const foe = g.spawn('carnotaurus', { x: r.player.x + 90, y: r.player.y }); Object.assign(foe, { alert: true, speed: 0, mode: 'windup', timer: 5, windupDuration: 5 });
    ally.x = foe.x - 40; ally.y = foe.y; g.stepRaptors(DT); assert.equal(foe.allyFoe, undefined); assert.ok(ally.hp < ally.maxHP);
  } finally { C.FEATURES.allyAggro = true; }
});
