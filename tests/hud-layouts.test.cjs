'use strict';
// FEATURES.hudLayouts: the PC HUD layout setting is saved, sanitised and translated in every full language.
const { test } = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
test('hud layout setting defaults to classic, accepts a/b/c and marks the choice', () => {
  assert.equal(C.FEATURES.hudLayouts, true); assert.equal(C.FEATURES.mapBiomes, true);
  const g = new C.Game({}); assert.equal(g.save.settings.hudLayout, 'classic'); assert.equal(g.save.settings.hudLayoutChosen, false);
  g.setSetting('hudLayout', 'nonsense'); assert.equal(g.save.settings.hudLayout, 'classic'); assert.equal(g.save.settings.hudLayoutChosen, false);
  for (const id of ['a', 'b', 'c', 'classic']) { g.setSetting('hudLayout', id); assert.equal(g.save.settings.hudLayout, id); assert.equal(g.save.settings.hudLayoutChosen, true); }
  const storage = { data: {}, getItem(k) { return this.data[k] || null; }, setItem(k, v) { this.data[k] = v; } };
  const a = new C.Game({ storage }); a.setSetting('hudLayout', 'b');
  const b = new C.Game({ storage }); assert.equal(b.save.settings.hudLayout, 'b'); assert.equal(b.save.settings.hudLayoutChosen, true);
  storage.data[Object.keys(storage.data)[0]] = JSON.stringify({ settings: { hudLayout: '<img>', hudLayoutChosen: 'yes' } });
  const c = new C.Game({ storage }); assert.equal(c.save.settings.hudLayout, 'classic');
});
test('hud picker texts exist in every full language', () => {
  const I = require('../PRIMAL_RUN_Game/src/i18n.js'); globalThis.PrimalI18n = I; require('../PRIMAL_RUN_Game/src/lang.js');
  const texts = require('../tools/i18n/source/chunk14.json').map(r => r.da);
  for (const lang of I.LANGUAGES.map(l => l.id).filter(l => l !== 'da' && I.coverage(l).entries > 1000 && !['tlh', 'sjn'].includes(l))) {
    I.setLanguage(lang); I.missing.clear(); texts.forEach(t => I.t(t)); assert.deepEqual([...I.missing], [], lang);
  }
  I.setLanguage('da');
});
