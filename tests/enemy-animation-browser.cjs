'use strict';
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const { chromium, browserOptions, localURL } = require('../tools/browser.cjs');
(async () => {
  const browser = await chromium.launch(browserOptions()), errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(process.env.PRIMAL_GAME_URL || await localURL(path.resolve(__dirname, '../PRIMAL_RUN_Game/index.html')));
    await page.waitForFunction(() => window.primalRun && document.querySelector('[data-action="start"]:not(:disabled)'));
    await page.locator('[data-action="start"]').click(); await page.locator('[data-action="begin"]').click();
    const result = await page.evaluate(() => {
      const g = primalRun.game, r = g.run, ctx = document.querySelector('canvas[aria-label]').getContext('2d');
      const resourceFiles = typeof gdjs !== 'undefined' && gdjs.projectData ? new Map(gdjs.projectData.resources.resources.map(resource => [resource.name, resource.file])) : new Map();
      const original = ctx.drawImage, calls = []; let checked = 0;
      ctx.drawImage = function (image, ...args) {
        if (image.src) calls.push({ file: decodeURIComponent(image.src).split('/').pop(), x: args[0], y: args[1], width: image.naturalWidth, height: image.naturalHeight });
        return original.call(this, image, ...args);
      };
      try {
        g.pause(); r.pickups = []; r.attack = null; r.shake = 0;
        for (const species of ['compy', 'parasaurolophus', 'carnotaurus', 'ankylosaurus']) {
          r.enemies = []; const enemy = g.spawn(species, { x: 480, y: 260 });
          for (const d of ['S', 'E', 'N', 'W']) for (const state of ['idle', 'step_left', 'step_right', 'action']) {
            enemy.direction = d; enemy.hit = 0;
            enemy.mode = state === 'action' ? (species === 'ankylosaurus' ? 'slam' : species === 'compy' ? 'bite' : species === 'parasaurolophus' ? 'flee' : 'charge') : 'chase';
            enemy.moving = state !== 'idle'; enemy.walk = state === 'step_left' || species === 'parasaurolophus' && state === 'action' ? .14 : state === 'step_right' ? .39 : 0;
            calls.length = 0; primalRun.update(performance.now());
            const name = 'assets/enemy_animations/' + species + '_' + state + '_' + d + '_000.png';
            const expected = (resourceFiles.get(name) || name).split('/').pop();
            const call = calls.find(c => c.file === expected);
            if (!call) throw Error('Missing actual drawn enemy frame: ' + name);
            if (call.width !== 128 || call.height !== 128 || call.x !== 416 || call.y !== 196) throw Error('Native size/origin changed: ' + name);
            if (enemy.radius !== PrimalCore.SPECIES[species].radius || ctx.imageSmoothingEnabled) throw Error('Collision or smoothing follows pose');
            checked++;
          }
        }
        const frozen = JSON.stringify(r); g.phase = 'mutation'; g.step(.05, { x: 1, attack: true });
        if (JSON.stringify(r) !== frozen) throw Error('Enemy world moves during mutation menu');
        return { checked, paused: true };
      } finally { ctx.drawImage = original; }
    });
    assert.equal(result.checked, 64); assert.deepEqual(errors, []);
    if (process.env.PRIMAL_EXPECT_GDEVELOP) assert.equal(await page.evaluate(() => typeof gdjs.RuntimeGame), 'function');
    if (process.env.PRIMAL_ENEMY_REPORT) fs.writeFileSync(process.env.PRIMAL_ENEMY_REPORT, JSON.stringify({ result: 'PASS', runtime: process.env.PRIMAL_EXPECT_GDEVELOP ? 'GDevelop GDJS 5.6.283' : 'standalone browser', ...result, scope: '64 actual drawn frames, all four species/directions/states, native128 size, fixed64 origin, stable collision, no smoothing, mutation freeze. Not production art approval.' }, null, 2) + '\n');
    console.log('PASS: ' + (process.env.PRIMAL_EXPECT_GDEVELOP ? 'GDevelop' : 'browser') + ' enemies: 64 actual drawn frames, four species/directions, walk/action/idle, native pivots, collision, mutation freeze');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
