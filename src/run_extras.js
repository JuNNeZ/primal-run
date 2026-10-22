// PRIMAL RUN: run extras (2026-10-14). Mechanics measured in the 2026-10-13 overnight simulation (tools/experiments.cjs),
// rebuilt as game code with the tuned numbers: hunting streak, powerups and shrines, ability twists as legendary
// species mutations, ecology pressure (blood trail, herd defence, carrion guests), elite traits, the optional hard
// baby start with a hatching intro, day rhythm (crepuscular predators, dusk drinking, daytime scavengers), amber
// secrets and the food-theft count. Everything sits behind FEATURES flags and wraps Game.prototype methods, so
// core.js keeps its own logic and a flag set to false restores the old game exactly.
// Loaded before core.js in the browser (globalThis.PrimalExtras); core.js requires it in Node and calls install(api).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PrimalExtras = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ---------------------------------------------------------------- tunables
  // Jagtrus: a kill within `window` s of the previous one adds a stack (max 5); stacks fall off after `window` s
  // without a kill. Lower than the prototype (+6 %/+4 %), which gave +0.61 levels on its own.
  const STREAK = { window: 5, max: 5, damage: .04, speed: .03, healFrom: 3, heal: 4 };
  // Powerups, light version: one shrine per level, 2 % per kill, always from elites/rares, Heart fruit only when a
  // boss breaks. Temporary powerups last at least 15 s so they reach a fight.
  const POWERUPS = {
    rage:    { name: 'Blodmåne-kød', text: '+30 % skade og 15 % hurtigere angreb', time: 15, color: '#c6663c' },
    amber:   { name: 'Ravskjold',    text: '35 skjold',                            time: 15, color: '#dfbc52' },
    stamina: { name: 'Adrenalinbær', text: 'Uendelig stamina',                     time: 15, color: '#69a4a0' },
    wind:    { name: 'Fjerlethed',   text: '+35 % fart',                           time: 15, color: '#a2d4c1' },
    frost:   { name: 'Istidsdug',    text: 'Dyr i nærheden bevæger sig 50 % langsommere', time: 15, color: '#e8ece1' },
    comet:   { name: 'Kometstøv',    text: 'De næste 4 bid er kritiske',           time: 30, color: '#bb80d9' },
    leech:   { name: 'Vampyrbregne', text: '20 % af din skade heler dig',          time: 15, color: '#8d2028' },
    heart:   { name: 'Hjertefrugt',  text: '+12 maksimalt liv resten af runnet',   time: 0,  color: '#913b32' },
  };
  const POWERUP_SPAWN = { shrines: 1, killChance: .02, eliteDrop: true, bossBreakDrop: true, frostRange: 500, shrineMinDistance: 350, pickupRadius: 34 };
  const TEMP_POWERUPS = ['rage', 'amber', 'stamina', 'wind', 'frost', 'comet', 'leech'];
  // Evne-twists: a legendary species mutation adds a second effect every time the ability is used.
  // empower: next bite ×k within t s · aoe: stagger ordinary animals / break bosses in a radius · shield [amount, s]
  // heal · speed [×k, s] · scare [r, s] · zap: damage in a radius. Only the twists that measured ≥ +0.3 levels,
  // plus a new T. rex twist (bite bonuses did not help it).
  const TWISTS = {
    parasaurolophus:    { id: 'twistTrumpet',  name: 'Trompetstød',       text: 'Trompetkaldet skræmmer rovdyr inden for # pixels i # sek. og heler # liv.', args: [200, 2, 4], icon: 'escape', scare: { r: 200, time: 2 }, heal: 4 },
    utahraptor:         { id: 'twistButcher',  name: 'Blodigt spring',     text: 'Springet gør # skade til alle dyr inden for # pixels.', args: [14, 70], icon: 'serrated_teeth', zap: { r: 70, dmg: 14 } },
    ankylosaurus:       { id: 'twistClub',     name: 'Halekølle-ladning', text: 'Efter panserstillingen gør dit næste haleslag dobbelt skade inden for # sek.', args: [3], icon: 'bone', empower: [2, 3] },
    gallimimus:         { id: 'twistWindrun',  name: 'Vindløb',           text: 'Sprinten giver +# % fart i # sek. og heler # liv.', args: [25, 3, 6], icon: 'powerful_legs', heal: 6, speed: [1.25, 3] },
    pachycephalosaurus: { id: 'twistConcuss',  name: 'Hjernerystelse',    text: 'Hovedstødet får dyr inden for # pixels til at vakle i # sek.', args: [90, 1], icon: 'bone', aoe: { r: 90, stagger: 1, brk: 20 } },
    allosaurus:         { id: 'twistRend',     name: 'Flænserus',         text: 'Efter stormløbet gør dit næste bid # % mere skade inden for # sek.', args: [60, 3], icon: 'serrated_teeth', empower: [1.6, 3] },
    deinosuchus:        { id: 'twistDeathgrip',name: 'Knusende greb',          text: 'Gabstormen får dyr inden for # pixels til at vakle i # sek.', args: [80, 1.2], icon: 'serrated_teeth', aoe: { r: 80, stagger: 1.2, brk: 15 } },
    deinonychus:        { id: 'twistFeather',  name: 'Seglklodans',          text: 'Efter finten gør dit næste bid # % mere skade inden for # sek.', args: [60, 2], icon: 'escape', empower: [1.6, 2] },
    compy:              { id: 'twistSnap',     name: 'Smutbid',           text: 'Efter et smut gør dit næste bid dobbelt skade inden for # sek.', args: [1.5], icon: 'escape', empower: [2, 1.5] },
    triceratops:        { id: 'twistHerdwall', name: 'Flokmur',           text: 'Hornstormen giver # skjold i # sek.', args: [18, 4], icon: 'armor', shield: [18, 4] },
    tyrannosaurus:      { id: 'twistTyrant',   name: 'Tyrannens brøl',    text: 'Brølet giver # skjold i # sek. og heler # liv.', args: [20, 4, 8], icon: 'armor', shield: [20, 4], heal: 8 },
  };
  // Økologi-pres. Blood trail: below 40 % health the nearest unalerted predator within 650 px catches your scent
  // every `every[level]` s (milder early; off on level 1). Herd defence: hitting a herd animal calls herd mates within
  // 260 px. Carrion guests: by day, 30 % of kills on levels 1-3 draw two compys.
  const ECOLOGY = { trailBelow: .4, trailRange: 650, trailEvery: [0, 7, 5, 4, 3, 3, 3, 3], herdRange: 260, carrionChance: .3, carrionCount: 2, carrionStages: 3 };
  // Elite traits: every elite (not bosses) gets one.
  const ELITE_AFFIXES = {
    brutal:  { name: 'BRUTAL',      color: '#c6663c', damage: 1.3 },
    armored: { name: 'PANSRET',     color: '#929387', hp: 1.5 },
    swift:   { name: 'LYNHURTIG',   color: '#a2d4c1', speed: 1.2 },
    thorns:  { name: 'TORNET',      color: '#586d38', thorns: 3 },
    regen:   { name: 'SELVHELENDE', color: '#69a4a0', regen: .02 },
  };
  const AFFIX_ORDER = ['brutal', 'armored', 'swift', 'thorns', 'regen'];
  // FEATURES.affixStages (loot step 5): later levels stack more traits on one elite (count by level index, the ash level
  // uses the last). Every trait past the first pays: +2 DNA on the kill and +25 % luck on its meat roll (lootTables).
  const AFFIX_STAGES = { count: [1, 1, 1, 2, 2, 2, 3, 3], dna: 2, luck: .25 };
  const hasAffix = (e, a) => e.affix === a || !!(e.affixes && e.affixes.includes(a));
  const affixCount = r => AFFIX_STAGES.count[Math.min(r.levelIndex || 0, AFFIX_STAGES.count.length - 1)];
  // Hard baby start (optional, menu toggle): 60 % health, 70 % damage, 25 % less XP per level; each boss kill grows
  // you +15 % (up to 115 % damage). 50 % more DNA for the whole run.
  const BABY = { hp: .6, damage: .7, perBoss: .15, cap: 1.15, xp: .75, dna: 1.5, scale: .72, hatch: 1.6 };
  // Døgnrytme: predators hunt at dusk and night (up to +20 % damage, +10 % speed, scaled by darkness, sight 85 %
  // instead of 60 % at night); herbivores drink at dusk; compys scavenge kills by day. Night kills give +50 % DNA.
  const CIRCADIAN = { damage: .2, speed: .1, nightSight: .85, nightDNA: 1.5, duskThirst: .7 };
  // Rav: one hidden amber piece per journey level, far from the start; E picks it up (+3 DNA).
  // FEATURES.tarTotem (loot step 5, needs lootTables): from level 2 a tar-pit totem stands far from the start. Touch it
  // (E) before the boss appears to make a pact: the boss gets one elite trait (+25 % HP with armored as usual), and
  // its kill pays double: the level DNA again and, with FEATURES.relics, a second boss relic. Placement uses the run
  // seed, not the game's random stream, so nothing else in the run moves.
  // FEATURES.rottenMeat (loot step 5): meat from a corpse that has started to spoil (corpse.age > spoilAt) is rotten.
  // A bite gives "Rådden mave": 60 s of +30 % damage taken. Survive it and the stomach hardens for the rest of the run:
  // +6 max health, up to 3 times. Jernmave (ironStomach) shrugs it off: no risk, no reward.
  const ROTTEN = { seconds: 60, taken: 1.3, maxHealth: 6, max: 3 };
  const TAR_TOTEM = { fromLevel: 1, minDistance: 700, reach: 70, hp: 1.25 };
  // FEATURES.currencies: one amber altar per journey level, placed from the run seed (not the main random stream).
  // E with enough rav buys a loot roll (GAME_TABLES.amber_altar); the price grows ×1,4 and the altar closes after 2 buys.
  const ALTAR = { minDistance: 500, reach: 70 };
  const AMBER = { dna: 3, minDistance: 900, reach: 70, glint: 260, ring: [60, 85, 110], margin: 14, hint: 400 };

  function install(C) {
    const F = C.FEATURES, G = C.Game.prototype;
    for (const [flag, on] of Object.entries({ huntStreak: true, powerups: true, abilityTwists: true, ecologyPressure: true, eliteAffixes: true, babyMode: true, circadian: true, amber: true, ambientLife: true, foodTheftCount: true, glideOver: true, remoteRares: true, packLimits: true, critters: true }))
      if (F[flag] === undefined) F[flag] = on;
    const PREDATOR = kind => !!C.SPECIES[kind] && C.SPECIES[kind].damage > 0 && !C.HERBIVORE_KINDS.has(kind);
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const timed = (r, key) => (r.extras && r.extras.buffs[key] || 0) > 0;
    const X = r => r.extras || (r.extras = { buffs: {}, streak: 0, lastKillAt: -99, comet: 0, empower: null, speedBoost: null, trailClock: 0, powerups: 0, twists: 0, guests: 0, defenders: 0, trails: 0, amber: 0, amberLevels: [], foodStolen: 0, nightKills: 0 });

    // Twists are legendary species mutations, so they appear in level-up offers like any other legendary.
    for (const [species, t] of Object.entries(TWISTS)) if (!C.MUTATIONS.some(m => m.id === t.id))
      C.MUTATIONS.push({ id: t.id, name: t.name, text: t.args.reduce((s, a) => s.replace('#', String(a).replace('.', ',')), t.text), icon: t.icon, tag: 'ability', max: 1, rarity: 'legendary', species, twist: true });
    const mutationAvailable = G.mutationAvailable;
    G.mutationAvailable = function (m) { return (!m.twist || F.abilityTwists) && mutationAvailable.call(this, m); };
    const twistOf = r => { const t = TWISTS[r.species]; return F.abilityTwists && t && r.mutations[t.id] > 0 ? t : null; };

    const dayPhase = seconds => { const D = C.DAYNIGHT, t = ((seconds % D.period) + D.period) % D.period; return t < D.dusk ? 'day' : t < D.night ? 'dusk' : t < D.dawn ? 'night' : 'dawn'; };
    const predatorBoost = (r, e) => F.circadian && F.dayNight && e && !e.boss && PREDATOR(e.kind) ? (r.darkness || 0) : 0;

    // ---- start: baby start, streak/powerup state, shrines, amber
    const start = G.start;
    G.start = function (options = {}) {
      const out = start.call(this, options), r = this.run; if (!r) return out;
      const x = X(r);
      x.baby = F.babyMode && (options.baby ?? this.save.settings.babyHard) && !r.secret ? { growth: BABY.damage, baseHP: r.maxHealth, hatch: BABY.hatch } : null;
      if (x.baby) { r.maxHealth = Math.round(r.maxHealth * BABY.hp); r.health = r.maxHealth; r.nextXP = Math.max(1, Math.round(r.nextXP * BABY.xp)); r.invulnerable = Math.max(r.invulnerable || 0, BABY.hatch); this.emit('hatch'); }
      r.dayPhase = 'day'; placeLevelExtras(this);
      return out;
    };
    const nextStage = G.nextStage;
    G.nextStage = function () { const r = this.run, level = r && r.levelIndex, out = nextStage.call(this); if (this.run && this.run.levelIndex !== level) placeLevelExtras(this); return out; };
    function placeLevelExtras(g) {
      const r = g.run; if (!r || !r.map || !r.map.habitats) return;
      const ground = h => !C.isWater(r.stage, r.map, h, -40) && !(C.isLava && C.isLava(r.stage, r.map, h));
      // Rare albinos live only in remote areas (idea bank): the rare site moves to the farthest suitable habitat.
      if (F.remoteRares) for (const site of r.map.sites || []) {
        const e = site.type === 'rare' && !site.claimed && r.enemies.find(o => o.id === site.animalId); if (!e) continue;
        const far = r.map.habitats.filter(ground).map(h => g.habitatPosition('parasaurolophus', h)).filter(Boolean)
          .sort((a, b) => Math.hypot(b.x - r.player.x, b.y - r.player.y) - Math.hypot(a.x - r.player.x, a.y - r.player.y))[0];
        if (far && Math.hypot(far.x - r.player.x, far.y - r.player.y) > Math.hypot(e.x - r.player.x, e.y - r.player.y)) { site.x = e.x = e.homeX = far.x; site.y = e.y = e.homeY = far.y; }
      }
      r.tarTotem = null;
      if (F.tarTotem && F.lootTables && r.campaign === C.LEVELS && r.levelIndex >= TAR_TOTEM.fromLevel) {
        const far = r.map.habitats.filter(h => ground(h) && dist(h, r.player) > TAR_TOTEM.minDistance && !(r.map.sites || []).some(s => dist(s, h) < 120));
        const h = far.length ? far[((r.seed >>> 0) + 7919 * r.levelIndex) % far.length] : null;
        if (h) r.tarTotem = { x: Math.round(h.x - 20), y: Math.round(h.y + 16), level: r.levelIndex, pact: false };
      }
      r.amberAltar = null;
      if (F.currencies && F.lootTables && r.campaign === C.LEVELS) {
        const spots = r.map.habitats.filter(h => ground(h) && dist(h, r.player) > ALTAR.minDistance && !(r.map.sites || []).some(s => dist(s, h) < 120) && !(r.tarTotem && dist(r.tarTotem, h) < 200));
        // Start at a seeded habitat and take the first ring spot that no tree, bush or rock is drawn over (as for amber).
        const k = spots.length ? ((r.seed >>> 0) + 104729 * (r.levelIndex + 1)) % spots.length : 0, order = [...spots.slice(k), ...spots.slice(0, k)].slice(0, 40);
        let p = null;
        find: for (const h of order) for (const radius of AMBER.ring) for (let i = 0; i < 12; i++) {
          const q = { x: Math.round(h.x + Math.cos(i * Math.PI / 6) * radius), y: Math.round(h.y + Math.sin(i * Math.PI / 6) * radius) };
          if (dist(q, r.player) > ALTAR.minDistance && amberClear(r, q)) { p = q; break find; }
        }
        if (p) r.amberAltar = { x: p.x, y: p.y, level: r.levelIndex, buys: 0, price: C.CURRENCY.altar.price };
      }
      r.powerups = [];
      if (F.powerups) {
        const spots = r.map.habitats.filter(h => ground(h) && dist(h, r.player) > POWERUP_SPAWN.shrineMinDistance);
        for (let i = 0; i < POWERUP_SPAWN.shrines && spots.length; i++) { const h = spots.splice(Math.floor(g.random() * spots.length), 1)[0]; dropPowerup(g, h.x, h.y, null, true); }
      }
      // One amber piece per journey level, in the habitat farthest from the start that is still dry ground.
      if (F.amber && r.campaign === C.LEVELS && !X(r).amberLevels.includes(r.levelIndex)) {
        const far = r.map.habitats.filter(h => ground(h) && dist(h, r.player) > AMBER.minDistance && !(r.map.sites || []).some(s => dist(s, h) < 120)).sort((a, b) => dist(b, r.player) - dist(a, r.player));
        const h = far[Math.floor(g.random() * Math.min(3, far.length))];
        r.amberPiece = h ? { x: Math.round(h.x + 18), y: Math.round(h.y - 12), level: r.levelIndex } : null;
        // FEATURES.amberFair: still far away at the edge of the vegetation, but never fully under a tree, bush or rock.
        if (F.amberFair && h) { const spot = amberSpot(g, [h, ...far.filter(o => o !== h)]); if (spot) Object.assign(r.amberPiece, spot); }
      } else r.amberPiece = null;
    }
    // A free amber spot: AMBER.ring px out from a habitat, dry, inside the map, clear of props that are drawn over it.
    function amberClear(r, p) {
      const m = r.map, size = d => ((C.PROP_SIZE || {})[d.path] || ['soft', 30])[1] * (d.visualScale || 1);
      if (p.x < 80 || p.y < 110 || p.x > m.width - 80 || p.y > m.height - 80) return false;
      if (C.isWater(r.stage, m, p, -40) || (C.isLava && C.isLava(r.stage, m, p))) return false;
      if ((m.rocks || []).some(o => dist(o, p) < (o.radius || 22) + 24)) return false;
      if ([...(m.sites || []), ...(m.events || [])].some(o => dist(o, p) < 90)) return false;
      if (C.coverAt && C.coverAt(m, p)) return false;
      // A prop sprite stands on its anchor and reaches up, so test against a centre raised by part of its radius.
      return ![...(m.decorations || []), ...(m.forage || [])].some(d => { const k = size(d); return dist({ x: d.x, y: d.y - k * .6 }, p) < k + AMBER.margin; });
    }
    function amberSpot(g, habitats) {
      const r = g.run, turn = (habitats[0].roll || 0) * Math.PI * 2; // from the map, so the run's random stream is untouched
      for (const h of habitats) for (const radius of AMBER.ring) for (let i = 0; i < 12; i++) {
        const a = turn + i * Math.PI / 6, p = { x: Math.round(h.x + Math.cos(a) * radius), y: Math.round(h.y + Math.sin(a) * radius) };
        if (dist(p, r.player) > AMBER.minDistance && amberClear(r, p)) return p;
      }
      return null;
    }
    function dropPowerup(g, x, y, type, shrine = false) {
      const r = g.run;
      type = type || TEMP_POWERUPS[Math.floor(g.random() * TEMP_POWERUPS.length)];
      (r.powerups || (r.powerups = [])).push({ id: ++g.nextId, kind: 'powerup', type, x: Math.round(x), y: Math.round(y), value: 1, shrine });
    }
    function applyPowerup(g, p) {
      const r = g.run, x = X(r), def = POWERUPS[p.type]; x.powerups++;
      if (p.type === 'amber') { r.shield = Math.max(r.shield || 0, 35); r.shieldTime = Math.max(r.shieldTime || 0, def.time); }
      else if (p.type === 'heart') { r.maxHealth += 12; r.health = Math.min(r.maxHealth, r.health + 12); }
      else if (p.type === 'comet') { x.comet = 4; x.buffs.comet = def.time; }
      else x.buffs[p.type] = def.time;
      r.effects.push({ x: r.player.x, y: r.player.y - 34, text: def.name.toUpperCase(), color: def.color, life: 1.4 });
      g.emit('powerup', { powerup: p.type, shrine: !!p.shrine });
    }

    // ---- outgoing damage: streak, rage, baby size, twist empower, comet crits, leech
    const outMul = r => {
      const x = X(r); let k = 1;
      if (F.huntStreak) k *= 1 + STREAK.damage * x.streak;
      if (timed(r, 'rage')) k *= 1.3;
      if (x.baby) k *= x.baby.growth;
      if (x.empower && x.empower.until > r.seconds) k *= x.empower.k;
      return k;
    };
    const resolveBite = G.resolveBite;
    G.resolveBite = function (facing) {
      const r = this.run, x = X(r), before = new Map(r.enemies.map(e => [e, e.hp])), forced = x.comet > 0, saved = r.roarCrit;
      if (forced) r.roarCrit = 1;
      const out = resolveBite.call(this, facing);
      if (forced) r.roarCrit = saved && r.roarCrit ? saved : 0;
      let dealt = 0, hit = false;
      const k = outMul(r);
      for (const [e, hp] of before) {
        const d = hp - e.hp; if (!(d > 0)) continue; hit = true;
        const extra = d * (k - 1); e.hp -= extra; dealt += d + extra; if (extra > 0) r.stats.damageDealt += extra;
        if (F.eliteAffixes && hasAffix(e, 'thorns') && e.hp > 0) this.damage(ELITE_AFFIXES.thorns.thorns, { ...e, hazard: true, thorns: true });
      }
      if (hit) {
        if (forced) { x.comet--; if (x.comet <= 0) x.buffs.comet = 0; }
        if (x.empower && x.empower.until > r.seconds) x.empower = null;
        const leech = timed(r, 'leech') ? .2 : 0;
        if (leech && r.health > 0) { const b = r.health; r.health = Math.min(r.maxHealth, r.health + dealt * leech); r.stats.healing += r.health - b; }
      }
      return out;
    };
    const attack = G.attack;
    G.attack = function () {
      const ok = attack.call(this); if (!ok) return ok;
      const r = this.run;
      if (timed(r, 'rage')) { const k = .85; r.attackCooldown *= k; r.attackDuration *= k; r.attack.duration *= k; r.attack.contactTime *= k; }
      return ok;
    };

    // ---- Raptor pack per species (FEATURES.packLimits): how many wild velociraptors a species can recruit.
    // Species not listed keep PACK.max (2). Jonas chose "by strength" (2026-10-14): the strongest species in the
    // 420-run sim (Spinosaurus mean level 6.6; Baryonyx, Ankylosaurus, Pteranodon, Therizinosaurus, Allosaurus
    // 4.4-5.1) get 0-1 raptors. The sim bots rarely recruit (0-0.2 allies a run), so the measured lift is noise;
    // the cap guards against human players stacking a pack on an already strong species.
    const PACK_LIMITS = { spinosaurus: 0, baryonyx: 1, ankylosaurus: 1, pteranodon: 1, therizinosaurus: 1, allosaurus: 1 };
    // Species identity: the Stegosaurus tank with its 360° tail sweep holds the line itself, so it hires one raptor.
    if (F.speciesIdentity) PACK_LIMITS.stegosaurus = 1;
    const feedRaptor = G.feedRaptor;
    if (feedRaptor) G.feedRaptor = function () {
      const r = this.run, P = C.PACK, max = P.max, limit = F.packLimits && r && PACK_LIMITS[r.species] !== undefined ? PACK_LIMITS[r.species] : max;
      P.max = Math.min(max, limit); try { return feedRaptor.apply(this, arguments); } finally { P.max = max; }
    };
    // ---- Pteranodon glides over lava and deep water (idea bank): while the glide ability runs it takes no lava burn,
    // keeps full speed and may cross into deep water. Landing in deep water just slows it like any non-swimmer.
    const gliding = (g, entity) => { const r = g.run; return F.glideOver && r && entity === r.player && r.species === 'pteranodon' && r.pounce > 0; };
    const terrainAt = G.terrainAt;
    G.terrainAt = function (entity) { const t = terrainAt.call(this, entity); return gliding(this, entity) && (t.kind === 'lava' || t.kind === 'deep') ? { kind: 'air', speed: 1, cover: false } : t; };
    // ---- movement: streak, wind, twist speed, frost, elite swift, crepuscular predators
    const travel = G.travel;
    G.travel = function (entity, dx, dy) {
      const r = this.run;
      if (gliding(this, entity)) return this.move(entity, dx, dy);
      if (r && r.extras) {
        const x = r.extras;
        if (entity === r.player) {
          let k = 1;
          if (F.huntStreak) k *= 1 + STREAK.speed * x.streak;
          if (timed(r, 'wind')) k *= 1.35;
          if (x.speedBoost && x.speedBoost.until > r.seconds) k *= x.speedBoost.k;
          dx *= k; dy *= k;
        } else if (entity && entity.kind) {
          let k = 1;
          if (timed(r, 'frost') && dist(entity, r.player) < POWERUP_SPAWN.frostRange) k *= .5;
          if (F.eliteAffixes && hasAffix(entity, 'swift')) k *= ELITE_AFFIXES.swift.speed;
          const night = predatorBoost(r, entity); if (night) k *= 1 + CIRCADIAN.speed * night;
          dx *= k; dy *= k;
        }
      }
      return travel.call(this, entity, dx, dy);
    };

    // ---- incoming damage: brutal elites, crepuscular predators
    const damage = G.damage;
    G.damage = function (amount, source) {
      const r = this.run;
      if (r && source && !source.hazard) {
        if (F.eliteAffixes && hasAffix(source, 'brutal')) amount *= ELITE_AFFIXES.brutal.damage;
        const night = predatorBoost(r, source); if (night) amount *= 1 + CIRCADIAN.damage * night;
      }
      if (F.rottenMeat && r && X(r).rot && r.seconds < X(r).rot.until) amount *= ROTTEN.taken;
      return damage.call(this, amount, source);
    };
    const eat = G.eat;
    G.eat = function (dt, input) {
      const r = this.run; if (!F.rottenMeat || !r) return eat.call(this, dt, input);
      const bites = r.stats.meatEaten, before = r.eating && r.eating.corpseId, out = eat.call(this, dt, input);
      if (r.stats.meatEaten > bites && !r.mutations.ironStomach) {
        const id = r.eating && r.eating.corpseId !== undefined ? r.eating.corpseId : before, corpse = r.corpses.find(c => c.id === id), x = X(r);
        if (corpse && corpse.age > (corpse.spoilAt || 7) && !(x.rot && r.seconds < x.rot.until) && (x.rotStacks || 0) < ROTTEN.max) {
          x.rot = { until: r.seconds + ROTTEN.seconds }; r.stats.rottenBites = (r.stats.rottenBites || 0) + 1;
          r.effects.push({ x: r.player.x, y: r.player.y - 36, text: 'RÅDDENT KØD · +30 % SKADE I 60 S', color: '#799447', life: 1.8 }); this.emit('rotten', {});
        }
      }
      return out;
    };

    // ---- kills: streak, powerup drops, night DNA, baby growth, carrion guests
    const kill = G.kill;
    G.kill = function (e) {
      const r = this.run, fresh = e && !e.rewarded, dnaBefore = r ? r.dna : 0;
      const out = kill.call(this, e);
      if (!fresh || !e.rewarded || !this.run) return out;
      const x = X(r);
      if (F.eliteAffixes && F.affixStages && !e.boss && e.affixes && e.affixes.length > 1) this.addDNA(AFFIX_STAGES.dna * (e.affixes.length - 1));
      if (F.tarTotem && e.boss && e.tarred) { this.addDNA(this.currentLevel().dna); this.grantRelic && this.grantRelic('boss'); this.emit('tar_reward', { level: r.levelIndex }); }
      if (F.huntStreak && !e.boss) {
        x.streak = r.seconds - x.lastKillAt <= STREAK.window ? Math.min(STREAK.max, x.streak + 1) : 1; x.lastKillAt = r.seconds;
        x.streakMax = Math.max(x.streakMax || 0, x.streak);
        if (x.streak >= STREAK.healFrom) { const b = r.health; r.health = Math.min(r.maxHealth, r.health + STREAK.heal); r.stats.healing += r.health - b; }
        if (x.streak >= 2) this.emit('streak', { stacks: x.streak });
      }
      if (F.powerups && !e.boss) {
        if ((e.elite || e.rare) && POWERUP_SPAWN.eliteDrop) dropPowerup(this, e.x + 24, e.y);
        else if (this.random() < POWERUP_SPAWN.killChance * (this.luck ? this.luck() : 1)) dropPowerup(this, e.x + 24, e.y);
      }
      if (F.circadian && F.dayNight && r.night && !e.boss) { x.nightKills++; const bonus = Math.round((r.dna - dnaBefore) * (CIRCADIAN.nightDNA - 1)); if (bonus > 0) this.addDNA(bonus, true); }
      if (x.baby && e.boss) { const add = Math.round(x.baby.baseHP * BABY.perBoss * BABY.hp); x.baby.growth = Math.min(BABY.cap, x.baby.growth + BABY.perBoss); r.maxHealth += add; r.health = Math.min(r.maxHealth, r.health + add); r.effects.push({ x: r.player.x, y: r.player.y - 40, text: 'VOKSER', color: '#a8b15b', life: 1.2 }); }
      if (F.ecologyPressure && !e.boss && e.kind !== 'compy' && r.stage < ECOLOGY.carrionStages && (!F.dayNight || !r.night) && this.random() < ECOLOGY.carrionChance) {
        for (let i = 0; i < ECOLOGY.carrionCount; i++) {
          const a = i * Math.PI + this.random(), p = { x: Math.round(e.x + Math.cos(a) * 140), y: Math.round(e.y + Math.sin(a) * 140) };
          if (!C.suitableHabitat(r.stage, r.map, 'compy', p)) continue;
          const g2 = this.spawn('compy', p); if (g2) { g2.alert = false; g2.carrionGuest = true; x.guests++; }
        }
      }
      return out;
    };
    // Baby start: 50 % more DNA from everything in the run.
    const addDNA = G.addDNA;
    G.addDNA = function (amount, quiet = false) {
      const r = this.run;
      if (r && r.extras && r.extras.baby && amount > 0) amount = Math.round(amount * BABY.dna);
      return addDNA.call(this, amount, quiet);
    };
    const maybeLevelUp = G.maybeLevelUp;
    G.maybeLevelUp = function () { const r = this.run, before = r && r.level, out = maybeLevelUp.call(this); if (r && r.extras && r.extras.baby && r.level !== before) r.nextXP = Math.max(1, Math.round(r.nextXP * BABY.xp)); return out; };

    const breakBoss = G.breakBoss;
    G.breakBoss = function (e, amount) {
      const was = e && e.mode, out = breakBoss.call(this, e, amount);
      if (F.powerups && POWERUP_SPAWN.bossBreakDrop && e && was !== 'broken' && e.mode === 'broken' && !e.heartDropped) { e.heartDropped = true; dropPowerup(this, e.x + 60, e.y, 'heart'); }
      return out;
    };

    // ---- herd defence
    const provoke = G.provoke;
    G.provoke = function (e) {
      const out = provoke.call(this, e), r = this.run;
      if (F.ecologyPressure && r && e && e.herdId && e.damage && !e.boss && !e.defended && !e.thiefPack) {
        e.defended = true;
        for (const o of r.enemies) if (o !== e && o.herdId === e.herdId && o.hp > 0 && !o.alert && dist(o, e) < ECOLOGY.herdRange) { o.defended = true; provoke.call(this, o); X(r).defenders++; }
      }
      return out;
    };

    // ---- amber: E next to the piece picks it up
    const interact = G.interact;
    G.interact = function () {
      const r = this.run;
      if (F.amber && r && this.phase === 'playing' && r.amberPiece && dist(r.amberPiece, r.player) < AMBER.reach) {
        const x = X(r); x.amber++; x.amberLevels.push(r.amberPiece.level); r.amberPiece = null; r.exploration++;
        this.addDNA(AMBER.dna, true); this.save.lifetime.amber = (this.save.lifetime.amber || 0) + 1; this.persist();
        r.effects.push({ x: r.player.x, y: r.player.y - 36, text: 'RAV FUNDET · ' + x.amber + '/' + C.LEVELS.length, color: '#dfbc52', life: 1.8 });
        this.emit('amber', { count: x.amber });
        if (F.currencies) this.earnCurrency('rav', 1, r.player.x, r.player.y - 20);
        return true;
      }
      if (F.tarTotem && r && this.phase === 'playing' && r.tarTotem && !r.tarTotem.pact && !r.bossSpawned && dist(r.tarTotem, r.player) < TAR_TOTEM.reach) {
        r.tarTotem.pact = true; r.stats.tarPacts = (r.stats.tarPacts || 0) + 1;
        r.effects.push({ x: r.player.x, y: r.player.y - 36, text: 'TJÆREPAGT · BOSSEN BLIVER STÆRKERE · DOBBELT LOOT', color: '#bb80d9', life: 2.2 });
        this.emit('tar_pact', { level: r.levelIndex });
        return true;
      }
      const altar = r && r.amberAltar;
      if (F.currencies && F.lootTables && altar && this.phase === 'playing' && altar.buys < C.CURRENCY.altar.buys && dist(altar, r.player) < ALTAR.reach) {
        const cur = r.currency || (r.currency = { rav: 0, fossils: 0, iridium: 0 });
        if (cur.rav < altar.price) { this.emit('altar_poor', { price: altar.price, rav: cur.rav }); return true; }
        cur.rav -= altar.price; altar.buys++; altar.price = Math.ceil(altar.price * C.CURRENCY.altar.grow); r.stats.altarBuys = (r.stats.altarBuys || 0) + 1;
        this.openNestCache({ x: altar.x, y: altar.y + 10, id: 'altar' + altar.level + ':' + altar.buys }, { table: 'amber_altar', event: 'amber_altar', label: 'Ravalter', source: 'altar' });
        return true;
      }
      return interact.call(this);
    };

    // ---- per-frame: timers, powerup pickup, elites, twists, streak decay, blood trail, day rhythm
    const step = G.step;
    G.step = function (dt, input = {}) {
      const r = this.run; if (this.phase !== 'playing' || !r) return step.call(this, dt, input);
      const x = X(r);
      for (const k of Object.keys(x.buffs)) x.buffs[k] = Math.max(0, x.buffs[k] - dt);
      if (x.baby && x.baby.hatch > 0) x.baby.hatch = Math.max(0, x.baby.hatch - dt);
      if (timed(r, 'stamina')) { r.stamina = 100; r.winded = 0; }
      // A quiet chime the first time you come near this level's amber: it is close, but not where.
      if (F.amber && F.amberFair && r.amberPiece && !r.amberPiece.hinted && dist(r.amberPiece, r.player) < AMBER.hint) { r.amberPiece.hinted = true; this.emit('amber_near'); }
      // Powerups live in their own list (r.powerups), so meat, thieves and core pickup rules never see them.
      if (F.powerups) {
        const radius = POWERUP_SPAWN.pickupRadius, taken = (r.powerups || []).filter(p => dist(p, r.player) < radius);
        if (taken.length) { r.powerups = r.powerups.filter(p => !taken.includes(p)); for (const p of taken) applyPowerup(this, p); }
      }
      if (F.rottenMeat && x.rot && r.seconds >= x.rot.until) {
        x.rot = null; x.rotStacks = (x.rotStacks || 0) + 1; r.maxHealth += ROTTEN.maxHealth; r.health += ROTTEN.maxHealth;
        r.effects.push({ x: r.player.x, y: r.player.y - 36, text: 'HÆRDET MAVE · +' + ROTTEN.maxHealth + ' LIV', color: '#799447', life: 1.8 }); this.emit('rot_cured', { stacks: x.rotStacks });
      }
      if (F.tarTotem && r.tarTotem && r.tarTotem.pact) for (const e of r.enemies) if (e.boss && !e.tarred) {
        e.tarred = true; e.affix = AFFIX_ORDER[((r.seed >>> 0) + r.levelIndex) % AFFIX_ORDER.length]; e.affixes = [e.affix];
        e.hp *= TAR_TOTEM.hp; e.maxHP *= TAR_TOTEM.hp; if (e.affix === 'armored') { e.hp *= ELITE_AFFIXES.armored.hp; e.maxHP *= ELITE_AFFIXES.armored.hp; }
      }
      if (F.eliteAffixes) for (const e of r.enemies) if (e.elite && !e.affix && !e.boss) {
        e.affix = AFFIX_ORDER[(e.id * 7 + r.levelIndex) % AFFIX_ORDER.length];
        if (F.affixStages) { const first = AFFIX_ORDER.indexOf(e.affix), step = 1 + e.id % 4, n = affixCount(r);
          e.affixes = Array.from({ length: n }, (_, i) => AFFIX_ORDER[(first + i * step) % AFFIX_ORDER.length]); e.lootLuck = AFFIX_STAGES.luck * (n - 1); }
        if (hasAffix(e, 'armored')) { e.hp *= ELITE_AFFIXES.armored.hp; e.maxHP *= ELITE_AFFIXES.armored.hp; }
      }
      if (F.circadian && F.dayNight) {
        const phase = dayPhase(r.seconds);
        if (phase !== r.dayPhase) {
          r.dayPhase = phase; this.emit('day_phase', { phase });
          if (phase === 'dusk') for (const e of r.enemies) if (!e.boss && C.HERBIVORE_KINDS.has(e.kind)) e.thirst = Math.max(e.thirst || 0, CIRCADIAN.duskThirst);
        }
      } else r.dayPhase = 'day';
      const abilitiesBefore = r.stats.abilities, healthBefore = r.health;
      const out = step.call(this, dt, input);
      if (!this.run || this.run !== r) return out;
      if (r.stats.abilities > abilitiesBefore) { const t = twistOf(r); if (t) applyTwist(this, r, t); }
      if (F.eliteAffixes) for (const e of r.enemies) if (hasAffix(e, 'regen') && e.hp > 0 && e.hp < e.maxHP) e.hp = Math.min(e.maxHP, e.hp + e.maxHP * ELITE_AFFIXES.regen.regen * dt);
      if (F.huntStreak && x.streak && r.seconds - x.lastKillAt > STREAK.window) x.streak = 0;
      const every = ECOLOGY.trailEvery[Math.min(r.levelIndex, ECOLOGY.trailEvery.length - 1)];
      if (F.ecologyPressure && every && r.health < r.maxHealth * ECOLOGY.trailBelow && (x.trailClock += dt) >= every) {
        x.trailClock = 0;
        const hunter = r.enemies.filter(e => !e.boss && !e.alert && !e.guard && e.damage && PREDATOR(e.kind) && dist(e, r.player) < ECOLOGY.trailRange).sort((a, b) => dist(a, r.player) - dist(b, r.player))[0];
        if (hunter) { this.provoke(hunter); hunter.bloodTrail = r.seconds; x.trails++; r.effects.push({ x: hunter.x, y: hunter.y - 30, text: 'BLODSPOR', color: '#8d2028', life: 1 }); }
      }
      if (healthBefore > r.health) x.lastHurtAt = r.seconds;
      return out;
    };
    function applyTwist(g, r, t) {
      const x = X(r); x.twists++;
      if (t.empower) x.empower = { k: t.empower[0], until: r.seconds + t.empower[1] };
      if (t.shield) { r.shield = Math.max(r.shield || 0, t.shield[0]); r.shieldTime = Math.max(r.shieldTime || 0, t.shield[1]); }
      if (t.heal) { const b = r.health; r.health = Math.min(r.maxHealth, r.health + t.heal); r.stats.healing += r.health - b; }
      if (t.speed) x.speedBoost = { k: t.speed[0], until: r.seconds + t.speed[1] };
      for (const e of r.enemies) {
        if (e.hp <= 0 || !e.damage && !t.zap) continue;
        const d = dist(e, r.player);
        if (t.aoe && d < t.aoe.r) { if (e.boss) g.breakBoss(e, t.aoe.brk); else e.stagger = Math.max(e.stagger || 0, t.aoe.stagger); }
        if (t.scare && d < t.scare.r && !e.boss && !e.guard) { e.scaredUntil = r.seconds + t.scare.time; e.alert = false; e.mode = 'flee'; }
        if (t.zap && d < t.zap.r + e.radius) { e.hp -= t.zap.dmg * (x.baby ? x.baby.growth : 1); r.stats.damageDealt += t.zap.dmg; e.lastAttackedAt = r.seconds; g.provoke(e); }
      }
      r.effects.push({ x: r.player.x, y: r.player.y - 44, text: t.name.toUpperCase(), color: '#e9b75a', life: .9 });
      g.emit('twist', { id: t.id });
    }

    // Compys stealing your food count as RunSummary.foodStolen; amber, day-rhythm night kills and the secret level
    // flags go to r.partB so records.js fills the titles that waited for them.
    const emit = G.emit;
    G.emit = function (type, detail) {
      if (type === 'steal' && F.foodTheftCount && this.run && this.run.extras) this.run.extras.foodStolen++;
      return emit.call(this, type, detail);
    };
    const finish = G.finish;
    G.finish = function (victory, ...rest) {
      const r = this.run;
      if (r && r.partB && r.extras) {
        if (F.foodTheftCount) r.partB.foodStolen = r.extras.foodStolen;
        if (F.amber && r.campaign === C.LEVELS) r.partB.secretsFound = r.extras.amber;
        r.partB.babyStart = !!r.extras.baby;
      }
      return finish.call(this, victory, ...rest);
    };
    const settings = G.setSetting;
    G.setSetting = function (key, value) {
      if (key === 'babyHard') { this.save.settings.babyHard = !!value && !!F.babyMode; this.persist(); return; }
      return settings.call(this, key, value);
    };

    // ---- Small ambient animals (FEATURES.critters): frogs at ponds, mice at rock holes and millipedes by plants live in
    // the run, scurry, hop or crawl away from the player instead of vanishing, and one bite makes them vanish with a
    // fitting sound. Jonas (2026-10-15): they give no meat.
    const CRITTER = { mouse: { flee: 130, speed: 150, leash: 220 }, frog: { flee: 100, hop: 40, leash: 160 }, millipede: { flee: 70, speed: 26, leash: 80 }, reach: 8, max: 24 };
    const placeCritters = g => {
      const r = g.run, map = r && r.map; if (!F.critters || !map) return;
      let seed = ((r.seed || 1) ^ 0x3e1c7a55 ^ (r.levelIndex || 0) * 7919) >>> 0; const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      const dry = p => !C.isWater(r.stage, map, p, -10) && !(C.isLava && C.isLava(r.stage, map, p)), list = [];
      if (r.stage < 3) for (const rock of (map.rocks || []).filter((_, i) => i % 5 === 2).slice(0, 10)) { const p = { x: Math.round(rock.x + 28), y: Math.round(rock.y + 18) }; if (dry(p)) list.push({ kind: 'mouse', ...p }); }
      for (const pond of (map.ponds || []).slice(0, 8)) { const a = rnd() * Math.PI * 2, d = (pond.radius || 60) + 8, p = { x: Math.round(pond.x + Math.cos(a) * d), y: Math.round(pond.y + Math.sin(a) * d * .7) }; if (dry(p)) list.push({ kind: 'frog', ...p }); }
      if (r.stage !== 2) for (const h of (map.habitats || []).filter((_, i) => i % 9 === 4).slice(0, 6)) { const p = { x: Math.round(h.x - 30), y: Math.round(h.y + 26) }; if (dry(p)) list.push({ kind: 'millipede', ...p }); }
      r.critters = list.slice(0, CRITTER.max).map((c, i) => ({ ...c, id: 'critter:' + (r.levelIndex || 0) + ':' + i, homeX: c.x, homeY: c.y, phase: rnd() * 6, timer: rnd() * 2, seed: (rnd() * 4294967296) >>> 0, vx: 0, vy: 0, moving: false }));
    };
    const startCritters = G.start;
    G.start = function () { const out = startCritters.apply(this, arguments); if (this.run) this.run.critters = []; placeCritters(this); return out; };
    const nextCritters = G.nextStage;
    G.nextStage = function () { const level = this.run && this.run.levelIndex, out = nextCritters.apply(this, arguments); if (this.run && this.run.levelIndex !== level) placeCritters(this); return out; };
    const frogsHidden = r => F.drought && r.drought;
    const cr = c => { c.seed = (Math.imul(c.seed || 1, 1664525) + 1013904223) >>> 0; return c.seed / 4294967296; }; // own stream, so the game's seeded RNG is untouched
    const stepCritters = G.step;
    G.step = function (dt, input) {
      const out = stepCritters.apply(this, arguments), r = this.run;
      if (!F.critters || !r || !r.critters || this.phase !== 'playing' || !(dt > 0)) return out;
      const map = r.map, pl = r.player, dry = p => !C.isWater(r.stage, map, p, -10) && !(C.isLava && C.isLava(r.stage, map, p));
      for (const c of r.critters) {
        const dx = c.x - pl.x, dy = c.y - pl.y, d = Math.hypot(dx, dy) || 1, home = Math.hypot(c.x - c.homeX, c.y - c.homeY);
        c.timer -= dt; c.moving = false;
        if (c.kind !== 'frog') {
          const T = CRITTER[c.kind], scared = d < T.flee;
          if (scared || c.timer > 0 && (c.vx || c.vy)) {
            if (scared) { let ux = dx / d, uy = dy / d; if (home > T.leash && (ux * (c.homeX - c.x) + uy * (c.homeY - c.y)) < 0) { const t = ux; ux = -uy; uy = t; } c.vx = ux * T.speed; c.vy = uy * T.speed; c.timer = .4; }
            const n = { x: c.x + c.vx * dt, y: c.y + c.vy * dt }; if (dry(n)) { c.x = n.x; c.y = n.y; c.moving = true; c.heading = Math.atan2(c.vy, c.vx); } else c.timer = 0;
          } else if (c.timer <= 0) { const a = Math.atan2(c.homeY - c.y, c.homeX - c.x) + (cr(c) - .5) * 2.4, s = T.speed * (c.kind === 'millipede' ? .7 : .45); c.vx = Math.cos(a) * s; c.vy = Math.sin(a) * s; c.timer = home > T.leash * .2 ? .35 : c.kind === 'millipede' ? 1 + cr(c) * 2 : (cr(c) < .5 ? .25 : -1.5 - cr(c) * 2); if (c.timer < 0) { c.vx = c.vy = 0; c.timer = -c.timer; } }
        } else {
          const T = CRITTER.frog, scared = d < T.flee;
          if (frogsHidden(r)) continue;
          if (c.timer <= 0) {
            let a = scared ? Math.atan2(dy, dx) + (cr(c) - .5) * .8 : home > 50 ? Math.atan2(c.homeY - c.y, c.homeX - c.x) : cr(c) * Math.PI * 2;
            if (scared && home > T.leash) a = Math.atan2(c.homeY - c.y, c.homeX - c.x) + (cr(c) < .5 ? 1.2 : -1.2);
            const n = { x: c.x + Math.cos(a) * T.hop * (scared ? 1 : .5), y: c.y + Math.sin(a) * T.hop * (scared ? 1 : .5) };
            if (dry(n)) { c.x = n.x; c.y = n.y; c.hopTime = .25; c.heading = a; }
            c.timer = scared ? .4 : 1.5 + cr(c) * 2.5;
          }
          if (c.hopTime > 0) { c.hopTime -= dt; c.moving = true; }
        }
        c.x = Math.max(40, Math.min(map.width - 40, c.x)); c.y = Math.max(60, Math.min(map.height - 40, c.y));
      }
      return out;
    };
    const biteCritters = G.resolveBite;
    G.resolveBite = function (facing) {
      const out = biteCritters.apply(this, arguments), r = this.run;
      if (!F.critters || !r || !r.critters || !r.critters.length) return out;
      const dir = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[facing] || [0, 1], range = C.PLAYER_SPECIES[r.species].range + CRITTER.reach + 10 * (r.mutations.reach || 0), tail = C.kindOf(r) === 'ankylosaurus';
      r.critters = r.critters.filter(c => {
        if (c.kind === 'frog' && frogsHidden(r)) return true;
        const dx = c.x - r.player.x, dy = c.y - r.player.y, d = Math.hypot(dx, dy);
        if (d > range || (!tail && d > 24 && (dx * dir[0] + dy * dir[1]) / d < .35)) return true;
        this.burst(c.x, c.y, 'dust', 4, c.x | 0); this.emit('critter', { kind: c.kind }); r.stats.critters = (r.stats.critters || 0) + 1;
        return false;
      });
      return out;
    };

    // Exposed for the renderer, the HUD and tests.
    Object.assign(C, { ALTAR, CRITTER, PACK_LIMITS, packLimitOf: r => Math.min(C.PACK.max, F.packLimits && PACK_LIMITS[r.species] !== undefined ? PACK_LIMITS[r.species] : C.PACK.max), STREAK, POWERUPS, POWERUP_SPAWN, TWISTS, ECOLOGY, ELITE_AFFIXES, AFFIX_STAGES, hasAffix, TAR_TOTEM, ROTTEN, BABY, CIRCADIAN, AMBER, dayPhase, dropPowerup,
      extrasOf: r => r && r.extras || null,
      streakOf: r => (r && r.extras && F.huntStreak ? r.extras.streak : 0),
      buffsOf: r => (r && r.extras ? Object.entries(r.extras.buffs).filter(([, t]) => t > 0).map(([type, time]) => ({ type, time })) : []) });
  }

  return { install, STREAK, POWERUPS, POWERUP_SPAWN, TWISTS, ECOLOGY, ELITE_AFFIXES, AFFIX_STAGES, hasAffix, TAR_TOTEM, ROTTEN, ALTAR, BABY, CIRCADIAN, AMBER };
});
