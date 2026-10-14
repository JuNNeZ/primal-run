'use strict';
// Hidden admin panel (src/admin.js): 7 taps on the menu title + code opens it, a wrong code does not, the actions work
// in a real run, and nothing reaches the saved game while admin is on.
const assert=require('node:assert/strict'),path=require('node:path');const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 let answer='forkert';page.on('dialog',d=>d.accept(answer));
 await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{});
 await page.waitForSelector('[data-action="start"]:not(:disabled)');
 const tap=async()=>{for(let i=0;i<7;i++)await page.locator('.menu-panel h1').click();await page.waitForTimeout(150);};
 await tap();assert.equal(await page.evaluate(()=>PrimalAdmin.on),false,'wrong code keeps admin off');
 assert.equal(await page.locator('.admin-fab').count(),0);
 const saved=await page.evaluate(()=>localStorage.getItem('primal-run-save')||Object.keys(localStorage).map(k=>localStorage.getItem(k)).join('|'));
 answer='Blodmaane8 ';await tap();assert.equal(await page.evaluate(()=>PrimalAdmin.on),true,'right code (any case, trimmed) opens admin');
 assert.equal(await page.locator('.admin-panel').isVisible(),true);
 await page.selectOption('.admin-panel [name=species]','spinosaurus');await page.selectOption('.admin-panel [name=level]','5');
 await page.click('.admin-panel [data-admin=start]');
 const run=await page.evaluate(()=>{const g=primalRun.game,r=g.run;return {phase:g.phase,species:r.species,level:r.levelIndex+1};});
 assert.deepEqual(run,{phase:'playing',species:'spinosaurus',level:5});
 await page.click('.admin-fab');
 for(const a of ['god','heal','twist','streak','amber','boss'])await page.click(`.admin-panel [data-admin=${a}]`);
 await page.selectOption('.admin-panel [name=powerup]','rage');await page.click('.admin-panel [data-admin=powerup]');
 await page.click('.admin-panel [data-admin=elite]');await page.click('.admin-panel [data-admin=time][data-arg=night]');
 await page.click('.admin-panel [data-admin=unlock]');await page.click('.admin-panel [data-admin=dna]');
 const state=await page.evaluate(()=>{const g=primalRun.game,r=g.run;g.phase='playing';const hp=r.health;g.damage(50,{x:r.player.x+10,y:r.player.y});for(let i=0;i<60;i++)g.step(1/30,{});
   return {god:r.health>=hp,twist:r.mutations[PrimalCore.TWISTS.spinosaurus?.id]??'none',powerup:r.powerups.some(p=>p.type==='rage'),elite:r.enemies.some(e=>e.elite&&e.affix),phase:r.dayPhase,boss:r.bossSpawned,amber:!!r.amberPiece,unlocked:g.save.unlockedSpecies.length===Object.keys(PrimalCore.PLAYER_SPECIES).length};});
 assert.deepEqual(state,{god:true,twist:'none',powerup:true,elite:true,phase:'night',boss:true,amber:true,unlocked:true});
 await page.click('.admin-panel [data-admin=skip]');assert.equal(await page.evaluate(()=>primalRun.game.run.levelIndex+1),6);
 const after=await page.evaluate(()=>localStorage.getItem('primal-run-save')||Object.keys(localStorage).map(k=>localStorage.getItem(k)).join('|'));
 assert.equal(after,saved,'admin never writes the save');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({result:'PASS',engine:'Chrome browser; GDevelop NOT RUN',checks:['wrong code ignored','7 taps + code opens panel','start Spinosaurus on level 5','god mode','powerup, elite, night, boss, amber','skip level','save untouched']}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
