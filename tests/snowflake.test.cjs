'use strict';
// The Snowflake equilibrium patch (2026-10-15): Ankylosaurus spike fixes, trade-off mutations, raptor food donation,
// generic "bite" texts and the player/animal balance multipliers.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
function make(species = 'ankylosaurus', seed = 3) { const g = new C.Game({ random: () => .5 }); g.save.selectedSpecies = species; g.start({ seed }); const r = g.run; r.enemies = []; r.spawnTimer = 1e9; return { g, r }; }

test('Pigpanser no longer fires on lava/poison ticks and never hurts peaceful grazers', () => {
  const { g, r } = make(); r.mutations.spikes = 3;
  const grazer = g.spawn('parasaurolophus', { x: r.player.x + 60, y: r.player.y }); const hp = grazer.hp;
  g.damage(1, null); r.invulnerable = 0; g.damage(4, { hazard: 'lava' }); r.invulnerable = 0;
  assert.equal(grazer.hp, hp); assert.equal(grazer.alert, false, 'the grazer stays calm');
  const attacker = g.spawn('carnotaurus', { x: r.player.x - 60, y: r.player.y }); attacker.alert = true; const ahp = attacker.hp;
  g.damage(5, attacker);
  assert.ok(attacker.hp < ahp, 'the animal that hit you is spiked'); assert.equal(grazer.hp, hp, 'bystanders are not');
});

test('epic genomes offer more than three cards: six generic trade-off epics plus two more trade-offs', () => {
  const trade = C.MUTATIONS.filter(m => m.tradeoff);
  assert.equal(trade.length, 8); assert.equal(trade.filter(m => m.rarity === 'epic').length, 6);
  for (const m of trade) assert.match(m.text, /men/, m.id + ' has a minus');
  const { g, r } = make('deinonychus');
  assert.ok(C.MUTATIONS.filter(m => m.rarity === 'epic' && g.mutationAvailable(m)).length >= 8);
  r.choices = ['bloodPact']; g.phase = 'mutation'; const max = r.maxHealth; g.choose('bloodPact');
  assert.equal(r.maxHealth, max - 20);
});

test('a generic mutation no longer talks about bites', () => {
  for (const id of ['reach', 'lifeBite', 'theriClaw']) assert.doesNotMatch(C.MUTATIONS.find(m => m.id === id).text, /bid/i, id);
});

test('a wild raptor joins only after it has had PACK.donate of your own food', () => {
  const { g, r } = make('deinonychus'); const a = r.raptors[0]; Object.assign(r.player, { x: a.x + 50, y: a.y }); r.invulnerable = 1e9;
  r.meat = 0; g.step(1 / 30, { interact: true }); assert.equal(a.ally, false); assert.equal(a.fed || 0, 0, 'nothing to give');
  r.meat = 10; const presses = C.PACK.donate / C.PACK.donateStep;
  for (let i = 1; i < presses; i++) { g.step(1 / 30, { interact: true }); assert.equal(a.fed, i * C.PACK.donateStep); assert.equal(a.ally, false); }
  g.step(1 / 30, { interact: true }); assert.equal(a.ally, true); assert.equal(r.meat, 10 - C.PACK.donate);
});

test('equilibrium: less player health and damage, more animal and boss health and damage; flag off restores', () => {
  const on = make('deinonychus'), e = on.g.spawn('compy', { x: on.r.player.x + 400, y: on.r.player.y });
  C.FEATURES.equilibrium = false;
  try { const off = make('deinonychus'), o = off.g.spawn('compy', { x: off.r.player.x + 400, y: off.r.player.y });
    assert.ok(on.r.maxHealth < off.r.maxHealth); assert.ok(e.hp > o.hp && e.damage > o.damage);
  } finally { C.FEATURES.equilibrium = true; }
});
