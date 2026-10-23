'use strict';
// FEATURES.statSheet: the character panel's numbers follow the game's own build formulas, and each source's share is what
// switching that source off removes.
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../PRIMAL_RUN_Game/src/core.js');
const close=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-9,`${msg}: ${a} vs ${b}`);
function run(species='velociraptor'){const g=new C.Game({random:()=>.5});g.save.selectedSpecies=species;g.start({seed:5});return g;}
test('the flags for the readable loot and build panel are on',()=>{for(const f of ['mutationReel','lootCard','buildBar','statSheet'])assert.equal(C.FEATURES[f],true,f);});
test('a fresh run has no bonuses: value equals base for the build stats',()=>{
  const g=run(),rows=g.statSheet();assert.deepEqual(rows.map(x=>x.id),['health','damage','speed','regen','crit','armor','luck','ability']);
  for(const x of rows.filter(x=>x.id!=='health')){close(x.value,x.base,x.id);assert.deepEqual(x.parts,[],x.id);}
});
test('mutations, relics and the DNA lab show up as their own sources',()=>{
  const g=run(),r=g.run,before=Object.fromEntries(g.statSheet().map(x=>[x.id,x]));
  r.mutations.teeth=2;r.mutations.legs=1;r.relics={sickle_claw:true,osteoderm_plates:true};r.upgrades.damage=2;r.mutations.armor=1;
  const rows=Object.fromEntries(g.statSheet().map(x=>[x.id,x])),part=(id,name)=>(rows[id].parts.find(p=>p.name===name)||{}).delta;
  const sp=C.PLAYER_SPECIES[r.species],bite=before.damage.value/sp.damage; // species-level bite factor without any build
  close(rows.damage.value,sp.damage*(1+.2*2+.04*2)*bite,'damage = species × (1 + teeth 2×20 % + lab 2×4 %)');
  close(part('damage',C.MUTATIONS.find(m=>m.id==='teeth').name),sp.damage*.4*bite,'teeth share');
  close(part('damage','DNA-lab'),sp.damage*.08*bite,'lab share');
  close(rows.speed.value,before.speed.value*1.08,'legs +8 % speed');
  close(rows.crit.value,before.crit.value+.1,'Seglklo +10 points crit');close(part('crit','Seglklo'),.1,'Seglklo share');
  close(rows.armor.value,10+20,'armor rank 10 + Osteodermplader 20');assert.equal(rows.armor.note,Math.round(100*30/130)+' %','damage reduction A/(A+K)');
  for(const x of Object.values(rows))if(x.id!=='health')close(x.base+x.parts.reduce((a,p)=>a+p.delta,0),x.value,x.id+' parts add up');
});
test('the panel is empty without a run and leaves out stats behind off flags',()=>{
  const g=new C.Game({random:()=>.5});assert.deepEqual(g.statSheet(),[]);
  const old=C.FEATURES.armorPoints;C.FEATURES.armorPoints=false;try{assert.ok(!run().statSheet().some(x=>x.id==='armor'));}finally{C.FEATURES.armorPoints=old;}
});
