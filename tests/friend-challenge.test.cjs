'use strict';
// FEATURES.seededRuns + FEATURES.friendChallenge: same seed gives the same levels and mutation offers, and a
// challenge link round-trips seed, species, score and ghost.
const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../PRIMAL_RUN_Game/src/core.js');

function offers(seed,noise){
  const g=new C.Game();g.start({seed});for(let i=0;i<noise;i++)g.random(); // combat luck consumed differently
  const out=[];for(let k=0;k<3;k++){g.addXP(g.run.nextXP);out.push(g.run.choices.join(','));if(g.phase==='mutation')g.choose(g.run.choices[0]);}
  for(let i=0;i<noise;i++)g.random();g.phase='cleared';g.nextStage();
  out.push(g.run.levelIndex+':'+g.run.enemies.map(e=>e.kind+Math.round(e.x)+','+Math.round(e.y)).join('|'));return out;
}

test('flags are on',()=>{assert.equal(C.FEATURES.seededRuns,true);assert.equal(C.FEATURES.friendChallenge,true);});

test('same seed gives the same offers and next level whatever random was used in between',()=>{
  assert.deepEqual(offers(99,0),offers(99,23));
  assert.notDeepEqual(offers(99,0),offers(100,0));
});

test('an injected random is left alone',()=>{
  let calls=0;const g=new C.Game({random:()=>{calls++;return .5;}});g.start({seed:5});
  assert.ok(calls>0);assert.equal(g.random()===.5,true);
});

test('the run records a ghost and the link round-trips',()=>{
  const g=new C.Game();g.save.name='Jonas æøå';g.start({seed:4242});
  for(let i=0;i<60*10;i++)g.step(1/60,{x:1,y:.3});
  assert.ok(g.run.ghostTrack.length>=19&&g.run.ghostTrack.length<=21,'2 samples a second: '+g.run.ghostTrack.length);
  g.finish(false);const code=C.encodeChallenge(g.run),d=C.decodeChallenge(code);
  assert.equal(d.seed,4242);assert.equal(d.species,g.run.species);assert.equal(d.score,g.run.result.score);assert.equal(d.name,'Jonas æøå');
  const last=g.run.ghostTrack.at(-1),p=C.ghostAt(d,0,(g.run.ghostTrack.length-1)/2);
  assert.ok(Math.abs(p.x-last[1])<=2&&Math.abs(p.y-last[2])<=2);
  assert.equal(C.ghostAt(d,0,9999),null);assert.equal(C.ghostAt(d,3,1),null);
});

test('bad links are rejected',()=>{
  for(const bad of ['', 'garbage', '!!!.AAAA', 'eyJ2IjoyfQ.'])assert.equal(C.decodeChallenge(bad),null);
  const g=new C.Game();g.start({seed:1});g.finish(false);const [head,track]=C.encodeChallenge(g.run).split('.');
  assert.equal(C.decodeChallenge(head+'.'+track+'AAAA'),null,'track bytes must come in whole samples');
});
