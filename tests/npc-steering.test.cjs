'use strict';
// NPC-styring (FEATURES.npcSteering): dyr går uden om sten i stedet for at presse sig fast, skifter ikke side frame for
// frame, vagter står roligt hjemme, og ingen ikke-svømmer starter midt i en dam.
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../PRIMAL_RUN_Game/src/core.js');
function setup(){
  const g=new C.Game({random:()=>.5});g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies('velociraptor');g.start({seed:24});
  const r=g.run;r.enemies=[];r.pickups=[];r.corpses=[];r.spawnTimer=999;r.map.rocks=[];r.map.events=[];r.map.sites=[];r.map.ponds=[];r.map.fishSchools=[];r.raptors=[];
  return g;
}
// Walk straight at a target that sits right behind a rock, re-aiming every frame like the chase code does.
function walkBehindRock(flag){
  const g=setup(),r=g.run,previous=C.FEATURES.npcSteering;C.FEATURES.npcSteering=flag;
  try{
    r.map.rocks=[{x:1500,y:1100,radius:22}];const e=g.spawn('carnotaurus',{x:1400,y:1100});e.mode='chase';
    const target={x:1600,y:1100},sides=new Set();let t=0;
    for(;t<6&&Math.hypot(target.x-e.x,target.y-e.y)>12;t+=1/30){const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy);g.travel(e,dx/d*e.speed/30,dy/d*e.speed/30);if(e.rockSide)sides.add(e.rockSide);}
    return {t,left:Math.hypot(target.x-e.x,target.y-e.y),sides,e};
  }finally{C.FEATURES.npcSteering=previous;}
}
test('a rock straight between an animal and its goal is walked around, on one committed side',()=>{
  const before=walkBehindRock(false);assert.ok(before.left>60,'without steering it presses into the rock: '+before.left);
  const after=walkBehindRock(true);assert.ok(after.left<=12,'reaches the far side: '+after.left);
  assert.ok(after.t<200/after.e.speed*1.4,'in a direct detour, not a long shuffle: '+after.t+' s at '+after.e.speed+' px/s');assert.equal(after.sides.size,1,'never swaps sides mid-detour');
});
test('charges still run straight into rocks (skids and stuck horns stay a mechanic)',()=>{
  const g=setup(),r=g.run;r.map.rocks=[{x:1500,y:1100,radius:22}];const e=g.spawn('carnotaurus',{x:1440,y:1100});e.mode='charge';
  g.travel(e,8,0);assert.equal(e.y,1100);assert.equal(e.rockSide,undefined);
});
test('a nest guard at home stands still instead of flipping between return and wander',()=>{
  const g=setup(),r=g.run,e=g.spawn('carnotaurus',{x:2400,y:1600});e.guard=true;e.homeX=e.x;e.homeY=e.y;e.alert=false;e.mode='return';
  r.player.x=600;r.player.y=400;const modes=[];
  for(let i=0;i<90;i++){g.enemyStep(e,1/30);modes.push(e.mode);}
  const flips=modes.filter((m,i)=>i&&m!==modes[i-1]).length;assert.ok(flips<=1,modes.join(','));
});
test('herd mates crowding one home point stop returning instead of walking in place',()=>{
  const g=setup(),r=g.run;r.player.x=600;r.player.y=400;
  const herd=[0,1,2,3,4].map(i=>{const e=g.spawn('parasaurolophus',{x:2000+i*40,y:1500});e.homeX=2100;e.homeY=1300;return e;});
  for(const e of herd)g.disengage(e);
  for(let i=0;i<30*12;i++){for(const e of herd)if(e.mode==='return')g.returnHome(e,1/30);g.separateDinosaurs();}
  assert.ok(herd.every(e=>e.mode!=='return'),herd.map(e=>e.mode+':'+Math.round(Math.hypot(e.homeX-e.x,e.homeY-e.y))).join(' '));
});
test('no non-swimming animal starts a level inside a pond',()=>{
  for(let seed=1;seed<=40;seed++){
    const g=new C.Game({random:()=>.5});g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies('velociraptor');g.start({seed});
    const r=g.run;for(const e of r.enemies)if(!['deinosuchus','baryonyx','spinosaurus','archelon'].includes(e.kind)&&e.radius<28)
      assert.notEqual(g.terrainAt(e).kind,'deep',`seed ${seed}: ${e.kind} at ${Math.round(e.x)},${Math.round(e.y)}`);
  }
});
