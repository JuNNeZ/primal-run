'use strict';
// Natural ecology in the real canvas: Baryonyx fishes with the drink pose and an in-place strike, an NPC-vs-NPC
// windup draws no player danger zone, and an NPC hunt renders without page errors. Optional screenshots:
// PRIMAL_SHOTS=<dir> node tests/natural-ecology-browser.cjs
const assert=require('node:assert/strict'),path=require('node:path');const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{});
 await page.waitForSelector('[data-action="start"]:not(:disabled)');
 await page.evaluate(async()=>{await primalRun.preload({species:'velociraptor',stage:1,kinds:Object.keys(PrimalCore.SPECIES)});});
 await page.locator('[data-action="start"]').click();await page.locator('[data-action="begin"]').click();
 const shots=process.env.PRIMAL_SHOTS;
 const scene=async(name,setup)=>{const out=await page.evaluate(setup);if(shots)await page.screenshot({path:path.join(shots,name+'.png')});return out;};
 const fishing=await scene('baryonyx_fishing',()=>{
  const g=primalRun.game,C=PrimalCore,ctx=document.querySelector('canvas[aria-label]').getContext('2d'),old=ctx.drawImage,calls=[];
  ctx.drawImage=function(im,...a){const {image}=PrimalApp.drawRecord(im,a);if(image.src)calls.push(image.src.split('/').pop());return old.call(this,im,...a);};
  try{g.phase='menu';g.selectSpecies('velociraptor');g.start({seed:83});const r=g.run;r.enemies=[];r.spawnTimer=999;r.map.rocks=[];r.raptors=[];
   r.map.ponds=[{x:r.player.x+220,y:r.player.y,radius:72}];const school={id:'fish:shot',kind:'fish',x:r.player.x+220,y:r.player.y,stock:6,value:2};r.map.fishSchools=[school];
   const b=g.spawn('baryonyx',{x:r.player.x+40,y:r.player.y+150});b.alert=false;b.mode='roam';b.hunger=1;r.health=r.maxHealth=1e6;
   const seen={};for(let i=0;i<400;i++){g.step(1/30,{});primalRun.update(performance.now());seen[b.mode]=(seen[b.mode]||0)+1;if(b.mode==='fish'&&seen.fishstrike)break;}
   const drink=calls.some(f=>/^baryonyx_drink_/.test(f)),strike=calls.some(f=>/baryonyx.*attack/.test(f));
   return {seen,drink,strike,stock:school.stock};}finally{ctx.drawImage=old;}
 });
 assert.ok(fishing.seen.fish&&fishing.seen.fishstrike,JSON.stringify(fishing));assert.ok(!fishing.seen.charge&&!fishing.seen.windup,'no skating charge');
 assert.ok(fishing.drink,'head-down drink pose while fishing');assert.ok(fishing.strike,'strike uses attack frames');assert.ok(fishing.stock<6);
 const hunt=await scene('npc_hunt',()=>{
  const g=primalRun.game;g.phase='menu';g.selectSpecies('velociraptor');g.start({seed:84});const r=g.run;r.enemies=[];r.spawnTimer=999;r.map.rocks=[];r.raptors=[];r.health=r.maxHealth=1e6;
  r.map.ponds=[];r.map.fishSchools=[];
  const c=g.spawn('carnotaurus',{x:r.player.x+160,y:r.player.y+180}),p=g.spawn('parasaurolophus',{x:r.player.x+260,y:r.player.y+180});for(const e of [c,p]){e.alert=false;e.mode='roam';}c.hunger=1;
  let windup=false,telegraph=false;const ctx=document.querySelector('canvas[aria-label]').getContext('2d'),fill=ctx.fill;
  for(let i=0;i<900&&r.enemies.includes(p);i++){g.step(1/30,{});if(c.mode==='windup'){windup=true;let n=0;ctx.fill=function(...a){n++;return fill.apply(this,a);};const dash=ctx.setLineDash,dashes=[];ctx.setLineDash=function(v){dashes.push(v.join(','));return dash.call(this,v);};primalRun.update(performance.now());ctx.fill=fill;ctx.setLineDash=dash;if(dashes.includes('8,6'))telegraph=true;if(i%3===0)break;}else if(i%5===0)primalRun.update(performance.now());}
  primalRun.update(performance.now());return {windup,telegraph,mode:c.mode,target:c.huntTarget};
 });
 assert.ok(hunt.windup,'the NPC hunt reached a windup');assert.equal(hunt.telegraph,false,'no player danger zone for an NPC fight');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({result:'PASS',engine:'Chrome browser; GDevelop NOT RUN',checks:['Baryonyx fishes with drink pose','fish strike uses attack frames, no charge','NPC windup has no player telegraph','no page errors'],fishing:fishing.seen}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
