'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../PRIMAL_RUN_Game/src/core.js');
function setup(species='compy'){const g=new C.Game({random:()=>.9});g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies(species);g.start({seed:33});Object.assign(g.run,{enemies:[],spawnTimer:999});Object.assign(g.run.map,{rocks:[],cover:[],mud:[]});return g;}
test('water and mud slow travel while crocodiles retain water speed and collision corrections remain independent',()=>{
 const g=setup(),r=g.run,p=r.player;r.stage=1;r.map.river=[{x:0,y:340},{x:2880,y:340}];r.map.riverCurve=r.map.river;
 const x=p.x;g.travel(p,10,0);assert.equal(p.x-x,6);const croc=g.spawn('deinosuchus',{x:900,y:340});g.travel(croc,10,0);assert.equal(croc.x,910);
 r.stage=0;r.map.mud=[{x:p.x,y:p.y,rx:90,ry:90}];const mx=p.x;g.travel(p,10,0);assert.equal(p.x-mx,7.5);g.move(p,10,0);assert.equal(p.x-mx,17.5);
});
test('bush concealment requires a quiet delay, reduces detection, and attacks reveal immediately',()=>{
 const g=setup(),r=g.run;r.map.cover=[{x:480,y:340,radius:100}];for(let i=0;i<40;i++)g.step(.02);assert.ok(r.hidden);
 const e=g.spawn('compy',{x:640,y:340});g.enemyStep(e,.02);assert.equal(e.alert,false);g.attack();assert.equal(r.hidden,false);assert.ok(r.revealedUntil>r.seconds);
 g.provoke(e);r.hidden=true;g.enemyStep(e,.02);assert.ok(e.alert,'hit animal remembers player even inside cover');
});
test('normal movement breaks concealment, sneaking preserves it and bosses keep targeting hidden players',()=>{
 const g=setup(),r=g.run;r.map.cover=[{x:480,y:340,radius:300}];for(let i=0;i<40;i++)g.step(.02);g.step(.02,{x:1,sneak:true});assert.ok(r.hidden);g.step(.02,{x:1});assert.equal(r.hidden,false);
 r.hidden=true;const boss=g.spawn('carnotaurus',{x:700,y:340},true);boss.cooldown=999;const x=boss.x;g.enemyStep(boss,.02);assert.ok(boss.x<x);assert.ok(boss.alert);
});
test('herds share alarms without granting an unhit animal the attack grace, and resume grazing/rest',()=>{
 const g=setup(),r=g.run,a=g.spawn('parasaurolophus',{x:1000,y:700}),b=g.spawn('parasaurolophus',{x:1040,y:730});assert.equal(a.herdId,b.herdId);g.provoke(a);assert.ok(b.alert);assert.equal(b.lastAttackedAt,-1000);assert.equal(b.herdAlarmUntil,4);
 r.player.x=2000;r.player.y=1200;b.alert=false;b.naturalTime=0;g.enemyStep(b,.02);assert.equal(b.mode,'graze');b.naturalTime=9;g.enemyStep(b,.02);assert.equal(b.mode,'rest');b.naturalTime=13;const before=[b.x,b.y];g.enemyStep(b,.02);assert.equal(b.mode,'roam');assert.notDeepEqual([b.x,b.y],before);
});
test('territorial predators warn before entry, pursue attacks for eight seconds, then leave players beyond their home',()=>{
 const g=setup(),r=g.run,e=g.spawn('carnotaurus',{x:1000,y:700});r.player.x=1250;r.player.y=700;g.enemyStep(e,.02);assert.equal(e.mode,'warning');assert.equal(e.alert,false);
 g.provoke(e);r.player.x=1700;r.seconds=7.99;g.behaviorRandom=()=>1;g.enemyStep(e,.02);assert.ok(e.alert);e.x=1150;r.seconds=8;g.enemyStep(e,.02);assert.equal(e.mode,'return');assert.equal(e.alert,false);
});
test('death series remain for 25–30 simulation seconds, cap memory, and freeze during mutation choices',()=>{
 const g=setup(),r=g.run;for(let i=0;i<35;i++)g.kill(g.spawn('compy',{x:1000,y:700}));assert.equal(r.corpses.length,32);r.enemies=[];g.phase='mutation';const before=JSON.stringify(r.corpses);g.step(.05);assert.equal(JSON.stringify(r.corpses),before);g.phase='playing';for(let i=0;i<610;i++)g.step(.05);assert.equal(r.corpses.length,0);
});
test('momentum refunds are capped per cast even when a Carnotaurus hits an entire pack',()=>{
 const g=setup('carnotaurus'),r=g.run;r.mutations.momentum=3;for(let i=0;i<5;i++)g.spawn('parasaurolophus',{x:500+i*2,y:340});g.step(.02,{x:1,pounce:true});assert.equal(r.abilityRefund,12);assert.ok(r.stamina<=67,'45 stamina cost keeps a minimum 33 stamina net cost');
});
test('shared damage and hunter stack additively while armour and defensive stance multiply without invulnerability',()=>{
 const g=setup(),r=g.run,e=g.spawn('parasaurolophus',{x:520,y:340});r.mutations.hunter=3;r.mutations.teeth=3;const hp=e.hp;g.resolveBite('E');assert.ok(Math.abs(hp-e.hp-6*2.35)<1e-8);
 const tank=setup('ankylosaurus'),t=tank.run;t.mutations.armor=3;t.pounce=1;tank.damage(100);assert.equal(t.health,131);
 assert.deepEqual(Object.values(C.PLAYER_SPECIES).map(c=>c.cost),[0,25,55,75,90,35,20,65]);assert.ok(C.upgradeCost(4)>C.upgradeCost(3));
});

test('turning preserves stride phase and walk/run clocks close their loops without an extra-frame reset',()=>{const g=setup(),r=g.run;r.player.walk=.72;g.step(.04,{x:1});assert.ok(Math.abs(r.player.walk-.76)<1e-8);r.player.walk=1.49;g.step(.02,{y:1});assert.ok(Math.abs(r.player.walk-.01)<1e-8);assert.equal(r.player.facing,'S');});
