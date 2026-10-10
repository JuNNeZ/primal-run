#!/usr/bin/env node
'use strict';
/*
 * PRIMAL RUN – play-style balance simulator
 * -----------------------------------------
 * Runs the real shared game core (PRIMAL_RUN_Game/src/core.js) headless with
 * bots that imitate different kinds of players, on all CPU cores.
 *
 *   node tools/playstyle_sim.cjs                       # default: all species × all styles × 20 seeds
 *   node tools/playstyle_sim.cjs --runs 50 --species velociraptor,compy --styles casual,optimizer
 *   node tools/playstyle_sim.cjs --quick               # small smoke test (~1 min)
 *   node tools/playstyle_sim.cjs --help
 *
 * Output (default folder: balance_runs/playstyle_<date>):
 *   runs.jsonl            one line per run (all raw metrics)
 *   summary.csv           one row per species × style (open in Excel/Sheets)
 *   REPORT.md             readable tables + automatic warnings
 *   summary_compact.json  small file – paste/attach this to Claude to save tokens
 *
 * No cheats: bots only send the same inputs a player can (move, attack, ability,
 * eat, interact, sneak) and choose mutations through game.choose().
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');

// --core <path> (or PRIMAL_CORE) runs the same bots against another core.js, e.g. a baseline checkout.
const CORE_PATH = path.resolve(process.env.PRIMAL_CORE || (process.argv.includes('--core') ? process.argv[process.argv.indexOf('--core') + 1] : path.join(__dirname, '../PRIMAL_RUN_Game/src/core.js')));

// ---------------------------------------------------------------- play styles
const STYLES = {
  optimizer: { label: 'Optimerer (min-maxer)', reaction: 0.05, dodge: 0.95, aimError: 0, ability: 'smart', retreatHP: 0.35, explore: false, picks: 'best', foodGreed: 0.6, sneak: false },
  average:   { label: 'Gennemsnitlig spiller',  reaction: 0.18, dodge: 0.65, aimError: 18, ability: 'smart', retreatHP: 0.30, explore: true,  picks: 'mixed', foodGreed: 0.5, sneak: false },
  casual:    { label: 'Afslappet/casual',       reaction: 0.30, dodge: 0.35, aimError: 30, ability: 'sometimes', retreatHP: 0.25, explore: true, picks: 'random', foodGreed: 0.4, sneak: false },
  brawler:   { label: 'Slagsbror (angriber alt)', reaction: 0.12, dodge: 0.15, aimError: 10, ability: 'spam', retreatHP: 0, explore: false, picks: 'offence', foodGreed: 0.2, sneak: false },
  explorer:  { label: 'Udforsker/samler',       reaction: 0.20, dodge: 0.6, aimError: 15, ability: 'smart', retreatHP: 0.4, explore: true, picks: 'defence', foodGreed: 0.8, sneak: true, wanderBias: 1 },
  exploiter: { label: 'Terræn-udnytter (B1)', reaction: 0.05, dodge: 0.95, aimError: 0, ability: 'smart', retreatHP: 0.35, explore: false, picks: 'best', foodGreed: 0.6, sneak: false, exploit: true },
  newbie:    { label: 'Ny spiller',             reaction: 0.45, dodge: 0.15, aimError: 40, ability: 'never', retreatHP: 0.2, explore: false, picks: 'random', foodGreed: 0.3, sneak: false },
};

const OFFENCE = ['teeth', 'quick', 'claws', 'reach', 'hunter', 'ambush', 'frenzy', 'glassCannon', 'heavyMuscle', 'overclock', 'crit'];
const DEFENCE = ['armor', 'heart', 'scavenger', 'feathers', 'guard', 'thick', 'legs', 'regen'];

function rng(seed) { let x = seed >>> 0; return () => { x += 0x6D2B79F5; let t = Math.imul(x ^ x >>> 15, 1 | x); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const quant = (arr, q) => { const a = arr.filter(v => v !== null && v !== undefined && Number.isFinite(v)).sort((x, y) => x - y); if (!a.length) return null; const i = (a.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return +(a[lo] + (a[hi] - a[lo]) * (i - lo)).toFixed(2); };
const mean = arr => { const a = arr.filter(v => Number.isFinite(v)); return a.length ? +(a.reduce((s, v) => s + v, 0) / a.length).toFixed(2) : null; };

// ---------------------------------------------------------------- one run
// Exploiter (05 §5): the point on the lava/deep-water centre line nearest the boss, and its normal.
function bandPoint(map, p) {
  const pts = map.riverCurve || map.river || []; let best = null;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (len * len))), q = { x: a.x + t * dx, y: a.y + t * dy }, d = Math.hypot(p.x - q.x, p.y - q.y);
    if (!best || d < best.d) best = { d, q, n: { x: -dy / len, y: dx / len } };
  }
  return best;
}

// level: start at this journey level (0-based) via the game's own nextStage(); bossDuel: the boss spawns at once
// and the run ends when it dies (outcome 'boss_win'). Used by X10 and the B1 before/after comparisons.
function runOne(C, { species, style, seed, seconds, dt, upgrades, level = 0, bossDuel = false, open = false, across = false }) {
  const S = STYLES[style]; if (!S) throw Error('Unknown style ' + style);
  const R = rng(seed * 7919 + style.length * 104729);
  const g = new C.Game({ random: rng(seed ^ 0xABCDEF) });
  g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES);
  g.selectSpecies(species);
  Object.assign(g.save.upgrades, upgrades || {});
  g.start({ seed });
  const r = g.run, config = C.PLAYER_SPECIES[species];
  for (let i = 0; i < level && i < r.campaign.length - 1; i++) { g.phase = 'cleared'; r.bossDefeated = true; g.nextStage(); }
  const bandMap = { riverCurve: r.map.riverCurve, river: r.map.river };
  if (open) { r.map.river = []; r.map.riverCurve = []; r.map.lavaCrossings = []; } // control: same level without lava/river
  if (bossDuel) r.meat = Math.max(r.meat, g.currentLevel().target);
  let duelBoss = null;
  const m = {
    tFirstMutation: null, tFirstBossSpawn: null, tFirstBossKill: null, bossFights: [], levelTimes: [], tFinalLevel: null,
    epicRewards: 0, mutationPicks: 0, starvedTime: 0, combatTime: 0, staggers: 0, enemyAttacksInterrupted: 0,
    lowHPTime: 0, eatingTime: 0, idleTime: 0, stuckTime: 0,
  };
  let bossSpawnAt = null, levelStart = 0, decision = { x: 0, y: 0 }, nextDecision = 0, wall = 0, lastPos = { x: r.player.x, y: r.player.y }, stuckClock = 0;
  const wanderTarget = { x: r.player.x, y: r.player.y, until: 0 }, route = {};
  const prevStagger = new Map(), prevMode = new Map();
  const dist = e => Math.hypot(e.x - r.player.x, e.y - r.player.y);
  const nearest = items => { let best = null, bd = Infinity; for (const it of items) { const d = dist(it); if (d < bd) { bd = d; best = it; } } return best; };

  function steer(x, y) {
    // B1b: like a player, path around the lava to a basalt crossing (same nav grid as the bosses) instead of wading through.
    if (r.stage === 3 && C.NAV && (r.map.lavaCrossings || []).length && !C.NAV.navLineClear(r.stage, r.map, true, r.player, { x, y })) {
      const grid = C.NAV.navGrid(r.stage, r.map, true, r.player.radius), key = Math.floor(x / 64) + ',' + Math.floor(y / 64);
      if (!route.flow || route.key !== key || r.seconds - route.at > 1) Object.assign(route, { key, at: r.seconds, flow: C.NAV.navFlow(r.stage, r.map, grid, true, { x, y }) });
      const next = C.NAV.navStep(r.stage, r.map, true, grid, route.flow, r.player);
      if (next && next.steps > 0) { x = next.x; y = next.y; }
    }
    let dx = x - r.player.x, dy = y - r.player.y; const n = Math.hypot(dx, dy); if (n < 2) return { x: 0, y: 0 };
    dx /= n; dy /= n;
    const blocked = (vx, vy) => r.map.rocks.some(rock => Math.hypot(r.player.x + vx * 50 - rock.x, r.player.y + vy * 50 - rock.y) < r.player.radius + rock.radius + 8);
    if (blocked(dx, dy)) for (const a of [0.8, -0.8, 1.5, -1.5, 2.5]) { const vx = dx * Math.cos(a) - dy * Math.sin(a), vy = dx * Math.sin(a) + dy * Math.cos(a); if (!blocked(vx, vy)) return { x: vx, y: vy }; }
    return { x: dx, y: dy };
  }

  function pickMutation() {
    const picks = r.choices.map(id => C.MUTATIONS.find(x => x.id === id));
    let choice;
    if (S.picks === 'random') choice = picks[Math.floor(R() * picks.length)];
    else if (S.picks === 'offence') choice = picks.find(p => OFFENCE.includes(p.id)) || picks[0];
    else if (S.picks === 'defence') choice = picks.find(p => DEFENCE.includes(p.id)) || picks[0];
    else if (S.picks === 'mixed') choice = R() < 0.5 ? picks[Math.floor(R() * picks.length)] : (picks.find(p => OFFENCE.includes(p.id) || DEFENCE.includes(p.id)) || picks[0]);
    else { // best: rarity first, then known strong ids
      const order = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
      choice = picks.slice().sort((a, b) => (order[b.rarity] || 0) - (order[a.rarity] || 0) || (OFFENCE.concat(DEFENCE).includes(b.id) ? 1 : 0) - (OFFENCE.concat(DEFENCE).includes(a.id) ? 1 : 0))[0];
    }
    if (r.rareSelection) m.epicRewards++;
    m.mutationPicks++;
    if (m.tFirstMutation === null) m.tFirstMutation = r.seconds;
    g.choose(choice.id);
  }

  function decide() {
    const p = r.player, hpFrac = r.health / r.maxHealth, cost = C.abilityCost(r);
    const hostile = r.enemies.filter(e => e.damage && e.alert && dist(e) < 260);
    const warning = nearest(r.enemies.filter(e => ['windup', 'charge', 'slam', 'bite'].includes(e.mode) && dist(e) < (e.attackRadius || 60) + 80));
    // Dodge telegraphed attacks like a player would: wait for the late, locked part of a boss
    // windup, then step out of the shape (sideways from a charge lane, outward from a circle).
    if (warning && R() < S.dodge) {
      const dx = p.x - warning.x, dy = p.y - warning.y, n = Math.hypot(dx, dy) || 1;
      const early = warning.mode === 'windup' && warning.boss && warning.timer > (warning.windupDuration || 1) * .55 && warning.pattern === 0 && !warning.spin && S.dodge > .5;
      let tx, ty;
      if (warning.pattern >= 2 || warning.spin) { tx = warning.x + dx / n * ((warning.attackRadius || 100) + 60); ty = warning.y + dy / n * ((warning.attackRadius || 100) + 60); }
      else { const cx = warning.chargeX || dx / n, cy = warning.chargeY || dy / n, side = ((-cy) * dx + cx * dy) >= 0 ? 1 : -1; tx = p.x - cy * 140 * side; ty = p.y + cx * 140 * side; }
      if (!early) return { ...steer(tx, ty), attack: style !== 'newbie' && n < config.range + warning.radius, pounce: S.ability === 'smart' && r.stamina >= cost && ['deinonychus','velociraptor', 'utahraptor', 'compy', 'gallimimus'].includes(species) && warning.timer < .3 };
    }
    // Punish an exposed boss from behind.
    const exposed = nearest(r.enemies.filter(e => e.boss && ['recover', 'broken'].includes(e.mode) && dist(e) < 400));
    if (exposed && S.dodge > .3) {
      const bx = exposed.x - exposed.facingX * (exposed.radius + 20), by = exposed.y - exposed.facingY * (exposed.radius + 20);
      return { ...steer(bx, by), attack: dist(exposed) < config.range + exposed.radius + 10, pounce:species==='deinonychus'&&S.ability==='smart'&&r.stamina>=cost&&!r.precisionTime&&!r.pounceCooldown };
    }
    // Retreat when hurt
    if (S.retreatHP && hpFrac < S.retreatHP && hostile.length) {
      const t = nearest(hostile), dx = p.x - t.x, dy = p.y - t.y, n = Math.hypot(dx, dy) || 1;
      return { ...steer(p.x + dx / n * 200, p.y + dy / n * 200), sneak: S.sneak };
    }
    const boss = nearest(r.enemies.filter(e => e.boss));
    // Exploiter: stand across lava (or deep water for non-swimming bosses) from the boss and only attack from there.
    if (S.exploit && boss && (r.stage === 3 || r.stage === 1 && !C.canSwim(boss))) {
      const band = bandPoint(r.map, boss);
      if (band && band.d < 700) {
        const side = ((boss.x - band.q.x) * band.n.x + (boss.y - band.q.y) * band.n.y) >= 0 ? -1 : 1, spot = { x: band.q.x + band.n.x * side * 70, y: band.q.y + band.n.y * side * 70 };
        const there = Math.hypot(spot.x - p.x, spot.y - p.y) < 24;
        return { ...(there ? { x: 0, y: 0 } : steer(spot.x, spot.y)), attack: there && dist(boss) < config.range + boss.radius + 20, pounce: there && ['ankylosaurus', 'tyrannosaurus'].includes(species) && dist(boss) < 140 && r.stamina >= cost };
      }
    }
    // Food
    const diet = config.diet, foods = [];
    if (diet === 'herbivore' || diet === 'omnivore') foods.push(...r.map.forage.filter(f => !f.depleted));
    if (diet === 'piscivore') foods.push(...r.map.fishSchools.filter(f => f.stock > 0));
    if (diet !== 'herbivore') foods.push(...r.pickups.filter(f => f.corpseId !== undefined));
    const food = nearest(foods);
    const hungry = !boss || hpFrac < 0.5;
    if (food && hungry && (!hostile.length || dist(food) < 100 || R() < S.foodGreed * 0.1)) {
      if (dist(food) < 42) return { eat: true };
      return steer(food.x, food.y);
    }
    // Pick up DNA/heal pickups
    const loot = nearest(r.pickups.filter(f => f.corpseId === undefined && dist(f) < 300));
    if (loot) return steer(loot.x, loot.y);
    // Explore sites
    if (S.explore && !boss) {
      const site = nearest(r.map.sites.filter(s => !s.claimed && s.type !== 'rare' && s.discovered));
      if (site && dist(site) < 900) { if (dist(site) < 60) return { interact: true }; return steer(site.x, site.y); }
    }
    // Fight
    const prey = r.enemies.filter(e => !e.guard || style === 'brawler');
    const target = boss || nearest(prey.filter(e => dist(e) < 900)) || nearest(prey);
    if (target) {
      const aim = S.aimError ? { x: target.x + (R() - .5) * S.aimError, y: target.y + (R() - .5) * S.aimError } : target;
      const inRange = dist(target) < config.range + target.radius - 10;
      let pounce = false;
      if (S.ability === 'spam') pounce = r.stamina >= cost;
      else if (S.ability === 'smart') pounce = r.stamina >= cost && (inRange ? ['ankylosaurus', 'tyrannosaurus', 'deinosuchus'].includes(species) && hostile.length > 0 : dist(target) < 170 && r.stamina > 60);
      else if (S.ability === 'sometimes') pounce = r.stamina >= cost && R() < 0.15;
      return { ...steer(aim.x, aim.y), attack: inRange || dist(target) < config.range + 40, pounce };
    }
    // Wander to unexplored ground
    if (r.seconds > wanderTarget.until || Math.hypot(wanderTarget.x - p.x, wanderTarget.y - p.y) < 60) {
      wanderTarget.x = 120 + R() * (r.map.width - 240); wanderTarget.y = 140 + R() * (r.map.height - 280); wanderTarget.until = r.seconds + 12;
    }
    return steer(wanderTarget.x, wanderTarget.y);
  }

  let safety = 0;
  while (wall < seconds && g.phase !== 'result') {
    if (++safety > seconds / dt * 4) break;
    if (g.phase === 'mutation') { pickMutation(); continue; }
    if (g.phase === 'exploration') { g.explore(true); continue; }
    if (g.phase === 'cleared') {
      m.levelTimes.push(+(r.seconds - levelStart).toFixed(2));
      if (!g.nextStage()) break;
      levelStart = r.seconds; if (r.levelIndex === r.campaign.length - 1 && m.tFinalLevel === null) m.tFinalLevel = r.seconds;
      continue;
    }
    if (g.phase !== 'playing') break;
    if (wall >= nextDecision) { decision = decide(); nextDecision = wall + S.reaction * (0.7 + R() * 0.6); }
    const input = { ...decision };
    if (decision.eat) input.eat = true;
    const before = { x: r.player.x, y: r.player.y };
    g.step(dt, input);
    if (decision.interact || decision.pounce) decision = { ...decision, interact: false, pounce: false };
    if (bossDuel && !duelBoss && (duelBoss = r.enemies.find(e => e.boss) || null) && across) {
      // X2: boss 120 px on one side of the (original) lava line, player 200 px on the other, same geometry with open: true.
      const band = bandPoint(bandMap, duelBoss), side = ((duelBoss.x - band.q.x) * band.n.x + (duelBoss.y - band.q.y) * band.n.y) >= 0 ? 1 : -1;
      Object.assign(duelBoss, { x: band.q.x + band.n.x * side * 120, y: band.q.y + band.n.y * side * 120 });
      Object.assign(r.player, { x: band.q.x - band.n.x * side * 200, y: band.q.y - band.n.y * side * 200 });
    }
    for (const ev of g.drainEvents()) {
      if (ev.type === 'boss') { bossSpawnAt = r.seconds; if (m.tFirstBossSpawn === null) m.tFirstBossSpawn = r.seconds; }
      if (ev.type === 'boss_dead' && bossDuel) m.duelWon = true;
      if (ev.type === 'boss_dead') { if (m.tFirstBossKill === null) m.tFirstBossKill = r.seconds; if (bossSpawnAt !== null) m.bossFights.push(+(r.seconds - bossSpawnAt).toFixed(2)); bossSpawnAt = null; }
    }
    // Telemetry sampled every step
    const inCombat = r.enemies.some(e => e.alert && e.damage && dist(e) < 400);
    if (inCombat) { m.combatTime += dt; if (r.stamina < C.abilityCost(r)) m.starvedTime += dt; }
    if (r.health / r.maxHealth < 0.25) m.lowHPTime += dt;
    if (r.eating) m.eatingTime += dt;
    if (Math.hypot(r.player.x - before.x, r.player.y - before.y) < 0.01 && (input.x || input.y)) { stuckClock += dt; if (stuckClock > 1) m.stuckTime += dt; } else stuckClock = 0;
    for (const e of r.enemies) {
      const ps = prevStagger.get(e.id) || 0; if ((e.stagger || 0) > 0 && ps === 0) { m.staggers++; if (['windup', 'recover'].includes(e.mode) && prevMode.get(e.id) === 'windup') m.enemyAttacksInterrupted++; }
      prevStagger.set(e.id, e.stagger || 0); prevMode.set(e.id, e.mode);
    }
    wall += dt;
    if (m.duelWon) break;
  }
  const st = r.stats, minutes = Math.max(r.seconds / 60, 1e-6);
  return {
    species, style, seed,
    bossHpLostPct: duelBoss ? +(100 * (duelBoss.maxHP - Math.max(0, m.duelWon ? 0 : duelBoss.hp)) / duelBoss.maxHP).toFixed(1) : null,
    outcome: m.duelWon ? 'boss_win' : r.result?.victory ? 'victory' : r.result ? 'death' : 'timeout',
    killedBy: r.result && !r.result.victory ? (r.lastHit?.kind || 'unknown') : null,
    seconds: +r.seconds.toFixed(1), levelReached: r.levelIndex + 1, levelsTotal: r.campaign.length, biome: r.stage,
    tFirstMutation: m.tFirstMutation, tFirstBossSpawn: m.tFirstBossSpawn, tFirstBossKill: m.tFirstBossKill,
    bossFightSeconds: m.bossFights, meanBossFight: mean(m.bossFights), bossesKilled: r.bosses,
    levelTimes: m.levelTimes, tFinalLevel: m.tFinalLevel,
    meat: r.totalMeat, dna: r.dna, kills: r.kills, eliteKills: r.eliteKills, playerLevel: r.level,
    mutationPicks: m.mutationPicks, epicRewards: m.epicRewards,
    attacks: st.attacks, landedAttacks: st.landedAttacks, accuracyPct: st.attacks ? +(100 * st.landedAttacks / st.attacks).toFixed(1) : 0,
    finteHits:st.finteHits||0, abilities: st.abilities, abilitiesPerMin: +(st.abilities / minutes).toFixed(2), staminaSpent: Math.round(st.staminaSpent),
    staminaStarvedPctOfCombat: m.combatTime ? +(100 * m.starvedTime / m.combatTime).toFixed(1) : 0,
    combatPct: +(100 * m.combatTime / Math.max(r.seconds, 1e-6)).toFixed(1),
    damageTaken: Math.round(st.damageTaken), damageDealt: Math.round(st.damageDealt), healing: Math.round(st.healing),
    staggersPerMin: +(m.staggers / minutes).toFixed(2), enemyAttacksInterrupted: m.enemyAttacksInterrupted,
    lowHPPct: +(100 * m.lowHPTime / Math.max(r.seconds, 1e-6)).toFixed(1), eatingPct: +(100 * m.eatingTime / Math.max(r.seconds, 1e-6)).toFixed(1),
    stuckSeconds: +m.stuckTime.toFixed(1), plantsEaten: st.plantsEaten, fishCaught: st.fishCaught, exploration: r.exploration,
    distanceKm: +(st.distance / 1000).toFixed(2), mutations: Object.fromEntries(Object.entries(r.mutations).filter(([, v]) => v)),
  };
}

// ---------------------------------------------------------------- summary
const KEYS = ['seconds', 'levelReached', 'tFirstMutation', 'tFirstBossSpawn', 'tFirstBossKill', 'meanBossFight', 'tFinalLevel', 'meat', 'dna', 'kills', 'attacks', 'accuracyPct', 'abilitiesPerMin', 'staminaStarvedPctOfCombat', 'damageTaken', 'staggersPerMin', 'lowHPPct', 'eatingPct', 'stuckSeconds', 'epicRewards'];
function summarize(rows) {
  const groups = new Map();
  for (const row of rows) { const k = row.species + '|' + row.style; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(row); }
  return [...groups.entries()].map(([k, items]) => {
    const [species, style] = k.split('|'), n = items.length;
    const out = { species, style, runs: n, victories: items.filter(r => r.outcome === 'victory').length, deaths: items.filter(r => r.outcome === 'death').length, timeouts: items.filter(r => r.outcome === 'timeout').length };
    for (const key of KEYS) { const vals = items.map(r => r[key]); out[key + '_p50'] = quant(vals, .5); out[key + '_p25'] = quant(vals, .25); out[key + '_p75'] = quant(vals, .75); out[key + '_reached'] = vals.filter(v => v !== null && v !== undefined).length; }
    const killers = {}; for (const r of items) if (r.killedBy) killers[r.killedBy] = (killers[r.killedBy] || 0) + 1;
    out.topKillers = Object.entries(killers).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([kk, v]) => kk + ':' + v).join(' ');
    return out;
  });
}

function warnings(summary, C) {
  const w = [];
  for (const s of summary) {
    const tag = `${s.species}/${s.style}`;
    if (s.staminaStarvedPctOfCombat_p50 !== null && s.staminaStarvedPctOfCombat_p50 < 10 && ['optimizer', 'brawler'].includes(s.style)) w.push(`${tag}: stamina er næsten aldrig en begrænsning i kamp (${s.staminaStarvedPctOfCombat_p50} % af kamptiden under evne-pris) – "uendelig stamina"-følelsen.`);
    if (s.staggersPerMin_p50 > 8) w.push(`${tag}: ${s.staggersPerMin_p50} staggers/min – fjender stunlåses sandsynligvis.`);
    if (s.tFirstMutation_p50 !== null && s.tFirstMutation_p50 < 25) w.push(`${tag}: første mutation allerede efter ${s.tFirstMutation_p50}s.`);
    if (s.tFirstMutation_p50 !== null && s.tFirstMutation_p50 > 120) w.push(`${tag}: første mutation først efter ${s.tFirstMutation_p50}s – føles langsomt.`);
    if (s.runs >= 5 && s.deaths / s.runs > .85 && s.style !== 'newbie') w.push(`${tag}: dør i ${Math.round(100 * s.deaths / s.runs)} % af forsøgene.`);
    if (s.runs >= 5 && s.victories / s.runs > .6 && ['casual', 'newbie'].includes(s.style)) w.push(`${tag}: ${Math.round(100 * s.victories / s.runs)} % sejre selv for ${s.style} – for let?`);
    if (s.meanBossFight_p50 !== null && s.meanBossFight_p50 < 8) w.push(`${tag}: bosskampe varer kun ${s.meanBossFight_p50}s (median).`);
    if (s.stuckSeconds_p50 > 10) w.push(`${tag}: botten sidder fast ${s.stuckSeconds_p50}s pr. run – tjek kollision/kort.`);
  }
  // Unlock pacing
  const dnaBy = {}; for (const s of summary) if (s.dna_p50 !== null) (dnaBy[s.style] ||= []).push(s.dna_p50);
  const prices = Object.values(C.PLAYER_SPECIES).map(p => p.cost || 0), totalUnlock = prices.reduce((a, b) => a + b, 0);
  for (const [style, list] of Object.entries(dnaBy)) { const per = mean(list); if (per) w.push(`Unlock-tempo (${style}): ~${per} DNA pr. run → DNA-købte arter (${totalUnlock} DNA; øvrige kræver achievements) efter ~${Math.ceil(totalUnlock / per)} runs (uden upgrades).`); }
  return w;
}

function fmt(v) { return v === null || v === undefined ? '–' : v; }
function writeReport(out, meta, summary, warns) {
  const lines = [`# PRIMAL RUN – spillestil-simulering`, '', `Kørt: ${meta.date} · core.js SHA ${meta.coreSHA.slice(0, 12)} · ${meta.totalRuns} runs · ${meta.seconds}s sim-budget pr. run · ${meta.workers} CPU-tråde · ${meta.elapsed}s`, '',
    '> Bots er ikke mennesker. Brug tallene til at sammenligne arter/spillestile med hinanden – ikke som præcise sværhedsgrader.', '', '## Automatiske advarsler', ''];
  if (!warns.length) lines.push('Ingen.'); else for (const w of warns) lines.push('- ' + w);
  lines.push('', '## Resultater (median, [p25–p75])', '');
  const cols = [['runs', 'Runs'], ['victories', 'Sejre'], ['deaths', 'Død'], ['levelReached', 'Bane nået'], ['tFirstMutation', '1. mutation (s)'], ['tFirstBossSpawn', '1. boss (s)'], ['tFirstBossKill', '1. boss død (s)'], ['meanBossFight', 'Bosskamp (s)'], ['tFinalLevel', 'Sidste bane (s)'], ['meat', 'Kød'], ['dna', 'DNA'], ['attacks', 'Angreb'], ['abilitiesPerMin', 'Evner/min'], ['staminaStarvedPctOfCombat', 'Stamina-mangel % kamp'], ['staggersPerMin', 'Stagger/min'], ['damageTaken', 'Skade taget']];
  lines.push('| Art | Stil | ' + cols.map(c => c[1]).join(' | ') + ' | Dræbt af |');
  lines.push('|---|---|' + cols.map(() => '---:').join('|') + '|---|');
  for (const s of summary.sort((a, b) => a.species.localeCompare(b.species) || a.style.localeCompare(b.style))) {
    lines.push(`| ${s.species} | ${s.style} | ` + cols.map(([k]) => s[k] !== undefined ? s[k] : (s[k + '_p50'] === null ? `– (0/${s.runs})` : `${fmt(s[k + '_p50'])} [${fmt(s[k + '_p25'])}–${fmt(s[k + '_p75'])}]` + (s[k + '_reached'] < s.runs ? ` (${s[k + '_reached']}/${s.runs})` : ''))).join(' | ') + ` | ${s.topKillers || ''} |`);
  }
  lines.push('', '(n/m) betyder at kun n af m runs nåede dertil.', '', 'Spillestile:', '');
  for (const [id, s] of Object.entries(STYLES)) lines.push(`- **${id}** – ${s.label}: reaktion ${s.reaction}s, undvigelse ${Math.round(s.dodge * 100)} %, evnebrug "${s.ability}", mutationsvalg "${s.picks}"${s.explore ? ', udforsker' : ''}.`);
  fs.writeFileSync(path.join(out, 'REPORT.md'), lines.join('\n') + '\n');
}

// ---------------------------------------------------------------- worker
if (!isMainThread) {
  const C = require(CORE_PATH);
  const rows = [];
  for (const job of workerData.jobs) {
    try { rows.push(runOne(C, job)); } catch (e) { rows.push({ species: job.species, style: job.style, seed: job.seed, outcome: 'error', error: String(e && e.stack || e) }); }
    parentPort.postMessage({ progress: 1 });
  }
  parentPort.postMessage({ rows });
  return;
}

// ---------------------------------------------------------------- main
function args() {
  const a = process.argv.slice(2), get = (k, d) => { const i = a.indexOf('--' + k); return i < 0 ? d : a[i + 1]; };
  return { help: a.includes('--help'), quick: a.includes('--quick'), get };
}
async function main() {
  const { help, quick, get } = args();
  if (help) {
    console.log(`PRIMAL RUN play-style simulator\n\n  --runs N         seeds per species×style (default 20, --quick: 3)\n  --seconds N      simulated seconds per run (default 1500)\n  --species a,b    default: all playable\n  --styles a,b     ${Object.keys(STYLES).join(', ')} (default: all)\n  --threads N      default: CPU cores - 1\n  --seed N         first seed (default 1000)\n  --out DIR        default balance_runs/playstyle_<date>\n  --upgrades JSON  DNA start upgrades, e.g. '{"health":2}'\n  --quick          small smoke test`);
    return;
  }
  const C = require(CORE_PATH);
  const runs = Number(get('runs', quick ? 3 : 20)), seconds = Number(get('seconds', quick ? 600 : 1500)), firstSeed = Number(get('seed', 1000));
  const species = get('species', 'all') === 'all' ? Object.keys(C.PLAYER_SPECIES) : get('species').split(',');
  const styles = get('styles', 'all') === 'all' ? Object.keys(STYLES) : get('styles').split(',');
  for (const s of species) if (!C.PLAYER_SPECIES[s]) throw Error('Ukendt art: ' + s);
  for (const s of styles) if (!STYLES[s]) throw Error('Ukendt stil: ' + s);
  const upgrades = JSON.parse(get('upgrades', '{}'));
  const threads = Math.max(1, Math.min(Number(get('threads', Math.max(1, os.cpus().length - 1))), 64));
  const date = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const out = path.resolve(get('out', path.join(__dirname, '../PRIMAL_RUN_Game/balance_runs/playstyle_' + date)));
  fs.mkdirSync(out, { recursive: true });
  const jobs = [];
  for (const sp of species) for (const st of styles) for (let i = 0; i < runs; i++) jobs.push({ species: sp, style: st, seed: firstSeed + i, seconds, dt: 1 / 30, upgrades });
  // interleave so every worker gets a mix of slow and fast species
  const buckets = Array.from({ length: threads }, () => []); jobs.forEach((j, i) => buckets[i % threads].push(j));
  const t0 = Date.now(); let done = 0;
  console.error(`Kører ${jobs.length} runs på ${threads} tråde → ${out}`);
  const results = await Promise.all(buckets.filter(b => b.length).map(bucket => new Promise((resolve, reject) => {
    const w = new Worker(__filename, { workerData: { jobs: bucket } });
    w.on('message', msg => { if (msg.progress) { done++; if (done % Math.max(1, Math.floor(jobs.length / 20)) === 0 || done === jobs.length) process.stderr.write(`\r  ${done}/${jobs.length} (${Math.round(100 * done / jobs.length)} %) · ${Math.round((Date.now() - t0) / 1000)}s   `); } if (msg.rows) resolve(msg.rows); });
    w.on('error', reject);
  })));
  process.stderr.write('\n');
  const rows = results.flat(), errors = rows.filter(r => r.outcome === 'error'), ok = rows.filter(r => r.outcome !== 'error');
  fs.writeFileSync(path.join(out, 'runs.jsonl'), rows.map(r => JSON.stringify(r)).join('\n') + '\n');
  const summary = summarize(ok), warns = warnings(summary, C);
  if (errors.length) warns.unshift(`${errors.length} runs fejlede med en JavaScript-fejl (se runs.jsonl, outcome "error") – det kan være samme fejl som får spillet til at låse!`);
  const coreSHA = crypto.createHash('sha256').update(fs.readFileSync(CORE_PATH)).digest('hex');
  const meta = { policy:'six playstyles v2; Deinonychus defensive finte and exposed-boss opportunity', simulatorSHA:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'), date: new Date().toISOString(), coreSHA, totalRuns: rows.length, seconds, workers: threads, elapsed: Math.round((Date.now() - t0) / 1000), runsPerGroup: runs, species, styles, upgrades };
  const cols = Object.keys(summary[0] || {});
  fs.writeFileSync(path.join(out, 'summary.csv'), cols.join(',') + '\n' + summary.map(s => cols.map(c => JSON.stringify(s[c] ?? '')).join(',')).join('\n') + '\n');
  writeReport(out, meta, summary, warns);
  const compact = { meta, warnings: warns, errors: [...new Set(errors.map(e => e.error.split('\n').slice(0, 2).join(' ')))].slice(0, 5), groups: summary.map(s => ({ g: s.species + '/' + s.style, n: s.runs, win: s.victories, die: s.deaths, lvl: s.levelReached_p50, mut1: s.tFirstMutation_p50, boss1: s.tFirstBossSpawn_p50, bossKill1: s.tFirstBossKill_p50, bossFight: s.meanBossFight_p50, final: s.tFinalLevel_p50, meat: s.meat_p50, dna: s.dna_p50, atk: s.attacks_p50, abil: s.abilitiesPerMin_p50, starved: s.staminaStarvedPctOfCombat_p50, stag: s.staggersPerMin_p50, dmgIn: s.damageTaken_p50, killers: s.topKillers })) };
  fs.writeFileSync(path.join(out, 'summary_compact.json'), JSON.stringify(compact));
  console.log(`\nFærdig på ${meta.elapsed}s. Åbn ${path.join(out, 'REPORT.md')}\nSend summary_compact.json til Claude (${Math.round(fs.statSync(path.join(out, 'summary_compact.json')).size / 1024)} KB).`);
  if (warns.length) console.log('\nAdvarsler:\n- ' + warns.join('\n- '));
}
if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { runOne, summarize, STYLES };
