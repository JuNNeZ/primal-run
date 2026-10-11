#!/usr/bin/env node
'use strict';
/*
 * Boss duel matrix: every playable species 1v1 against every journey boss (no other animals), with the number of
 * mutations a player typically has when that level starts, chosen by each play style's own pick policy.
 *   node tools/boss_duel_matrix.cjs [--seeds 10] [--styles optimizer,average,casual] [--survey-seeds 6]
 *        [--picks 0,2,4,...] [--set '<json>'] [--threads N] [--out file.json]
 * Step 1 (unless --picks is given) surveys ordinary runs to find the median mutation count at each level start.
 * Step 2 runs the duels. Bots are not humans: compare species and bosses with each other, not as exact difficulty.
 */
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const CORE = path.resolve(process.env.PRIMAL_CORE || path.join(__dirname, '../PRIMAL_RUN_Game/src/core.js'));
const merge = (to, from) => { for (const [k, v] of Object.entries(from || {})) if (v && typeof v === 'object' && !Array.isArray(v) && to[k] && typeof to[k] === 'object') merge(to[k], v); else to[k] = v; };

if (!isMainThread) {
  const C = require(CORE); merge(C, workerData.set);
  const { runOne } = require('./playstyle_sim.cjs');
  const rows = [];
  for (const job of workerData.jobs) {
    try { const o = runOne(C, job); rows.push({ ...job, outcome: o.outcome, bossHpLostPct: o.bossHpLostPct, damageTaken: o.damageTaken, seconds: o.seconds, levelPicks: o.levelPicks }); }
    catch (e) { rows.push({ ...job, outcome: 'error', error: String(e && e.stack || e) }); }
    parentPort.postMessage({ progress: 1 });
  }
  parentPort.postMessage({ rows });
  return;
}

const a = process.argv.slice(2), get = (k, d) => { const i = a.indexOf('--' + k); return i < 0 ? d : a[i + 1]; };
const C = require(CORE), set = JSON.parse(get('set', '{}')); merge(C, set);
const threads = Math.max(1, Number(get('threads', Math.max(1, os.cpus().length - 1))));
const species = get('species', 'all') === 'all' ? Object.keys(C.PLAYER_SPECIES) : get('species').split(',');
const styles = get('styles', 'optimizer,average,casual').split(','), seeds = Number(get('seeds', 10));
const upgrades = JSON.parse(get('upgrades', '{}')); // DNA-lab ranks, e.g. {"health":5,"damage":5,"regen":5,"digestion":5,"magnet":5}
const median = arr => { const s = arr.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };

function pool(jobs) {
  const buckets = Array.from({ length: threads }, () => []); jobs.forEach((j, i) => buckets[i % threads].push(j));
  let done = 0;
  return Promise.all(buckets.filter(b => b.length).map(bucket => new Promise((resolve, reject) => {
    const w = new Worker(__filename, { workerData: { jobs: bucket, set } });
    w.on('message', m => { if (m.progress) { if (++done % 50 === 0) process.stderr.write(`\r  ${done}/${jobs.length}`); } else resolve(m.rows); });
    w.on('error', reject);
  }))).then(r => { process.stderr.write('\n'); return r.flat(); });
}

(async () => {
  let picks = get('picks', null) ? get('picks').split(',').map(Number) : null, survey = null;
  if (!picks) {
    const jobs = [];
    for (const sp of species) for (const st of styles) for (let i = 0; i < Number(get('survey-seeds', 6)); i++) jobs.push({ species: sp, style: st, seed: 3000 + i, seconds: 900, dt: 1 / 30, upgrades });
    console.error(`Survey: ${jobs.length} ordinary runs`);
    const rows = (await pool(jobs)).filter(r => r.outcome !== 'error');
    // picks at the start of level L: 0 for level 1, else the count when level L-1 was cleared.
    survey = C.LEVELS.map((_, L) => { const v = L === 0 ? rows.map(() => 0) : rows.map(r => r.levelPicks && r.levelPicks[L - 1]).filter(x => x !== undefined); return { level: L + 1, samples: v.length, median: median(v) }; });
    // Few runs reach the late levels: extend the last well-sampled step linearly.
    picks = []; let last = null, step = 2;
    for (const s of survey) { if (s.samples >= 8) { if (last !== null && s.level > 1) step = Math.max(1, s.median - last); picks.push(s.median); last = s.median; } else { last = (last ?? 0) + step; picks.push(last); } }
  }
  console.error('Mutations at level start: ' + picks.join(','));
  const jobs = [];
  for (let L = 0; L < C.LEVELS.length; L++) for (const sp of species) for (const st of styles) for (let i = 0; i < seeds; i++)
    jobs.push({ species: sp, style: st, seed: 4000 + i, seconds: 240, dt: 1 / 30, level: L, bossDuel: true, alone: true, mutations: picks[L], upgrades });
  console.error(`Duels: ${jobs.length}`);
  const rows = await pool(jobs), ok = rows.filter(r => r.outcome !== 'error');
  const cell = list => ({ n: list.length, winPct: Math.round(100 * list.filter(r => r.outcome === 'boss_win').length / Math.max(1, list.length)), deathPct: Math.round(100 * list.filter(r => r.outcome === 'death').length / Math.max(1, list.length)), bossHpLostPct: Math.round(list.reduce((s, r) => s + (r.bossHpLostPct || 0), 0) / Math.max(1, list.length)) });
  const byBoss = C.LEVELS.map((lv, L) => ({ level: L + 1, boss: lv.bossName, mutations: picks[L], ...cell(ok.filter(r => r.level === L)) }));
  const matrix = species.map(sp => ({ species: sp, ...Object.fromEntries(C.LEVELS.map((_, L) => ['L' + (L + 1), cell(ok.filter(r => r.species === sp && r.level === L)).winPct])), all: cell(ok.filter(r => r.species === sp)).winPct }));
  const byStyle = styles.map(st => ({ style: st, ...Object.fromEntries(C.LEVELS.map((_, L) => ['L' + (L + 1), cell(ok.filter(r => r.style === st && r.level === L)).winPct])) }));
  const report = { date: new Date().toISOString(), set, upgrades, seeds, styles, picks, survey, errors: rows.length - ok.length, byBoss, matrix, byStyle };
  const out = get('out', null); if (out) fs.writeFileSync(path.resolve(out), JSON.stringify(report, null, 1) + '\n');
  console.table(byBoss); console.table(matrix);
})().catch(e => { console.error(e); process.exit(1); });
