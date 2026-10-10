'use strict';
// Menu backdrop pilot (FEATURES.menuPilot): the menu's demo dinosaur fights small attackers, flees bosses and big packs.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');

function menuWorld(species, seed) { // same setup as createMenuWorld() in app.js
  const local = (s => () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; })(seed * 7919 + 13);
  const g = new C.Game({ random: local }); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.selectSpecies(species); g.persist = () => {}; g.checkAchievements = () => []; g.start({ seed: (seed * 2654435761) >>> 0 });
  const r = g.run; r.invulnerable = 1e9; r.spawnTimer = 1e9; r.rareRewards = 0; g.offerRareReward = () => false; g.maybeLevelUp = () => {};
  return g;
}
const hostilesNear = r => r.enemies.filter(e => e.hp > 0 && e.damage && Math.hypot(e.x - r.player.x, e.y - r.player.y) < 200).length;
function play(species, seed, on, seconds = 180) {
  C.FEATURES.menuPilot = on;
  try {
    const g = menuWorld(species, seed), r = g.run; let target = 0;
    for (let t = 0; t < seconds * 30; t++) {
      if (g.phase !== 'playing') g.phase = 'playing'; g.setView(1900, 900);
      const zones = r.map.zones, goal = zones[target % zones.length]; if (Math.hypot(goal.x - r.player.x, goal.y - r.player.y) < 90) target++;
      g.step(1 / 30, C.menuPilot(r, goal)); r.invulnerable = 1e9; r.health = r.maxHealth; g.drainEvents();
    }
    return { near: hostilesNear(r), kills: r.kills };
  } finally { C.FEATURES.menuPilot = true; }
}

test('walks to the goal when nothing hunts it; fights a lone Compy; flees a boss', () => {
  const g = menuWorld('deinonychus', 20371), r = g.run, P = r.player, goal = { x: P.x + 500, y: P.y };
  r.enemies = []; let i = C.menuPilot(r, goal); assert.equal(i.mode, 'walk'); assert.ok(i.x > .99 && i.sneak);
  const compy = g.spawn('compy', { x: P.x + 40, y: P.y }); compy.mode = 'chase';
  i = C.menuPilot(r, goal); assert.equal(i.mode, 'fight'); assert.equal(i.attack, true, 'in reach: bites');
  compy.x = P.x + 200; i = C.menuPilot(r, goal); assert.equal(i.mode, 'fight'); assert.ok(!i.attack && i.x > .9, 'closes in first');
  const boss = g.spawn('carnotaurus', { x: P.x - 120, y: P.y }, true); boss.mode = 'chase';
  i = C.menuPilot(r, goal); assert.equal(i.mode, 'flee'); assert.ok(i.x > 0, 'runs away from the boss side');
  boss.mode = 'wander'; compy.mode = 'wander'; assert.equal(C.menuPilot(r, goal).mode, 'walk', 'only hunters count');
  C.FEATURES.menuPilot = false; try { compy.mode = 'chase'; assert.equal(C.menuPilot(r, goal).mode, 'walk'); } finally { C.FEATURES.menuPilot = true; }
});

test('Compies no longer pile up on the menu dinosaur (the bug in the live menu)', () => {
  for (const [species, seed] of [['deinonychus', 20372], ['compy', 20372], ['ankylosaurus', 20372]]) {
    const off = play(species, seed, false), on = play(species, seed, true);
    assert.ok(off.near >= 10, `${species}: without the pilot ${off.near} attackers pile up`);
    assert.ok(on.near <= 5, `${species}: with the pilot ${on.near} attackers remain`); assert.ok(on.kills > 5);
  }
});
