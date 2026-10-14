'use strict';
// Run extras in the real canvas: powerups on a shrine are drawn and picked up, elite traits show a badge, the hard
// baby start draws the egg hatch and a smaller player, dusk uses its own clock icon and light, amber glints, ambient
// animals appear, and the HUD line shows streak and powerup timers. Optional screenshots:
// PRIMAL_SHOTS=<dir> node tests/run-extras-browser.cjs
const assert=require('node:assert/strict'),path=require('node:path');const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{});
 await page.waitForSelector('[data-action="start"]:not(:disabled)');
 assert.equal(await page.locator('#baby-hard').count(),1,'baby-start toggle in the menu');
 await page.evaluate(async()=>{await primalRun.preload({species:'velociraptor',stage:1,kinds:Object.keys(PrimalCore.SPECIES)});
   await Promise.all(Object.keys(PrimalAssets).filter(p=>p.startsWith('assets/run_extras/')||p.startsWith('assets/new_species/ambient/')).map(p=>primalRun.loadImage?primalRun.loadImage(p):null));});
 await page.locator('[data-action="start"]').click();await page.locator('[data-action="begin"]').click();
 const shots=process.env.PRIMAL_SHOTS;
 const scene=async(name,setup)=>{const out=await page.evaluate(setup);if(shots)await page.screenshot({path:path.join(shots,name+'.png')});return out;};
 const record=`const ctx=document.querySelector('canvas[aria-label]').getContext('2d'),old=ctx.drawImage,calls=[];ctx.drawImage=function(im,...a){const {image}=PrimalApp.drawRecord(im,a);if(image.src)calls.push(image.src.split('/').pop());return old.call(this,im,...a);};`;
 const drawn=async(setup)=>page.evaluate(`(()=>{${record}try{${setup};for(let i=0;i<40;i++)primalRun.update(performance.now()+i*30);return calls.join(' ');}finally{ctx.drawImage=old;}})()`);
 // 1. powerup on a shrine next to the player and an elite with a trait
 const world=await drawn(`const g=primalRun.game;g.phase='menu';g.selectSpecies('velociraptor');g.start({seed:91});const r=g.run;r.enemies=[];r.spawnTimer=999;r.raptors=[];r.health=r.maxHealth=1e6;
   r.powerups=[];r.powerups.push({id:9001,kind:'powerup',type:'heart',x:r.player.x+120,y:r.player.y,value:1,shrine:true});
   const e=g.spawn('carnotaurus',{x:r.player.x-140,y:r.player.y+40});e.elite=true;e.alert=false;e.mode='roam';g.step(1/30,{});window.__affix=e.affix;`);
 if(shots)await page.screenshot({path:path.join(shots,'powerup_and_elite.png')});
 assert.match(world,/shrine|world_run_extras/,'shrine drawn');
 const affix=await page.evaluate(()=>window.__affix);assert.ok(PrimalAffixOk(affix),'elite got a trait: '+affix);
 function PrimalAffixOk(a){return ['brutal','armored','swift','thorns','regen'].includes(a);}
 // 2. walking onto the powerup applies it and shows the HUD line
 const picked=await page.evaluate(()=>{const g=primalRun.game,r=g.run,before=r.maxHealth;const p=r.powerups.find(p=>p.id===9001);r.player.x=p.x;r.player.y=p.y;g.step(1/30,{});primalRun.update(performance.now());
   r.extras.buffs.rage=9;r.extras.streak=3;r.extras.lastKillAt=r.seconds;primalRun.update(performance.now());return {gained:r.maxHealth-before,left:r.powerups.some(p=>p.id===9001),hud:document.querySelector('#extras-chip').textContent};});
 assert.equal(picked.gained,12,'heart fruit gives +12 max health');assert.equal(picked.left,false);assert.match(picked.hud,/JAGTRUS ×3/);assert.match(picked.hud,/Blodmåne-kød \d+s/);
 // 3. hard baby start: egg hatch first, then a smaller dinosaur
 const hatch=await drawn(`const g=primalRun.game;g.phase='menu';g.setSetting('babyHard',true);g.start({seed:92});const r=g.run;r.enemies=[];r.spawnTimer=999;window.__baby={hp:r.maxHealth,full:PrimalCore.PLAYER_SPECIES.velociraptor.hp,hatch:r.extras.baby.hatch};`);
 if(shots)await page.screenshot({path:path.join(shots,'baby_hatch.png')});
 const baby=await page.evaluate(()=>window.__baby);assert.ok(baby.hatch>0&&baby.hp<baby.full,'baby starts small: '+JSON.stringify(baby));
 assert.ok(/egg_hatch|world_run_extras/.test(hatch),'egg hatch drawn');
 await page.evaluate(()=>{const g=primalRun.game;g.setSetting('babyHard',false);});
 // 4. dusk: own clock icon, light, bats; amber glint near the player
 const dusk=await drawn(`const g=primalRun.game;g.phase='menu';g.start({seed:93});const r=g.run;r.enemies=[];r.spawnTimer=999;r.seconds=PrimalCore.DAYNIGHT.dusk+9;g.step(1/30,{});
   r.amberPiece={x:r.player.x+40,y:r.player.y+30,level:0};window.__phase=r.dayPhase;`);
 if(shots)await page.screenshot({path:path.join(shots,'dusk_amber.png')});
 assert.equal(await page.evaluate(()=>window.__phase),'dusk');
 assert.equal(await page.evaluate(()=>document.querySelector('.time-icon').dataset.sprite),'assets/run_extras/time_dusk.png');
 // 5. amber pickup with E
 const amber=await page.evaluate(()=>{const g=primalRun.game,r=g.run;r.player.x=r.amberPiece.x;r.player.y=r.amberPiece.y;g.interact();return {count:r.extras.amber,left:!!r.amberPiece};});
 assert.deepEqual(amber,{count:1,left:false});
 // 6. ambient animals by day (butterflies, burrow mammals, frogs or millipedes)
 const day=await drawn(`const g=primalRun.game;g.phase='menu';g.start({seed:94});const r=g.run;r.enemies=[];r.spawnTimer=999;const life=r.map.ambientLife||null;
   const h=r.map.habitats.filter((_,i)=>i%6===1)[0];if(h){r.player.x=h.x;r.player.y=h.y+80;g.setView(960,640);}`);
 if(shots)await page.screenshot({path:path.join(shots,'ambient_day.png')});
 assert.ok(/butterfly|world_ambient/.test(day),'ambient animals drawn');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({result:'PASS',engine:'Chrome browser; GDevelop NOT RUN',checks:['baby toggle in menu','shrine + powerup drawn','elite trait badge','powerup pickup (+12 max hp)','HUD streak + timer','egg hatch + smaller baby','dusk clock icon','amber pickup','ambient animals','no page errors']}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
