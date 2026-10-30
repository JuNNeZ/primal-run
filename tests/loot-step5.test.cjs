'use strict';
// Loot step 5 (Jonas 2026-10-21, "Alle tre"): daily share squares, extinction pressure and the currencies rav,
// fossiler and iridium. All three are behind their own flag, off by default.
const { test } = require('node:test'), assert = require('node:assert/strict'), C = require('../PRIMAL_RUN_Game/src/core.js');
function make(species = 'velociraptor', seed = 123, save = {}) {
  const g = new C.Game({ random: () => .5 }); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); Object.assign(g.save, save);
  g.selectSpecies(species); g.start({ seed }); g.run.enemies = []; g.run.spawnTimer = 999; return g;
}
const flags = (on, ...names) => { const was = names.map(n => C.FEATURES[n]); for (const n of names) C.FEATURES[n] = on; return () => names.forEach((n, i) => { C.FEATURES[n] = was[i]; }); };

test('the three step-5 flags are off by default', () => {
  for (const f of ['dailyShare', 'extinctionPressure', 'currencies']) assert.equal(C.FEATURES[f], false, f);
});

test('dailySquares: green per boss beaten, red on the level you fell on, black after; a won hunt gets a crown', () => {
  const n = C.LEVELS.length;
  assert.equal(C.dailySquares({ bosses: 0, victory: false }), '🟥' + '⬛'.repeat(n - 1));
  assert.equal(C.dailySquares({ bosses: 3, victory: false }), '🟩🟩🟩🟥' + '⬛'.repeat(n - 4));
  assert.equal(C.dailySquares({ bosses: n, victory: true }), '🟩'.repeat(n) + ' 👑');
  assert.equal(C.dailySquares({ bosses: n + 1, victory: true }), '🟩'.repeat(n) + ' 👑', 'the ash boss does not add a square');
});

test('old saves get pressure and currency defaults; bad values are clamped and kept with the flags off', () => {
  const s = C.sanitizeSave({ dna: 5 });
  assert.equal(s.pressureBest, -1); assert.equal(s.settings.pressure, 0); assert.deepEqual(s.currency, { fossils: 0, iridium: 0 }); assert.equal(s.settings.startRelic, 'none');
  const t = C.sanitizeSave({ pressureBest: 99, settings: { pressure: -3, startRelic: 'gold' }, currency: { fossils: 7.8, iridium: -2 } });
  assert.equal(t.pressureBest, C.PRESSURE.max); assert.equal(t.settings.pressure, 0); assert.deepEqual(t.currency, { fossils: 7, iridium: 0 }); assert.equal(t.settings.startRelic, 'none');
});

test('extinctionPressure: step n scales animals and bosses, adds luck and DNA; closed steps clamp down; daily stays on 0', () => {
  const restore = flags(true, 'extinctionPressure', 'lootTables');
  try {
    const base = make(), e0 = base.spawn('carnotaurus', { x: base.run.player.x + 300, y: base.run.player.y });
    const g = make('velociraptor', 123, { pressureBest: 2 }); g.setSetting('pressure', 3); assert.equal(g.save.settings.pressure, 3);
    g.setSetting('pressure', 5); assert.equal(g.save.settings.pressure, 3, 'only up to the open step');
    const h = make('velociraptor', 123, { pressureBest: 2, settings: { ...g.save.settings, pressure: 3 } }), r = h.run;
    assert.equal(r.pressure, 3);
    const e3 = h.spawn('carnotaurus', { x: r.player.x + 300, y: r.player.y });
    assert.ok(Math.abs(e3.maxHP / e0.maxHP - (1 + 3 * C.PRESSURE.hp)) < 1e-9); assert.ok(Math.abs(e3.damage / e0.damage - (1 + 3 * C.PRESSURE.damage)) < 1e-9);
    assert.ok(Math.abs(h.luck() - base.luck() - 3 * C.PRESSURE.luck) < 1e-9);
    const boss = h.spawn(h.currentLevel().boss, { x: r.player.x + 500, y: r.player.y }, true), maxHP = boss.maxHP; h.step(1 / 30, {}); assert.equal(boss.maxHP, maxHP, 'scaled once');
    r.bosses = 1; r.dna = 100; const bank = h.save.dna; h.finish(false); assert.ok(r.pressureBonus >= Math.round(100 * 3 * C.PRESSURE.dna), 'at least 30 % of the run DNA'); assert.ok(h.save.dna - bank >= r.pressureBonus);
    assert.equal(h.save.pressureBest, 2, 'a lost hunt opens nothing');
    const d = new C.Game({ random: () => .5 }); d.save.pressureBest = 4; d.save.settings.pressure = 4; d.startDaily(Date.UTC(2026, 9, 21)); assert.equal(d.run.pressure, 0, 'daily is the same for everyone');
    C.FEATURES.extinctionPressure = false; const off = make('velociraptor', 123, { pressureBest: 4, settings: { ...g.save.settings, pressure: 4 } }); assert.equal(off.run.pressure, 0);
  } finally { restore(); }
});

