'use strict';
// Field guide lists (areas, observed attacks) follow the menu language item by item; the save stores ids, not Danish text.
const assert = require('node:assert/strict'), path = require('node:path');
const { chromium, browserOptions, localURL } = require('../tools/browser.cjs');
(async () => {
  const b = await chromium.launch(browserOptions());
  try {
    const guide = { compy: { biomes: [0, 1, 2, 3], attacks: ['bite', 'charge'] }, ankylosaurus: { biomes: [2, 3], attacks: ['charge', 'bite', 'slam'] } };
    const read = async lang => {
      const p = await b.newPage({ viewport: { width: 900, height: 900 } });
      await p.goto(await localURL(path.resolve(__dirname, '../PRIMAL_RUN_Game/index.html')));
      await p.evaluate(([lang, guide]) => localStorage.setItem('primalRun.save.v1', JSON.stringify({ version: 2, settings: { language: lang, languageChosen: true }, fieldGuide: guide })), [lang, guide]);
      await p.reload(); await p.waitForSelector('[data-action="guide"]:not(:disabled)'); await p.locator('[data-action="guide"]').click();
      const text = await p.evaluate(() => [...document.querySelectorAll('.screen article')].map(a => a.innerText).join('\n')); await p.close(); return text;
    };
    const en = await read('en');
    assert.match(en, /Seen in: The Fern Forest, The Floodplain, The Rocklands, The Volcanic Valley/); assert.match(en, /Observed attacks: Bite, Charge/); assert.match(en, /Charge, Bite, Slam\/stomp|Charge, Bite, [A-Z]/);
    for (const danish of ['Bregneskoven', 'Flodsletten', 'Klippelandet', 'vulkanske', 'Stormløb', 'Slag/tramp']) assert.ok(!en.includes(danish), 'Danish left in English guide: ' + danish);
    const ja = await read('ja'); assert.ok(!/Bregneskoven|Stormløb/.test(ja)); assert.ok(ja.includes('、'), 'Japanese list separator');
    const da = await read('da'); assert.match(da, /Observeret i: Bregneskoven, Flodsletten, Klippelandet, Den vulkanske dal/); assert.match(da, /Observerede angreb: Bid, Stormløb/);
    console.log('PASS field guide follows the menu language');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
