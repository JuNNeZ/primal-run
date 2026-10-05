// Runs every Game frame. The builder prepends balance.json and the kernel.
if(!runtimeScene.__primal) {
  const core=createPrimalCore(PRIMAL_BALANCE);
  runtimeScene.__primal={core,previous:new Set(),enemies:new Map(),food:new Map(),savedDNA:0,lastAwardedState:null};
  try { runtimeScene.__primal.savedDNA=Math.max(0,Number(localStorage.getItem('primalRunGDevelopDNA'))||0); } catch(_) {}
}
const a=runtimeScene.__primal, core=a.core;
const input=runtimeScene.getGame().getInputManager();
const codes=[87,65,83,68,37,38,39,40,16,32,49,50,51,82];
const now=new Set(codes.filter(k=>input.isKeyPressed(k)));
const pressed=k=>now.has(k)&&!a.previous.has(k);
let transition=false;
if(pressed(82)){core.reset();transition=true;}
else if(core.state.phase==='mutation'){
  if(pressed(49))transition=core.choose('teeth');
  else if(pressed(50))transition=core.choose('legs');
  else if(pressed(51))transition=core.choose('feathers');
}
if(!transition)core.tick(runtimeScene.getTimeManager().getElapsedTime()/1000,{
  up:now.has(87)||now.has(38),down:now.has(83)||now.has(40),left:now.has(65)||now.has(37),right:now.has(68)||now.has(39),bite:now.has(32),pounce:now.has(16)
});
a.previous=now;
const s=core.state;
if(s.awarded&&a.lastAwardedState!==s){a.lastAwardedState=s;a.savedDNA+=s.dna;try{localStorage.setItem('primalRunGDevelopDNA',String(a.savedDNA));}catch(_){}}
const player=runtimeScene.getObjects('Player')[0];
player.setPosition(Math.round(s.player.x),Math.round(s.player.y));
player.setAnimationName(s.animation);player.pauseAnimation();player.setAnimationFrame(s.frame);player.setZOrder(Math.round(s.player.y));
// Explicit frame clocks keep ALL visuals fixed while mutation selection is open.
const slash=runtimeScene.getObjects('BiteEffect')[0];
slash.setPosition(Math.round(s.player.x),Math.round(s.player.y));slash.pauseAnimation();slash.setAnimationFrame(1);slash.hide(s.bite<=0);slash.setZOrder(900);
function sync(list,map,name) {
  const ids=new Set(list.map(e=>e.id));
  for(const [id,o] of map)if(!ids.has(id)){o.deleteFromScene(runtimeScene);map.delete(id);}
  for(const e of list){let o=map.get(e.id);if(!o){o=runtimeScene.createObject(name==='Compy'?(e.kind==='carnotaurus'?'Carnotaurus':e.kind==='parasaurolophus'?'Parasaurolophus':'Compy'):name);map.set(e.id,o);o.pauseAnimation();}
    o.setPosition(Math.round(e.x),Math.round(e.y));o.setZOrder(name==='Food'?5:Math.round(e.y));
  }
}
sync(s.enemies,a.enemies,'Compy');sync(s.food,a.food,'Food');
const panel=runtimeScene.getObjects('ChoiceBackdrop')[0];panel.setScaleX(24);panel.setScaleY(10);panel.setColor('21;27;25');panel.setOpacity(245);panel.hide(s.phase==='playing');
const hud=runtimeScene.getObjects('HUD')[0];
hud.setString('HP '+Math.ceil(s.hp)+' / '+PRIMAL_BALANCE.player.hp+'   XP '+s.xp+' / '+s.nextXP+'   LEVEL '+s.level+'   STAMINA '+Math.round(s.stamina)+'   DNA '+a.savedDNA+'\nTeeth '+s.mutations.teeth+'  Legs '+s.mutations.legs+'  Feathers '+s.mutations.feathers+'   Hunts '+s.hunts+'\nWASD / piletaster: bevæg   Space: bid   Shift: spring   R: genstart');
const overlay=runtimeScene.getObjects('Choices')[0];
overlay.hide(s.phase==='playing');
overlay.setString(s.phase==='mutation'?'MUTATION — ALT GAMEPLAY ER PAUSET\n\n1  Tænder: blødning, flere stacks giver mere skade\n2  Ben: +15% fart pr. stack\n3  Fjer: +20% stamina-regen pr. stack\n\nTryk 1, 2 eller 3. R starter et nyt run.':'RUN SLUT\n\n'+s.hunts+' jagter  |  +'+s.dna+' DNA\n\nTryk R for at starte igen.');
// Variables are mirrored for GDevelop's debugger/event editor.
for(const [name,value] of Object.entries({HP:s.hp,XP:s.xp,NextXP:s.nextXP,Level:s.level,Teeth:s.mutations.teeth,Legs:s.mutations.legs,Feathers:s.mutations.feathers,DNA:a.savedDNA,Stamina:s.stamina,RunTime:s.time}))runtimeScene.getVariables().get(name).setNumber(value);
runtimeScene.getVariables().get('Phase').setString(s.phase);
