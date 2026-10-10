'use strict';
// B1a boss reachability and B1b lava crossings (05_BOSS_EXPLOIT_REVIEW §4–5): X2–X8, X10, X12. X1 lives in boss-exploit.test.cjs.
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const { scene } = require('../tools/boss_exploit_probe.cjs');
const { runOne } = require('../tools/playstyle_sim.cjs');
const DT = 1 / 30;
const withFlag = (on, fn) => { const old = C.FEATURES.bossReach; C.FEATURES.bossReach = on; try { return fn(); } finally { C.FEATURES.bossReach = old; } };

test('X3: across lava Karl never selects a charge (stalk, and the lane check at selection)', () => {
  let charges = 0, decisions = 0;
  for (const [offset, bossOffset] of [[18, 40], [50, 60], [90, 30], [110, 90]]) {
    const { g, r, boss } = scene({ offset, bossOffset, crossings: false });
    let last = boss.mode;
    for (let i = 0; i < 300; i++) { g.step(DT, { attack: true }); if (boss.mode === 'charge' && last !== 'charge') charges++; if (boss.mode !== last) decisions++; last = boss.mode; }
    assert.equal(g.chargeLaneClear(boss), false, 'lava between boss and player blocks the lane');
  }
  assert.equal(charges, 0);
  // Selection guard on its own: 200 forced decisions in chase mode with cooldown 0 and the reach states off.
  for (const gap of [40, 90]) {
    const { g, boss } = scene({ offset: gap, bossOffset: gap, crossings: false });
    g.bossReach = () => false; // only the selection-time lane check is under test here
    for (let i = 0; i < 100; i++) { boss.mode = 'chase'; boss.cooldown = 0; g.forestBossAI(boss, DT); decisions++; assert.notEqual(boss.mode === 'windup' && boss.pattern, 0, 'gap ' + gap + ' decision ' + i); }
  }
  assert.ok(decisions >= 200);
  const open = scene({ offset: 40, bossOffset: 40, open: true });
  assert.equal(open.g.chargeLaneClear(open.boss), true, 'open ground keeps the charge lane');
});

test('X4: a charge whose path enters lava skids to a stop with recover ≤ 0.5 s', () => {
  const { g, r, boss, line, at } = scene({ offset: 300, bossOffset: 90 });
  Object.assign(r.player, at(-90)); r.player.x += line.n.y * 260; r.player.y -= line.n.x * 260; // player beside Karl, same bank
  Object.assign(boss, { mode: 'charge', timer: .58, chargeX: line.n.x, chargeY: line.n.y, attackHit: false, cooldown: 1 }); // aimed at the lava
  let recover = null;
  for (let i = 0; i < 30 && recover === null; i++) { g.step(DT, {}); if (boss.mode === 'recover') recover = boss.timer; }
  assert.ok(recover !== null && recover <= .5, 'recover ' + recover);
  assert.equal(boss.skids, 1); assert.equal(C.isLava(r.stage, r.map, boss), false);
});

test('X5: a charge dodged on open ground keeps the full 1.5 s / 1.2 s recover', () => {
  for (const phase of [1, 2]) {
    const { g, r, boss, line } = scene({ offset: 300, bossOffset: 0, open: true });
    r.player.x = boss.x + line.n.y * 400; r.player.y = boss.y - line.n.x * 400; // far to the side: the charge misses
    Object.assign(boss, { mode: 'charge', timer: .58, chargeX: line.n.x, chargeY: line.n.y, attackHit: false, bossPhase: phase, followUp: false, hp: phase === 2 ? boss.maxHP * .4 : boss.hp });
    let recover = null;
    for (let i = 0; i < 40 && recover === null; i++) { g.step(DT, {}); if (boss.mode === 'recover') recover = boss.timer; }
    assert.ok(Math.abs(recover - (phase === 2 ? 1.2 : 1.5)) < .05, 'phase ' + phase + ' recover ' + recover);
    assert.equal(boss.skids || 0, 0);
  }
});

// A stage-3 map whose lava line is a closed ring around the player: an island no walker can reach.
function islandScene(species = 'ankylosaurus') {
  const map = C.createMap(3, 5), cx = map.width / 2, cy = map.height / 2, ring = [];
  for (let i = 0; i <= 48; i++) ring.push({ x: cx + Math.cos(i / 48 * Math.PI * 2) * 170, y: cy + Math.sin(i / 48 * Math.PI * 2) * 170 });
  map.river = ring; map.riverCurve = ring; map.rocks = []; map.ponds = []; map.lavaCrossings = [];
  const s = scene({ species, map, offset: 0, bossOffset: 0 });
  Object.assign(s.r.player, { x: cx, y: cy }); Object.assign(s.boss, { x: cx + 420, y: cy, homeX: cx + 420, homeY: cy });
  return s;
}

