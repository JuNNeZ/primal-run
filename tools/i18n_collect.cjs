#!/usr/bin/env node
'use strict';
// Visits every screen in headless Chromium with a non-Danish language selected and writes
// all on-screen Danish strings that have no translation yet. Usage: node tools/i18n_collect.cjs out.json [lang]
const fs = require('node:fs'), path = require('node:path');
const { chromium, browserOptions, localURL } = require('./browser.cjs');
(async () => {
  const out = path.resolve(process.argv[2] || 'i18n-missing.json'), lang = process.argv[3] || 'en';
  const browser = await chromium.launch(browserOptions()), page = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(l => { try { localStorage.setItem('primalRun.save.v1', JSON.stringify({ version: 2, settings: { language: l } })); } catch (_) {} }, lang);
  await page.goto(await localURL(path.resolve(__dirname, '../PRIMAL_RUN_Game/index.html')));
  await page.waitForSelector('[data-action="start"]:not(:disabled)', { timeout: 60000 });
  const settle = () => page.waitForTimeout(150);
  for (const phase of ['menu', 'species', 'shop', 'achievements', 'guide', 'settings', 'help', 'scores']) { await page.evaluate(p => { primalRun.game.phase = p; }, phase); await settle(); }
  await page.click('[data-action="start"]'); await settle();
  await page.evaluate(async () => {
    const g = primalRun.game, I = PrimalI18n, C = PrimalCore; g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES);
    const tick = () => new Promise(r => requestAnimationFrame(() => r()));
    for (const species of Object.keys(C.PLAYER_SPECIES)) { g.phase = 'intro'; g.selectSpecies(species); await tick(); await tick(); }
    for (let level = 0; level < 8; level++) {
      g.phase = 'menu'; g.start({ seed: 1000 + level }); for (let i = 0; i < level; i++) { g.phase = 'cleared'; g.run.bossDefeated = true; g.nextStage(); }
      const r = g.run; for (const z of r.map.zones) { r.player.x = z.x; r.player.y = z.y; for (let i = 0; i < 15; i++) g.step(1 / 30, {}); await tick(); }
      r.meat = 999; for (let i = 0; i < 30 && !r.bossSpawned; i++) g.step(1 / 30, {});
      const boss = r.enemies.find(e => e.boss); if (boss) { r.player.x = boss.x + 150; r.player.y = boss.y; for (let i = 0; i < 90; i++) { r.invulnerable = 1; g.step(1 / 30, {}); if (i % 10 === 0) await tick(); } boss.mode = 'recover'; boss.timer = 1; await tick(); boss.mode = 'broken'; boss.timer = 1; await tick(); boss.mode = 'enrage'; await tick(); }
      g.phase = 'paused'; await tick(); g.phase = 'playing'; g.addXP(200); await tick(); if (g.phase === 'mutation') { g.choose(r.choices[0]); await tick(); }
      r.rareRewards = 1; g.offerRareReward(); await tick(); if (g.phase === 'mutation') g.choose(r.choices[0]);
      if (boss) { boss.hp = 0; g.step(1 / 30, {}); await tick(); }
    }
    g.phase = 'playing'; const site = g.run.map.sites.find(s => s.type === 'nest'); if (site) { g.run.activeSite = site.id; g.phase = 'exploration'; await tick(); g.explore(false); }
    g.phase = 'playing'; g.run.invulnerable = 0; g.damage(9999); await tick(); await tick();
    for (const m of C.MUTATIONS) { I.t(m.name); I.t(m.text); }
    for (const a of C.ACHIEVEMENTS) { I.t(a.name); I.t(a.text); }
  });
  await settle();
  const missing = await page.evaluate(() => [...PrimalI18n.missing].sort());
  fs.writeFileSync(out, JSON.stringify({ lang, count: missing.length, errors, missing }, null, 1));
  console.log('missing', missing.length, 'errors', errors.length);
  await browser.close();
})().catch(e => { console.error(e); process.exitCode = 1; });
