'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{
 const browser=await chromium.launch(browserOptions());
 try {
  const page=await browser.newPage({viewport:{width:1100,height:860}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));
  await page.evaluate(()=>primalRun.ready);
  await page.evaluate(async()=>{
   for(const species of Object.keys(PrimalCore.PLAYER_SPECIES))
    await primalRun.preload({species,stage:0,kinds:Object.keys(PrimalCore.SPECIES)});
  });
  const result=await page.evaluate(()=>{
   const C=PrimalCore,g=primalRun.game,canvas=document.querySelector('canvas[aria-label]');
   const ctx=canvas.getContext('2d'),original=ctx.drawImage,draws=new Map();
   ctx.drawImage=function(image,...args){
    const record=PrimalApp.drawRecord(image,args),file=record.image.src;
    if(file&&/^assets\/(enemies|enemy_animations|player_combat|player_full|enemy_full|species_attacks|behavior_native|behavior_injured|corpses)\//.test(file)){
     const copy=document.createElement('canvas');copy.width=record.image.width;copy.height=record.image.height;
     const dc=copy.getContext('2d');
     if(image.primalFrames)dc.drawImage(image,...args.slice(0,4),0,0,copy.width,copy.height);
     else dc.drawImage(image,0,0);
     draws.set(file,{data:dc.getImageData(0,0,copy.width,copy.height).data,night:!!image.nightPalette,args:record.args.length===2?[...record.args,copy.width,copy.height]:record.args});
    }
    return original.call(this,image,...args);
   };
   let cases=0,changed=0;
   const capture=()=>{draws.clear();primalRun.update(performance.now());return new Map(draws);};
   const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
   try {
    g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);
    for(const species of Object.keys(C.PLAYER_SPECIES))for(const skin of ['classic','male','elite','albino',...(species==='baryonyx'?['fishKing']:[])]){
     g.phase='menu';g.selectSpecies(species);g.start({seed:123});g.pause();g.save.skin=skin;
     const r=g.run;r.enemies=[];r.pickups=[];r.corpses=[];r.hurt=0;r.attack=null;r.seconds=10;
     r.player.moving=false;r.player.facing='S';r.darkness=0;r.night=false;
     r.corpses=[{id:9001,kind:'velociraptor',direction:'E',poseVariant:0,x:r.player.x-100,y:r.player.y+50,age:8,lifetime:40,variant:skin},{id:9002,kind:'utahraptor',direction:'W',poseVariant:1,x:r.player.x+100,y:r.player.y+60,age:20,lifetime:40,variant:skin}];
     const e=g.spawn('triceratops',{x:r.player.x+100,y:r.player.y});e.sex='female';e.mode='watch';e.moving=false;e.hit=0;
     const day=capture();r.night=true;const night=capture();
     if(!night.size)throw Error('No native sprite draws');
     for(const [file,n] of night){
      const d=day.get(file);if(!d)throw Error('Day/night changes pose '+file);
      if(!n.night)throw Error('Night sprite not recoloured '+file);
      if(!same(d.args,n.args))throw Error('Night changes origin/dimensions '+file);
      for(let i=0;i<d.data.length;i+=4){
       if(d.data[i+3]!==n.data[i+3])throw Error('Night changes silhouette '+file);
       const key=[d.data[i],d.data[i+1],d.data[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');
       const target=d.data[i+3]?C.NIGHT_PALETTE[key]:null;
       for(let j=0;j<3;j++){
        const expected=target?parseInt(target.slice(j*2,j*2+2),16):d.data[i+j];
        if(n.data[i+j]!==expected)throw Error('Wrong night/skin composition '+species+'/'+skin+'/'+file);
        if(expected!==d.data[i+j])changed++;
       }
      }
      cases++;
     }
     C.FEATURES.nightPalette=false;const rollback=capture();C.FEATURES.nightPalette=true;
     for(const [file,d] of day){const b=rollback.get(file);if(!b||b.night||!same(b.data,d.data))throw Error('Night palette rollback differs');}
     C.FEATURES.dayNight=false;const disabled=capture();C.FEATURES.dayNight=true;
     if([...disabled.values()].some(d=>d.night))throw Error('dayNight flag ignored');
     r.night=false;const restored=capture();
     for(const [file,d] of day)if(!same(restored.get(file).data,d.data))throw Error('Day pixels not restored');
    }
    const r=g.run;r.night=true;g.save.skin='classic';
    // Fill many distinct poses; decoded night frames must remain bounded.
    for(let i=0;i<288;i++){
     r.species=Object.keys(C.PLAYER_SPECIES)[Math.floor(i/24)%Object.keys(C.PLAYER_SPECIES).length];
     r.player.facing=['S','N','E','W'][Math.floor(i/6)%4];r.player.moving=true;
     r.player.gaitPhase=(i%6+.1)/6;r.health=r.maxHealth;
     r.attack={elapsed:(i%6+.1)/6*.6,duration:.6,facing:r.player.facing};capture();
    }
    if(primalRun.assetStats().nightFrames>128)throw Error('Night cache is unbounded');
    r.attack=null;r.player.moving=false;const before=JSON.stringify(r);capture();capture();
    if(before!==JSON.stringify(r))throw Error('Paused rendering advances run');
    return {cases,changed,stats:primalRun.assetStats(),pause:true};
   } finally {ctx.drawImage=original;C.FEATURES.nightPalette=true;C.FEATURES.dayNight=true;}
  });
  assert.ok(result.cases>=180,JSON.stringify(result));assert.ok(result.changed>0);assert.deepEqual(errors,[]);
  const out=path.resolve(__dirname,'../PRIMAL_RUN_Game/previews/night_palette');fs.mkdirSync(out,{recursive:true});
  await page.evaluate(()=>{document.querySelector('.screen').style.visibility='hidden';const r=primalRun.game.run;r.night=true;r.darkness=1;primalRun.update(performance.now());});
  await page.screenshot({path:path.join(out,'night-desktop.png')});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'night-mobile.png')});
  await page.setViewportSize({width:1280,height:1000});
  await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/night_palette_review.html')));
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('origin'));
  await page.locator('#species').selectOption('triceratops');await page.locator('#direction').selectOption('W');
  await page.locator('#state').selectOption('attack');
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('triceratops_attack_W'));
  await page.screenshot({path:path.join(out,'native-light-dark-review.png')});
  await page.locator('#scale').selectOption('4');
  await page.waitForFunction(()=>document.querySelector('figure canvas').width===576);
  assert.deepEqual(errors,[]);
  const report={status:'PASS',runtime:'standalone Chromium',...result,checks:['exact palette after species/skins','native alpha/origin/pose unchanged','day pixels restored','both feature rollbacks','bounded cache','paused run','390px mobile'],GDevelop_runtime:'not run',production_approved:false};
  fs.writeFileSync(path.resolve(out,'../../night_palette_runtime_report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`PASS night palette: ${result.cases} sprite/skin cases, preserved native pixels and bounded cache`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
