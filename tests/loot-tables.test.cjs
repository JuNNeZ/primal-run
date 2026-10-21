'use strict';
// FEATURES.lootTables: loot.js engine and the meat roll moved out of kill() with the exact same distribution.
const {test}=require('node:test'),assert=require('node:assert/strict'),L=require('../PRIMAL_RUN_Game/src/loot.js'),C=require('../PRIMAL_RUN_Game/src/core.js');
const close=(a,b,eps)=>assert.ok(Math.abs(a-b)<=eps,a+' vs '+b);

test('lootTables is off by default',()=>{assert.equal(C.FEATURES.lootTables,false);});

test('top-down meat cascades reproduce the old kill() thresholds exactly, with and without the elite floor',()=>{
  for(const t of Object.values(L.MEAT_THRESHOLDS)){
    const old=[t[0],t[1]-t[0],t[2]-t[1],1-t[2]],d=L.rarityDistribution(L.cascadeFromThresholds(t));
    ['common','uncommon','rare','epic'].forEach((k,i)=>close(d[k],old[i],1e-12));assert.equal(d.legendary,0);
    const f=L.rarityDistribution({...L.cascadeFromThresholds(t),floor:'rare'});
    close(f.rare,t[2],1e-12);close(f.epic,1-t[2],1e-12);assert.equal(f.common+f.uncommon,0);
  }
});

test('kill_meat picks the cascade by meat size and the simulated rolls match the exact shares',()=>{
  const loot=L.makeLoot(L.GAME_TABLES),rng=L.seeded(1993),n=100000;
  for(const [size,t] of [[1,L.MEAT_THRESHOLDS.small],[3,L.MEAT_THRESHOLDS.large],[2,L.MEAT_THRESHOLDS.other],[5,L.MEAT_THRESHOLDS.other]]){
    const c=[0,0,0,0,0];for(let i=0;i<n;i++){const d=loot.roll('kill_meat',{meatSize:size},rng);assert.equal(d.length,1);assert.equal(d[0].id,'meat');c[d[0].rarity]++;}
    const old=[t[0],t[1]-t[0],t[2]-t[1],1-t[2],0];old.forEach((p,i)=>close(c[i]/n,p,.006));
  }
});

test('engine guards: unknown condition and table throw, nesting is depth-limited',()=>{
  assert.throws(()=>L.makeLoot({a:{pools:[{entries:[{id:'x',when:{nope:1}}]}]}}).roll('a',{},L.seeded(1)),/Ukendt loot-condition/);
  assert.throws(()=>L.makeLoot({}).roll('missing',{},L.seeded(1)),/Ukendt loot-tabel/);
  assert.throws(()=>L.makeLoot({a:{pools:[{entries:[{type:'table',ref:'a'}]}]}}).roll('a',{},L.seeded(1)),/for dyb/);
});

function killRun(on,seed){
  const was=C.FEATURES.lootTables;C.FEATURES.lootTables=on;
  try{
    let x=seed>>>0;const g=new C.Game({random:()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;}});
    g.start({seed});g.run.enemies=[];g.run.spawnTimer=999;const r=g.run,meat=[];
    for(let i=0;i<300;i++){const e=g.spawn(['compy','gallimimus','carnotaurus'][i%3],{x:r.player.x+200,y:r.player.y});if(i%50===7)e.elite=true;r.pickups=[];g.kill(e);g.kill(e);
      meat.push(r.pickups.filter(p=>p.kind==='meat').map(p=>p.rarity));if(g.phase!=='playing'){g.choose(r.choices[0]);}}
    return {meat,next:g.random(),kills:r.kills,eliteKills:r.eliteKills,dna:r.dna};
  }finally{C.FEATURES.lootTables=was;}
}

test('flag on: kill() rewards once, elites keep the rare floor, and the main random stream is untouched',()=>{
  const off=killRun(false,4242),on=killRun(true,4242);
  assert.equal(on.kills,300);assert.ok(on.meat.every(m=>m.length===1),'exactly one meat drop per kill despite the double kill() call');
  on.meat.forEach((m,i)=>{if(i%50===7)assert.ok(m[0]>=2,'elite meat is at least Sjældent');});
  assert.equal(on.next,off.next,'the main stream advanced exactly as with the flag off');
  assert.equal(on.eliteKills,off.eliteKills);assert.equal(on.dna,off.dna);
  assert.deepEqual(killRun(true,4242).meat,on.meat,'loot stream is seeded from the run seed');
});
