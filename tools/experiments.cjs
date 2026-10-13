'use strict';
/*
 * PRIMAL RUN – overnight experiments (2026-10-13), simulator only.
 * ---------------------------------------------------------------
 * Prototype mechanics that are NOT in the game. They wrap Game.prototype methods of a loaded core.js,
 * so core.js stays untouched and nothing changes unless a run asks for it:
 *
 *   node tools/playstyle_sim.cjs --exp '{"powerups":true}'
 *   node tools/playstyle_sim.cjs --exp '{"powerups":{"only":"rage"}}'
 *
 * Every experiment is off unless named. Numbers live in the tables below. If one is approved it should be
 * re-implemented properly in core.js behind a FEATURES flag; this file is a measuring tool, not game code.
 */

// ---------------------------------------------------------------- tables
// Powerups: glowing pickups on the map (shrines) and rare drops. Each lasts `time` seconds.
const POWERUPS = {
  rage:     { name: 'Blodmåne-kød',   text: '+30 % skade og 15 % hurtigere angreb', time: 12 },
  amber:    { name: 'Ravskjold',      text: '35 skjold',                            time: 10 },
  stamina:  { name: 'Adrenalinbær',   text: 'Uendelig stamina, evner uden cooldown-straf', time: 8 },
  wind:     { name: 'Fjerlethed',     text: '+35 % fart',                           time: 10 },
  frost:    { name: 'Istidsdug',      text: 'Alle dyr inden for 500 px bevæger sig 50 % langsommere', time: 6 },
  comet:    { name: 'Kometstøv',      text: 'De næste 4 bid er kritiske',           time: 20 },
  heart:    { name: 'Hjertefrugt',    text: '+12 maks. liv resten af runnet og 20 heling', time: 0 },
  leech:    { name: 'Vampyrbregne',   text: '20 % af din skade heler dig',          time: 12 },
};
const POWERUP_SPAWN = { shrines: 3, killChance: .05, eliteDrop: true, bossBreakDrop: true };

// Mechanics
const STREAK = { window: 5, max: 5, damage: .06, speed: .04, healFrom: 3, heal: 5 };      // Jagtrus
const COUNTER = { time: 2, damage: .4 };                                                   // Kontra
const RAGE_METER = { fill: 160, time: 6, damage: .35, attackSpeed: .2, leech: .15 };      // Urraseri
const BABY = { hp: .6, damage: .7, perBoss: .15, cap: 1.15, xp: .75 };                     // Baby-start
const ELITE_AFFIX = { hp: 1.5, damage: 1.3, speed: 1.2, thorns: 3, regen: .02 };           // Elite-egenskaber
const BLOOD_TRAIL = { below: .4, every: 3, range: 650 };                                   // Blodspor
const HERD_DEFENSE = { range: 260 };                                                       // Flokforsvar
const CARRION = { chance: .3, count: 2 };                                                  // Ådselgæster
const NIGHT_HUNT = { damage: 1.2, speed: 1.1, dna: 1.5 };                                  // Døgnrytme
const BOUNTY = { every: 60, damage: .0, dnaMul: 3, buff: 'rage' };                         // Dusørjagt

// New ability twists for current and upcoming species (on top of the existing ability).
// empower: next bite ×k within t s · aoe: stagger/break in radius · shield · heal · scare · slow · zap: damage in radius
const ABILITY2 = {
  deinonychus:       { name: 'Fjerdans',        empower: [1.6, 2] },
  velociraptor:      { name: 'Flokhvin',        aoe: { r: 120, stagger: .5, brk: 10 } },
  utahraptor:        { name: 'Slagterspring',   zap: { r: 70, dmg: 14 } },
  compy:             { name: 'Smutbid',         empower: [2, 1.5] },
  pachycephalosaurus:{ name: 'Hjernerystelse',  aoe: { r: 90, stagger: 1, brk: 20 } },
  carnotaurus:       { name: 'Tyrefægter',      aoe: { r: 80, stagger: .8, brk: 15 } },
  ankylosaurus:      { name: 'Halekølle-ladning', empower: [2, 3] },
  gallimimus:        { name: 'Vindløb',         heal: 6, speed: [1.25, 3] },
  baryonyx:          { name: 'Vandsprøjt',      slow: { r: 140, time: 2.5 } },
  tyrannosaurus:     { name: 'Kæbelås',         empower: [2.2, 3] },
  triceratops:       { name: 'Flokmur',         shield: [18, 4] },
  deinosuchus:       { name: 'Dødsgreb',        aoe: { r: 80, stagger: 1.2, brk: 15 } },
  allosaurus:        { name: 'Flænserus',       empower: [1.6, 3] },
  spinosaurus:       { name: 'Sejlskræk',       scare: { r: 220, time: 2 } },
  stegosaurus:       { name: 'Thagomizer-retur',zap: { r: 110, dmg: 12 } },
  parasaurolophus:   { name: 'Trompetstød',     scare: { r: 200, time: 2 }, heal: 4 },
  therizinosaurus:   { name: 'Høstkløer',       zap: { r: 80, dmg: 15 } },
  pteranodon:        { name: 'Styrtdyk',        zap: { r: 70, dmg: 16 } },
  microraptor:       { name: 'Fjerflimmer',     shield: [10, 2], empower: [1.5, 2] },
  pachyrhinosaurus:  { name: 'Panserflok',      shield: [16, 4] },
  oviraptor:         { name: 'Æggekast',        slow: { r: 130, time: 2 } },
};

