'use strict';
// Fiskeminigame (FEATURES.fishingGame): hold F, release while the ring is green.
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../PRIMAL_RUN_Game/src/core.js');
C.FEATURES.randomStart=false;C.FEATURES.waterStart=false;
const F=C.FISH_GAME,STEP=.05;
function setup(){
  const g=new C.Game({random:()=>.5});g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies('baryonyx');g.start({seed:123});
  const r=g.run;r.enemies=[];r.spawnTimer=999;r.nextXP=9999;Object.assign(r.map,{rocks:[],mud:[],cover:[],sites:[],events:[],ponds:[{x:480,y:340,radius:72}]});
  const f={id:'fish:t',kind:'fish',x:480,y:340,stock:6,capacity:6,value:2,catchRarities:[0,0,0,0,0,0]};r.map.fishSchools=[f];r.player.x=480;r.player.y=340;
  return {g,r,f};
}
const hold=(g,until)=>{while(!g.run.fishGame||g.run.fishGame.progress<until-1e-9)g.step(STEP,{eat:true});};
test('flag is on and holding F alone never catches a fish',()=>{
  assert.equal(C.FEATURES.fishingGame,true);
  const {g,r,f}=setup();for(let i=0;i<200;i++)g.step(STEP,{eat:true});
  assert.equal(f.stock,6);assert.equal(r.totalMeat,0);assert.ok(r.stats.fishMissed>=1,'holding past the ring counts as a miss');
});
test('releasing inside the green window catches; the perfect band lifts the rarity',()=>{
  let {g,r,f}=setup();hold(g,F.hit[0]+.01);g.step(STEP,{});
  assert.equal(f.stock,5);assert.equal(r.totalMeat,2);assert.equal(r.effects.find(e=>e.kind==='fishCatch').rarity,0);
  ({g,r,f}=setup());hold(g,F.perfect[0]+.005);g.step(STEP,{});
  assert.equal(f.stock,5);const e=r.effects.find(e=>e.kind==='fishCatch');assert.equal(e.rarity,1);assert.equal(r.totalMeat,Math.ceil(2*C.MEAT_RARITIES[1].multiplier));
  assert.ok(r.effects.some(e=>e.text==='PERFEKT'));assert.equal(r.stats.fishPerfect,1);
});
test('an early release misses, costs stamina and spooks the school',()=>{
  const {g,r,f}=setup();hold(g,.4);const stamina=r.stamina;g.step(STEP,{});
  assert.equal(f.stock,6);assert.equal(r.totalMeat,0);assert.equal(r.stamina,stamina-F.stamina);assert.ok(f.scaredUntil>r.seconds);
  for(let i=0;i<20;i++)g.step(STEP,{eat:true});assert.equal(r.fishGame,null,'no ring while the school is spooked');
  r.seconds=f.scaredUntil;g.step(STEP,{eat:true});assert.ok(r.fishGame);
});
test('a quick tap or moving away cancels without a strike',()=>{
  const {g,r,f}=setup();g.step(STEP,{eat:true});const stamina=r.stamina;g.step(STEP,{});
  assert.equal(r.fishGame,null);assert.equal(r.stamina,stamina);assert.ok(!f.scaredUntil);
  hold(g,.5);g.step(STEP,{eat:true,x:1});assert.equal(r.fishGame,null);assert.ok(!f.scaredUntil);assert.equal(f.stock,6);
});
test('stamina limits the pace: an empty bar cannot start a ring',()=>{
  const {g,r}=setup();r.stamina=F.stamina-1;r.staminaDelay=99;g.step(STEP,{eat:true});assert.ok(!r.fishGame);
});
test('maps hold fewer, smaller fish but still enough food to finish a stage',()=>{
  for(let stage=0;stage<4;stage++)for(const seed of [1,83,1993]){
    const m=C.createMap(stage,seed);
    for(const f of m.fishSchools){assert.ok(f.stock<=F.pondStock);assert.equal(f.value,F.value(stage));}
    assert.ok(m.fishSchools.reduce((n,p)=>n+p.stock*p.value,0)>=C.STAGES[stage].target);
  }
});
// "Vis tips og råd" (FEATURES.tipsToggle): on by default, survives saves, and can be switched off.
test('tips setting defaults on, sanitizes and toggles',()=>{
  assert.equal(C.FEATURES.tipsToggle,true);
  assert.equal(C.sanitizeSave({}).settings.tips,true);assert.equal(C.sanitizeSave({settings:{tips:false}}).settings.tips,false);
  const {g}=setup();g.setSetting('tips',false);assert.equal(g.save.settings.tips,false);g.setSetting('tips',true);assert.equal(g.save.settings.tips,true);
});
