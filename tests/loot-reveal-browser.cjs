'use strict';
// FEATURES.lootReveal: the slot-machine reel spins top-down, locks on the tier the game already rolled, pauses the world
// only for big reveals, can be skipped with a tap, and stays hidden with the flag off. Optional screenshots:
// PRIMAL_SHOTS=<dir> node tests/loot-reveal-browser.cjs
const assert=require('node:assert/strict'),path=require('node:path');const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{});
 await page.waitForSelector('[data-action="start"]:not(:disabled)');
 await page.evaluate(async()=>{await primalRun.preload({species:'velociraptor',stage:1,kinds:Object.keys(PrimalCore.SPECIES)});});
 await page.locator('[data-action="start"]').click();await page.locator('[data-action="begin"]').click();
 const shots=process.env.PRIMAL_SHOTS,shot=async n=>{if(shots)await page.screenshot({path:path.join(shots,n+'.png')});};
 const off=await page.evaluate(()=>{PrimalCore.FEATURES.lootReveal=false;const g=primalRun.game;g.run.enemies=[];g.run.spawnTimer=999;g.run.health=g.run.maxHealth=1e6;g.revealLoot(3,{ceiling:3});primalRun.update(performance.now());return document.querySelector('.loot-reel').hidden;});
 assert.equal(off,true,'no reel with the flag off');
 // small reel (epic meat): spins without pausing the world, then locks on Episk
 const small=await page.evaluate(()=>{PrimalCore.FEATURES.lootReveal=true;const g=primalRun.game,t0=performance.now(),s0=g.run.seconds;g.revealLoot(3,{ceiling:3,kind:'meat',label:'Episk'});
   primalRun.update(t0);primalRun.update(t0+400);const el=document.querySelector('.loot-reel');return {shown:!el.hidden,locked:el.classList.contains('locked'),moved:g.run.seconds>s0,items:el.querySelectorAll('b').length};});
 await shot('reel_spinning');
 assert.equal(small.shown,true);assert.equal(small.locked,false,'still spinning after 0.4 s');assert.equal(small.moved,true,'small reveal keeps the world running');
 assert.equal(small.items,3*4+1,'three top-down loops (Episk→Almindelig) and a stop on Episk');
 const lockedSmall=await page.evaluate(()=>{primalRun.update(performance.now()+1500);const el=document.querySelector('.loot-reel');return {locked:el.classList.contains('locked'),last:[...el.querySelectorAll('b')].pop().textContent};});
 await shot('reel_locked');
 assert.equal(lockedSmall.locked,true);assert.equal(lockedSmall.last,'Episk');
 // big reel (relic): the world waits while it spins, and a tap skips straight to the result
 const big=await page.evaluate(()=>{const g=primalRun.game,t0=performance.now()+2000;g.revealLoot(4,{big:true});primalRun.update(t0);const s0=g.run.seconds;primalRun.update(t0+300);
   const el=document.querySelector('.loot-reel'),paused=g.run.seconds===s0,spinning=!el.classList.contains('locked');el.click();primalRun.update(t0+340);
   return {paused,spinning,locked:el.classList.contains('locked'),big:el.classList.contains('big'),last:[...el.querySelectorAll('b')].pop().textContent,resumed:g.run.seconds>s0};});
 assert.deepEqual(big,{paused:true,spinning:true,locked:true,big:true,last:'Legendarisk',resumed:false},'FEATURES.lootCard: a big card holds the world after the lock');
 // FEATURES.lootCard: the locked reel says what the relic does and its set progress; a tap (or any key) closes it
 const card=await page.evaluate(()=>{const g=primalRun.game,el=document.querySelector('.loot-reel');el.click();const t0=performance.now()+3000;primalRun.update(t0);const s0=g.run.seconds;primalRun.update(t0+40);const closed=el.hidden&&g.run.seconds>s0;
   g.run.relics={sickle_claw:true};g.revealLoot(3,{big:true,kind:'relic',label:'Seglklo',relic:'sickle_claw'});primalRun.update(t0+80);primalRun.update(t0+2000);
   return {closed,card:el.classList.contains('card'),info:el.querySelector('.loot-card-info')?.textContent||'',items:el.querySelectorAll('.loot-strip b').length};});
 await shot('reel_card');
 assert.equal(card.closed,true,'a tap closes the card and the world runs again');assert.equal(card.card,true);assert.equal(card.items,1,'only the result stays');
 assert.ok(card.info.includes('kritisk chance')&&card.info.includes('Jæger 1/3'),card.info);
 await page.keyboard.press('KeyX');assert.equal(await page.evaluate(()=>document.querySelector('.loot-reel').hidden),true,'any key closes the card');
 assert.deepEqual(errors,[]);
 console.log('PASS: loot reveal reel · hidden when off · small reel keeps playing · locks top-down on the rolled tier · big reel pauses · tap skips · loot card holds and explains the relic · no page errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
