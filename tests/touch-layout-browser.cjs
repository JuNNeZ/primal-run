'use strict';
// Touch play fills the screen: joystick and the round button diamond sit on the game in portrait and landscape,
// stay inside the viewport, do not cover each other, and the page never scrolls sideways.
const assert=require('node:assert/strict'),path=require('node:path');const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  const ctx=await browser.newContext({viewport,isMobile:true,hasTouch:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{});
  await page.waitForSelector('[data-action="start"]:not(:disabled)');await page.locator('[data-action="start"]').click();await page.locator('[data-action="begin"]').click();await page.waitForTimeout(500);
  const out=await page.evaluate(()=>{const box=e=>e.getBoundingClientRect(),q=s=>document.querySelector(s),arena=box(q('.arena')),joy=box(q('.joystick'));
    const pads=['.pad-a','.pad-b','.pad-x','.pad-y'].map(s=>{const b=box(q(s)),c=getComputedStyle(q(s));return {s,l:b.left,t:b.top,r:b.right,b:b.bottom,w:b.width,h:b.height,radius:c.borderRadius};});
    return {input:q('.primal-shell').dataset.input,arena:{w:arena.width,h:arena.height},joy:{l:joy.left,b:joy.bottom,r:joy.right},pads,fixed:getComputedStyle(q('.touch-controls')).position,scroll:document.documentElement.scrollWidth,footer:getComputedStyle(q('footer')).display,pause:box(q('#pause-button'))};});
  const tag=viewport.width+'x'+viewport.height;
  assert.equal(out.input,'touch',tag);assert.equal(out.fixed,'fixed',tag+' controls overlay the game');assert.equal(out.footer,'none',tag);
  assert.ok(out.arena.w>=viewport.width-1&&out.arena.h>=viewport.height-1,tag+' arena fills the screen '+JSON.stringify(out.arena));
  assert.ok(out.scroll<=viewport.width,tag+' no sideways scroll');
  assert.ok(out.joy.l>=0&&out.joy.b<=viewport.height&&out.joy.r<viewport.width/2,tag+' joystick bottom-left');
  for(const p of out.pads){assert.ok(p.l>=0&&p.r<=viewport.width&&p.b<=viewport.height&&p.l>viewport.width/2,tag+' '+p.s+' inside, right half');assert.ok(Math.abs(p.w-p.h)<1&&p.radius==='50%',tag+' '+p.s+' round');}
  const [a,b,x,y]=out.pads;assert.ok(a.l>y.r&&x.b<=b.t,tag+' diamond: A right of Y, X above B');
  const overlap=(p,q)=>p.l<q.r&&q.l<p.r&&p.t<q.b&&q.t<p.b;const c=p=>({x:(p.l+p.r)/2,y:(p.t+p.b)/2});for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){const p=c(out.pads[i]),q=c(out.pads[j]);assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>=(out.pads[i].w+out.pads[j].w)/2,tag+' round pads do not overlap');}
  assert.ok(!out.pads.some(p=>overlap(p,{l:out.pause.left,r:out.pause.right,t:out.pause.top,b:out.pause.bottom})),tag+' pause clear of the pad');
  assert.deepEqual(errors,[]);await ctx.close();
 }
 console.log(JSON.stringify({result:'PASS',engine:'Chrome browser; GDevelop NOT RUN',checks:['full-screen arena on touch','joystick bottom-left','round SNES-style diamond bottom-right','no overlap, no sideways scroll','portrait + landscape']}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
