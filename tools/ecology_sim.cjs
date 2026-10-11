#!/usr/bin/env node
'use strict';
// Natural-ecology census: an invulnerable wandering player, real core step(), per stage. Counts NPC hunts, kills,
// fights to the death, carrion waits/driving off, Baryonyx fishing and how many animals live near the player.
// node tools/ecology_sim.cjs [--off] [--seeds N] [--seconds N]
const C=require('../PRIMAL_RUN_Game/src/core.js');
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i>0?Number(process.argv[i+1]):d;};
const OFF=process.argv.includes('--off'),SEEDS=arg('--seeds',6),SECONDS=arg('--seconds',300);
C.FEATURES.naturalEcology=!OFF;
const out=[];
for(let stage=0;stage<4;stage++){
  const t={stage,naturalKills:0,hunts:0,deathFights:0,drivenOff:0,waits:0,npcFish:0,huntsOnArmed:0,nearby:0,samples:0,minNearby:1e9,total:0,carrionEatenByNpc:0,cpuMs:0};
  for(let s=0;s<SEEDS;s++){
    const seed=500+s*17,g=new C.Game({random:(()=>{let x=seed;return()=>{x=(x*1103515245+12345)%2147483648;return x/2147483648;};})()});
    g.save.unlockedSpecies=Object.keys(C.PLAYER_SPECIES);g.selectSpecies('velociraptor');g.start({seed});
    const r=g.run;r.stage=stage;r.levelIndex=stage*2;r.map=C.createMap(stage,seed);r.enemies=[];r.pickups=[];r.corpses=[];g.populate();
    r.maxHealth=r.health=1e9;r.meat=-1e9; // never finish the level, never die
    const seen=new Set(),dfs=new Set(),fishStock=()=>(r.map.fishSchools||[]).reduce((n,f)=>n+f.stock,0);
    const huntPrey=g.huntPrey.bind(g);g.huntPrey=(e,p,dt)=>{if(!seen.has(e.id+':'+p.id)){seen.add(e.id+':'+p.id);t.hunts++;if(p.damage)t.huntsOnArmed++;}return huntPrey(e,p,dt);};
    const emit=g.emit.bind(g);g.emit=(type,d)=>{if(type==='nature_kill')t.naturalKills++;return emit(type,d);};
    let wp={x:r.player.x,y:r.player.y},waiting=new Set(),bans=new Set();const t0=process.hrtime.bigint();
    for(let i=0;i<SECONDS*30&&g.phase==='playing';i++){
      if(Math.hypot(wp.x-r.player.x,wp.y-r.player.y)<40||i%900===0)wp={x:200+g.random()*(r.map.width-400),y:200+g.random()*(r.map.height-400)};
      const dx=wp.x-r.player.x,dy=wp.y-r.player.y,d=Math.hypot(dx,dy)||1,before=r.pickups.reduce((n,p)=>n+(p.corpseId!==undefined?p.value:0),0),stock=fishStock();
      g.step(1/30,{x:dx/d,y:dy/d});
      if(g.phase!=='playing'){if(g.phase==='mutation'||g.phase==='exploration'||g.phase==='reward'){g.phase='playing';}else break;}
      for(const e of r.enemies){if(e.deathFight&&!dfs.has(e.id)){dfs.add(e.id);t.deathFights++;}if(e.mode==='watch'&&e.waitCorpse!==undefined&&!waiting.has(e.id)){waiting.add(e.id);t.waits++;}}
      if(stock>fishStock()&&r.species!=='baryonyx')t.npcFish+=stock-fishStock();
      if(i%30===0){const n=r.enemies.filter(e=>Math.hypot(e.x-r.player.x,e.y-r.player.y)<900).length;t.nearby+=n;t.samples++;t.minNearby=Math.min(t.minNearby,n);t.total+=r.enemies.length;}
      for(const e of r.enemies)if(e.carrionBan&&!bans.has(e.id+':'+e.carrionBan.until)){bans.add(e.id+':'+e.carrionBan.until);t.drivenOff++;}
    }
    t.cpuMs+=Number(process.hrtime.bigint()-t0)/1e6;
  }
  out.push({stage:t.stage,perMin:{naturalKills:+(t.naturalKills/(SEEDS*SECONDS/60)).toFixed(2),hunts:+(t.hunts/(SEEDS*SECONDS/60)).toFixed(2)},hunts:t.hunts,huntsOnArmed:t.huntsOnArmed,naturalKills:t.naturalKills,deathFights:t.deathFights,carrionWaits:t.waits,drivenOff:t.drivenOff,npcFishCaught:t.npcFish,avgNear900:+(t.nearby/t.samples).toFixed(1),minNear900:t.minNearby,avgTotal:+(t.total/t.samples).toFixed(1),msPerSimSecond:+(t.cpuMs/(SEEDS*SECONDS)).toFixed(2)});
}
console.log(JSON.stringify({naturalEcology:!OFF,seeds:SEEDS,seconds:SECONDS,stages:out},null,1));
