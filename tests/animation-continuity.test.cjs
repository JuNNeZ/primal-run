'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../PRIMAL_RUN_Game/src/core.js');
function fixture(mode){const g=new C.Game();g.start({seed:42});const r=g.run;r.enemies=[];
 const a={id:1,ally:true,mode,x:0,y:0,hp:mode==='flee'?10:30,maxHP:30,radius:12,cooldown:0,walk:0,moving:false,facingX:1,facingY:0};r.raptors=[a];
 g.packTarget=()=>null;g.travel=actor=>{actor.x+=1;};return {g,r,a};}
test('pack walking and fleeing use the same 8/12fps six-pose phase as other actors',()=>{
 for(const [mode,expected]of [['follow',1/3],['flee',.5]]){const {g,a}=fixture(mode);for(let n=0;n<15;n++)g.stepRaptors(1/60);
  assert.ok(Math.abs(a.gaitPhase-expected)<1e-12,mode+' gait timing');
  const phase=a.gaitPhase;g.travel=()=>{};g.stepRaptors(1/60);assert.equal(a.gaitPhase,phase,'stationary feet stop');
 }
});
test('pack foot phase survives mode changes and freezes with a paused world',()=>{
 const {g,r,a}=fixture('follow');g.stepRaptors(.1);const walkPhase=a.gaitPhase;a.mode='flee';a.hp=10;g.stepRaptors(.05);
 assert.ok(Math.abs(a.gaitPhase-walkPhase-.1)<1e-12,'entering run keeps previous foot phase');
 g.pause();const frozen=JSON.stringify(r);g.step(.1,{x:1,pounce:true});assert.equal(JSON.stringify(r),frozen);
});
