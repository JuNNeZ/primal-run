'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../PRIMAL_RUN_Game/src/core.js');
function fishing(){
  const g=new C.Game({random:()=>.5});g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies('baryonyx');g.start({seed:83});
  const r=g.run;r.enemies=[];r.spawnTimer=999;r.nextXP=9999;
  const f=r.map.fishSchools[0],pond=r.map.ponds.find(p=>p.id===f.pondId);r.player.x=f.x;r.player.y=f.y;
  return {g,r,f,pond};
}
test('all seeded lakes have varied natural outlines and finite repeatable catch plans',()=>{
  for(let stage=0;stage<4;stage++)for(const seed of [1,83,1993]){
    const m=C.createMap(stage,seed),again=C.createMap(stage,seed);assert.deepEqual(m.ponds,again.ponds);assert.deepEqual(m.fishSchools,again.fishSchools);
    assert.ok(new Set(m.ponds.map(p=>p.radius)).size>1);
    for(const p of m.ponds){assert.ok(p.natural);assert.ok(C.pondContains(p,p));assert.ok(!C.pondContains(p,{x:p.x+p.radius*1.3,y:p.y}));
      const edges=Array.from({length:16},(_,i)=>C.pondRadiusFactor(p,i*Math.PI/8));assert.ok(Math.max(...edges)-Math.min(...edges)>.15);
      const f=m.fishSchools.find(f=>f.pondId===p.id&&f.water==='pond');assert.ok(f.capacity>=16&&f.capacity<=18);assert.equal(f.stock,f.capacity);assert.ok(f.catchRarities.includes(3));
      assert.ok(C.isWater(stage,m,f,14));assert.ok(C.isDeepWater(stage,m,f));
    }
  }
});
test('rarity sets food per fish, mutation bonus applies once, and depleted lake never rewards again',()=>{
  const {g,r,f}=fishing();f.stock=f.capacity=4;f.catchRarities=[0,1,2,3];r.mutations.fisher=1;
  const expected=f.catchRarities.map(n=>Math.ceil(f.value*C.MEAT_RARITIES[n].multiplier)+1);
  for(let i=0;i<4;i++){const food=r.totalMeat;assert.equal(g.catchFish(f),1);assert.equal(r.totalMeat-food,expected[i]);const e=r.effects.at(-1);assert.equal(e.kind,'fishCatch');assert.equal(e.rarity,i);assert.equal(e.value,expected[i]);}
  assert.equal(f.stock,0);assert.equal(g.catchFish(f,3),0);assert.equal(r.stats.fishCaught,4);assert.equal(r.stats.food,expected.reduce((a,b)=>a+b,0));
});
test('shore fishing takes time and stamina, movement cancels, pause and choices freeze stock',()=>{
  const {g,r,f,pond}=fishing();r.player.x=pond.x; r.player.y=pond.y+(pond.radius*pond.aspect+15)*C.pondRadiusFactor(pond,Math.PI/2);
  assert.ok(!C.isWater(r.stage,r.map,r.player));g.eat(.6,{eat:true});assert.equal(f.stock,f.capacity);assert.ok(r.eating);
  g.eat(.7,{eat:true});assert.equal(f.stock,f.capacity-1);assert.equal(r.stamina,96);
  g.eat(.1,{eat:true,x:1});assert.equal(r.eating,null);
  for(const phase of ['paused','mutation']){g.phase=phase;const stock=f.stock;g.step(1,{eat:true});assert.equal(f.stock,stock);assert.equal(g.catchFish(f,2),0);}
  g.phase='playing';assert.equal(g.catchFish(f,NaN),0);assert.equal(g.catchFish(f,-2),0);assert.ok(Number.isFinite(f.stock));
});
test('burst fishing consumes only remaining fish and invalid or dry spots give no food',()=>{
  const {g,r,f}=fishing();f.stock=2;assert.equal(g.catchFish(f,3),2);assert.equal(g.catchFish({...f,stock:3}),0);
  f.stock=3;f.x+=1000;assert.equal(g.catchFish(f),0);assert.equal(f.stock,3);
  r.map.fishSchools=[];assert.equal(g.catchFish(f),0);
});
