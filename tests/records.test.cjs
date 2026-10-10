'use strict';
// R-DIST, R-TRACK, R-RECORDS and R-REPORT (docs/design/records-world-extinction, QA matrix Q1–Q19).
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js'), R = C.RECORDS;
const NOW = new Date(2026, 9, 10, 12, 0, 0).getTime();

function setup(species = 'velociraptor', { level = 0, seed = 33, now = NOW } = {}) {
  const g = new C.Game({ random: () => .9 }); g.now = () => now;
  g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.selectSpecies(species); g.start({ seed });
  const r = g.run; r.levelIndex = level; r.stage = r.campaign[level].biome;
  Object.assign(r, { enemies: [], spawnTimer: 999 });
  Object.assign(r.map, { rocks: [], cover: [], mud: [], ponds: [], river: [], riverCurve: [], fords: [] });
  return g;
}
// Moves for `seconds`, turning before map edges so clamping never hides movement.
function run(g, seconds, input = { x: 1 }) {
  const r = g.run; let dir = input.x || 0;
  for (let t = 0; t < seconds; t += .02) {
    if (dir && (r.player.x > r.map.width - 300 || r.player.x < 300)) dir = r.player.x > r.map.width / 2 ? -1 : 1;
    r.health = r.maxHealth; r.stamina = 100; g.step(.02, dir ? { ...input, x: dir } : input);
  }
}
const kill = (g, source) => { g.run.invulnerable = 0; g.damage(99999, source); };
const records = g => g.save.records.allTime;

// ---- R-DIST --------------------------------------------------------------------------------------
test('Q16: 60 s of movement gives 3–13 m/s for every playable species', () => {
  for (const species of Object.keys(C.PLAYER_SPECIES)) {
    const g = setup(species); run(g, 60);
    const speed = R.metres(g.run.stats.distance) / 60;
    assert.ok(speed >= 3 && speed <= 13, species + ' ' + speed.toFixed(2) + ' m/s');
  }
});
test('Q17: idle, teleport and level transitions never add distance', () => {
  const g = setup(), r = g.run; run(g, 60, {}); assert.equal(r.stats.distance, 0);
  r.player.x += 500; r.player.y += 200; run(g, 1, {}); assert.equal(r.stats.distance, 0);
});
test('Q18: walking into a rock for 10 s adds less than one metre', () => {
  const g = setup(), r = g.run; r.map.rocks = [{ x: r.player.x + 40, y: r.player.y, radius: 22 }];
  for (let t = 0; t < 10; t += .02) { r.health = r.maxHealth; g.step(.02, { x: 1 }); }
  assert.ok(R.metres(r.stats.distance) < 1, R.metres(r.stats.distance) + ' m');
});
test('Q19: every level is 150–400 m wide at PX_PER_METER', () => {
  assert.equal(C.PX_PER_METER, 20);
  for (const [i, level] of C.LEVELS.entries()) { const w = C.createMap(level.biome, 1000 + i).width / C.PX_PER_METER; assert.ok(w >= 150 && w <= 400, level.name + ' ' + w); }
});
test('distances display as metres/km, are stored in pixels, and the Gallimimus unlock needs 10 km without revoking old unlocks', () => {
  assert.equal(C.formatDistance(0), '0 m'); assert.equal(C.formatDistance(17000), '850 m'); assert.equal(C.formatDistance(68000), '3,4 km');
  const marathon = C.ACHIEVEMENTS.find(a => a.id === 'marathon');
  assert.equal(marathon.text, 'Løb 10 km i alt.');
  assert.equal(marathon.check({ life: { distance: 20000 } }), false, 'old 20 000 px (1 km) no longer unlocks');
  assert.equal(marathon.check({ life: { distance: 200000 } }), true);
  const old = C.sanitizeSave({ version: 2, achievements: { marathon: 123 }, unlockedSpecies: ['gallimimus'], lifetime: { runs: 3, distance: 20000 } });
  assert.equal(old.achievements.marathon, 123); assert.ok(old.unlockedSpecies.includes('gallimimus')); assert.equal(old.lifetime.distance, 20000);
});

