/* PRIMAL RUN v5: four cardinal walk prototypes. */
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const paths={player:'assets/player/utahraptor_idle_S_000.png',enemy:'assets/enemy/compy_idle_S_000.png',grass:'assets/environment/grass.png',fern:'assets/environment/fern.png',rock:'assets/environment/rock.png',meat:'assets/pickups/meat.png'};
const playerOrigins={S:[64,72],N:[64,56],E:[68,64],W:[60,64]};
for(const d of ['S','N','E','W']){paths['idle'+d]='assets/player/utahraptor_idle_'+d+'_000.png';for(let i=0;i<6;i++)paths['walk'+d+i]='assets/player/utahraptor_walk_'+d+'_'+String(i).padStart(3,'0')+'.png';}
const images={},keys=new Set();let state,last=0,ready=false;
const rocks=[{x:236,y:198},{x:698,y:208},{x:746,y:478},{x:276,y:450}];
const ferns=[{x:110,y:140},{x:146,y:440},{x:844,y:140},{x:832,y:522},{x:380,y:174},{x:548,y:498},{x:618,y:112},{x:342,y:556},{x:90,y:550},{x:865,y:350}];
function reset(){state={player:{x:480,y:320},health:100,hunts:0,time:0,cooldown:0,hit:0,bite:0,biteRequested:false,spawn:0,ended:false,result:'',enemies:[],food:[{x:405,y:396},{x:563,y:232}],facing:'S',playerAnimation:'Idle_S',walkTime:0,walkFrame:0};last=0;}
function spawn(){const i=state.hunts+state.enemies.length+Math.floor(state.time);const points=[{x:106,y:220},{x:852,y:272},{x:580,y:110},{x:378,y:554}];state.enemies.push({...points[i%4],touch:0});}
function move(entity,dx,dy,radius){
 const ox=entity.x,oy=entity.y;entity.x=Math.min(914,Math.max(46,entity.x+dx));entity.y=Math.min(566,Math.max(82,entity.y+dy));
 for(const rock of rocks){const x=entity.x-rock.x,y=entity.y-rock.y,dist=Math.hypot(x,y),min=radius+18;if(dist<min){if(dist<.001){entity.x=ox;entity.y=oy;}else{entity.x=rock.x+x/dist*min;entity.y=rock.y+y/dist*min;}}}
}
function step(dt){
 if(!ready||state.ended)return;state.time+=dt;state.cooldown=Math.max(0,state.cooldown-dt);state.hit=Math.max(0,state.hit-dt);state.bite=Math.max(0,state.bite-dt);state.spawn+=dt;
 let dx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),dy=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);const n=Math.hypot(dx,dy);
 const beforeX=state.player.x,beforeY=state.player.y;if(n)move(state.player,dx/n*160*dt,dy/n*160*dt,14);
 const movedX=state.player.x-beforeX,movedY=state.player.y-beforeY;
 const moving=n>0&&Math.hypot(movedX,movedY)>.001;
 if(n){const next=Math.abs(dx)>Math.abs(dy)?(dx>0?'E':'W'):(dy>0?'S':'N');if(next!==state.facing){state.facing=next;state.walkTime=0;state.walkFrame=0;}}
 if(moving){state.playerAnimation='Walk_'+state.facing;state.walkTime=(state.walkTime+dt)%.75;state.walkFrame=Math.min(5,Math.floor(state.walkTime*8));}
 else{state.playerAnimation='Idle_'+state.facing;state.walkTime=0;state.walkFrame=0;}
 if(state.spawn>=3.2&&state.enemies.length<8){state.spawn=0;spawn();}
 if((state.biteRequested||keys.has('Space'))&&state.cooldown===0){state.cooldown=.55;state.bite=.15;const killed=state.enemies.filter(e=>Math.hypot(e.x-state.player.x,e.y-state.player.y)<74);for(const e of killed){state.food.push({x:e.x,y:e.y});state.hunts++;}state.enemies=state.enemies.filter(e=>!killed.includes(e));}state.biteRequested=false;
 for(const enemy of state.enemies){const dx=state.player.x-enemy.x,dy=state.player.y-enemy.y,n=Math.hypot(dx,dy);if(n>25)move(enemy,dx/n*44*dt,dy/n*44*dt,6);enemy.touch=Math.max(0,enemy.touch-dt);if(n<27&&enemy.touch===0){state.health=Math.max(0,state.health-12);state.hit=.18;enemy.touch=1.2;}}
 state.food=state.food.filter(f=>{if(Math.hypot(f.x-state.player.x,f.y-state.player.y)<26){state.health=Math.min(100,state.health+14);return false;}return true;});
 if(state.health<=0){state.ended=true;state.result='RUN ENDED';}else if(state.time>=60){state.ended=true;state.result='DEMO SURVIVED';}
}
function sprite(name,x,y,origin){ctx.drawImage(images[name],Math.round(x)-origin[0],Math.round(y)-origin[1]);}
function draw(){
 if(!ready)return;ctx.imageSmoothingEnabled=false;for(let y=0;y<640;y+=32)for(let x=0;x<960;x+=32)ctx.drawImage(images.grass,x,y);
 for(const f of state.food)sprite('meat',f.x,f.y,[16,16]);
 const objects=[...ferns.map(e=>({...e,name:'fern',origin:[32,36]})),...rocks.map(e=>({...e,name:'rock',origin:[32,36]})),...state.enemies.map(e=>({...e,name:'enemy',origin:[32,54]})),{...state.player,name:'player',origin:playerOrigins[state.facing]}];
 objects.sort((a,b)=>a.y-b.y);for(const o of objects){if(o.name==='player'&&state.hit>0&&Math.floor(state.hit*30)%2===0)continue;const image=o.name==='player'?(state.playerAnimation.startsWith('Walk_')?'walk'+state.facing+state.walkFrame:'idle'+state.facing):o.name;sprite(image,o.x,o.y,o.origin);}
 if(state.bite>0){ctx.strokeStyle='#edd0a0';ctx.lineWidth=2;const x=Math.round(state.player.x),y=Math.round(state.player.y);ctx.strokeRect(x-70,y-70,140,140);}
 document.getElementById('health').style.width=state.health+'%';document.getElementById('hp').textContent=state.health;document.getElementById('hunts').textContent=state.hunts;document.getElementById('time').textContent=Math.max(0,Math.ceil(60-state.time));document.getElementById('status').textContent=state.ended?'Press R to start again':(state.playerAnimation==='Walk_S'?'Walk S Â· frame '+(state.walkFrame+1)+'/6':'Idle S')+' Â· pixel scale 1Ã—';
 if(state.ended){ctx.fillStyle='#151b19';ctx.fillRect(260,240,440,150);ctx.fillStyle='#edd0a0';ctx.font='bold 30px monospace';ctx.textAlign='center';ctx.fillText(state.result,480,297);ctx.font='16px monospace';ctx.fillText(state.hunts+' hunts Â· R to restart',480,337);ctx.textAlign='left';}
}
function frame(now){const dt=last?Math.min((now-last)/1000,.05):0;last=now;step(dt);draw();requestAnimationFrame(frame);}
addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Space')state.biteRequested=true;if(e.code==='KeyR')reset();});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();last=0;});document.addEventListener('visibilitychange',()=>{keys.clear();last=0;});document.getElementById('restart').onclick=()=>{reset();canvas.focus();};
reset();Promise.all(Object.entries(paths).map(([name,path])=>new Promise((resolve,reject)=>{const pic=new Image();pic.onload=()=>{images[name]=pic;resolve();};pic.onerror=()=>reject(Error('Cannot load '+path));pic.src=path;}))).then(()=>{ready=true;spawn();canvas.focus();requestAnimationFrame(frame);}).catch(e=>{document.getElementById('status').textContent=e.message;});
window.primalDemo={getState:()=>state,step,draw,keys};
