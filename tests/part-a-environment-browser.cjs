'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const b=await chromium.launch(browserOptions());try{
 const p=await b.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await p.locator('[data-first-language="da"]').click();await p.waitForSelector('[data-action="start"]:not(:disabled)');
 await p.evaluate(async()=>{await primalRun.preload({species:'utahraptor',stage:1,kinds:[...Object.keys(PrimalCore.SPECIES),'velociraptor']});});
 await p.locator('[data-action="start"]').click();await p.locator('[data-action="begin"]').click();await p.waitForFunction(()=>primalRun.game.phase==='playing',null,{timeout:60000}); // stage art loads at START
 const result=await p.evaluate(()=>{const g=primalRun.game,C=PrimalCore,r=g.run,canvas=document.querySelector('canvas[aria-label]'),ctx=canvas.getContext('2d'),old=ctx.drawImage,calls=[];let ecology=0,ecologyDrawn=0,ecologyFallback=0,corpses=0;
 g.pause();r.player.x=800;r.player.y=600;r.player.moving=false;r.hurt=0;r.attack=null;r.spawnTimer=999;r.pickups=[];r.corpses=[];r.map.rocks=[];r.map.decorations=[];r.map.forage=[];r.map.sites=[];r.map.events=[];
 ctx.drawImage=function(im,...a){if(im.src)calls.push('assets/'+im.src.split('/assets/').pop().split('?')[0]);return old.call(this,im,...a);};
 try{
 for(const species of ['ankylosaurus','parasaurolophus','triceratops','pachycephalosaurus','gallimimus','carnotaurus','tyrannosaurus','baryonyx','deinosuchus']){
  r.enemies=[];const e=g.spawn(species,{x:r.player.x+100,y:r.player.y});e.moving=false;e.hit=0;e.sex='female';e.hp=e.maxHP;e.boss=false;
  for(const d of ['S','N','E','W'])for(const [mode,state] of [['graze','graze'],['drink','drink'],['rest','sleep'],['scratch','scratch']])for(let frame=0;frame<2;frame++){
   e.direction=d;e.mode=mode;e.naturalTime=12+frame*.8;calls.length=0;primalRun.update(performance.now());const name=`${species}_${state}_${d}_00${frame}.png`;
   const candidates=['assets/behavior_native/'+name,'assets/behavior/'+name],enabled=candidates.find(path=>PrimalAssets[path]&&PrimalAssets[path].runtime_enabled!==false);
   if(enabled){if(!calls.includes(enabled))throw Error('Ecology pose missing '+enabled);ecologyDrawn++;}
   else{const fallback=C.legacyPlayerFrame(species,'idle',d,0);if(!calls.includes(fallback))throw Error('Original fallback missing '+fallback);ecologyFallback++;}
   for(const rejected of candidates.filter(path=>PrimalAssets[path]?.runtime_enabled===false))if(calls.includes(rejected))throw Error('Rejected ecology pose drawn '+rejected);
   C.FEATURES.ecologyAnimations=false;calls.length=0;primalRun.update(performance.now());if(!calls.includes(C.legacyPlayerFrame(species,'idle',d,0))||calls.some(path=>path.includes('/behavior')))throw Error('Ecology rollback failed '+species);C.FEATURES.ecologyAnimations=true;
   ecology++;
  }
 }
 r.enemies=[];const wounded=g.spawn('triceratops',{x:r.player.x+100,y:r.player.y});wounded.moving=true;wounded.mode='roam';wounded.direction='E';wounded.hp=wounded.maxHP*.2;wounded.hit=0;wounded.sex='female';wounded.gaitPhase=.4;
 for(const flag of ['injuredPoses','limpAnimation']){const previous=C.FEATURES[flag];try{C.FEATURES[flag]=false;calls.length=0;primalRun.update(performance.now());const frame=C.locomotionFrame(wounded.gaitPhase,wounded.hp,wounded.maxHP),fallback=C.legacyPlayerFrame('triceratops','walk','E',frame);if(!calls.includes(fallback)||calls.some(path=>/^assets\/behavior(?:_injured)?\//.test(path)))throw Error('Injury rollback failed '+flag);}finally{C.FEATURES[flag]=previous;}}
 r.enemies=[];for(const species of ['utahraptor','velociraptor'])for(const d of ['S','N','E','W'])for(const [age,state] of [[10,'decayed'],[30,'skeleton']])for(let variant=0;variant<2;variant++){
  r.corpses=[{kind:species,direction:d,age,foodLifetime:18,poseVariant:variant,x:r.player.x+100,y:r.player.y,visualScale:1}];calls.length=0;primalRun.update(performance.now());const name=`assets/corpses/${species}_${state}_${d}_${variant}.png`;if(!calls.includes(name))throw Error('Corpse missing '+name);corpses++;
 }
 r.corpses=[];r.stage=1;r.map.river=r.map.riverCurve=[{x:0,y:600},{x:r.map.width,y:600}];r.map.ponds=[];r.map.fords=[{x:800,y:600}];r.map.mud=[];
 calls.length=0;primalRun.update(performance.now());if(canvas.dataset.waterTiles!=='true'||!calls.some(s=>s.startsWith('assets/water_transitions/shore_sand_'))||!calls.some(s=>s.startsWith('assets/water_transitions/water_depth_')))throw Error('Missing shore/depth tiles');
 if(C.isDeepWater(1,r.map,{x:800,y:600})||!C.isDeepWater(1,r.map,{x:1000,y:600}))throw Error('Ford does not match movement');
 const first=canvas.dataset.deepWaterTileCount;r.map.fords=[];primalRun.update(performance.now());if(Number(canvas.dataset.deepWaterTileCount)<=Number(first))throw Error('Water geometry cache did not invalidate');
 C.FEATURES.waterTiles=false;calls.length=0;primalRun.update(performance.now());if(calls.some(s=>/^assets\/water_transitions\//.test(s)))throw Error('Water rollback ignored');C.FEATURES.waterTiles=true;
 const frozen=JSON.stringify(r);g.step(.05,{x:1,attack:true});primalRun.update(performance.now());if(JSON.stringify(r)!==frozen)throw Error('Render advances paused ecology');
 g.resume();primalRun.update(performance.now());return {ecology,ecologyDrawn,ecologyFallback,corpses,ford:true,cacheInvalidation:true,pause:true,rollback:true,injuryRollback:true};
 }finally{ctx.drawImage=old;C.FEATURES.waterTiles=true;C.FEATURES.ecologyAnimations=true;}});
 assert.equal(result.ecology,288);assert.equal(result.ecologyDrawn+result.ecologyFallback,288);assert.equal(result.corpses,32);assert.deepEqual(errors,[]);
 const out=path.resolve(__dirname,'../PRIMAL_RUN_Game/previews/part_a');fs.mkdirSync(out,{recursive:true});await p.screenshot({path:path.join(out,'water-tiles-runtime.png')});
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:path.join(out,'water-tiles-mobile.png')});
 await p.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/behavior_review.html')));await p.waitForFunction(()=>document.querySelectorAll('#frames img').length===6&&[...document.querySelectorAll('#frames img')].every(i=>i.complete&&i.naturalWidth));assert.match(await p.locator('#status').innerText(),/kun review/);await p.locator('#pause').click();await p.screenshot({path:path.join(out,'injured-poses-review.png')});assert.deepEqual(errors,[]);
 await p.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/injured_walk_review.html')));
 await p.waitForFunction(()=>document.querySelector('#species').options.length===13&&['old','injury'].every(id=>document.getElementById(id).getContext('2d').getImageData(0,0,144,144).data.some((v,i)=>i%4===3&&v>0)));
 await p.locator('#species').selectOption('triceratops');await p.locator('#direction').selectOption('W');await p.waitForFunction(()=>document.querySelector('#details').textContent.startsWith('triceratops W:')&&document.querySelector('#sheet').complete&&document.querySelector('#sheet').naturalWidth>0);
 await p.waitForTimeout(120);await p.locator('#pause').click();const injuryFrozen=await p.evaluate(()=>['old','injury'].map(id=>document.getElementById(id).toDataURL()));await p.waitForTimeout(120);assert.deepEqual(await p.evaluate(()=>['old','injury'].map(id=>document.getElementById(id).toDataURL())),injuryFrozen);await p.locator('#background').click();assert.ok(await p.locator('body').evaluate(el=>el.classList.contains('dark')));await p.screenshot({path:path.join(out,'injured-walk-native-review.png')});
 await p.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/native_behavior_review.html')));
 await p.waitForFunction(()=>document.querySelector('#species').options.length===9&&document.querySelector('#status').textContent&&document.querySelector('#view').getContext('2d').getImageData(0,0,144,144).data.some((v,i)=>i%4===3&&v>0));
 const nativeSelection=await p.evaluate(async()=>{const m=await(await fetch('native_behavior_manifest.json')).json(),s=document.querySelector('#species').value,d=document.querySelector('#direction').value,a=document.querySelector('#state').value,e=m.find(row=>row.species===s&&row.direction===d&&(row.activity||row.state)===a);return {selected:s,first:m[0].species,status:document.querySelector('#status').textContent,expected:e.runtime_enabled===false?'Original fallback — nyt par afvist':'Aktiv prototype'};});assert.equal(nativeSelection.selected,nativeSelection.first);assert.equal(nativeSelection.status,nativeSelection.expected);
 await p.waitForTimeout(120);await p.locator('#pause').click();const nativeFrozen=await p.locator('#view').evaluate(el=>el.toDataURL());await p.waitForTimeout(120);assert.equal(await p.locator('#view').evaluate(el=>el.toDataURL()),nativeFrozen);await p.screenshot({path:path.join(out,'native-behavior-review.png')});assert.deepEqual(errors,[]);
 result.reviewPages={legacyDraft:true,injuredNative:true,behaviorNative:true,controls:true,pause:true};
 fs.writeFileSync(path.resolve(out,'../../part_a_environment_runtime_report.json'),JSON.stringify({status:'PASS',runtime:'standalone Chromium',...result,checks:['288 ecology cases draw eligible authored poses or original fallbacks; rejected candidates remain hidden','32 raptor decay/skeleton props','native shore/deep-water tiles render','fords match movement and geometry changes refresh cache','ecology/injury/water rollback and full pause freeze','legacy draft plus native injury/behavior review pages draw pixels, change controls and freeze while paused'],production_approved:false},null,2)+'\n');console.log('PASS part A ecology, water, raptor props and pause');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
