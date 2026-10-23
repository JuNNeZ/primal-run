'use strict';
// FEATURES.pauseGuide + keybindMenu: the guide choice is saved, the keyboard menu swaps taken keys, accepts 0/5-9 and
// arrow keys for moving, resets one or all keys, and every new text exists in every full language.
const { test } = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const storage = () => ({ data: {}, getItem(k) { return this.data[k] || null; }, setItem(k, v) { this.data[k] = v; } });
test('pause guide is shown by default and the choice is saved', () => {
  assert.equal(C.FEATURES.pauseGuide, true);
  const s = storage(), a = new C.Game({ storage: s }); assert.equal(a.save.settings.pauseGuide, true);
  a.setSetting('pauseGuide', false); assert.equal(new C.Game({ storage: s }).save.settings.pauseGuide, false);
});
test('keyboard menu swaps a taken key, resets keys and keeps saves valid', () => {
  assert.equal(C.FEATURES.keybindMenu, true);
  const s = storage(), g = new C.Game({ storage: s }), b = () => g.save.bindings;
  assert.equal(g.setBinding('attack', 'KeyQ'), false, 'the old settings path still refuses a taken key');
  assert.deepEqual(g.swapBinding('attack', 'KeyQ'), { other: 'command' }); assert.equal(b().attack, 'KeyQ'); assert.equal(b().command, 'Space');
  assert.deepEqual(g.swapBinding('eat', 'Digit5'), { other: null }); assert.equal(b().eat, 'Digit5');
  for (const code of ['Digit1', 'Digit4', 'Escape', 'ControlLeft', 'Tab', 'ArrowUp']) assert.equal(g.swapBinding('eat', code), null, code);
  assert.deepEqual(g.swapBinding('up', 'ArrowUp'), { other: null }); assert.equal(b().up, 'ArrowUp');
  assert.equal(g.swapBinding('up', 'Space'), null, 'attack cannot take an arrow key in a swap');
  assert.equal(new Set(Object.values(b())).size, Object.keys(b()).length);
  const loaded = new C.Game({ storage: s }).save.bindings; assert.deepEqual(loaded, b(), 'digits and arrows survive a reload');
  assert.deepEqual(g.resetBinding('attack'), { other: 'command' }); assert.equal(b().attack, 'Space'); assert.equal(b().command, 'KeyQ');
  g.resetBindings(); assert.deepEqual(b(), C.BINDING_DEFAULTS);
  assert.equal(C.sanitizeSave({ bindings: { ...C.BINDING_DEFAULTS, attack: 'ArrowUp' } }).bindings.attack, 'Space', 'only move actions keep arrow keys');
});
test('pause guide and keyboard menu texts exist in every full language', () => {
  const I = require('../PRIMAL_RUN_Game/src/i18n.js'); globalThis.PrimalI18n = I; require('../PRIMAL_RUN_Game/src/lang.js');
  const texts = require('../tools/i18n/source/chunk_controls.json').map(r => r.da.replace('@', 'H'));
  for (const lang of I.LANGUAGES.map(l => l.id).filter(l => l !== 'da' && I.coverage(l).entries > 1000 && !['tlh', 'sjn'].includes(l))) {
    I.setLanguage(lang); I.missing.clear(); texts.forEach(t => I.t(t)); assert.deepEqual([...I.missing], [], lang);
    assert.ok(I.t('Nedlæg dyr og hold [5] ved liget').includes('[5]'), lang + ': a digit key stays a key name');
  }
  I.setLanguage('da');
});
