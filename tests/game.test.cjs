'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
function storage() { const values = new Map(); return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) }; }
function make(random = () => .5, store = storage()) { const g = new C.Game({ storage: store, random }); g.start(); g.run.enemies = []; g.run.spawnTimer = 999; return g; }
const tick = g => g.step(1 / 60);
function resolveMutations(g) { while (g.phase === 'mutation') assert.equal(g.choose(g.run.choices[0]), true); }

test('directional bites damage targets ahead, not targets behind; body collision stays fixed', () => {
  const g = make(), r = g.run; r.player.facing = 'E';
  const front = g.spawn('compy', { x: 520, y: 340 }), back = g.spawn('compy', { x: 440, y: 340 });
  g.step(1 / 60, { attack: true });
  assert.equal(front.hp, 18, 'anticipation does not deal damage');
  for (let i = 0; i < 13; i++) tick(g);
  assert.equal(front.hp, 8); assert.equal(back.hp, 18); assert.equal(r.player.radius, 16);
  g.step(1 / 60, { attack: true }); assert.equal(front.hp, 8, 'cooldown prevents repeated damage');
});
test('bite contact happens once, aim is locked, quick jaws scale the whole animation, and pause freezes it', () => {
  const g = make(), r = g.run; r.player.facing = 'E';
  const front = g.spawn('carnotaurus', { x: 535, y: 340 }); front.speed = 0;
  g.step(1 / 60, { attack: true }); const elapsed = r.attack.elapsed;
  r.player.facing = 'W'; g.pause(); tick(g); assert.equal(r.attack.elapsed, elapsed);
  g.resume(); for (let i = 0; i < 13; i++) tick(g);
  assert.equal(front.hp, 38); assert.equal(r.biteFacing, 'E');
  for (let i = 0; i < 16; i++) tick(g);
  assert.equal(front.hp, 38, 'recovery does not hit a second time'); assert.equal(r.attack, null);
  r.mutations.quick = 3; r.attackCooldown = 0; g.attack();
  assert.ok(Math.abs(r.attack.duration - C.BITE_ANIMATION.duration * .76) < .0001);
  assert.ok(Math.abs(r.attack.contactTime / r.attack.duration - .5) < .0001);
  g.damage(999); assert.equal(r.attack, null, 'death cancels pending attack');
});
test('kills drop meat, but XP, levels and boss threshold require actual pickup', () => {
  const g = make(), r = g.run, enemy = g.spawn('carnotaurus', { x: 100, y: 100 });
  enemy.hp = 0; tick(g);
  assert.equal(r.kills, 1); assert.equal(r.xp, 0); assert.equal(r.totalMeat, 0);
  assert.equal(r.pickups[0].value, 5);
  r.meat = 25; r.player.x = 100; r.player.y = 100; tick(g);
  assert.equal(r.meat, 30); assert.equal(r.xp, 5); assert.equal(r.enemies.filter(e => e.boss).length, 1);
  tick(g); assert.equal(r.enemies.filter(e => e.boss).length, 1, 'boss spawns once');
});
test('mutation choices are distinct, pause simulation, and queued levels resolve', () => {
  const g = make(), r = g.run; g.addXP(30);
  assert.equal(g.phase, 'mutation'); assert.equal(new Set(r.choices).size, 3);
  const before = r.seconds; g.step(.05, { x: 1, attack: true }); assert.equal(r.seconds, before);
  assert.equal(g.choose('not-a-choice'), false);
  resolveMutations(g); assert.equal(r.level, 4); assert.equal(g.phase, 'playing');
  assert.equal(Object.values(r.mutations).reduce((a, b) => a + b, 0), 3);
});
test('DNA rolls use species chances and pickups are banked once, surviving reload/death', () => {
  const s = storage(), g = make(() => .04, s), r = g.run;
  g.spawn('compy', { x: 480, y: 340 }).hp = 0; tick(g); tick(g);
  assert.equal(r.dna, 1); assert.equal(g.save.dna, 1); tick(g); assert.equal(g.save.dna, 1);
  g.damage(1000); assert.equal(g.phase, 'result');
  const reloaded = new C.Game({ storage: s }); assert.equal(reloaded.save.dna, 1);
  const noDrop = make(() => .05); noDrop.spawn('compy', { x: 200, y: 200 }).hp = 0; tick(noDrop);
  assert.equal(noDrop.run.pickups.some(p => p.kind === 'dna'), false, '5% boundary is exclusive');
});
test('four guaranteed boss awards, transitions preserve mutations, and final boss wins once', () => {
  const g = make(() => .99), r = g.run; r.mutations.teeth = 2;
  for (let stage = 0; stage < 4; stage++) {
    r.enemies = []; r.pickups = []; r.meat = C.STAGES[stage].target; tick(g);
    const boss = r.enemies.find(e => e.boss); assert.equal(boss.kind, C.STAGES[stage].boss);
    boss.hp = 0; tick(g); assert.equal(g.phase, 'cleared');
    const bank = g.save.dna; tick(g); assert.equal(g.save.dna, bank);
    assert.equal(g.nextStage(), true); assert.equal(r.mutations.teeth, 2);
  }
  assert.equal(g.phase, 'result'); assert.equal(r.result.victory, true); assert.equal(r.bosses, 4);
  assert.equal(g.save.dna, 90); assert.equal(g.save.scores.length, 1);
  g.finish(true); assert.equal(g.save.scores.length, 1);
});
test('shop validates balances/ranks and applies permanent upgrades only to a new run', () => {
  const g = make(); g.save.dna = 100;
  assert.equal(g.purchase('health'), false, 'no mid-run purchases');
  g.phase = 'shop'; assert.equal(g.purchase('health'), true); assert.equal(g.save.dna, 90);
  assert.equal(g.run.maxHealth, 100); g.start(); assert.equal(g.run.maxHealth, 102);
  g.phase = 'shop'; g.save.upgrades.health = 5; assert.equal(g.purchase('health'), false);
  g.save.dna = 0; assert.equal(g.purchase('damage'), false); assert.equal(g.purchase('__proto__'), false);
});
test('boss windup freezes its aim, deals damage during charge, and pounce evades it', () => {
  const g = make(), r = g.run, boss = g.spawn('carnotaurus', { x: 480, y: 200 }, true);
  boss.cooldown = 0; tick(g); assert.equal(boss.mode, 'windup'); const aim = boss.chargeX;
  r.player.x = 540; tick(g); assert.equal(boss.chargeX, aim);
  boss.mode = 'charge'; boss.timer = .5; boss.x = 540; boss.y = 340; tick(g); assert.ok(r.health < 100);
  r.invulnerable = 0; r.pounce = .2; const hp = r.health; boss.x = 540; boss.y = 340; tick(g); assert.equal(r.health, hp);
});
test('fatal damage stops updates; paused world and stamina do not advance', () => {
  const g = make(); g.pause(); const before = JSON.stringify(g.run); g.step(.05, { x: 1, pounce: true }); assert.equal(JSON.stringify(g.run), before);
  g.resume(); g.damage(1000); const dead = JSON.stringify(g.run); tick(g); assert.equal(JSON.stringify(g.run), dead);
});
test('malformed saves, disabled storage, and injected names remain bounded', () => {
  const x = C.sanitizeSave({ dna: Infinity, upgrades: { health: 999, damage: -20 }, settings: { music: -10 }, scores: [{ score: NaN }, { name: '<img onerror=evil>', score: 25, stage: 100 }] });
  assert.equal(x.dna, 0); assert.equal(x.upgrades.health, 5); assert.equal(x.upgrades.damage, 0); assert.equal(x.settings.music, 0); assert.equal(x.scores.length, 1); assert.equal(x.scores[0].stage, 4);
  const g = make(() => .5, { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } });
  g.addDNA(4); assert.equal(g.save.dna, 4); assert.equal(g.storageAvailable, false); tick(g);
});
test('GDevelop event matches shared source; all integrated PNGs preserve original pixels', () => {
  const folder = path.resolve(__dirname, '../PRIMAL_RUN_Game');
  const project = JSON.parse(fs.readFileSync(path.join(folder, 'project.json'), 'utf8'));
  const code = project.layouts[0].events[1].inlineCode.join('\n');
  const report = JSON.parse(fs.readFileSync(path.join(folder, 'integration_report.json'), 'utf8'));
  for (const [file, expected] of Object.entries(report.source_sha256)) {
    const content = fs.readFileSync(path.join(folder, file));
    assert.equal(crypto.createHash('sha256').update(content).digest('hex'), expected, 'run build:game after editing ' + file);
    if (file.endsWith('.js')) assert.ok(code.includes(content.toString().trim()), 'shared code is embedded in GDevelop event');
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8'));
  const original = JSON.parse(fs.readFileSync(path.resolve(folder, '../PRIMAL_RUN_Prototype_Kit/manifest.json'), 'utf8'));
  assert.equal(original.length, 104);
  for (const asset of original) assert.deepEqual(fs.readFileSync(path.join(folder, asset.file)), fs.readFileSync(path.resolve(folder, '../PRIMAL_RUN_Prototype_Kit', asset.file)));
  for (const asset of manifest) {
    assert.equal(asset.status, 'prototype_static');
    assert.ok(project.resources.resources.some(r => r.name === asset.file && r.file === asset.file && r.smoothed === false));
  }
});
