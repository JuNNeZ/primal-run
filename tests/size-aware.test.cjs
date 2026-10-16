'use strict';
// Størrelsesbevidst verden (FEATURES.sizeAware): kollision og slow følger sprite-størrelsen, ikke faste tal.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{execFileSync}=require('node:child_process');
const C=require('../PRIMAL_RUN_Game/src/core.js');
const PY=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
function run(flag,seed=7,stages=0){
  const previous=C.FEATURES.sizeAware;C.FEATURES.sizeAware=flag;
  try{const g=new C.Game({random:()=>.5});g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies('velociraptor');g.start({seed});
    for(let i=0;i<stages;i++){g.phase='cleared';g.run.bossDefeated=true;g.nextStage();}return g;}
  finally{C.FEATURES.sizeAware=previous;}
}
test('PROP_SIZE matches the sprite pixels (re-run tools/measure_props.py after new art)',()=>{
  execFileSync(PY,[path.join(__dirname,'../tools/measure_props.py'),'--check'],{stdio:'pipe'});
});
test('rocks collide at their drawn size and big boulders block movement',()=>{
  const off=run(false,7,4).run.map,on=run(true,7,4).run.map;
  assert.ok(off.rocks.every(r=>r.radius===22));
  const plain=on.rocks.filter(r=>!r.path),solid=on.rocks.filter(r=>r.path);
  assert.ok(plain.every(r=>r.radius===C.PROP_SIZE['assets/environment/rock.png'][1]));
  assert.ok(solid.length>100,'boulders became obstacles: '+solid.length);
  assert.ok(!on.decorations.some(d=>/boulder_large/.test(d.path)),'no walk-through boulders remain');
  assert.ok(solid.every(r=>Math.hypot(r.x-on.start.x,r.y-on.start.y)>=150),'the start stays free');
  const g=run(true,7,4),r=g.run,b=r.map.rocks.find(x=>x.path);r.enemies=[];g.move(r.player,b.x-r.player.x,b.y-r.player.y);
  assert.ok(Math.hypot(r.player.x-b.x,r.player.y-b.y)>=b.radius+r.player.radius-.01,'pushed out of the boulder');
});
test('bushes and tall plants slow by their size; a bigger animal pushes through easier',()=>{
  const g=run(true),r=g.run,soft=Object.keys(C.PROP_SIZE).filter(k=>C.PROP_SIZE[k][0]==='soft');
  const kinds=new Set(r.map.decorations.filter(d=>soft.includes(d.path)).map(d=>d.path.split('/').pop()));
  assert.ok(kinds.has('cycad.png')&&kinds.has('horsetail.png'),'tall plants count as cover: '+[...kinds]);
  const fern=r.map.cover[0];r.enemies=[];r.map.mud=[];r.map.ponds=[];
  const small={x:fern.x,y:fern.y,radius:4},big={x:fern.x,y:fern.y,radius:fern.radius+10};
  assert.equal(g.terrainAt(small).kind,'bush');assert.equal(g.terrainAt(small).speed,.9);assert.equal(g.terrainAt(big).speed,.95);
  assert.equal(C.coverAt(r.map,{x:fern.x+fern.radius+1,y:fern.y}),null,'outside the visible bush there is no slow');
});
test('flag off keeps the old fixed radii',()=>{
  const r=run(false).run;assert.ok(r.map.cover.every(c=>c.radius===34));assert.ok(r.map.decorations.some(d=>/fern_large/.test(d.path)));
});
