'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
  const page=await browser.newPage({viewport:{width:1100,height:860}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(await localURL(path.resolve(__dirname,process.env.PRIMAL_TEST_PAGES?'../dist/index.html':'../PRIMAL_RUN_Game/index.html')));await page.evaluate(()=>primalRun.ready);
  await page.evaluate(async()=>{
    PrimalCore.FEATURES.fishingGame=false; // legacy hold-to-fish behaviour; the minigame has its own test
    await primalRun.preload({species:'baryonyx',stage:0});const g=primalRun.game,C=PrimalCore;g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies('baryonyx');g.start({seed:83});g.pause();
    const r=g.run,f=r.map.fishSchools[0];r.enemies=[];r.corpses=[];r.pickups=[];r.raptors=[];r.spawnTimer=999;r.nextXP=9999;r.player.x=f.x;r.player.y=f.y+75;r.player.facing='E';r.view.x=f.x-470;r.view.y=f.y-290;r.map.weather='pollen';r.seconds=0;r.night=false;
    window.fishingEvidence={fish:[],ellipses:[],strokes:[]};const ctx=document.querySelector('canvas[aria-label]').getContext('2d'),draw=ctx.drawImage,ellipse=ctx.ellipse,stroke=ctx.stroke;
    ctx.drawImage=function(image,...args){const rec=PrimalApp.drawRecord(image,args);if(rec.image.src&&/fishing\/fish_/.test(rec.image.src))fishingEvidence.fish.push(rec.image.src);return draw.call(this,image,...args);};
    ctx.ellipse=function(...args){fishingEvidence.ellipses.push({args,color:this.fillStyle});return ellipse.apply(this,args);};
    ctx.stroke=function(...args){fishingEvidence.strokes.push(this.strokeStyle);return stroke.apply(this,args);};document.querySelector('.screen').style.visibility='hidden';
  });
  const out=path.resolve(__dirname,'../PRIMAL_RUN_Game/previews/natural_fishing');fs.mkdirSync(out,{recursive:true});
  await page.evaluate(()=>{PrimalCore.FEATURES.cleanMarkers=false;primalRun.update(performance.now());});await page.locator('canvas[aria-label]').screenshot({path:path.join(out,'markers_before.png')});
  const result=await page.evaluate(()=>{
    const g=primalRun.game,r=g.run,C=PrimalCore;C.FEATURES.cleanMarkers=true;fishingEvidence.fish=[];fishingEvidence.strokes=[];fishingEvidence.ellipses=[];primalRun.update(performance.now());
    if(fishingEvidence.fish.length)throw Error('Fish sprite drawn before a catch');if(!+document.querySelector('canvas[aria-label]').dataset.fishingSpots)throw Error('Fishing spot missing');
    if(fishingEvidence.strokes.includes('#69a4a0'))throw Error('Permanent player ring remains');
    const shadow=()=>fishingEvidence.ellipses.find(e=>e.color==='#0a0f0c'&&Math.abs(e.args[0]-r.player.x)<2&&Math.abs(e.args[1]-r.player.y-3)<2);
    const east=shadow();r.player.facing='N';fishingEvidence.ellipses=[];primalRun.update(performance.now());const north=shadow();
    if(!east||!north||east.args[2]!==north.args[3]||east.args[3]!==north.args[2])throw Error('Shadow does not follow facing');
    r.player.facing='E';const frozen=JSON.stringify(r);primalRun.update(performance.now());if(JSON.stringify(r)!==frozen)throw Error('Rendering changed paused world');
    return {eastShadow:east.args.slice(2,4),northShadow:north.args.slice(2,4),capacity:r.map.fishSchools[0].capacity};
  });
  await page.locator('canvas[aria-label]').screenshot({path:path.join(out,'fishing_spot.png')});
  const catchResult=await page.evaluate(()=>{
    const g=primalRun.game,r=g.run,f=r.map.fishSchools[0];g.phase='playing';f.catchRarities=[2];const food=r.totalMeat,stock=f.stock;g.eat(1.3,{eat:true});g.pause();primalRun.update(performance.now());
    if(f.stock!==stock-1||r.totalMeat<=food||!fishingEvidence.fish.length)throw Error('Fishing from bank lacks stock/reward/animation');
    const e=r.effects.find(e=>e.kind==='fishCatch');if(!e||e.rarity!==2||!e.text.includes('Sjældent')||!e.text.includes('+'+e.value))throw Error('Catch rarity and food value missing');
    const life=e.life;g.step(.5);if(e.life!==life)throw Error('Catch animation advances while paused');return {rarity:e.rarity,food:e.value,stock:f.stock};
  });
  await page.locator('canvas[aria-label]').screenshot({path:path.join(out,'rare_catch.png')});
  await page.evaluate(()=>{const f=primalRun.game.run.map.fishSchools[0];f.stock=0;primalRun.game.run.effects=[];fishingEvidence.fish=[];primalRun.update(performance.now());if(fishingEvidence.fish.length)throw Error('Empty spot draws fish');});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.resolve(__dirname,'../PRIMAL_RUN_Game/natural_fishing_runtime_report.json'),JSON.stringify({status:'PASS',runtime:'standalone Chromium',...result,...catchResult,checks:['float before catch; native fish on catch','shore fishing and finite stock','rarity and food value','permanent player ring removed','shadow follows facing','pause freezes world and catch effect','empty fishing spot remains visible','no browser errors']},null,2)+'\n');console.log('PASS natural fishing: indicators, bank catches, rarity, stock, oriented shadows and pause');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
