from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'PRIMAL_RUN_Prototype_Kit'
js=(ROOT/'PRIMAL_RUN_Demo_v5/demo.js').read_text(encoding='utf-8')
js=js.replace('/* PRIMAL RUN v5: four cardinal walk prototypes. */','/* PRIMAL RUN offline kit: XP, mutations, stamina and local DNA prototypes. */')
js=js.replace('const images={},keys=',"paths.xp='assets/ui/xp.png';paths.slash='assets/effects/bite_slash_001.png';paths.parasaurolophus='assets/enemies/parasaurolophus_idle_S_000.png';paths.carnotaurus='assets/enemies/carnotaurus_idle_S_000.png';\nconst images={},keys=")
js=js.replace('function reset(){', '''let savedDNA=0;try{savedDNA=Math.max(0,Number(localStorage.getItem('primalRunPrototypeDNA'))||0);}catch(e){}
function awardDNA(){if(state.awarded)return;state.awarded=true;state.runDNA=Math.floor(state.hunts/2)+Math.floor(state.time/15)+(state.health>0?10:0);savedDNA+=state.runDNA;try{localStorage.setItem('primalRunPrototypeDNA',String(savedDNA));}catch(e){} }
function gainXP(amount){state.xp+=amount;if(state.xp>=state.nextXP){state.xp-=state.nextXP;state.level++;state.nextXP+=4;state.paused=true;keys.clear();document.getElementById('choices').hidden=false;}}
function chooseMutation(which){if(!state.paused||!['teeth','legs','feathers'].includes(which))return;state.mutations[which]++;state.paused=false;keys.clear();document.getElementById('choices').hidden=true;if(state.xp>=state.nextXP)gainXP(0);last=0;}
function reset(){document.getElementById('choices').hidden=true;''')
js=js.replace("facing:'S',playerAnimation", "xp:0,nextXP:8,level:1,paused:false,mutations:{teeth:0,legs:0,feathers:0},stamina:100,pounce:0,pounceCooldown:0,runDNA:0,awarded:false,facing:'S',playerAnimation")
js=js.replace("state.enemies.push({...points[i%4],touch:0});", "const kind=state.time>=20&&i%3===0?'carnotaurus':state.time>=10&&i%3===1?'parasaurolophus':'enemy';state.enemies.push({...points[i%4],touch:0,kind,hp:kind==='carnotaurus'?3:kind==='parasaurolophus'?2:1,bleed:0,bleedTick:0});")
js=js.replace('if(!ready||state.ended)return;state.time+=dt;', '''if(!ready||state.ended||state.paused)return;state.time+=dt;
 state.pounce=Math.max(0,state.pounce-dt);state.pounceCooldown=Math.max(0,state.pounceCooldown-dt);state.stamina=Math.min(100,state.stamina+dt*18*(1+.2*state.mutations.feathers));
 if((keys.has('ShiftLeft')||keys.has('ShiftRight'))&&state.pounceCooldown===0&&state.stamina>=30){state.stamina-=30;state.pounce=.25;state.pounceCooldown=2;}
''')
js=js.replace('dx/n*160*dt,dy/n*160*dt','dx/n*160*(1+.15*state.mutations.legs)*(state.pounce>0?2.3:1)*dt,dy/n*160*(1+.15*state.mutations.legs)*(state.pounce>0?2.3:1)*dt')
start=js.index(" if((state.biteRequested");end=js.index(' state.food=state.food.filter',start)
js=js[:start]+''' if((state.biteRequested||keys.has('Space'))&&state.cooldown===0){
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
'''+js[end:]
js=js.replace("state.result='RUN ENDED';", "state.result='RUN ENDED';awardDNA();").replace("state.result='DEMO SURVIVED';", "state.result='DEMO SURVIVED';awardDNA();")
js=js.replace("...state.enemies.map(e=>({...e,name:'enemy',origin:[32,54]}))", "...state.enemies.map(e=>({...e,name:e.kind||'enemy',origin:e.kind==='carnotaurus'||e.kind==='parasaurolophus'?[48,64]:[32,54]}))")
js=js.replace("ctx.strokeRect(x-70,y-70,140,140);", "sprite('slash',x,y,[48,48]);")
js=js.replace(" if(state.ended){ctx.fillStyle", " document.getElementById('progress').textContent='LEVEL '+state.level+' · XP '+state.xp+'/'+state.nextXP+' · STAMINA '+Math.round(state.stamina)+' · DNA '+savedDNA+' · Teeth '+state.mutations.teeth+' / Legs '+state.mutations.legs+' / Feathers '+state.mutations.feathers;\n if(state.ended){ctx.fillStyle")
status_start=js.index("document.getElementById('status').textContent=")
status_end=js.index(';',status_start)
js=js[:status_start]+"document.getElementById('status').textContent=state.ended?'Press R to start again':(state.playerAnimation.startsWith('Walk_')?'Walk '+state.facing+' · frame '+(state.walkFrame+1)+'/6':'Idle '+state.facing)+' · pixel scale 1×'"+js[status_end:]
reward_start=js.index('ctx.fillText(state.hunts+')
reward_end=js.index(',480,337);',reward_start)
js=js[:reward_start]+"ctx.fillText(state.hunts+' hunts · +'+state.runDNA+' DNA · R to restart'"+js[reward_end:]
js=js.replace("keys.add(e.code);if(e.code==='Space')", "if(state.paused){if(e.code==='Digit1')chooseMutation('teeth');if(e.code==='Digit2')chooseMutation('legs');if(e.code==='Digit3')chooseMutation('feathers');if(e.code==='KeyR')reset();return;}keys.add(e.code);if(e.code==='Space')")
js=js.replace('reset();Promise.all(', "document.querySelectorAll('[data-mutation]').forEach(b=>b.onclick=()=>chooseMutation(b.dataset.mutation));\nreset();Promise.all(")
js=js.replace('window.primalDemo={getState:()=>state,step,draw,keys};','window.primalDemo={getState:()=>state,step,draw,keys,gainXP,chooseMutation,getDNA:()=>savedDNA};')
(OUT/'demo.js').write_text(js,encoding='utf-8')
ht=(ROOT/'PRIMAL_RUN_Demo_v5/demo.html').read_text(encoding='utf-8').replace('south walk demo v5','offline prototype kit').replace('WALK DEMO V5','OFFLINE KIT').replace('FOUR DIRECTIONS PROTOTYPE','FERN FOREST / MUTATION PROTOTYPE')
ht=ht.replace('</style>', '''#choices[hidden]{display:none}#choices{position:fixed;inset:0;z-index:10;background:#151b19ed;display:flex;align-items:center;justify-content:center}.choicebox{max-width:900px;padding:30px}.choicebox h2{font-size:28px}.choicegrid{display:flex;gap:16px}.choicegrid button{margin:0;width:260px;padding:20px;text-align:left}.choicegrid img{display:block;width:64px;height:64px;image-rendering:pixelated;margin-bottom:16px}.choicegrid b{display:block;font-size:19px}.choicegrid span{display:block;margin-top:12px;line-height:1.6}
</style>''')
ht=ht.replace('<canvas id="game"', '<p id="progress">Loading progression…</p><canvas id="game"')
ht=ht.replace('<script src="demo.js">', '''<div id="choices" role="dialog" aria-modal="true" aria-labelledby="choiceTitle" hidden><div class="choicebox"><h2 id="choiceTitle">LEVEL UP — vælg én mutation</h2><p>Verden er sat på pause. Klik eller tryk 1, 2 eller 3.</p><div class="choicegrid"><button data-mutation="teeth"><img src="assets/ui/serrated_teeth.png" alt=""><b>1 · Serrated Teeth</b><span>Bite giver bleed. Hvert stack gør bleed stærkere.</span></button><button data-mutation="legs"><img src="assets/ui/powerful_legs.png" alt=""><b>2 · Powerful Legs</b><span>+15% grundhastighed pr. stack.</span></button><button data-mutation="feathers"><img src="assets/ui/insulating_feathers.png" alt=""><b>3 · Insulating Feathers</b><span>+20% stamina-regeneration pr. stack.</span></button></div></div></div>
<script src="demo.js">''')
ht=ht.replace('FERN FOREST / FERN FOREST / MUTATION PROTOTYPE','FERN FOREST / MUTATION PROTOTYPE')
ht=ht.replace('meat: heal','meat: heal &nbsp; <kbd>SHIFT</kbd>: pounce')
ht=ht.replace('Dette er en browserdemo; PNG-filerne', 'Efter to Compy-jagter får du første mutation. DNA gemmes lokalt i denne browser. Dette er en browserdemo; PNG-filerne')
for preview in (ROOT/'PRIMAL_RUN_Demo_v5').glob('walk*.gif'):
    shutil.copy2(preview,OUT/'previews'/preview.name)
ht=ht.replace('href="walk_loop_dark.gif"','href="previews/walk_loop_dark.gif"')
(OUT/'demo.html').write_text(ht,encoding='utf-8')
print('Extended browser demo with XP, mutation pause, stacks, stamina pounce, predator/prey HP and local DNA.')
