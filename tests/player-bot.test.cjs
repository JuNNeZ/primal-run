'use strict';
// Sim style 'player' (2026-10-21): expert + human tricks + skill factor on player hp/damage, calibrated to real wins.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const { runOne, STYLES } = require('../tools/playstyle_sim.cjs');
const DT = 1 / 30;
const snap = () => JSON.stringify(Object.values(C.DIFFICULTIES).map(d => d.player));

test('player style keeps the expert base and adds grind, feast, avoid and skill 2.3', () => {
  const p = STYLES.player, e = STYLES.expert;
  for (const k of ['reaction', 'dodge', 'aimError', 'ability', 'picks']) assert.equal(p[k], e[k], k);
  assert.deepEqual([p.grind, p.feast, p.avoid, p.skill], [3, true, 1.5, 2.3]);
  assert.equal(e.skill, undefined);
});

test('skill scales player hp only for that run and restores the difficulty tables', () => {
  const before = snap();
  const base = runOne(C, { species: 'tyrannosaurus', style: 'expert', seed: 4, seconds: 20, dt: DT });
  const strong = runOne(C, { species: 'tyrannosaurus', style: 'expert', seed: 4, seconds: 20, dt: DT, skill: 2 });
  const player = runOne(C, { species: 'tyrannosaurus', style: 'player', seed: 4, seconds: 20, dt: DT });
  assert.equal(snap(), before);
  assert.ok(strong.damageDealt >= base.damageDealt, 'skill 2 deals at least as much damage');
  assert.ok(Number.isFinite(player.levelReached));
});
