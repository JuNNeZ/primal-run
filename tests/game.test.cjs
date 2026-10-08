'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
function storage() { const values = new Map(); return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) }; }
function make(random = () => .5, store = storage()) { const g = new C.Game({ storage: store, random }); g.save.unlockedSpecies.push('utahraptor'); g.selectSpecies('utahraptor'); g.start(); g.run.enemies = []; g.run.spawnTimer = 999; return g; }
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
test('successful bite gives one impact, damage number and a short knockback stagger; misses stay quiet', () => {
  const g = make(), r = g.run;
  const e = g.spawn('carnotaurus', { x: 520, y: 340 });
  g.drainEvents(); g.resolveBite('E');
  assert.equal(e.hp, 38); assert.equal(e.x, 538); assert.equal(e.hit, .15); assert.equal(e.stagger, .12);
  assert.equal(r.effects[0].text, '10'); assert.equal(g.drainEvents().filter(e => e.type === 'bite_hit').length, 1);
  const x = e.x; g.enemyStep(e, .05); assert.equal(e.x, x, 'target cannot instantly walk back through knockback');
  g.resolveBite('W'); assert.equal(g.drainEvents().filter(e => e.type === 'bite_hit').length, 0, 'miss has no impact sound');
  e.boss = true; const bossX = e.x; g.resolveBite('E'); assert.equal(e.x, bossX, 'boss is not stunlocked or knocked back');
});
test('first biome opens with three weak enemies and ramps composition, caps and cadence toward a 24-meat boss', () => {
  const g = new C.Game({ random: () => .99 }); g.start(); const r = g.run;
  const nearby = r.enemies.filter(e => Math.hypot(e.x - r.player.x, e.y - r.player.y) < 600);
  assert.equal(nearby.length, 3); assert.equal(nearby.filter(e => e.kind === 'compy').length, 2);
  assert.ok(r.enemies.length > 25, 'distant habitats contain animals before exploring');
  assert.ok(r.enemies.every(e => e.elite || e.kind !== 'carnotaurus')); assert.equal(r.spawnTimer, 5);
  for (const [seconds, meat, kind, interval] of [[0, 0, 'parasaurolophus', 4], [30, 6, 'parasaurolophus', 3.2], [60, 12, 'carnotaurus', 2.6]]) {
    r.enemies = []; r.pickups = []; r.seconds = seconds; r.meat = meat; r.spawnTimer = 0;
    g.step(.01); assert.equal(r.enemies[0].kind, kind); assert.equal(r.spawnTimer, interval);
  }
  r.enemies = []; r.seconds = 0; r.meat = 0; r.spawnTimer = 0;
  for (let i = 0; i < 3; i++) g.spawn('compy', { x: 100, y: 100 });
  g.step(.01); assert.equal(r.enemies.length, 3, 'opening cap prevents a swarm');
  r.enemies = []; r.meat = 23; r.pickups = [{ id: 999, kind: 'meat', x: r.player.x, y: r.player.y, value: 1 }];
  g.step(.01); assert.equal(r.bossSpawned, true); assert.equal(r.enemies.filter(e => e.boss).length, 1);
});
test('Compy separates from its pack and telegraphs one bite instead of unavoidable contact damage', () => {
  const g = make(), r = g.run, a = g.spawn('compy', { x: 600, y: 340 }), b = g.spawn('compy', { x: 604, y: 340 });
  g.enemyStep(a, .05); g.enemyStep(b, .05); assert.ok(b.x - a.x > 4, 'pack members spread apart');
  r.enemies = [a]; a.x = r.player.x + 20; a.y = r.player.y; a.cooldown = 0;
  g.enemyStep(a, .01); assert.equal(a.mode, 'windup'); assert.equal(r.health, 100);
  a.timer = .001; g.enemyStep(a, .01); assert.equal(a.mode, 'bite');
  g.enemyStep(a, .1); assert.equal(r.health, 93); r.invulnerable = 0;
  g.enemyStep(a, .01); assert.equal(r.health, 93, 'bite only hits once');
});
test('Parasaurolophus flees harmlessly and steers along an edge rather than getting stuck', () => {
  const g = make(), r = g.run; r.player.x = r.map.width - 170; r.player.y = 340;
  const e = g.spawn('parasaurolophus', { x: r.map.width - 70, y: 340 });
  for (let i = 0; i < 20; i++) g.enemyStep(e, .05);
  assert.equal(e.mode, 'flee'); assert.ok(Math.abs(e.y - 340) > 30); assert.ok(e.x <= r.map.width - 60);
  assert.equal(r.health, 100); assert.ok(e.moving); assert.ok(['N', 'S'].includes(e.direction));
});
test('ordinary Carnotaurus charges from the first biome, locks its warning aim and allows a sideways dodge', () => {
  const g = make(), r = g.run, e = g.spawn('carnotaurus', { x: 480, y: 200 }); e.cooldown = 0;
  g.enemyStep(e, .01); assert.equal(e.mode, 'windup'); assert.equal(e.timer, .9);
  r.player.x = 680; const aim = [e.chargeX, e.chargeY];
  for (let i = 0; i < 30; i++) g.enemyStep(e, .05);
  assert.deepEqual([e.chargeX, e.chargeY], aim); assert.equal(r.health, 100); assert.equal(e.mode, 'recover');
});
test('Ankylosaurus warns before tail strike, hits once and has weaker rear armor', () => {
  const g = make(), r = g.run, e = g.spawn('ankylosaurus', { x: 520, y: 340 }); e.cooldown = 0;
  g.enemyStep(e, .01); assert.equal(e.mode, 'windup'); assert.equal(e.pattern, 2); assert.equal(e.attackRadius, 90);
  e.timer = .001; g.enemyStep(e, .01); g.enemyStep(e, .1); assert.equal(r.health, 84);
  r.invulnerable = 0; g.enemyStep(e, .01); assert.equal(r.health, 84);
  e.facingX = 1; e.facingY = 0; e.hp = e.maxHP; e.x = 520;
  r.player.x = 560; g.resolveBite('W'); assert.equal(e.hp, e.maxHP - 5, 'front armor halves damage');
  e.hp = e.maxHP; e.x = 520; r.player.x = 480; g.resolveBite('E'); assert.equal(e.hp, e.maxHP - 10, 'rear is vulnerable');
  g.phase = 'mutation'; const frozen = JSON.stringify(e); g.enemyStep(e, .05); assert.equal(JSON.stringify(e), frozen);
});
test('first biome waits for meat progression before unlocking a stronger predator and caps it at one', () => {
  const g = make(() => .99), r = g.run; r.seconds = 200; r.meat = 0; r.spawnTimer = 0; tick(g);
  assert.equal(r.enemies[0].kind, 'parasaurolophus', 'waiting alone cannot escalate difficulty');
  r.meat = 12; r.enemies = []; r.spawnTimer = 0; tick(g); assert.equal(r.enemies[0].kind, 'carnotaurus');
  r.spawnTimer = 0; tick(g); assert.equal(r.enemies.filter(e => e.kind === 'carnotaurus').length, 1);
});
test('mutation choices are distinct, pause simulation, and queued levels resolve', () => {
  const g = make(), r = g.run; g.addXP(30);
  assert.equal(g.phase, 'mutation'); assert.equal(new Set(r.choices).size, 3);
  const before = r.seconds; g.step(.05, { x: 1, attack: true }); assert.equal(r.seconds, before);
  assert.equal(g.choose('not-a-choice'), false);
  resolveMutations(g); assert.equal(r.level, 4); assert.equal(g.phase, 'playing');
  assert.equal(Object.values(r.mutations).reduce((a, b) => a + b, 0), 3);
});
test('mutation menu freezes enemies, attacks, pickups and damage; choosing grants brief protection', () => {
  const g = make(), r = g.run;
  r.health = 1; r.invulnerable = 0;
  const enemy = g.spawn('carnotaurus', { x: r.player.x, y: r.player.y });
  enemy.mode = 'charge'; enemy.timer = .5; enemy.chargeX = 1; enemy.chargeY = 0;
  g.attack(); g.addXP(r.nextXP);
  const frozen = JSON.stringify(r);
  for (let i = 0; i < 200; i++) { g.step(.05, { x: 1, attack: true, pounce: true }); g.damage(999); }
  assert.equal(JSON.stringify(r), frozen, 'entire world remains unchanged while choosing');
  g.choose(r.choices.find(id => id !== 'heart'));
  assert.equal(g.phase, 'playing'); assert.equal(r.invulnerable, 1);
  g.damage(999); assert.equal(r.health, 1, 'safe immediately after choosing');
  r.enemies = []; r.attack = null;
  for (let i = 0; i < 21; i++) g.step(.05);
  g.damage(999); assert.equal(g.phase, 'result', 'protection ends after one second');
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


test('meat quality changes pickup value and XP; large species have better rare-drop odds', () => {
  for (const [roll, rarity, value] of [[.1, 0, 5], [.7, 1, 8], [.9, 2, 10], [.99, 3, 15]]) {
    const g = make(() => roll), r = g.run;
    g.kill(g.spawn('carnotaurus', { x: 480, y: 340 }));
    const p = r.pickups.find(p => p.kind === 'meat'); assert.equal(p.rarity, rarity); assert.equal(p.value, value);
    r.enemies = []; tick(g); assert.equal(r.totalMeat, value); assert.equal(r.meat, value);
    assert.equal(r.level > 1, value >= 6);
  }
  const g = make(() => .9); g.kill(g.spawn('compy', { x: 100, y: 100 }));
  assert.equal(g.run.pickups[0].rarity, 1, 'same roll gives a lower rarity from tiny prey');
});
test('map exploration follows world bounds; reinforcements and bosses never spawn inside the viewport', () => {
  const g = make(() => .99), r = g.run;
  assert.ok(r.map.width >= C.WIDTH * 3); assert.ok(r.map.height >= C.HEIGHT * 3);
  for (const [width, height, x, y] of [[390, 600, 480, 340], [1600, 700, 1600, 900], [700, 300, 2800, 1800]]) {
    r.player.x = x; r.player.y = y; g.setView(width, height);
    for (let i = 0; i < 12; i++) {
      const e = g.spawn('compy'), v = r.view; assert.ok(e);
      assert.ok(e.x <= v.x - 128 || e.x >= v.x + v.width + 128 || e.y <= v.y - 128 || e.y >= v.y + v.height + 128);
      assert.ok(e.x >= 80 && e.x <= r.map.width - 80);
    }
  }
  r.player.x = 1600; r.player.y = 900; g.setView(390, 600); assert.equal(r.view.x, 1405);
  const e = g.spawn('compy', { x: 2400, y: 1400 }), start = { x: e.x, y: e.y };
  g.enemyStep(e, .05); assert.equal(e.mode, 'wander'); assert.ok(Math.hypot(e.x - start.x, e.y - start.y) < 2);
  r.enemies = [e]; r.player.x = e.x - 100; r.player.y = e.y; g.enemyStep(e, .05); assert.equal(e.mode, 'chase'); assert.equal(e.direction, 'W');
  r.player.x = 2800; g.move(r.player, 9999, 0); assert.equal(r.player.x, r.map.width - 58);
});
test('weighted mutation rarity retains unique choices and ranks, and Jonas unlocks a cosmetic secret', () => {
  const g = make(() => .99); g.save.name = 'Jonas'; g.start();
  assert.equal(g.run.jonas, true); assert.ok(g.drainEvents().some(e => e.type === 'jonas'));
  assert.equal(g.run.maxHealth, 100, 'secret does not change balance');
  g.addXP(6); assert.equal(new Set(g.run.choices).size, 3);
  assert.equal(C.MUTATIONS.find(m => m.id === g.run.choices[0]).rarity, 'epic');
  const id = g.run.choices[0]; assert.equal(g.run.mutations[id], 0); g.choose(id); assert.equal(g.run.mutations[id], 1);
});


test('mixed dinosaurs separate fixed bodies even at identical coordinates without dealing damage or changing attack aim', () => {
  const g = make(), r = g.run;
  const a = g.spawn('compy', { x: 1500, y: 1100 }), b = g.spawn('parasaurolophus', { x: 1500, y: 1100 });
  b.mode = 'windup'; b.timer = .5; b.chargeX = 1; b.chargeY = 0;
  const hp = [a.hp, b.hp, r.health]; g.separateDinosaurs();
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.radius + b.radius + 3.95);
  assert.deepEqual([a.hp, b.hp, r.health], hp); assert.equal(r.pickups.length, 0);
  assert.equal(b.mode, 'windup'); assert.equal(b.timer, .5); assert.equal(b.chargeX, 1);
  g.phase = 'mutation'; a.x = b.x; a.y = b.y; const frozen = JSON.stringify(r);
  g.separateDinosaurs(); assert.equal(JSON.stringify(r), frozen);
});
test('crowded herds, bosses and map-edge collisions resolve without escaping bounds or blocking charge patterns', () => {
  const g = make(), r = g.run;
  for (let i = 0; i < 12; i++) g.spawn(i % 2 ? 'compy' : 'carnotaurus', { x: 1500, y: 1100 });
  for (let frame = 0; frame < 20; frame++) g.separateDinosaurs();
  for (let i = 0; i < r.enemies.length; i++) for (let j = i + 1; j < r.enemies.length; j++) {
    const a = r.enemies[i], b = r.enemies[j];
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.radius + b.radius + 3.9);
  }
  r.enemies = [];
  const boss = g.spawn('carnotaurus', { x: 1500, y: 1100 }, true), small = g.spawn('compy', { x: 1501, y: 1100 });
  boss.mode = 'charge'; boss.timer = .4; boss.chargeX = 1; boss.chargeY = 0;
  g.separateDinosaurs(); assert.ok(Math.abs(boss.x - 1500) < 1, 'large charging boss pushes small animals aside');
  assert.ok(small.x > 1540); assert.equal(boss.timer, .4); assert.equal(boss.chargeX, 1);
  r.enemies = [];
  const edge = g.spawn('compy', { x: 54, y: 1100 }), other = g.spawn('carnotaurus', { x: 60, y: 1100 });
  g.separateDinosaurs(); assert.equal(edge.x, 54); assert.ok(other.x - edge.x >= 36.95);
  const x = other.x; g.separateDinosaurs(); assert.equal(other.x, x, 'settled bodies do not jitter');
});

