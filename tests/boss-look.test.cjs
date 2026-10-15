'use strict';
// FEATURES.bossLook (bosses drawn bigger, with name and tint) and FEATURES.combatColors (red attacks, yellow dodge/defence).
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../PRIMAL_RUN_Game/src/core.js');
function setup(species='compy'){const g=new C.Game({random:()=>.9});g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies(species);g.start({seed:33});Object.assign(g.run,{enemies:[],spawnTimer:999});return g;}
test('bosses are drawn bigger than the same species as an ordinary NPC and carry their boss name',()=>{
  assert.ok(C.FEATURES.bossLook);
  for(const kind of ['carnotaurus','deinosuchus','triceratops','tyrannosaurus','ankylosaurus','pachycephalosaurus']){
    const g=setup(),plain=g.spawn(kind,{x:500,y:340}),boss=g.spawn(kind,{x:700,y:340},true);
    assert.ok(boss.visualScale>=C.BOSS_LOOK.minScale,kind);
    assert.ok(boss.visualScale>(plain.visualScale||1),kind);
    assert.ok(boss.bossName&&boss.bossName!==C.SPECIES_LABELS[kind],kind);
  }
});
test('attack red and defence yellow are clearly different colours',()=>{
  assert.ok(C.FEATURES.combatColors);
  const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),[a,d]=[rgb(C.COMBAT_COLORS.attack),rgb(C.COMBAT_COLORS.defense)];
  assert.ok(a[0]>a[1]*2,'attack is red');assert.ok(d[1]>d[0]*.75&&d[1]>d[2]*1.5,'defence is yellow');
});
test('a dodged hit shows the yellow defence colour',()=>{
  const g=setup(),r=g.run,e=g.spawn('carnotaurus',{x:500,y:340});r.invulnerable=1;g.damage(10,e);
  assert.equal(r.effects.at(-1).text,'UNDVIGET');assert.equal(r.effects.at(-1).color,C.COMBAT_COLORS.defense);
});
