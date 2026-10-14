'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{
 const browser=await chromium.launch(browserOptions());
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  if(!process.env.PRIMAL_EXPECT_GDEVELOP)await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;window.cancelAnimationFrame=()=>{};});
  await page.goto(process.env.PRIMAL_GAME_URL||await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));
  await page.waitForFunction(()=>globalThis.primalRun);
  await page.evaluate(()=>primalRun.ready);
  if(process.env.PRIMAL_EXPECT_GDEVELOP)await page.evaluate(()=>{primalRun.__controlledUpdate=primalRun.update;primalRun.update=()=>{};});
  const results=await page.evaluate(async()=>{
   const draw=primalRun.__controlledUpdate||primalRun.update;
   const C=PrimalCore,g=primalRun.game,canvas=document.querySelector('canvas[aria-label]'),ctx=canvas.getContext('2d');
   const original=ctx.drawImage,calls=[];let clock=100000;
   ctx.drawImage=function(im,...args){calls.push(PrimalApp.drawRecord(im,args).image.src);return original.call(this,im,...args);};
   const results=[];
   try{for(const species of Object.keys(C.PLAYER_SPECIES)){
    await primalRun.preload({species,stage:3,kinds:Object.keys(C.SPECIES)});
    for(const [fps,fast] of [[30,false],[60,false],[60,true]]){
     g.phase='menu';g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies(species);g.start({seed:42});
     const r=g.run;r.enemies=[];r.raptors=[];r.spawnTimer=999;r.map.events=[];r.map.sites=[];r.invulnerable=999;r.player.facing='E';
     if(fast){r.mutations.quick=3;r.mutations.overclock=2;r.frenzy=3;}
     const enemy=g.spawn('carnotaurus',{x:r.player.x+28,y:r.player.y});enemy.speed=0;enemy.damage=0;enemy.cooldown=999;enemy.mode='rest';
     const hp=enemy.hp;g.pause();clock+=10000;draw(clock);g.resume();g.attack();
     const duration=r.attack.duration,seen=[],contacts=[];
     const sample=()=>{
      calls.length=0;draw(clock);
      const file=canvas.dataset.playerSprite;
      if(file.includes('_attack_E_')){
       if(!calls.some(p=>p?.endsWith(file)))throw Error('Catalog path was not actually drawn: '+file);
       const frame=+file.match(/_(\d+)\.png$/)[1];if(seen.at(-1)!==frame)seen.push(frame);
      }
      if(r.attack&&!r.attack.contact&&enemy.hp!==hp)throw Error('Damage before contact');
      if(r.attack?.contact)contacts.push(+canvas.dataset.playerAnimation.split(':')[1]);
      if(ctx.imageSmoothingEnabled)throw Error('Smoothed native pixels');
     };
     sample();
     for(let n=0;n<Math.ceil((duration+.15)*fps);n++){clock+=1000/fps;sample();}
     if(r.attack||!canvas.dataset.playerSprite.includes('_idle_'))throw Error('Attack did not recover to stable idle');
     if(enemy.hp>=hp||r.stats.landedAttacks!==1)throw Error('Attack did not hit exactly once');
     g.pause();const frozen=JSON.stringify(r);clock+=500;draw(clock);
     if(JSON.stringify(r)!==frozen)throw Error('Pause changed animation/simulation');
     results.push({species,fps,fast,duration,frames:seen,first_contact_frame:contacts[0],landed:r.stats.landedAttacks});
    }
   }}finally{ctx.drawImage=original;}
   return results;
  });
  for(const row of results){assert.deepEqual(row.frames,[0,1,2,3,4,5],JSON.stringify(row));assert.equal(row.first_contact_frame,3,JSON.stringify(row));}
  assert.equal(results.length,36);assert.deepEqual(errors,[]);
  if(process.env.PRIMAL_EXPECT_GDEVELOP)assert.equal(await page.evaluate(()=>typeof gdjs.RuntimeGame),'function');
  const report={status:'PASS',runtime:process.env.PRIMAL_EXPECT_GDEVELOP?'official GDevelop GDJS5.6.283':'standalone Chromium',results,
   checks:['actual simulation-to-renderer attack flow for all12 playable species','all six drawn poses at normal30/60fps and maximal attack-speed modifiers at60fps','contact frame3 and exactly one damage event','stable idle recovery and frozen pause','native pixels without smoothing'],production_approved:false};
  fs.writeFileSync(process.env.PRIMAL_POLISH_REPORT||path.resolve(__dirname,'../PRIMAL_RUN_Game/animation_polish_runtime_report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('PASS: 36 real attack flows, ordered six poses, contact3, one hit, stable recovery/pause');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