// ---- R-TRACK -------------------------------------------------------------------------------------
test('death by Karl records a journey boss id, the level, and increments S2 only (Q3)', () => {
  const g = setup('velociraptor', { level: 6 }), r = g.run; r.seconds = 300; r.stats.kills = 20; r.track.lastHitAt = 280; // otherwise Pacifist / Flawless stretch outrank the death title
  const karl = g.spawn('carnotaurus', { x: r.player.x + 60, y: r.player.y }, true); kill(g, karl);
  assert.equal(g.phase, 'result'); assert.equal(r.summary.deathCauseType, 'boss'); assert.equal(r.summary.deathBossId, 'carnotaurus@7');
  const a = records(g); assert.equal(a.deaths_karl.v, 1);
  for (const id of ['deaths_carl', 'deaths_palle', 'deaths_benny', 'deaths_doris', 'deaths_asta', 'deaths_tina', 'deaths_ragnar']) assert.equal(a[id].v, 0, id);
  assert.equal(r.titles.primary, 'karls_ashes');
});
test('classic and secret-seed bosses never count as named journey bosses', () => {
  const g = new C.Game({ random: () => .9 }); g.now = () => NOW; g.start({ seed: C.SECRET_SEED }); const r = g.run; r.enemies = []; r.seconds = 90;
  kill(g, g.spawn('pachycephalosaurus', { x: r.player.x + 60, y: r.player.y }, true));
  assert.equal(r.summary.deathBossId, 'secret:pachycephalosaurus'); assert.equal(records(g).deaths_palle.v, 0);
});
test('lava burns through the real step path are recorded as a lava death (Q4)', () => {
  const g = setup('velociraptor', { level: 7 }), r = g.run; r.seconds = 200;
  g.terrainAt = () => ({ kind: 'lava', speed: .7, cover: false, burn: true });
  r.health = 6; r.invulnerable = 0; for (let i = 0; i < 200 && g.phase === 'playing'; i++) g.step(.1, {});
  assert.equal(g.phase, 'result'); assert.equal(r.summary.deathCauseType, 'lava'); assert.ok(r.summary.lavaDamage > 0); assert.ok(r.summary.lavaSeconds > 0);
  assert.equal(records(g).deaths_lava.v, 1); assert.equal(records(g).deaths_environment.v, 1);
  assert.equal(r.lastHit, null, 'core still clears lastHit for the end scene');
});
test('abandoning counts as abandoned and defeat streak, not as a failed run (Q5)', () => {
  const g = setup(); g.run.seconds = 30; g.giveUp();
  const a = records(g); assert.equal(a.abandoned_runs.v, 1); assert.equal(a.defeat_streak.best, 1); assert.equal(a.failed_runs.v, 0);
  assert.equal(g.run.titles.primary, 'quitter'); assert.equal(g.run.summary.deathCauseType, 'abandon');
});
test('boss kills, attempts, no-hit kills, minibosses, mutations and terrain time are tracked once', () => {
  const g = setup('velociraptor', { level: 0 }), r = g.run;
  const boss = g.spawn('pachycephalosaurus', { x: r.player.x + 300, y: r.player.y }, true); boss.alert = true; boss.cooldown = 999;
  g.step(.02, {}); r.seconds += 20; g.kill(boss); g.kill(boss);
  const t = r.track; assert.equal(t.bossAttempts, 1); assert.equal(t.bossKills.length, 1); assert.equal(t.bossNoHitKills, 1); assert.equal(t.minibossKills, 1, 'Palle is a mini level boss');
  assert.ok(t.bossKills[0].seconds >= 19);
  const h = setup(), m = h.run; h.terrainAt = () => ({ kind: 'mud', speed: .75, cover: false }); for (let i = 0; i < 50; i++) { m.health = m.maxHealth; h.step(.02, {}); }
  assert.ok(Math.abs(m.track.mudSeconds - 1) < .05, String(m.track.mudSeconds));
  h.choose('nope'); assert.deepEqual(m.track.mutationLog, []);
});
test('Q9: an ecology hunt beside an idle player does not raise damageDealt', () => {
  const g = setup(), r = g.run;
  const hunter = g.spawn('carnotaurus', { x: r.player.x + 900, y: r.player.y + 600 }), prey = g.spawn('parasaurolophus', { x: r.player.x + 930, y: r.player.y + 600 });
  for (let i = 0; i < 1500; i++) { r.health = r.maxHealth; prey.hp -= .05; hunter.hp -= .01; g.step(.02, {}); }
  assert.equal(r.stats.damageDealt, 0); assert.equal(r.track.maxHitDamage, 0);
});

