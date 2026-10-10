'use strict';
// Q8 + Q13: run card after a scripted compy death, and the records screen at 390×844 in da/de/ja.
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const { chromium, browserOptions, localURL } = require('../tools/browser.cjs');
(async () => {
  const browser = await chromium.launch(browserOptions()); const checks = [];
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } }), errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const url = process.env.PRIMAL_GAME_URL || await localURL(path.resolve(__dirname, '../PRIMAL_RUN_Game/index.html'));
    const noScroll = async label => { const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]); assert.ok(w[0] <= w[1], label + ' horizontal scroll ' + w); };
    for (const lang of ['da', 'de', 'ja']) {
      await page.goto(url); await page.evaluate(l => { localStorage.clear(); localStorage.setItem('primalRun.save.v1', JSON.stringify({ version: 2, settings: { language: l, languageChosen: true, skipIntro: true }, lifetime: { runs: 4, kills: 31, distance: 104000 } })); }, lang);
      await page.reload(); await page.waitForFunction(() => window.primalRun && primalRun.ready);
      // Scripted compy death (Q13).
      await page.evaluate(() => { const g = primalRun.game; g.phase = 'menu'; g.start({ seed: 21 }); const r = g.run; r.enemies = []; r.spawnTimer = 999; r.seconds = 120; const c = g.spawn('compy', { x: r.player.x + 30, y: r.player.y }); r.invulnerable = 0; g.damage(9999, c); });
      await page.waitForSelector('.run-card');
      const card = await page.locator('.run-card').innerText(), cause = await page.locator('.run-cause').innerText();
      if (lang === 'da') { assert.match(card, /Compy-snack/); assert.match(cause, /Dødsårsag\s+Compsognathus/); }
      if (lang === 'de') { assert.match(card, /Compy-Snack/); assert.match(cause, /Todesursache\s+Compsognathus/); }
      if (lang === 'ja') { assert.match(card, /コンピーのおやつ/); assert.match(cause, /死因/); }
      await noScroll(lang + ' result');
      // "Del resultat" copies a text card (clipboard stubbed so the test needs no permission prompt).
      await page.evaluate(() => { window.__shared = null; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: t => { window.__shared = t; return Promise.resolve(); } } }); });
      await page.locator('[data-action="share-card"]').click(); const shared = await page.evaluate(() => window.__shared);
      assert.match(shared, /^PRIMAL RUN · ★ /); assert.match(shared, /Seed 21/); assert.match(shared, lang === 'da' ? /Compy-snack[\s\S]*Dødsårsag: Compsognathus/ : lang === 'de' ? /Compy-Snack[\s\S]*Todesursache: Compsognathus/ : /コンピーのおやつ/);
      // Records screen (Q8): both boards and every scope render without horizontal scroll and without missing translations.
      await page.evaluate(() => { PrimalI18n.missing.clear(); });
      await page.locator('.run-card ~ .actions [data-action="scores"], [data-action="scores"]').first().click();
      assert.equal(await page.locator('.record-row').count(), 29);
      assert.match(await page.locator('.records-list').innerText(), lang === 'da' ? /Distance i alt\s+5,2 km/ : lang === 'de' ? /Distanz insgesamt\s+5,2 km/ : /累計距離\s+5\.2 km/);
      await noScroll(lang + ' fame');
      await page.locator('[data-records-tab="shame"]').click(); assert.equal(await page.locator('.record-row').count(), 25);
      assert.match(await page.locator('.records-list').innerText(), lang === 'da' ? /Ædt af en compy\s+1/ : lang === 'de' ? /Von einem Compy gefressen\s+1/ : /コンピーに食べられた\s+1/);
      for (const scope of ['day', 'week', 'month', 'allTime']) { await page.locator(`[data-records-scope="${scope}"]`).click(); await noScroll(lang + ' ' + scope); }
      await page.locator('[data-records-tab="top"]').click(); assert.equal(await page.locator('tbody tr').count(), 1);
      // Other screens (HUD) have unrelated untranslated strings, so check the records UI itself: no Danish label may survive.
      if (lang !== 'da') assert.deepEqual(await page.evaluate(() => { const own = [...PrimalCore.RECORDS.STATS.map(d => d.label), 'I dag', 'Uge', 'Måned', 'Altid', 'Rekorder'];
        return [...PrimalI18n.missing].filter(m => own.includes(m)); }), [], lang + ' missing translations');
      if (lang !== 'da') { await page.locator('[data-records-tab="fame"]').click(); const text = await page.locator('.screen').innerText();
        assert.deepEqual(await page.evaluate(t => PrimalCore.RECORDS.STATS.map(d => d.label).filter(l => PrimalI18n.t(l) !== l && t.includes(l)), text), [], lang + ' Danish labels left'); }
      await page.screenshot({ path: path.join(process.env.PRIMAL_SCREENSHOT_DIR || require('node:os').tmpdir(), `records-${lang}-390.png`) });
      checks.push(lang + ': compy death card, 29 fame / 25 shame rows, 4 scopes, top 10, no horizontal scroll at 390x844');
    }
    assert.deepEqual(errors, []);
    if (process.env.PRIMAL_RECORDS_REPORT) fs.writeFileSync(process.env.PRIMAL_RECORDS_REPORT, JSON.stringify({ status: 'PASS', runtime: 'standalone Chromium', checks }, null, 2) + '\n');
    console.log('records browser: PASS\n' + checks.join('\n'));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
