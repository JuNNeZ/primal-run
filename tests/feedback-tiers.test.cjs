'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../PRIMAL_RUN_Game/src/core.js');
function setup(on){C.FEATURES.feedbackTiers=on;const g=new C.Game({random:()=>.9});g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies('compy');g.start({seed:33});Object.assign(g.run,{enemies:[],spawnTimer:999,particles:[],hitStop:0,shake:0});return g;}
function killed(on,opts){const g=setup(on),e=g.spawn(opts.kind||'compy',{x:600,y:340},!!opts.boss);Object.assign(e,opts.extra||{});g.kill(e);return g.run;}

test('feedbackTiers off leaves kills without extra hit-stop, shake or particles',()=>{
  const r=killed(false,{kind:'compy'});
  assert.equal(r.hitStop,0);assert.equal(r.shake,0);assert.equal(r.particles.length,0);assert.ok(!r.feedbackFlash);
});

test('feedbackTiers scales kill feedback by importance: normal < elite < boss',()=>{
  const normal=killed(true,{kind:'compy'}),elite=killed(true,{kind:'compy',extra:{elite:true}}),boss=killed(true,{kind:'tyrannosaurus',boss:true});
  assert.equal(normal.hitStop,C.FEEDBACK_TIERS.medium.hitStop);assert.equal(elite.hitStop,C.FEEDBACK_TIERS.large.hitStop);assert.equal(boss.hitStop,C.FEEDBACK_TIERS.huge.hitStop);
  assert.ok(normal.shake<elite.shake&&elite.shake<boss.shake);
  assert.ok(normal.particles.length<elite.particles.length&&elite.particles.length<boss.particles.length);
  assert.ok(boss.feedbackFlash>0);assert.ok(!normal.feedbackFlash);
});

test('feedbackTiers flash and shake decay back to rest',()=>{
  const g=setup(true);g.feedback('huge',600,340,1);assert.ok(g.run.feedbackFlash>0);
  for(let i=0;i<120&&g.phase==='playing';i++)g.step(1/60,{});
  assert.equal(g.run.feedbackFlash,0);assert.equal(g.run.shake,0);assert.equal(g.run.hitStop,0);
});

test.after(()=>{C.FEATURES.feedbackTiers=false;});
