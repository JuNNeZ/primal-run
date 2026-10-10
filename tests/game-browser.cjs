'use strict';
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const { chromium, browserOptions, localURL } = require('../tools/browser.cjs');
(async () => {
  const browser = await chromium.launch({ ...browserOptions(), args: ['--enable-unsafe-swiftshader'] });
  const errors = [], failures = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(String(error)));
    page.on('response', response => { if (response.status() >= 400) failures.push(response.status() + ' ' + response.url()); });
    const base = process.env.PRIMAL_GAME_URL || await localURL(path.resolve(__dirname, '../PRIMAL_RUN_Game/index.html'));
    await page.goto(base);await page.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{});
    await page.waitForFunction(() => window.primalRun && document.querySelector('[data-action="start"]:not(:disabled)'), null, { timeout: 30000 });
    assert.equal(await page.evaluate(() => primalRun.ready), true);
    assert.equal(await page.evaluate(() => document.querySelector('canvas[aria-label]').getContext('2d').imageSmoothingEnabled), false);
    if (process.env.PRIMAL_EXPECT_GDEVELOP) assert.equal(await page.evaluate(() => typeof gdjs.RuntimeGame), 'function');
    await page.locator('#player-name').fill('Raptor Test');
    await page.locator('[data-action="settings"]').click();
    await page.locator('[data-setting="music"]').fill('20');
    await page.locator('[data-setting="music"]').dispatchEvent('input');
    assert.equal(await page.evaluate(() => primalRun.game.save.settings.music), .2);
    assert.equal(await page.evaluate(() => primalRun.audio.context.state), 'running');
    await page.locator('[data-action="back"]').click();
    // This regression suite verifies the unlocked Utahraptor combat profile.
    await page.evaluate(() => { const g=primalRun.game; g.save.unlockedSpecies.push('utahraptor'); g.selectSpecies('utahraptor'); });
    await page.locator('[data-action="start"]').click();
    assert.equal(await page.evaluate(() => primalRun.game.phase), 'intro');
    assert.equal(await page.evaluate(() => primalRun.game.run), null, 'jagt starter først efter intro');
    await page.locator('[data-action="begin"]').click();await page.waitForFunction(()=>primalRun.game.phase==='playing');
    await page.waitForFunction(() => primalRun.game.phase === 'playing');
    assert.equal(await page.evaluate(() => primalRun.game.save.name), 'Raptor Test');
    await page.keyboard.down('d');
    await page.waitForFunction(() => primalRun.game.run.player.x > 500);
    await page.keyboard.up('d');
    await page.waitForFunction(() => !primalRun.game.run.player.moving);
    await page.keyboard.press('Escape');
    const seconds = await page.evaluate(() => primalRun.game.run.seconds);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => primalRun.game.run.seconds), seconds);
    await page.locator('[data-action="settings"]').click();
    await page.locator('[data-action="back"]').click();
    assert.equal(await page.evaluate(() => primalRun.game.phase), 'paused');
    await page.locator('[data-action="resume"]').click();
    // Exercise the public simulation, including real input and UI transitions.
    await page.evaluate(() => {
      const g = primalRun.game, r = g.run; r.enemies = []; r.pickups = []; r.spawnTimer = 999;
      r.player.x = 480; r.player.y = 340; r.player.facing = 'E'; r.attackCooldown = 0;
      g.spawn('compy', { x: 520, y: 340 }).hp = 10;
    });
    await page.keyboard.down('Space'); await page.waitForFunction(() => primalRun.game.run.kills >= 1); await page.keyboard.up('Space');
    assert.equal(await page.evaluate(() => primalRun.game.run.xp), 0, 'XP waits for pickup');
    await page.keyboard.down('f'); await page.waitForFunction(() => primalRun.game.run.totalMeat >= 1); await page.keyboard.up('f');
    await page.evaluate(() => { primalRun.game.addXP(6); });
    await page.waitForSelector('[data-mutation]');
    assert.equal(await page.locator('[data-mutation]').count(), 3);
    const frozenMutation = await page.evaluate(() => JSON.stringify(primalRun.game.run));
    await page.keyboard.down('d'); await page.keyboard.down('Space');
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => JSON.stringify(primalRun.game.run)), frozenMutation, 'world stays frozen during power-up selection');
    await page.locator('[data-mutation]').first().click();
    await page.keyboard.up('d'); await page.keyboard.up('Space');
    await page.waitForFunction(() => primalRun.game.phase === 'playing');
    for (let stage = 0; stage < 8; stage++) {
      await page.evaluate(() => {
        const g = primalRun.game, r = g.run; r.enemies = []; r.pickups = []; r.xp = 0;
        r.meat = g.currentLevel().target;
      });
      await page.waitForFunction(() => primalRun.game.run.enemies.some(e => e.boss));
      await page.waitForSelector('.boss-hud:not([hidden])');
      await page.evaluate(() => { primalRun.game.run.enemies.find(e => e.boss).hp = 0; });
      await page.waitForSelector('[data-action="next"]');
      await page.locator('[data-action="next"]').click();await page.waitForFunction(expected=>primalRun.game.phase==='result'||primalRun.game.run.levelIndex===expected,stage+1);
    }
    await page.waitForFunction(() => primalRun.game.phase === 'result');
    assert.equal(await page.evaluate(() => primalRun.game.run.result.victory), true);
    assert.ok(await page.evaluate(() => primalRun.game.save.dna >= 151));
    await page.locator('[data-action="shop"]').click();
    await page.locator('[data-buy="health"]').click();
    assert.equal(await page.evaluate(() => primalRun.game.save.upgrades.health), 1);
    await page.locator('[data-action="menu"]').click(); await page.locator('[data-action="scores"]').click();
    await page.locator('[data-records-tab="top"]').click();
    assert.match(await page.locator('tbody').innerText(), /Raptor Test/);
    await page.reload(); await page.waitForFunction(() => window.primalRun && document.querySelector('[data-action="start"]:not(:disabled)'));
    assert.equal(await page.evaluate(() => primalRun.game.save.upgrades.health), 1);
    assert.equal(await page.evaluate(() => primalRun.game.save.settings.music), .2);
    await page.locator('[data-action="start"]').click();
    await page.locator('[data-action="begin"]').click();await page.waitForFunction(()=>primalRun.game.phase==='playing');
    assert.equal(await page.evaluate(() => primalRun.game.run.maxHealth), 102);
    await page.evaluate(() => { primalRun.game.run.invulnerable = 0; primalRun.game.damage(9999); });
    await page.waitForSelector('[data-action="shop"]');
    assert.equal(await page.evaluate(() => primalRun.game.save.scores.length), 2);
    await page.locator('[data-action="start"]').click();
    await page.locator('[data-action="begin"]').click();await page.waitForFunction(()=>primalRun.game.phase==='playing');
    assert.equal(await page.evaluate(() => primalRun.game.run.stage), 0);
    await page.evaluate(() => { window.dispatchEvent(new Event('blur')); });
    await page.waitForFunction(() => primalRun.game.phase === 'paused');
    assert.equal(await page.evaluate(() => primalRun.keys.size), 0);
    assert.equal(await page.evaluate(() => primalRun.audio.error), null);
    const screenshotDir = process.env.PRIMAL_SCREENSHOT_DIR;
    if (screenshotDir) {
      fs.mkdirSync(screenshotDir, { recursive: true });
      await page.screenshot({ path: path.join(screenshotDir, 'pause.png'), fullPage: true });
      await page.locator('[data-action="resume"]').click();
      await page.screenshot({ path: path.join(screenshotDir, 'game.png'), fullPage: true });
      await page.keyboard.press('Escape'); await page.locator('[data-action="abandon"]').click();
      await page.locator('[data-action="menu"]').click();
      await page.screenshot({ path: path.join(screenshotDir, 'menu.png'), fullPage: true });
    }
    await context.close();
    // Storage denial must not prevent the game from starting.
    const deniedContext = await browser.newContext();
    const denied = await deniedContext.newPage();
    denied.on('pageerror', error => errors.push(String(error)));
    await denied.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage disabled'); } }); });
    await denied.goto(base);await denied.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{}); await denied.waitForFunction(() => window.primalRun && document.querySelector('[data-action="start"]:not(:disabled)'));
    await denied.locator('[data-action="start"]').click();
    await denied.locator('[data-action="begin"]').click();
    await denied.evaluate(() => { primalRun.game.addDNA(2); });
    assert.equal(await denied.evaluate(() => primalRun.game.storageAvailable), false);
    assert.match(await denied.locator('.save-status').innerText(), /kun denne session/);
    await deniedContext.close();
    assert.deepEqual(errors, [], 'no page errors'); assert.deepEqual(failures, [], 'all resources load');
    console.log('PASS: ' + (process.env.PRIMAL_EXPECT_GDEVELOP ? 'GDevelop GDJS export' : 'browser game') + ' · menu/name · sound controls/music · movement/bite/meat · pause · mutations · 8 bosses/victory · DNA shop · reload/highscore · death/restart · storage denial');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
