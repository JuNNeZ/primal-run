'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.locator('[data-first-language="da"]').click();await page.waitForSelector('[data-action="start"]:not(:disabled)');
 await page.evaluate(async()=>{for(const species of Object.keys(PrimalCore.PLAYER_SPECIES))await primalRun.preload({species,stage:3,kinds:Object.keys(PrimalCore.SPECIES)});});
 await page.locator('[data-action="start"]').click();await page.locator('[data-action="begin"]').click();
 const result=await page.evaluate(()=>{
  const g=primalRun.game,canvas=document.querySelector('canvas[aria-label]'),ctx=canvas.getContext('2d'),old=ctx.drawImage,calls=[];let players=0,npcs=0,tailFrames=0;
  ctx.drawImage=function(im,...args){calls.push({file:im.src?.split('/').pop(),width:im.width,height:im.height,args});return old.call(this,im,...args);};
  try{
   for(const species of Object.keys(PrimalCore.PLAYER_SPECIES)){
    g.phase='menu';g.save.unlockedSpecies=Object.keys(PrimalCore.PLAYER_SPECIES);g.selectSpecies(species);g.start({seed:123});g.pause();const r=g.run;r.enemies=[];r.pickups=[];r.corpses=[];
    for(const direction of ['S','N','E','W'])for(const running of [false,true])for(const hp of [100,29]){
     r.maxHealth=100;r.health=hp;r.player.facing=direction;r.player.moving=true;r.player.gaitPhase=.7;r.pounce=running?.4:0;r.hurt=0;r.attack=null;r.deathTime=-1;
     calls.length=0;primalRun.update(performance.now());const state=running?'run':'walk',frame=hp===29?3:4,name=PrimalCore.playerFrame(species,state,direction,frame);
     if(canvas.dataset.playerSprite!==name||!calls.some(c=>c.file===name.split('/').pop()))throw Error('Wrong low-health gait '+name);players++;
    }
   }
   const r=g.run;r.health=100;r.player.moving=false;r.pounce=0;
   for(const species of Object.keys(PrimalCore.SPECIES)){
    r.enemies=[];const e=g.spawn(species,{x:r.player.x+100,y:r.player.y});
    for(const direction of ['S','N','E','W'])for(const running of [false,true]){
     e.hp=e.maxHP*.29;e.direction=direction;e.gaitPhase=.7;e.hit=0;e.moving=true;e.mode=running?'flee':'chase';e.sex='female';
     calls.length=0;primalRun.update(performance.now());const family=['compy','carnotaurus','ankylosaurus','pachycephalosaurus','gallimimus','baryonyx'].includes(species)?'player_full':'enemy_full',name=`${species}_${running?'run':'walk'}_${direction}_003.png`;
     if(!calls.some(c=>c.file===name))throw Error('NPC gait not drawn '+family+'/'+name);npcs++;
    }
   }
   r.enemies=[];r.species='ankylosaurus';r.player.radius=23;r.hurt=0;
   const e=g.spawn('ankylosaurus',{x:r.player.x+150,y:r.player.y});e.hit=0;e.sex='female';
   for(const direction of ['S','N','E','W'])for(let f=0;f<6;f++){
    r.attack={elapsed:(f+.1)/6*.6,duration:.6,facing:direction};e.direction=direction;e.mode=f<3?'windup':'charge';e.windupDuration=.6;e.timer=f<3?.6*(1-(f+.1)/3):.55*(1-(f-3+.1)/3);
    calls.length=0;primalRun.update(performance.now());const name=`ankylosaurus_attack_${direction}_${String(f).padStart(3,'0')}.png`;
    if(canvas.dataset.playerSprite!==`assets/species_attacks/${name}`||calls.filter(c=>c.file===name).length<2)throw Error('Player/NPC tail frame missing '+name);tailFrames++;
   }
   // Overlay attacks must also retain a visible hurt flash.
   e.hit=.1;calls.length=0;primalRun.update(performance.now());if(!calls.some(c=>!c.file&&c.width===144&&c.height===144))throw Error('Attack hurt overlay absent');
   const phase=r.player.gaitPhase,frozen=JSON.stringify(r);g.step(.05,{x:1});if(r.player.gaitPhase!==phase||JSON.stringify(r)!==frozen)throw Error('Pause advances limp phase');
   r.player.x=800;r.player.y=600;r.player.facing='S';r.spawnTimer=999;r.map.rocks=[];r.map.cover=[];r.map.mud=[];r.map.decorations=r.map.decorations.filter(p=>Math.hypot(p.x-r.player.x,p.y-r.player.y)>240);
   r.attack={elapsed:15.5,duration:30,facing:'S'};e.x=950;e.y=600;e.homeX=e.x;e.homeY=e.y;e.direction='N';e.facingX=0;e.facingY=-1;e.hit=0;e.mode='watch';e.moving=false;e.damage=0;e.speed=0;e.alert=false;r.player.moving=false;r.health=r.maxHealth;g.resume();g.setView(canvas.width,canvas.height);primalRun.update(performance.now());
   return {players,npcs,tailFrames,paused:true};
  }finally{ctx.drawImage=old;}
 });
 assert.equal(result.players,192);assert.equal(result.npcs,80);assert.equal(result.tailFrames,24);assert.deepEqual(errors,[]);
 const out=path.resolve(__dirname,'../PRIMAL_RUN_Game/previews/part_a');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'ankylosaurus-reused-runtime.png')});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'ankylosaurus-mobile.png')});
 await page.setViewportSize({width:1280,height:1000});await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/part_a_review.html')));await page.waitForFunction(()=>document.querySelectorAll('#frames img').length===6&&[...document.querySelectorAll('#frames img')].every(i=>i.complete&&i.naturalWidth));await page.locator('#pause').click();await page.screenshot({path:path.join(out,'ankylosaurus-body-comparison.png')});await page.locator('#species').selectOption('parasaurolophus');await page.waitForFunction(()=>document.querySelector('#frames img')?.src.includes('parasaurolophus'));assert.match(await page.locator('#status').innerText(),/Kun review/);assert.deepEqual(errors,[]);
 fs.writeFileSync(path.resolve(out,'../../part_a_runtime_report.json'),JSON.stringify({status:'PASS',runtime:'standalone Chromium',...result,checks:['192 player health/direction/gait cases','80 low-health NPC walk/run cases','24 byte-reused tail swings render on player and NPC','attack hurt flash exists','pause freezes phase','390px mobile screenshot'],production_approved:false},null,2)+'\n');console.log('PASS part A: reused tail swings, low-health gait, hit flash, pause');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
