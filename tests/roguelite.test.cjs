'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict'), C=require('../PRIMAL_RUN_Game/src/core.js');
function make(species='compy'){const g=new C.Game({random:()=>.5});g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies(species);g.start({seed:123});g.run.enemies=[];g.run.spawnTimer=999;return g;}
test('fresh saves start as Deinonychus; legacy DNA and upgrades survive unlock migration',()=>{
 const values=new Map([[C.SAVE_KEY,JSON.stringify({dna:90,name:'Jonas',upgrades:{health:2},settings:{music:.2}})]]), storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const g=new C.Game({storage});assert.equal(g.save.selectedSpecies,'deinonychus');g.start({seed:7});assert.ok(Math.abs(g.run.maxHealth-104)<1e-8);assert.equal(g.run.player.radius,14);assert.equal(g.unlockSpecies('utahraptor'),false);
 g.phase='species';assert.equal(g.unlockSpecies('utahraptor'),true);assert.equal(g.save.dna,30);assert.equal(g.unlockSpecies('utahraptor'),false);assert.equal(g.unlockSpecies('__proto__'),false);g.selectSpecies('utahraptor');
 const reloaded=new C.Game({storage});assert.equal(reloaded.save.selectedSpecies,'utahraptor');reloaded.start();assert.equal(reloaded.run.maxHealth,104);assert.equal(reloaded.save.dna,30);
 assert.equal(C.sanitizeSave({selectedSpecies:'unknown_dinosaur',unlockedSpecies:['unknown_dinosaur']}).selectedSpecies,'deinonychus');
});
test('random wilderness is repeatable by seed, varies between seeds and keeps bounded safe habitats',()=>{
 for(let stage=0;stage<4;stage++)for(let seed=1;seed<=20;seed++){
  const m=C.createMap(stage,seed);assert.deepEqual(m,C.createMap(stage,seed));assert.notDeepEqual(m,C.createMap(stage,seed+1));assert.equal(m.trails.length,0);assert.ok(m.decorations.length>=440);
  assert.ok(m.habitats.every(h=>Math.hypot(h.x-480,h.y-340)>650&&h.x>50&&h.x<m.width-50&&h.y>76&&h.y<m.height-50));
  assert.equal(m.sites.length,6);assert.ok(m.sites.every(s=>Math.hypot(s.x-480,s.y-340)>650));
 }
});
test('each class has a distinct primary attack; Ankylosaurus tail hits behind it',()=>{
 for(const species of Object.keys(C.PLAYER_SPECIES)){
  const g=make(species),r=g.run;r.player.facing='E';const front=g.spawn('compy',{x:520,y:340}),back=g.spawn('compy',{x:440,y:340});g.resolveBite('E');
  assert.equal(front.hp,C.SPECIES.compy.hp-C.PLAYER_SPECIES[species].damage);assert.equal(back.hp,species==='ankylosaurus'?C.SPECIES.compy.hp-12:C.SPECIES.compy.hp);
 }
});
test('ability costs, immunity, contact damage once per animal, and defensive brace differ by class',()=>{
 for(const species of Object.keys(C.PLAYER_SPECIES)){
  const g=make(species),r=g.run;r.player.facing='E';const e=g.spawn('tyrannosaurus',{x:505,y:340});e.cooldown=999;e.speed=0;
  g.step(.01,{pounce:true,x:1});assert.ok(r.pounce>0);assert.ok(r.stamina<100);const hp=e.hp;g.step(.01,{x:1});assert.equal(e.hp,hp,'ability cannot damage same target twice');
  const health=r.health;g.damage(20);assert.equal(r.health,health-(species==='ankylosaurus'?5:['compy','utahraptor','velociraptor','deinonychus'].includes(species)?0:20));
  if(['utahraptor','velociraptor','carnotaurus','triceratops','pachycephalosaurus','baryonyx','deinosuchus'].includes(species))assert.ok(hp<e.maxHP);else assert.equal(hp,e.maxHP);
 }
});
test('mutation pool contains shared and own mutations, never another species skill',()=>{
 for(const species of Object.keys(C.PLAYER_SPECIES)){
  const g=make(species),own=C.MUTATIONS.filter(m=>m.species===species);
  for(const m of C.MUTATIONS)if(!m.species)g.run.mutations[m.id]=m.max;
  g.addXP(6);assert.equal(g.phase,'mutation');assert.ok(g.run.choices.length>=2);assert.ok(g.run.choices.every(id=>own.some(m=>m.id===id)));
 }
 const g=make('compy'),e=g.spawn('parasaurolophus',{x:520,y:340});g.run.mutations.hunter=2;g.resolveBite('E');assert.ok(Math.abs(e.hp-(30-6*1.5))<1e-8);
});
test('fossils award permanent DNA once; nest reward is locked until guardian death and its choice freezes simulation',()=>{
 const g=make(),r=g.run, fossil=r.map.sites.find(s=>s.type==='fossil');r.player.x=fossil.x;r.player.y=fossil.y;assert.equal(g.interact(),true);assert.equal(g.save.dna,3);assert.equal(g.interact(),false);
 const nest=r.map.sites.find(s=>s.type==='nest'),guard=g.spawn('carnotaurus',{x:nest.x+100,y:nest.y});guard.guard=true;nest.guardId=guard.id;r.player.x=nest.x;r.player.y=nest.y;assert.equal(g.interact(),false);assert.equal(guard.alert,true);guard.hp=0;g.kill(guard);r.enemies=[];g.interact();assert.equal(g.phase,'exploration');
 const before=JSON.stringify(r);g.step(.05,{attack:true,pounce:true});g.damage(20);assert.equal(JSON.stringify(r),before);
 g.explore(true);assert.equal(guard.alert,true);assert.ok(r.pickups.some(p=>p.corpseId===undefined&&p.kind==='meat'&&p.rarity===2));assert.equal(g.interact(),false);assert.equal(g.explore(true),false);
});
test('optional elites and rare prey exist before exploration and grant better loot',()=>{
 const g=new C.Game({random:()=>0});g.start({seed:3});const r=g.run,elite=r.enemies.find(e=>e.elite),rare=r.enemies.find(e=>e.rare);assert.ok(elite&&rare);assert.ok(Math.hypot(elite.x-480,elite.y-340)>600);
 g.kill(elite);assert.ok(g.save.dna>=6);assert.equal(r.eliteKills,1);assert.ok(r.pickups.some(p=>p.kind==='meat'&&p.rarity>=2));g.kill(rare);assert.ok(r.map.sites.find(s=>s.animalId===rare.id).claimed);
});
test('later bosses have locked warnings, phase two, and flank recovery; T. rex roar drains stamina',()=>{
 for(let stage=1;stage<4;stage++){
  const g=make('utahraptor'),r=g.run;r.stage=stage;r.map.rocks=[];const e=g.spawn(C.STAGES[stage].boss,{x:480,y:200},true);e.cooldown=0;g.enemyStep(e,.01);assert.equal(e.mode,'windup');e.timer=e.windupDuration*.3;const aim=e.chargeX;r.player.x+=80;g.enemyStep(e,.01);assert.equal(e.chargeX,aim);
  e.hp=e.maxHP*.5;g.enemyStep(e,.01);assert.equal(e.mode,'enrage');assert.equal(e.bossPhase,2);assert.equal(g.drainEvents().filter(x=>x.type==='boss_enrage').length,1);
  e.mode='recover';e.timer=2;e.facingX=0;e.facingY=-1;r.player.x=e.x;r.player.y=e.y+50;r.player.facing='N';const hp=e.hp;g.resolveBite('N');assert.equal(e.hp,hp-12.5);
 }
 const g=make(),r=g.run;r.stage=3;const e=g.spawn('tyrannosaurus',{x:480,y:260},true);e.cooldown=0;g.enemyStep(e,.01);assert.equal(e.pattern,3);e.timer=.001;g.enemyStep(e,.01);g.enemyStep(e,.14);assert.equal(r.stamina,60);assert.equal(r.health,80);
});
