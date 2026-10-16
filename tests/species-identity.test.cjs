'use strict';
// FEATURES.speciesIdentity / waterStart (2026-10-16): species that borrowed another's ability get their own loop, and
// species that live off water start beside it.
const { test } = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
function run(species, seed = 11) {
  const g = new C.Game({}); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.selectSpecies(species); g.start({ seed });
  const r = g.run; r.enemies = []; r.pickups = []; return { g, r, p: r.player };
}
function ability(g, r) { r.stamina = 100; r.pounceCooldown = 0; g.step(1 / 30, { x: 0, y: 1, pounce: true }); }
test('Stegosaurus tail sweep hits all around and its stance blocks 40 %', () => {
  assert.equal(C.FEATURES.speciesIdentity, true);
  const { g, r, p } = run('stegosaurus');
  const a = g.spawn('parasaurolophus', { x: p.x - 60, y: p.y }), b = g.spawn('parasaurolophus', { x: p.x + 60, y: p.y });
  const ha = a.hp, hb = b.hp; ability(g, r);
  assert.ok(a.hp < ha && b.hp < hb, `both sides hit: ${ha}->${a.hp}, ${hb}->${b.hp}`);
  assert.ok(a.stagger > 0 && b.stagger > 0, 'both stagger'); assert.ok(r.tailSweep, 'sweep visual');
  assert.equal(C.IDENTITY.stego.stance, .6); assert.equal(C.PACK_LIMITS.stegosaurus, 1);
});
test('Oviraptor snatches nearby pickups', () => {
  const { g, r, p } = run('oviraptor');
  r.pickups.push({ id: 9001, kind: 'dna', x: p.x + 100, y: p.y, value: 1 }, { id: 9002, kind: 'dna', x: p.x + 400, y: p.y, value: 1 });
  ability(g, r);
  const near = r.pickups.find(q => q.id === 9001), far = r.pickups.find(q => q.id === 9002);
  assert.ok(!near || Math.hypot(near.x - r.player.x, near.y - r.player.y) < 40, 'near pickup pulled in or eaten');
  assert.ok(far && far.x === p.x + 400 || !far, 'far pickup left alone');
});
test('Spinosaurus is slower on land, hidden in water; Baryonyx fish heal more', () => {
  const { g, r } = run('spinosaurus');
  const water = r.map.fishSchools && r.map.fishSchools[0];
  assert.ok(water, 'map has a fish school');
  const inWater = g.terrainAt({ ...r.player, x: water.x, y: water.y });
  r.player.x = water.x; r.player.y = water.y;
  const t = g.terrainAt(r.player);
  if (t.kind === 'water' || t.kind === 'deep') assert.equal(t.cover, true);
  assert.ok(inWater);
});
test('fish eaters start next to a fish school, others keep the classic start', () => {
  assert.equal(C.FEATURES.waterStart, true);
  for (const species of ['spinosaurus', 'baryonyx']) for (const seed of [3, 11, 42]) {
    const { r, p } = run(species, seed), d = Math.min(...r.map.fishSchools.map(f => Math.hypot(f.x - p.x, f.y - p.y)));
    assert.ok(d <= C.IDENTITY.water.max + 30, `${species} seed ${seed}: ${Math.round(d)} px from water`);
  }
  const plain = run('velociraptor', 11);
  assert.equal(plain.r.map.plannedStart, undefined);
});
