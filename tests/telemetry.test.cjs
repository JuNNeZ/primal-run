'use strict';
// Opt-in run data (FEATURES.runTelemetry): nothing leaves the game without consent; one anonymous row per run.
const { test } = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js'), T = require('../PRIMAL_RUN_Game/src/telemetry.js');
function make(consent) {
  const g = new C.Game({ random: () => .5 }); g.now = () => Date.UTC(2026, 9, 15, 21, 30);
  if (consent !== undefined) g.setSetting('shareData', consent);
  const sent = []; g.telemetrySink = row => sent.push(row);
  g.start({ seed: 7 }); g.run.enemies = []; g.run.spawnTimer = 999; g.run.seconds = 95;
  return { g, sent };
}

test('consent starts unanswered, and a no removes the device id', () => {
  const g = new C.Game({ random: () => .5 });
  assert.equal(g.save.settings.shareData, null);
  assert.equal(g.save.settings.deviceId, null);
  g.setSetting('shareData', true); assert.match(g.save.settings.deviceId, /^[0-9a-f]{12}$/);
  const id = g.save.settings.deviceId; g.setSetting('shareData', true); assert.equal(g.save.settings.deviceId, id, 'id is stable');
  g.setSetting('shareData', false); assert.equal(g.save.settings.deviceId, null);
  const back = C.sanitizeSave(JSON.parse(JSON.stringify({ settings: { shareData: false, deviceId: 'abcdefabcdef' } })));
  assert.equal(back.settings.shareData, false); assert.equal(back.settings.deviceId, null, 'a stored id without consent is dropped');
});

test('no consent or an unanswered question sends nothing', () => {
  for (const consent of [undefined, false]) { const { g, sent } = make(consent); g.finish(false); assert.equal(sent.length, 0); assert.ok(g.run.telemetryRow); }
});

test('with consent a finished run sends one anonymous row', () => {
  const { g, sent } = make(true); g.save.name = 'Jonas'; g.finish(false); g.finish(false);
  assert.equal(sent.length, 1, 'once per run');
  const row = sent[0];
  assert.equal(row.v, T.SCHEMA); assert.equal(row.day, '2026-10-15'); assert.equal(row.id, g.save.settings.deviceId);
  assert.equal(row.species, g.run.species); assert.equal(row.stage, 1); assert.equal(row.seconds, 95);
  assert.deepEqual(row.stageSeconds, [95]); assert.ok(['normal', 'extinction'].includes(row.difficulty));
  assert.ok(!JSON.stringify(row).includes('Jonas'), 'no player name');
  assert.ok(!('seed' in row) && !('name' in row) && !('endedAt' in row));
});

test('saying yes after the run sends that run; the flag off sends nothing', () => {
  const { g, sent } = make(); g.finish(false); assert.equal(sent.length, 0);
  g.setSetting('shareData', true); assert.equal(g.shareRun(g.run), true); assert.equal(sent.length, 1);
  assert.equal(sent[0].id, g.save.settings.deviceId);
  C.FEATURES.runTelemetry = false;
  try { const b = make(true); b.g.finish(false); assert.equal(b.sent.length, 0); } finally { C.FEATURES.runTelemetry = true; }
});

test('stage seconds and the form request', () => {
  assert.deepEqual(T.stageSeconds([120, 300.04], 410), [120, 180, 110]);
  const calls = []; assert.equal(T.send({ a: 1 }, (url, opts) => { calls.push([url, opts]); return Promise.resolve(); }), true);
  assert.match(calls[0][0], /\/formResponse$/); assert.equal(calls[0][1].mode, 'no-cors');
  assert.equal(calls[0][1].body, 'entry.1505457991=' + encodeURIComponent('{"a":1}'));
  assert.equal(T.send({}, undefined), false);
});