test('X6: player on an unreachable island → stalk within 3 s, outside the player reach + 20 px in ≥ 95 % of frames', () => {
  for (const species of ['ankylosaurus', 'tyrannosaurus', 'velociraptor']) {
    const { g, r, boss } = islandScene(species);
    let stalkAt = null, frames = 0, safe = 0;
    for (let i = 0; i < 20 * 30; i++) {
      g.step(DT, { attack: true });
      if (stalkAt === null && boss.mode === 'stalk') stalkAt = r.seconds;
      frames++; if (Math.hypot(boss.x - r.player.x, boss.y - r.player.y) >= g.playerReach(boss) + 20) safe++;
      assert.equal(C.isLava(r.stage, r.map, boss), false);
    }
    assert.ok(stalkAt !== null && stalkAt <= 3, species + ' stalk at ' + stalkAt);
    assert.ok(safe / frames >= .95, species + ' safe ' + (safe / frames));
    assert.equal(boss.hp, boss.maxHP, species + ': the island gives no free damage');
  }
});

test('X7: bosses never step into lava during 1000 random steps next to it', () => {
  for (const level of [6, 7]) for (const seed of [3, 11]) {
    const { g, r, boss, line, at } = scene({ level, seed, offset: 60, bossOffset: 40 });
    let x = 7;
    const rand = () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < 1000; i++) {
      if (i % 25 === 0) Object.assign(r.player, at((rand() - .5) * 240));
      r.health = r.maxHealth; r.invulnerable = 1;
      g.step(DT, { x: rand() - .5, y: rand() - .5, attack: rand() < .5 });
      assert.equal(C.isLava(r.stage, r.map, boss), false, 'level ' + (level + 1) + ' step ' + i);
    }
  }
});

test('stalk: a boss cornered against the map edge inside the player reach fights back (no free hits)', () => {
  const map = C.createMap(3, 5); map.river = [{ x: 150, y: 0 }, { x: 150, y: map.height }]; map.riverCurve = map.river; map.rocks = []; map.ponds = []; map.lavaCrossings = [];
  const { g, r, boss } = scene({ map, offset: 0, bossOffset: 0 });
  Object.assign(r.player, { x: 182, y: 1500 }); Object.assign(boss, { x: 110, y: 1500 }); // edge clamp at x = 84: Karl cannot leave the reach
  const hp = r.health;
  for (let i = 0; i < 20 * 30 && g.phase === 'playing'; i++) g.step(DT, { attack: true });
  assert.ok(r.health < hp || g.phase !== 'playing', 'the cornered boss bites back across the strip');
  assert.equal(C.isLava(r.stage, r.map, boss), false);
});

test('X7: a rock at the lava edge cannot push a boss into the lava (move() push-out is reverted)', () => {
  const { g, r, boss, line, at } = scene({ offset: 300, bossOffset: 60, crossings: false });
  const edge = at(-14 - boss.radius - 4); Object.assign(boss, edge);
  r.map.rocks.push({ x: edge.x - line.n.x * 60, y: edge.y - line.n.y * 60, radius: 80 }); // a big rock behind it: its push-out points into the lava
  for (let i = 0; i < 60; i++) { g.travel(boss, line.n.x * 2, line.n.y * 2); assert.equal(C.isLava(r.stage, r.map, boss), false, 'step ' + i); }
  C.FEATURES.bossReach = false; let entered = false; // documents the old bug: the same pushes reach the lava without the guard
  try { for (let i = 0; i < 60 && !entered; i++) { g.travel(boss, line.n.x * 2, line.n.y * 2); entered = C.isLava(r.stage, r.map, boss); } } finally { C.FEATURES.bossReach = true; }
  assert.equal(entered, true, 'without the guard the rock pushes the boss into the lava (the bug this guards against)');
});

