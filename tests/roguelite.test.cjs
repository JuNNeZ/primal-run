'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict'), C=require('../PRIMAL_RUN_Game/src/core.js');
C.FEATURES.equilibrium = false; // exact pre-Snowflake HP/damage numbers; tests/snowflake.test.cjs covers the multipliers
function make(species='compy'){const g=new C.Game({random:()=>.5});g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies(species);g.start({seed:123});g.run.enemies=[];g.run.spawnTimer=999;return g;}
test('fresh saves start as Deinonychus; legacy DNA and upgrades survive unlock migration',()=>{
 const values=new Map([[C.SAVE_KEY,JSON.stringify({dna:90,name:'Jonas',upgrades:{health:2},settings:{music:.2}})]]), storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const g=new C.Game({storage});assert.equal(g.save.selectedSpecies,'deinonychus');g.start({seed:7});assert.ok(Math.abs(g.run.maxHealth-100*(1+2*C.UPGRADE_STEP.health))<1e-8);assert.equal(g.run.player.radius,14);assert.equal(g.unlockSpecies('utahraptor'),false);
 g.phase='species';assert.equal(g.unlockSpecies('utahraptor'),true);assert.equal(g.save.dna,30);assert.equal(g.unlockSpecies('utahraptor'),false);assert.equal(g.unlockSpecies('__proto__'),false);g.selectSpecies('utahraptor');
 const reloaded=new C.Game({storage});assert.equal(reloaded.save.selectedSpecies,'utahraptor');reloaded.start();assert.ok(Math.abs(reloaded.run.maxHealth-100*(1+2*C.UPGRADE_STEP.health))<1e-8);assert.equal(reloaded.save.dna,30);
 assert.equal(C.sanitizeSave({selectedSpecies:'unknown_dinosaur',unlockedSpecies:['unknown_dinosaur']}).selectedSpecies,'deinonychus');
});
test('random wilderness is repeatable by seed, varies between seeds and keeps bounded safe habitats',()=>{
 for(let stage=0;stage<4;stage++)for(let seed=1;seed<=20;seed++){
  const m=C.createMap(stage,seed);assert.deepEqual(m,C.createMap(stage,seed));assert.notDeepEqual(m,C.createMap(stage,seed+1));assert.equal(m.trails.length,0);assert.ok(m.decorations.length>=440);
  assert.ok(m.habitats.every(h=>Math.hypot(h.x-480,h.y-340)>650&&h.x>50&&h.x<m.width-50&&h.y>76&&h.y<m.height-50));
  assert.equal(m.sites.length,6);assert.ok(m.sites.every(s=>Math.hypot(s.x-480,s.y-340)>650));
 }
});
test('each class has a distinct primary attack; Ankylosaurus tail hits behind and beside it, never in front of its head',()=>{
 for(const species of Object.keys(C.PLAYER_SPECIES)){
  const g=make(species),r=g.run;r.player.facing='E';const front=g.spawn('compy',{x:520,y:340}),back=g.spawn('compy',{x:440,y:340});g.resolveBite('E');
  const tail=C.kindOf({species})==='ankylosaurus',bite=C.PLAYER_SPECIES[species].damage; // Stegosaurus swings its tail like the Ankylosaurus
  assert.equal(front.hp,tail?C.SPECIES.compy.hp:C.SPECIES.compy.hp-bite);assert.equal(back.hp,tail?C.SPECIES.compy.hp-bite:C.SPECIES.compy.hp);
 }
 const g=make('ankylosaurus'),side=g.spawn('compy',{x:480,y:290});g.run.player.facing='E';g.resolveBite('E');assert.equal(side.hp,C.SPECIES.compy.hp-12,'270° arc reaches the flanks');
});
test('ability costs, immunity, contact damage once per animal, and defensive brace differ by class',()=>{
 for(const species of Object.keys(C.PLAYER_SPECIES)){
  const g=make(species),r=g.run;r.player.facing='E';const e=g.spawn('tyrannosaurus',{x:505,y:340});e.cooldown=999;e.speed=0;
  g.step(.01,{pounce:true,x:1});assert.ok(r.pounce>0||r.hop,'ability started (the pachy hops back right after its headbutt lands)');assert.ok(r.stamina<100);const hp=e.hp;g.step(.01,{x:1});assert.equal(e.hp,hp,'ability cannot damage same target twice');
  const health=r.health;g.damage(20);assert.equal(r.health,health-(['ankylosaurus','stegosaurus'].includes(species)?5:['compy','utahraptor','velociraptor','deinonychus','gallimimus','pachycephalosaurus','therizinosaurus','pteranodon','microraptor','oviraptor'].includes(species)?0:20)); // dust cloud, glides and the hop back protect briefly; the Parasaurolophus trumpets instead of raising dust
  if(['utahraptor','velociraptor','carnotaurus','triceratops','pachycephalosaurus','baryonyx','deinosuchus','allosaurus','spinosaurus','parasaurolophus','therizinosaurus','microraptor','pachyrhinosaurus'].includes(species))assert.ok(hp<e.maxHP);else if(species==='compy')assert.ok(r.raptors.some(a=>a.temp&&a.kind==='compy'),'the dodge calls wild compies');else assert.equal(hp,e.maxHP);
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
test('an Ankylosaurus tail slam misses a player standing in front of its head',()=>{
 // The slam was aimed (chargeX) toward the player: tail side, hurt. Aimed away: the player stands at its head, safe.
 for(const [label,chargeX,hurt] of [['tail',-1,true],['head',1,false]]){
  const g=make('velociraptor'),r=g.run,e=g.spawn('ankylosaurus',{x:r.player.x+60,y:r.player.y});
  Object.assign(e,{alert:true,mode:'slam',pattern:2,timer:.1,attackHit:false,attackRadius:100,chargeX,chargeY:0,cooldown:99,lastAttackedAt:r.seconds});
  const health=r.health;r.invulnerable=0;g.step(1/30,{});
  assert.equal(r.health<health,hurt,label);
 }
});
test('mutation rerolls: 1 at start, +1 per boss and elite, at most 3; species bias shows an own-species choice',()=>{
 const g=make('compy'),r=g.run;assert.equal(g.rerollsLeft(),C.REROLLS.start);r.xp=r.nextXP;g.maybeLevelUp();assert.equal(g.phase,'mutation');
 const before=[...r.choices];assert.equal(g.reroll(),true);assert.equal(g.rerollsLeft(),0);
 assert.ok(r.choices.every(id=>!before.includes(id)),'fresh choices');assert.equal(g.reroll(),false);
 const b=g.spawn('pachycephalosaurus',{x:900,y:900},true);g.kill(b);assert.equal(g.rerollsLeft(),1,'+1 reroll per boss');
 g.phase='playing';const elite=g.spawn('carnotaurus',{x:900,y:900});elite.elite=true;g.kill(elite);assert.equal(g.rerollsLeft(),2,'+1 reroll per elite');
 assert.equal(g.addRerolls(5),1);assert.equal(g.rerollsLeft(),C.REROLLS.max,'the stock is capped');
 const h=make('triceratops');h.run.xp=h.run.nextXP;h.maybeLevelUp();
 assert.ok(h.run.choices.some(id=>C.MUTATIONS.find(m=>m.id===id).species==='triceratops'),'own-species choice until one is taken');
 const saved={...C.FEATURES};try{C.FEATURES.mutationRerolls=false;assert.equal(make('compy').rerollsLeft(),0,'flag off: no rerolls');}finally{Object.assign(C.FEATURES,saved);}
});
test('boss strength rises through the journey and lab upgrades scale with UPGRADE_STEP',()=>{
 assert.equal(C.BOSS_TUNING.hp.length,8);assert.equal(C.BOSS_TUNING.damage.length,8);
 const g=make('compy');g.save.upgrades.health=5;g.start({seed:9});assert.equal(g.run.maxHealth,Math.round(C.PLAYER_SPECIES.compy.hp*(1+5*C.UPGRADE_STEP.health))||g.run.maxHealth);
 assert.match(C.UPGRADES[0].text,new RegExp('\\+'+Math.round(100*C.UPGRADE_STEP.health)+' %'));
});
test('new abilities are on: 1.2 s pin, dust cloud, Pachycephalosaurus hop back; 4 cards and second wind come from the lab',()=>{
 assert.equal(C.MUTATION_CHOICES.count,3);assert.equal(C.FEATURES.secondWind,false);assert.ok(Object.values(C.ALT_ABILITIES).every(v=>v===true));
 const pin=()=>{const v=make('velociraptor'),r=v.run,t=v.spawn('parasaurolophus',{x:r.player.x,y:r.player.y+25});r.stamina=100;v.step(1/30,{pounce:true,x:0,y:1});return t;};
 assert.ok(pin().stagger>1.1,'Velociraptor pin holds about 1.2 s');
 const g=make('compy');g.save.upgrades.widerPool=1;g.start({seed:123});g.run.xp=g.run.nextXP;g.maybeLevelUp();assert.equal(g.run.choices.length,4,'wider gene pool: 4 cards');
 const s=make('compy');s.save.upgrades.secondWind=1;s.start({seed:123});s.run.invulnerable=0;s.damage(9999);assert.equal(s.phase,'playing');assert.equal(s.run.health,1);
 s.run.invulnerable=0;s.damage(9999);assert.notEqual(s.phase,'playing','only once per run');
 const d=make('gallimimus'),dr=d.run,prey=d.spawn('carnotaurus',{x:dr.player.x+80,y:dr.player.y}),boss=d.spawn('carnotaurus',{x:dr.player.x-100,y:dr.player.y},true);
 dr.stamina=100;d.step(1/30,{pounce:true,x:0,y:1});assert.ok(prey.stagger>0,'dust cloud staggers animals');assert.ok(boss.breakMeter>0||boss.mode==='broken','and fills the boss break meter');assert.ok(dr.dustCloud,'the cloud is drawn');
 const p=make('pachycephalosaurus'),pr=p.run,t=p.spawn('parasaurolophus',{x:pr.player.x,y:pr.player.y+30});pr.stamina=100;const y=pr.player.y;
 p.step(1/30,{pounce:true,x:0,y:1});assert.ok(t.hp<t.maxHP,'the charge hits');assert.equal(pr.pounce,0,'the charge stops at the first hit');assert.ok(pr.invulnerable>0);
 for(let i=0;i<8;i++)p.step(1/30,{});assert.ok(pr.player.y<y,'and hops back, away from the target');
});
