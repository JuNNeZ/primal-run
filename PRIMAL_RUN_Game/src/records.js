/* PRIMAL RUN records: distance calibration (R-DIST), run tracking (R-TRACK), local Hall of Fame /
   Hall of Shame (R-RECORDS) and run titles (R-REPORT). Specs: docs/design/records-world-extinction.
   Pure helpers are deterministic; only install() touches the Game prototype, by wrapping methods so
   core.js keeps its own logic. Loaded before core.js in the browser and required by core.js in Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./run_titles.js'));
  else root.PrimalRecords = factory(root.PrimalRunTitles);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (TITLE_DATA) {
  'use strict';
  // ---- R-DIST ---------------------------------------------------------------------------------
  // One global constant (04_DISTANCE_CALIBRATION.md §2): median body length ≈ 19.6 px/m.
  const PX_PER_METER = 20;
  // Stored values stay in world pixels; only display converts.
  const metres = px => Math.max(0, Number(px) || 0) / PX_PER_METER;
  // "850 m" below one kilometre, otherwise "3,4 km"; languages with a decimal point get "3.4 km".
  const DECIMAL_POINT = ['en', 'ja', 'zh', 'tlh', 'sjn'];
  function formatDistance(px, lang = 'da') {
    const m = metres(px);
    if (m < 1000) return Math.round(m) + ' m';
    const km = (Math.round(m / 100) / 10).toFixed(1);
    return (DECIMAL_POINT.includes(lang) ? km : km.replace('.', ',')) + ' km';
  }

  // ---- period keys (local time, injected clock) ----------------------------------------------
  const pad = n => String(n).padStart(2, '0');
  function dayKey(ms) { const d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function monthKey(ms) { const d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  function weekKey(ms) {
    const d = new Date(ms), t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = (t.getDay() + 6) % 7; t.setDate(t.getDate() - day + 3); // Thursday of this ISO week
    const year = t.getFullYear(), first = new Date(year, 0, 4);
    const week = 1 + Math.round(((t - first) / 86400000 - 3 + ((first.getDay() + 6) % 7)) / 7);
    return year + '-W' + pad(week);
  }
  const PERIODS = { day: dayKey, week: weekKey, month: monthKey };

  // ---- RunSummary -----------------------------------------------------------------------------
  const HERBIVORES = ['parasaurolophus', 'ankylosaurus', 'triceratops', 'pachycephalosaurus'];
  // Variables whose source does not exist yet stay null: titles needing them are gated, boards show "—".
  const UNTRACKED = ['foodStolen', 'secretsFound', 'secretLevel', 'secretEnding', 'nightKills', 'alliesRecruited', 'challengeCount', 'dailySeed'];
  function newTrack() {
    return { minibossKills: 0, eliteKills: 0, rareKills: 0, bossAttempts: 0, bossNoHitKills: 0, bossCloseCalls: 0, bossKills: [],
      maxHitDamage: 0, longestNoHitSeconds: 0, lastHitAt: 0, lowHpSeconds: 0, lavaDamage: 0, lavaSeconds: 0, deepWaterSeconds: 0,
      mudSeconds: 0, hiddenSeconds: 0, ambushKills: 0, ambushUntil: -1, abilityKills: 0, eventsClaimed: 0, sitesClaimed: 0,
      zonesAvailable: 0, mutationLog: [], achievements: 0, rivalIds: [], bankedMapSeed: null, lastCause: null };
  }
  const round1 = n => Math.round(n * 10) / 10;
  function buildRunSummary(r, ctx) {
    const st = r.stats, t = r.track || newTrack(), res = r.result || {};
    const seconds = round1(r.seconds), distanceM = round1(metres(st.distance));
    const cause = r.deathCause || null, diet = ctx.PLAYER_SPECIES[r.species].diet;
    const rarity = id => ((ctx.MUTATIONS.find(m => m.id === id) || {}).rarity);
    const s = {
      species: r.species, diet, victory: !!res.victory, abandoned: !!r.abandoned, seconds, minutes: round1(seconds / 60),
      levelReached: r.levelIndex + 1, campaign: r.secret ? 'secret' : r.campaign === ctx.LEVELS ? 'journey' : 'classic',
      kills: st.kills, killsBySpecies: { ...st.killsBySpecies }, bosses: r.bosses, albinos: st.albinos || 0, rivals: st.rivals || 0,
      herbivoreElites: st.herbivoreElites || 0, attacks: st.attacks, landedAttacks: st.landedAttacks, crits: st.crits || 0,
      abilities: st.abilities, avoidedHits: st.avoidedHits, damageDealt: Math.round(st.damageDealt), damageTaken: Math.round(st.damageTaken),
      healing: Math.round(st.healing), distancePx: Math.round(st.distance), distanceM, plantsEaten: st.plantsEaten, meatEaten: st.meatEaten,
      fishCaught: st.fishCaught, food: st.food, dna: st.dna, mutationsTaken: st.mutations, zonesFound: st.zones || 0, exploration: r.exploration,
      finteHits: st.finteHits || 0, staminaSpent: Math.round(st.staminaSpent), levelUps: r.level - 1,
      accuracy: st.landedAttacks / Math.max(1, st.attacks), damageRatio: st.damageDealt / Math.max(1, st.damageTaken),
      hpLeftPct: Math.round(100 * Math.max(0, r.health) / r.maxHealth),
      deathCauseType: cause ? cause.type : null, deathCauseKind: cause && cause.kind || null, deathBossId: cause && cause.bossId || null,
      deathRival: !!(cause && cause.rival), killerIsCompy: !!(cause && cause.kind === 'compy'),
      killerDiet: cause && cause.kind ? (HERBIVORES.includes(cause.kind) ? 'herbivore' : 'carnivore') : null, killerFleeing: !!(cause && cause.flee),
      minibossKills: t.minibossKills, eliteKills: t.eliteKills, rareKills: t.rareKills, bossAttempts: Math.max(t.bossAttempts, r.bosses),
      bossNoHitKills: t.bossNoHitKills, bossCloseCalls: t.bossCloseCalls,
      fastestBossSeconds: t.bossKills.length ? Math.min(...t.bossKills.map(b => b.seconds)) : 0, bossKills: t.bossKills.map(b => ({ ...b })),
      maxHitDamage: Math.round(t.maxHitDamage), longestNoHitSeconds: round1(t.longestNoHitSeconds), lowHpSeconds: round1(t.lowHpSeconds),
      lavaDamage: Math.round(t.lavaDamage), lavaSeconds: round1(t.lavaSeconds), deepWaterSeconds: round1(t.deepWaterSeconds),
      mudSeconds: round1(t.mudSeconds), hiddenSeconds: round1(t.hiddenSeconds), ambushKills: t.ambushKills, abilityKills: t.abilityKills,
      eventsClaimed: t.eventsClaimed, sitesClaimed: t.sitesClaimed, zonesAvailable: t.zonesAvailable,
      explorationPct: Math.round(100 * Math.min(1, (st.zones || 0) / Math.max(1, t.zonesAvailable))),
      mutationLog: t.mutationLog.slice(), epicMutations: t.mutationLog.filter(id => ['epic', 'legendary'].includes(rarity(id))).length,
      achievementsThisRun: t.achievements, rivalsSpawned: t.rivalIds.length,
      score: res.score || 0, seed: r.seed, endedAt: ctx.now
    };
    for (const key of UNTRACKED) s[key] = null;
    for (const key of UNTRACKED) if (r.partB && r.partB[key] !== undefined && r.partB[key] !== null) s[key] = r.partB[key]; // Part B fills its own fields
    return s;
  }

  // ---- R-RECORDS: 29 Fame + 25 Shame (02_STATISTICS_AND_RECORDS.md §4–5) -----------------------
  const BOSS_IDS = { deaths_carl: 'carnotaurus@2', deaths_karl: 'carnotaurus@7', deaths_palle: 'pachycephalosaurus@1', deaths_benny: 'baryonyx@3',
    deaths_doris: 'deinosuchus@4', deaths_asta: 'ankylosaurus@5', deaths_tina: 'triceratops@6', deaths_ragnar: 'tyrannosaurus@8' };
  const died = s => !s.victory && !s.abandoned;
  const S = (id, board, label, type, value, extra = {}) => ({ id, board, label, type, value, ...extra });
  const STATS = [
    S('most_kills_run', 'fame', 'Flest nedlæggelser i ét run', 'best', s => s.kills),
    S('total_kills', 'fame', 'Nedlæggelser i alt', 'sum', s => s.kills, { seed: l => l.kills }),
    S('most_bosses_run', 'fame', 'Flest bosser i ét run', 'best', s => s.bosses, { tie: (s, ref) => s.seconds < ref.seconds }),
    S('total_bosses', 'fame', 'Bosser i alt', 'sum', s => s.bosses, { seed: l => l.bosses }),
    S('total_minibosses', 'fame', 'Mini-bosser i alt', 'sum', s => s.minibossKills),
    S('most_minibosses_run', 'fame', 'Flest mini-bosser i ét run', 'best', s => s.minibossKills),
    S('most_played_species', 'fame', 'Mest spillede art', 'mode', s => s.species),
    S('most_successful_species', 'fame', 'Mest succesfulde art', 'species', s => s.species),
    S('longest_run', 'fame', 'Længste run', 'best', s => s.seconds, { unit: 'time' }),
    S('longest_distance_run', 'fame', 'Længste tur', 'best', s => s.distanceM, { unit: 'm' }),
    S('total_distance', 'fame', 'Distance i alt', 'sum', s => s.distanceM, { unit: 'm', seed: l => round1(metres(l.distance)) }),
    S('most_zones_run', 'fame', 'Flest områder i ét run', 'best', s => s.zonesFound, { tie: (s, ref) => s.explorationPct > (ref.explorationPct || 0) }),
    S('best_exploration', 'fame', 'Bedste udforskning', 'best', s => s.explorationPct, { unit: '%', eligible: s => s.levelReached >= 3 }),
    S('highest_damage_run', 'fame', 'Mest skade i ét run', 'best', s => s.damageDealt),
    S('biggest_hit', 'fame', 'Største enkeltslag', 'best', s => s.maxHitDamage),
    S('longest_flawless', 'fame', 'Længste skadefri periode', 'best', s => s.longestNoHitSeconds, { unit: 'time' }),
    S('most_dna_run', 'fame', 'Mest DNA i ét run', 'best', s => s.dna),
    S('total_dna', 'fame', 'DNA tjent i alt', 'sum', s => s.dna),
    S('most_achievements_run', 'fame', 'Flest bedrifter i ét run', 'best', s => s.achievementsThisRun),
    S('achievements_completed', 'fame', 'Bedrifter fuldført', 'current', (s, save) => Object.keys(save.achievements || {}).length),
    S('highest_score', 'fame', 'Højeste score', 'best', s => s.score),
    S('fastest_victory', 'fame', 'Hurtigste sejr', 'least', s => s.seconds, { unit: 'time', eligible: s => s.victory }),
    S('fastest_boss', 'fame', 'Hurtigste bossdrab', 'least', s => s.fastestBossSeconds, { unit: 'time', eligible: s => s.fastestBossSeconds > 0 }),
    S('most_crits_run', 'fame', 'Flest kritiske træf', 'best', s => s.crits),
    S('total_albinos', 'fame', 'Albinoer i alt', 'sum', s => s.albinos, { seed: l => l.albinos }),
    S('total_victories', 'fame', 'Sejre i alt', 'sum', s => s.victory ? 1 : 0, { seed: l => l.victories }),
    S('best_accuracy', 'fame', 'Bedste træfsikkerhed', 'best', s => Math.round(100 * s.accuracy), { unit: '%', eligible: s => s.attacks >= 40 }),
    S('most_fish_run', 'fame', 'Flest fisk i ét run', 'best', s => s.fishCaught),
    S('titles_collected', 'fame', 'Titler samlet', 'current', (s, save) => Object.keys(save.titles || {}).length),
    ...Object.entries(BOSS_IDS).map(([id, boss]) => S(id, 'shame', { deaths_carl: 'Ædt af Carl', deaths_karl: 'Brændt af Karl', deaths_palle: 'Væltet af Palle',
      deaths_benny: 'Slugt af Benny', deaths_doris: 'Trukket ned af Doris', deaths_asta: 'Knust af Asta', deaths_tina: 'Spiddet af Tina', deaths_ragnar: 'Ædt af Ragnar' }[id],
      'count', s => died(s) && s.deathBossId === boss)),
    S('deaths_rivals', 'shame', 'Dræbt af rivaler', 'count', s => died(s) && s.deathRival),
    S('deaths_lava', 'shame', 'Lavadødsfald', 'count', s => died(s) && s.deathCauseType === 'lava'),
    S('deaths_environment', 'shame', 'Naturen vandt', 'count', s => died(s) && ['lava', 'environment'].includes(s.deathCauseType)),
    S('deaths_compy', 'shame', 'Ædt af en compy', 'count', s => died(s) && s.killerIsCompy),
    S('shortest_survival', 'shame', 'Korteste overlevelse', 'least', s => s.seconds, { unit: 'time', eligible: died }),
    S('failed_runs', 'shame', 'Mislykkede runs', 'count', died),
    S('abandoned_runs', 'shame', 'Opgivne runs', 'count', s => s.abandoned),
    S('defeat_streak', 'shame', 'Flest nederlag i træk', 'streak', s => !s.victory),
    S('most_damage_taken_run', 'shame', 'Mest skade taget i ét run', 'best', s => s.damageTaken),
    S('total_damage_taken', 'shame', 'Skade taget i alt', 'sum', s => s.damageTaken),
    S('failed_boss_encounters', 'shame', 'Tabte bosskampe', 'sum', s => Math.max(0, s.bossAttempts - s.bosses)),
    S('embarrassing_cause', 'shame', 'Mest pinlige dødsårsag', 'weighted', embarrassment),
    S('most_food_stolen_run', 'shame', 'Mest stjålet føde', 'best', s => s.foodStolen),
    S('worst_accuracy', 'shame', 'Dårligste træfsikkerhed', 'least', s => Math.round(100 * s.accuracy), { unit: '%', eligible: s => s.attacks >= 40 }),
    S('total_lava_damage', 'shame', 'Lavaskade i alt', 'sum', s => s.lavaDamage),
    S('most_low_hp_time', 'shame', 'Længst tid på et hængende hår', 'best', s => s.lowHpSeconds, { unit: 'time' }),
    S('nemesis', 'shame', 'Ærkefjende', 'mode', s => died(s) && s.deathCauseKind || null)
  ];
  // 05 §5.1: fixed weights, one cause key per death.
  const EMBARRASSMENT = { compy: 10, sub_minute: 9, herbivore_on_herbivore: 8, lava: 7, level1_boss: 6, fleeing_prey: 6, boss_other: 3, enemy_other: 2 };
  function embarrassment(s) {
    if (!died(s)) return null;
    if (s.killerIsCompy) return 'compy';
    if (s.seconds < 60) return 'sub_minute';
    if (s.diet === 'herbivore' && s.killerDiet === 'herbivore') return 'herbivore_on_herbivore';
    if (s.deathCauseType === 'lava') return 'lava';
    if (s.deathBossId === 'pachycephalosaurus@1') return 'level1_boss';
    if (s.killerFleeing) return 'fleeing_prey';
    if (s.deathCauseType === 'boss') return 'boss_other';
    if (s.deathCauseType === 'enemy') return 'enemy_other';
    return null;
  }
  const STAT_IDS = STATS.map(x => x.id);
  const ref = s => ({ species: s.species, date: dayKey(s.endedAt), seed: s.seed, seconds: s.seconds, explorationPct: s.explorationPct });

  function applyStat(def, agg, s) {
    const v = def.value(s);
    switch (def.type) {
      case 'sum': if (v == null) return agg; return { v: round1((agg ? agg.v : 0) + v), ...(agg && agg.seeded ? { seeded: true } : {}) };
      case 'best': case 'least': {
        if (v == null || !Number.isFinite(v) || def.eligible && !def.eligible(s)) return agg;
        if (def.type === 'best' && v <= 0 && !agg) return agg;
        const better = !agg || (def.type === 'best' ? v > agg.v : v < agg.v) || v === agg.v && def.tie && def.tie(s, agg.ref || {});
        return better ? { v, ref: ref(s) } : agg;
      }
      case 'count': return v ? { v: (agg ? agg.v : 0) + 1 } : agg || { v: 0 };
      case 'mode': case 'weighted': {
        if (v == null || v === false) return agg;
        const counts = { ...(agg ? agg.counts : {}) }; counts[v] = (counts[v] || 0) + 1;
        return { counts, last: v };
      }
      case 'species': {
        const per = { ...(agg ? agg.per : {}) }, p = { ...(per[v] || { runs: 0, levels: 0, victories: 0 }) };
        p.runs++; p.levels += s.levelReached; p.victories += s.victory ? 1 : 0; per[v] = p; return { per };
      }
      case 'streak': { const current = v ? (agg ? agg.current : 0) + 1 : 0; return { current, best: Math.max(agg ? agg.best : 0, current) }; }
      default: return agg;
    }
  }
  function applyStats(stats, s) {
    const out = {};
    for (const def of STATS) { if (def.type === 'current') continue; const next = applyStat(def, stats[def.id], s); if (next) out[def.id] = next; }
    return out;
  }
  function compactSummary(s, titleId) {
    return { t: s.endedAt, species: s.species, victory: s.victory, abandoned: s.abandoned, level: s.levelReached, seconds: s.seconds, kills: s.kills,
      bosses: s.bosses, distanceM: s.distanceM, score: s.score, cause: s.deathBossId || s.deathCauseKind || s.deathCauseType, title: titleId || null };
  }
  function emptyRecords() { return { allTime: {}, periods: { day: { key: null, stats: {} }, week: { key: null, stats: {} }, month: { key: null, stats: {} } }, recent: [] }; }
  // Pure: same records + summary sequence → identical JSON.
  function applySummary(records, s, titleId) {
    const next = JSON.parse(JSON.stringify(records || emptyRecords())), now = s.endedAt;
    next.allTime = applyStats(next.allTime, s);
    for (const [scope, keyOf] of Object.entries(PERIODS)) {
      const key = keyOf(now), period = next.periods[scope];
      if (period.key !== key) { next.periods[scope] = { key, stats: {}, ...(period.key ? { previous: { key: period.key, stats: period.stats } } : {}) }; }
      next.periods[scope].stats = applyStats(next.periods[scope].stats, s);
    }
    next.recent = [compactSummary(s, titleId), ...next.recent].slice(0, 50);
    return next;
  }
  // The view of one scope at time `now`: a stale period shows as empty.
  function scopeStats(records, scope, now) {
    if (scope === 'allTime') return records.allTime;
    const period = records.periods[scope]; return period && period.key === PERIODS[scope](now) ? period.stats : {};
  }
  // Value of one statistic for display: {value, ref, seeded} or null ("—").
  function statValue(def, agg, save) {
    if (def.type === 'current') return { value: def.value(null, save) };
    if (!agg) return null;
    if (def.type === 'mode' || def.type === 'weighted') {
      const weight = k => def.type === 'weighted' ? EMBARRASSMENT[k] || 1 : 1;
      const keys = Object.keys(agg.counts).sort((a, b) => agg.counts[b] * weight(b) - agg.counts[a] * weight(a) || weight(b) - weight(a) || (def.type === 'mode' ? (b === agg.last) - (a === agg.last) : 0) || (a < b ? -1 : 1));
      return keys.length ? { value: keys[0], count: agg.counts[keys[0]] } : null;
    }
    if (def.type === 'species') {
      const rows = Object.entries(agg.per).filter(([, p]) => p.runs >= 3)
        .sort(([a, x], [b, y]) => y.levels / y.runs - x.levels / x.runs || y.victories - x.victories || y.runs - x.runs || (a < b ? -1 : 1));
      return rows.length ? { value: rows[0][0], mean: round1(rows[0][1].levels / rows[0][1].runs) } : null;
    }
    if (def.type === 'streak') return { value: agg.best, current: agg.current };
    return { value: agg.v, ref: agg.ref || null, seeded: !!agg.seeded };
  }

  // ---- save v2 → v3 ---------------------------------------------------------------------------
  const finite = n => typeof n === 'number' && Number.isFinite(n);
  const cleanRef = r => r && typeof r === 'object' ? { species: String(r.species || '').slice(0, 24), date: String(r.date || '').slice(0, 10), seed: finite(r.seed) ? r.seed : 0, seconds: finite(r.seconds) ? r.seconds : 0, ...(finite(r.explorationPct) ? { explorationPct: r.explorationPct } : {}) } : null;
  function cleanCounts(c) { const out = {}; if (c && typeof c === 'object') for (const [k, v] of Object.entries(c)) if (finite(v) && v >= 0 && /^[a-z_@:0-9]{1,40}$/i.test(k)) out[k] = Math.floor(v); return out; }
  function cleanAgg(def, a) {
    if (!a || typeof a !== 'object') return null;
    switch (def.type) {
      case 'sum': case 'count': return finite(a.v) && a.v >= 0 ? { v: a.v, ...(a.seeded ? { seeded: true } : {}) } : null;
      case 'best': case 'least': return finite(a.v) ? { v: a.v, ref: cleanRef(a.ref) } : null;
      case 'mode': case 'weighted': { const counts = cleanCounts(a.counts); return Object.keys(counts).length ? { counts, last: typeof a.last === 'string' ? a.last : null } : null; }
      case 'species': { const per = {}; for (const [k, p] of Object.entries(a.per || {})) if (p && finite(p.runs) && finite(p.levels) && finite(p.victories)) per[k] = { runs: p.runs, levels: p.levels, victories: p.victories }; return Object.keys(per).length ? { per } : null; }
      case 'streak': return finite(a.current) && finite(a.best) ? { current: a.current, best: a.best } : null;
      default: return null;
    }
  }
  function cleanStats(raw) { const out = {}; if (raw && typeof raw === 'object') for (const def of STATS) { const a = cleanAgg(def, raw[def.id]); if (a) out[def.id] = a; } return out; }
  // `save` is the already-sanitised save (lifetime, scores). Unknown fields drop individually.
  function sanitizeRecords(raw, save) {
    if (!raw || typeof raw !== 'object') return seedRecords(save);
    const out = emptyRecords(); out.allTime = cleanStats(raw.allTime);
    for (const scope of Object.keys(PERIODS)) {
      const p = raw.periods && raw.periods[scope];
      if (p && typeof p.key === 'string') out.periods[scope] = { key: p.key.slice(0, 10), stats: cleanStats(p.stats), ...(p.previous && typeof p.previous.key === 'string' ? { previous: { key: p.previous.key.slice(0, 10), stats: cleanStats(p.previous.stats) } } : {}) };
    }
    out.recent = (Array.isArray(raw.recent) ? raw.recent : []).filter(x => x && finite(x.t)).slice(0, 50).map(x => ({
      t: x.t, species: String(x.species || '').slice(0, 24), victory: !!x.victory, abandoned: !!x.abandoned, level: finite(x.level) ? x.level : 1,
      seconds: finite(x.seconds) ? x.seconds : 0, kills: finite(x.kills) ? x.kills : 0, bosses: finite(x.bosses) ? x.bosses : 0,
      distanceM: finite(x.distanceM) ? x.distanceM : 0, score: finite(x.score) ? x.score : 0, cause: typeof x.cause === 'string' ? x.cause.slice(0, 40) : null, title: typeof x.title === 'string' ? x.title.slice(0, 40) : null }));
    return out;
  }
  // Only boards with a historical source are seeded; everything else starts empty ("—"), never guessed.
  function seedRecords(save) {
    const out = emptyRecords(), life = save && save.lifetime || {};
    if (life.runs > 0) for (const def of STATS) if (def.seed) { const v = def.seed(life); if (finite(v) && v > 0) out.allTime[def.id] = { v, seeded: true }; }
    const top = save && save.scores && save.scores[0];
    if (top && top.score > 0) out.allTime.highest_score = { v: top.score, ref: null };
    return out;
  }
  function sanitizeTitles(raw) {
    const out = {}; if (!raw || typeof raw !== 'object') return out;
    for (const t of TITLES) { const x = raw[t.id]; if (x && typeof x.first === 'string' && finite(x.count) && x.count > 0) out[t.id] = { first: x.first.slice(0, 24), count: Math.floor(x.count) }; }
    return out;
  }

  // ---- R-REPORT: deterministic title selection (03_RUN_REPORT_AND_TITLES.md §4) -----------------
  const TITLES = TITLE_DATA ? TITLE_DATA.titles : [];
  const RANK = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, secret: 6 };
  const FALLBACK = TITLES.find(t => t.id === 'new_branch');
  // Hidden while the feature or its tracking does not exist (Part B, amber secrets, food theft).
  const available = (t, s) => t.implementationStatus !== 'needs Part B' && t.requiredVariables.every(v => s[v] !== null && s[v] !== undefined);
  function evalCondition(t, s) { try { return !!t.test(s); } catch (_) { return false; } }
  const ALIAS = { eliteRare: s => s.eliteKills + s.rareKills, plants: s => s.plantsEaten, meat: s => s.meatEaten };
  const valueOf = (name, s) => ALIAS[name] ? ALIAS[name](s) : s[name];
  function marginFor(t, s) {
    const [kind, arg] = t.tieBreak.split(':');
    const scaled = (over, th) => Math.floor(3 * over / Math.max(1, th));
    if (kind === 'margin' || kind === 'inverse') {
      const m = t.condition.match(new RegExp('s\\.' + arg + '\\s*' + (kind === 'margin' ? '>=?' : '<=?') + '\\s*([\\d.]+)')) || t.condition.match(/>=\s*([\d.]+)/);
      const th = m ? Number(m[1]) : 0, v = valueOf(arg, s);
      if (!finite(v)) return 0;
      return Math.max(0, scaled(kind === 'margin' ? v - th : th - v, th));
    }
    if (kind === 'count') {
      const m = t.condition.match(/>=\s*([\d.]+)/), th = m ? Number(m[1]) : 0;
      const n = arg === 'speciesWith3' ? Object.values(s.killsBySpecies || {}).filter(x => x >= 3).length : Object.keys(s.killsBySpecies || {}).length;
      return Math.max(0, n - th);
    }
    if (kind === 'min') {
      const m = t.condition.match(/>=\s*([\d.]+)/), th = m ? Number(m[1]) : 0;
      return Math.max(0, scaled(Math.min(...arg.split(',').map(a => valueOf(a, s) || 0)) - th, th));
    }
    return 0;
  }
  const titleScore = (t, s) => RANK[t.rarity] * 1000 + t.priority * 10 + Math.min(9, marginFor(t, s));
  function pickTitles(s, catalogue = TITLES) {
    const index = new Map(catalogue.map((t, i) => [t, i]));
    const pool = catalogue.filter(t => t.category !== 'fallback' && available(t, s) && evalCondition(t, s))
      .filter(t => s.victory ? t.category !== 'shame' || t.id === 'quitter' : true)
      .map(t => ({ t, score: titleScore(t, s) }))
      .sort((a, b) => b.score - a.score || index.get(a.t) - index.get(b.t)).map(x => x.t);
    const primary = pool[0] || FALLBACK || { id: 'new_branch', category: 'fallback', rarity: 'common', name: { da: 'En Ny Gren på Stamtræet' }, description: { da: '' } }, secondary = [];
    for (const t of pool.slice(1)) {
      if (secondary.length === 2) break;
      if (t.category === primary.category || secondary.some(x => x.category === t.category)) continue;
      secondary.push(t);
    }
    return { primary, secondary };
  }
  function awardTitles(titles, picked, iso) {
    const next = { ...titles }, fresh = [];
    for (const t of [picked.primary, ...picked.secondary]) {
      if (!t) continue; if (!next[t.id]) fresh.push(t.id);
      next[t.id] = { first: next[t.id] ? next[t.id].first : iso, count: (next[t.id] ? next[t.id].count : 0) + 1 };
    }
    return { titles: next, fresh };
  }

  // ---- R-TRACK: wrap Game methods; core keeps its logic -----------------------------------------
  function install(C) {
    const G = C.Game.prototype;
    if (G.__recordsInstalled) return; G.__recordsInstalled = true;
    const wrap = (name, fn) => { const original = G[name]; G[name] = function (...args) { return fn.call(this, original, ...args); }; };
    const T = r => r.track || (r.track = newTrack());
    function causeOf(r, source) {
      if (!source) return { type: 'environment', at: r.seconds };
      if (source.hazard) return { type: source.hazard, at: r.seconds };
      const kind = source.kind, boss = !!source.boss;
      const bossId = boss ? (r.secret ? 'secret:' + kind : r.campaign === C.LEVELS ? kind + '@' + (r.levelIndex + 1) : 'classic:' + kind) : null;
      return { type: boss ? 'boss' : 'enemy', kind, bossId, rival: !!source.rivalName, flee: source.mode === 'flee', mode: source.mode || null, at: r.seconds };
    }
    function bankMap(r) {
      const t = T(r); if (!r.map || t.bankedMapSeed === r.map.seed + ':' + r.levelIndex) return;
      t.bankedMapSeed = r.map.seed + ':' + r.levelIndex;
      t.sitesClaimed += (r.map.sites || []).filter(x => x.claimed).length;
      t.eventsClaimed += (r.map.events || []).filter(x => x.claimed).length;
      t.zonesAvailable += (r.map.zones || []).length;
    }
    // Called after damage(), or from finish() when the hit was fatal, so the summary includes the killing blow.
    // The hit in progress lives outside the run, so a damage() call while the world is frozen changes nothing in it.
    const PENDING = new WeakMap();
    function bankHit(r, t) {
      const hit = PENDING.get(r); if (!hit || hit.banked) return; hit.banked = true;
      const source = hit.source, taken = Math.max(0, hit.before - Math.max(0, r.health));
      if (taken <= 0) return;
      if (source && source.hazard === 'lava') t.lavaDamage += taken;
      t.longestNoHitSeconds = Math.max(t.longestNoHitSeconds, r.seconds - t.lastHitAt); t.lastHitAt = r.seconds;
      t.lastCause = causeOf(r, source);
    }
    wrap('start', function (original, ...args) { const out = original.apply(this, args); if (this.run) this.run.track = newTrack(); return out; });
    // Lava passes {hazard:'lava'}; core still receives null so its own lava handling is unchanged.
    wrap('damage', function (original, amount, source) {
      const r = this.run; if (!r) return original.call(this, amount, source);
      const outer = PENDING.get(r); PENDING.set(r, { source: source || null, before: r.health, banked: false });
      try { return original.call(this, amount, source && source.hazard ? null : source); }
      finally { if (r.track) bankHit(r, r.track); if (outer) PENDING.set(r, outer); else PENDING.delete(r); }
    });
    wrap('attack', function (original, ...args) { const r = this.run, hidden = !!(r && r.hidden); const out = original.apply(this, args); if (out && hidden) T(r).ambushUntil = r.seconds + 1.5; return out; });
    wrap('kill', function (original, e) {
      const r = this.run; if (!r || !e || e.rewarded) return original.call(this, e);
      const t = T(r), level = r.campaign[r.levelIndex] || {}, pounce = r.pounce > 0;
      const out = original.call(this, e);
      if (e.boss) {
        t.bossKills.push({ kind: e.kind, level: r.levelIndex + 1, id: causeOf(r, e).bossId, name: level.bossName || null, seconds: round1(r.seconds - (e.trackSpawnAt !== undefined ? e.trackSpawnAt : r.seconds)) });
        if (!e.hitPlayer) t.bossNoHitKills++;
        if (r.health < r.maxHealth * .1) t.bossCloseCalls++;
        if (level.mini) t.minibossKills++;
      } else if (e.miniboss) t.minibossKills++;
      if (e.elite) t.eliteKills++;
      if (e.rare) t.rareKills++;
      if (pounce) t.abilityKills++;
      if (r.seconds <= t.ambushUntil) t.ambushKills++;
      return out;
    });
    // Boss fight time runs from the boss's arrival, not from its first alert (a late alert made 25 s kills look common).
    wrap('spawn', function (original, kind, position, boss) { const e = original.call(this, kind, position, boss); if (e && boss && this.run) e.trackSpawnAt = this.run.seconds; return e; });
    wrap('choose', function (original, id) { const ok = original.call(this, id); if (ok && this.run) T(this.run).mutationLog.push(id); return ok; });
    wrap('checkAchievements', function (original, ...args) { const earned = original.apply(this, args); if (this.run && earned.length) T(this.run).achievements += earned.length; return earned; });
    wrap('nextStage', function (original, ...args) { if (this.phase === 'cleared' && this.run) bankMap(this.run); return original.apply(this, args); });
    wrap('step', function (original, dt, input) {
      const r = this.run; if (!r || this.phase !== 'playing') return original.call(this, dt, input);
      const t = T(r), seconds = r.seconds, hp = r.enemies.map(e => [e, e.hp]);
      try { return original.call(this, dt, input); }
      finally {
        const d = Math.max(0, r.seconds - seconds);
        if (d > 0 && !r.result) {
          if (r.surface === 'lava') t.lavaSeconds += d; else if (r.surface === 'deep') t.deepWaterSeconds += d; else if (r.surface === 'mud') t.mudSeconds += d;
          if (r.hidden) t.hiddenSeconds += d;
          if (r.health > 0 && r.health < r.maxHealth * .25) t.lowHpSeconds += d;
        }
        // Largest single-target HP drop within one player step, only for animals the player provoked this step.
        for (const [e, before] of hp) if (e.lastAttackedAt === r.seconds) t.maxHitDamage = Math.max(t.maxHitDamage, before - Math.max(0, e.hp));
        for (const e of r.enemies) {
          if (e.boss && e.trackAttemptAt === undefined && (e.hp < e.maxHP || Math.hypot(e.x - r.player.x, e.y - r.player.y) < 420)) { e.trackAttemptAt = r.seconds; t.bossAttempts++; }
          if (e.rivalName && !t.rivalIds.includes(r.levelIndex + ':' + e.rivalName)) t.rivalIds.push(r.levelIndex + ':' + e.rivalName);
        }
      }
    });
    G.giveUp = function () { if (this.run && !this.run.result) { this.run.abandoned = true; this.finish(false); } };
    wrap('abandon', function (original) { if (this.run && !this.run.result) this.run.abandoned = true; return original.call(this); });
    wrap('finish', function (original, victory) {
      const r = this.run; if (!r || r.result) return original.call(this, victory);
      const t = T(r);
      bankHit(r, t); const hit = PENDING.get(r);
      r.deathCause = victory ? null : r.abandoned ? { type: 'abandon', at: r.seconds } : hit ? causeOf(r, hit.source) : t.lastCause || { type: 'environment', at: r.seconds };
      t.longestNoHitSeconds = Math.max(t.longestNoHitSeconds, r.seconds - t.lastHitAt);
      bankMap(r);
      const out = original.call(this, victory);
      const now = typeof this.now === 'function' ? this.now() : Date.now();
      const s = buildRunSummary(r, { PLAYER_SPECIES: C.PLAYER_SPECIES, MUTATIONS: C.MUTATIONS, LEVELS: C.LEVELS, now });
      const picked = pickTitles(s), awarded = awardTitles(this.save.titles || {}, picked, new Date(now).toISOString());
      this.save.titles = awarded.titles;
      this.save.records = applySummary(this.save.records, s, picked.primary && picked.primary.id);
      r.summary = s; r.titles = { primary: picked.primary.id, secondary: picked.secondary.map(x => x.id), fresh: awarded.fresh };
      this.persist();
      return out;
    });
  }

  return { PX_PER_METER, metres, formatDistance, dayKey, weekKey, monthKey, PERIODS, newTrack, buildRunSummary, STATS, STAT_IDS, EMBARRASSMENT,
    embarrassment, applySummary, scopeStats, statValue, emptyRecords, sanitizeRecords, seedRecords, sanitizeTitles, TITLES, RANK, available,
    evalCondition, marginFor, titleScore, pickTitles, awardTitles, UNTRACKED, install };
});
