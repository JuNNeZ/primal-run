'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.env.PRIMAL_GAME_URL||await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.waitForSelector('[data-action="start"]:not(:disabled)');await page.evaluate(async()=>{for(const species of Object.keys(PrimalCore.PLAYER_SPECIES))await primalRun.preload({species,stage:3,kinds:Object.keys(PrimalCore.SPECIES)});});await page.locator('[data-action="start"]').click();await page.locator('[data-action="begin"]').click();await page.waitForFunction(()=>primalRun.game.phase==='playing');
 const result=await page.evaluate(()=>{const g=primalRun.game,r=g.run,ctx=document.querySelector('canvas[aria-label]').getContext('2d'),old=ctx.drawImage,calls=[];let checked=0;
 const resources=typeof gdjs!=='undefined'&&gdjs.projectData?new Map(gdjs.projectData.resources.resources.map(r=>[r.name,r.file])):new Map();ctx.drawImage=function(im,...args){if(im.src)calls.push({file:decodeURIComponent(im.src).split('/').pop(),w:im.naturalWidth,h:im.naturalHeight,args});return old.call(this,im,...args);};
 try{g.pause();r.pickups=[];r.attack=null;r.shake=0;r.corpses=[];const plan={idle:4,walk:6,run:6,attack:6,hurt:2,death:6};
 for(const species of ['compy','parasaurolophus','carnotaurus','ankylosaurus','deinosuchus','triceratops','tyrannosaurus']){
 r.enemies=[];const e=g.spawn(species,{x:480,y:260});
 for(const d of ['S','E','N','W'])for(const [state,count]of Object.entries(plan))for(let f=0;f<count;f++){
 e.direction=d;e.hit=state==='hurt'?.15-(f+.1)/8:0;e.mode=state==='run'?'flee':state==='attack'?(f<3?'windup':'charge'):'chase';e.windupDuration=.6;e.timer=state==='attack'?(f<3?.6*(1-(f+.1)/3):.55*(1-(f-3+.1)/3)):0;e.moving=['walk','run'].includes(state);e.walk=(f+.1)/(state==='run'?12:8);e.poseTime=(f+.1)/4;
 r.enemies=state==='death'?[]:[e];r.corpses=state==='death'?[{kind:species,x:e.x,y:e.y,direction:d,visualScale:e.visualScale,age:(f+.1)/8}]:[];
 calls.length=0;primalRun.update(performance.now());const name='assets/'+(['compy','carnotaurus','ankylosaurus'].includes(species)?'player_full/':'enemy_full/')+species+'_'+state+'_'+d+'_'+String(f).padStart(3,'0')+'.png',file=(resources.get(name)||name).split('/').pop(),call=calls.find(c=>c.file===file),scale=e.visualScale;
 if(!call)throw Error('Missing actual enemy frame '+name);if(call.w!==144||call.h!==144||call.args[0]!==e.x-72*scale||call.args[1]!==e.y-72*scale)throw Error('Native canvas/body origin changed '+name);if(scale>1&&(call.args[2]!==144*scale||call.args[3]!==144*scale))throw Error('Noninteger scale '+name);if(ctx.imageSmoothingEnabled||e.radius!==PrimalCore.SPECIES[species].radius)throw Error('Silhouette affects collision');checked++;
 }
 }
 r.enemies=[];r.corpses=[];r.map.rocks=[];r.map.mud=[];r.map.cover=[];r.player.x=480;r.player.y=292;const contact=g.spawn('compy',{x:480,y:260});contact.direction='S';contact.mode='bite';contact.timer=.18;contact.facingX=0;contact.facingY=1;const hp=r.health;
 function drawnFrame(expected){calls.length=0;primalRun.update(performance.now());const name='assets/player_full/compy_attack_S_'+String(expected).padStart(3,'0')+'.png';if(!calls.some(c=>c.file===(resources.get(name)||name).split('/').pop()))throw Error('Actual bite contact mismatches frame '+expected);}
 drawnFrame(2);g.phase='playing';g.enemyStep(contact,.09);g.pause();if(!contact.attackHit||r.health>=hp)throw Error('Core bite failed to contact');drawnFrame(3);
 const frozen=JSON.stringify(r);g.phase='mutation';g.step(.05,{x:1,attack:true});if(JSON.stringify(r)!==frozen)throw Error('Mutation world moves');return {checked,species:7,states:6,directions:4,paused:true};
 }finally{ctx.drawImage=old;}});
 assert.equal(result.checked,840);assert.deepEqual(errors,[]);if(process.env.PRIMAL_EXPECT_GDEVELOP)assert.equal(await page.evaluate(()=>typeof gdjs.RuntimeGame),'function');
 const report={result:'PASS',runtime:process.env.PRIMAL_EXPECT_GDEVELOP?'GDevelop GDJS5.6.283':'standalone Chromium',...result,scope:'840 actual drawn NPC frames, complete directional/state inventory, registered native144 pivots, integer scales, fixed collisions, death series and mutation pause.',production_approved:false};if(process.env.PRIMAL_ENEMY_REPORT)fs.writeFileSync(process.env.PRIMAL_ENEMY_REPORT,JSON.stringify(report,null,2)+'\n');console.log('PASS: 840 actual enemy frames · seven species · six states · four directions · integer scales · pause');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
