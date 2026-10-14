'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:1100,height:860}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const url=await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html'));
 await page.goto(url);await page.evaluate(()=>primalRun.ready);
 await page.evaluate(()=>primalRun.preload({species:'velociraptor',stage:3}));
 const result=await page.evaluate(()=>{
  const g=primalRun.game,C=PrimalCore,canvas=document.querySelector('canvas[aria-label]'),ctx=canvas.getContext('2d');
  g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies('velociraptor');g.start({seed:83});g.pause();
  const r=g.run;r.stage=3;r.map=C.createMap(3,83);r.map.weather='ash';r.enemies=[];r.pickups=[];r.corpses=[];r.player.x=r.map.river[2].x;r.player.y=r.map.river[2].y;
  r.seconds=10;r.spawnTimer=999;r.health=r.maxHealth;g.setView(canvas.width,canvas.height);
  const original=ctx.drawImage,tiles=[];ctx.drawImage=function(image,...args){if(image.lavaTile)tiles.push(image);return original.call(this,image,...args);};
  const draw=()=>{tiles.length=0;primalRun.update(performance.now());};
  const before=JSON.stringify(r),masks=new Set();let samples=0,crossingSamples=0;
  try{
   draw();if(canvas.dataset.lavaTilesReady!=='true'||!tiles.length)throw Error('Native lava not rendered');
   for(const tile of tiles){
    const bits=[[tile.lavaX,tile.lavaY],[tile.lavaX+32,tile.lavaY],[tile.lavaX+32,tile.lavaY+32],[tile.lavaX,tile.lavaY+32]]
      .reduce((m,[x,y],i)=>m|(C.isLava(3,r.map,{x,y})?1<<i:0),0);
    if(bits!==tile.lavaMask)throw Error('Wrong selected lava mask');masks.add(bits);
    const a=tile.getContext('2d').getImageData(0,0,32,32).data;
    for(let y=0;y<32;y++)for(let x=0;x<32;x++){
     const p={x:tile.lavaX+x+.5,y:tile.lavaY+y+.5},i=(y*32+x)*4,hazard=C.isLava(3,r.map,p);
     const warm=a[i+3]>0&&a[i]>75&&a[i]>a[i+2]*1.2&&a[i]>a[i+1]*.95;
     if(warm!==hazard)throw Error('Lava pixels disagree with damage at '+JSON.stringify(p));samples++;
     if((r.map.lavaCrossings||[]).some(c=>Math.hypot(p.x-c.x,p.y-c.y)<70))crossingSamples++;
    }
   }
   if(JSON.stringify(r)!==before)throw Error('Renderer changes paused simulation');
   draw();if(JSON.stringify(r)!==before)throw Error('Paused art advances run');
   const HUD=[];
   for(const [species,name] of [['velociraptor','food_meat'],['ankylosaurus','food_plants'],['baryonyx','food_fish'],['gallimimus','food_meat']]){
    r.species=species;draw();const icon=document.querySelector('#food-chip canvas');
    if(icon.hidden||!icon.dataset.sprite.endsWith('/'+name+'.png'))throw Error('Wrong diet icon '+species);
    if(!document.querySelector('#food-chip').textContent.includes(r.meat+'/'))throw Error('Food text lost');HUD.push(species);
   }
   if(document.querySelector('#dna-chip canvas').hidden)throw Error('DNA icon missing');
   r.zone=0;draw();if(document.querySelector('#zone-chip canvas').hidden)throw Error('Zone icon missing');
   r.zone=null;draw();if(!document.querySelector('#zone-chip').hidden)throw Error('Empty zone leaves blank icon');
   // The adapter must preserve Part C control text/events even before that branch is integrated.
   const realPack=document.querySelector('.pack-key'),box=document.createElement('div');box.innerHTML=(realPack?'':'<button class="pack-key">FLOK</button>')+'<button data-reroll="1">NYE VALG</button>';const pack=realPack||box.firstChild;
   document.querySelector('.primal-shell').append(box);let clicks=0;const countClick=()=>clicks++;pack.addEventListener('click',countClick);
   r.packFocus=null;draw();if(!pack.querySelector('canvas').dataset.sprite.endsWith('pack_follow.png'))throw Error('Follow icon missing');
   r.packFocus={id:1,until:r.seconds+10};draw();if(!pack.querySelector('canvas').dataset.sprite.endsWith('pack_focus.png'))throw Error('Focus icon missing');
   if(!box.lastChild.querySelector('canvas').dataset.sprite.endsWith('reroll.png'))throw Error('Reroll icon missing');
   pack.click();if(clicks!==1||pack.textContent!=='FLOK'||box.lastChild.textContent!=='NYE VALG')throw Error('Control semantics changed');pack.removeEventListener('click',countClick);box.remove();r.packFocus=null;
   C.FEATURES.hudIcons=false;draw();if(!document.querySelector('#food-chip canvas').hidden||!document.querySelector('#food-chip').textContent.startsWith('◆ '))throw Error('HUD rollback missing');C.FEATURES.hudIcons=true;
   C.FEATURES.lavaTiles=false;draw();if(tiles.length||canvas.dataset.lavaTiles!=='false')throw Error('Lava rollback ignored');C.FEATURES.lavaTiles=true;
   // Geometry changes (including moved basalt crossings) must invalidate cached pixel masks.
   r.map.lavaCrossings=[{x:r.player.x,y:r.player.y}];draw();
   for(const tile of tiles){const a=tile.getContext('2d').getImageData(0,0,32,32).data;for(let y=0;y<32;y++)for(let x=0;x<32;x++){
    const p={x:tile.lavaX+x+.5,y:tile.lavaY+y+.5};if(Math.hypot(p.x-r.player.x,p.y-r.player.y)>=70)continue;
    const i=(y*32+x)*4;if(a[i+3]&&a[i]>75&&a[i]>a[i+2]*1.2&&a[i]>a[i+1]*.95)throw Error('Stale crossing pixels');crossingSamples++;
   }}
   g.save.settings.reducedMotion=true;draw();const frame=ctx.getImageData(0,0,canvas.width,canvas.height).data;draw();
   const next=ctx.getImageData(0,0,canvas.width,canvas.height).data;if(!frame.every((v,i)=>v===next[i]))throw Error('Paused reduced-motion image changes');
   return{samples,crossingSamples,masks:[...masks],HUD,stats:primalRun.assetStats(),pause:true,controlAdapter:true};
  }finally{ctx.drawImage=original;C.FEATURES.hudIcons=true;C.FEATURES.lavaTiles=true;}
 });
 assert.ok(result.samples>1000);assert.ok(result.crossingSamples>0);assert.deepEqual(errors,[]);
 for(const icon of await page.locator('.chip-icon:visible').all()){
  const box=await icon.boundingBox();assert.equal(box.width,24);assert.equal(box.height,24);
  assert.equal(await icon.evaluate(c=>getComputedStyle(c).position),'static');
 }
 const out=path.resolve(__dirname,'../PRIMAL_RUN_Game/previews/a6');fs.mkdirSync(out,{recursive:true});
 await page.evaluate(()=>{document.querySelector('.screen').style.visibility='hidden';primalRun.update(performance.now());});
 await page.screenshot({path:path.join(out,'lava-hud-desktop.png')});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'lava-hud-mobile.png')});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/a6_review.html')));
 await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.screenshot({path:path.join(out,'native-review.png')});
 await page.locator('#scale').selectOption('4');assert.equal(await page.locator('#hud canvas').first().evaluate(c=>c.width),96);
 assert.deepEqual(errors,[]);
 // Missing HUD atlas and PNGs must retain text instead of empty statistics.
 const missing=await browser.newPage();await missing.route('**/assets/atlases/world_shared_*.png*',route=>route.abort());
 await missing.route('**/assets/a6_hud/*.png*',route=>route.abort());
 await missing.goto(url);await missing.evaluate(()=>primalRun.ready);
 const fallback=await missing.evaluate(()=>{const g=primalRun.game;g.start({seed:83});g.pause();primalRun.update(performance.now());return{hidden:document.querySelector('#food-chip canvas').hidden,text:document.querySelector('#food-chip').textContent};});
 assert.equal(fallback.hidden,true);assert.match(fallback.text,/◆/);await missing.close();
 const report={status:'PASS',runtime:'standalone Chromium',...result,missingHUD:fallback,GDevelop_runtime:'not run',production_approved:false};
 fs.writeFileSync(path.resolve(out,'../../a6_runtime_report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(`PASS A6: ${result.samples} exact lava/damage pixel checks, crossing refresh, diet/HUD/Part C icons, rollback, pause and 390px`);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
