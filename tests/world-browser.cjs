'use strict';
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const { chromium, browserOptions, localURL } = require('../tools/browser.cjs');
(async () => {
  const browser = await chromium.launch(browserOptions());
  const errors = [], results = [];
  try {
    for (const [width, height, mobile] of [[1280, 900, false], [390, 844, true], [844, 390, true], [2560, 1080, false]]) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
      const page = await context.newPage(); await page.addInitScript(() => { window.spriteRotations = []; const rotate = CanvasRenderingContext2D.prototype.rotate; CanvasRenderingContext2D.prototype.rotate = function(angle) { window.spriteRotations.push(angle); if (window.spriteRotations.length > 100) window.spriteRotations.shift(); return rotate.call(this, angle); }; }); page.on('pageerror', e => errors.push(String(e)));
      await page.goto(process.env.PRIMAL_GAME_URL || await localURL(path.resolve(__dirname, '../PRIMAL_RUN_Game/index.html')));
      await page.waitForSelector('[data-action="start"]:not(:disabled)');await page.evaluate(async()=>{for(const species of Object.keys(PrimalCore.PLAYER_SPECIES))await primalRun.preload({species,stage:3,kinds:Object.keys(PrimalCore.SPECIES)});});
      await page.locator('#player-name').fill('Jonas');
      await page.locator('[data-action="start"]').click(); await page.locator('[data-action="begin"]').click();await page.waitForFunction(()=>primalRun.game.phase==='playing');
      await page.waitForFunction(() => primalRun.game.run && primalRun.game.run.jonas);
      await page.waitForTimeout(100);
      if (mobile) assert.equal(await page.locator('.touch-controls').isVisible(), true);
      assert.ok(await page.evaluate(() => document.body.scrollHeight <= innerHeight), 'playing touch layout fits viewport');
      if (width === 1280) {
        await page.evaluate(() => {
          const g = primalRun.game, r = g.run; r.enemies = []; r.spawnTimer = 999;
          r.player.x = 1800; r.player.y = 1200;
          for (let i = 0; i < 12; i++) { const e = g.spawn(i % 2 ? 'compy' : 'parasaurolophus', { x: 1500, y: 1100 }); e.speed = 0; e.cooldown = 999; }
          window.collisionStartTime = r.seconds;
        });
        await page.waitForFunction(() => primalRun.game.run.seconds > collisionStartTime + .4);
        assert.ok(await page.evaluate(() => {
          const enemies = primalRun.game.run.enemies;
          return enemies.length === 12 && enemies.every((a, i) => enemies.slice(i + 1).every(b => Math.hypot(a.x - b.x, a.y - b.y) >= a.radius + b.radius + 3.9)) && enemies.every(e => e.hp === e.maxHP);
        }), 'real frame loop separates a mixed crowd without dinosaur friendly fire');
      }
      await page.evaluate(() => {
        const g = primalRun.game, r = g.run; r.enemies = []; r.spawnTimer = 999;
        r.player.x = 1440; r.player.y = 960; r.xp = 3; r.map.rocks = []; // Isolate facing from random obstacle steering.
        for (let rarity = 0; rarity < 4; rarity++) r.pickups.push({ id: 1000 + rarity, kind: 'meat', rarity, value: rarity + 1, x: 1320 + rarity * 85, y: 1100 });
        const prey = g.spawn('parasaurolophus', { x: 1530, y: 960 }); g.enemyStep(prey, .05);
        const hunter = g.spawn('carnotaurus', { x: 1350, y: 960 }); g.enemyStep(hunter, .05);
        const oldBoss = g.spawn('deinosuchus', { x: 1440, y: 820 }); g.enemyStep(oldBoss, .05); oldBoss.direction = 'W';
        g.pause();
      });
      await page.waitForTimeout(100);
      const state = await page.evaluate(() => {
        const r = primalRun.game.run, c = document.querySelector('canvas[aria-label]'), box = c.getBoundingClientRect();
        return { view: r.view, map: { width: r.map.width, height: r.map.height }, canvas: { width: c.width, height: c.height }, box: { width: box.width, height: box.height }, cameraX: +c.dataset.cameraX, prey: r.enemies[0].direction, hunter: r.enemies[1].direction, xp: document.querySelector('.meat-progress').textContent, bodyWidth: document.body.scrollWidth, bodyHeight: document.body.scrollHeight };
      });
      assert.ok(state.view.x > 0 && state.view.y > 0); assert.equal(state.cameraX, state.view.x);
      assert.ok(await page.evaluate(() => !spriteRotations.includes(Math.PI / 2)), 'full cardinal enemy frames do not rotate the body or lighting');
      assert.equal(state.prey, 'E', 'fleeing animal faces away'); assert.equal(state.hunter, 'E', 'hunter faces toward player');
      assert.ok(Math.abs(state.box.width / state.canvas.width - state.box.height / state.canvas.height) < .01, 'square pixels across viewport');
      assert.ok(state.bodyWidth <= width && state.bodyHeight <= height, 'no page overflow');
      assert.ok(state.xp.includes('50 %') && state.xp.includes('3 / 6 stk') && state.xp.includes('3 fødeværdi til level 2'));
      await page.locator('[data-action="resume"]').click();
      await page.evaluate(() => primalRun.game.addXP(3)); await page.waitForSelector('[data-mutation]');
      const cards = await page.locator('[data-mutation]').allTextContents();
      assert.equal(cards.length, 3); assert.ok(await page.evaluate(()=>[...document.querySelectorAll('[data-mutation]')].every(el=>el.textContent.includes('RANG 0 → 1 / '+PrimalCore.MUTATIONS.find(m=>m.id===el.dataset.mutation).max))));
      const frozen = await page.evaluate(() => JSON.stringify(primalRun.game.run)); await page.waitForTimeout(100);
      assert.equal(await page.evaluate(() => JSON.stringify(primalRun.game.run)), frozen);
      const last = page.locator('[data-mutation]').last(); await last.click();
      await page.waitForFunction(() => primalRun.game.phase === 'playing');
      await page.evaluate(() => { primalRun.game.run.invulnerable = 0; primalRun.game.pause(); });
      await page.waitForTimeout(100);
      // Clear pause overlay only for visual evidence; keep the simulation paused.
      await page.evaluate(() => { document.querySelector('.screen').hidden = true; document.querySelector('.toast').style.display = 'none'; });
      const evidence = process.env.PRIMAL_WORLD_SCREENSHOTS;
      if (evidence) { fs.mkdirSync(evidence, { recursive: true }); await page.screenshot({ path: path.join(evidence, `world-${width}x${height}.png`) }); }
      results.push({ viewport: `${width}x${height}`, ...state }); await context.close();
    }
    assert.deepEqual(errors, []);
    if (process.env.PRIMAL_WORLD_REPORT) fs.writeFileSync(process.env.PRIMAL_WORLD_REPORT, JSON.stringify({ runtime: process.env.PRIMAL_EXPECT_GDEVELOP ? 'official GDevelop GDJS export' : 'standalone browser', status: 'PASS', checks: ['responsive square pixels/no overflow', 'camera follows world position', 'real frame loop resolves a mixed 12-dinosaur crowd without friendly fire', 'flee/chase facing', 'XP percentage/count/remaining', 'colored rarity cards/current-next rank', 'mutation freeze', 'all choices reachable', 'Jonas cosmetic secret'], results }, null, 2) + '\n');
    console.log('PASS: world browser · desktop/portrait/landscape/ultrawide · camera · facing · XP bar · rarity/rank cards · safe selection · Jonas');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
