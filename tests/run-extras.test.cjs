'use strict';
// Run extras (2026-10-14): hunting streak, powerups, ability twists as legendary drops, elite traits, hard baby start,
// day rhythm and amber. Numbers come from the sim prototypes in balance/nat_2026-10-13 and are tuned in run_extras.js.
const { test } = require('node:test'), assert = require('node:assert/strict'), C = require('../PRIMAL_RUN_Game/src/core.js');
function make(species = 'velociraptor', seed = 123, options = {}) {
  const g = new C.Game({ random: () => .5 }); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES);
  g.selectSpecies(species); g.start({ seed, ...options }); g.run.enemies = []; g.run.spawnTimer = 999; return g;
}
const killNear = (g, kind = 'compy') => { const r = g.run, e = g.spawn(kind, { x: r.player.x + 30, y: r.player.y }); e.hp = 0; g.step(1 / 30, {}); return e; };

test('kills in quick succession build a hunting streak that decays after the window', () => {
  const g = make(), r = g.run;
  for (let i = 0; i < 3; i++) killNear(g);
  assert.equal(C.streakOf(r), 3);
  for (let i = 0; i < Math.ceil((C.STREAK.window + 1) * 30); i++) g.step(1 / 30, {});
  assert.equal(C.streakOf(r), 0, 'the streak ends when no kill lands inside the window');
  assert.ok(r.extras.streakMax >= 3);
});

test('each level places one powerup shrine; stepping on it starts a timed buff', () => {
  const g = make(), r = g.run, shrines = r.powerups.filter(p => p.shrine);
  assert.equal(shrines.length, C.POWERUP_SPAWN.shrines);
  const p = shrines[0]; r.player.x = p.x; r.player.y = p.y; g.step(1 / 30, {});
  assert.ok(!r.powerups.includes(p), 'picked up');
  const buffs = C.buffsOf(r);
  if (p.type === 'heart') assert.equal(buffs.length, 0); else assert.ok(buffs.some(b => b.type === p.type && b.time > 0));
  assert.equal(r.extras.powerups, 1);
});

