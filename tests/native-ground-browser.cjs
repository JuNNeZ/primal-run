'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:1100,height:860}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.evaluate(()=>primalRun.ready);
 await page.waitForFunction(()=>document.querySelector('canvas[aria-label]').dataset.nativeGround==='true'&&document.querySelector('canvas[aria-label]').dataset.scene==='jungle');
 assert.equal(await page.evaluate(()=>primalRun.game.phase),'menu');
 await page.evaluate(async()=>{await primalRun.preload({species:'triceratops',stage:0});const g=primalRun.game;g.save.unlockedSpecies=Object.keys(PrimalCore.PLAYER_SPECIES);g.selectSpecies('triceratops');g.start({seed:33});g.pause();});
 const samples=await page.evaluate(()=>{
  const g=primalRun.game,r=g.run,C=PrimalCore,canvas=document.querySelector('canvas[aria-label]'),ctx=canvas.getContext('2d'),old=ctx.drawImage,patches=[],families=new Set(),layers=[];
  ctx.drawImage=function(image,...args){const record=PrimalApp.drawRecord(image,args);if(image.groundPatch==='dry')layers.push('dry');if(record.image.src?.includes('assets/water_transitions/'))layers.push('water');if(image.groundFamily)families.add(image.groundFamily);if(image.groundPatch){const d=image.getContext('2d').getImageData(0,0,image.width,image.height).data;let visible=0,transparent=0;const colors=new Set();for(let i=0;i<d.length;i+=4){if(d[i+3]===255){visible++;colors.add([...d.slice(i,i+3)].join(','));}else if(d[i+3]===0){transparent++;if(d[i]||d[i+1]||d[i+2])throw Error('Transparent fringe RGB');}else throw Error('Smoothed patch alpha');}patches.push({kind:image.groundPatch,visible,transparent,colors:colors.size});}return old.call(this,image,...args);};
  try{const checks=[];for(let stage=0;stage<4;stage++){
   r.stage=stage;r.map=C.createMap(stage,33);r.map.weather='pollen';r.enemies=[];r.corpses=[];r.raptors=[];r.pickups=[];r.player.x=1000;r.player.y=800;r.view.x=520;r.view.y=480;r.spawnTimer=999;r.seconds=0;r.map.rocks=[];r.map.sites=[];r.map.events=[];r.map.cover=[];
   r.map.mud=[{x:850,y:850,rx:100,ry:60}];r.map.ponds=[{x:1250,y:850,baseRadius:90,radius:45}];
   r.map.decorations=[{x:720,y:690,path:'assets/props/tree_canopy.png'},{x:800,y:720,path:'assets/props/fern_large.png'},{x:1100,y:980,path:'assets/props/fallen_log.png'},{x:1200,y:640,path:'assets/props/flower_bush.png'}];
   layers.length=0;primalRun.update(performance.now());if(layers.indexOf('dry')<0||layers.lastIndexOf('water')<layers.indexOf('dry'))throw Error('Dry bank hides pond water');const frozen=JSON.stringify(r),surface=g.terrainAt(r.map.mud[0]);primalRun.update(performance.now());
   if(canvas.dataset.nativeGround!=='true'||ctx.imageSmoothingEnabled)throw Error('Native terrain not active');if(JSON.stringify(r)!==frozen)throw Error('Ground changes paused simulation');
   C.FEATURES.nativeGround=false;primalRun.update(performance.now());if(canvas.dataset.nativeGround!=='false')throw Error('Missing legacy fallback');if(JSON.stringify(g.terrainAt(r.map.mud[0]))!==JSON.stringify(surface))throw Error('Ground affects physics');C.FEATURES.nativeGround=true;
   checks.push({stage,surface:surface.kind});
  }
  return {checks,families:[...families],patches};
  }finally{ctx.drawImage=old;C.FEATURES.nativeGround=true;}
 });
 assert.deepEqual(samples.families.sort(),['forest','river','rocks','volcano']);assert.equal(samples.checks.length,4);for(const p of samples.patches){assert.ok(p.visible>500);assert.ok(p.transparent>100);assert.ok(p.colors>12);}
 const out=path.resolve(__dirname,'../PRIMAL_RUN_Game/previews/native_ground');fs.mkdirSync(out,{recursive:true});
 for(let stage=0;stage<4;stage++){
  await page.evaluate(stage=>{const g=primalRun.game,r=g.run;r.stage=stage;r.map=PrimalCore.createMap(stage,33);r.map.weather='pollen';r.map.rocks=[];r.map.sites=[];r.map.events=[];r.map.cover=[];r.map.mud=[{x:850,y:850,rx:100,ry:60}];r.map.ponds=[{x:1250,y:850,baseRadius:90,radius:45}];r.map.decorations=[{x:720,y:690,path:'assets/props/tree_canopy.png'},{x:800,y:720,path:'assets/props/fern_large.png'},{x:1100,y:980,path:'assets/props/fallen_log.png'},{x:1200,y:640,path:'assets/props/flower_bush.png'}];document.querySelector('.screen').style.visibility='hidden';PrimalCore.FEATURES.nativeGround=true;primalRun.update(performance.now());},stage);
  await page.locator('canvas[aria-label]').screenshot({path:path.join(out,`biome_${stage}_after.png`)});
  if(stage===0){await page.evaluate(()=>{PrimalCore.FEATURES.nativeGround=false;primalRun.update(performance.now());});await page.locator('canvas[aria-label]').screenshot({path:path.join(out,'forest_before.png')});await page.evaluate(()=>{PrimalCore.FEATURES.nativeGround=true;primalRun.update(performance.now());});}
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.resolve(__dirname,'../PRIMAL_RUN_Game/native_ground_runtime_report.json'),JSON.stringify({status:'PASS',runtime:'standalone Chromium',...samples,checks:['main menu uses native ground','four preserved tile families','native pixels and unsmoothed binary patch fringe','textured mud and drought ring','dry bank below pond water','unchanged physical mud surface','feature fallback','paused simulation unchanged']},null,2)+'\n');console.log('PASS: four native biomes, textured mud/drought, binary pixel edges, unchanged terrain rules and pause');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
