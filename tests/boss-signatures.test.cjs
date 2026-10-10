'use strict';
// B1c boss signatures (PART_B_PLAN B1c, FEATURES.bossSignatures) and the X9 telegraph audit (05 §5).
const test = require('node:test'), assert = require('node:assert/strict');
const C = require('../PRIMAL_RUN_Game/src/core.js');
const { scene } = require('../tools/boss_exploit_probe.cjs');
const { runOne } = require('../tools/playstyle_sim.cjs');
const DT = 1 / 30;
const DAMAGING = ['charge', 'bite', 'slam'];

test('X9: every damaging boss action on all 8 levels follows a windup of ≥ 0.45 s', () => {
  const seen = {};
  for (let level = 0; level < 8; level++) for (const [offset, bossOffset] of [[150, 20], [60, 60], [300, 40]]) {
    const { g, r, boss } = scene({ level, offset, bossOffset, species: 'tyrannosaurus' });
    let windup = 0, wasMode = boss.mode, x = level * 7 + offset;
    const rand = () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648;
    const hurt = g.damage.bind(g); let windupBeforeHit = null;
    g.damage = (amount, source) => { if (source === boss && (boss.pattern === 5 || boss.pattern === 4 && !DAMAGING.includes(boss.mode))) windupBeforeHit = windup; return hurt(amount, source); }; // ASKEKAST and the dive hit straight from their windup
    for (let i = 0; i < 40 * 30 && boss.hp > 0; i++) {
      r.health = r.maxHealth; r.invulnerable = 0;
      if (i % 90 === 0) boss.hp = Math.max(1, boss.hp - boss.maxHP * .03); // also hurts it into phase 2 and lets stalkers "answer"
      const before = boss.mode, held = boss.timer;
      g.step(DT, { x: rand() - .5, y: rand() - .5, attack: rand() < .4 });
      if (boss.mode === 'windup') windup = before === 'windup' ? windup + DT : DT;
      if (DAMAGING.includes(boss.mode) && !DAMAGING.includes(before)) {
        assert.equal(before, 'windup', 'level ' + (level + 1) + ' ' + boss.mode + ' came straight from ' + before);
        assert.ok(windup >= .45 - 1e-6, 'level ' + (level + 1) + ' ' + boss.mode + ' after ' + windup.toFixed(2) + ' s windup');
        seen[boss.kind + ':' + boss.mode + ':' + boss.pattern] = true;
      }
      if (windupBeforeHit !== null) { assert.ok(windupBeforeHit >= .45, 'direct windup hit after ' + windupBeforeHit); seen[boss.kind + ':direct:' + boss.pattern] = true; windupBeforeHit = null; }
      wasMode = boss.mode; void held; void wasMode;
    }
  }
  assert.ok(Object.keys(seen).length >= 12, 'audit covered ' + Object.keys(seen).join(', '));
  assert.ok(Object.keys(seen).some(k => k.startsWith('baryonyx')), 'Benny audited');
  assert.ok(seen['baryonyx:direct:4'], 'the dive hit was audited: ' + Object.keys(seen).join(', '));
});

test('B1c Benny: the dive has a 1.2 s windup with bubbles, locks its 70 px circle at 65 % left and can be dodged', () => {
  const run = dodge => {
    const { g, r, boss } = scene({ level: 2, offset: 150, bossOffset: 20, species: 'carnotaurus' });
    let windup = 0, lockedAt = null, bubbles = 0, hp = r.health;
    for (let i = 0; i < 6 * 30; i++) {
      const input = {};
      if (boss.mode === 'windup' && boss.pattern === 4) {
        windup += DT; if (boss.timer <= boss.windupDuration * .65 && lockedAt === null) lockedAt = { x: boss.targetX, y: boss.targetY };
        if (dodge && lockedAt) { input.x = 1; input.y = 0; }
      }
      g.step(DT, input); bubbles += r.particles.filter(p => p.kind === 'bubble').length ? 1 : 0;
      if (lockedAt && boss.mode !== 'windup') break;
    }
    assert.ok(lockedAt, 'a dive started');
    assert.deepEqual({ x: boss.targetX, y: boss.targetY }, lockedAt, 'target stays locked after 35 %');
    return { windup, bubbles, lost: hp - r.health, mode: boss.mode };
  };
  const hit = run(false), dodged = run(true);
  assert.ok(Math.abs(hit.windup - 1.2) < .05, 'windup ' + hit.windup); assert.ok(hit.bubbles > 10);
  assert.ok(hit.lost > 0, 'standing in the circle hurts'); assert.equal(dodged.lost, 0, 'stepping out of the locked circle avoids it');
  assert.equal(hit.mode, 'recover');
  C.FEATURES.bossSignatures = false;
  try { const { g, boss } = scene({ level: 2, offset: 150, bossOffset: 20 }); let dived = false; for (let i = 0; i < 300; i++) { g.step(DT, {}); dived ||= boss.pattern === 4; } assert.equal(dived, false, 'flag off: no dive'); }
  finally { C.FEATURES.bossSignatures = true; }
});

