'use strict';
// Run in the isolated Part C + A6 compatibility checkout, never require an unmerged feature.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.evaluate(()=>primalRun.ready);await page.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{});
 const supported=await page.evaluate(()=>typeof primalRun.game.packCommand==='function'&&typeof primalRun.game.reroll==='function');
 if(!supported){console.log('SKIP: Part C has not been integrated into this checkout');return;}
 await page.evaluate(async()=>{await primalRun.preload({species:'velociraptor',stage:0});
  const g=primalRun.game,C=PrimalCore;g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies('velociraptor');g.start({seed:123});g.pause();
  const r=g.run;r.enemies=[];r.invulnerable=999;r.spawnTimer=999;r.player.x=500;r.player.y=350;
  const e=g.spawn('compy',{x:550,y:350});e.damage=0;e.speed=0;e.lastAttackedAt=r.seconds;e.cooldown=999;
  r.raptors=[{id:999,kind:'velociraptor',ally:true,x:480,y:350,radius:10,hp:30,maxHP:30,damage:0,speed:0,facingX:1,facingY:0,mode:'follow',cooldown:999,walk:0,moving:false,slot:0}];
  g.resume();primalRun.update(performance.now());
 });
 await page.keyboard.down('q');await page.waitForFunction(()=>!!primalRun.game.run.packFocus);await page.keyboard.up('q');
 await page.waitForFunction(()=>document.querySelector('.pack-key canvas')?.dataset.sprite.endsWith('pack_focus.png'));
 const pack=await page.locator('.pack-key').innerText();assert.match(pack,/FLOK/);
 await page.evaluate(()=>{const g=primalRun.game;g.pause();g.run.rerolls=1;g.run.xp=g.run.nextXP;g.resume();g.maybeLevelUp();primalRun.update(performance.now());});
 await page.waitForSelector('[data-reroll]');await page.waitForFunction(()=>document.querySelector('[data-reroll] canvas')?.dataset.sprite.endsWith('reroll.png'));
 await page.locator('[data-reroll]').scrollIntoViewIfNeeded();
 const out=path.resolve(__dirname,'../PRIMAL_RUN_Game/previews/a6');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'part-c-native-reroll-mobile.png')});
 const before=await page.evaluate(()=>primalRun.game.rerollsLeft());
 await page.locator('[data-reroll]').click();await page.waitForFunction(n=>primalRun.game.rerollsLeft()===n-1,before);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 await page.screenshot({path:path.join(out,'part-c-real-reroll-mobile.png')});
 fs.writeFileSync(path.resolve(out,'../../a6_part_c_compat_report.json'),JSON.stringify({status:'PASS',runtime:'standalone Chromium',checks:['real Q command sets focus and native pack icon','actual mutation reroll button renders native icon','click spends exactly one reroll','390px layout','no page errors'],GDevelop_runtime:'not run'},null,2)+'\n');
 console.log('PASS A6 + Part C: real Q pack command and mutation reroll click with native icons at 390px');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
