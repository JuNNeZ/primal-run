'use strict';
// FEATURES.mutationReel: the offered mutation cards spin like slot reels and lock left to right on the cards the game
// already rolled. The first tap or key only stops the reel, rerolls spin again (shorter), banish spins just the new card,
// and nothing spins with the flag off or with reduced motion. Optional screenshots: PRIMAL_SHOTS=<dir> node tests/mutation-reel-browser.cjs
const assert=require('node:assert/strict'),path=require('node:path');const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{});
 await page.waitForSelector('[data-action="start"]:not(:disabled)');
 await page.evaluate(async()=>{await primalRun.preload({species:'velociraptor',stage:1,kinds:Object.keys(PrimalCore.SPECIES)});});
 await page.locator('[data-action="start"]').click();await page.locator('[data-action="begin"]').click();
 const shots=process.env.PRIMAL_SHOTS,shot=async n=>{if(shots)await page.screenshot({path:path.join(shots,n+'.png')});};
 assert.equal(await page.evaluate(()=>PrimalCore.FEATURES.mutationReel),true,'the reel is on');
 // a level-up offer: three reels, staggered left to right, world and choices untouched
 const offer=await page.evaluate(()=>{const g=primalRun.game,r=g.run;r.enemies=[];r.spawnTimer=999;r.health=r.maxHealth=1e6;r.rerolls=3;
   g.addXP(6);const t0=performance.now();primalRun.update(t0);const choices=r.choices.slice(),state=JSON.stringify(r);primalRun.update(t0+16);primalRun.update(t0+16+700);
   const spinning=[...document.querySelectorAll('[data-mutation]')].map(c=>c.classList.contains('spinning')),items=[...document.querySelectorAll('.mreel-strip')].map(s=>s.children.length);
   const last=[...document.querySelectorAll('.mreel-strip')].map(s=>s.lastElementChild.textContent);
   window.reelT=t0+16;return {phase:g.phase,choices,spinning,items,last,names:choices.slice(1).map(id=>PrimalCore.MUTATIONS.find(m=>m.id===id).name),same:JSON.stringify(r)===state&&r.choices.join()===choices.join()};});
 await shot('mutation_reel_spinning');
 assert.equal(offer.phase,'mutation');assert.deepEqual(offer.spinning,[false,true,true],'card 1 has locked after 0.7 s, cards 2 and 3 still spin');
 assert.deepEqual(offer.items,[13,17],'reels 2 and 3 run 12 and 16 fillers before the stop');
 offer.last.forEach((text,i)=>assert.ok(text.endsWith(offer.names[i]),'each reel stops on the rolled card'));
 assert.equal(offer.same,true,'the reel never touches the run or the rolled choices');
 const locked=await page.evaluate(()=>{primalRun.update(reelT+1300);return {reels:document.querySelectorAll('.mreel').length,spinning:document.querySelectorAll('.spinning').length,locked:document.querySelectorAll('.reel-locked').length};});
 await shot('mutation_reel_locked');
 assert.deepEqual(locked,{reels:0,spinning:0,locked:3});
 // reroll spins all three again, shorter; the first card tap only stops the reel, the second one picks
 await page.locator('[data-reroll]').click();
 const reroll=await page.evaluate(()=>[...document.querySelectorAll('.mreel-strip')].map(s=>s.children.length));
 assert.deepEqual(reroll,[6,8,10],'a reroll spins every new card with shorter reels');
 await page.locator('[data-mutation]').first().click();
 assert.deepEqual(await page.evaluate(()=>({phase:primalRun.game.phase,reels:document.querySelectorAll('.mreel').length})),{phase:'mutation',reels:0},'tap skips, never picks');
 await page.locator('[data-mutation]').first().click();
 assert.notEqual(await page.evaluate(()=>primalRun.game.phase),'mutation','the second tap picks');
 // keyboard: a number key during the spin only stops it
 await page.evaluate(()=>{primalRun.game.phase='playing';primalRun.game.addXP(50);primalRun.update(performance.now());});
 assert.equal(await page.evaluate(()=>document.querySelectorAll('.mreel').length),3);
 await page.keyboard.press('Digit1');
 assert.deepEqual(await page.evaluate(()=>({phase:primalRun.game.phase,reels:document.querySelectorAll('.mreel').length})),{phase:'mutation',reels:0});
 // banish replaces one card: only that card spins
 const banish=await page.evaluate(()=>{const g=primalRun.game;g.run.banishLeft=1;const b=document.querySelector('[data-banish]');if(!b)return null;b.click();return [...document.querySelectorAll('[data-mutation]')].map(c=>c.classList.contains('spinning'));});
 assert.ok(banish,'a banish button is offered');assert.deepEqual(banish.filter(Boolean).length,1,'banish spins only the replaced card');
 // flag off and reduced motion: the cards just appear
 const quiet=[];await page.evaluate(()=>{primalRun.game.run.rerolls=5;PrimalCore.FEATURES.mutationReel=false;});
 await page.locator('[data-reroll]').click();quiet.push(await page.evaluate(()=>document.querySelectorAll('.mreel').length));
 await page.evaluate(()=>{PrimalCore.FEATURES.mutationReel=true;primalRun.game.save.settings.reducedMotion=true;});
 await page.locator('[data-reroll]').click();quiet.push(await page.evaluate(()=>document.querySelectorAll('.mreel').length));
 assert.deepEqual(quiet,[0,0],'no reel with the flag off or with reduced motion');
 assert.deepEqual(errors,[]);
 console.log('PASS: mutation reel · staggered lock on the rolled cards · run untouched · reroll and banish respin · tap/key skips without picking · off with flag or reduced motion · no page errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