// ---------------------------------------------------------------- install
function install(C, exp) {
  if (!exp || !Object.keys(exp).length) return;
  const G = C.Game.prototype, on = k => !!exp[k], opt = (k, d) => (exp[k] && typeof exp[k] === 'object' ? exp[k] : {})[d];
  const S = r => (r.stats.exp ||= { powerups: 0, byType: {}, streakMax: 0, counters: 0, rages: 0, affixed: 0, trails: 0, defenders: 0, guests: 0, bounties: 0, abil2: 0 });
  const buff = (r, k) => (r.xbuff || {})[k] > 0;
  const nearP = (r, e, d) => Math.hypot(e.x - r.player.x, e.y - r.player.y) < d;
  const pool = () => opt('powerups', 'only') ? [opt('powerups', 'only')] : (opt('powerups', 'pool') || Object.keys(POWERUPS));
  const dropPowerup = (g, x, y) => { const r = g.run, list = pool(), type = list[Math.floor(g.random() * list.length)]; r.pickups.push({ id: ++g.nextId, kind: 'powerup', type, x, y, value: 0 }); };

  function applyPowerup(g, type) {
    const r = g.run, p = POWERUPS[type]; S(r).powerups++; S(r).byType[type] = (S(r).byType[type] || 0) + 1;
    r.xbuff ||= {};
    if (type === 'amber') { r.shield = Math.max(r.shield || 0, 35); r.shieldTime = Math.max(r.shieldTime || 0, p.time); }
    else if (type === 'heart') { r.maxHealth += 12; r.health = Math.min(r.maxHealth, r.health + 20 + 12); }
    else if (type === 'comet') r.cometBites = 4;
    else r.xbuff[type] = p.time;
    r.effects.push({ x: r.player.x, y: r.player.y - 30, text: p.name.toUpperCase(), color: '#e9b75a', life: 1.2 });
    g.emit('powerup', { type });
  }

  // Outgoing damage multiplier on bites (applied as an hp delta so every inline bonus is kept).
  const outMul = (r, e) => {
    let k = 1;
    if (buff(r, 'rage')) k *= 1.3;
    if (buff(r, 'urRage')) k *= 1 + RAGE_METER.damage;
    if (on('streak')) k *= 1 + STREAK.damage * (r.streak || 0);
    if (buff(r, 'counter')) k *= 1 + COUNTER.damage;
    if (r.babyMul) k *= r.babyMul;
    if (r.empower && r.empower.until > r.seconds) k *= r.empower.k;
    return k;
  };
  const leechFrac = r => (buff(r, 'leech') ? .2 : 0) + (buff(r, 'urRage') ? RAGE_METER.leech : 0);

  const resolveBite = G.resolveBite;
  G.resolveBite = function (facing) {
    const r = this.run, before = new Map(r.enemies.map(e => [e, e.hp])), forced = r.cometBites > 0, saved = r.roarCrit;
    if (forced) r.roarCrit = 1;
    const out = resolveBite.call(this, facing);
    if (forced) r.roarCrit = saved && r.roarCrit ? saved : 0;
    let dealt = 0, hit = false;
    for (const [e, hp] of before) {
      const d = hp - e.hp; if (!(d > 0)) continue; hit = true;
      const k = outMul(r, e), extra = d * (k - 1); e.hp -= extra; dealt += d + extra;
      if (on('eliteAffix') && e.affix === 'thorns') this.damage(ELITE_AFFIX.thorns, null);
    }
    if (hit) {
      if (forced) r.cometBites--;
      if (r.empower && r.empower.until > r.seconds) r.empower = null;
      if (buff(r, 'counter')) r.xbuff.counter = 0;
      const heal = dealt * leechFrac(r); if (heal > 0 && r.health > 0) { const b = r.health; r.health = Math.min(r.maxHealth, r.health + heal); r.stats.healing += r.health - b; }
      if (on('rageMeter') && !buff(r, 'urRage')) r.rageMeter = Math.min(RAGE_METER.fill, (r.rageMeter || 0) + dealt);
    }
    return out;
  };

  const attack = G.attack;
  G.attack = function () {
    const ok = attack.call(this); if (!ok) return ok;
    const r = this.run; let k = 1;
    if (buff(r, 'rage')) k *= .85;
    if (buff(r, 'urRage')) k *= 1 - RAGE_METER.attackSpeed;
    if (k !== 1) { r.attackCooldown *= k; r.attackDuration *= k; r.attack.duration *= k; r.attack.contactTime *= k; }
    return ok;
  };

  const travel = G.travel;
  G.travel = function (entity, dx, dy) {
    const r = this.run;
    if (r && entity === r.player) {
      let k = 1;
      if (buff(r, 'wind')) k *= 1.35;
      if (on('streak')) k *= 1 + STREAK.speed * (r.streak || 0);
      if (r.speedBoost && r.speedBoost.until > r.seconds) k *= r.speedBoost.k;
      dx *= k; dy *= k;
    } else if (r && entity && entity.kind) {
      let k = 1;
      if (buff(r, 'frost') && nearP(r, entity, 500)) k *= .5;
      if (entity.slowUntil > r.seconds) k *= .5;
      if (on('eliteAffix') && entity.affix === 'swift') k *= ELITE_AFFIX.speed;
      if (on('nightHunt') && r.night && !entity.boss && C.SPECIES[entity.kind] && C.SPECIES[entity.kind].damage > 0 && !C.HERBIVORE_KINDS.has(entity.kind)) k *= NIGHT_HUNT.speed;
      dx *= k; dy *= k;
    }
    return travel.call(this, entity, dx, dy);
  };

  const damage = G.damage;
  G.damage = function (amount, source) {
    const r = this.run;
    if (r && source && !source.hazard) {
      if (on('eliteAffix') && source.affix === 'brutal') amount *= ELITE_AFFIX.damage;
      if (on('nightHunt') && r.night && !source.boss && source.kind && !C.HERBIVORE_KINDS.has(source.kind)) amount *= NIGHT_HUNT.damage;
    }
    const hpBefore = r ? r.health : 0, avoidedBefore = r ? r.stats.avoidedHits : 0;
    const out = damage.call(this, amount, source);
    if (r && on('counter') && source && r.stats.avoidedHits > avoidedBefore && !buff(r, 'counter')) { r.xbuff ||= {}; r.xbuff.counter = COUNTER.time; S(r).counters++; }
    if (r && on('streak') && r.health < hpBefore - 0.01) { /* streak survives hits */ }
    return out;
  };

  const kill = G.kill;
  G.kill = function (e) {
    const r = this.run, fresh = e && !e.rewarded, dnaBefore = r.dna;
    const out = kill.call(this, e);
    if (!fresh || !e.rewarded) return out;
    if (on('streak') && !e.boss) {
      r.streak = r.seconds - (r.lastKillAt ?? -99) <= STREAK.window ? Math.min(STREAK.max, (r.streak || 0) + 1) : 1; r.lastKillAt = r.seconds;
      S(r).streakMax = Math.max(S(r).streakMax, r.streak);
      if (r.streak >= STREAK.healFrom) r.health = Math.min(r.maxHealth, r.health + STREAK.heal);
    }
    if (on('powerups') && !e.boss) {
      if ((e.elite || e.rare) && POWERUP_SPAWN.eliteDrop) dropPowerup(this, e.x + 24, e.y);
      else if (this.random() < (opt('powerups', 'killChance') ?? POWERUP_SPAWN.killChance)) dropPowerup(this, e.x + 24, e.y);
    }
    if (on('nightHunt') && r.night && !e.boss) { const got = r.dna - dnaBefore, bonus = Math.round(got * (NIGHT_HUNT.dna - 1)); if (bonus > 0) this.addDNA(bonus, true); }
    if (on('bounty') && e.bounty) { S(r).bounties++; this.addDNA(Math.max(2, (C.SPECIES[e.kind].dna || 1) * BOUNTY.dnaMul), true); r.xbuff ||= {}; r.xbuff.rage = POWERUPS.rage.time; }
    if (on('babyStart') && e.boss) r.babyMul = Math.min(BABY.cap, (r.babyMul || 1) + BABY.perBoss), grow(r, BABY.perBoss);
    if (on('carrionGuests') && !e.boss && e.kind !== 'compy' && r.stage < 3 && this.random() < CARRION.chance) {
      for (let i = 0; i < CARRION.count; i++) { const a = i * Math.PI + this.random(); const g2 = this.spawn('compy', { x: e.x + Math.cos(a) * 140, y: e.y + Math.sin(a) * 140 }); if (g2) { g2.alert = false; g2.carrionGuest = true; S(r).guests++; } }
    }
    return out;
  };
  function grow(r, amount) { const add = Math.round(r.babyBaseHP * amount); r.maxHealth += add; r.health = Math.min(r.maxHealth, r.health + add); }

  const breakBoss = G.breakBoss;
  G.breakBoss = function (e, amount) {
    const was = e && e.mode; const out = breakBoss.call(this, e, amount);
    if (on('powerups') && POWERUP_SPAWN.bossBreakDrop && e && was !== 'broken' && e.mode === 'broken') dropPowerup(this, e.x + 60, e.y);
    return out;
  };

  const provoke = G.provoke;
  G.provoke = function (e) {
    const out = provoke.call(this, e), r = this.run;
    if (on('herdDefense') && r && e && e.herdId && e.damage && !e.boss && !e.defended) {
      e.defended = true;
      for (const o of r.enemies) if (o !== e && o.herdId === e.herdId && o.hp > 0 && !o.alert && Math.hypot(o.x - e.x, o.y - e.y) < HERD_DEFENSE.range) { o.defended = true; provoke.call(this, o); S(r).defenders++; }
    }
    return out;
  };

  const start = G.start;
  G.start = function (options) {
    const out = start.call(this, options), r = this.run; if (!r) return out;
    r.xbuff = {}; r.streak = 0; r.rageMeter = 0; S(r);
    if (on('babyStart')) { r.babyBaseHP = r.maxHealth; r.maxHealth = Math.round(r.maxHealth * (opt('babyStart', 'hp') ?? BABY.hp)); r.health = r.maxHealth; r.babyMul = opt('babyStart', 'damage') ?? BABY.damage; r.nextXP = Math.max(1, Math.round(r.nextXP * BABY.xp)); }
    placeShrines(this);
    return out;
  };
  const nextStage = G.nextStage;
  G.nextStage = function () { const r = this.run, level = r && r.levelIndex, out = nextStage.call(this); if (this.run && this.run.levelIndex !== level) placeShrines(this); return out; };
  function placeShrines(g) {
    const r = g.run; if (!on('powerups') || !r || !r.map.habitats) return;
    const spots = r.map.habitats.filter(h => !C.isWater(r.stage, r.map, h, -40) && Math.hypot(h.x - r.player.x, h.y - r.player.y) > 350);
    for (let i = 0; i < (opt('powerups', 'shrines') ?? POWERUP_SPAWN.shrines) && spots.length; i++) { const h = spots.splice(Math.floor(g.random() * spots.length), 1)[0]; dropPowerup(g, h.x, h.y); }
  }
  if (on('babyStart')) {
    const maybe = G.maybeLevelUp;
    G.maybeLevelUp = function () { const r = this.run, before = r.level, out = maybe.call(this); if (r.level !== before) r.nextXP = Math.max(1, Math.round(r.nextXP * BABY.xp)); return out; };
  }

  const step = G.step;
  G.step = function (dt, input = {}) {
    const r = this.run; if (this.phase !== 'playing' || !r) return step.call(this, dt, input);
    for (const k of Object.keys(r.xbuff || {})) r.xbuff[k] = Math.max(0, r.xbuff[k] - dt);
    if (buff(r, 'stamina')) { r.stamina = 100; r.winded = 0; }
    // Rage meter: a full meter turns the next ability into "Urraseri".
    const abilitiesBefore = r.stats.abilities, powerIds = on('powerups') ? r.pickups.filter(p => p.kind === 'powerup').map(p => [p.id, p.type]) : null;
    if (on('eliteAffix')) for (const e of r.enemies) if (e.elite && !e.affix && !e.boss) {
      const list = ['brutal', 'armored', 'swift', 'thorns', 'regen'], a = list[(e.id * 7) % list.length]; e.affix = a; S(r).affixed++;
      if (a === 'armored') { e.hp *= ELITE_AFFIX.hp; e.maxHP *= ELITE_AFFIX.hp; }
    }
    const out = step.call(this, dt, input);
    if (!this.run || this.run !== r) return out;
    if (powerIds) { const left = new Set(r.pickups.map(p => p.id)); for (const [id, type] of powerIds) if (!left.has(id)) applyPowerup(this, type); }
    if (r.stats.abilities > abilitiesBefore) {
      if (on('rageMeter') && (r.rageMeter || 0) >= RAGE_METER.fill) { r.rageMeter = 0; r.xbuff.urRage = RAGE_METER.time; S(r).rages++; this.emit('ur_rage'); }
      if (on('ability2')) ability2(this, r);
    }
    if (on('eliteAffix')) for (const e of r.enemies) if (e.affix === 'regen' && e.hp > 0) e.hp = Math.min(e.maxHP, e.hp + e.maxHP * ELITE_AFFIX.regen * dt);
    if (on('streak') && r.streak && r.seconds - r.lastKillAt > STREAK.window) r.streak = 0;
    if (on('bloodTrail') && r.health < r.maxHealth * BLOOD_TRAIL.below && (r.trailClock = (r.trailClock || 0) + dt) >= BLOOD_TRAIL.every) {
      r.trailClock = 0;
      const hunter = r.enemies.filter(e => !e.boss && !e.alert && e.damage && !C.HERBIVORE_KINDS.has(e.kind) && nearP(r, e, BLOOD_TRAIL.range)).sort((a, b) => Math.hypot(a.x - r.player.x, a.y - r.player.y) - Math.hypot(b.x - r.player.x, b.y - r.player.y))[0];
      if (hunter) { this.provoke(hunter); S(r).trails++; }
    }
    if (on('bounty') && (r.bountyClock = (r.bountyClock || 0) + dt) >= BOUNTY.every) {
      r.bountyClock = 0;
      const prey = r.enemies.filter(e => !e.boss && !e.bounty && e.hp > 0 && e.damage).sort((a, b) => Math.hypot(a.x - r.player.x, a.y - r.player.y) - Math.hypot(b.x - r.player.x, b.y - r.player.y))[0];
      if (prey) prey.bounty = true;
    }
    return out;
  };
  function ability2(g, r) {
    const a = ABILITY2[r.species]; if (!a) return; S(r).abil2++;
    if (a.empower) r.empower = { k: a.empower[0], until: r.seconds + a.empower[1] };
    if (a.shield) { r.shield = Math.max(r.shield || 0, a.shield[0]); r.shieldTime = Math.max(r.shieldTime || 0, a.shield[1]); }
    if (a.heal) r.health = Math.min(r.maxHealth, r.health + a.heal);
    if (a.speed) r.speedBoost = { k: a.speed[0], until: r.seconds + a.speed[1] };
    for (const e of r.enemies) {
      if (!e.damage && !a.zap) continue;
      const d = Math.hypot(e.x - r.player.x, e.y - r.player.y);
      if (a.aoe && d < a.aoe.r) { if (e.boss) g.breakBoss(e, a.aoe.brk); else e.stagger = Math.max(e.stagger || 0, a.aoe.stagger); }
      if (a.slow && d < a.slow.r) e.slowUntil = r.seconds + a.slow.time;
      if (a.scare && d < a.scare.r && !e.boss && !e.guard) { e.scaredUntil = r.seconds + a.scare.time; e.alert = false; e.mode = 'flee'; }
      if (a.zap && d < a.zap.r + e.radius && e.hp > 0) { e.hp -= a.zap.dmg * (r.babyMul || 1); g.provoke(e); }
    }
  }
}

module.exports = { install, POWERUPS, POWERUP_SPAWN, STREAK, COUNTER, RAGE_METER, BABY, ELITE_AFFIX, BLOOD_TRAIL, HERD_DEFENSE, CARRION, NIGHT_HUNT, BOUNTY, ABILITY2 };
