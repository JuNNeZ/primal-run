'use strict';
const { test } = require('node:test'), assert = require('node:assert/strict');
const I = require('../PRIMAL_RUN_Game/src/i18n.js'); globalThis.PrimalI18n = I; require('../PRIMAL_RUN_Game/src/lang.js');
const C = require('../PRIMAL_RUN_Game/src/core.js');
test('every full language translates all mutation, species, level, zone and achievement texts', () => {
  for (const lang of ['en', 'de', 'sv', 'no', 'ja', 'zh']) {
    I.setLanguage(lang); I.missing.clear();
    for (const m of C.MUTATIONS) { I.t(m.name); I.t(m.text); }
    for (const p of Object.values(C.PLAYER_SPECIES)) { I.t(p.skill); I.t(p.text); }
    for (const l of C.LEVELS) { I.t(l.name); I.t(l.subtitle); I.t(l.bossName); }
    for (const zs of C.ZONES) for (const z of zs) I.t(z.name);
    for (const a of C.ACHIEVEMENTS) { I.t(a.name); I.t(a.text); }
    assert.deepEqual([...I.missing], [], lang);
  }
  I.setLanguage('da');
});
test('numbers, key names, segments and templates survive translation; fun languages fall back to English', () => {
  I.setLanguage('en');
  assert.equal(I.t('BANE 3/8 · Lysningen'), 'LEVEL 3/8 · The Clearing');
  assert.equal(I.t('Hold F ved planter med en lysende ring'), 'Hold F at plants with a glowing ring');
  assert.equal(I.tf('Låser {0} op', 'Compy'), 'Unlocks Compy');
  I.setLanguage('tlh'); assert.equal(I.t('START JAGTEN'), 'yIwam!'); assert.equal(I.t('Vælg dinosaur'), "Ha'DIbaH tIn yIwIv"); assert.equal(I.t('Musik'), 'QoQ'); assert.equal(I.t('Effektiv evne'), 'Efficient ability');
  I.setLanguage('da'); assert.equal(I.t('Vælg dinosaur'), 'Vælg dinosaur');
});
