#!/usr/bin/env node
'use strict';
// Captures review screenshots of the real game in headless Chromium.
// Usage: node tools/screenshots.cjs <outDir>
const fs = require('node:fs'), path = require('node:path');
const { chromium, browserOptions, localURL } = require('./browser.cjs');
const out = path.resolve(process.argv[2] || 'shots'); fs.mkdirSync(out, { recursive: true });
const log = [];
(async () => {
  const browser = await chromium.launch(browserOptions());
  const shoot = async (page, name) => { await page.waitForTimeout(120); await page.screenshot({ path: path.join(out, name + '.png'), timeout: 20000 }); log.push('shot ' + name); fs.writeFileSync(path.join(out, 'log.txt'), log.join('\n')); };
  for (const viewport of [{ width: 1280, height: 800, tag: 'desktop' }, { width: 390, height: 844, tag: 'mobile' }]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    page.on('pageerror', e => log.push('[' + viewport.tag + '] pageerror ' + e));
    page.on('console', m => { if (m.type() === 'error') log.push('[' + viewport.tag + '] console ' + m.text()); });
    await page.goto(process.env.PRIMAL_GAME_URL || await localURL(path.resolve(__dirname, '../PRIMAL_RUN_Game/index.html')));
    await page.waitForSelector('[data-action="start"]:not(:disabled)', { timeout: 60000 });
    await page.waitForTimeout(600);
    await shoot(page, viewport.tag + '-01-menu');
    await page.click('[data-action="start"]'); await page.waitForTimeout(300);
    await shoot(page, viewport.tag + '-02-intro');
    if (viewport.tag === 'mobile') { await page.close(); continue; }
    log.push('preloading'); fs.writeFileSync(path.join(out, 'log.txt'), log.join('\n'));
    await Promise.race([page.evaluate(async () => { for (let stage = 0; stage < 4; stage++) await primalRun.preload({ species: 'velociraptor', stage }); }), page.waitForTimeout(90000)]);
    log.push('preloaded');
    const scene = async (name, setup, arg) => {
      const info = await page.evaluate(setup, arg);
      await page.evaluate(() => { const g = primalRun.game; if (g.phase === 'playing') g.pause(); primalRun.update(performance.now()); document.querySelector('.screen').hidden = primalRun.game.phase === 'paused'; });
      await shoot(page, name); if (info) log.push(name + ' ' + JSON.stringify(info));
    };
    for (let level = 0; level < 8; level += 2) {
      await scene('desktop-1' + level + '-level' + (level + 1), level => {
        const g = primalRun.game; g.phase = 'menu'; g.start({ seed: 4242 });
        for (let i = 0; i < level; i++) { g.phase = 'cleared'; g.run.bossDefeated = true; g.nextStage(); }
        const r = g.run, z = r.map.zones[1 + level % (r.map.zones.length - 1)]; r.player.x = z.x; r.player.y = z.y;
        for (let i = 0; i < 30; i++) g.step(1 / 30, {}); g.drainEvents();
        return { level: r.levelIndex, zone: z.name, enemies: r.enemies.length, nearby: r.enemies.filter(e => Math.hypot(e.x - r.player.x, e.y - r.player.y) < 700).map(e => e.kind) };
      }, level);
    }
    await scene('desktop-20-herbivore-forage', () => {
      const g = primalRun.game; g.phase = 'menu'; g.save.unlockedSpecies = Object.keys(PrimalCore.PLAYER_SPECIES); g.selectSpecies('triceratops'); g.start({ seed: 77 });
      const r = g.run, f = r.map.forage[0]; r.player.x = f.x + 60; r.player.y = f.y + 40; for (let i = 0; i < 10; i++) g.step(1 / 30, {}); return { forage: r.map.forage.length };
    });
    await scene('desktop-21-boss-windup', () => {
      const g = primalRun.game; g.phase = 'menu'; g.selectSpecies('velociraptor'); g.start({ seed: 5 }); const r = g.run; r.enemies = []; r.spawnTimer = 999;
      const boss = g.spawn('carnotaurus', { x: r.player.x + 160, y: r.player.y - 40 }, true); boss.cooldown = 0; g.step(1 / 30, {}); g.step(.2, {});
      const c = g.spawn('compy', { x: r.player.x - 60, y: r.player.y + 30 }); g.provoke(c); c.cooldown = 0; c.x = r.player.x - 22; c.y = r.player.y; g.step(1 / 60, {}); return { mode: boss.mode, name: boss.attackName };
    });
    await scene('desktop-22-combat-crit', () => {
      const g = primalRun.game; g.random = () => 0; const r = g.run; r.enemies = r.enemies.filter(e => !e.boss);
      const e = g.spawn('parasaurolophus', { x: r.player.x + 40, y: r.player.y }); r.player.facing = 'E'; g.resolveBite('E'); g.random = Math.random; g.step(1 / 60, {}); return { effects: r.effects.map(f => f.text) };
    });
    await scene('desktop-24-achievements', () => { const g = primalRun.game; g.phase = 'achievements'; return null; });
    await scene('desktop-25-species', () => { const g = primalRun.game; g.phase = 'species'; return null; });
    await scene('desktop-26-menu-again', () => { const g = primalRun.game; g.phase = 'menu'; return null; });
    await scene('desktop-23-mutation', () => { const g = primalRun.game; g.phase = 'playing'; g.addXP(50); return { phase: g.phase }; });
    await page.close();
  }
  for (const lang of ['ja', 'de']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => log.push('[' + lang + '] pageerror ' + e));
    await page.addInitScript(l => { try { localStorage.setItem('primalRun.save.v1', JSON.stringify({ version: 2, settings: { language: l } })); } catch (_) {} }, lang);
    await page.goto(process.env.PRIMAL_GAME_URL || await localURL(path.resolve(__dirname, '../PRIMAL_RUN_Game/index.html')));
    await page.waitForSelector('[data-action="start"]:not(:disabled)', { timeout: 60000 }); await page.waitForTimeout(500);
    await shoot(page, lang + '-01-menu');
    await page.evaluate(() => { const g = primalRun.game; g.phase = 'menu'; g.start({ seed: 4242 }); const r = g.run, z = r.map.zones[1]; r.player.x = z.x; r.player.y = z.y; for (let i = 0; i < 30; i++) g.step(1 / 30, {}); g.pause(); primalRun.update(performance.now()); document.querySelector('.screen').hidden = true; });
    await shoot(page, lang + '-02-game');
    await page.evaluate(() => { const g = primalRun.game; g.phase = 'playing'; g.addXP(50); }); await page.waitForTimeout(200);
    await shoot(page, lang + '-03-mutation');
    await page.close();
  }
  await browser.close();
})().catch(e => { log.push('FATAL ' + (e.stack || e)); process.exitCode = 1; }).finally(() => fs.writeFileSync(path.join(out, 'log.txt'), log.join('\n') + '\n'));
