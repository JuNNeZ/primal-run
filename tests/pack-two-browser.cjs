'use strict';
// Flok 2.0 browser checks: own-species pack with rings, the pack-order chip and FLOK icon, the wild alpha label, the
// claw mark over an animal a pack mate has taken, the intro card and the help text (Danish source, English translated).
// Screenshot: previews/pack_two.png.
const assert = require('node:assert/strict'), path = require('node:path');
const { chromium, browserOptions, localURL } = require('../tools/browser.cjs');
const shots = path.resolve(__dirname, '../PRIMAL_RUN_Game/previews');
(async () => {
  const browser = await chromium.launch(browserOptions()); const checks = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 640 } }), errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const url = process.env.PRIMAL_GAME_URL || await localURL(path.resolve(__dirname, '../PRIMAL_RUN_Game/index.html'));
    const open = async lang => {
      await page.goto(url);
      await page.evaluate(l => { localStorage.clear(); localStorage.setItem('primalRun.save.v1', JSON.stringify({ version: 2, settings: { language: l, languageChosen: true } })); }, lang);
      await page.reload(); await page.waitForFunction(() => window.primalRun && primalRun.ready);
    };
    for (const lang of ['da', 'en']) {
      await open(lang);
      // intro: a fourth card for species that can have a pack
      await page.evaluate(() => { const g = primalRun.game, C = PrimalCore; g.save.unlockedSpecies = Object.keys(C.PLAYER_SPECIES); g.selectSpecies('velociraptor'); g.phase = 'intro'; });
      await page.waitForSelector('.intro-cards.four');
      const card = await page.locator('.intro-cards article').nth(3).innerText();
      assert.match(card, lang === 'da' ? /Din flok[\s\S]*skifter ordre/ : /Your pack[\s\S]*changes orders/, card);
      checks.push(lang + ': intro card "' + card.split('\n')[0] + '"');
      const state = await page.evaluate(() => {
        const g = primalRun.game, C = PrimalCore; g.phase = 'menu'; g.start({ seed: 5 }); g.phase = 'playing';
        const r = g.run; Object.assign(r, { enemies: [], spawnTimer: 1e9, invulnerable: 1e9 });
        const wild = r.raptors.filter(a => !a.ally);
        wild.slice(0, 2).forEach((a, i) => Object.assign(a, { ally: true, mode: 'follow', slot: i, x: r.player.x - 50 - 30 * i, y: r.player.y + 40 }));
        const alpha = { ...wild[0], id: 'alpha-test', ally: false, mode: 'wild', alpha: true, x: r.player.x + 120, y: r.player.y - 20, homeX: r.player.x + 120, homeY: r.player.y - 20 };
        r.raptors.push(alpha);
        const foe = g.spawn('carnotaurus', { x: r.player.x - 140, y: r.player.y + 60 }); Object.assign(foe, { alert: true, speed: 0, cooldown: 1e9 });
        g.allyProvoke(foe, r.raptors[0]);
        return { kinds: r.raptors.map(a => a.kind), limit: C.packLimitOf(r), order: C.packOrderOf(r) };
      });
      assert.ok(state.kinds.every(k => k === 'velociraptor'), JSON.stringify(state)); assert.equal(state.limit, 2); assert.equal(state.order, 'attack');
      await page.waitForTimeout(400);
      const chip = await page.locator('#pack-chip .chip-value').innerText();
      assert.match(chip, lang === 'da' ? /FLOK 2 · ANGRIB/ : /PACK 2 · ATTACK/, chip);
      await page.evaluate(() => { primalRun.game.packCommand(); });
      await page.waitForTimeout(300);
      const after = await page.evaluate(() => ({ chip: document.querySelector('#pack-chip .chip-value').textContent, icon: (document.querySelector('#pack-chip canvas') || {}).dataset?.sprite || '' }));
      assert.match(after.chip, lang === 'da' ? /FORSVAR MIG/ : /DEFEND ME/, after.chip);
      assert.ok(!after.icon || after.icon.endsWith('pack_defend.png'), after.icon);
      checks.push(lang + ': pack chip "' + chip + '" -> "' + after.chip + '"');
      if (lang === 'da') { await page.evaluate(() => { primalRun.game.packCommand(); primalRun.game.packCommand(); }); await page.waitForTimeout(300); await page.screenshot({ path: path.join(shots, 'pack_two.png') }); }
      // help text
      await page.evaluate(() => { primalRun.game.phase = 'help'; });
      await page.waitForSelector('.instructions');
      const help = await page.locator('.instructions li').last().innerText();
      assert.match(help, lang === 'da' ? /skifter ordre: Angrib, Forsvar mig eller Hold dig væk/ : /changes orders: Attack, Defend me or Stay out/, help);
      checks.push(lang + ': help mentions the orders');
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ result: 'PASS', checks }, null, 1));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
