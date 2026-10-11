'use strict';
const { test } = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
test('species selection order: free starters, then DNA cost ascending, then achievement unlocks', () => {
  const order = C.speciesOrder(), ids = Object.keys(C.PLAYER_SPECIES);
  assert.deepEqual([...order].sort(), [...ids].sort());
  assert.equal(order[0], 'deinonychus');
  const rank = id => C.SPECIES_UNLOCKS[id].achievement ? Infinity : C.SPECIES_UNLOCKS[id].dna || 0;
  for (let i = 1; i < order.length; i++) assert.ok(rank(order[i - 1]) <= rank(order[i]), order[i - 1] + ' before ' + order[i]);
  const achievements = order.filter(id => C.SPECIES_UNLOCKS[id].achievement).map(id => C.ACHIEVEMENTS.findIndex(a => a.id === C.SPECIES_UNLOCKS[id].achievement));
  assert.deepEqual(achievements, [...achievements].sort((a, b) => a - b));
});
test('every species has the same card texts: role, playstyle and ability', () => {
  for (const [id, p] of Object.entries(C.PLAYER_SPECIES)) {
    for (const k of ['role', 'text', 'skill', 'skillText']) assert.ok(typeof p[k] === 'string' && p[k].trim(), id + ' ' + k);
    assert.ok(p.role.length <= 20, id + ' role is a short label');
    assert.ok(p.text.length <= 100 && p.skillText.length <= 100, id + ' texts fit a card');
    assert.ok(!/Shift|Space/.test(p.text + p.skillText), id + ' texts do not hard-code key names');
  }
});
