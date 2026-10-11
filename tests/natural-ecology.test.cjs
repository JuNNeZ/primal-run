'use strict';
// Naturlig økologi: NPC-mod-NPC jagt og forsvar, ådsel-lugt, store arter der kun æder i sikkerhed,
// kamp til døden kun over et rådnet ådsel, og Baryonyx der fisker stående i stedet for at skøjte.
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../PRIMAL_RUN_Game/src/core.js');
function setup(species='compy'){
  const g=new C.Game({random:()=>.5});g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies(species);g.start({seed:24});
  const r=g.run;r.enemies=[];r.pickups=[];r.corpses=[];r.spawnTimer=999;r.map.rocks=[];r.map.events=[];r.map.sites=[];r.map.ponds=[];r.map.fishSchools=[];r.raptors=[];
  return g;
}
const calm=e=>{e.alert=false;e.mode='roam';e.activity='roam';return e;};
const run=(g,seconds,until=()=>false)=>{for(let t=0;t<seconds&&g.phase==='playing';t+=1/30){g.step(1/30,{});if(until())return true;}return until();};
const food=(r,id)=>r.pickups.filter(p=>p.corpseId===id).reduce((n,p)=>n+p.value,0);

test('a hungry predator hunts with real windup and bite, the kill leaves an unrewarded natural corpse',()=>{
  const g=setup(),r=g.run,carno=calm(g.spawn('carnotaurus',{x:1500,y:1100})),para=calm(g.spawn('parasaurolophus',{x:1640,y:1100}));carno.hunger=1;
  const modes=new Set();
  assert.ok(run(g,40,()=>{modes.add(carno.mode);return !r.enemies.includes(para);}),'the hunt ends in a kill');
  assert.ok(modes.has('windup')&&modes.has('bite'),'same attack modes the renderer animates');
  assert.ok(!modes.has('charge'));
  assert.ok(r.corpses.some(c=>c.id===para.id),'corpse stays');assert.equal(r.kills,0);assert.equal(r.totalMeat,0);
  assert.equal(carno.huntTarget,null);
});

test('armed herbivores fight back, unarmed ones run, and the herd reacts',()=>{
  const g=setup(),carno=calm(g.spawn('tyrannosaurus',{x:1500,y:1100})),trike=calm(g.spawn('triceratops',{x:1580,y:1100}));
  carno.hunger=1;const hp=carno.hp;g.huntPrey(carno,trike,1/30);
  assert.ok(run(g,15,()=>carno.hp<hp),'the healthy triceratops fights back');
  assert.equal(trike.huntTarget,carno.id);
  const g2=setup(),r2=g2.run,c2=calm(g2.spawn('carnotaurus',{x:1500,y:1100})),para=calm(g2.spawn('parasaurolophus',{x:1560,y:1100})),mate=calm(g2.spawn('parasaurolophus',{x:1600,y:1160}));
  c2.hunger=1;g2.npcBite(c2,para);assert.equal(para.npcAttacker,c2.id);assert.equal(mate.npcFleeFrom.id,c2.id);
  const before=Math.hypot(para.x-c2.x,para.y-c2.y);g2.ecologyAI(para,.2,r2.player.x-para.x,r2.player.y-para.y,1000);assert.ok(Math.hypot(para.x-c2.x,para.y-c2.y)>before,'unarmed prey flees');
});

test('predators only pick fights they can win and never across lava or deep water',()=>{
  const g=setup(),r=g.run,carno=calm(g.spawn('carnotaurus',{x:1500,y:1100})),anky=calm(g.spawn('ankylosaurus',{x:1600,y:1100}));carno.hunger=1;
  assert.equal(g.findPrey(carno),null,'healthy armour is no prey for a carnotaurus');
  const rex=calm(g.spawn('tyrannosaurus',{x:1500,y:1250}));rex.preyScanAt=undefined;assert.equal(g.findPrey(rex),anky,'only T. rex tries');
  carno.preyScanAt=undefined;const albino=calm(g.spawn('parasaurolophus',{x:1450,y:1100}));albino.rare=true;assert.notEqual(g.findPrey(carno),albino,'albinos stay a player reward');
  assert.equal(r.enemies.filter(e=>e.boss).length,0);
});

test('your attack comes first: provoking a fighting animal ends its NPC fight',()=>{
  const g=setup(),carno=calm(g.spawn('carnotaurus',{x:1500,y:1100})),para=calm(g.spawn('parasaurolophus',{x:1560,y:1100}));carno.hunger=1;
  g.huntPrey(carno,para,1/30);assert.equal(carno.huntTarget,para.id);g.provoke(carno);assert.equal(carno.huntTarget,null);assert.equal(carno.hunting,false);
});

test('carrion smell grows with hunger and predators skip food that rots before they arrive',()=>{
  const g=setup(),r=g.run,prey=g.spawn('parasaurolophus',{x:2400,y:1100});g.kill(prey);r.enemies=[];
  const carno=calm(g.spawn('carnotaurus',{x:1500,y:1100}));carno.hunger=.2;
  assert.equal(g.carrionTarget(carno),null,'900 px is too far for a fed animal');
  carno.hunger=1;assert.equal(g.carrionTarget(carno).id,prey.id,'a starving one smells it');
  r.corpses[0].age=12;assert.equal(g.carrionTarget(carno),null,'it would only find bones');
  r.corpses[0].age=0;const x=carno.x;g.scavenge(carno,.1);assert.ok(carno.x>x&&carno.x-x<=carno.speed*C.NATURE.trot*.1+.01,'trots at most 65 %');
});

