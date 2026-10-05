/* Deterministic gameplay kernel embedded in a native GDevelop JavaScript event.
   No wall-clock timers, autonomous behaviors or animation clocks run gameplay. */
function createPrimalCore(B) {
  const rocks = [{x:236,y:198},{x:698,y:208},{x:746,y:478},{x:276,y:450}];
  let nextId = 1;
  const fresh = () => ({player:{x:480,y:320},hp:B.player.hp,time:0,spawn:0,
    cooldown:0,bite:0,stamina:B.player.stamina,pounce:0,pounceCooldown:0,hunts:0,xp:0,nextXP:B.progression.initial_next_xp,level:1,
    phase:'playing',facing:'S',animation:'Idle_S',walkTime:0,frame:0,
    mutations:{teeth:0,legs:0,feathers:0},enemies:[],food:[],dna:0,awarded:false});
  let s=fresh();
  const addEnemy=(x,y,kind='compy') => {const e={id:nextId++,x,y,kind,hp:B.enemies[kind].hp,touch:0,bleed:0,bleedTick:0};s.enemies.push(e);return e;};
  const addFood=(x,y) => s.food.push({id:nextId++,x,y});
  function reset(){s=fresh();addEnemy(106,220);addFood(405,396);addFood(563,232);return s;}
  function levelUp(){if(s.hp>0&&s.xp>=s.nextXP){s.xp-=s.nextXP;s.nextXP+=B.progression.next_xp_increase_per_level;s.level++;s.phase='mutation';return true;}return false;}
  function choose(which){if(s.phase!=='mutation'||!Object.hasOwn(s.mutations,which))return false;s.mutations[which]++;s.phase='playing';levelUp();return true;}
  function end(){if(s.awarded)return;s.phase='dead';s.hp=0;s.dna=Math.floor(s.hunts/2)+Math.floor(s.time/15);s.awarded=true;}
  function valid(x,y,r){return x>=46&&x<=B.demo.width-46&&y>=82&&y<=B.demo.height-74&&rocks.every(o=>Math.hypot(x-o.x,y-o.y)>=r+18);}
  function move(o,dx,dy,r){const nx=Math.min(B.demo.width-46,Math.max(46,o.x+dx));const ny=Math.min(B.demo.height-74,Math.max(82,o.y+dy));
    if(valid(nx,o.y,r))o.x=nx;if(valid(o.x,ny,r))o.y=ny;
  }
  function tick(dt,input={}) {
    if(s.phase!=='playing')return;
    dt=Math.max(0,Math.min(dt,0.05));
    // An already pending level interrupts before movement, timers or damage.
    if(levelUp())return;
    if(s.hp<=0){end();return;}
    s.time+=dt;s.spawn+=dt;s.cooldown=Math.max(0,s.cooldown-dt);s.bite=Math.max(0,s.bite-dt);
    s.pounce=Math.max(0,s.pounce-dt);s.pounceCooldown=Math.max(0,s.pounceCooldown-dt);
    s.stamina=Math.min(B.player.stamina,s.stamina+B.player.stamina_regen_per_second*(1+B.progression.feathers_regen_bonus_per_stack*s.mutations.feathers)*dt);
    if(input.pounce&&s.pounceCooldown===0&&s.stamina>=B.player.pounce_cost){s.stamina-=B.player.pounce_cost;s.pounce=B.player.pounce_seconds;s.pounceCooldown=B.player.pounce_cooldown_seconds;}
    const dx=(input.right?1:0)-(input.left?1:0),dy=(input.down?1:0)-(input.up?1:0),n=Math.hypot(dx,dy);
    if(n){const f=Math.abs(dx)>Math.abs(dy)?(dx>0?'E':'W'):(dy>0?'S':'N');if(f!==s.facing){s.facing=f;s.walkTime=0;}}
    const ox=s.player.x,oy=s.player.y;
    if(n){const v=B.player.speed*(1+B.progression.legs_speed_bonus_per_stack*s.mutations.legs)*(s.pounce>0?B.player.pounce_multiplier:1);move(s.player,dx/n*v*dt,dy/n*v*dt,14);}
    const moving=n>0&&Math.hypot(s.player.x-ox,s.player.y-oy)>0.001;
    s.animation=(moving?'Walk_':'Idle_')+s.facing;
    s.walkTime=moving?(s.walkTime+dt)%0.75:0;s.frame=moving?Math.floor(s.walkTime*8):0;
    if(s.spawn>=B.demo.spawn_interval_seconds&&s.enemies.length<B.demo.max_enemies){s.spawn=0;const ps=[[106,220],[852,272],[580,110],[378,554]];const i=s.hunts+s.enemies.length+Math.floor(s.time),p=ps[i%4];
      const kind=s.time>=B.demo.carnotaurus_available_seconds&&i%3===0?'carnotaurus':s.time>=B.demo.parasaurolophus_available_seconds&&i%3===1?'parasaurolophus':'compy';addEnemy(...p,kind);}
    if(input.bite&&s.cooldown===0){s.cooldown=B.player.bite_cooldown_seconds;s.bite=0.15;
      for(const e of s.enemies)if(Math.hypot(e.x-s.player.x,e.y-s.player.y)<B.player.bite_radius){e.hp-=B.player.bite_damage;if(s.mutations.teeth){e.bleed=B.progression.bleed_seconds;e.bleedTick=0;}}
    }
    // Kill processing removes the enemy before XP is granted. No duplicate grants.
    // Stop immediately on a level-up; later enemies/food/timers wait for choice.
    for(const e of [...s.enemies]){
      if(e.hp>0&&e.bleed>0){const elapsed=Math.min(dt,e.bleed);e.bleed-=elapsed;e.bleedTick+=elapsed;
        while(e.bleedTick+1e-9>=B.progression.bleed_tick_seconds){e.bleedTick-=B.progression.bleed_tick_seconds;e.hp-=B.progression.bleed_damage_per_tick_per_stack*s.mutations.teeth;}}
      if(e.hp<=0){s.enemies=s.enemies.filter(o=>o!==e);addFood(e.x,e.y);s.hunts++;s.xp+=B.enemies[e.kind].xp;if(levelUp())return;continue;}
      const stats=B.enemies[e.kind],ex=s.player.x-e.x,ey=s.player.y-e.y,d=Math.hypot(ex,ey),flee=stats.flee_radius&&d<stats.flee_radius;
      if(d>25||flee)move(e,ex/Math.max(d,1)*stats.speed*dt*(flee?-1:1),ey/Math.max(d,1)*stats.speed*dt*(flee?-1:1),6);
      e.touch=Math.max(0,e.touch-dt);
      if(Math.hypot(e.x-s.player.x,e.y-s.player.y)<27&&e.touch===0&&stats.touch_damage>0){s.hp=Math.max(0,s.hp-stats.touch_damage);e.touch=1.2;if(s.hp<=0){end();return;}}
    }
    s.food=s.food.filter(f=>{if(Math.hypot(f.x-s.player.x,f.y-s.player.y)<26){s.hp=Math.min(B.player.hp,s.hp+B.progression.food_heal);return false;}return true;});
  }
  reset();return {get state(){return s;},rocks,reset,tick,choose,addEnemy,addFood,valid};
}
if(typeof module!=='undefined')module.exports={createPrimalCore};
