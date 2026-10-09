'use strict';
// Overhaul phases 1-2: crits, stamina, rival minibosses and ecology behaviour.
const { test } = require('node:test'), assert = require('node:assert/strict'), C = require('../PRIMAL_RUN_Game/src/core.js');
function game(species, random = () => .5) {
  const g = new C.Game({ random }); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES);
  if (species) g.selectSpecies(species); g.start({ seed: 321 });
  const r = g.run; r.enemies = []; r.pickups = []; r.spawnTimer = 999; r.map.rocks = []; return g;
}

test('critical hits are the only bite stagger and boss crits build a break meter', () => {
  const g = game('velociraptor', () => 0), r = g.run, e = g.spawn('carnotaurus', { x: 520, y: 340 });
  g.resolveBite('E'); assert.ok(e.stagger >= C.CRIT.stagger); assert.equal(r.stats.crits, 1);
  const boss = g.spawn('carnotaurus', { x: 520, y: 340 }, true);
  for (let i = 0; i < 4; i++) g.resolveBite('E');
  assert.equal(boss.mode, 'broken', 'four crits break a boss');
  const calm = game('velociraptor', () => .99), m = calm.spawn('carnotaurus', { x: 520, y: 340 });
  calm.resolveBite('E'); assert.equal(m.stagger, 0);
});

test('stamina refills slower in combat and an empty bar leaves you winded', () => {
  const g = game('carnotaurus'), r = g.run; r.stamina = 55; r.pounceCooldown = 0;
  g.step(.01, { x: 1, pounce: true }); assert.ok(r.stamina < C.STAMINA.windedBelow); assert.ok(r.winded > 0);
  const x = r.player.x; r.pounce = 0; r.staminaDelay = 0; g.step(.05, { x: 1 }); const winded = r.player.x - x;
  r.winded = 0; const y = r.player.x; g.step(.05, { x: 1 }); assert.ok(r.player.x - y > winded, 'winded is slower');
});

test('every journey level has one optional rival miniboss that rewards an epic genome', () => {
  const g = new C.Game({ random: () => .5 }); g.start({ seed: 77 }); const r = g.run;
  assert.ok(r.map.rival); const rival = r.enemies.find(e => e.id === r.map.rival.id);
  assert.ok(rival.miniboss && rival.elite && !rival.guard); assert.ok(Math.hypot(rival.x - 480, rival.y - 340) > 900);
  g.kill(rival); assert.equal(g.phase, 'mutation'); assert.equal(r.rareSelection, true);
});

test('compys steal food near you instead of attacking, then run off with it', () => {
  const g = game('velociraptor'), r = g.run, c = g.spawn('compy', { x: 600, y: 340 });
  r.pickups.push({ id: 900, kind: 'meat', corpseId: 55, x: 560, y: 340, rarity: 0, value: 3 });
  for (let i = 0; i < 40 && !c.carrying; i++) g.enemyStep(c, .05);
  assert.equal(c.carrying, 1); assert.equal(r.pickups[0].value, 2); assert.equal(r.health, r.maxHealth);
  const d = Math.hypot(c.x - r.player.x, c.y - r.player.y); g.enemyStep(c, .1);
  assert.ok(Math.hypot(c.x - r.player.x, c.y - r.player.y) > d, 'thief runs away');
});

test('a wounded compy retreats, heals out of sight and returns while hungry', () => {
  const g = game('velociraptor'), r = g.run, c = g.spawn('compy', { x: 540, y: 340 });
  g.provoke(c); c.hp = c.maxHP * .3; c.hunger = .9; g.enemyStep(c, .05); assert.equal(c.retreating, true); assert.equal(c.mode, 'flee');
  c.x = 1600; c.y = 1200; for (let i = 0; i < 400 && c.retreating; i++) { r.seconds += .05; g.enemyStep(c, .05); }
  assert.equal(c.retreating, false); assert.equal(c.alert, true);
});

test('territorial herbivores only warn a herbivore player unless crowded or hit', () => {
  const g = game('triceratops'), r = g.run, a = g.spawn('ankylosaurus', { x: 620, y: 340 });
  g.enemyStep(a, .05); assert.equal(a.mode, 'warning'); assert.equal(a.alert, false);
  a.x = 560; for (let i = 0; i < 60; i++) g.enemyStep(a, .05); assert.equal(a.alert, true, 'crowding for 2.5 s provokes it');
  const c = game('velociraptor'), b = c.spawn('ankylosaurus', { x: 600, y: 340 }); c.enemyStep(b, .05); assert.equal(b.alert, true, 'carnivores are still a threat');
});

test('hungry predators can hunt prey; natural kills leave a carcass but give the player nothing', () => {
  const g = game('velociraptor'), r = g.run; r.player.x = 2400; r.player.y = 1600;
  const hunter = g.spawn('carnotaurus', { x: 800, y: 700 }), prey = g.spawn('parasaurolophus', { x: 860, y: 700 });
  hunter.hunger = .95; prey.hp = 1; const kills = r.kills, drops = r.stats.dropRolls;
  for (let i = 0; i < 200 && r.enemies.includes(prey); i++) g.step(.05, {});
  assert.ok(!r.enemies.includes(prey)); assert.equal(r.kills, kills); assert.equal(r.stats.dropRolls, drops, 'no player loot roll');
  assert.ok(r.corpses.some(c => c.id === prey.id)); assert.ok(r.pickups.some(p => p.corpseId === prey.id));
});