test('large carnivores wait while you are near the corpse and eat once you leave',()=>{
  const g=setup(),r=g.run,prey=g.spawn('parasaurolophus',{x:1500,y:1100});g.kill(prey);r.enemies=[];
  const carno=calm(g.spawn('carnotaurus',{x:1500,y:1600}));carno.hunger=1;r.player.x=1600;r.player.y=1100;
  const meat=food(r,prey.id);for(let i=0;i<120;i++)g.scavenge(carno,1/30);
  assert.equal(carno.mode,'watch');assert.equal(food(r,prey.id),meat);assert.ok(Math.hypot(carno.x-1500,carno.y-1100)>C.NATURE.safeRadius);
  r.hidden=true;g.scavenge(carno,1/30);assert.notEqual(carno.mode,'watch','hidden in a bush you can ambush them');r.hidden=false;
  r.player.x=480;r.player.y=340;carno.x=1500;carno.y=1120;carno.mode='scavenge';g.scavenge(carno,2.01);assert.equal(food(r,prey.id),meat-1);
});

test('rivals: the higher-ranked eats, the other waits; a clearly stronger one drives it off',()=>{
  const g=setup(),r=g.run,prey=g.spawn('parasaurolophus',{x:1500,y:1100});g.kill(prey);r.enemies=[];
  const a=calm(g.spawn('carnotaurus',{x:1500,y:1120})),b=calm(g.spawn('carnotaurus',{x:1500,y:1300}));a.hunger=b.hunger=1;a.mode='scavenge';b.hp=a.hp*.9;
  g.scavenge(a,1/30);assert.equal(a.mode,'scavenge');g.scavenge(b,1/30);assert.equal(b.mode,'watch');assert.equal(b.carrionRival,a.id);
  const rex=calm(g.spawn('tyrannosaurus',{x:1500,y:1180}));rex.hunger=1;g.scavenge(rex,1/30);
  assert.equal(a.npcFleeFrom.id,rex.id);assert.equal(a.carrionBan.id,prey.id);assert.equal(g.carrionTarget(a),null);
});

test('a fight to the death only when the awaited corpse rotted and the waiting predator is starving',()=>{
  const scene=(rot,hunger)=>{
    const g=setup(),r=g.run,prey=g.spawn('parasaurolophus',{x:1500,y:1100});g.kill(prey);r.enemies=[];
    const a=calm(g.spawn('carnotaurus',{x:1500,y:1120})),b=calm(g.spawn('carnotaurus',{x:1500,y:1450}));a.hunger=.6;b.hunger=hunger;a.mode='scavenge';b.hp=a.hp*.9;
    g.scavenge(a,1/30);g.scavenge(b,1/30);assert.equal(b.waitCorpse,prey.id);
    if(rot)g.decayCorpses(30);else r.pickups=r.pickups.filter(p=>p.corpseId!==prey.id);
    g.ecologyAI(b,1/30,r.player.x-b.x,r.player.y-b.y,1500);return {a,b};
  };
  let {a,b}=scene(true,1);assert.equal(b.deathFight,true);assert.equal(b.huntTarget,a.id);assert.equal(a.npcAttacker,b.id);
  ({b}=scene(false,1));assert.ok(!b.deathFight,'eaten, not rotted: withdraws');assert.ok(['return','wander'].includes(b.mode));assert.equal(b.huntTarget??null,null);
  ({b}=scene(true,.7));assert.ok(!b.deathFight,'not starving: withdraws');
});

test('Baryonyx fishes standing at the school instead of charging across the water',()=>{
  const g=setup(),r=g.run,school={id:'fish:t',kind:'fish',x:1700,y:1100,stock:3,value:2};
  r.map.ponds=[{x:1700,y:1100,radius:72}];r.map.fishSchools=[school];
  const bary=calm(g.spawn('baryonyx',{x:1450,y:1100}));bary.hunger=1;bary.skillCooldown=0;bary.stamina=100;
  const modes=new Set();let fastest=0,last={x:bary.x,y:bary.y};
  run(g,25,()=>{modes.add(bary.mode);fastest=Math.max(fastest,Math.hypot(bary.x-last.x,bary.y-last.y)*30);last={x:bary.x,y:bary.y};return school.stock<=1;});
  assert.ok(school.stock<=1,'it catches fish');assert.ok(modes.has('fish')&&modes.has('fishstrike'));
  assert.ok(!modes.has('charge')&&!modes.has('windup'),'no species charge for fishing');
  assert.ok(fastest<=bary.speed*1.1+1,'walks, never skates');
  assert.equal(r.stats.fishCaught,0,'no player reward');
});

test('grid neighbour search matches a brute-force search',()=>{
  const g=setup(),r=g.run;for(let i=0;i<60;i++)g.spawn(i%2?'compy':'parasaurolophus',{x:200+(i*137)%3000,y:200+(i*251)%2000});
  for(const [x,y,rad] of [[1000,800,300],[2500,1500,600],[50,50,256]]){
    const brute=r.enemies.filter(e=>Math.hypot(e.x-x,e.y-y)<=rad).map(e=>e.id).sort(),grid=g.nearbyAnimals(x,y,rad).map(e=>e.id).sort();
    assert.deepEqual(grid,brute);
  }
});

test('with the flag off the old hunt rules apply',()=>{
  C.FEATURES.naturalEcology=false;
  try{const g=setup(),carno=calm(g.spawn('carnotaurus',{x:1500,y:1100})),trike=calm(g.spawn('triceratops',{x:1560,y:1100}));trike.hp=1;assert.equal(g.findPrey(carno),null);}
  finally{C.FEATURES.naturalEcology=true;}
});