test('extinctionPressure: a won hunt on the highest open step opens the next one, up to the max', () => {
  const restore = flags(true, 'extinctionPressure');
  try {
    const g = make(); assert.equal(C.pressureOpen(g.save), 0); g.run.levelIndex = C.LEVELS.length - 1; g.finish(true);
    assert.equal(g.save.pressureBest, 0); assert.equal(g.run.pressureOpened, 1); assert.equal(C.pressureOpen(g.save), 1);
    const top = make('velociraptor', 123, { pressureBest: C.PRESSURE.max - 1, settings: { ...g.save.settings, pressure: C.PRESSURE.max } });
    assert.equal(top.run.pressure, C.PRESSURE.max); top.finish(true); assert.equal(top.save.pressureBest, C.PRESSURE.max); assert.equal(top.run.pressureOpened, null);
  } finally { restore(); }
});

test('currencies: rav from bosses and amber, fossiler from fossil sites, iridium for a won hunt; flag off earns nothing', () => {
  const restore = flags(true, 'currencies');
  try {
    const g = make(), r = g.run; assert.deepEqual(r.currency, { rav: 0, fossils: 0, iridium: 0 });
    const boss = g.spawn(g.currentLevel().boss, { x: r.player.x + 40, y: r.player.y }, true); g.kill(boss); g.kill(boss); assert.equal(r.currency.rav, 1, 'once per boss'); r.hitStop = 0; // boss-kill hit-stop (feedbackTiers) would swallow the 1/30 s step below
    if (r.amberPiece) { r.player.x = r.amberPiece.x; r.player.y = r.amberPiece.y; assert.equal(g.interact(), true); assert.equal(r.currency.rav, 2); }
    const site = r.map.sites.find(s => s.type === 'fossil'); site.discovered = true; r.activeSite = site.id; g.phase = 'exploration'; g.explore(true);
    assert.equal(r.currency.fossils, 1); assert.equal(g.save.currency.fossils, 1, 'fossils are saved');
    const ev = r.map.events.find(e => e.type === 'fossil'); if (ev) { ev.claimed = false; r.player.x = ev.x; r.player.y = ev.y; g.step(1 / 30, {}); assert.equal(g.save.currency.fossils, 2); }
    g.finish(true); assert.equal(g.save.currency.iridium, C.CURRENCY.iridium.victory);
    C.FEATURES.currencies = false; const off = make(), o = off.run, b2 = off.spawn(off.currentLevel().boss, { x: o.player.x + 40, y: o.player.y }, true); off.kill(b2);
    assert.equal(o.currency.rav, 0); off.finish(true); assert.equal(off.save.currency.iridium, 0);
  } finally { restore(); }
});

test('currencies: the amber altar sells loot for rav at a rising price and closes after two buys', () => {
  const restore = flags(true, 'currencies', 'lootTables');
  try {
    const g = make(), r = g.run, al = r.amberAltar; assert.ok(al, 'one altar per level'); assert.deepEqual(make().run.amberAltar, al, 'placed from the seed');
    r.player.x = al.x; r.player.y = al.y; const events = () => g.drainEvents().map(e => e.type);
    g.drainEvents(); assert.equal(g.interact(), true); assert.ok(events().includes('altar_poor'), 'no rav, no roll'); assert.equal(al.buys, 0);
    r.currency.rav = 5; g.interact(); assert.equal(al.buys, 1); assert.equal(r.currency.rav, 4); assert.equal(al.price, Math.ceil(C.CURRENCY.altar.price * C.CURRENCY.altar.grow));
    assert.ok(events().includes('amber_altar'));
    g.interact(); assert.equal(al.buys, 2); assert.equal(r.currency.rav, 2); g.interact(); assert.equal(al.buys, 2, 'closed'); assert.equal(r.currency.rav, 2);
    C.FEATURES.currencies = false; assert.equal(make().run.amberAltar, null);
  } finally { restore(); }
});

test('currencies: fossiler or iridium buy a start relic with the right floor; daily and missing funds buy nothing', () => {
  const restore = flags(true, 'currencies', 'lootTables', 'relics');
  try {
    const settings = kind => ({ ...C.sanitizeSave({}).settings, startRelic: kind });
    const g = make('velociraptor', 123, { currency: { fossils: 6, iridium: 0 }, settings: settings('fossil') }), rel = Object.keys(g.run.relics || {});
    assert.equal(rel.length, 1); assert.equal(g.save.currency.fossils, 6 - C.CURRENCY.fossilStart); assert.equal(g.run.startRelic, 'fossil');
    assert.ok(['rare', 'epic', 'legendary'].includes(C.RELICS[rel[0]].rarity));
    const i = make('velociraptor', 7, { currency: { fossils: 0, iridium: 1 }, settings: settings('iridium') }), ir = Object.keys(i.run.relics || {});
    assert.equal(ir.length, 1); assert.ok(['epic', 'legendary'].includes(C.RELICS[ir[0]].rarity)); assert.equal(i.save.currency.iridium, C.RELICS[ir[0]].rarity === 'legendary' ? 1 : 0);
    const poor = make('velociraptor', 123, { currency: { fossils: 4, iridium: 0 }, settings: settings('fossil') }); assert.equal(Object.keys(poor.run.relics || {}).length, 0); assert.equal(poor.save.currency.fossils, 4);
    const d = new C.Game({ random: () => .5 }); d.save.currency = { fossils: 9, iridium: 0 }; d.save.settings.startRelic = 'fossil'; d.startDaily(Date.UTC(2026, 9, 21));
    assert.equal(Object.keys(d.run.relics || {}).length, 0); assert.equal(d.save.currency.fossils, 9);
  } finally { restore(); }
});
