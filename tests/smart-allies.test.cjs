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
