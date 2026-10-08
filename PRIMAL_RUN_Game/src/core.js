/* Shared deterministic simulation: browser and GDevelop use this exact file. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PrimalCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const WIDTH = 960, HEIGHT = 640, SAVE_KEY = 'primalRun.save.v1';
  const BITE_ANIMATION = { frames: 6, fps: 14, duration: 6 / 14, contactFrame: 3, contactTime: 3 / 14 };
  const STAGES = [
    { name: 'Bregneskoven', subtitle: 'Jagten begynder', target: 24, tile: 'forest_floor', boss: 'carnotaurus', bossName: 'Skovens jæger', dna: 15 },
    { name: 'Flodsletten', subtitle: 'Hold øje med flodens jæger', target: 50, tile: 'sand', boss: 'deinosuchus', bossName: 'Flodens gab', dna: 20 },
    { name: 'Klippelandet', subtitle: 'Angrib de pansrede flanker', target: 75, tile: 'gravel', boss: 'triceratops', bossName: 'Den hornede vogter', dna: 25 },
    { name: 'Den vulkanske dal', subtitle: 'Den sidste jagt', target: 100, tile: 'volcanic', boss: 'tyrannosaurus', bossName: 'Dalens konge', dna: 30 },
  ];
  const SPECIES = {
    compy: { hp: 18, speed: 64, damage: 7, meat: 1, chance: .05, dna: 1, radius: 12 },
    parasaurolophus: { hp: 30, speed: 60, damage: 0, meat: 3, chance: .15, dna: 2, radius: 18 },
    carnotaurus: { hp: 48, speed: 77, damage: 13, meat: 5, chance: .30, dna: 4, radius: 21 },
    ankylosaurus: { hp: 65, speed: 38, damage: 16, meat: 5, chance: .30, dna: 4, radius: 23 },
    deinosuchus: { hp: 70, speed: 53, damage: 17, meat: 5, chance: .30, dna: 4, radius: 23 },
    triceratops: { hp: 80, speed: 50, damage: 19, meat: 5, chance: .30, dna: 4, radius: 25 },
    tyrannosaurus: { hp: 95, speed: 65, damage: 22, meat: 5, chance: .30, dna: 4, radius: 26 },
  };
  const MUTATIONS = [
    { id: 'teeth', name: 'Savtakkede tænder', text: '+20 % bidskade.', icon: 'serrated_teeth', max: 3 },
    { id: 'bleed', name: 'Blødende sår', text: 'Bid giver 3 ekstra skade/sek. i 3 sekunder pr. rang.', icon: 'serrated_teeth', max: 3 },
    { id: 'legs', name: 'Kraftige ben', text: '+8 % bevægelseshastighed.', icon: 'powerful_legs', max: 3 },
    { id: 'feathers', name: 'Udholdenhed', text: '+20 % stamina-regeneration.', icon: 'insulating_feathers', max: 3 },
    { id: 'heart', name: 'Stærkt hjerte', text: '+15 maksimalt liv. Hel også 15 liv.', icon: 'health', max: 3 },
    { id: 'armor', name: 'Sej hud', text: 'Tag 8 % mindre skade.', icon: 'armor', max: 3 },
    { id: 'reach', name: 'Jagtinstinkt', text: '+10 pixels bidrækkevidde og opsamlingsradius.', icon: 'hunger', max: 3 },
    { id: 'pounce', name: 'Effektivt spring', text: 'Pounce koster 5 mindre stamina.', icon: 'escape', max: 3 },
    { id: 'quick', name: 'Hurtige kæber', text: '8 % kortere cooldown mellem bid.', icon: 'bone', max: 3 },
    { id: 'scavenger', name: 'Ådselæder', text: 'Kød heler 1 liv pr. kødenhed pr. rang.', icon: 'hunger', max: 3 },
  ];
  const UPGRADES = [
    { id: 'health', name: 'Livskraft', text: '+2 % startliv pr. rang', max: 5 },
    { id: 'damage', name: 'Skarpe tænder', text: '+2 % startskade pr. rang', max: 5 },
    { id: 'regen', name: 'Udholdende jæger', text: '+3 % stamina-regeneration pr. rang', max: 5 },
    { id: 'magnet', name: 'Duft af bytte', text: '+5 % opsamlingsradius pr. rang', max: 5 },
  ];
  const ROCKS = [{ x: 225, y: 200, radius: 22 }, { x: 730, y: 180, radius: 22 }, { x: 260, y: 475, radius: 22 }, { x: 735, y: 475, radius: 22 }];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const finite = (n, fallback = 0) => typeof n === 'number' && Number.isFinite(n) ? n : fallback;
  const cleanName = value => String(value || 'Utahraptor').trim().slice(0, 20) || 'Utahraptor';
  function sanitizeSave(raw) {
    const x = raw && typeof raw === 'object' ? raw : {};
    const save = { version: 1, name: cleanName(x.name), dna: Math.floor(clamp(finite(x.dna), 0, 1000000)), upgrades: {}, settings: {}, scores: [] };
    for (const u of UPGRADES) save.upgrades[u.id] = Math.floor(clamp(finite(x.upgrades && x.upgrades[u.id]), 0, u.max));
    for (const key of ['master', 'music', 'sfx']) save.settings[key] = clamp(finite(x.settings && x.settings[key], key === 'music' ? .4 : .7), 0, 1);
    save.settings.shake = !(x.settings && x.settings.shake === false);
    if (Array.isArray(x.scores)) save.scores = x.scores.filter(s => s && Number.isFinite(s.score) && s.score >= 0).map(s => ({ name: cleanName(s.name), score: Math.floor(clamp(s.score, 0, 100000000)), stage: Math.floor(clamp(finite(s.stage, 1), 1, 4)), bosses: Math.floor(clamp(finite(s.bosses), 0, 4)), seconds: Math.floor(clamp(finite(s.seconds), 0, 100000)), victory: s.victory === true })).sort((a, b) => b.score - a.score).slice(0, 10);
    return save;
  }
  function upgradeCost(rank) { return Math.round(10 * Math.pow(rank + 1, 1.5)); }
  class Game {
    constructor({ storage = null, random = Math.random } = {}) {
      this.storage = storage; this.random = random; this.storageAvailable = !!storage;
      let raw;
      try { raw = storage && JSON.parse(storage.getItem(SAVE_KEY) || 'null'); } catch (_) { this.storageAvailable = false; }
      this.save = sanitizeSave(raw); this.phase = 'menu'; this.run = null; this.events = []; this.nextId = 0;
    }
    emit(type, detail = {}) { this.events.push({ type, ...detail }); }
    drainEvents() { return this.events.splice(0); }
    persist() {
      try { if (!this.storage) throw Error('No storage'); this.storage.setItem(SAVE_KEY, JSON.stringify(this.save)); this.storageAvailable = true; }
      catch (_) { this.storageAvailable = false; }
    }
    setName(name) { this.save.name = cleanName(name); this.persist(); }
    setSetting(key, value) {
      if (['master', 'music', 'sfx'].includes(key)) this.save.settings[key] = clamp(finite(value), 0, 1);
      else if (key === 'shake') this.save.settings.shake = !!value;
      else return;
      this.persist();
    }
    purchase(id) {
      if (!['menu', 'shop', 'result'].includes(this.phase)) return false;
      const u = UPGRADES.find(u => u.id === id); if (!u) return false;
      const rank = this.save.upgrades[id], cost = upgradeCost(rank);
      if (rank >= u.max || this.save.dna < cost) return false;
      this.save.dna -= cost; this.save.upgrades[id]++; this.persist(); this.emit('ui'); return true;
    }
    start() {
      const up = { ...this.save.upgrades }, maxHealth = 100 * (1 + .02 * up.health);
      this.run = { player: { x: 480, y: 340, radius: 16, facing: 'S', walk: 0, moving: false }, health: maxHealth, maxHealth, stamina: 100, stage: 0, meat: 0, totalMeat: 0, level: 1, xp: 0, nextXP: 6, mutations: Object.fromEntries(MUTATIONS.map(m => [m.id, 0])), upgrades: up, choices: [], enemies: [], pickups: [], effects: [], seconds: 0, kills: 0, bosses: 0, dna: 0, score: 0, spawnTimer: 1, attackCooldown: 0, attack: null, biteFacing: 'S', bite: 0, pounce: 0, pounceCooldown: 0, invulnerable: 0, shake: 0, bossSpawned: false, bossDefeated: false, result: null };
      this.phase = 'playing'; this.populate(); this.emit('start');
    }
    populate() {
      const r = this.run;
      if (r.stage === 0) {
        this.spawn('compy', { x: 420, y: 245 }); this.spawn('compy', { x: 575, y: 350 });
        this.spawn('parasaurolophus', { x: 640, y: 225 }); r.spawnTimer = 5; return;
      }
      for (let i = 0; i < 5; i++) this.spawn(i % 3 === 0 ? 'parasaurolophus' : 'compy', { x: 340 + (i % 3) * 110, y: i < 3 ? 170 : 440 });
      r.spawnTimer = 1;
    }
    spawn(kind, position, boss = false) {
      const r = this.run, base = SPECIES[kind]; if (!base) throw Error('Unknown species');
      const edge = Math.floor(this.random() * 4);
      const p = position || (edge < 2 ? { x: edge ? 904 : 56, y: 100 + this.random() * 440 } : { x: 80 + this.random() * 800, y: edge === 2 ? 100 : 560 });
      const scale = 1 + r.stage * .3;
      const hp = boss ? (220 + r.stage * 85) : base.hp * scale;
      const e = { id: ++this.nextId, kind, x: p.x, y: p.y, radius: boss ? 32 : base.radius, hp, maxHP: hp, speed: Math.min(base.speed * (1 + r.stage * .08), 110), damage: boss ? 20 + r.stage * 5 : base.damage * (1 + r.stage * .18), boss, facingX: 0, facingY: 1, cooldown: boss ? 1.8 : .5, mode: 'chase', timer: 0, chargeX: 0, chargeY: 1, bleed: 0, hit: 0, stagger: 0, pattern: 0 };
      r.enemies.push(e); return e;
    }
    move(entity, dx, dy) {
      entity.x = clamp(entity.x + dx, 42 + entity.radius, WIDTH - 42 - entity.radius);
      entity.y = clamp(entity.y + dy, 76 + entity.radius, HEIGHT - 42 - entity.radius);
      for (const rock of ROCKS) {
        const x = entity.x - rock.x, y = entity.y - rock.y, d = Math.hypot(x, y), min = entity.radius + rock.radius;
        if (d < min) { entity.x = rock.x + (d > .001 ? x / d : 1) * min; entity.y = rock.y + (d > .001 ? y / d : 0) * min; }
      }
    }
    pause() { if (this.phase === 'playing') { this.phase = 'paused'; this.emit('pause'); } }
    resume() { if (this.phase === 'paused') this.phase = 'playing'; }
    abandon() { if (this.run && !this.run.result) this.finish(false); this.phase = 'menu'; }
    addDNA(amount) { this.save.dna += amount; this.run.dna += amount; this.persist(); this.emit('dna', { amount }); }
    addXP(amount) { this.run.xp += amount; this.maybeLevelUp(); }
    maybeLevelUp() {
      const r = this.run;
      if (r.xp < r.nextXP || this.phase !== 'playing') return;
      const pool = MUTATIONS.filter(m => r.mutations[m.id] < m.max);
      if (!pool.length) { r.xp = Math.min(r.xp, r.nextXP - 1); return; }
      r.xp -= r.nextXP; r.level++; r.nextXP = 6 + (r.level - 1) * 3;
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      r.choices = pool.slice(0, 3).map(m => m.id); this.phase = 'mutation'; this.emit('level_up');
    }
    choose(id) {
      const r = this.run; if (this.phase !== 'mutation' || !r.choices.includes(id)) return false;
      r.mutations[id]++; if (id === 'heart') { r.maxHealth += 15; r.health = Math.min(r.maxHealth, r.health + 15); }
      r.choices = []; this.phase = 'playing'; this.emit('ui'); this.maybeLevelUp();
      if (this.phase === 'playing' && r.bossDefeated) this.phase = 'cleared';
      if (this.phase === 'playing') r.invulnerable = Math.max(r.invulnerable, 1);
      return true;
    }
    damage(amount) {
      const r = this.run; if (r.invulnerable > 0 || r.pounce > 0 || this.phase !== 'playing') return;
      r.health = Math.max(0, r.health - amount * (1 - .08 * r.mutations.armor)); r.invulnerable = .65; r.shake = .18; this.emit('hit');
      if (r.health <= 0) this.finish(false);
    }
    attack() {
      const r = this.run; if (r.attackCooldown > 0 || r.attack || this.phase !== 'playing') return false;
      const speed = 1 - .08 * r.mutations.quick;
      r.attackCooldown = .5 * speed;
      r.attack = { elapsed: 0, duration: BITE_ANIMATION.duration * speed, contactTime: BITE_ANIMATION.contactTime * speed, facing: r.player.facing, contact: false };
      this.emit('attack_start'); return true;
    }
    advanceAttack(dt) {
      const r = this.run, attack = r.attack; if (!attack) return;
      attack.elapsed += dt;
      if (!attack.contact && attack.elapsed >= attack.contactTime) {
        attack.contact = true; r.bite = .12; r.biteFacing = attack.facing;
        this.resolveBite(attack.facing); this.emit('bite');
      }
      if (attack.elapsed >= attack.duration) r.attack = null;
    }
    resolveBite(facing) {
      const r = this.run;
      const dir = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[facing];
      let hits = 0;
      for (const e of r.enemies) {
        const dx = e.x - r.player.x, dy = e.y - r.player.y, dist = Math.hypot(dx, dy);
        if (dist > 66 + e.radius + 10 * r.mutations.reach || (dist > 24 && (dx * dir[0] + dy * dir[1]) / dist < .35)) continue;
        const frontal = dist > 0 && ((-dx * e.facingX - dy * e.facingY) / dist > .6);
        const armor = ['triceratops', 'ankylosaurus'].includes(e.kind) && frontal ? .5 : 1;
        const damage = 10 * (1 + .02 * r.upgrades.damage + .2 * r.mutations.teeth) * armor;
        e.hp -= damage; hits++;
        e.bleed = r.mutations.bleed ? 3 : 0; e.hit = .15;
        if (!e.boss) {
          const distance = armor < 1 ? 8 : 18;
          this.move(e, (dist > 1 ? dx / dist : dir[0]) * distance, (dist > 1 ? dy / dist : dir[1]) * distance);
          e.stagger = .12;
        }
        r.effects.push({ x: e.x, y: e.y, text: (armor < 1 ? 'PANSSER · ' : '') + Math.round(damage), life: .55 });
      }
      if (hits) this.emit('bite_hit', { hits });
    }
    kill(e) {
      const r = this.run; r.kills++;
      if (e.boss) {
        r.bosses++; r.score += 1000 * (r.stage + 1); r.bossDefeated = true;
        this.addDNA(STAGES[r.stage].dna); this.emit('boss_dead');
      } else {
        const base = SPECIES[e.kind]; r.score += base.meat * 15;
        r.pickups.push({ id: ++this.nextId, kind: 'meat', x: e.x, y: e.y, value: base.meat });
        if (this.random() < base.chance) r.pickups.push({ id: ++this.nextId, kind: 'dna', x: clamp(e.x + 20, 48, 912), y: e.y, value: base.dna });
        if (this.random() < .10) r.pickups.push({ id: ++this.nextId, kind: 'heal', x: e.x, y: clamp(e.y + 18, 80, 586), value: 15 });
      }
    }
    enemyStep(e, dt) {
      const r = this.run, dx = r.player.x - e.x, dy = r.player.y - e.y, d = Math.max(1, Math.hypot(dx, dy));
      e.cooldown = Math.max(0, e.cooldown - dt); e.hit = Math.max(0, e.hit - dt);
      if (e.stagger > 0) { e.stagger = Math.max(0, e.stagger - dt); return; }
      if (e.mode === 'windup') {
        e.timer -= dt;
        if (e.timer <= 0) { e.mode = e.pattern === 2 ? 'slam' : 'charge'; e.timer = e.mode === 'slam' ? .15 : .55; this.emit('roar'); }
      } else if (e.mode === 'charge') {
        this.move(e, e.chargeX * (e.boss ? 340 : 230) * dt, e.chargeY * (e.boss ? 340 : 230) * dt);
        if (Math.hypot(r.player.x - e.x, r.player.y - e.y) < e.radius + 19) this.damage(e.damage);
        e.timer -= dt; if (e.timer <= 0) { e.mode = 'recover'; e.timer = e.boss ? 1.4 : .9; }
      } else if (e.mode === 'slam') {
        if (d < 130) this.damage(e.damage + 6);
        e.mode = 'recover'; e.timer = 1.6;
      } else if (e.mode === 'recover') {
        e.timer -= dt; if (e.timer <= 0) { e.mode = 'chase'; e.cooldown = 1.2; }
      } else {
        e.facingX = dx / d; e.facingY = dy / d;
        const flee = e.kind === 'parasaurolophus' && d < 200;
        if (d > e.radius + 18 || flee) this.move(e, dx / d * e.speed * dt * (flee ? -1 : 1), dy / d * e.speed * dt * (flee ? -1 : 1));
        const charger = e.boss || (e.kind === 'carnotaurus' && r.stage > 0);
        if (charger && e.cooldown === 0 && d < 360) {
          e.pattern = e.boss && ['triceratops', 'tyrannosaurus'].includes(e.kind) ? (e.pattern + 1) % 3 : 0;
          e.mode = 'windup'; e.timer = e.kind === 'deinosuchus' ? .95 : .8; e.chargeX = dx / d; e.chargeY = dy / d;
        } else if (!charger && e.damage && d < e.radius + 20 && e.cooldown === 0) { this.damage(e.damage); e.cooldown = 1.2; }
      }
    }
    step(dt, input = {}) {
      if (this.phase !== 'playing') return;
      dt = clamp(finite(dt), 0, .05); if (!dt) return;
      const r = this.run, m = r.mutations;
      r.seconds += dt;
      for (const timer of ['attackCooldown', 'bite', 'pounce', 'pounceCooldown', 'invulnerable', 'shake']) r[timer] = Math.max(0, r[timer] - dt);
      r.stamina = Math.min(100, r.stamina + dt * 18 * (1 + .03 * r.upgrades.regen + .2 * m.feathers));
      const dx = clamp(finite(input.x), -1, 1), dy = clamp(finite(input.y), -1, 1), n = Math.hypot(dx, dy);
      if (input.pounce && n && r.pounceCooldown === 0 && r.stamina >= 30 - m.pounce * 5) { r.stamina -= 30 - m.pounce * 5; r.pounce = .23; r.pounceCooldown = 1.8; this.emit('pounce'); }
      r.player.moving = false;
      if (n) {
        const beforeX = r.player.x, beforeY = r.player.y;
        const facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : (dy > 0 ? 'S' : 'N');
        if (facing !== r.player.facing) r.player.walk = 0;
        r.player.facing = facing;
        const speed = 155 * (1 + .08 * m.legs) * (r.pounce > 0 ? 2.5 : r.attack ? .7 : 1);
        this.move(r.player, dx / n * speed * dt, dy / n * speed * dt);
        r.player.moving = Math.hypot(r.player.x - beforeX, r.player.y - beforeY) > .001;
      }
      r.player.walk = r.player.moving ? (r.player.walk + dt) % .75 : 0;
      this.advanceAttack(dt);
      if (input.attack) this.attack();
      const survivors = [];
      for (const e of r.enemies) {
        if (e.bleed > 0) { const duration = Math.min(e.bleed, dt); e.hp -= 3 * m.bleed * duration; e.bleed -= duration; }
        if (e.hp <= 0) this.kill(e);
        else { this.enemyStep(e, dt); survivors.push(e); }
        if (this.phase !== 'playing') break;
      }
      // Preserve remaining enemies on death; never process rewards after a fatal hit.
      if (this.phase !== 'playing') return;
      r.enemies = survivors;
      const collected = [], radius = 26 * (1 + .05 * r.upgrades.magnet) + 10 * m.reach;
      for (const p of r.pickups) {
        if (Math.hypot(p.x - r.player.x, p.y - r.player.y) >= radius) continue;
        collected.push(p.id);
        if (p.kind === 'meat') { r.meat += p.value; r.totalMeat += p.value; r.xp += p.value; r.score += p.value * 10; r.health = Math.min(r.maxHealth, r.health + p.value * m.scavenger); this.emit('pickup'); }
        else if (p.kind === 'dna') this.addDNA(p.value);
        else { r.health = Math.min(r.maxHealth, r.health + p.value); this.emit('pickup'); }
      }
      r.pickups = r.pickups.filter(p => !collected.includes(p.id));
      r.effects = r.effects.filter(e => (e.life -= dt) > 0);
      if (!r.bossSpawned && r.meat >= STAGES[r.stage].target) { r.bossSpawned = true; this.spawn(STAGES[r.stage].boss, { x: 480, y: 130 }, true); this.emit('boss'); }
      if (!r.bossSpawned) {
        r.spawnTimer -= dt;
        const opening = r.stage === 0 && r.seconds < 20 && r.meat < 6;
        const building = r.stage === 0 && !opening && (r.seconds < 45 || r.meat < 12);
        const cap = r.stage === 0 ? (opening ? 3 : building ? 5 : 7) : 9 + r.stage * 2;
        if (r.spawnTimer <= 0 && r.enemies.length < cap) {
          const pool = r.stage === 0 ? (opening ? ['compy', 'parasaurolophus'] : building ? ['compy', 'compy', 'parasaurolophus'] : ['compy', 'parasaurolophus', 'carnotaurus']) : r.stage === 1 ? ['compy', 'parasaurolophus', 'carnotaurus', 'deinosuchus'] : r.stage === 2 ? ['compy', 'parasaurolophus', 'carnotaurus', 'ankylosaurus'] : ['parasaurolophus', 'carnotaurus', 'ankylosaurus', 'tyrannosaurus'];
          this.spawn(pool[Math.floor(this.random() * pool.length)]); r.spawnTimer = r.stage === 0 ? (opening ? 4 : building ? 3.2 : 2.6) : Math.max(1, 2.4 - r.stage * .35);
        }
      }
      this.maybeLevelUp();
      if (this.phase === 'playing' && r.bossDefeated) this.phase = 'cleared';
    }
    nextStage() {
      if (this.phase !== 'cleared') return false;
      const r = this.run;
      for (const p of r.pickups) if (p.kind === 'dna') this.addDNA(p.value);
      if (r.stage === STAGES.length - 1) { this.finish(true); return true; }
      r.stage++; r.meat = 0; r.bossSpawned = false; r.bossDefeated = false; r.enemies = []; r.pickups = []; r.attack = null; r.bite = 0;
      r.player.x = 480; r.player.y = 340; r.health = Math.min(r.maxHealth, r.health + r.maxHealth * .3); r.stamina = 100; r.invulnerable = 1;
      this.phase = 'playing'; this.populate(); this.emit('stage'); return true;
    }
    finish(victory) {
      const r = this.run; if (!r || r.result) return;
      r.result = { name: this.save.name, score: r.score + (victory ? 3000 : 0), stage: r.stage + 1, bosses: r.bosses, seconds: Math.floor(r.seconds), victory: !!victory };
      this.save.scores = [...this.save.scores, r.result].sort((a, b) => b.score - a.score).slice(0, 10);
      r.attack = null; r.bite = 0; this.phase = 'result'; this.persist(); this.emit(victory ? 'victory' : 'death');
    }
  }
  return { Game, WIDTH, HEIGHT, BITE_ANIMATION, STAGES, SPECIES, MUTATIONS, UPGRADES, ROCKS, SAVE_KEY, sanitizeSave, upgradeCost };
});
