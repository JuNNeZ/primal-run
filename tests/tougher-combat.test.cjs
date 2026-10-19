'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../PRIMAL_RUN_Game/src/core.js');
function setup(species='compy',difficulty){const g=new C.Game({random:()=>.9});g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies(species);if(difficulty)g.save.settings.difficulty=difficulty;g.start({seed:33});Object.assign(g.run,{enemies:[],spawnTimer:999});Object.assign(g.run.map,{rocks:[],cover:[],mud:[],events:[],sites:[]});return g;}
const near=(g,kind,dx=40)=>{const r=g.run,e=g.spawn(kind,{x:r.player.x+dx,y:r.player.y});g.provoke(e);e.facingX=-1;e.facingY=0;r.player.facing='E';return e;};

test('a bite flinches an animal once, then its poise window ignores more flinches and knockback',()=>{
  const g=setup(),r=g.run,e=near(g,'allosaurus');e.hp=e.maxHP=999;
  g.resolveBite('E');assert.ok(e.flinch>0);const x=e.x;e.flinch=0;
  g.resolveBite('E');assert.equal(e.flinch,0);assert.equal(e.x,x);
  r.seconds+=C.TOUGH.flinchImmune+.01;g.resolveBite('E');assert.ok(e.flinch>0);
});
test('late windup is hyper armor: bites do not flinch an animal about to strike',()=>{
  const g=setup(),r=g.run,e=near(g,'allosaurus');e.hp=e.maxHP=999;e.mode='windup';e.windupDuration=.8;e.timer=.2;
  g.resolveBite('E');assert.ok(!(e.flinch>0));
});
test('after a stagger ends the animal is immune to new stagger for a while',()=>{
  const g=setup(),r=g.run,e=near(g,'allosaurus',200);e.stagger=.2;
  for(let i=0;i<10;i++){r.seconds+=.05;g.enemyAI(e,.05);}
  assert.equal(e.stagger,0);assert.ok(e.staggerImmuneUntil>r.seconds);
  e.stagger=1;g.enemyAI(e,.05);assert.equal(e.stagger,0);
  r.seconds=e.staggerImmuneUntil+.01;e.stagger=1;g.enemyAI(e,.05);assert.ok(e.stagger>0);
});
test('enemy windups aim at the player until just before they commit',()=>{
  const g=setup(),r=g.run,e=near(g,'allosaurus',30);e.cooldown=0;g.enemyStep(e,.02);assert.equal(e.mode,'windup');
  assert.ok(e.windupDuration<.85,'shorter windup');
  r.player.y+=60;g.enemyAI(e,.05);assert.ok(e.chargeY>0,'turns toward the sidestep');
  e.timer=C.TOUGH.lock/2;const y=e.chargeY;r.player.y-=120;g.enemyAI(e,.01);assert.equal(e.chargeY,y,'locked');
});
test('player bites cost stamina, have an attack-speed floor, and Compy bites slower',()=>{
  const g=setup(),r=g.run;r.mutations.quick=3;r.mutations.overclock=2;r.stamina=50;g.attack();
  assert.equal(r.stamina,50-C.TOUGH.biteStamina);
  assert.ok(Math.abs(r.attackCooldown-C.PLAYER_SPECIES.compy.cooldown*C.TOUGH.speedFloor*C.TOUGH.attackSlow*C.TOUGH.speciesSlow.compy)<1e-9);
  const t=setup(),tr=t.run;tr.stamina=0;t.attack();assert.ok(Math.abs(tr.attackCooldown-C.PLAYER_SPECIES.compy.cooldown*C.TOUGH.attackSlow*C.TOUGH.speciesSlow.compy*C.TOUGH.tiredSlow)<1e-9,'tired bites are slower');
});
test('epic offers per level are capped by difficulty; the rival always pays its epic',()=>{
  for(const [difficulty,budget] of [['normal',2],['extinction',1]]){
    const g=setup('compy',difficulty),r=g.run;let epic=0;
    for(let i=0;i<4;i++){r.rareRewards=1;r.rareRewardSources=['albino'];g.phase='playing';assert.ok(g.offerRareReward());if(r.rareSelection)epic++;r.rareSelection=false;}
    assert.equal(epic,budget,difficulty);
    r.rivalRewards=1;r.rareRewards=1;r.rareRewardSources=['elite'];g.phase='playing';g.offerRareReward();assert.ok(r.rareSelection,'rival epic');
  }
});
test('an ankylosaurus turns its tail to the player for the slam, so the safe gap is at its head',()=>{
  const g=setup(),r=g.run,e=near(g,'ankylosaurus',60);e.cooldown=0;g.enemyAI(e,.02);
  assert.equal(e.mode,'windup');assert.equal(e.pattern,2);
  assert.ok(e.facingX>0&&e.direction==='E','head points away from the player (player is west)');
  assert.ok(e.chargeX<0,'tail aims at the player');
});
test('TOUGH.extinctionOnly keeps Normal on the old aim and bite speed',()=>{
  C.TOUGH.extinctionOnly=true;
  try{const n=setup(),e=near(n,'allosaurus',30);e.cooldown=0;n.enemyStep(e,.02);assert.equal(e.windupDuration,.85);n.attack();assert.equal(n.run.stamina,100);}
  finally{C.TOUGH.extinctionOnly=false;}
});
