'use strict';
// FEATURES.gamepadFull helpers: pad choice, round dead zone, button names per family, Firefox/Linux layouts, menu navigation.
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../PRIMAL_RUN_Game/src/gamepad.js'),C=require('../PRIMAL_RUN_Game/src/core.js');
const pad=(o={})=>({index:0,id:'',mapping:'standard',connected:true,timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),...o});

test('flag is on and the rumble setting defaults to on but can be saved off',()=>{
  assert.equal(C.FEATURES.gamepadFull,true);
  const store={data:{},getItem(k){return this.data[k]||null;},setItem(k,v){this.data[k]=v;}},game=new C.Game({storage:store});assert.equal(game.save.settings.rumble,true);
  game.setSetting('rumble',false);assert.equal(new C.Game({storage:store}).save.settings.rumble,false);
});
test('controller buttons can be rebound: a taken button swaps, saves survive, reset restores',()=>{
  const store={data:{},getItem(k){return this.data[k]||null;},setItem(k,v){this.data[k]=v;}},g=new C.Game({storage:store});
  assert.deepEqual(g.save.padBindings,C.PAD_BINDING_DEFAULTS);
  assert.deepEqual(g.swapPadBinding('attack','east'),{other:'ability'});assert.equal(g.save.padBindings.ability,'south');
  assert.equal(g.swapPadBinding('attack','menu'),null,'menu is reserved');assert.equal(g.swapPadBinding('up','lt'),null,'moving stays on the stick');
  assert.equal(new C.Game({storage:store}).save.padBindings.attack,'east');
  g.resetPadBinding('attack');assert.deepEqual(g.save.padBindings,C.PAD_BINDING_DEFAULTS);
  store.data[Object.keys(store.data)[0]]=JSON.stringify({...JSON.parse(store.data[Object.keys(store.data)[0]]),padBindings:{attack:'lt',ability:'lt'}});
  assert.deepEqual(new C.Game({storage:store}).save.padBindings,C.PAD_BINDING_DEFAULTS,'a broken save falls back');
});
test('controller families: Xbox, PlayStation, Nintendo by position; unknown and Steam Deck use Xbox names',()=>{
  assert.equal(G.family('Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)'),'xbox');
  assert.equal(G.family('045e-0b12-Microsoft Xbox Series S|X Controller'),'xbox');
  assert.equal(G.family('DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)'),'playstation');
  assert.equal(G.family('Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)'),'nintendo');
  assert.equal(G.family(''),'xbox');
  assert.equal(G.family('Steam Deck Controller'),'deck');assert.equal(G.label('deck','south'),'A');
  assert.equal(G.glyph('xbox','A').bg,'#55a93b');assert.equal(G.glyph('playstation','[○]').button,'east');assert.equal(G.glyph('nintendo','ZR').shape,'pill');assert.equal(G.glyph('xbox','Q'),null);
  assert.equal(G.label('xbox','south'),'A');assert.equal(G.label('playstation','south'),'[✕]');assert.equal(G.label('nintendo','south'),'B');assert.equal(G.label('nintendo','east'),'A');
});
test('round dead zone: rest is zero, diagonals stay diagonal, full tilt reaches 1',()=>{
  assert.deepEqual(G.radial(.1,.1),{x:0,y:0});
  const d=G.radial(.6,.6);assert.ok(Math.abs(d.x-d.y)<1e-9&&d.x>0);
  const f=G.radial(1,0);assert.ok(Math.abs(f.x-1)<1e-9);
});
test('tracker picks the pad that was pressed and ignores a phantom pad resting at -1',()=>{
  const t=G.createTracker(),phantom=pad({index:0,axes:[-1,-1,-1,-1]}),real=pad({index:1});
  assert.equal(t.pick([phantom,real]).index,0); // nothing pressed yet: first standard pad
  real.buttons[0].pressed=true;real.timestamp=5;assert.equal(t.pick([phantom,real]).index,1);
  real.buttons[0].pressed=false;assert.equal(t.pick([phantom,real]).index,1,'stays on the pad that was used');
  assert.equal(t.pick([null,null,phantom]).index,0,'a pad that is gone falls back');
});
test('Firefox without standard mapping: Linux xpad layout and hat-switch D-pad become the standard layout',()=>{
  const linux=pad({mapping:'',axes:[0,0,-1,0,0,1,1,-1],buttons:Array.from({length:11},()=>({pressed:false,value:0}))});linux.buttons[7].pressed=true;
  const n=G.normalize(linux);assert.equal(n.buttons[9],true,'start');assert.equal(n.buttons[7],true,'RT from axis 5');assert.equal(n.buttons[6],false,'LT rests at -1');
  assert.equal(n.buttons[12],true,'D-pad up');assert.equal(n.buttons[15],true,'D-pad right');
  const hat=pad({mapping:'',axes:[0,0,0,0,0,0,0,0,0,-1],buttons:Array.from({length:12},()=>({pressed:false,value:0}))});
  assert.equal(G.normalize(hat).buttons[12],true);hat.axes[9]=1.28;assert.equal(G.normalize(hat).buttons.slice(12,16).some(Boolean),false,'neutral hat');
  assert.equal(G.direction(G.normalize(pad({axes:[.8,.1,0,0]}))),'right');
});
test('every new controller text exists in every full language',()=>{
  const I=require('../PRIMAL_RUN_Game/src/i18n.js');globalThis.PrimalI18n=I;require('../PRIMAL_RUN_Game/src/lang.js');
  const texts=['Spillet er pauset. Vælg med [VENSTRE PIND] og bekræft med A.','Spillet er pauset. Vælg med [VENSTRE PIND] og bekræft med [✕].','Vibration i controller','Controller','Tryk en knap på controlleren · [☰] annullerer','Controller tilsluttet','Controller frakoblet','FORTSÆT · [☰]','[⧉] viser eller skjuler guiden.','NYE VALG · Y · 2 TILBAGE'];
  for(const lang of I.LANGUAGES.filter(l=>!l.fun).map(l=>l.id).filter(l=>l!=='da')){I.setLanguage(lang);I.missing.clear();texts.forEach(t=>I.t(t));assert.deepEqual([...I.missing],[],lang);}
});
test('menu navigation goes to the nearest item in a direction and wraps up/down',()=>{
  const cards=[{x:0,y:0,w:100,h:200},{x:120,y:0,w:100,h:200},{x:240,y:0,w:100,h:200},{x:0,y:240,w:340,h:40}];
  assert.equal(G.navigate(cards,0,'right'),1);assert.equal(G.navigate(cards,1,'right'),2);assert.equal(G.navigate(cards,2,'left'),1);
  assert.equal(G.navigate(cards,1,'down'),3);assert.equal(G.navigate(cards,3,'down'),1,'wraps to the top, to the card straight above');assert.equal(G.navigate(cards,-1,'down'),0);
  const step=G.createRepeater(.3,.1);assert.equal(step('down',0),'down');assert.equal(step('down',.2),'');assert.equal(step('down',.15),'down');assert.equal(step('',0),'');
});
