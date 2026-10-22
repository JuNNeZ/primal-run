'use strict';
// Loot step 5 in the browser: pressure and start relic pickers in the menu, pressure/rav HUD chip, the amber altar,
// and the daily hunt share text. With the flags off none of it shows. PRIMAL_SHOTS=<dir> saves screenshots.
const assert=require('node:assert/strict'),path=require('node:path');const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const context=await browser.newContext({viewport:{width:1280,height:900},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{});
 await page.waitForSelector('[data-action="start"]:not(:disabled)');
 await page.evaluate(async()=>{await primalRun.preload({species:'velociraptor',stage:0,kinds:Object.keys(PrimalCore.SPECIES)});});
 const shots=process.env.PRIMAL_SHOTS,shot=async n=>{if(shots)await page.screenshot({path:path.join(shots,n+'.png')});};
 const rerender=phase=>page.evaluate(phase=>{const g=primalRun.game;g.phase=phase==='menu'?'scores':'menu';primalRun.update(performance.now());g.phase=phase;primalRun.update(performance.now());},phase);
 assert.equal(await page.locator('.pressure-pick, .currency-pick').count(),0,'flags off: no pickers');
 // Menu: pressure best 1 opens steps 0-2; 6 fossiler and 1 iridium make both start relics affordable.
 await page.evaluate(()=>{const F=PrimalCore.FEATURES;F.extinctionPressure=F.currencies=F.relics=F.lootTables=F.hudIconSet=true;const s=primalRun.game.save;s.pressureBest=1;s.currency={fossils:6,iridium:1};s.settings.startRelic='none';});
 await rerender('menu');
 assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('input[name="pressure"]')].map(i=>!i.disabled)),[true,true,true,false,false,false]);
 assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('input[name="start-relic"]')].map(i=>i.value+':'+!i.disabled)),['none:true','fossil:true','iridium:true']);
 await page.locator('input[name="pressure"][value="2"]').check();await page.locator('input[name="start-relic"][value="fossil"]').check();await shot('step5_menu');
 await page.locator('[data-action="start"]').click();await page.locator('[data-action="begin"]').click();
 const run=await page.evaluate(()=>{const g=primalRun.game,r=g.run;return {pressure:r.pressure,relics:Object.keys(r.relics||{}).length,fossils:g.save.currency.fossils,setting:g.save.settings.pressure,altar:!!r.amberAltar};});
 assert.deepEqual(run,{pressure:2,relics:1,fossils:1,setting:2,altar:true});
 // HUD chip, then the altar: no rav first, then a buy with rav.
 const chip=await page.evaluate(()=>{const g=primalRun.game,r=g.run;r.enemies=[];r.spawnTimer=999;r.health=r.maxHealth=1e6;g.phase='playing';r.currency.rav=3;primalRun.update(performance.now());return document.querySelector('#extras-chip').textContent;});
 assert.match(chip,/TRYK 2/);assert.match(chip,/RAV 3/);
 const altar=await page.evaluate(()=>{const g=primalRun.game,r=g.run,a=r.amberAltar;r.player.x=a.x+64;r.player.y=a.y+6;primalRun.update(performance.now());const ok=g.interact();primalRun.update(performance.now());return {ok,buys:a.buys,rav:r.currency.rav,price:a.price,toast:document.querySelector('.toast').textContent};});
 assert.equal(altar.ok,true);assert.equal(altar.buys,1);assert.equal(altar.rav,2);assert.equal(altar.price,2);
 await page.evaluate(()=>{const g=primalRun.game;if(g.phase!=='playing'){g.phase='playing';}primalRun.update(performance.now());});await shot('step5_altar');
 // Daily share: off → no button; on → the copied text has date, level squares and the score.
 const finishDaily=()=>page.evaluate(()=>{const g=primalRun.game;g.startDaily();g.run.bosses=2;g.run.stage=2;g.phase='playing';primalRun.update(performance.now());g.finish(false);primalRun.update(performance.now());});
 await finishDaily();assert.equal(await page.locator('[data-action="daily-share"]').count(),0,'dailyShare off');
 await page.evaluate(()=>{PrimalCore.FEATURES.dailyShare=true;});await finishDaily();
 await page.locator('[data-action="daily-share"]').click();await page.waitForFunction(()=>/kopieret|herunder/.test(document.querySelector('.toast').textContent));
 const text=await page.evaluate(async()=>{const pre=document.querySelector('.share-text');return pre&&!pre.hidden?pre.textContent:await navigator.clipboard.readText();});
 const lines=text.split('\n');assert.equal(lines.length,4,text);assert.match(lines[0],/^PRIMAL RUN · Dagens jagt \d\d\.\d\d\.\d{4}$/);assert.match(lines[2],/^🟩🟩🟥⬛+$/);assert.match(lines[3],/^Score \d+ · tid \d+:\d\d$/);
 await shot('step5_daily');
 assert.deepEqual(errors,[]);
 console.log('PASS: loot step 5 · pickers hidden when off · pressure steps 0-2 open · fossil start relic bought · TRYK/RAV chip · amber altar buy and price · daily share text (date, squares, score) · no page errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
