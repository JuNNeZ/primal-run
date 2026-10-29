'use strict';
// FEATURES.inputBuffer + attackReadyCue: a tap during the cooldown or hit-stop still bites, a stale tap does not,
// and the game says once when the bite is ready again (the click only for slow bites).
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../PRIMAL_RUN_Game/src/core.js');
function run(species='velociraptor'){const g=new C.Game({random:()=>.5});g.save.selectedSpecies=species;g.start({seed:5});g.run.enemies=[];g.drainEvents();return g;}
const tick=(g,attack=false)=>g.step(1/60,{attack});
function bites(g,seconds){let n=0;for(let i=0;i<Math.round(seconds*60);i++){const a=g.run.stats.attacks;tick(g);n+=g.run.stats.attacks-a;}return n;}
function tapDuringCooldown(on,before){
  const flag=C.FEATURES.inputBuffer;C.FEATURES.inputBuffer=on;try{
    const g=run();tick(g,true);tick(g);assert.equal(g.run.stats.attacks,1,'first bite');
    while(g.run.attackCooldown>before)tick(g);
    tick(g,true);return bites(g,.5);
  }finally{C.FEATURES.inputBuffer=flag;}
}
test('the flags are on and the buffer is 0.25 s',()=>{assert.equal(C.FEATURES.inputBuffer,true);assert.equal(C.FEATURES.attackReadyCue,true);assert.equal(C.INPUT.buffer,.25);});
test('a one-frame tap 0.2 s before the cooldown ends bites when it ends; without the buffer it is lost',()=>{
  assert.equal(tapDuringCooldown(true,.2),1);assert.equal(tapDuringCooldown(false,.2),0);
});
test('a tap longer ago than the buffer is not remembered',()=>{assert.equal(tapDuringCooldown(true,.4),0);});
test('holding the key bites once per cooldown, as before',()=>{
  const g=run(),cd=g.run.attackCooldown;let n=0;for(let i=0;i<120;i++){const a=g.run.stats.attacks;tick(g,true);n+=g.run.stats.attacks-a;}
  assert.ok(n>=2&&n<=4,'held for 2 s: '+n);
});
test('a tap during hit-stop is kept until the hit-stop ends',()=>{
  const g=run();g.run.hitStop=.08;tick(g,true);assert.equal(g.run.stats.attacks,0,'frozen');assert.equal(bites(g,.2),1);
});
test('the ready cue fires once per cooldown, never when a buffered bite follows, and clicks only for slow bites',()=>{
  const ready=g=>g.drainEvents().filter(e=>e.type==='attack_ready');
  const g=run();tick(g,true);g.drainEvents();bites(g,1.2);const fast=ready(g);assert.equal(fast.length,1);assert.equal(fast[0].slow,false,'raptor bite is fast');
  const rex=run('tyrannosaurus');tick(rex,true);rex.drainEvents();bites(rex,2.5);const slow=ready(rex);assert.equal(slow.length,1);assert.equal(slow[0].slow,true,'T. rex bite is slow');
  const b=run();tick(b,true);while(b.run.attackCooldown>.1)tick(b);b.drainEvents();tick(b,true);bites(b,.3);assert.equal(ready(b).length,0,'buffered bite: no cue');
});
