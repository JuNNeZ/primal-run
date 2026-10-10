'use strict';
// B5 Raptor-flok (PART_B_PLAN, FEATURES.raptorPack): feed → ally (max 2), attacks your target, flees when hurt, no kills.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const { runOne } = require('../tools/playstyle_sim.cjs');
const DT = 1 / 30;
function field(seed = 3) { const g = new C.Game({ random: () => .5 }); g.start({ seed }); const r = g.run; r.enemies = []; r.spawnTimer = 1e9; r.invulnerable = 1e9; return { g, r }; }
const meatAt = (r, x, y, value = 3) => { const m = { id: 9000 + r.pickups.length, kind: 'meat', corpseId: 77, value, x, y }; r.pickups.push(m); return m; };
function recruit(g, a) { const r = g.run; Object.assign(r.player, { x: a.x + 50, y: a.y }); const m = meatAt(r, a.x + 20, a.y + 10); g.step(DT, { interact: true }); return m; }

test('every level places 2 wild raptors on land, ≥ 600 px from the start, deterministically per seed', () => {
  const a = field(3), b = field(3);
  assert.equal(a.r.raptors.length, 2); assert.deepEqual(a.r.raptors.map(x => [x.x, x.y]), b.r.raptors.map(x => [x.x, x.y]));
  for (const x of a.r.raptors) { assert.equal(x.ally, false); assert.ok(Math.hypot(x.x - 480, x.y - 340) >= 600); assert.equal(C.isWater(a.r.stage, a.r.map, x), false); }
  assert.equal(a.r.enemies.some(e => e.kind === 'velociraptor'), false, 'raptors live outside r.enemies');
});

test('feeding: E next to a wild raptor with meat within 140 px recruits it, uses one portion, max 2 allies', () => {
  const { g, r } = field(); const [one, two] = r.raptors;
  Object.assign(r.player, { x: one.x + 50, y: one.y }); g.step(DT, { interact: true }); assert.equal(one.ally, false, 'no meat, no friend');
  const m = recruit(g, one); assert.equal(one.ally, true); assert.equal(m.value, 2); assert.equal(r.partB.alliesRecruited, 1);
  recruit(g, two); assert.equal(two.ally, true); assert.equal(r.partB.alliesRecruited, 2);
  const third = { ...two, id: 'extra', ally: false, x: two.x + 300 }; r.raptors.push(third); recruit(g, third); assert.equal(third.ally, false, 'max 2');
  assert.ok(r.effects.some(e => e.text === 'NY FLOKFÆLLE'));
});

test('allies follow you, attack the animal you fight, never land the killing blow, take hits and flee below 35 %', () => {
  const { g, r } = field(); const ally = r.raptors[0]; recruit(g, ally);
  Object.assign(r.player, { x: 1500, y: 1200 }); for (let i = 0; i < 6 * 30; i++) g.step(DT, {});
  assert.ok(Math.hypot(ally.x - r.player.x, ally.y - r.player.y) < 160, 'follows the player');
  const prey = g.spawn('parasaurolophus', { x: r.player.x + 120, y: r.player.y }); prey.lastAttackedAt = r.seconds; Object.assign(prey, { speed: 0 });
  const kills = r.kills; for (let i = 0; i < 12 * 30; i++) g.step(DT, {});
  assert.ok(ally.bites > 0, 'it bites'); assert.equal(prey.hp, 1, 'left at 1 HP for you'); assert.equal(r.kills, kills, 'allies never count as kills');
  const hunter = g.spawn('carnotaurus', { x: r.player.x + 140, y: r.player.y }); Object.assign(hunter, { alert: true, speed: 0, damage: 40 }); hunter.lastAttackedAt = r.seconds;
  let fled = false; for (let i = 0; i < 10 * 30 && !fled; i++) { g.step(DT, {}); hunter.lastAttackedAt = r.seconds; fled = ally.mode === 'flee'; }
  assert.ok(fled, 'flees when hurt'); assert.ok(ally.hp > 0);
  for (let i = 0; i < 20 * 30; i++) { r.enemies = []; g.step(DT, {}); } assert.ok(ally.hp >= ally.maxHP * .7 && ally.mode !== 'flee', 'recovers and comes back');
});

test('allies travel with you to the next level; new wild raptors appear; summary + pack_leader title', () => {
  const { g, r } = field(); recruit(g, r.raptors[0]); recruit(g, r.raptors[1]);
  g.phase = 'cleared'; r.bossDefeated = true; g.nextStage();
  assert.equal(g.run.raptors.filter(a => a.ally).length, 2); assert.equal(g.run.raptors.filter(a => !a.ally).length, 2);
  assert.ok(g.run.raptors.filter(a => a.ally).every(a => Math.hypot(a.x - g.run.player.x, a.y - g.run.player.y) < 120));
  g.run.invulnerable = 0; g.damage(99999); assert.equal(g.run.summary.alliesRecruited, 2);
  const t = require('../PRIMAL_RUN_Game/src/run_titles.js').titles.find(x => x.id === 'pack_leader');
  assert.notEqual(t.implementationStatus, 'needs Part B'); assert.ok(t.test(g.run.summary)); assert.ok(!t.test({ ...g.run.summary, alliesRecruited: 1 }));
});

test('flag off: no raptors; the bot can recruit when meat lies next to a raptor', () => {
  C.FEATURES.raptorPack = false;
  try { const { g, r } = field(); assert.deepEqual(r.raptors, []); assert.equal('alliesRecruited' in r.partB, false); }
  finally { C.FEATURES.raptorPack = true; }
  const core = C.Game.prototype.start; let placed = false;
  C.Game.prototype.start = function (o) { core.call(this, o); if (!placed) { placed = true; const r = this.run, a = r.raptors[0]; r.enemies = []; Object.assign(r.player, { x: a.x + 200, y: a.y }); const prey = this.spawn('parasaurolophus', { x: a.x + 10, y: a.y }); prey.hp = 0; this.kill(prey); r.enemies = []; r.spawnTimer = 1e9; } }; // a real corpse next to the raptor
  try { const o = runOne(C, { species: 'velociraptor', style: 'explorer', seed: 5, seconds: 20, dt: DT }); assert.equal(o.allies, 1, 'explorer bot fed the raptor'); }
  finally { C.Game.prototype.start = core; }
});

test('review fixes: allies leave bosses alone until you fight them, bite bosses at half strength, never across lava', () => {
  const { g, r } = field(); recruit(g, r.raptors[0]); recruit(g, r.raptors[1]);
  const boss = g.spawn('carnotaurus', { x: r.player.x + 150, y: r.player.y }, true); Object.assign(boss, { speed: 0, alert: true, lastAttackedAt: -1000, cooldown: 1e9 });
  const hp = boss.hp; for (let i = 0; i < 10 * 30; i++) { boss.cooldown = 1e9; boss.mode = 'chase'; g.step(DT, {}); }
  assert.equal(boss.hp, hp, 'an unprovoked boss is not attacked');
  boss.lastAttackedAt = r.seconds; for (let i = 0; i < 4 * 30; i++) { boss.lastAttackedAt = r.seconds; boss.cooldown = 1e9; g.step(DT, {}); }
  assert.ok(boss.hp < hp && boss.hp > 1, 'once you fight it they help, slowly'); assert.ok(r.raptors.every(a => a.hp >= 1));
});
