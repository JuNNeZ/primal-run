'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../PRIMAL_RUN_Game/src/core.js');
test('Ankylosaurus overlay reuses all 24 native tail swings without changing source pixels',()=>{
 const root=path.resolve(__dirname,'../PRIMAL_RUN_Game'),manifest=JSON.parse(fs.readFileSync(path.join(root,'species_attack_manifest.json')));
 const entries=manifest.filter(e=>e.species==='ankylosaurus');assert.equal(entries.length,24);
 for(const e of entries){assert.equal(e.reused_from,`assets/player_full/ankylosaurus_attack_${e.direction}_${String(e.frame).padStart(3,'0')}.png`);assert.deepEqual(fs.readFileSync(path.join(root,e.file)),fs.readFileSync(path.join(root,e.reused_from)));assert.equal(e.contact_frame,3);assert.deepEqual(e.origin,[72,72]);}
});
test('limp timing retains all six poses in order, triggers below 30% and restores the normal gait',()=>{
 const normal=[],wounded=[];for(let i=0;i<240;i++){normal.push(C.locomotionFrame((i+.1)/240,30,100));wounded.push(C.locomotionFrame((i+.1)/240,29,100));}
 assert.deepEqual([...new Set(wounded)],[0,1,2,3,4,5]);assert.equal(normal.filter(x=>x===2).length,40);assert.equal(wounded.filter(x=>x===2).length,90);
 assert.equal(C.locomotionFrame(.7,29,100),3);assert.equal(C.locomotionFrame(.7,30,100),4);assert.equal(C.locomotionFrame(1.7,29,100),3);
 C.FEATURES.limpAnimation=false;try{assert.equal(C.locomotionFrame(.7,1,100),4);}finally{C.FEATURES.limpAnimation=true;}
});
