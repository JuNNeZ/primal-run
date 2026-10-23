'use strict';
// FEATURES.buildBar + statSheet: mutation/relic icons under the HUD card with a hover tooltip, and the character panel on
// "Dit build" with base values and sources on hover. Optional screenshots: PRIMAL_SHOTS=<dir> node tests/build-panel-browser.cjs
const assert=require('node:assert/strict'),path=require('node:path');const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{});
 await page.waitForSelector('[data-action="start"]:not(:disabled)');
 await page.evaluate(async()=>{await primalRun.preload({species:'velociraptor',stage:1,kinds:Object.keys(PrimalCore.SPECIES)});});
 await page.locator('[data-action="start"]').click();await page.locator('[data-action="begin"]').click();
 const shots=process.env.PRIMAL_SHOTS,shot=async n=>{if(shots)await page.screenshot({path:path.join(shots,n+'.png')});};
 assert.equal(await page.evaluate(()=>document.querySelector('.build-bar').hidden),true,'no bar before the first mutation');
 await page.evaluate(()=>{const g=primalRun.game,r=g.run;r.enemies=[];r.spawnTimer=999;r.health=r.maxHealth=1e6;r.mutations.teeth=2;r.mutations.legs=1;r.relics={sickle_claw:true,keen_eye:true};primalRun.update(performance.now());});
 const bar=await page.evaluate(()=>[...document.querySelectorAll('.build-bar .build-item')].map(e=>({m:e.dataset.tipMutation||'',relic:e.dataset.tipRelic||'',rank:e.querySelector('b')?.textContent||''})));
 assert.deepEqual(bar.map(x=>x.m||x.relic).sort(),['keen_eye','legs','sickle_claw','teeth']);assert.equal(bar.find(x=>x.m==='teeth').rank,'2','rank badge');
 await page.locator('.build-item[data-tip-mutation="teeth"]').hover();
 const tip=await page.evaluate(()=>{const t=document.querySelector('.build-tip');return {shown:!t.hidden,text:t.textContent};});
 await shot('build_bar_tip');
 assert.equal(tip.shown,true);assert.ok(tip.text.includes('Rang 2 / ')&&tip.text.includes('Kraftigt angreb'),tip.text);
 await page.locator('.build-item[data-tip-relic="sickle_claw"]').hover();
 assert.ok((await page.locator('.build-tip').textContent()).includes('Jæger 2/3'),'relic tooltip shows set progress');
 await page.mouse.move(640,600);assert.equal(await page.evaluate(()=>document.querySelector('.build-tip').hidden),true,'tooltip closes');
 // Dit build: character panel, value with change, base and sources on hover
 await page.keyboard.press('Escape');await page.locator('[data-action="build"]').click();
 const rows=await page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.stat-row')].map(e=>[e.dataset.tipStat,e.querySelector('em').textContent])));
 assert.deepEqual(Object.keys(rows),['damage','crit','health','armor','regen','speed','ability','luck'],'grouped: Angreb, Overlevelse, Jagt');
 assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.stat-sheet h3')].map(h=>h.textContent)),['Angreb','Overlevelse','Jagt']);
 assert.equal(rows.damage,'+40 %');assert.equal(rows.speed,'+8 %');assert.equal(rows.crit,'+10');
 await page.locator('.stat-row[data-tip-stat="damage"]').hover();
 const sheetTip=await page.locator('.build-tip').textContent();await shot('stat_sheet_tip');
 assert.ok(sheetTip.includes('Grund')&&sheetTip.includes('Kraftigt angreb +40 %'),sheetTip);
 await page.locator('[data-action="build-back"]').click();assert.equal(await page.evaluate(()=>document.querySelector('.build-tip').hidden),true,'tooltip closes with the screen');
 // flags off: no bar, no panel
 await page.evaluate(()=>{PrimalCore.FEATURES.buildBar=false;PrimalCore.FEATURES.statSheet=false;primalRun.update(performance.now());});
 assert.equal(await page.evaluate(()=>document.querySelector('.build-bar').hidden),true);
 await page.locator('[data-action="build"]').click();assert.equal(await page.locator('.stat-sheet').count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: build bar · icons with rank · mutation and relic tooltips · character panel with change and sources · flags off · no page errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
