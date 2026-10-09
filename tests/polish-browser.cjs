'use strict';
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const { chromium, browserOptions, localURL } = require('../tools/browser.cjs');
(async () => {
  const browser = await chromium.launch(browserOptions()), errors = [], evidence = process.env.PRIMAL_POLISH_SCREENSHOTS;
  if (evidence) fs.mkdirSync(evidence, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } }); page.on('pageerror', e => errors.push(String(e)));
    await page.goto(process.env.PRIMAL_GAME_URL || await localURL(path.resolve(__dirname, '../PRIMAL_RUN_Game/index.html')));
    await page.waitForSelector('[data-action="start"]:not(:disabled)');await page.evaluate(async()=>{for(const species of Object.keys(PrimalCore.PLAYER_SPECIES))await primalRun.preload({species,stage:3,kinds:Object.keys(PrimalCore.SPECIES)});}); await page.evaluate(() => { const g=primalRun.game; g.save.unlockedSpecies.push('utahraptor'); g.selectSpecies('utahraptor'); }); await page.locator('[data-action="start"]').click(); await page.locator('[data-action="begin"]').click();await page.waitForFunction(()=>primalRun.game.phase==='playing');
    const terrain = [];
    for (let stage = 0; stage < 4; stage++) {
      terrain.push(await page.evaluate(stage => {
        const g = primalRun.game; g.start(); const r = g.run; r.stage = stage; r.map = PrimalCore.createMap(stage); r.enemies = []; r.pickups = []; r.spawnTimer = 999;
        r.player.x = stage === 1 || stage === 3 ? r.map.width * .72 : 1200; r.player.y = 900; g.pause(); primalRun.update(performance.now());
        document.querySelector('.screen').hidden = true; document.querySelector('.toast').style.display = 'none';
        const canvas = document.querySelector('canvas[aria-label]'), ctx = canvas.getContext('2d');
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let brightness = 0;
        for (let i = 0; i < data.length; i += 400) brightness += data[i] + data[i + 1] + data[i + 2];
        return { stage, brightness, props: r.map.decorations.map(p => p.path), trails: r.map.trails.length, regions: r.map.regions.length, smoothing: ctx.imageSmoothingEnabled };
      }, stage));
      if (evidence) await page.screenshot({ path: path.join(evidence, 'biome-' + stage + '.png') });
    }
    assert.equal(new Set(terrain.map(t => t.brightness)).size, 4, 'four distinct actual rendered biome views'); assert.ok(terrain.every(t => t.trails === 0 && t.regions > 4 && !t.smoothing));
    await page.evaluate(() => {
      const g = primalRun.game; g.start({campaign:'classic'}); const r = g.run; r.enemies = []; r.pickups = []; r.spawnTimer = 999;
      r.player.x = 1450; r.player.y = 950; r.player.facing = 'E';
      const boss = g.spawn('carnotaurus', { x: 1500, y: 950 }, true); boss.mode = 'recover'; boss.timer = 1.65; boss.facingX = 1; boss.facingY = 0;
      g.attack(); r.attack.elapsed = r.attack.contactTime - .01; g.step(.011); g.pause(); primalRun.update(performance.now());
      document.querySelector('.screen').hidden = true;
    });
    await page.waitForTimeout(80);
    assert.ok((await page.locator('.boss-tip').textContent()).includes('ÅBEN FLANKE')); assert.equal(await page.locator('.boss-hud').getAttribute('data-boss-phase'), '1');
    assert.equal(await page.locator('canvas[aria-label]:not(.end-scene)').getAttribute('data-hit-stop'), 'true'); assert.ok(+(await page.locator('canvas[aria-label]:not(.end-scene)').getAttribute('data-particles')) > 0);
    assert.equal(await page.evaluate(() => primalRun.game.run.enemies[0].hp), 207.5, 'recovery flank bonus uses actual contact frame');
    const frozen = await page.evaluate(() => JSON.stringify(primalRun.game.run)); await page.waitForTimeout(100); assert.equal(await page.evaluate(() => JSON.stringify(primalRun.game.run)), frozen);
    if (evidence) await page.screenshot({ path: path.join(evidence, 'bite-impact.png') });
    const cone = await page.evaluate(() => {
      const g = primalRun.game, e = g.run.enemies[0]; g.phase = 'playing'; e.mode = 'chase'; e.cooldown = 0; e.attackCycle = 1; g.enemyStep(e, .01); g.pause();
      const ctx = document.querySelector('canvas[aria-label]').getContext('2d'), original = ctx.arc, arcs = [];
      ctx.arc = function(...args) { if (args[2] === 100) arcs.push(args); return original.apply(this, args); };
      primalRun.update(performance.now()); ctx.arc = original; document.querySelector('.screen').hidden = true; return arcs[0];
    });
    assert.ok(cone); assert.ok(Math.abs(cone[4] - cone[3] - 2 * Math.acos(.35)) < .000001, 'drawn bite cone matches actual directional damage');
    if (evidence) await page.screenshot({ path: path.join(evidence, 'boss-bite-warning.png') });
    await page.evaluate(() => { const g = primalRun.game, e = g.run.enemies[0]; g.phase = 'playing'; g.run.attack = null; g.run.bite = 0; g.run.hitStop = 0; g.run.effects = []; g.run.particles = []; g.run.player.x = 1440; g.run.player.y = 1080; e.x = 1520; e.y = 960; e.hp = 110; g.enemyStep(e, .01); g.pause(); primalRun.update(performance.now()); document.querySelector('.screen').hidden = true; });
    assert.equal(await page.locator('.boss-hud').getAttribute('data-boss-phase'), '2'); assert.ok((await page.locator('.boss-tip').textContent()).includes('DOBBELT STORMLØB'));
    if (evidence) await page.screenshot({ path: path.join(evidence, 'boss-phase-two.png') });
    await page.evaluate(() => { const g = primalRun.game, e = g.run.enemies[0]; g.phase = 'playing'; e.mode = 'chase'; e.cooldown = 0; e.attackCycle = 0; g.enemyStep(e, .01); g.pause(); primalRun.update(performance.now()); document.querySelector('.screen').hidden = true; });
    assert.ok((await page.locator('.boss-tip').textContent()).includes('STORMLØB 1/2'));
    if (evidence) await page.screenshot({ path: path.join(evidence, 'boss-charge-warning.png') });
    const chargeWarning = await page.evaluate(() => {
      const ctx = document.querySelector('canvas[aria-label]').getContext('2d'), original = ctx.arc, arcs = [];
      ctx.arc = function(...args) { if (args[2] === primalRun.game.run.enemies[0].radius + primalRun.game.run.player.radius + 3) arcs.push(args); return original.apply(this, args); }; primalRun.update(performance.now()); ctx.arc = original; return arcs;
    });
    assert.equal(chargeWarning.length, 2); assert.ok(Math.abs(Math.hypot(chargeWarning[0][0] - chargeWarning[1][0], chargeWarning[0][1] - chargeWarning[1][1]) - 370 * .58) < 2, 'drawn charge capsule matches speed, duration and body contact radius');

    // Run a complete fight through shared simulation inputs: no boss-HP edits after spawn.
    const fight = await page.evaluate(() => {
      const g = primalRun.game; g.start({campaign:'classic'}); const r = g.run; r.enemies = []; r.spawnTimer = 999; r.player.x = 1450; r.player.y = 1050; r.map.rocks = [];r.map.events=[]; // Isolate boss timing from random terrain collisions.
      const boss = g.spawn('carnotaurus', { x: 1500, y: 950 }, true), modes = new Set();
      for (let i = 0; i < 9000 && g.phase === 'playing'; i++) {
        modes.add(boss.bossPhase + ':' + boss.mode); let x = 0, y = 0, attack = false;
        // Bosses aim at you early in a charge windup, so a good player waits, then sidesteps late; slams and spins are escaped outward.
        const late = boss.mode === 'windup' && (boss.timer <= (boss.windupDuration || 1) * .55 || boss.pattern !== 0 || boss.spin);
        if (boss.mode === 'windup' && !late) { x = 0; y = 0; }
        else if (['windup', 'charge', 'slam'].includes(boss.mode)) { if (boss.pattern === 2 || boss.spin) { x = r.player.x - boss.x; y = r.player.y - boss.y; } else { x = -boss.chargeY; y = boss.chargeX; } }
        else if (['recover', 'broken'].includes(boss.mode)) {
          const tx = boss.x - boss.facingX * 55, ty = boss.y - boss.facingY * 55;
          if (Math.hypot(tx - r.player.x, ty - r.player.y) > 12) { x = tx - r.player.x; y = ty - r.player.y; }
          else { x = boss.x - r.player.x; y = boss.y - r.player.y; attack = true; }
        } else if (boss.mode === 'enrage') { x = r.player.x - boss.x; y = r.player.y - boss.y; }
        else { x = boss.x - r.player.x; y = boss.y - r.player.y; }
        const n = Math.hypot(x, y); if (n) { x /= n; y /= n; }
        if (boss.mode === 'recover' && Math.hypot(boss.x - r.player.x, boss.y - r.player.y) < 90) attack = true;
        g.step(1 / 60, { x, y, attack });
      }
      return { phase: g.phase, seconds: r.seconds, health: r.health, dna: r.dna, modes: [...modes] };
    });
    assert.equal(fight.phase, 'cleared'); assert.ok(fight.dna >= 15, 'boss DNA (plus any achievement DNA)'); assert.ok(fight.health > 0 && fight.seconds < 90);
    for (const mode of ['1:charge', '1:bite', '2:enrage', '2:charge', '2:bite', '2:slam']) assert.ok(fight.modes.includes(mode));
    if (process.env.PRIMAL_EXPECT_GDEVELOP) assert.equal(await page.evaluate(() => typeof gdjs.RuntimeGame), 'function'); assert.deepEqual(errors, []);
    if (process.env.PRIMAL_POLISH_REPORT) fs.writeFileSync(process.env.PRIMAL_POLISH_REPORT, JSON.stringify({ runtime: process.env.PRIMAL_EXPECT_GDEVELOP ? 'official GDevelop GDJS 5.6.283' : 'standalone browser', status: 'PASS', terrain: terrain.map(({ props, ...t }) => ({ ...t, propTypes: [...new Set(props)] })), fight, checks: ['four rendered biomes', 'native sprites/no smoothing', 'contact particles/hit-stop/recovery weak point', 'paused FX', 'phase-two HUD and double-charge warning', 'full first-boss fight through normal simulation inputs without HP edits'] }, null, 2) + '\n');
    console.log('PASS: terrain/combat/boss · four rendered biomes · hit-stop/particles · phase/range hints · full first-boss fight without HP edits');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
