'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict'), C=require('../PRIMAL_RUN_Game/src/core.js');
function game(){const g=new C.Game({random:()=>.5});g.start({seed:123});g.run.enemies=[];g.run.spawnTimer=999;g.run.map.rocks=[];return g;}
test('a successful bite refreshes eight seconds with exactly zero give-up chance',()=>{
 const g=game(),r=g.run,e=g.spawn('compy',{x:520,y:340});g.resolveBite('E');assert.equal(e.lastAttackedAt,0);assert.equal(e.alert,true);e.x=1000;e.cooldown=999;g.behaviorRandom=()=>0;
 for(const seconds of [0,4,7.999]){r.seconds=seconds;assert.equal(g.chaseGiveUpRate(e,1000),0);g.enemyStep(e,.05);assert.equal(e.alert,true);}
 r.seconds=8;assert.ok(g.chaseGiveUpRate(e,600)>0);g.enemyStep(e,.05);assert.equal(e.mode,'return');assert.equal(e.alert,false);
 r.seconds=9;r.player.x=e.x-40;r.player.y=e.y;g.resolveBite('E');assert.equal(e.lastAttackedAt,9);assert.equal(e.mode,'chase');assert.equal(g.chaseGiveUpRate(e,1000),0);
});
test('give-up hazard increases with distance and time, excludes bosses and does not consume loot random rolls',()=>{
 const g=game(),r=g.run,e=g.spawn('carnotaurus',{x:900,y:340});g.provoke(e);r.seconds=9;
 const near=g.chaseGiveUpRate(e,200),far=g.chaseGiveUpRate(e,700);assert.ok(far>near);r.seconds=30;assert.ok(g.chaseGiveUpRate(e,700)>far);
 const boss=g.spawn('carnotaurus',{x:1300,y:340},true);assert.equal(g.chaseGiveUpRate(boss,1000),0);assert.equal(g.chaseGiveUpRate(e,100),0);
 let lootCalls=0;g.random=()=>{lootCalls++;return .5;};e.cooldown=999;g.behaviorRandom=()=>1;for(let i=0;i<50;i++)g.enemyStep(e,.02);assert.equal(lootCalls,0);
});
test('disengaged enemies move home and cannot instantly re-aggro; new player attacks override disengagement',()=>{
 const g=game(),r=g.run,e=g.spawn('compy',{x:1100,y:340});e.x=900;g.disengage(e);r.player.x=700;g.enemyStep(e,.05);assert.ok(e.x>900);assert.equal(e.mode,'return');assert.equal(e.alert,false);
 r.player.x=e.x-40;g.resolveBite('E');assert.equal(e.alert,true);assert.equal(e.mode,'chase');assert.equal(e.disengagedUntil,0);
});
test('prey settle at personal-space distance for a still observer, flee a moving or recent attacker, then settle again',()=>{
 const g=game(),r=g.run,e=g.spawn('parasaurolophus',{x:680,y:340});r.player.moving=false;g.enemyStep(e,.05);assert.equal(e.mode,'watch');assert.equal(e.x,680);assert.equal(e.moving,false);
 r.player.moving=true;g.enemyStep(e,.05);assert.equal(e.mode,'flee');assert.ok(e.x>680);
 r.player.moving=false;e.x=550;for(let i=0;i<100;i++)g.enemyStep(e,.05);assert.equal(e.mode,'watch');assert.ok(Math.hypot(e.x-r.player.x,e.y-r.player.y)>=110);assert.ok(e.x<610);
 g.provoke(e);g.enemyStep(e,.05);assert.equal(e.mode,'flee');r.seconds=8;g.enemyStep(e,.05);assert.equal(e.mode,'watch');
});
test('pause freezes pursuit grace, random decisions and prey distance state',()=>{
 const g=game(),e=g.spawn('compy',{x:700,y:340});g.provoke(e);g.pause();const before=JSON.stringify(g.run);let calls=0;g.behaviorRandom=()=>{calls++;return 0;};for(let i=0;i<200;i++)g.step(.05);assert.equal(JSON.stringify(g.run),before);assert.equal(calls,0);
});
