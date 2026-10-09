'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],labels=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.env.PRIMAL_GAME_URL||await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.waitForSelector('[data-action="start"]:not(:disabled)');
 assert.equal(await page.evaluate(()=>primalRun.game.save.selectedSpecies),'velociraptor');
 await page.locator('[data-action="start"]').click();await page.locator('[data-action="begin"]').click();await page.waitForFunction(()=>primalRun.game.phase==='playing');await page.waitForFunction(()=>document.querySelector('canvas[aria-label]').dataset.playerSpecies==='velociraptor');
 assert.match(await page.locator('canvas[aria-label]:not(.end-scene)').getAttribute('data-player-sprite'),/velociraptor_/);
 const snapshot=await page.evaluate(()=>{const g=primalRun.game,r=g.run,ctx=document.querySelector('canvas[aria-label]').getContext('2d');window.drawnNames=[];const old=ctx.fillText;ctx.fillText=function(text,...args){drawnNames.push([text,this.fillStyle]);return old.call(this,text,...args);};r.enemies.forEach(e=>{e.cooldown=999;});return {seed:r.seed,plants:r.map.decorations.length,roads:r.map.trails.length};});
 assert.ok(snapshot.plants>800);assert.equal(snapshot.roads,0);await page.waitForTimeout(150);
 const names=await page.evaluate(()=>drawnNames);assert.ok(names.some(([s,c])=>s.startsWith('⚠ Compsognathus')&&c==='#ed7869'));assert.ok(!names.some(([s])=>s.includes('FJENDE')));
 if(process.env.PRIMAL_VISUAL_DIR){fs.mkdirSync(process.env.PRIMAL_VISUAL_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.PRIMAL_VISUAL_DIR,'compy-forest.png')});}
 await page.evaluate(()=>{const r=primalRun.game.run,s=r.map.sites.find(s=>s.type==='nest');r.player.x=s.x;r.player.y=s.y;primalRun.game.setView(r.view.width,r.view.height);r.map.events=[];r.enemies=[];r.spawnTimer=999;});await page.keyboard.press('e');await page.waitForSelector('[data-explore="take"]');
 const frozen=await page.evaluate(()=>JSON.stringify(primalRun.game.run));await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>JSON.stringify(primalRun.game.run)),frozen);
 await page.locator('[data-explore="take"]').click();await page.waitForFunction(()=>primalRun.game.run.exploration===1);assert.equal(await page.evaluate(()=>primalRun.game.run.map.sites.filter(s=>s.claimed).length),1);
 await page.waitForFunction(()=>primalRun.game.phase==='mutation'); await page.locator('[data-mutation]').first().click();
 await page.keyboard.press('Escape');await page.locator('[data-action="abandon"]').click();await page.locator('[data-action="menu"]').click();
 await page.evaluate(()=>{primalRun.game.save.dna=200;primalRun.game.persist();});await page.locator('[data-action="species"]').click();
 for(const id of ['utahraptor','carnotaurus','ankylosaurus']){await page.locator('[data-species="'+id+'"]').click();assert.equal(await page.evaluate(()=>primalRun.game.save.selectedSpecies),id);}
 assert.equal(await page.evaluate(()=>primalRun.game.save.dna),45);
 if(process.env.PRIMAL_VISUAL_DIR)await page.screenshot({path:path.join(process.env.PRIMAL_VISUAL_DIR,'species-menu.png')});
 await page.reload();await page.waitForSelector('[data-action="start"]:not(:disabled)');assert.equal(await page.evaluate(()=>primalRun.game.save.selectedSpecies),'ankylosaurus');await page.locator('[data-action="start"]').click();await page.locator('[data-action="begin"]').click();await page.waitForFunction(()=>primalRun.game.phase==='playing');await page.waitForFunction(()=>document.querySelector('canvas[aria-label]').dataset.playerSpecies==='ankylosaurus');
 await page.keyboard.down('Shift');await page.waitForFunction(()=>primalRun.game.run.pounce>0);await page.keyboard.up('Shift');assert.ok(await page.evaluate(()=>primalRun.game.run.stamina<100));
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(viewport);await page.waitForTimeout(150);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(process.env.PRIMAL_VISUAL_DIR)await page.screenshot({path:path.join(process.env.PRIMAL_VISUAL_DIR,'compy-layout-'+viewport.width+'.png')});}
 if(process.env.PRIMAL_EXPECT_GDEVELOP)assert.equal(await page.evaluate(()=>typeof gdjs.RuntimeGame),'function');assert.deepEqual(errors,[]);
 const report={runtime:process.env.PRIMAL_EXPECT_GDEVELOP?'official GDevelop GDJS 5.6.283':'standalone Chromium',status:'PASS',snapshot,checks:['Velociraptor default and native sprite','red species names','seeded dense wilderness without roads','nest modal freezes simulation','DNA unlock and selection UI/reload','stationary Ankylosaurus brace','portrait and landscape layouts']};if(process.env.PRIMAL_ROGUELITE_REPORT)fs.writeFileSync(process.env.PRIMAL_ROGUELITE_REPORT,JSON.stringify(report,null,2)+'\n');console.log('PASS: roguelite · Compy/classes · wilderness · names · paused nest · unlock persistence · responsive UI');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
