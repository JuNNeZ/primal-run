#!/usr/bin/env node
'use strict';
/**
 * Q14: run-title distribution over seeded bot runs (03_RUN_REPORT_AND_TITLES.md §4).
 * Reuses the play-style bots from tools/playstyle_sim.cjs and the real pickTitles() in the shared core.
 * Target: no non-fallback title is primary in > 25 % of finished runs, fallback < 10 %.
 *   node tools/title_distribution.cjs [--runs 3] [--seconds 900] [--out file.json]
 * Bot results are not human playtests; timeouts (no death/victory) are reported but not titled.
 */
const path = require('path'), fs = require('fs');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const { runOne, STYLES } = require('./playstyle_sim.cjs');
const a = process.argv.slice(2), get = (k, d) => { const i = a.indexOf('--' + k); return i < 0 ? d : a[i + 1]; };
const runs = +get('runs', 3), seconds = +get('seconds', 900);
const finished = [];
const finish = C.Game.prototype.finish;
C.Game.prototype.finish = function (victory) { const out = finish.call(this, victory); if (this.run && this.run.titles) finished.push({ ...this.run.titles, victory: !!victory }); return out; };
let total = 0;
for (const species of Object.keys(C.PLAYER_SPECIES)) for (const style of Object.keys(STYLES)) for (let i = 0; i < runs; i++) {
  total++; runOne(C, { species, style, seed: 1000 + i * 97 + species.length * 13, seconds, dt: 1 / 30, upgrades: {} });
}
const count = {}; for (const f of finished) count[f.primary] = (count[f.primary] || 0) + 1;
const share = Object.fromEntries(Object.entries(count).sort((x, y) => y[1] - x[1]).map(([k, v]) => [k, +(100 * v / Math.max(1, finished.length)).toFixed(1)]));
const top = Object.entries(share).find(([k]) => k !== 'new_branch') || ['-', 0], fallback = share.new_branch || 0;
const report = { date: new Date().toISOString(), runs: total, titled: finished.length, timeouts: total - finished.length, seconds, distinctPrimaries: Object.keys(count).length,
  maxNonFallback: { id: top[0], pct: top[1] }, fallbackPct: fallback, pass: top[1] <= 25 && fallback < 10, primaryShare: share };
const out = get('out', null); if (out) fs.writeFileSync(path.resolve(out), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
