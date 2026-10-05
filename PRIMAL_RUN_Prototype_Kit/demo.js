/* PRIMAL RUN offline kit: XP, mutations, stamina and local DNA prototypes. */
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const paths={player:'assets/player/utahraptor_idle_S_000.png',enemy:'assets/enemy/compy_idle_S_000.png',grass:'assets/environment/grass.png',fern:'assets/environment/fern.png',rock:'assets/environment/rock.png',meat:'assets/pickups/meat.png'};
const playerOrigins={S:[64,72],N:[64,56],E:[68,64],W:[60,64]};
for(const d of ['S','N','E','W']){paths['idle'+d]='assets/player/utahraptor_idle_'+d+'_000.png';for(let i=0;i<6;i++)paths['walk'+d+i]='assets/player/utahraptor_walk_'+d+'_'+String(i).padStart(3,'0')+'.png';}
paths.xp='assets/ui/xp.png';paths.slash='assets/effects/bite_slash_001.png';paths.parasaurolophus='assets/enemies/parasaurolophus_idle_S_000.png';paths.carnotaurus='assets/enemies/carnotaurus_idle_S_000.png';
const images={},keys=new Set();let state,last=0,ready=false;
const rocks=[{x:236,y:198},{x:698,y:208},{x:746,y:478},{x:276,y:450}];
const ferns=[{x:110,y:140},{x:146,y:440},{x:844,y:140},{x:832,y:522},{x:380,y:174},{x:548,y:498},{x:618,y:112},{x:342,y:556},{x:90,y:550},{x:865,y:350}];
let savedDNA=0;try{savedDNA=Math.max(0,Number(localStorage.getItem('primalRunPrototypeDNA'))||0);}catch(e){}
function awardDNA(){if(state.awarded)return;state.awarded=true;state.runDNA=Math.floor(state.hunts/2)+Math.floor(state.time/15)+(state.health>0?10:0);savedDNA+=state.runDNA;try{localStorage.setItem('primalRunPrototypeDNA',String(savedDNA));}catch(e){} }
function gainXP(amount){state.xp+=amount;if(state.xp>=state.nextXP){state.xp-=state.nextXP;state.level++;state.nextXP+=4;state.paused=true;keys.clear();document.getElementById('choices').hidden=false;}}
function chooseMutation(which){if(!state.paused||!['teeth','legs','feathers'].includes(which))return;state.mutations[which]++;state.paused=false;keys.clear();document.getElementById('choices').hidden=true;if(state.xp>=state.nextXP)gainXP(0);last=0;}
function reset(){document.getElementById('choices').hidden=true;state={player:{x:480,y:320},health:100,hunts:0,time:0,cooldown:0,hit:0,bite:0,biteRequested:false,spawn:0,ended:false,result:'',enemies:[],food:[{x:405,y:396},{x:563,y:232}],xp:0,nextXP:8,level:1,paused:false,mutations:{teeth:0,legs:0,feathers:0},stamina:100,pounce:0,pounceCooldown:0,runDNA:0,awarded:false,facing:'S',playerAnimation:'Idle_S',walkTime:0,walkFrame:0};last=0;}
function spawn(){const i=state.hunts+state.enemies.length+Math.floor(state.time);const points=[{x:106,y:220},{x:852,y:272},{x:580,y:110},{x:378,y:554}];const kind=state.time>=20&&i%3===0?'carnotaurus':state.time>=10&&i%3===1?'parasaurolophus':'enemy';state.enemies.push({...points[i%4],touch:0,kind,hp:kind==='carnotaurus'?3:kind==='parasaurolophus'?2:1,bleed:0,bleedTick:0});}
function move(entity,dx,dy,radius){
 const ox=entity.x,oy=entity.y;entity.x=Math.min(914,Math.max(46,entity.x+dx));entity.y=Math.min(566,Math.max(82,entity.y+dy));
 for(const rock of rocks){const x=entity.x-rock.x,y=entity.y-rock.y,dist=Math.hypot(x,y),min=radius+18;if(dist<min){if(dist<.001){entity.x=ox;entity.y=oy;}else{entity.x=rock.x+x/dist*min;entity.y=rock.y+y/dist*min;}}}
}
function step(dt){
 if(!ready||state.ended||state.paused)return;state.time+=dt;
 state.pounce=Math.max(0,state.pounce-dt);state.pounceCooldown=Math.max(0,state.pounceCooldown-dt);state.stamina=Math.min(100,state.stamina+dt*18*(1+.2*state.mutations.feathers));
 if((keys.has('ShiftLeft')||keys.has('ShiftRight'))&&state.pounceCooldown===0&&state.stamina>=30){state.stamina-=30;state.pounce=.25;state.pounceCooldown=2;}
state.cooldown=Math.max(0,state.cooldown-dt);state.hit=Math.max(0,state.hit-dt);state.bite=Math.max(0,state.bite-dt);state.spawn+=dt;
 let dx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),dy=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);const n=Math.hypot(dx,dy);
 const beforeX=state.player.x,beforeY=state.player.y;if(n)move(state.player,dx/n*160*(1+.15*state.mutations.legs)*(state.pounce>0?2.3:1)*dt,dy/n*160*(1+.15*state.mutations.legs)*(state.pounce>0?2.3:1)*dt,14);
 const movedX=state.player.x-beforeX,movedY=state.player.y-beforeY;
 const moving=n>0&&Math.hypot(movedX,movedY)>.001;
 if(n){const next=Math.abs(dx)>Math.abs(dy)?(dx>0?'E':'W'):(dy>0?'S':'N');if(next!==state.facing){state.facing=next;state.walkTime=0;state.walkFrame=0;}}
 if(moving){state.playerAnimation='Walk_'+state.facing;state.walkTime=(state.walkTime+dt)%.75;state.walkFrame=Math.min(5,Math.floor(state.walkTime*8));}
 else{state.playerAnimation='Idle_'+state.facing;state.walkTime=0;state.walkFrame=0;}
 if(state.spawn>=3.2&&state.enemies.length<8){state.spawn=0;spawn();}
 if((state.biteRequested||keys.has('Space'))&&state.cooldown===0){
  state.cooldown=.55;state.bite=.15;
  for(const e of state.enemies){if(Math.hypot(e.x-state.player.x,e.y-state.player.y)<74){e.hp=(e.hp??1)-1;if(state.mutations.teeth>0){e.bleed=2;e.bleedTick=0;}}}
 }state.biteRequested=false;
 let earnedXP=0;
 for(const enemy of state.enemies){
  if(enemy.bleed>0){enemy.bleed=Math.max(0,enemy.bleed-dt);enemy.bleedTick=(enemy.bleedTick||0)+dt;if(enemy.bleedTick>=.5){enemy.hp-=.5*state.mutations.teeth;enemy.bleedTick-=.5;}}
  if((enemy.hp??1)<=0){state.food.push({x:enemy.x,y:enemy.y});state.hunts++;earnedXP+=enemy.kind==='carnotaurus'?8:enemy.kind==='parasaurolophus'?6:4;continue;}
  const dx=state.player.x-enemy.x,dy=state.player.y-enemy.y,n=Math.hypot(dx,dy),flee=enemy.kind==='parasaurolophus'&&n<170;
  if(n>25||flee){const sign=flee?-1:1,speed=enemy.kind==='carnotaurus'?65:44;move(enemy,dx/Math.max(1,n)*speed*dt*sign,dy/Math.max(1,n)*speed*dt*sign,6);}
  enemy.touch=Math.max(0,enemy.touch-dt);
  if(n<27&&enemy.touch===0&&enemy.kind!=='parasaurolophus'){state.health=Math.max(0,state.health-(enemy.kind==='carnotaurus'?18:12));state.hit=.18;enemy.touch=1.2;}
 }
 state.enemies=state.enemies.filter(e=>(e.hp??1)>0);
 if(earnedXP&&state.health>0)gainXP(earnedXP);
 state.food=state.food.filter(f=>{if(Math.hypot(f.x-state.player.x,f.y-state.player.y)<26){state.health=Math.min(100,state.health+14);return false;}return true;});
 if(state.health<=0){state.ended=true;state.result='RUN ENDED';awardDNA();}else if(state.time>=60){state.ended=true;state.result='DEMO SURVIVED';awardDNA();}
}
function sprite(name,x,y,origin){ctx.drawImage(images[name],Math.round(x)-origin[0],Math.round(y)-origin[1]);}
function draw(){
 if(!ready)return;ctx.imageSmoothingEnabled=false;for(let y=0;y<640;y+=32)for(let x=0;x<960;x+=32)ctx.drawImage(images.grass,x,y);
 for(const f of state.food)sprite('meat',f.x,f.y,[16,16]);
 const objects=[...ferns.map(e=>({...e,name:'fern',origin:[32,36]})),...rocks.map(e=>({...e,name:'rock',origin:[32,36]})),...state.enemies.map(e=>({...e,name:e.kind||'enemy',origin:e.kind==='carnotaurus'||e.kind==='parasaurolophus'?[48,64]:[32,54]})),{...state.player,name:'player',origin:playerOrigins[state.facing]}];
 objects.sort((a,b)=>a.y-b.y);for(const o of objects){if(o.name==='player'&&state.hit>0&&Math.floor(state.hit*30)%2===0)continue;const image=o.name==='player'?(state.playerAnimation.startsWith('Walk_')?'walk'+state.facing+state.walkFrame:'idle'+state.facing):o.name;sprite(image,o.x,o.y,o.origin);}
 if(state.bite>0){ctx.strokeStyle='#edd0a0';ctx.lineWidth=2;const x=Math.round(state.player.x),y=Math.round(state.player.y);sprite('slash',x,y,[48,48]);}
 document.getElementById('health').style.width=state.health+'%';document.getElementById('hp').textContent=state.health;document.getElementById('hunts').textContent=state.hunts;document.getElementById('time').textContent=Math.max(0,Math.ceil(60-state.time));document.getElementById('status').textContent=state.ended?'Press R to start again':(state.playerAnimation.startsWith('Walk_')?'Walk '+state.facing+' · frame '+(state.walkFrame+1)+'/6':'Idle '+state.facing)+' · pixel scale 1×';
 document.getElementById('progress').textContent='LEVEL '+state.level+' · XP '+state.xp+'/'+state.nextXP+' · STAMINA '+Math.round(state.stamina)+' · DNA '+savedDNA+' · Teeth '+state.mutations.teeth+' / Legs '+state.mutations.legs+' / Feathers '+state.mutations.feathers;
 if(state.ended){ctx.fillStyle='#151b19';ctx.fillRect(260,240,440,150);ctx.fillStyle='#edd0a0';ctx.font='bold 30px monospace';ctx.textAlign='center';ctx.fillText(state.result,480,297);ctx.font='16px monospace';ctx.fillText(state.hunts+' hunts · +'+state.runDNA+' DNA · R to restart',480,337);ctx.textAlign='left';}
}
function frame(now){const dt=last?Math.min((now-last)/1000,.05):0;last=now;step(dt);draw();requestAnimationFrame(frame);}
addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(state.paused){if(e.code==='Digit1')chooseMutation('teeth');if(e.code==='Digit2')chooseMutation('legs');if(e.code==='Digit3')chooseMutation('feathers');if(e.code==='KeyR')reset();return;}keys.add(e.code);if(e.code==='Space')state.biteRequested=true;if(e.code==='KeyR')reset();});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();last=0;});document.addEventListener('visibilitychange',()=>{keys.clear();last=0;});document.getElementById('restart').onclick=()=>{reset();canvas.focus();};
document.querySelectorAll('[data-mutation]').forEach(b=>b.onclick=()=>chooseMutation(b.dataset.mutation));
reset();Promise.all(Object.entries(paths).map(([name,path])=>new Promise((resolve,reject)=>{const pic=new Image();pic.onload=()=>{images[name]=pic;resolve();};pic.onerror=()=>reject(Error('Cannot load '+path));pic.src=path;}))).then(()=>{ready=true;spawn();canvas.focus();requestAnimationFrame(frame);}).catch(e=>{document.getElementById('status').textContent=e.message;});
window.primalDemo={getState:()=>state,step,draw,keys,gainXP,chooseMutation,getDNA:()=>savedDNA};