// ---- R-RECORDS -----------------------------------------------------------------------------------
function summary(over = {}) {
  return { species: 'velociraptor', diet: 'carnivore', victory: false, abandoned: false, seconds: 300, minutes: 5, levelReached: 3, campaign: 'journey', kills: 12,
    killsBySpecies: { compy: 5, parasaurolophus: 7 }, bosses: 1, albinos: 0, rivals: 0, herbivoreElites: 0, attacks: 50, landedAttacks: 30, crits: 3, abilities: 4, avoidedHits: 2,
    damageDealt: 400, damageTaken: 120, healing: 50, distancePx: 40000, distanceM: 2000, plantsEaten: 0, meatEaten: 10, fishCaught: 0, food: 20, dna: 15, mutationsTaken: 3,
    zonesFound: 6, exploration: 4, finteHits: 0, staminaSpent: 400, levelUps: 3, accuracy: .6, damageRatio: 400 / 120, hpLeftPct: 0, deathCauseType: 'enemy',
    deathCauseKind: 'carnotaurus', deathBossId: null, deathRival: false, killerIsCompy: false, killerDiet: 'carnivore', killerFleeing: false, minibossKills: 1, eliteKills: 0, rareKills: 0,
    bossAttempts: 2, bossNoHitKills: 0, bossCloseCalls: 0, fastestBossSeconds: 40, bossKills: [], maxHitDamage: 22, longestNoHitSeconds: 45, lowHpSeconds: 5, lavaDamage: 0,
    lavaSeconds: 0, deepWaterSeconds: 0, mudSeconds: 0, hiddenSeconds: 0, ambushKills: 0, abilityKills: 0, eventsClaimed: 1, sitesClaimed: 1, zonesAvailable: 15, explorationPct: 40,
    mutationLog: [], epicMutations: 0, achievementsThisRun: 0, rivalsSpawned: 2, score: 900, seed: 7, endedAt: NOW,
    foodStolen: null, secretsFound: null, secretLevel: null, secretEnding: null, nightKills: null, alliesRecruited: null, challengeCount: null, dailySeed: null, ...over };
}
function sequence(n) {
  const species = Object.keys(C.PLAYER_SPECIES);
  return Array.from({ length: n }, (_, i) => summary({ species: species[i % species.length], victory: i % 7 === 0, abandoned: i % 11 === 3, kills: (i * 37) % 90, seconds: 30 + (i * 53) % 1500,
    distanceM: (i * 911) % 15000, bosses: i % 9, deathBossId: i % 5 === 0 ? 'carnotaurus@7' : null, deathCauseType: i % 5 === 0 ? 'boss' : i % 13 === 0 ? 'lava' : 'enemy',
    killerIsCompy: i % 17 === 0, deathCauseKind: i % 17 === 0 ? 'compy' : 'carnotaurus', seed: i, endedAt: NOW + i * 3600 * 1000 }));
}
test('Q1: the same RunSummary sequence gives byte-identical records', () => {
  const play = () => sequence(200).reduce((rec, s) => R.applySummary(rec, s, R.pickTitles(s).primary.id), R.emptyRecords());
  assert.equal(JSON.stringify(play()), JSON.stringify(play()));
});
test('Q2: day, ISO week across new year and month roll over and archive the previous period', () => {
  const at = (y, m, d) => new Date(y, m, d, 12).getTime();
  assert.equal(R.weekKey(at(2026, 11, 28)), '2026-W53'); assert.equal(R.weekKey(at(2027, 0, 3)), '2026-W53'); assert.equal(R.weekKey(at(2027, 0, 4)), '2027-W01');
  assert.equal(R.weekKey(at(2025, 11, 29)), '2026-W01');
  let rec = R.applySummary(R.emptyRecords(), summary({ kills: 5, endedAt: at(2026, 11, 31) }));
  rec = R.applySummary(rec, summary({ kills: 3, endedAt: at(2027, 0, 1) }));
  assert.equal(rec.periods.day.key, '2027-01-01'); assert.equal(rec.periods.day.stats.total_kills.v, 3); assert.equal(rec.periods.day.previous.stats.total_kills.v, 5);
  assert.equal(rec.periods.month.key, '2027-01'); assert.equal(rec.periods.week.key, '2026-W53'); assert.equal(rec.periods.week.stats.total_kills.v, 8);
  assert.equal(rec.allTime.total_kills.v, 8);
  assert.deepEqual(R.scopeStats(rec, 'day', at(2027, 0, 2)), {}, 'stale period shows as empty');
});
test('best boards keep the earlier record on ties; least and eligibility rules hold', () => {
  let rec = R.applySummary(R.emptyRecords(), summary({ kills: 10, seed: 1 }));
  rec = R.applySummary(rec, summary({ kills: 10, seed: 2 })); assert.equal(rec.allTime.most_kills_run.ref.seed, 1);
  rec = R.applySummary(rec, summary({ attacks: 39, accuracy: 1 })); assert.equal(rec.allTime.best_accuracy.v, 60);
  assert.equal(rec.allTime.fastest_victory, undefined);
  rec = R.applySummary(rec, summary({ victory: true, seconds: 900 })); rec = R.applySummary(rec, summary({ victory: true, seconds: 800 }));
  assert.equal(rec.allTime.fastest_victory.v, 800); assert.equal(rec.allTime.defeat_streak.current, 0); assert.equal(rec.allTime.defeat_streak.best, 3);
});
test('embarrassment and nemesis follow the deterministic weights', () => {
  let rec = R.emptyRecords();
  for (const s of [summary({ deathCauseType: 'lava', deathCauseKind: null }), summary(), summary(), summary(), summary({ killerIsCompy: true, deathCauseKind: 'compy' })]) rec = R.applySummary(rec, s);
  const def = id => R.STATS.find(x => x.id === id);
  assert.equal(R.statValue(def('embarrassing_cause'), rec.allTime.embarrassing_cause).value, 'compy');
  assert.equal(R.statValue(def('nemesis'), rec.allTime.nemesis).value, 'carnotaurus');
});
test('Q6: v2 saves migrate to v3 with lifetime-seeded sums, "—" boards and no NaN', () => {
  const v2 = { version: 2, name: 'Jonas', dna: 40, unlockedSpecies: ['utahraptor'], achievements: { firstBlood: 1 }, lifetime: { runs: 9, kills: 140, bosses: 6, albinos: 2, victories: 1, distance: 104000 },
    scores: [{ name: 'Jonas', score: 5400, stage: 4, bosses: 3, seconds: 600, victory: false }] };
  const save = C.sanitizeSave(v2), a = save.records.allTime;
  assert.equal(save.version, 3); assert.ok(save.unlockedSpecies.includes('utahraptor')); assert.equal(save.achievements.firstBlood, 1);
  assert.deepEqual(a.total_kills, { v: 140, seeded: true }); assert.deepEqual(a.total_distance, { v: 5200, seeded: true }); assert.equal(a.highest_score.v, 5400);
  assert.equal(a.deaths_carl, undefined); assert.equal(R.statValue(R.STATS.find(x => x.id === 'deaths_carl'), a.deaths_carl), null);
  assert.ok(!JSON.stringify(save).includes('NaN') && !JSON.stringify(save).includes('null,null'));
  assert.deepEqual(C.sanitizeSave(JSON.parse(JSON.stringify(save))).records, save.records, 'v3 round-trips');
  const broken = C.sanitizeSave({ version: 3, records: { allTime: { total_kills: { v: 'x' }, most_kills_run: { v: 9, ref: 5 }, bogus: 1 }, recent: [{ t: 'x' }, { t: 1, kills: NaN }] }, titles: { quitter: { first: 'x', count: -1 }, nope: 1 } });
  assert.deepEqual(Object.keys(broken.records.allTime), ['most_kills_run']); assert.equal(broken.records.recent.length, 1); assert.deepEqual(broken.titles, {});
});
test('Q7: records + titles stay under 64 KB after 1000 runs', () => {
  let rec = R.emptyRecords(), titles = {};
  for (const s of sequence(1000)) { const p = R.pickTitles(s); titles = R.awardTitles(titles, p, '2026-10-10').titles; rec = R.applySummary(rec, s, p.primary.id); }
  const bytes = Buffer.byteLength(JSON.stringify(rec) + JSON.stringify(titles));
  assert.ok(bytes < 64 * 1024, bytes + ' bytes'); assert.equal(rec.recent.length, 50);
});
test('there are 29 Hall of Fame and 25 Hall of Shame statistics', () => {
  assert.equal(R.STATS.filter(x => x.board === 'fame').length, 29); assert.equal(R.STATS.filter(x => x.board === 'shame').length, 25);
  assert.equal(new Set(R.STAT_IDS).size, 54);
});

