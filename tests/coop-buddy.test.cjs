'use strict';
// FEATURES.coopBuddy (Flokkammerat): player 2 steers a raptor through input.buddy; kills count for the shared run,
// it is pulled back to the camera and returns after a knockout. Off unless the app sets game.coopBuddy.
const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../PRIMAL_RUN_Game/src/core.js');
const coopGame=seed=>{const g=new C.Game();g.coopBuddy=true;g.start({seed});return g;};

test('solo runs have no buddy',()=>{const g=new C.Game();g.start({seed:3});assert.equal(g.run.buddy,undefined);});

test('player 2 moves with input.buddy and player 1 is unaffected',()=>{
  const g=coopGame(3),r=g.run,b=r.buddy,x0=b.x,p0=r.player.x;
  for(let i=0;i<60;i++)g.step(1/60,{buddy:{x:1,y:0}});
  assert.ok(b.x-x0>100,'buddy walked right');assert.equal(r.player.x,p0);
});

test('buddy bites kill animals for the shared run',()=>{
  const g=coopGame(3),r=g.run,b=r.buddy,e=r.enemies.find(e=>!e.boss&&!e.damage);
  for(let i=0;i<60*6&&!e.rewarded;i++){e.x=b.x+20;e.y=b.y;g.step(1/60,{buddy:{attack:true}});}
  assert.equal(e.rewarded,true);assert.equal(r.kills,1);assert.equal(b.kills,1);
});

test('buddy is pulled back to the camera and returns after a knockout',()=>{
  const g=coopGame(4),r=g.run,b=r.buddy;
  b.x=r.player.x+3000;g.step(1/60,{});assert.ok(Math.abs(b.x-r.player.x)<100);
  g.hurtBuddy(999);assert.equal(b.down,C.BUDDY.downTime);
  const x=b.x;g.step(1/60,{buddy:{x:1,y:0,attack:true}});assert.equal(b.x,x,'knocked out: no input');
  for(let i=0;i<60*(C.BUDDY.downTime+1);i++)g.step(1/60,{});
  assert.equal(b.down,0);assert.ok(b.hp>=b.maxHP*C.BUDDY.reviveHP);
});

test('buddy follows to the next level',()=>{
  const g=coopGame(5),r=g.run;g.phase='cleared';g.nextStage();
  assert.equal(r.levelIndex,1);assert.ok(Math.hypot(r.buddy.x-r.player.x,r.buddy.y-r.player.y)<80);
});