test('successful bites freeze simulation briefly, misses do not, and blood/dust decay with bounded counts', () => {
  const g = make(), r = g.run; g.resolveBite('E'); assert.equal(r.hitStop, 0); assert.equal(r.particles.length, 0);
  const e = g.spawn('carnotaurus', { x: 530, y: 340 }); e.speed = 0;
  g.resolveBite('E'); assert.equal(r.hitStop, .033); assert.ok(r.particles.length >= 8); assert.equal(r.decals.length, 1);
  const before = { x: r.player.x, seconds: r.seconds, particles: JSON.stringify(r.particles), timer: e.cooldown };
  g.step(.016, { x: 1 }); assert.equal(r.player.x, before.x); assert.equal(r.seconds, before.seconds); assert.equal(e.cooldown, before.timer); assert.equal(JSON.stringify(r.particles), before.particles);
  g.pause(); const frozen = JSON.stringify(r); tick(g); assert.equal(JSON.stringify(r), frozen, 'pause also freezes pending hit-stop'); g.resume();
  g.step(.05, { x: 1 }); assert.ok(r.player.x > before.x); assert.ok(r.seconds > before.seconds);
  for (let i = 0; i < 30; i++) g.burst(100, 100, 'blood', 12, i);
  assert.equal(r.particles.length, 160); assert.equal(r.decals.length, 31);
  r.enemies = []; r.hitStop = 0; for (let i = 0; i < 100; i++) g.step(.05);
  assert.equal(r.particles.length, 0); assert.equal(r.decals.length, 0);
});
test('first boss alternates a locked charge and a directional bite with useful recovery openings', () => {
  const g = make(), r = g.run, boss = g.spawn('carnotaurus', { x: 480, y: 220 }, true); boss.cooldown = 0;
  g.enemyStep(boss, .01); assert.equal(boss.mode, 'windup'); assert.equal(boss.pattern, 0); assert.equal(boss.timer, .95);
  const aim = [boss.chargeX, boss.chargeY]; r.player.x = 700;
  for (let i = 0; i < 20; i++) g.enemyStep(boss, .05);
  assert.deepEqual([boss.chargeX, boss.chargeY], aim); assert.equal(boss.mode, 'charge');
  for (let i = 0; i < 12; i++) g.enemyStep(boss, .05);
  assert.equal(boss.mode, 'recover'); assert.ok(boss.timer >= 1.55); assert.equal(r.health, 100, 'sideways dodge avoids charge');
  boss.x = 520; boss.y = 340; boss.facingX = 1; boss.facingY = 0;
  r.player.x = 480; r.player.y = 340; const hp = boss.hp; g.resolveBite('E'); assert.equal(boss.hp, hp - 15); assert.ok(r.effects.at(-1).text.includes('ÅBEN FLANKE'));
  r.player.x = 560; r.hitStop = 0; const frontHP = boss.hp; g.resolveBite('W'); assert.equal(boss.hp, frontHP - 10, 'front is not the recovery weak point');
  boss.mode = 'chase'; boss.cooldown = 0; boss.x = 480; boss.y = 250; r.player.x = 480; r.player.y = 340;
  g.enemyStep(boss, .01); assert.equal(boss.pattern, 1); assert.equal(boss.attackRadius, 100); assert.equal(boss.windupDuration, .6);
  boss.timer = .001; g.enemyStep(boss, .01); assert.equal(boss.mode, 'bite');
  r.invulnerable = 0; g.enemyStep(boss, .11); assert.equal(r.health, 80); r.invulnerable = 0;
  g.enemyStep(boss, .02); assert.equal(r.health, 80, 'one hit per bite');
});
test('half-health first boss signals phase two once and telegraphs each leg of its double charge', () => {
  const g = make(), r = g.run, boss = g.spawn('carnotaurus', { x: 480, y: 220 }, true);
  boss.hp = 110; g.drainEvents(); g.enemyStep(boss, .01);
  assert.equal(boss.bossPhase, 2); assert.equal(boss.mode, 'enrage'); assert.equal(boss.timer, 1.1); assert.equal(g.drainEvents().filter(e => e.type === 'boss_enrage').length, 1);
  const frozen = JSON.stringify(boss); g.phase = 'mutation'; g.enemyStep(boss, .05); assert.equal(JSON.stringify(boss), frozen); g.phase = 'playing';
  for (let i = 0; i < 27; i++) g.enemyStep(boss, .05);
  assert.equal(boss.mode, 'windup'); assert.equal(boss.followUp, true); const firstAim = [boss.chargeX, boss.chargeY];
  boss.timer = .001; g.enemyStep(boss, .01); r.player.x = 680;
  for (let i = 0; i < 12; i++) g.enemyStep(boss, .05);
  assert.equal(boss.mode, 'windup'); assert.equal(boss.attackName, 'STORMLØB 2/2'); assert.equal(boss.timer, .65); assert.equal(boss.followUp, false);
  const secondAim = [boss.chargeX, boss.chargeY]; assert.notDeepEqual(secondAim, firstAim);
  r.player.x = 400; r.player.y = 600; g.enemyStep(boss, .05); assert.deepEqual([boss.chargeX, boss.chargeY], secondAim);
  boss.timer = .001; g.enemyStep(boss, .01); for (let i = 0; i < 12; i++) g.enemyStep(boss, .05);
  assert.equal(boss.mode, 'recover'); assert.equal(g.drainEvents().filter(e => e.type === 'boss_enrage').length, 0);
});
test('first-boss stomp hits once and later bosses now also signal phase two', () => {
  const g = make(), r = g.run, boss = g.spawn('carnotaurus', { x: 480, y: 250 }, true);
  boss.bossPhase = 2; boss.attackCycle = 2; boss.cooldown = 0;
  g.enemyStep(boss, .01); assert.equal(boss.pattern, 2); assert.equal(boss.windupDuration, .9); assert.equal(boss.attackRadius, 115);
  boss.timer = .001; g.enemyStep(boss, .01); assert.equal(boss.mode, 'slam');
  r.pounce = .2; g.enemyStep(boss, .11); assert.equal(r.health, 100);
  r.pounce = 0; g.enemyStep(boss, .02); assert.equal(r.health, 100, 'missed stomp does not repeat');
  boss.timer = .001; g.enemyStep(boss, .01); assert.equal(boss.mode, 'recover'); assert.equal(boss.timer, 1.8);
  r.stage = 1; const later = g.spawn('deinosuchus', { x: 480, y: 200 }, true); later.hp = later.maxHP / 2; later.cooldown = 0; g.enemyStep(later, .01);
  assert.equal(later.mode, 'enrage'); assert.equal(later.bossPhase, 2);
});
test('terrain layouts provide seeded wilderness and biome-specific scenery without changing world bounds', () => {
  for (let stage = 0; stage < 4; stage++) {
    const map = C.createMap(stage); assert.deepEqual(map, C.createMap(stage));
    assert.equal(map.trails.length, 0); assert.ok(map.regions.length >= 5); assert.equal(map.clearings.length, 0); assert.notDeepEqual(map, C.createMap(stage, 2));
    assert.ok(map.decorations.length > 10); assert.ok(map.decorations.every(p => p.x > 0 && p.x < map.width && p.y > 0 && p.y < map.height));
    assert.ok(map.trails.every(points => points.every(p => p.x >= 0 && p.y >= 0 && p.x <= map.width && p.y <= map.height)));
    if (stage === 0) assert.ok(map.decorations.some(p => p.canopy));
    if (stage === 3) assert.ok(map.decorations.some(p => p.path.endsWith('lava_rock.png')));
  }
});
