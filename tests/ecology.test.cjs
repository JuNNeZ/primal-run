'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../PRIMAL_RUN_Game/src/core.js');
test('all naturally populated animals and nest guardians match the biome and local shore/lava habitat across seeds',()=>{
 for(let seed=0;seed<32;seed++)for(let stage=0;stage<4;stage++){
  const g=new C.Game({random:()=>.3});g.start({seed});const r=g.run;r.stage=stage;r.map=C.createMap(stage,seed);
  r.enemies=[];g.populate();
  for(const e of r.enemies)assert.ok(C.suitableHabitat(stage,r.map,e.kind,e),`${stage}/${seed}: ${e.kind} at ${e.x},${e.y}`);
  assert.ok(r.enemies.some(e=>e.kind==='parasaurolophus'&&!e.damage));
  if(stage!==1)assert.ok(r.enemies.every(e=>e.kind!=='deinosuchus'));
 }
});
test('offscreen reinforcements respect species habitats and an aquatic boss can use a remote riverbank',()=>{
 for(let stage=0;stage<4;stage++)for(let seed=0;seed<12;seed++){
  const g=new C.Game({random:()=>.4});g.start({seed});const r=g.run;r.stage=stage;r.map=C.createMap(stage,seed);g.setView(960,640);
  for(const kind of new Set([...C.BIOMES[stage].animals,C.STAGES[stage].boss])){
   const p=g.hiddenSpawn(kind);if(!p)continue;
   assert.ok(C.suitableHabitat(stage,r.map,kind,p));const v=r.view;
   assert.ok(p.x<v.x-128||p.x>v.x+v.width+128||p.y<v.y-128||p.y>v.y+v.height+128);
   assert.ok(!r.map.rocks.some(rock=>Math.hypot(p.x-rock.x,p.y-rock.y)<65));
  }
  if(stage===1)assert.ok(g.hiddenSpawn('deinosuchus'),'river boss has a bank habitat');
 }
});
test('plants and ambient insects follow biome pools, are deterministic, and avoid lava',()=>{
 for(let stage=0;stage<4;stage++)for(let seed=0;seed<12;seed++){
  const map=C.createMap(stage,seed),ecology=map.decorations.filter(d=>d.ecology);
  assert.ok(ecology.length>200);assert.ok(new Set(ecology.map(d=>d.path)).size>=4);
  for(const d of ecology)assert.ok(C.BIOMES[stage].plants.includes(d.path.split('/').pop().replace('.png','')));
  for(const insect of map.ambience){assert.ok(C.BIOMES[stage].insects.includes(insect.kind));if(insect.kind==='dragonfly')assert.ok(C.riverDistance(map,insect)<=100);}
  if(stage===3){assert.ok(ecology.every(d=>C.riverDistance(map,d)>=145));assert.ok(map.ambience.every(d=>C.riverDistance(map,d)>=145));}
  assert.deepEqual(map.ambience,C.createMap(stage,seed).ambience);
 }
});
test('species display ramps use only the fixed palette and retain different identities and stable torso sizes',()=>{
 const palette=new Set(require('../PRIMAL_RUN_Game/palette.json').colors.map(c=>c.slice(1)));
 const signatures=[];
 for(const [id,mapping]of Object.entries(C.SPECIES_COLORS)){for(const c of Object.values(mapping))assert.ok(palette.has(c));if(C.PLAYER_SPECIES[id]){signatures.push(JSON.stringify(mapping));if(C.SPECIES[id])assert.equal(C.PLAYER_SPECIES[id].radius,C.SPECIES[id].radius);}}
 assert.equal(new Set(signatures).size,4);
 const g=new C.Game();g.start({seed:2});const regular=g.spawn('carnotaurus',{x:900,y:900}),boss=g.spawn('carnotaurus',{x:1100,y:900},true);
 assert.equal(regular.visualScale,1);assert.equal(boss.visualScale,2);assert.equal(boss.radius,regular.radius*2);
});
