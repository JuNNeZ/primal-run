'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{
 const browser=await chromium.launch(browserOptions());
 try {
  const page=await browser.newPage({viewport:{width:1100,height:860}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/\.png(?:\?|$)/.test(r.url()))requests.push(r.url());});
  const url=await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html'));
  await page.goto(url);await page.evaluate(()=>{PrimalCore.FEATURES.randomStart=false;/* fixed positions around the classic 480,340 start */});await page.evaluate(()=>primalRun.ready);await page.waitForLoadState('networkidle');
  const menuRequests=requests.length;assert.ok(menuRequests<=8,'menu PNG requests '+menuRequests);
  const menuStats=await page.evaluate(()=>primalRun.assetStats());
  const menuSpecies=await page.evaluate(()=>[primalRun.game.save.selectedSpecies,...PrimalCore.BIOMES[0].animals,PrimalCore.STAGES[0].boss]);
  assert.ok(requests.every(url=>!url.includes('/species_')||menuSpecies.some(species=>url.includes('/species_'+species+'_'))),'menu loaded an unrelated species atlas');
  await page.evaluate(async()=>{await primalRun.preload({species:'velociraptor',stage:3});});
  const stageRequests=requests.length;assert.ok(stageRequests<=14,'menu + volcanic stage PNG requests '+stageRequests);
  const result=await page.evaluate(()=>{
   const g=primalRun.game,C=PrimalCore;g.phase='menu';g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies('velociraptor');g.start({seed:83});g.pause();
   const r=g.run;r.stage=3;r.map=C.createMap(3,83);r.enemies=[];r.spawnTimer=999;r.player.x=1000;r.player.y=800;r.view.x=520;r.view.y=480;r.seconds=10;
   const ctx=document.querySelector('canvas[aria-label]').getContext('2d'),old=ctx.drawImage,calls=[];
   ctx.drawImage=function(image,...args){const record=PrimalApp.drawRecord(image,args);calls.push({path:record.image.src,args:record.args});return old.call(this,image,...args);};
   try {
    const seen=new Set();
    const capture=()=>{calls.length=0;primalRun.update(performance.now());for(const c of calls)if(c.path)seen.add(c.path);};
    r.map.lavaCrossings=[{x:1000,y:800},{x:1001,y:860}];
    r.map.ponds=[{x:1000,y:900,radius:60,baseRadius:90}];r.drought=true;
    r.ashClouds=[{x:1040,y:800,radius:90,until:13}];
    r.raptors=[{id:987,x:1020,y:780,ally:true,hp:30,maxHP:30,facingX:1,facingY:0,moving:false,mode:'idle',cooldown:0}];
    r.particles=[{kind:'bubble',x:980,y:780,life:1,maxLife:1,size:2}];
    for(let frame=0;frame<4;frame++){r.ashClouds[0].until=r.seconds+3-frame*.75;r.particles[0].life=1-frame*.25;capture();}
    g.save.settings.reducedMotion=true;capture();const calmPaths=calls.filter(c=>c.path?.includes('/ash_cloud_')).map(c=>c.path);
    if(calls.some(c=>c.path?.includes('/bubble_')))throw Error('Reduced motion renders bubble particles');
    if(!calmPaths.length||calmPaths.some(p=>!p.endsWith('001.png')))throw Error('Reduced motion ash frame not stable');
    g.save.settings.reducedMotion=false;
    r.night=false;capture();const sun=document.querySelector('.time-icon').dataset.sprite;
    r.night=true;capture();const moon=document.querySelector('.time-icon').dataset.sprite;
    C.FEATURES.presentationArt=false;capture();
    if(calls.some(c=>c.path&&/assets\/(ground\/(basalt_crossing|dried_mud)|effects\/(bubble|ash_cloud)|ui\/raptor_ally)/.test(c.path)))throw Error('Presentation flag ignored');
    if(!document.querySelector('.time-icon').hidden||document.querySelector('.time-glyph').hidden)throw Error('Missing HUD fallback');
    C.FEATURES.presentationArt=true;capture();
    return {seen:[...seen],sun,moon,calmPaths,stats:primalRun.assetStats(),pausedSeconds:r.seconds};
   }finally{ctx.drawImage=old;C.FEATURES.presentationArt=true;}
  });
  for(let i=0;i<4;i++){assert.ok(result.seen.includes(`assets/effects/bubble_00${i}.png`));assert.ok(result.seen.includes(`assets/effects/ash_cloud_00${i}.png`));}
  for(let i=0;i<4;i++)assert.ok(result.seen.includes(`assets/ground/dried_mud_edge_N_${i}.png`),'dry north bank '+i);
  for(let i=0;i<2;i++)assert.ok(result.seen.includes(`assets/ground/basalt_crossing_${i}.png`),'crossing '+i);
  assert.ok(result.seen.includes('assets/ui/raptor_ally.png'),'ally marker');
  assert.equal(result.sun,'assets/ui/time_sun.png');assert.equal(result.moon,'assets/ui/time_moon.png');assert.deepEqual(errors,[]);
  const out=path.resolve(__dirname,'../PRIMAL_RUN_Game/previews/presentation');fs.mkdirSync(out,{recursive:true});
  await page.evaluate(()=>{const r=primalRun.game.run;r.night=false;r.ashClouds[0].until=r.seconds+2;r.particles[0].life=.75;document.querySelector('.screen').style.visibility='hidden';primalRun.update(performance.now());});
  await page.screenshot({path:path.join(out,'volcanic-approved-art.png')});
  // Fail the shared UI atlas: every original PNG remains a viable fallback.
  const fallback=await browser.newPage();await fallback.route('**/assets/atlases/world_shared_*.png*',route=>route.abort());
  await fallback.goto(url);await fallback.evaluate(()=>{PrimalCore.FEATURES.randomStart=false;/* fixed positions around the classic 480,340 start */});await fallback.evaluate(()=>primalRun.ready);
  const fallbackResult=await fallback.evaluate(async()=>{await primalRun.preload({species:'velociraptor'});const g=primalRun.game;g.start({seed:83});g.pause();primalRun.update(performance.now());return{path:document.querySelector('.time-icon').dataset.sprite,hidden:document.querySelector('.time-icon').hidden};});
  assert.equal(fallbackResult.path,'assets/ui/time_sun.png');assert.equal(fallbackResult.hidden,false);await fallback.close();
  const missing=await browser.newPage();
  await missing.route('**/assets/atlases/world_shared_*.png*',route=>route.abort());
  await missing.route('**/assets/ui/time_sun.png*',route=>route.abort());
  await missing.goto(url);await missing.evaluate(()=>{PrimalCore.FEATURES.randomStart=false;/* fixed positions around the classic 480,340 start */});await missing.evaluate(()=>primalRun.ready);
  const missingResult=await missing.evaluate(()=>{const g=primalRun.game;g.start({seed:83});g.pause();primalRun.update(performance.now());return {hidden:document.querySelector('.time-icon').hidden,glyphHidden:document.querySelector('.time-glyph').hidden,glyph:document.querySelector('.time-glyph').textContent};});
  assert.equal(missingResult.hidden,true);assert.equal(missingResult.glyphHidden,false);assert.match(missingResult.glyph,/☀/);await missing.close();
  const report={status:'PASS',runtime:'standalone Chromium',menuRequests,menuStats,menuAndVolcanicStageRequests:stageRequests,...result,fallback:fallbackResult,missingPNG:missingResult,production_approved:false};
  fs.writeFileSync(path.resolve(__dirname,'../PRIMAL_RUN_Game/presentation_atlas_runtime_report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`PASS: approved presentation art, reduced motion, HUD fallback, atlas failure fallback; ${menuRequests} menu / ${stageRequests} menu + volcanic-stage PNG requests`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
