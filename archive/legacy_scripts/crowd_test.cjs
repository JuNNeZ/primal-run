#!/usr/bin/env node
'use strict';
// Crowd test (2026-10-17): a player stands inside a group of predators, biting the nearest one while stepping a little
// from side to side (the "Compy stands in the middle and staggers everything" report). Prints damage taken per minute,
// how often a nearby enemy is stunned (flinch/stagger), and kills.
//   node tools/crowd_test.cjs [--species compy] [--kind allosaurus] [--count 4] [--level 5] [--seconds 60] [--seeds 10] [--off flagA,flagB] [--mutations '{"quick":3}']
const path = require('node:path');
const a = process.argv.slice(2), get = (k, d) => { const i = a.indexOf('--' + k); return i < 0 ? d : a[i + 1]; };
const C = require(process.env.PRIMAL_CORE || path.join(__dirname, '../PRIMAL_RUN_Game/src/core.js'));
for (const f of get('off', '').split(',').filter(Boolean)) C.FEATURES[f] = false;
const species = get('species', 'compy'), kind = get('kind', 'allosaurus'), count = +get('count', 4), level = +get('level', 5) - 1;
const seconds = +get('seconds', 60), seeds = +get('seeds', 10), muts = JSON.parse(get('mutations', '{}')), dt = 1 / 30;
const rng = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
let taken = 0, stunned = 0, samples = 0, kills = 0, deaths = 0, bites = 0;
for (let seed = 1; seed <= seeds; seed++) {
  const g = new C.Game({ random: rng(seed) });
  g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.selectSpecies(species);
  Object.assign(g.save.upgrades, { health: 5, damage: 5, regen: 5 }); g.save.settings.difficulty = 'extinction';
  g.start({ seed });
  const r = g.run; for (let i = 0; i < level; i++) { g.phase = 'cleared'; r.bossDefeated = true; g.nextStage(); }
  Object.assign(r.mutations, muts); r.enemies = []; r.spawnTimer = 1e9; r.maxHealth = r.health = 1e6; r.map.rocks = [];
  const P = r.player, spawnOne = i => { const ang = i * 2 * Math.PI / count + seed; const e = g.spawn(kind, { x: P.x + Math.cos(ang) * 60, y: P.y + Math.sin(ang) * 60 }); g.provoke(e); e.alert = true; return e; };
  for (let i = 0; i < count; i++) spawnOne(i);
  let t = 0, side = 1, hp = r.health;
  while (t < seconds && g.phase === 'playing') {
    if (Math.floor(t / .5) % 2 === 0) side = 1; else side = -1;
    const near = r.enemies.filter(e => e.damage).sort((p, q) => Math.hypot(p.x - P.x, p.y - P.y) - Math.hypot(q.x - P.x, q.y - P.y))[0];
    let dx = 0, dy = side * .6;
    if (near) { const ex = near.x - P.x, ey = near.y - P.y; P.facing = Math.abs(ex) > Math.abs(ey) ? (ex > 0 ? 'E' : 'W') : (ey > 0 ? 'S' : 'N'); }
    // --dodge: like a skilled player, dash sideways when a nearby attack is about to land
    const threat = a.includes('--dodge') && r.enemies.find(e => e.mode === 'windup' && e.timer < .3 && Math.hypot(e.x - P.x, e.y - P.y) < 140);
    if (threat) { const ex = threat.x - P.x, ey = threat.y - P.y, d = Math.hypot(ex, ey) || 1; dx = -ey / d * side; dy = ex / d * side; }
    const before = r.stats.attacks;
    g.step(dt, { x: dx, y: dy, attack: !threat, pounce: !!threat });
    if (g.phase === 'mutation') { g.choose(r.choices[0]); }
    bites += r.stats.attacks - before;
    for (const e of r.enemies) if (e.damage && Math.hypot(e.x - P.x, e.y - P.y) < 120) { samples++; if (e.stagger > 0 || e.flinch > 0) stunned++; }
    const alive = r.enemies.filter(e => e.damage && e.hp > 0).length; for (let i = alive; i < count; i++) { spawnOne(i); kills++; }
    t += dt;
  }
  taken += hp - r.health;
}
console.log(JSON.stringify({ species, kind, count, level: level + 1, off: get('off', ''), damagePerMin: +(taken / seeds / (seconds / 60)).toFixed(1), stunnedPct: +(100 * stunned / Math.max(1, samples)).toFixed(1), killsPerMin: +(kills / seeds / (seconds / 60)).toFixed(1), bitesPerSec: +(bites / seeds / seconds).toFixed(2) }));
