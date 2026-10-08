'use strict';
const assert = require('node:assert/strict'), path = require('node:path');
const { chromium, browserOptions, localURL } = require('../tools/browser.cjs');
(async () => {
  const browser = await chromium.launch({ ...browserOptions(), args: ['--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } }), errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const url = process.env.PRIMAL_GAME_URL || await localURL(path.resolve(__dirname, '../PRIMAL_RUN_Game/index.html'));
    await page.goto(url); await page.waitForFunction(() => window.primalRun && document.querySelector('[data-action="start"]:not(:disabled)'));
    // This regression suite verifies the unlocked Utahraptor combat profile.
    await page.evaluate(() => { const g=primalRun.game; g.save.unlockedSpecies.push('utahraptor'); g.selectSpecies('utahraptor'); });
    await page.locator('[data-action="start"]').click();
    await page.locator('[data-action="begin"]').click();
    const result = await page.evaluate(() => {
      const g = primalRun.game, r = g.run, canvas = document.querySelector('canvas[aria-label]'), ctx = canvas.getContext('2d');
      const calls = [], original = ctx.drawImage;
      const resourceFiles = typeof gdjs !== 'undefined' && gdjs.projectData ? new Map(gdjs.projectData.resources.resources.map(resource => [resource.name, resource.file])) : new Map();
      ctx.drawImage = function (image, ...args) {
        if (image.src && /utahraptor_attack_/.test(image.src)) calls.push({ file: decodeURIComponent(image.src).split('/').pop(), x: args[0], y: args[1], width: image.naturalWidth, height: image.naturalHeight });
        return original.call(this, image, ...args);
      };
      const checks = [], origin = { S: [72, 80], N: [72, 64], E: [76, 72], W: [68, 72] };
      for (const d of ['S', 'N', 'E', 'W']) {
        g.phase = 'playing'; r.enemies = []; r.pickups = []; r.player.x = 480; r.player.y = 340; r.player.facing = d; r.attack = null; r.attackCooldown = 0;
        g.attack(); g.pause();
        for (let frame = 0; frame < 6; frame++) {
          r.attack.elapsed = (frame + .2) / 6 * r.attack.duration;
          calls.length = 0; primalRun.update(performance.now());
          const call = calls[calls.length - 1];
          const resourceName = 'assets/player_full/utahraptor_attack_' + d + '_' + String(frame).padStart(3, '0') + '.png';
          const expectedFile = (resourceFiles.get(resourceName) || resourceName).split('/').pop();
          if (!call || call.file !== expectedFile) throw Error('Wrong drawn frame ' + d + '/' + frame + ': expected ' + expectedFile);
          if (call.width !== 144 || call.height !== 144) throw Error('Non-native frame size');
          if (call.x !== 480 - origin[d][0] || call.y !== 340 - origin[d][1]) throw Error('Anchor drift');
          if (r.player.radius !== 16 || ctx.imageSmoothingEnabled) throw Error('Collision/smoothing drift');
        }
        const elapsed = r.attack.elapsed; g.step(.05, { attack: true });
        if (r.attack.elapsed !== elapsed) throw Error('Paused animation advanced');
        r.attack = null; primalRun.update(performance.now());
        if (canvas.dataset.playerState !== 'Idle_' + d) throw Error('Attack did not return to idle');
        checks.push(d + ': all six actual drawn frames, native size, registered pivot, pause and idle');
      }
      ctx.drawImage = original;
      // Lock aim while strafing, and synchronise actual damage with contact.
      g.phase = 'playing'; r.player.facing = 'E'; r.attack = null; r.attackCooldown = 0; r.enemies = []; r.pickups = []; r.spawnTimer = 999;
      const enemy = g.spawn('carnotaurus', { x: 530, y: 340 }); enemy.speed = 0;
      g.step(1 / 60, { attack: true });
      if (enemy.hp !== 48) throw Error('Damage before contact');
      for (let i = 0; i < 13; i++) g.step(1 / 60, { y: -1 });
      if (enemy.hp !== 38 || r.biteFacing !== 'E') throw Error('Contact damage/locked aim failed');
      for (let i = 0; i < 16; i++) g.step(1 / 60);
      if (enemy.hp !== 38 || r.attack) throw Error('Recovery repeats damage');
      checks.push('contact-only damage, locked attack aim while moving, single hit and recovery');
      return checks;
    });
    assert.equal(result.length, 5); assert.deepEqual(errors, []);
    if (process.env.PRIMAL_EXPECT_GDEVELOP) assert.equal(await page.evaluate(() => typeof gdjs.RuntimeGame), 'function');
    console.log('PASS: ' + (process.env.PRIMAL_EXPECT_GDEVELOP ? 'GDevelop' : 'browser') + ' player attack animation · ' + result.join(' · '));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
