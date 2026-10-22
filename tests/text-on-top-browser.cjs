'use strict';
// FEATURES.textOnTop: navne, ikoner og livsbjælker tegnes efter alle dybdesorterede sprites, så et dyr længere nede aldrig dækker teksten.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
async function order(page,flag){
  return page.evaluate(async flag=>{const g=primalRun.game;PrimalCore.FEATURES.textOnTop=flag;g.start({seed:33});const r=g.run;r.enemies=[];r.map.sites=[];r.map.events=[];r.spawnTimer=999;r.invulnerable=999;
    const p=r.player,a=g.spawn('gallimimus',{x:p.x+40,y:p.y-30}),b=g.spawn('triceratops',{x:p.x+40,y:p.y+10});for(const e of [a,b]){e.speed=0;e.mode='idle';e.hp=e.maxHP*.5;}
    const ctx=document.querySelector('canvas[aria-label]:not(.end-scene)').getContext('2d'),log=[],dI=ctx.drawImage,fT=ctx.fillText;
    ctx.drawImage=function(...x){log.push('img');return dI.apply(this,x);};ctx.fillText=function(t,...x){log.push('txt:'+t);return fT.call(this,t,...x);};
    await new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res)));delete ctx.drawImage;delete ctx.fillText;g.pause();
    const names=[a,b].map(e=>log.findIndex(s=>s.startsWith('txt:')&&s.toUpperCase().includes(e.name?e.name.toUpperCase():e.kind.toUpperCase())));
    const last=Math.max(...names),first=Math.min(...names);return {names,between:log.slice(first,last).filter(s=>s==='img').length,sample:log.filter(s=>s.startsWith('txt:')).slice(0,12)};
  },flag);
}
(async()=>{const browser=await chromium.launch(browserOptions());const errors=[];try{const page=await browser.newPage({viewport:{width:1280,height:900}});page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(process.env.PRIMAL_GAME_URL||await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{});await page.waitForFunction(()=>window.primalRun&&primalRun.ready);
  const off=await order(page,false),on=await order(page,true);console.log(JSON.stringify({off,on}));
  assert.ok(off.names.every(i=>i>=0)&&on.names.every(i=>i>=0),'both name labels are drawn');
  assert.ok(off.between>0,'flag off: the lower animal is drawn between the two labels (the old bug)');
  assert.equal(on.between,0,'flag on: no sprite is drawn between the name labels of the sorted pass');
  assert.deepEqual(errors,[]);console.log('PASS: world text and bars draw above every depth-sorted sprite');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