test('X8: flow-field updates cost ≤ 1.5 ms and run at most twice per second per boss', () => {
  const { g, r, boss } = islandScene();
  g.step(DT, {}); // builds the nav grid once
  const before = r.navUpdates || 0, t0 = r.seconds;
  for (let i = 0; i < 10 * 30; i++) g.step(DT, {});
  const updates = r.navUpdates - before, perSecond = updates / (r.seconds - t0);
  assert.ok(perSecond <= 2.05, 'updates/s ' + perSecond);
  // Best of 8 batches, so a busy CI machine (parallel test files) measures the code rather than the scheduler.
  const grid = C.NAV.navGrid(r.stage, r.map, true, boss.radius), N = 10; let ms = Infinity;
  for (let batch = 0; batch < 8; batch++) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < N; i++) C.NAV.navFlow(r.stage, r.map, grid, true, { x: r.player.x + i, y: r.player.y });
    ms = Math.min(ms, Number(process.hrtime.bigint() - start) / 1e6 / N);
  }
  assert.ok(ms <= 1.5, 'ms per flow update ' + ms.toFixed(3));
});

test('X12: leash after 12 s unreachable and 8 s undamaged: back toward the arena, HP unchanged', () => {
  const { g, r, boss, at } = scene({ offset: 300, bossOffset: 120, crossings: false });
  const home = at(-700); boss.homeX = home.x; boss.homeY = home.y; // its arena lies far behind it, away from the lava
  const hp = boss.hp, start = Math.hypot(boss.x - home.x, boss.y - home.y);
  for (let i = 0; i < 11 * 30; i++) g.step(DT, {});
  assert.notEqual(boss.mode, 'leash', 'not before 12 s');
  for (let i = 0; i < 9 * 30; i++) g.step(DT, {});
  assert.equal(boss.mode, 'leash');
  const left = Math.hypot(boss.x - home.x, boss.y - home.y);
  assert.ok(left < start - 200, 'walking back to the arena: ' + Math.round(start) + ' → ' + Math.round(left) + ' px');
  assert.equal(boss.hp, hp);
});

test('X10: Carl normal fights (optimizer bot, 12 seeds here, 50 in balance_runs) are unchanged by B1a (win rate and damage within ±5 %)', () => {
  const fight = on => withFlag(on, () => {
    let wins = 0, damage = 0;
    for (let i = 0; i < 12; i++) { const o = runOne(C, { species: 'carnotaurus', style: 'optimizer', seed: 2000 + i, seconds: 150, dt: DT, level: 1, bossDuel: true }); if (o.outcome === 'boss_win') wins++; damage += o.damageTaken; }
    return { wins, damage };
  });
  const base = fight(false), now = fight(true);
  assert.ok(Math.abs(now.wins - base.wins) <= Math.max(1, base.wins * .05), JSON.stringify({ base, now }));
  assert.ok(Math.abs(now.damage - base.damage) <= base.damage * .05, JSON.stringify({ base, now }));
});

test('X2 (B1b): a bot that walks to a basalt crossing and fights takes Karl within ±10 % of the open-ground fight', () => {
  const lost = open => { let sum = 0; for (let i = 0; i < 12; i++) sum += runOne(C, { species: 'carnotaurus', style: 'optimizer', seed: 3000 + i, seconds: 200, dt: DT, level: 6, bossDuel: true, open, across: true, alone: true }).bossHpLostPct; return sum / 12; };
  const ground = lost(true), lava = lost(false);
  assert.ok(Math.abs(lava - ground) <= 10, JSON.stringify({ ground, lava }));
});

test('B1b: two basalt crossings on every level-7 map, ≥ 900 px apart, ≥ 600 px from the start, lava off within 70 px', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const map = C.createMap(3, seed), [a, b] = map.lavaCrossings;
    assert.equal(map.lavaCrossings.length, 2, 'seed ' + seed);
    assert.ok(Math.abs(a.along - b.along) >= 900 && Math.hypot(a.x - b.x, a.y - b.y) >= 600, 'seed ' + seed + ' apart');
    for (const c of map.lavaCrossings) {
      assert.ok(Math.hypot(c.x - 480, c.y - 340) >= 600, 'seed ' + seed + ' start');
      assert.equal(C.isLava(3, map, c), false); assert.equal(C.isLava(3, map, { x: c.x + 60, y: c.y }), false);
    }
    assert.equal(C.isLava(3, { ...map, lavaCrossings: [] }, a), true, 'the crossing sits on the lava line');
  }
  for (const stage of [0, 1, 2]) assert.deepEqual(C.createMap(stage, 3).lavaCrossings, []);
});
