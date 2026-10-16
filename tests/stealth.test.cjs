'use strict';
// FEATURES.stealth (2026-10-16): while you sneak or hide, animals build awareness instead of seeing you at a fixed
// radius; the eye value follows the most aware animal; sneaking costs stamina while moving; sneak bites are ambushes.
const { test } = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
function setup(kind, facing = -1) {
  const g = new C.Game({}); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.selectSpecies('velociraptor'); g.start({ seed: 11 });
  const r = g.run; r.enemies = []; r.invulnerable = 1e9; r.night = false; const p = r.player;
  const e = g.spawn(kind, { x: p.x + 450, y: p.y }); e.hunger = 0; g.step(1 / 30, {}); e.facingX = facing; e.facingY = 0;
  return { g, r, e };
}
function detectAt(kind, sneak, facing) {
  const { g, r, e } = setup(kind, facing), p = r.player;
  for (let t = 0; t < 900; t++) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (e.alert || e.activity === 'flee' || e.fleeUntil > r.seconds) return d;
    if (d < 30) return 0;
    r.stamina = 100; g.step(1 / 30, { x: (e.x - p.x) / d, y: (e.y - p.y) / d, sneak }); e.facingX = facing; e.facingY = 0;
  }
  return 0;
}
test('sneaking gets you closer to prey, and closer still from behind', () => {
  assert.equal(C.FEATURES.stealth, true);
  const open = detectAt('parasaurolophus', false, -1), front = detectAt('parasaurolophus', true, -1), back = detectAt('parasaurolophus', true, 1);
  assert.ok(open > 250, 'walking in the open: old 280 px rule, got ' + open);
  assert.ok(front < open - 60, `sneaking in front ${front} vs open ${open}`);
  assert.ok(back < front - 60, `sneaking behind ${back} vs front ${front}`);
});
test('the eye rises as you sneak closer and the animal turns to look when suspicious', () => {
  const { g, r, e } = setup('parasaurolophus', -1), p = r.player; let seen = false, peak = 0;
  for (let t = 0; t < 300 && !e.alert && !(e.fleeUntil > r.seconds); t++) {
    const d = Math.hypot(e.x - p.x, e.y - p.y); r.stamina = 100; g.step(1 / 30, { x: (e.x - p.x) / d, y: 0, sneak: true });
    peak = Math.max(peak, r.eye); if (e.suspicious) seen = true;
  }
  assert.ok(peak > C.STEALTH.suspicious, 'eye opened ' + peak); assert.ok(seen, 'suspicious stage reached');
});
test('sneaking drains stamina while moving, stops at 0 and resumes from 20', () => {
  const { g, r } = setup('parasaurolophus'); r.enemies = []; r.stamina = 10;
  for (let t = 0; t < 90; t++) g.step(1 / 30, { x: 0, y: 1, sneak: true });
  assert.equal(r.sneakTired, true); assert.equal(r.sneaking, false);
  const still = r.stamina; for (let t = 0; t < 30; t++) g.step(1 / 30, { x: 0, y: 0, sneak: true });
  assert.ok(r.stamina > still, 'standing still regains stamina');
  r.stamina = 25; g.step(1 / 30, { x: 0, y: 0, sneak: true }); assert.equal(r.sneaking, true);
});
test('a sneak bite on an unaware animal is an ambush', () => {
  const hit = sneak => {
    const { g, r, e } = setup('parasaurolophus', 1), p = r.player; e.x = p.x + 30; e.y = p.y; e.awareness = 0; e.hp = e.maxHP = 9999; p.facing = 'E';
    r.sneaking = sneak; r.random = () => .99; g.random = () => .99; const before = e.hp; g.step(1 / 30, { attack: true, sneak });
    for (let t = 0; t < 40 && e.hp === before; t++) g.step(1 / 30, { sneak });
    return before - e.hp;
  };
  const plain = hit(false), ambush = hit(true);
  assert.ok(plain > 0 && Math.abs(ambush / plain - C.STEALTH.ambush) < .05, `ambush ${ambush} vs plain ${plain}`);
});
