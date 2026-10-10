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

    // ---- B1c / X9: every boss attack pattern has a telegraph shape; Benny's dive circle sits on the target.
    {
      await open('en');
      const b1c = await page.evaluate(() => {
        const g = primalRun.game, C = PrimalCore; g.phase = 'menu'; g.start({ seed: 5 });
        const r = g.run; for (let i = 0; i < 2; i++) { g.phase = 'cleared'; r.bossDefeated = true; g.nextStage(); }
        Object.assign(r, { enemies: [], spawnTimer: 1e9, bossSpawned: true }); const shapes = [];
        for (const kind of ['pachycephalosaurus', 'carnotaurus', 'baryonyx', 'deinosuchus', 'ankylosaurus', 'triceratops', 'tyrannosaurus'])
          for (const pattern of [0, 1, 2, 3, 4, 5]) {
            const e = { kind, boss: true, pattern, radius: 32, facingX: 1, facingY: 0, chargeX: 1, chargeY: 0, attackRadius: 90, bossPhase: 1, x: 100, y: 100, targetX: 300, targetY: 120, timer: .5, windupDuration: 1.2, mode: 'windup' };
            const s = primalRun.telegraphShape(e); shapes.push({ kind, pattern, ok: !!s && (s.radius > 0 || s.length > 0), at: s && s.at ? s.at.x : null });
          }
        // Live dive on level 3: freeze the frame mid-windup for the screenshot.
        const pts = r.map.riverCurve, mid = pts[Math.floor(pts.length / 2)];
        Object.assign(r.player, { x: mid.x + 160, y: mid.y }); const boss = g.spawn(C.LEVELS[2].boss, { x: mid.x + 10, y: mid.y }, true); boss.alert = true;
        for (let i = 0; i < 120 && !(boss.mode === 'windup' && boss.pattern === 4 && boss.timer < 1); i++) { r.invulnerable = 1; g.step(1 / 30, {}); }
        return { shapes, dive: boss.mode === 'windup' && boss.pattern === 4, name: boss.attackName };
      });
      assert.ok(b1c.shapes.every(s => s.ok), JSON.stringify(b1c.shapes.filter(s => !s.ok)));
      assert.ok(b1c.shapes.filter(s => s.pattern >= 4).every(s => s.at === 300), 'dive/ASKEKAST circles sit on the target');
      assert.equal(b1c.dive, true, 'Benny dives near the river');
      await page.waitForTimeout(120); await page.screenshot({ path: path.join(shots, 'part_b_b1c_dive.png') });
      checks.push('B1c: telegraph shapes for 7 bosses × 6 patterns, Benny dive telegraph "' + b1c.name + '"');
    }

    // ---- B7 Dagens jagt: menu button → daily screen → run → result line → local list; 390 px wide, da/de.
    for (const lang of ['da', 'de']) {
      await page.setViewportSize({ width: 390, height: 844 }); await open(lang);
      await page.locator('[data-action="daily"]').click();
      const panel = await page.locator('.daily-panel').innerText();
      const today = await page.evaluate(() => primalRun.game.dailyHunt());
      assert.match(panel, new RegExp(String(today.seed))); assert.match(panel, lang === 'da' ? /DAGENS JAGT/ : /TAGESJAGD/);
      await page.locator('[data-action="daily-start"]').click();
      await page.waitForFunction(() => primalRun.game.phase === 'playing' && primalRun.game.run.daily);
      const run = await page.evaluate(() => { const g = primalRun.game; return { seed: g.run.seed, species: g.run.species, chosen: g.save.selectedSpecies }; });
      assert.equal(run.seed, today.seed); assert.equal(run.species, today.species);
      await page.evaluate(() => { const g = primalRun.game; g.run.score = 321; g.run.invulnerable = 0; g.damage(99999); });
      await page.waitForSelector('.daily-result');
      const line = await page.locator('.daily-result').innerText();
      assert.match(line, lang === 'da' ? /Dagens jagt · .* · plads 1 af 1/ : /Tagesjagd · .* · Platz 1 von 1/, line);
      const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]); assert.ok(w[0] <= w[1], 'no horizontal scroll ' + w);
      await page.locator('.actions [data-action="daily"]').click(); assert.equal(await page.locator('.daily-list tbody tr').count(), 1);
      if (lang === 'da') await page.screenshot({ path: path.join(shots, 'part_b_b7_daily.png') });
      checks.push('B7 ' + lang + ': daily seed ' + today.seed + ' (' + today.species + '), result "' + line + '", list 1 row, 390 px');
    }
    await page.setViewportSize({ width: 960, height: 640 });

    // ---- B6 Udfordringer: pick 3 (a 4th is disabled), forced intro lists them, run carries them, result line; en + ja at 390 px.
    for (const lang of ['da', 'ja']) {
      await page.setViewportSize({ width: 390, height: 844 }); await open(lang, { settings: { language: lang, languageChosen: true, skipIntro: true } });
      await page.locator('[data-action="challenges"]').click();
      assert.equal(await page.locator('[data-action="challenge-start"]').isDisabled(), true, 'needs at least one');
      for (const id of ['fragile', 'toughBosses', 'swiftFoes']) await page.locator(`[data-challenge="${id}"]`).check();
      assert.equal(await page.locator('[data-challenge="weakHealing"]').isDisabled(), true, 'max 3');
      assert.match(await page.locator('.challenge-bonus').innerText(), /45 %/);
      await page.locator('[data-action="challenge-start"]').click();
      await page.waitForSelector('.intro-challenges'); const intro = await page.locator('.intro-challenges').innerText();
      assert.match(intro, lang === 'da' ? /Skrøbelig[\s\S]*Seje bosser[\s\S]*Hurtige fjender/ : /もろい体[\s\S]*タフなボス[\s\S]*素早い敵/, intro);
      if (lang === 'da') await page.screenshot({ path: path.join(shots, 'part_b_b6_intro.png') });
      await page.locator('[data-action="begin"]').click(); await page.waitForFunction(() => primalRun.game.phase === 'playing');
      const run = await page.evaluate(() => ({ list: primalRun.game.run.challenges, count: primalRun.game.run.partB.challengeCount }));
      assert.deepEqual(run, { list: ['fragile', 'toughBosses', 'swiftFoes'], count: 3 });
      await page.evaluate(() => { const g = primalRun.game; g.run.invulnerable = 0; g.damage(99999); });
      await page.waitForSelector('.challenge-result'); const line = await page.locator('.challenge-result').innerText();
      assert.match(line, lang === 'da' ? /Udfordringer · Skrøbelig · Seje bosser · Hurtige fjender · \+45 % DNA/ : /チャレンジ · もろい体 · タフなボス · 素早い敵 · DNA \+45 %/, line);
      const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]); assert.ok(w[0] <= w[1], 'no horizontal scroll ' + w);
      // A normal new hunt starts without challenges.
      await page.locator('[data-action="start"]').first().click(); await page.waitForFunction(() => primalRun.game.phase === 'playing');
      assert.deepEqual(await page.evaluate(() => primalRun.game.run.challenges), []);
      checks.push('B6 ' + lang + ': 3 challenges (4th disabled), forced intro, result "' + line + '", next normal hunt has none');
    }
    await page.setViewportSize({ width: 960, height: 640 });

    // ---- B8 Fiskekonge: progress on the species screen, then the Baryonyx-only skin unlocked and selectable (da + sv).
    for (const lang of ['da', 'sv']) {
      await open(lang, { settings: { language: lang, languageChosen: true, skipIntro: true }, baryonyxFish: 12, unlockedSpecies: ['baryonyx'] });
      await page.evaluate(() => { primalRun.game.phase = 'species'; });
      await page.waitForSelector('.fish-king-progress'); const progress = await page.locator('.fish-king-progress').innerText();
      assert.match(progress, lang === 'da' ? /Fiskekonge: 12\/30 fisk som Baryonyx/ : /Fiskkung: 12\/30 fiskar som Baryonyx/, progress);
      assert.equal(await page.locator('[data-skin="fishKing"]').isDisabled(), true);
      await page.evaluate(() => { const g = primalRun.game; g.save.baryonyxFish = 30; g.checkAchievements(); g.phase = 'menu'; });
      await page.waitForTimeout(150); await page.evaluate(() => { primalRun.game.phase = 'species'; });
      await page.waitForFunction(() => !document.querySelector('.fish-king-progress'));
      await page.locator('[data-skin="fishKing"]').click();
      const state = await page.evaluate(() => ({ skin: primalRun.game.save.skin, label: document.querySelector('[data-skin="fishKing"]').innerText, fits: PrimalCore.skinFits('fishKing', 'tyrannosaurus') }));
      assert.equal(state.skin, 'fishKing'); assert.match(state.label, lang === 'da' ? /kun Baryonyx/ : /endast Baryonyx/); assert.equal(state.fits, false);
      if (lang === 'da') await page.screenshot({ path: path.join(shots, 'part_b_b8_skin.png') });
      checks.push('B8 ' + lang + ': progress "' + progress + '", skin unlocked + selected, label "' + state.label.replace(/\s+/g, ' ') + '"');
    }

    assert.deepEqual(errors, []);
    console.log('part-b browser OK\n- ' + checks.join('\n- '));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
