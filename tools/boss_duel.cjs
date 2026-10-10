#!/usr/bin/env node
'use strict';
/**
 * Part B boss duels (05_BOSS_EXPLOIT_REVIEW X2/X10, PART_B_PLAN B1 acceptance). Uses the play-style bots from
 * tools/playstyle_sim.cjs against the real core; each boss starts at once (bossDuel) on its own journey level.
 *   node tools/boss_duel.cjs [--seeds 50] [--styles optimizer,exploiter] [--out balance_runs/<file>.json]
 * Per boss and style: wins (boss killed), deaths, mean boss HP lost and player damage taken, with the given
 * FEATURES flags on (candidate) and off (baseline: --off bossReach,lavaCrossings). Bots are not humans.
 */
const fs = require('node:fs'), path = require('node:path');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const { runOne } = require('./playstyle_sim.cjs');
const a = process.argv.slice(2), get = (k, d) => { const i = a.indexOf('--' + k); return i < 0 ? d : a[i + 1]; };
const seeds = +get('seeds', 20), styles = get('styles', 'optimizer,exploiter').split(','), off = get('off', '').split(',').filter(Boolean);
const levels = get('levels', '0,1,2,3,4,5,6,7').split(',').map(Number), species = get('species', 'carnotaurus'), seconds = +get('seconds', 200);
const across = a.includes('--across'), firstSeed = +get('seed', 2000);
function fight(flagsOff) {
  const saved = { ...C.FEATURES }; for (const k of flagsOff) C.FEATURES[k] = false;
  try {
    const rows = [];
    for (const level of levels) for (const style of styles) {
      let wins = 0, deaths = 0, lost = 0, damage = 0, time = 0;
      for (let i = 0; i < seeds; i++) {
        const o = runOne(C, { species, style, seed: firstSeed + i, seconds, dt: 1 / 30, level, bossDuel: true, across });
        wins += o.outcome === 'boss_win'; deaths += o.outcome === 'death'; lost += o.bossHpLostPct || 0; damage += o.damageTaken; time += o.seconds;
      }
      rows.push({ level: level + 1, boss: C.LEVELS[level].bossName, style, seeds, wins, deaths, bossHpLostPct: +(lost / seeds).toFixed(1), damageTaken: +(damage / seeds).toFixed(1), seconds: +(time / seeds).toFixed(1) });
    }
    return rows;
  } finally { Object.assign(C.FEATURES, saved); }
}
const report = { date: new Date().toISOString(), species, seeds, firstSeed, seconds, across, styles, flagsOffBaseline: off, candidate: fight([]) };
if (off.length) report.baseline = fight(off);
const out = get('out', null); if (out) fs.writeFileSync(path.resolve(out), JSON.stringify(report, null, 2) + '\n');
console.table((report.baseline || []).map(r => ({ ...r, run: 'baseline' })).concat(report.candidate.map(r => ({ ...r, run: 'candidate' }))));
