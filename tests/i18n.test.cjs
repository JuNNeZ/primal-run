'use strict';
const { test } = require('node:test'), assert = require('node:assert/strict');
const I = require('../PRIMAL_RUN_Game/src/i18n.js'); globalThis.PrimalI18n = I; require('../PRIMAL_RUN_Game/src/lang.js');
const C = require('../PRIMAL_RUN_Game/src/core.js');
test('every full language translates all mutation, species, level, zone and achievement texts', () => {
  for (const lang of ['en', 'de', 'sv', 'no', 'ja', 'zh', ...['es', 'fr', 'pt', 'ru', 'hi', 'ar', 'bn', 'ur', 'id', 'pcm', 'mr', 'te', 'tr', 'ta', 'yue'].filter(l => I.coverage(l).entries > 0)]) {
    I.setLanguage(lang); I.missing.clear();
    for (const m of C.MUTATIONS) { I.t(m.name); I.t(m.text); }
    for (const p of Object.values(C.PLAYER_SPECIES)) { I.t(p.skill); I.t(p.text); I.t(p.role); I.t(p.skillText); }
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
test('FEATURES.langSplit: one generated file per language holds exactly that language from lang.js', () => {
  const fs = require('node:fs'), path = require('node:path'), dir = path.resolve(__dirname, '../PRIMAL_RUN_Game/src/lang');
  const all = fs.readFileSync(path.join(dir, '../lang.js'), 'utf8');
  const I = require('../PRIMAL_RUN_Game/src/i18n.js');
  for (const l of I.LANGUAGES.filter(l => l.id !== 'da')) {
    const one = fs.readFileSync(path.join(dir, l.id + '.js'), 'utf8').split('\n').find(x => x.startsWith('I.add('));
    assert.ok(all.includes(one), l.id + ' matches lang.js');
  }
  assert.deepEqual(I.chain('yue'), ['yue', 'zh']); assert.deepEqual(I.chain('tlh'), ['tlh', 'en']); assert.deepEqual(I.chain('da'), []);
});
