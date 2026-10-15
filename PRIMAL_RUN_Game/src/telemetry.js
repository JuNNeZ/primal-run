/* PRIMAL RUN opt-in run data (2026-10-15, FEATURES.runTelemetry). When the player has said yes to sharing anonymous
   game data, every finished run sends one JSON line to a Google Form owned by Jonas; the answers land in a Google
   Sheet that is used to calibrate the simulator bots (tools/playstyle_sim.cjs) against real players.
   Nothing is sent before the player says yes (save.settings.shareData === true), in admin mode, or outside the
   browser. The row holds no name, no free text and no exact time: only a random device id that is deleted when the
   player says no, the date, and numbers from the run summary (records.js).
   Pure helpers are deterministic; install() wraps Game methods so core.js keeps its own logic. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PrimalTelemetry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SCHEMA = 1;
  const FORM = {
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSdb7i81j-2TbE9ZB922RJ9xNTsT8v53RXVRtkaCwfr-XWpEhw/formResponse',
    field: 'entry.1505457991'
  };
  const DEVICE_ID = /^[0-9a-f]{12}$/;
  const pad = n => String(n).padStart(2, '0');
  const dayOf = ms => { const d = new Date(ms); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); };
  const round1 = n => Math.round((Number(n) || 0) * 10) / 10;

  function newDeviceId(random = Math.random) {
    let id = ''; for (let i = 0; i < 12; i++) id += Math.floor(random() * 16).toString(16);
    return id;
  }
  const validDeviceId = id => typeof id === 'string' && DEVICE_ID.test(id) ? id : null;

  // Seconds spent on each stage: stage clears are stored as run seconds; the last entry is the stage the run ended on.
  function stageSeconds(clears, total) {
    const out = []; let last = 0;
    for (const t of clears || []) { out.push(round1(t - last)); last = t; }
    out.push(round1(Math.max(0, total - last)));
    return out;
  }

  // One anonymous row per run. `s` is the records.js RunSummary; `run` the finished run; `save` the player's save.
  function buildRow(s, run, save, now) {
    const upgrades = save && save.upgrades ? Object.values(save.upgrades).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
    return {
      v: SCHEMA, day: dayOf(now), id: validDeviceId(save && save.settings && save.settings.deviceId),
      difficulty: run.difficulty || 'normal', species: s.species, campaign: s.campaign, daily: !!run.daily,
      challenges: (run.challenges || []).slice(), babyStart: !!(run.extras && run.extras.baby), lab: upgrades,
      victory: s.victory, abandoned: s.abandoned, stage: s.levelReached, seconds: s.seconds,
      stageSeconds: stageSeconds(run.telemetryClears, s.seconds),
      cause: s.deathCauseType, killer: s.deathCauseKind, boss: s.deathBossId,
      bossKills: s.bossKills.map(b => ({ level: b.level, seconds: b.seconds })), bossAttempts: s.bossAttempts,
      mutations: s.mutationLog.slice(), levelUps: s.levelUps,
      kills: s.kills, attacks: s.attacks, landed: s.landedAttacks, abilities: s.abilities, avoided: s.avoidedHits,
      damageDealt: s.damageDealt, damageTaken: s.damageTaken, healing: s.healing, lowHpSeconds: s.lowHpSeconds,
      hpLeftPct: s.hpLeftPct, explorationPct: s.explorationPct, food: s.food, dna: s.dna, score: s.score
    };
  }

  const shouldSend = (save, features, admin) => !!(features && features.runTelemetry && save && save.settings && save.settings.shareData === true && !admin);

  // Google Forms answers a cross-site POST without CORS headers, so the request is fire-and-forget ('no-cors').
  function send(row, fetchFn) {
    if (typeof fetchFn !== 'function') return false;
    const body = FORM.field + '=' + encodeURIComponent(JSON.stringify(row));
    try {
      const p = fetchFn(FORM.url, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      if (p && typeof p.catch === 'function') p.catch(() => {});
      return true;
    } catch (_) { return false; }
  }

  // Game hooks. Must be installed after records.js so finish() sees the run summary. `this.telemetrySink(row)` is
  // set by the browser app; without it (Node, tests, GDevelop) nothing leaves the game.
  function install({ Game, FEATURES }) {
    const G = Game.prototype;
    const wrap = (name, fn) => { const original = G[name]; G[name] = function (...args) { return fn.call(this, original, ...args); }; };
    wrap('start', function (original, ...args) { const out = original.apply(this, args); if (this.run) this.run.telemetryClears = []; return out; });
    wrap('nextStage', function (original, ...args) {
      const r = this.run; if (r && this.phase === 'cleared') (r.telemetryClears || (r.telemetryClears = [])).push(r.seconds);
      return original.apply(this, args);
    });
    wrap('finish', function (original, victory) {
      const r = this.run, fresh = r && !r.result; const out = original.call(this, victory);
      if (!fresh || !FEATURES.runTelemetry || !r.summary) return out;
      const now = typeof this.now === 'function' ? this.now() : Date.now();
      r.telemetryRow = buildRow(r.summary, r, this.save, now);
      this.shareRun(r);
      return out;
    });
    // Sends a run once, and only with consent. Also called by the app when the player says yes after a run.
    G.shareRun = function (r) {
      if (!r || !r.telemetryRow || r.telemetrySent || typeof this.telemetrySink !== 'function') return false;
      if (!shouldSend(this.save, FEATURES, !!this.telemetryAdmin)) return false;
      r.telemetryRow.id = validDeviceId(this.save.settings.deviceId);
      r.telemetrySent = true; this.telemetrySink(r.telemetryRow); return true;
    };
  }

  return { SCHEMA, FORM, newDeviceId, validDeviceId, stageSeconds, buildRow, shouldSend, send, install };
});
