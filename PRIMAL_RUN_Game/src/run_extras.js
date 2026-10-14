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
    parasaurolophus:    { id: 'twistTrumpet',  name: 'Trompetstød',       text: 'Trompetkaldet skræmmer rovdyr inden for # pixels væk i # sek. og heler # liv.', args: [200, 2, 4], icon: 'escape', scare: { r: 200, time: 2 }, heal: 4 },
    utahraptor:         { id: 'twistButcher',  name: 'Slagterspring',     text: 'Springet gør # skade til alle dyr inden for # pixels.', args: [14, 70], icon: 'serrated_teeth', zap: { r: 70, dmg: 14 } },
    ankylosaurus:       { id: 'twistClub',     name: 'Halekølle-ladning', text: 'Efter panserstillingen gør dit næste haleslag dobbelt skade inden for # sek.', args: [3], icon: 'bone', empower: [2, 3] },
    gallimimus:         { id: 'twistWindrun',  name: 'Vindløb',           text: 'Sprinten giver +# % fart i # sek. og heler # liv.', args: [25, 3, 6], icon: 'powerful_legs', heal: 6, speed: [1.25, 3] },
    pachycephalosaurus: { id: 'twistConcuss',  name: 'Hjernerystelse',    text: 'Hovedstødet får dyr inden for # pixels til at vakle i # sek.', args: [90, 1], icon: 'bone', aoe: { r: 90, stagger: 1, brk: 20 } },
    allosaurus:         { id: 'twistRend',     name: 'Flænserus',         text: 'Efter stormløbet gør dit næste bid # % mere skade inden for # sek.', args: [60, 3], icon: 'serrated_teeth', empower: [1.6, 3] },
    deinosuchus:        { id: 'twistDeathgrip',name: 'Dødsgreb',          text: 'Gabstormen får dyr inden for # pixels til at vakle i # sek.', args: [80, 1.2], icon: 'serrated_teeth', aoe: { r: 80, stagger: 1.2, brk: 15 } },
    deinonychus:        { id: 'twistFeather',  name: 'Fjerdans',          text: 'Efter finten gør dit næste bid # % mere skade inden for # sek.', args: [60, 2], icon: 'escape', empower: [1.6, 2] },
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
  // Hard baby start (optional, menu toggle): 60 % health, 70 % damage, 25 % less XP per level; each boss kill grows
  // you +15 % (up to 115 % damage). 50 % more DNA for the whole run.
  const BABY = { hp: .6, damage: .7, perBoss: .15, cap: 1.15, xp: .75, dna: 1.5, scale: .72, hatch: 1.6 };
  // Døgnrytme: predators hunt at dusk and night (up to +20 % damage, +10 % speed, scaled by darkness, sight 85 %
  // instead of 60 % at night); herbivores drink at dusk; compys scavenge kills by day. Night kills give +50 % DNA.
  const CIRCADIAN = { damage: .2, speed: .1, nightSight: .85, nightDNA: 1.5, duskThirst: .7 };
  // Rav: one hidden amber piece per journey level, far from the start; E picks it up (+3 DNA).
  const AMBER = { dna: 3, minDistance: 900, reach: 70, glint: 260 };

  function install(C) {
    const F = C.FEATURES, G = C.Game.prototype;
    for (const [flag, on] of Object.entries({ huntStreak: true, powerups: true, abilityTwists: true, ecologyPressure: true, eliteAffixes: true, babyMode: true, circadian: true, amber: true, ambientLife: true, foodTheftCount: true }))
      if (F[flag] === undefined) F[flag] = on;
    const PREDATOR = kind => !!C.SPECIES[kind] && C.SPECIES[kind].damage > 0 && !C.HERBIVORE_KINDS.has(kind);
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const timed = (r, key) => (r.extras && r.extras.buffs[key] || 0) > 0;
    const X = r => r.extras || (r.extras = { buffs: {}, streak: 0, lastKillAt: -99, comet: 0, empower: null, speedBoost: null, trailClock: 0, powerups: 0, twists: 0, guests: 0, defenders: 0, trails: 0, amber: 0, amberLevels: [], foodStolen: 0, nightKills: 0 });

    // Twists are legendary species mutations, so they appear in level-up offers like any other legendary.
    for (const [species, t] of Object.entries(TWISTS)) if (!C.MUTATIONS.some(m => m.id === t.id))
      C.MUTATIONS.push({ id: t.id, name: t.name, text: t.args.reduce((s, a) => s.replace('#', String(a).replace('.', ',')), t.text), icon: t.icon, max: 1, rarity: 'legendary', species, twist: true });
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
      if (F.powerups) {
        const spots = r.map.habitats.filter(h => ground(h) && dist(h, r.player) > POWERUP_SPAWN.shrineMinDistance);
        for (let i = 0; i < POWERUP_SPAWN.shrines && spots.length; i++) { const h = spots.splice(Math.floor(g.random() * spots.length), 1)[0]; dropPowerup(g, h.x, h.y, null, true); }
      }
      // One amber piece per journey level, in the habitat farthest from the start that is still dry ground.
      if (F.amber && r.campaign === C.LEVELS && !X(r).amberLevels.includes(r.levelIndex)) {
        const far = r.map.habitats.filter(h => ground(h) && dist(h, r.player) > AMBER.minDistance && !(r.map.sites || []).some(s => dist(s, h) < 120)).sort((a, b) => dist(b, r.player) - dist(a, r.player));
        const h = far[Math.floor(g.random() * Math.min(3, far.length))];
        r.amberPiece = h ? { x: Math.round(h.x + 18), y: Math.round(h.y - 12), level: r.levelIndex } : null;
      } else r.amberPiece = null;
    }
    function dropPowerup(g, x, y, type, shrine = false) {
      const r = g.run;
      type = type || TEMP_POWERUPS[Math.floor(g.random() * TEMP_POWERUPS.length)];
      r.pickups.push({ id: ++g.nextId, kind: 'powerup', type, x: Math.round(x), y: Math.round(y), value: 1, shrine });
    }
    function applyPowerup(g, p) {
      const r = g.run, x = X(r), def = POWERUPS[p.type]; x.powerups++;
      if (p.type === 'amber') { r.shield = Math.max(r.shield || 0, 35); r.shieldTime = Math.max(r.shieldTime || 0, def.time); }
      else if (p.type === 'heart') { r.maxHealth += 12; r.health = Math.min(r.maxHealth, r.health + 12); }
      else if (p.type === 'comet') { x.comet = 4; x.buffs.comet = def.time; }
      else x.buffs[p.type] = def.time;
      r.effects.push({ x: r.player.x, y: r.player.y - 34, text: def.name.toUpperCase(), color: def.color, life: 1.4 });
      g.emit('powerup', { type: p.type, shrine: !!p.shrine });
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
        if (F.eliteAffixes && e.affix === 'thorns' && e.hp > 0) this.damage(ELITE_AFFIXES.thorns.thorns, { ...e, hazard: true, thorns: true });
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

    // ---- movement: streak, wind, twist speed, frost, elite swift, crepuscular predators
    const travel = G.travel;
    G.travel = function (entity, dx, dy) {
      const r = this.run;
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
          if (F.eliteAffixes && entity.affix === 'swift') k *= ELITE_AFFIXES.swift.speed;
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
        if (F.eliteAffixes && source.affix === 'brutal') amount *= ELITE_AFFIXES.brutal.damage;
        const night = predatorBoost(r, source); if (night) amount *= 1 + CIRCADIAN.damage * night;
      }
      return damage.call(this, amount, source);
    };

    // ---- kills: streak, powerup drops, night DNA, baby growth, carrion guests
    const kill = G.kill;
    G.kill = function (e) {
      const r = this.run, fresh = e && !e.rewarded, dnaBefore = r ? r.dna : 0;
      const out = kill.call(this, e);
      if (!fresh || !e.rewarded || !this.run) return out;
      const x = X(r);
      if (F.huntStreak && !e.boss) {
        x.streak = r.seconds - x.lastKillAt <= STREAK.window ? Math.min(STREAK.max, x.streak + 1) : 1; x.lastKillAt = r.seconds;
        x.streakMax = Math.max(x.streakMax || 0, x.streak);
        if (x.streak >= STREAK.healFrom) { const b = r.health; r.health = Math.min(r.maxHealth, r.health + STREAK.heal); r.stats.healing += r.health - b; }
        if (x.streak >= 2) this.emit('streak', { stacks: x.streak });
      }
      if (F.powerups && !e.boss) {
        if ((e.elite || e.rare) && POWERUP_SPAWN.eliteDrop) dropPowerup(this, e.x + 24, e.y);
        else if (this.random() < POWERUP_SPAWN.killChance) dropPowerup(this, e.x + 24, e.y);
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
      // Powerups are taken before core collects pickups (core would treat them as healing).
      if (F.powerups) {
        const radius = POWERUP_SPAWN.pickupRadius, taken = r.pickups.filter(p => p.kind === 'powerup' && dist(p, r.player) < radius);
        if (taken.length) { r.pickups = r.pickups.filter(p => !taken.includes(p)); for (const p of taken) applyPowerup(this, p); }
      }
      if (F.eliteAffixes) for (const e of r.enemies) if (e.elite && !e.affix && !e.boss) {
        e.affix = AFFIX_ORDER[(e.id * 7 + r.levelIndex) % AFFIX_ORDER.length];
        if (e.affix === 'armored') { e.hp *= ELITE_AFFIXES.armored.hp; e.maxHP *= ELITE_AFFIXES.armored.hp; }
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
      if (F.eliteAffixes) for (const e of r.enemies) if (e.affix === 'regen' && e.hp > 0 && e.hp < e.maxHP) e.hp = Math.min(e.maxHP, e.hp + e.maxHP * ELITE_AFFIXES.regen.regen * dt);
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

    // Exposed for the renderer, the HUD and tests.
    Object.assign(C, { STREAK, POWERUPS, POWERUP_SPAWN, TWISTS, ECOLOGY, ELITE_AFFIXES, BABY, CIRCADIAN, AMBER, dayPhase,
      extrasOf: r => r && r.extras || null,
      streakOf: r => (r && r.extras && F.huntStreak ? r.extras.streak : 0),
      buffsOf: r => (r && r.extras ? Object.entries(r.extras.buffs).filter(([, t]) => t > 0).map(([type, time]) => ({ type, time })) : []) });
  }

  return { install, STREAK, POWERUPS, POWERUP_SPAWN, TWISTS, ECOLOGY, ELITE_AFFIXES, BABY, CIRCADIAN, AMBER };
});
