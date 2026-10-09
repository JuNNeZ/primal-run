'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());let errors=[];try{
 const url=process.env.PRIMAL_GAME_URL||await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html'));
 for(const [width,height] of [[1440,950],[390,844],[844,390]]){
  const p=await browser.newPage({viewport:{width,height}});p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)errors.push(r.url())});await p.goto(url);await p.waitForFunction(()=>primalRun&&document.querySelector('[data-action=start]:not(:disabled)'));
  assert.equal(await p.locator('canvas[aria-label]:not(.end-scene)').getAttribute('data-scene'),'jungle');const before=+(await p.locator('canvas[aria-label]:not(.end-scene)').getAttribute('data-menu-time'));await p.waitForTimeout(300);assert.ok(+(await p.locator('canvas[aria-label]:not(.end-scene)').getAttribute('data-menu-time'))>before);assert.ok(await p.locator('canvas[aria-label]:not(.end-scene)').getAttribute('data-menu-actors'));
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);const frozen=await p.locator('canvas[aria-label]:not(.end-scene)').getAttribute('data-menu-time');await p.waitForTimeout(150);assert.equal(await p.locator('canvas[aria-label]:not(.end-scene)').getAttribute('data-menu-time'),frozen);await p.emulateMedia({reducedMotion:'no-preference'});
  await p.locator('[data-action=start]').click();await p.locator('[data-action=begin]').click();await p.waitForFunction(()=>primalRun.game.phase==='playing');await p.keyboard.press('Escape');await p.waitForFunction(()=>primalRun.game.phase==='paused');await p.waitForTimeout(100);
  const run=await p.evaluate(()=>JSON.stringify(primalRun.game.run));await p.waitForTimeout(120);assert.equal(await p.evaluate(()=>JSON.stringify(primalRun.game.run)),run,'decorative motion never advances a paused world');
  if(width===1440){
   const colors=await p.evaluate(async()=>{
    const g=primalRun.game,r=g.run,c=document.querySelector('canvas[aria-label]'),ctx=c.getContext('2d'),resourceFiles=typeof gdjs!=='undefined'?new Map(gdjs.projectData.resources.resources.map(x=>[x.name,x.file])):new Map();
    r.enemies=[];r.map.rocks=[];r.map.decorations=[];r.map.ambience=[];r.map.sites=[];r.decals=[];r.effects=[];r.particles=[];r.pickups=[];r.attack=null;r.hurt=0;r.shake=0;r.invulnerable=0;r.deathTime=-1;r.seconds=0;r.player.moving=false;r.player.facing='S';r.player.x=600;r.player.y=340;
    const result=[];
    for(const species of Object.keys(PrimalCore.PLAYER_SPECIES)){
     await primalRun.preload({species});r.species=species;r.player.radius=PrimalCore.PLAYER_SPECIES[species].radius;const path=PrimalCore.playerFrame(species,'idle','S',0),im=new Image();im.src=resourceFiles.get(path)||path;await im.decode();const temp=document.createElement('canvas');temp.width=144;temp.height=144;const tc=temp.getContext('2d');tc.drawImage(im,0,0);const original=tc.getImageData(0,0,144,144).data;primalRun.update(performance.now());const drawn=ctx.getImageData(0,0,c.width,c.height).data,meta=PrimalAssets[path];let checked=0;
     for(let y=45;y<85;y++)for(let x=35;x<110;x++){const index=(y*144+x)*4;if(original[index+3]!==255)continue;const key=[original[index],original[index+1],original[index+2]].map(v=>v.toString(16).padStart(2,'0')).join(''),mapped=PrimalCore.SPECIES_COLORS[species][key];if(!mapped||mapped===key)continue;const dx=Math.round(r.player.x-r.view.x)-meta.origin[0]*(species==='tyrannosaurus'?2:1)+x*(species==='tyrannosaurus'?2:1),dy=Math.round(r.player.y-r.view.y)-meta.origin[1]*(species==='tyrannosaurus'?2:1)+y*(species==='tyrannosaurus'?2:1),di=(dy*c.width+dx)*4;const expected=[0,2,4].map(i=>parseInt(mapped.slice(i,i+2),16));if(expected.every((v,i)=>v===drawn[di+i]))checked++;}
     if(checked<10)throw Error(species+' has no actual species palette on its body');result.push({species,checked});
    }
    return result;
   });assert.equal(colors.length,10);
  }
  if(process.env.PRIMAL_EXPECT_GDEVELOP)assert.equal(await p.evaluate(()=>typeof gdjs.RuntimeGame),'function');await p.close();
 }
 assert.deepEqual(errors,[]);const report={status:'PASS',runtime:process.env.PRIMAL_EXPECT_GDEVELOP?'official GDevelop GDJS 5.6.283':'standalone Chromium',checks:['animated jungle scene on desktop/portrait/landscape','visible dinosaur passers-by','reduced-motion freezes scene','start/intro/pause controls','decoration respects paused run','actual recolored pixels for all ten playable classes','no page errors or missing resources'],production_approved:false};if(process.env.PRIMAL_JUNGLE_REPORT)fs.writeFileSync(process.env.PRIMAL_JUNGLE_REPORT,JSON.stringify(report,null,2)+'\n');console.log('PASS: cinematic jungle menu, responsive controls, reduced motion, actual species palettes, pause isolation');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