test('maps are larger and split into named zones whose animals differ; the start zone is gentle', () => {
  for (let stage = 0; stage < 4; stage++) for (let seed = 1; seed <= 12; seed++) {
    const m = C.createMap(stage, seed); assert.ok(m.width >= 2880 * 1.3); assert.ok(m.zones.length >= 5);
    assert.ok(m.zones[0].start); assert.ok(Math.hypot(m.zones[0].x - 480, m.zones[0].y - 340) < 400);
    assert.ok(new Set(m.zones.map(z => z.id)).size >= 4, 'all zone types appear');
    assert.ok(m.events.some(e => e.zone !== undefined), 'zones hide rewards');
  }
  const g = new C.Game({ random: () => .5 }); g.start({ seed: 9 }); const r = g.run;
  for (const e of r.enemies.filter(e => !e.elite && !e.rare && !e.thiefPack)) {
    const z = C.zoneAt(r.map, { x: e.homeX, y: e.homeY }); if (z) assert.ok(z.animals.includes(e.kind) || ['compy', 'parasaurolophus'].includes(e.kind), e.kind + ' in ' + z.id);
  }
  assert.ok(!r.enemies.some(e => e.kind === 'carnotaurus' && !e.elite && C.zoneAt(r.map, { x: e.homeX, y: e.homeY }).start), 'no Carnotaurus in the starting clearing');
});

test('entering a new zone is announced and rewards exploration once', () => {
  const g = new C.Game({ random: () => .5 }); g.start({ seed: 5 }); const r = g.run; g.drainEvents();
  const z = r.map.zones.find(z => !z.start); r.player.x = z.x; r.player.y = z.y; r.spawnTimer = 999; const dna = r.dna;
  g.step(.05, {}); const ev = g.drainEvents().filter(e => e.type === 'zone'); assert.equal(ev.length, 1); assert.equal(ev[0].name, z.name);
  assert.equal(r.dna, dna + 1); g.step(.5, {}); assert.equal(g.drainEvents().filter(e => e.type === 'zone').length, 0);
});

test('achievements unlock once, pay DNA, unlock species and skins, and survive saving', () => {
  const g = new C.Game({ random: () => .5 }); g.start({ seed: 3 }); const r = g.run; r.enemies = []; g.drainEvents();
  const e = g.spawn('compy', { x: 520, y: 340 }); const dna = g.save.dna; g.kill(e); g.checkAchievements();
  assert.ok(g.save.achievements.firstBlood); assert.equal(g.save.dna, dna + 5 + (r.dna - 5 - (r.dna - 5)));
  assert.equal(g.drainEvents().filter(x => x.type === 'achievement').length, 1); g.checkAchievements(); assert.equal(g.drainEvents().filter(x => x.type === 'achievement').length, 0);
  r.seconds = 601; g.checkAchievements(); assert.ok(g.save.unlockedSpecies.includes('compy'), 'surviving 10 minutes unlocks Compy');
  const boss = g.spawn('baryonyx', { x: 600, y: 340 }, true); g.kill(boss); assert.ok(g.save.unlockedSpecies.includes('baryonyx')); assert.ok(g.save.skins.includes('male'));
  const saved = C.sanitizeSave(JSON.parse(JSON.stringify(g.save))); assert.ok(saved.achievements.firstBoss); assert.ok(saved.unlockedSpecies.includes('baryonyx')); assert.ok(g.setSkin('male')); assert.equal(g.setSkin('albino'), false);
});

test('fresh saves only have Velociraptor; pre-overhaul saves keep Compy; lifetime stats bank once per run', () => {
  assert.deepEqual(C.sanitizeSave({}).unlockedSpecies.slice().sort(), ['velociraptor'].sort());
  const fresh = C.sanitizeSave({ version: 2 }); assert.deepEqual(fresh.unlockedSpecies, ['velociraptor']);
  assert.ok(C.sanitizeSave({ version: 1, unlockedSpecies: ['utahraptor'] }).unlockedSpecies.includes('compy'));
  const g = new C.Game({ random: () => .5 }); g.start({ seed: 4 }); g.run.stats.kills = 7; g.finish(false); g.finish(false); g.bankLifetime(false);
  assert.equal(g.save.lifetime.runs, 1); assert.equal(g.save.lifetime.kills, 7);
});

test('deep river water blocks small walkers except at fords; swimmers and big species cross; lava burns', () => {
  const g = game('velociraptor'), r = g.run, p = r.player; r.stage = 1; r.map.river = [{ x: 0, y: 400 }, { x: 4000, y: 400 }]; r.map.riverCurve = r.map.river; r.map.ponds = []; r.map.fords = [{ x: 1200, y: 400 }];
  p.x = 600; p.y = 370; for (let i = 0; i < 20; i++) g.travel(p, 0, 4); assert.ok(p.y < 400 - 20, 'cannot wade into deep water');
  p.x = 1200; p.y = 370; for (let i = 0; i < 30; i++) g.travel(p, 0, 4); assert.ok(p.y > 420, 'the ford is crossable');
  const croc = g.spawn('deinosuchus', { x: 2000, y: 370 }); for (let i = 0; i < 20; i++) g.travel(croc, 0, 4); assert.ok(croc.y > 400);
  const lava = game('velociraptor'), l = lava.run; l.stage = 3; l.map.river = [{ x: 0, y: 340 }, { x: 4000, y: 340 }]; l.map.riverCurve = l.map.river; l.player.y = 340;
  const hp = l.health; lava.step(.05, {}); assert.ok(l.health < hp, 'lava burns'); assert.equal(l.surface, 'lava');
});