test('ability twists are legendary, belong to one species, and are only offered with the flag on', () => {
  const twists = C.MUTATIONS.filter(m => m.twist);
  assert.equal(twists.length, Object.keys(C.TWISTS).length);
  for (const m of twists) { assert.equal(m.rarity, 'legendary'); assert.ok(C.PLAYER_SPECIES[m.species], m.id); assert.ok(!/#/.test(m.text), m.id + ' text has its numbers'); }
  const g = make('tyrannosaurus'), twist = twists.find(m => m.species === 'tyrannosaurus');
  assert.equal(g.mutationAvailable(twist), true);
  assert.equal(g.mutationAvailable(twists.find(m => m.species !== 'tyrannosaurus')), false);
  C.FEATURES.abilityTwists = false; try { assert.equal(g.mutationAvailable(twist), false); } finally { C.FEATURES.abilityTwists = true; }
});

test('hard baby start is optional: smaller health, an egg hatch and +50 % DNA', () => {
  const normal = make('velociraptor', 5), baby = make('velociraptor', 5, { baby: true });
  assert.equal(normal.run.extras.baby, null, 'off by default');
  assert.equal(baby.run.maxHealth, Math.round(normal.run.maxHealth * C.BABY.hp));
  assert.ok(baby.run.extras.baby.hatch > 0);
  const before = baby.run.dna; baby.addDNA(10); assert.equal(baby.run.dna - before, 15);
  const g = make(); g.setSetting('babyHard', true); assert.equal(g.save.settings.babyHard, true);
  g.phase = 'menu'; g.start({ seed: 9 }); assert.ok(g.run.extras.baby, 'the menu toggle turns it on');
});

test('elites get one trait with its own effect', () => {
  const g = make(), r = g.run, e = g.spawn('carnotaurus', { x: r.player.x + 400, y: r.player.y }); e.elite = true;
  const hp = e.maxHP; g.step(1 / 30, {});
  assert.ok(C.ELITE_AFFIXES[e.affix], 'trait assigned');
  if (e.affix === 'armored') assert.equal(e.maxHP, Math.round(hp * C.ELITE_AFFIXES.armored.hp));
});

test('day rhythm moves through day, dusk, night and dawn', () => {
  const D = C.DAYNIGHT;
  assert.equal(C.dayPhase(1), 'day'); assert.equal(C.dayPhase(D.dusk + 1), 'dusk');
  assert.equal(C.dayPhase(D.night + 1), 'night'); assert.equal(C.dayPhase(D.dawn + 1), 'dawn');
});

test('one amber piece per journey level is found with the interact key', () => {
  const g = make(), r = g.run;
  r.amberPiece = { x: r.player.x + 20, y: r.player.y, level: 0 };
  const dna = r.dna; g.interact();
  assert.equal(r.extras.amber, 1); assert.equal(r.amberPiece, null); assert.ok(r.dna >= dna + C.AMBER.dna);
});

test('amberFair: every journey level places amber clear of trees, bushes, rocks and water, far from the start', () => {
  const size = d => (C.PROP_SIZE[d.path] || ['soft', 30])[1] * (d.visualScale || 1), placed = [];
  for (const seed of [11, 222, 3333]) {
    const g = make('velociraptor', seed);
    for (let L = 0; L < C.LEVELS.length; L++) {
      const r = g.run, a = r.amberPiece, m = r.map;
      assert.ok(a, 'level ' + (L + 1) + ' has amber (seed ' + seed + ')');
      const start = { x: m.start.x, y: m.start.y };
      assert.ok(Math.hypot(a.x - start.x, a.y - start.y) > C.AMBER.minDistance, 'far from the start');
      assert.ok(!C.isWater(r.stage, m, a, -40), 'on dry ground');
      assert.ok(!m.rocks.some(o => Math.hypot(o.x - a.x, o.y - a.y) < 40), 'not under a rock');
      assert.ok(!(m.decorations || []).some(d => Math.hypot(d.x - a.x, d.y - size(d) * .6 - a.y) < size(d)), 'not under a tree or bush');
      placed.push(a);
      if (L < C.LEVELS.length - 1) { g.phase = 'cleared'; g.nextStage(); }
    }
  }
  assert.equal(placed.length, 3 * C.LEVELS.length);
});

test('amberFair: a quiet chime plays once the first time you come near the amber', () => {
  const g = make(), r = g.run; g.drainEvents();
  r.amberPiece = { x: r.player.x + C.AMBER.hint - 20, y: r.player.y, level: 0 };
  g.step(1 / 30, {}); g.step(1 / 30, {});
  assert.equal(g.drainEvents().filter(e => e.type === 'amber_near').length, 1);
  r.amberPiece.hinted = false; r.amberPiece.x = r.player.x + C.AMBER.hint + 200; g.step(1 / 30, {});
  assert.equal(g.drainEvents().filter(e => e.type === 'amber_near').length, 0, 'no chime from far away');
});

test('Pteranodon glides over lava without burning; on foot lava still burns', () => {
  const g = make('pteranodon'), r = g.run; r.stage = 3; r.map.lavaCrossings = []; r.map.river = [{ x: 0, y: 340 }, { x: 4000, y: 340 }]; r.map.riverCurve = r.map.river; r.player.y = 340;
  r.pounce = 0; assert.equal(g.terrainAt(r.player).kind, 'lava');
  r.pounce = .3; assert.equal(g.terrainAt(r.player).kind, 'air');
  const x = r.player.x; g.travel(r.player, 10, 0); assert.equal(r.player.x, x + 10, 'full speed while gliding');
});

test('rare albinos are moved to the most remote suitable habitat', () => {
  const g = new C.Game({ random: () => .5 }); g.selectSpecies('velociraptor'); g.start({ seed: 77 });
  const r = g.run, e = r.enemies.find(o => o.rare), site = r.map.sites.find(s => s.animalId === e.id);
  const d = Math.hypot(e.x - r.player.x, e.y - r.player.y);
  for (const h of r.map.habitats) { const p = g.habitatPosition('parasaurolophus', h); if (p && !C.isWater(r.stage, r.map, p, -40)) assert.ok(Math.hypot(p.x - r.player.x, p.y - r.player.y) <= d + 1); }
  assert.equal(site.x, e.x);
});

test('raptor pack is capped by species strength: Spinosaurus recruits none, Baryonyx one, Velociraptor two', () => {
  const recruits = species => {
    const g = make(species, 3), r = g.run; r.invulnerable = 1e9; let n = 0;
    for (const a of r.raptors.slice(0, 2)) { Object.assign(r.player, { x: a.x + 50, y: a.y }); r.pickups.push({ id: 9100 + n, kind: 'meat', corpseId: 77, value: 3, x: a.x + 20, y: a.y + 10 }); r.meat = 20; for (let i = 0; i < (C.FEATURES.raptorDonate ? C.PACK.donate / C.PACK.donateStep : 1); i++) g.step(1 / 30, { interact: true }); n++; }
    return r.raptors.filter(a => a.ally).length;
  };
  assert.equal(C.PACK.max, 2);
  assert.deepEqual([recruits('spinosaurus'), recruits('baryonyx'), recruits('velociraptor')], [0, 1, 2]);
  assert.equal(C.packLimitOf({ species: 'spinosaurus' }), 0); assert.equal(C.packLimitOf({ species: 'compy' }), 2);
  assert.equal(C.PACK.max, 2, 'the cap is restored after each feed');
});
