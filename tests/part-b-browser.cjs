'use strict';
// Part B browser checks (claude/part-b). Each package adds a section; screenshots go to previews/part_b_*.png.
const assert = require('node:assert/strict'), path = require('node:path');
const { chromium, browserOptions, localURL } = require('../tools/browser.cjs');
const shots = path.resolve(__dirname, '../PRIMAL_RUN_Game/previews');
(async () => {
  const browser = await chromium.launch(browserOptions()); const checks = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 640 } }), errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const url = process.env.PRIMAL_GAME_URL || await localURL(path.resolve(__dirname, '../PRIMAL_RUN_Game/index.html'));
    const open = async (lang, extra = {}) => {
      await page.goto(url);
      await page.evaluate(([l, x]) => { localStorage.clear(); localStorage.setItem('primalRun.save.v1', JSON.stringify({ version: 2, settings: { language: l, languageChosen: true, skipIntro: true }, ...x })); }, [lang, extra]);
      await page.reload(); await page.waitForFunction(() => window.primalRun && primalRun.ready);
    };

    // ---- B1a: Karl across the level-7 lava stalks outside the player's reach instead of feeding free hits.
    for (const lang of ['da', 'en']) {
      await open(lang);
      const b1a = await page.evaluate(() => {
        const g = primalRun.game, C = PrimalCore; g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.selectSpecies('ankylosaurus'); g.phase = 'menu'; g.start({ seed: 3 });
        const r = g.run; for (let i = 0; i < 6; i++) { g.phase = 'cleared'; r.bossDefeated = true; g.nextStage(); }
        Object.assign(r, { enemies: [], pickups: [], spawnTimer: 1e9, bossSpawned: true, invulnerable: 0 }); r.map.lavaCrossings = []; // a stretch with no crossing
        const pts = r.map.riverCurve, cx = r.map.width / 2, cy = r.map.height / 2; let best = null;
        for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, t = Math.max(0, Math.min(1, ((cx - a.x) * dx + (cy - a.y) * dy) / (len * len))), p = { x: a.x + t * dx, y: a.y + t * dy }, d = Math.hypot(p.x - cx, p.y - cy); if (!best || d < best.d) best = { d, p, n: { x: -dy / len, y: dx / len } }; }
        const at = k => ({ x: best.p.x + best.n.x * k, y: best.p.y + best.n.y * k });
        Object.assign(r.player, at(90)); const boss = g.spawn(C.LEVELS[6].boss, at(-60), true); boss.alert = true;
        for (let i = 0; i < 300; i++) g.step(1 / 30, { attack: true });
        return { mode: boss.mode, hp: boss.hp, maxHP: boss.maxHP, lava: C.isLava(r.stage, r.map, boss), stage: r.stage };
      });
      assert.equal(b1a.stage, 3); assert.equal(b1a.lava, false); assert.equal(b1a.mode, 'stalk', JSON.stringify(b1a)); assert.equal(b1a.hp, b1a.maxHP, 'no free damage across the lava');
      await page.waitForTimeout(250);
      const hud = await page.locator('.boss-hud b').innerText();
      assert.match(hud, lang === 'da' ? /LURER VED BREDDEN/ : /LURKING ON THE BANK/, hud);
      if (lang === 'da') await page.screenshot({ path: path.join(shots, 'part_b_b1a_stalk.png') });
      checks.push('B1a ' + lang + ': Karl stalks across lava, HP intact, HUD "' + hud.split(' · ').pop() + '"');
    }

    // ---- B1b: the level-7 basalt crossing is drawn and walkable for animals (no lava inside 70 px).
    {
      await open('da');
      const b1b = await page.evaluate(() => {
        const g = primalRun.game, C = PrimalCore; g.phase = 'menu'; g.start({ seed: 3 });
        const r = g.run; for (let i = 0; i < 6; i++) { g.phase = 'cleared'; r.bossDefeated = true; g.nextStage(); }
        Object.assign(r, { enemies: [], spawnTimer: 1e9 }); const c = r.map.lavaCrossings[0]; Object.assign(r.player, { x: c.x, y: c.y + 90 }); g.step(1 / 30, {});
        return { count: r.map.lavaCrossings.length, lava: C.isLava(r.stage, r.map, c) };
      });
      assert.equal(b1b.count, 2); assert.equal(b1b.lava, false);
      await page.waitForTimeout(250); await page.screenshot({ path: path.join(shots, 'part_b_b1b_crossing.png') });
      checks.push('B1b: 2 basalt crossings, crossing centre is not lava');
    }

    assert.deepEqual(errors, []);
    console.log('part-b browser OK\n- ' + checks.join('\n- '));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
