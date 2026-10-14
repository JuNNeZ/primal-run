'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{
 const browser=await chromium.launch(browserOptions());
 try {
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  // Drive presentation timestamps exactly; background RAF must not race the fixture.
  if(!process.env.PRIMAL_EXPECT_GDEVELOP)await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;window.cancelAnimationFrame=()=>{};});
  await page.goto(process.env.PRIMAL_GAME_URL||await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));
  await page.waitForFunction(()=>globalThis.primalRun);
  await page.evaluate(()=>primalRun.ready);
  if(process.env.PRIMAL_EXPECT_GDEVELOP)await page.evaluate(()=>{primalRun.__controlledUpdate=primalRun.update;primalRun.update=()=>{};});
  const result=await page.evaluate(async()=>{
   const draw=primalRun.__controlledUpdate||primalRun.update;
   const C=PrimalCore,g=primalRun.game;await primalRun.preload({species:'velociraptor',stage:0});
   g.phase='menu';g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies('velociraptor');g.start({seed:42});
   const killer=g.spawn('carnotaurus',{x:520,y:340});killer.mode='bite';g.damage(99999,killer);draw(1000);
   const scene=document.querySelector('.end-scene'),ctx=scene.getContext('2d'),old=ctx.drawImage,calls=[];
   ctx.drawImage=function(im,...args){calls.push(PrimalApp.drawRecord(im,args).image.src);return old.call(this,im,...args);};
   const sequences={};
   try {
    for(const fps of [30,60]){const seen=[];
     // Sample the same half-second attack at two display rates.
     for(let n=0;n<fps/2;n++){calls.length=0;draw(2000+(n+.01)*1000/fps);
      const file=calls.find(p=>/carnotaurus_attack_E_/.test(p));if(!file)throw Error('Missing cinematic attack');const frame=+file.match(/_(\d+)\.png$/)[1];if(seen.at(-1)!==frame)seen.push(frame);}
     sequences[fps]=seen;
    }
   }finally{ctx.drawImage=old;}
   // Pack gait uses the same six poses and 8/12fps phases; idle follows stableIdle.
   g.phase='menu';g.start({seed:42});g.pause();const r=g.run;r.enemies=[];r.spawnTimer=999;r.raptors=[];
   const a={id:900,kind:'velociraptor',ally:true,x:r.player.x+80,y:r.player.y,radius:12,hp:30,maxHP:30,mode:'follow',cooldown:0,walk:0,moving:false,facingX:1,facingY:0};r.raptors=[a];
   const main=document.querySelector('canvas[aria-label]').getContext('2d'),original=main.drawImage,frames=[];
   main.drawImage=function(im,...args){const record=PrimalApp.drawRecord(im,args);if(record.image.src?.includes('velociraptor_'))frames.push(record.image.src);return original.call(this,im,...args);};
   const pack={};
   try{for(const state of ['walk','run']){a.moving=true;a.mode=state==='run'?'flee':'follow';const seen=[];
    for(let n=0;n<120;n++){a.gaitPhase=(n+.01)/120;frames.length=0;draw(4000+n);const file=frames.find(p=>p.includes('_'+state+'_E_'));if(!file)throw Error('Missing pack '+state);const frame=+file.match(/_(\d+)\.png$/)[1];if(seen.at(-1)!==frame)seen.push(frame);}pack[state]=seen;}
    a.moving=false;a.mode='follow';a.gaitPhase=.8;frames.length=0;draw(5500);pack.idle=frames.find(p=>p.includes('_idle_E_'));
    const frozen=JSON.stringify(r);g.step(.1,{x:1});if(JSON.stringify(r)!==frozen)throw Error('Paused gait advances');
   }finally{main.drawImage=original;}
   return {sequences,pack};
  });
  for(const frames of Object.values(result.sequences))assert.deepEqual(frames,[0,1,2,3,4,5]);
  for(const state of ['walk','run'])assert.deepEqual(result.pack[state],[0,1,2,3,4,5]);
  assert.match(result.pack.idle,/_idle_E_000\.png$/);assert.deepEqual(errors,[]);
  const review=await browser.newPage();await review.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/species_animation_review.html')));
  await review.waitForFunction(()=>window.reviewReady);await review.waitForFunction(()=>Array.from(document.querySelectorAll('canvas')).every(c=>c.dataset.sprite));
  assert.equal(await review.locator('article canvas').count(),13);
  for(const direction of ['S','E','N','W'])for(const state of ['idle','walk','run','attack','hurt','death','transition']){
   await review.selectOption('#direction',direction);await review.selectOption('#state',state);
   await review.waitForFunction(({direction,state})=>Array.from(document.querySelectorAll('canvas')).every(c=>c.dataset.sprite?.includes('_'+(state==='transition'?'walk':state)+'_'+direction+'_')),{direction,state});
  }
  if(process.env.PRIMAL_EXPECT_GDEVELOP)assert.equal(await page.evaluate(()=>typeof gdjs.RuntimeGame),'function');
  const report={status:'PASS',runtime:process.env.PRIMAL_EXPECT_GDEVELOP?'official GDevelop GDJS5.6.283':'standalone Chromium',...result,reviewSpecies:13,checks:['all six cinematic attack poses at30/60fps','ordered pack locomotion and stable idle','pause freezes gait','13-species atlas review covers six states/four directions and transitions'],visual_approval:false};
  fs.writeFileSync(process.env.PRIMAL_CONTINUITY_REPORT||path.resolve(__dirname,'../PRIMAL_RUN_Game/animation_continuity_runtime_report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('PASS: complete cinematic attacks30/60fps, pack gait/idle/pause,13-species native review');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