test('B1c Ragnar: the roar stampedes nearby small game toward the player and halves stamina regen for 4 s', () => {
  const { g, r, boss } = scene({ level: 7, offset: 200, bossOffset: -40, species: 'carnotaurus', crossings: false });
  Object.assign(boss, { x: r.player.x + 140, y: r.player.y }); r.map.lavaCrossings = [];
  const small = g.spawn('gallimimus', { x: boss.x + 220, y: boss.y + 60 }), far = g.spawn('gallimimus', { x: boss.x + 900, y: boss.y });
  Object.assign(boss, { mode: 'windup', pattern: 3, timer: .05, windupDuration: 1.25, attackRadius: 230, attackName: 'BRØL · TABER STAMINA', cooldown: 0 });
  let roared = false;
  for (let i = 0; i < 30 && !roared; i++) { g.step(DT, {}); roared = r.roarDebuff > 0; }
  assert.ok(roared, 'player inside the roar circle gets the debuff'); assert.ok(r.roarDebuff > 3.5 && r.roarDebuff <= 4);
  assert.ok(small.stampedeUntil > r.seconds, 'small game within 520 px stampedes'); assert.equal(far.stampedeUntil, undefined, 'far animals ignore it');
  const before = Math.hypot(small.x - r.player.x, small.y - r.player.y);
  for (let i = 0; i < 20; i++) g.step(DT, {});
  assert.ok(Math.hypot(small.x - r.player.x, small.y - r.player.y) < before, 'it runs toward the player');
  // Halved regeneration: same idle second with and without the debuff.
  r.stamina = 10; r.staminaDelay = 0; r.pounce = 0; r.roarDebuff = 4; boss.hp = 0; r.enemies = [];
  g.step(DT, {}); const slow = r.stamina - 10; r.stamina = 10; r.roarDebuff = 0; r.staminaDelay = 0; g.step(DT, {}); const normal = r.stamina - 10;
  assert.ok(Math.abs(slow - normal / 2) < 1e-6, slow + ' vs ' + normal);
});

test('B1c Karl: a finished charge leaves a 3 s ash cloud that slows the player; Carl leaves none', () => {
  for (const [level, expect] of [[6, 1], [1, 0]]) {
    const { g, r, boss, line } = scene({ level, offset: 300, bossOffset: 0, open: true });
    r.player.x = boss.x + line.n.y * 500; r.player.y = boss.y - line.n.x * 500;
    Object.assign(boss, { mode: 'charge', timer: .1, chargeX: -line.n.y, chargeY: line.n.x, attackHit: true, followUp: false });
    for (let i = 0; i < 6; i++) g.step(DT, {});
    assert.equal((r.ashClouds || []).length, expect, 'level ' + (level + 1));
    if (expect) {
      const c = r.ashClouds[0]; Object.assign(r.player, { x: c.x, y: c.y }); r.slow = 0; g.step(DT, {}); assert.ok(r.slow > 0, 'slowed inside the cloud');
      for (let i = 0; i < 100; i++) g.step(DT, {}); Object.assign(r.player, { x: c.x, y: c.y }); r.slow = 0; g.step(DT, {}); assert.equal(r.slow, 0, 'gone after 3 s');
    }
  }
});

test('B1c Karl ASKEKAST: a stalking Karl hurt in the last 2 s answers with a locked 70 px circle (0.9 s) for 0.6 × bite', () => {
  const { g, r, boss } = scene({ offset: 90, bossOffset: 60, crossings: false });
  for (let i = 0; i < 60; i++) g.step(DT, {});
  assert.equal(boss.mode, 'stalk');
  boss.hp -= 10; const hp = r.health; let windup = 0, target = null;
  for (let i = 0; i < 60 && boss.mode !== 'recover'; i++) { g.step(DT, {}); if (boss.mode === 'windup' && boss.pattern === 5) { windup += DT; target ||= { x: boss.targetX, y: boss.targetY }; } }
  assert.ok(target, 'ASKEKAST started'); assert.ok(Math.abs(windup - .9) < .05, 'windup ' + windup);
  assert.equal(hp - r.health, Math.round(boss.damage * .6), 'standing still is hit for 0.6 × bite');
  // Cooldown 4 s, and no answer when Karl was not hurt.
  let again = 0; for (let i = 0; i < 90; i++) { g.step(DT, {}); if (boss.mode === 'windup' && boss.pattern === 5) again++; }
  assert.equal(again, 0);
});

test('B1c keeps Carl unchanged: optimizer duels with all B1 flags off vs on are identical (12 seeds)', () => {
  const fight = on => { const saved = { ...C.FEATURES }; Object.assign(C.FEATURES, { bossReach: on, lavaCrossings: on, bossSignatures: on });
    try { const out = []; for (let i = 0; i < 12; i++) { const o = runOne(C, { species: 'carnotaurus', style: 'optimizer', seed: 2000 + i, seconds: 150, dt: DT, level: 1, bossDuel: true }); out.push([o.outcome, o.damageTaken, o.bossHpLostPct]); } return out; }
    finally { Object.assign(C.FEATURES, saved); } };
  assert.deepEqual(fight(true), fight(false));
});
