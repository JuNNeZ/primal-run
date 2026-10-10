#!/usr/bin/env node
'use strict';
// Read-only evidence probes for the "Records, Results, World & Extinction" design phase.
// They drive the real deterministic core (no rendering) and print JSON findings.
// Usage: node docs/design/records-world-extinction/probes/audit_probes.cjs
const path = require('node:path');
const C = require(path.resolve(__dirname, '../../../../PRIMAL_RUN_Game/src/core.js'));
const advance = (g, n) => { for (let i = 0; i < n; i++) { g.phase = 'cleared'; g.run.bossDefeated = true; g.nextStage(); } };
const out = {};

// 1. Distance: 60 s of continuous movement and 60 s idle (velociraptor, enemies removed).
{
  const g = new C.Game(); g.selectSpecies('velociraptor'); g.start({ seed: 7 }); const r = g.run; r.enemies = []; r.spawnTimer = 1e9;
  for (let i = 0; i < 1800; i++) { const d = Math.floor(i / 90) % 4; g.step(1 / 30, { x: d === 0 ? -1 : d === 1 ? 1 : 0, y: d === 2 ? -1 : d === 3 ? 1 : 0 }); g.phase = 'playing'; r.enemies = []; }
  const moving = r.stats.distance; for (let i = 0; i < 1800; i++) { g.step(1 / 30, {}); g.phase = 'playing'; r.enemies = []; }
  const idle = r.stats.distance - moving; const before = r.stats.distance; r.player.x += 500; g.step(1 / 30, {});
  out.distance = { species: r.species, speedPxPerSec: C.PLAYER_SPECIES[r.species].speed, movingPx60s: Math.round(moving), displayedKmPer60s: +(moving / 1000).toFixed(2), idlePx60s: idle, teleport500pxAdds: r.stats.distance - before, minutesOfMovementFor103DisplayedKm: +(103000 / moving).toFixed(1) };
}

// 2. Rival spawn reliability and reward-event counts, 200 seeds x 8 levels.
{
  let missing = 0, allEight = 0; const perLevel = Array(8).fill(0); const events = {};
  for (let seed = 1; seed <= 200; seed++) {
    const g = new C.Game(); g.start({ seed }); let all = true;
    for (let l = 0; l < 8; l++) { const m = g.run.map; if (!m.rival) { missing++; perLevel[l]++; all = false; } const n = m.events.length; events[n] = (events[n] || 0) + 1; if (l < 7) advance(g, 1); }
    if (all) allEight++;
  }
  out.rivals = { levelsChecked: 1600, rivalMissing: missing, missingPerLevel: perLevel, runsWithAllEightRivals: allEight, of: 200, rewardEventsPerLevel: events };
}

// 3. Colliders: which props block movement (only map.rocks are solid in move()).
{
  const g = new C.Game(); g.start({ seed: 3 }); advance(g, 2); const m = g.run.map; const props = {};
  for (const d of m.decorations) { const k = d.path.split('/').pop(); const p = props[k] || (props[k] = { count: 0, onRockCollider: 0, isSoftCover: 0 }); p.count++; if (m.rocks.some(r => Math.hypot(r.x - d.x, r.y - d.y) < r.radius + 4)) p.onRockCollider++; if (m.cover.some(c => Math.hypot(c.x - d.x, c.y - d.y) < 4)) p.isSoftCover++; }
  out.colliders = { level: 3, solidRocks: m.rocks.length, softCover: m.cover.length, mudPatches: (m.mud || []).length, props };
}

// 4. Lava-river boss exploit: static velociraptor on the far bank of the lava line, Karl on the other.
{
  const trial = off => {
    const g = new C.Game(); g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.selectSpecies('velociraptor'); g.start({ seed: 3 }); advance(g, 6);
    const r = g.run; r.enemies = []; r.spawnTimer = 1e9; const line = r.map.riverCurve || r.map.river; const i = Math.floor(line.length / 2), p = line[i], q = line[i + 1];
    let nx = -(q.y - p.y), ny = q.x - p.x; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
    const boss = g.spawn(r.campaign[r.levelIndex].boss, { x: p.x - nx * 60, y: p.y - ny * 60 }, true); const hp0 = r.health, b0 = boss.hp, modes = {};
    for (let k = 0; k < 2700 && boss.hp > 0 && r.health > 0; k++) {
      const dx = boss.x - r.player.x, dy = boss.y - r.player.y, d = Math.hypot(dx, dy); modes[boss.mode] = (modes[boss.mode] || 0) + 1;
      r.player.x = p.x + nx * off; r.player.y = p.y + ny * off; r.player.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : (dy > 0 ? 'S' : 'N');
      g.step(1 / 30, d < C.PLAYER_SPECIES.velociraptor.range + boss.radius && k % 10 === 0 ? { attack: true } : {}); if (g.phase !== 'playing' && g.phase !== 'result') g.phase = 'playing';
    }
    return { playerOffsetFromLavaLine: off, boss: boss.kind, bossHpLostPct: Math.round(100 * (b0 - Math.max(0, boss.hp)) / b0), playerHpLostPct: Math.round(100 * (hp0 - r.health) / hp0), framesByMode: modes };
  };
  out.lavaExploit = { lavaCoreHalfWidthPx: 14, trials: [18, 30, 40, 50, 60, 70].map(trial) };
}
console.log(JSON.stringify(out, null, 1));
