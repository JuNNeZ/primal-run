'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../PRIMAL_RUN_Game/src/core.js'),G=path.resolve(__dirname,'../PRIMAL_RUN_Game');
test('ecology poses use the paused natural clock and leave attacks/death untouched',()=>{
 const expected=(state,f)=>`assets/behavior/triceratops_${state}_S_00${f}.png`;
 assert.equal(C.behaviorFrame('triceratops','idle','S',0,100,100,'graze',0),expected('graze',0));
 assert.equal(C.behaviorFrame('triceratops','idle','S',0,100,100,'drink',1),expected('drink',1));
 assert.equal(C.behaviorFrame('triceratops','idle','S',0,100,100,'rest',12.8),expected('sleep',1));
 assert.equal(C.behaviorFrame('triceratops','idle','S',0,100,100,'scratch',12.8),expected('scratch',1));
 assert.equal(C.behaviorFrame('triceratops','idle','S',0,100,100,'rest',9),expected('scratch',1));
 for(const state of ['attack','death','hurt'])assert.equal(C.behaviorFrame('triceratops',state,'S',3,1,100,'graze',1),null);
 C.FEATURES.ecologyAnimations=false;try{assert.equal(C.behaviorFrame('triceratops','idle','S',0,100,100,'graze',1),null);}finally{C.FEATURES.ecologyAnimations=true;}
});
test('drawn injured poses are quarantined; six original poses remain byte-identical fallbacks',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(G,'behavior_manifest.json'))),injured=manifest.filter(e=>e.state==='limp');
 assert.equal(injured.length,13*4*6);assert.ok(injured.every(e=>e.runtime_enabled===false));
 assert.equal(injured.filter(e=>e.reused_from).length,13*4*4);
 for(const e of injured.filter(e=>e.reused_from))assert.deepEqual(fs.readFileSync(path.join(G,e.file)),fs.readFileSync(path.join(G,e.reused_from)));
 assert.equal(C.behaviorFrame('compy','walk','N',2,30,100),null);assert.match(C.behaviorFrame('compy','walk','N',2,29,100),/compy_limp_N_002/);
 for(const flag of ['injuredPoses','limpAnimation']){const previous=C.FEATURES[flag];C.FEATURES[flag]=false;try{assert.equal(C.behaviorFrame('compy','walk','N',2,29,100),null);}finally{C.FEATURES[flag]=previous;}}
});
test('raptor decomposition has two distinct poses for every stage and direction',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(G,'corpse_manifest.json')));
 for(const s of ['utahraptor','velociraptor'])for(const stage of ['decayed','skeleton'])for(const d of ['S','N','E','W']){
  const a=m.filter(e=>e.species===s&&e.stage===stage&&e.direction===d);assert.equal(a.length,2);assert.equal(new Set(a.map(e=>e.export_sha256)).size,2);
 }
});
