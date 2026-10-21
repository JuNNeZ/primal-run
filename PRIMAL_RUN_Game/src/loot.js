/* Primal Run – loot-motor (FEATURES.lootTables). Motoren er prototypen fra loot-overdragelsen (2026-10-21);
 * GAME_TABLES nederst indeholder kun det, der er flyttet over fra core.js med uændret fordeling.
 * Datadrevne loot tables med:
 *  - pools (hver pool ruller N gange, uafhængigt)
 *  - vægtede entries: item, nothing, table (nested), rarity (cascade)
 *  - conditions på pool og entry (biom, elite, stage, ejer allerede, første drab, chance …)
 *  - cascading rarity: "topdown" (Legendary først og ned) eller "bottomup" (opgradér trin for trin)
 *  - loft/gulv (ceiling/floor), luck, og pity pr. tabel
 * Ingen afhængigheder. UMD som core.js: virker i Node (require) og i browseren (globalThis.PrimalLoot).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PrimalLoot = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const TIERS = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const tierIndex = t => (typeof t === 'number' ? t : TIERS.indexOf(t));

  // mulberry32 – samme familie som seeded() i core.js. Brug egne strømme til loot, så pynt-RNG ikke flytter drops.
  function seeded(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- Conditions ----------
  // Hver condition er et lille objekt. Alle på listen skal være sande (AND). Brug {any:[...]} for OR, {not:{...}} for NOT.
  const CONDITIONS = {
    any: (c, ctx, rng) => c.any.some(x => check(x, ctx, rng)),
    not: (c, ctx, rng) => !check(c.not, ctx, rng),
    chance: (c, ctx, rng) => rng() < c.chance * (c.luckScaled ? (ctx.luck || 1) : 1),
    biome: (c, ctx) => [].concat(c.biome).includes(ctx.biome),
    zone: (c, ctx) => [].concat(c.zone).includes(ctx.zone),
    source: (c, ctx) => [].concat(c.source).includes(ctx.source),          // 'kill','nest','fossil','chest','boss'
    elite: (c, ctx) => !!ctx.elite === c.elite,
    albino: (c, ctx) => !!ctx.albino === c.albino,
    boss: (c, ctx) => !!ctx.boss === c.boss,
    species: (c, ctx) => [].concat(c.species).includes(ctx.kind),
    diet: (c, ctx) => [].concat(c.diet).includes(ctx.diet),                 // spillerens kost
    stageAtLeast: (c, ctx) => (ctx.stage || 0) >= c.stageAtLeast,
    stageAtMost: (c, ctx) => (ctx.stage || 0) <= c.stageAtMost,
    night: (c, ctx) => !!ctx.night === c.night,
    firstKill: (c, ctx) => !((ctx.killsBySpecies || {})[ctx.kind] > 1) === c.firstKill,
    healthBelow: (c, ctx) => ctx.healthFrac !== undefined && ctx.healthFrac < c.healthBelow,
    hasMutation: (c, ctx) => !!(ctx.mutations || {})[c.hasMutation],
    notOwned: (c, ctx, rng, entry) => !(ctx.owned || {})[c.notOwned === true ? entry.id : c.notOwned],
    flag: (c, ctx) => !!(ctx.flags || {})[c.flag],
    meatSize: (c, ctx) => [].concat(c.meatSize).includes(ctx.meatSize),     // SPECIES[kind].meat for byttet
  };
  function check(cond, ctx, rng, entry) {
    for (const key of Object.keys(cond)) {
      if (key === 'luckScaled') continue;
      const fn = CONDITIONS[key];
      if (!fn) throw new Error('Ukendt loot-condition: ' + key);
      if (!fn(cond, ctx, rng, entry)) return false;
    }
    return true;
  }
  const passes = (list, ctx, rng, entry) => !list || [].concat(list).every(c => check(c, ctx, rng, entry));

  // ---------- Cascading rarity ----------
  // spec: { mode:'topdown'|'bottomup', chances:{legendary:.01,...} eller upgrade:[.4,.3,.2,.1],
  //         ceiling:'legendary', floor:'common', luckTiers:['epic','legendary'], pityKey, pity:{after:N, step:x} }
  function rollRarity(spec, ctx, rng, state) {
    const luck = ctx.luck || 1;
    const ceiling = Math.min(tierIndex(spec.ceiling ?? 4), tierIndex(ctx.ceiling ?? 4));
    const floor = Math.max(tierIndex(spec.floor ?? 0), tierIndex(ctx.floor ?? 0));
    const lucky = t => !spec.luckTiers || spec.luckTiers.includes(TIERS[t]);
    const pityBonus = spec.pityKey && spec.pity ? Math.max(0, (state.pity[spec.pityKey] || 0) - (spec.pity.after || 0)) * (spec.pity.step || 0) : 0;
    let tier = floor;
    if ((spec.mode || 'topdown') === 'topdown') {
      for (let t = ceiling; t > floor; t--) {
        let p = spec.chances[TIERS[t]] || 0;
        if (lucky(t)) p *= luck;
        if (t === ceiling) p += pityBonus;
        if (rng() < Math.min(1, p)) { tier = t; break; }
      }
    } else {
      tier = floor;
      while (tier < ceiling) {
        let p = spec.upgrade[tier] || 0;
        if (lucky(tier + 1)) p *= luck;
        if (tier + 1 === ceiling) p += pityBonus;
        if (rng() < Math.min(1, p)) tier++; else break;
      }
    }
    if (spec.pityKey) state.pity[spec.pityKey] = tier >= ceiling ? 0 : (state.pity[spec.pityKey] || 0) + 1;
    return tier;
  }

  // Den præcise fordeling (uden pity) – til balance-tabeller uden simulering.
  function rarityDistribution(spec, luck = 1) {
    const ceiling = tierIndex(spec.ceiling ?? 4), floor = tierIndex(spec.floor ?? 0), out = TIERS.map(() => 0);
    const lucky = t => !spec.luckTiers || spec.luckTiers.includes(TIERS[t]);
    let rest = 1;
    if ((spec.mode || 'topdown') === 'topdown') {
      for (let t = ceiling; t > floor; t--) {
        const p = Math.min(1, (spec.chances[TIERS[t]] || 0) * (lucky(t) ? luck : 1));
        out[t] = rest * p; rest *= 1 - p;
      }
      out[floor] += rest;
    } else {
      for (let t = floor; t < ceiling; t++) {
        const p = Math.min(1, (spec.upgrade[t] || 0) * (lucky(t + 1) ? luck : 1));
        out[t] = rest * (1 - p); rest *= p;
      }
      out[ceiling] += rest;
    }
    return Object.fromEntries(TIERS.map((t, i) => [t, out[i]]));
  }

  // ---------- Tabeller ----------
  function weightedPick(entries, rng) {
    const total = entries.reduce((s, e) => s + e.w, 0);
    if (total <= 0) return null;
    let x = rng() * total;
    for (const e of entries) { x -= e.w; if (x < 0) return e.entry; }
    return entries[entries.length - 1].entry;
  }
  const entryWeight = (e, ctx) => {
    let w = e.weight ?? 1;
    if (e.weightBy) for (const [key, mult] of Object.entries(e.weightBy)) if (ctx[key] || (ctx.tags || []).includes(key)) w *= mult; // "smart loot": vægt efter build/tags
    return w;
  };

  function makeLoot(tables, opts = {}) {
    const maxDepth = opts.maxDepth || 8;
    const state = { pity: {} };

    function rollTable(name, ctx, rng, depth = 0, out = []) {
      if (depth > maxDepth) throw new Error('Loot-tabel for dyb (cirkulær reference?): ' + name);
      const table = tables[name];
      if (!table) throw new Error('Ukendt loot-tabel: ' + name);
      if (!passes(table.when, ctx, rng)) return out;
      for (const pool of table.pools) {
        if (!passes(pool.when, ctx, rng)) continue;
        let rolls = typeof pool.rolls === 'function' ? pool.rolls(ctx, rng) : Array.isArray(pool.rolls)
          ? pool.rolls[0] + Math.floor(rng() * (pool.rolls[1] - pool.rolls[0] + 1)) : (pool.rolls ?? 1);
        if (pool.bonusRollsPerLuck) rolls += Math.floor(((ctx.luck || 1) - 1) * pool.bonusRollsPerLuck + rng());
        const picked = new Set();
        for (let i = 0; i < rolls; i++) {
          const live = pool.entries
            .filter(e => !(pool.unique && picked.has(e)))
            .filter(e => passes(e.when, ctx, rng, e))
            .map(e => ({ entry: e, w: entryWeight(e, ctx) }));
          const e = weightedPick(live, rng);
          if (!e) break;
          picked.add(e);
          resolve(e, ctx, rng, depth, out);
        }
      }
      return out;
    }

    function resolve(e, ctx, rng, depth, out) {
      switch (e.type || 'item') {
        case 'nothing': return;
        case 'table': rollTable(e.ref, e.ctx ? Object.assign({}, ctx, e.ctx) : ctx, rng, depth + 1, out); return;
        case 'rarity': {
          // Rul rarity først, og gå så videre til tabellen for netop den rarity: "<prefix>_<tier>"
          const tier = rollRarity(e.cascade, ctx, rng, state);
          rollTable(e.prefix + '_' + TIERS[tier], Object.assign({}, ctx, { rarity: tier }), rng, depth + 1, out);
          return;
        }
        default: {
          const [lo, hi] = Array.isArray(e.count) ? e.count : [e.count ?? 1, e.count ?? 1];
          const n = lo + Math.floor(rng() * (hi - lo + 1));
          if (n > 0) out.push({ id: e.id, count: n, rarity: ctx.rarity ?? e.rarity ?? 0 });
        }
      }
    }

    return {
      state,
      roll: (name, ctx = {}, rng = Math.random) => rollTable(name, ctx, rng),
      rollRarity: (spec, ctx = {}, rng = Math.random) => rollRarity(spec, ctx, rng, state),
    };
  }

  // ---------- Spillets tabeller ----------
  // Dagens kødtærskler fra kill() omregnet til top-down-chancer: P(trin) er præcis den samme som før.
  // [t1,t2,t3] = slaget >= t giver Nærende/Sjældent/Episk.
  function cascadeFromThresholds([t1, t2, t3]) {
    return { mode: 'topdown', ceiling: 'epic', chances: { epic: 1 - t3, rare: (t3 - t2) / t3, uncommon: (t2 - t1) / t2 } };
  }
  const MEAT_THRESHOLDS = { small: [.76, .95, .995], large: [.6, .88, .98], other: [.55, .8, .95] };
  const meatTier = id => ({ pools: [{ entries: [{ id }] }] });
  const GAME_TABLES = {
    // Kød ved drab af en almindelig NPC. Elite/albino sender ctx.floor:'rare' (som Math.max(2, …) i dag).
    kill_meat: { pools: [{ entries: [
      { type: 'rarity', prefix: 'meat', cascade: cascadeFromThresholds(MEAT_THRESHOLDS.small), when: { meatSize: 1 } },
      { type: 'rarity', prefix: 'meat', cascade: cascadeFromThresholds(MEAT_THRESHOLDS.large), when: { meatSize: 3 } },
      { type: 'rarity', prefix: 'meat', cascade: cascadeFromThresholds(MEAT_THRESHOLDS.other), when: { not: { meatSize: [1, 3] } } },
    ] }] },
    meat_common: meatTier('meat'), meat_uncommon: meatTier('meat'), meat_rare: meatTier('meat'), meat_epic: meatTier('meat'),
  };

  return { TIERS, GAME_TABLES, MEAT_THRESHOLDS, cascadeFromThresholds, seeded, makeLoot, rollRarity: (s, c, r) => rollRarity(s, c || {}, r || Math.random, { pity: {} }), rarityDistribution, CONDITIONS };
});