// ---- R-REPORT ------------------------------------------------------------------------------------
// Builds a summary that satisfies (or, with flip, breaks) a title condition clause by clause.
function fixture(t, flip) {
  const s = summary({ victory: false, abandoned: false, kills: 0, bosses: 0, attacks: 0, damageTaken: 0, damageDealt: 0, killsBySpecies: {}, deathCauseType: null, deathCauseKind: null,
    killerDiet: null, minibossKills: 0, bossAttempts: 0, fastestBossSeconds: 0, maxHitDamage: 0, longestNoHitSeconds: 0, lowHpSeconds: 0, seconds: 600, minutes: 10, distanceM: 1000,
    zonesFound: 0, explorationPct: 50, levelReached: 1, rivalsSpawned: 0, eventsClaimed: 0, sitesClaimed: 0, mutationsTaken: 0, dna: 0, staminaSpent: 0, abilities: 0, avoidedHits: 0,
    healing: 0, crits: 0, meatEaten: 0, plantsEaten: 0, fishCaught: 0, hpLeftPct: 0, secretsFound: 0, secretLevel: false, secretEnding: false, nightKills: 0, alliesRecruited: 0, challengeCount: 0, dailySeed: false });
  const clauses = t.condition.split('&&').map(x => x.trim());
  for (const pass of [0, 1]) clauses.forEach((c, i) => { // two passes: clauses may compare against variables set later
    const want = !(flip && i === clauses.length - 1); let m; // the flipped clause is applied last
    if (c === 'true') return;
    if ((m = /^(!?)s\.(\w+)$/.exec(c))) { s[m[2]] = m[1] ? !want : want; return; }
    if ((m = /^Object\.values\(s\.killsBySpecies\)\.filter\(n => n >= 3\)\.length >= (\d+)$/.exec(c))) { const n = +m[1] - (want ? 0 : 1); s.killsBySpecies = Object.fromEntries(Array.from({ length: n }, (_, k) => ['sp' + k, 3])); return; }
    if ((m = /^Object\.keys\(s\.killsBySpecies\)\.length >= (\d+)$/.exec(c))) { const n = +m[1] - (want ? 0 : 1); s.killsBySpecies = Object.fromEntries(Array.from({ length: n }, (_, k) => ['sp' + k, 1])); return; }
    if ((m = /^s\.eliteKills \+ s\.rareKills >= (\d+)$/.exec(c))) { s.eliteKills = +m[1] - (want ? 0 : 1); s.rareKills = 0; return; }
    if ((m = /^s\.kills - s\.bosses <= 0$/.exec(c))) { s.kills = s.bosses + (want ? 0 : 1); return; }
    if ((m = /^s\.(\w+) (>=|>|<=|<|===) s\.(\w+)$/.exec(c))) { const ok = m[2] === '<' || m[2] === '<=' ? -1 : 0; s[m[1]] = s[m[3]] + (want ? (m[2] === '>' ? 1 : ok) : (m[2] === '<' ? 1 : m[2] === '===' ? 1 : -1)); return; }
    if ((m = /^s\.(\w+) (>=|>|<=|<|===) (.+)$/.exec(c))) {
      const raw = m[3], v = /^'/.test(raw) ? raw.slice(1, -1) : Number(raw), op = m[2];
      if (typeof v === 'string') { s[m[1]] = want ? v : 'other'; return; }
      const step = Number.isInteger(v) ? 1 : .01;
      s[m[1]] = op === '>=' ? (want ? v : v - step) : op === '>' ? (want ? v + step : v) : op === '<' ? (want ? v - step : v) : op === '<=' ? (want ? v : v + step) : (want ? v : v + 1);
      if ((m[1] === 'accuracy' || m[1] === 'damageRatio') && !t.condition.includes('s.attacks')) { s.attacks = Math.max(s.attacks, 40); }
      return;
    }
    throw new Error('no fixture rule for ' + t.id + ': ' + c);
  });
  return s;
}
test('Q10: every one of the 96 title conditions has a satisfying and a failing fixture', () => {
  assert.equal(R.TITLES.length, 96);
  let checked = 0;
  for (const t of R.TITLES) {
    if (t.condition === 'true') { assert.equal(R.evalCondition(t, summary()), true); checked++; continue; }
    assert.equal(R.evalCondition(t, fixture(t, false)), true, t.id + ' true');
    assert.equal(R.evalCondition(t, fixture(t, true)), false, t.id + ' false');
    checked++;
  }
  assert.equal(checked, 96);
});
test('Q11: pickTitles is deterministic and independent of object key order', () => {
  const shuffle = o => Object.fromEntries(Object.entries(o).reverse());
  for (const s of sequence(60)) {
    const a = R.pickTitles(s), b = R.pickTitles(shuffle(s));
    assert.deepEqual([a.primary.id, ...a.secondary.map(x => x.id)], [b.primary.id, ...b.secondary.map(x => x.id)]);
  }
  const s = sequence(1)[0], first = JSON.stringify(R.pickTitles(s), (k, v) => typeof v === 'function' ? undefined : v);
  for (let i = 0; i < 1000; i++) assert.equal(JSON.stringify(R.pickTitles(s), (k, v) => typeof v === 'function' ? undefined : v), first);
});
test('Q12: a victory never yields a shame primary; secondaries never share a category', () => {
  for (const s of sequence(300)) {
    const v = { ...s, victory: true, abandoned: false }, p = R.pickTitles(v);
    assert.notEqual(p.primary.category, 'shame', p.primary.id);
    const cats = [p.primary, ...p.secondary].map(x => x.category); assert.equal(new Set(cats).size, cats.length);
  }
});
test('Part B and untracked titles are gated; the fallback appears when nothing else applies', () => {
  const s = fixture(R.TITLES.find(t => t.id === 'night_stalker'), false); s.nightKills = null;
  assert.equal(R.available(R.TITLES.find(t => t.id === 'night_stalker'), { ...s, nightKills: 99 }), false);
  assert.equal(R.available(R.TITLES.find(t => t.id === 'amber_keeper'), summary()), false, 'amber secrets are not built');
  assert.equal(R.pickTitles(summary({ kills: 0, levelReached: 1, victory: false, deathCauseType: 'enemy', seconds: 120, minutes: 2, distanceM: 400 })).primary.id, 'new_branch');
});
test('Q13 (unit): a compy death names the compy and earns Compy-snack', () => {
  const g = setup(), r = g.run; r.seconds = 120;
  const compy = g.spawn('compy', { x: r.player.x + 30, y: r.player.y }); kill(g, compy);
  assert.equal(r.summary.killerIsCompy, true); assert.equal(r.titles.primary, 'compy_snack');
  assert.equal(g.save.titles.compy_snack.count, 1); assert.deepEqual(r.titles.fresh.includes('compy_snack'), true);
  assert.equal(records(g).deaths_compy.v, 1);
});
test('Q15: every variable a title needs is produced by buildRunSummary', () => {
  const g = setup(); g.run.seconds = 61; g.giveUp(); const s = g.run.summary;
  for (const t of R.TITLES) for (const v of t.requiredVariables) assert.ok(v in s, t.id + ' needs ' + v);
});
test('Q41: every records label, title name and title description is translated to en/de/sv/no/ja/zh', () => {
  const I = require('../PRIMAL_RUN_Game/src/i18n.js'); globalThis.PrimalI18n = I; require('../PRIMAL_RUN_Game/src/lang.js');
  const ui = ['Rekorder', 'Hall of Fame', 'Hall of Shame', 'Top 10', 'I dag', 'Uge', 'Måned', 'Altid', 'fra tidligere runs', 'Registreres fra version 3', 'Dødsårsag', 'Sejr', 'Opgivet',
    'Bane 7', 'Bane 7/8', 'Nedlæggelser', 'Mini-bosser', 'Skade', 'Største slag', 'Distance', 'Områder', 'Føde', 'Fisk', 'Ny titel', '850 m', '3,4 km', 'ø 3,5', 'LOKALE REKORDER',
    'Hall of Fame og Hall of Shame i denne browser. Ingen globale ranglister.', 'Rekorder gemmes kun i denne browser. — betyder endnu ikke registreret.',
    'Distance regnes som 20 pixels pr. meter for alle arter. DNA-andelen er observerede drops, ikke en ekstra luck-bonus.'];
  for (const lang of ['en', 'de', 'sv', 'no', 'ja', 'zh']) {
    I.setLanguage(lang); I.missing.clear();
    for (const text of ui) I.t(text);
    for (const def of R.STATS) I.t(def.label);
    for (const t of R.TITLES) { I.t(t.name.da); I.t(t.description.da); }
    assert.deepEqual([...I.missing], [], lang);
  }
  I.setLanguage('en'); assert.equal(C.formatDistance(68000, 'en'), '3.4 km'); assert.equal(I.t('3.4 km'), '3.4 km'); assert.equal(I.t('Compy-snack'), 'Compy Snack'); I.setLanguage('da');
});
