'use strict';
// FEATURES.hudLayouts + mapBiomes: the hunt intro offers A/B/C on PC until one is chosen, each layout shows its own HUD
// without overlaps, Settings can switch back to classic, touch keeps the classic HUD and the minimap is painted in biome colours.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const url=process.env.PRIMAL_GAME_URL||await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html'));
 const open=async(opts,settings)=>{const page=await browser.newPage(opts),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(url);await page.evaluate(s=>{localStorage.clear();localStorage.setItem('primalRun.save.v1',JSON.stringify({version:2,settings:{language:'da',languageChosen:true,...s}}));},settings);await page.reload();await page.waitForSelector('[data-action="start"]:not(:disabled)');page.errors=errors;return page;};
 const play=async page=>{await page.locator('[data-action="begin"]').click();await page.waitForFunction(()=>primalRun.game.phase==='playing');await page.waitForTimeout(250);};
 const box=(page,sel)=>page.evaluate(s=>{const e=document.querySelector(s);if(!e||e.hidden||!e.offsetParent&&getComputedStyle(e).position!=='fixed')return null;const b=e.getBoundingClientRect();return b.width&&b.height?{x:b.x,y:b.y,r:b.right,b:b.bottom}:null;},sel);
 const overlap=(a,b)=>a&&b&&a.x<b.r&&b.x<a.r&&a.y<b.b&&b.y<a.b;
 // First run on PC: the picker is in the intro; picking B saves it and the run uses layout B.
 let page=await open({viewport:{width:1366,height:768}},{});
 await page.locator('[data-action="start"]').click();
 assert.deepEqual(await page.locator('.hunt-intro [data-hud-pick]').evaluateAll(b=>b.map(x=>x.dataset.hudPick)),['a','b','c']);
 await page.locator('[data-hud-pick="b"]').click();
 assert.equal(await page.locator('[data-hud-pick="b"]').getAttribute('aria-pressed'),'true','picker stays open with B marked');
 assert.deepEqual(await page.evaluate(()=>[primalRun.game.save.settings.hudLayout,primalRun.game.save.settings.hudLayoutChosen,JSON.parse(localStorage.getItem('primalRun.save.v1')).settings.hudLayout]),['b',true,'b']);
 await play(page);
 assert.equal(await page.evaluate(()=>document.querySelector('.primal-shell').dataset.hud),'b');
 assert.ok(await box(page,'.hud-top'),'B shows the XP line along the top');assert.equal(await box(page,'.run-info'),null);assert.equal(await box(page,'.meat-progress'),null);assert.equal(await box(page,'.hud-card'),null);
 assert.deepEqual(await page.locator('.hud-actions [data-slot]').evaluateAll(s=>s.filter(x=>x.offsetParent).map(x=>x.dataset.slot)),['attack','ability']);
 // The next run does not ask again.
 await page.evaluate(()=>{primalRun.game.phase='menu';});await page.waitForSelector('[data-action="start"]:not(:disabled)');await page.locator('[data-action="start"]').click();
 assert.equal(await page.locator('.hunt-intro [data-hud-pick]').count(),0,'the picker only shows until a layout is chosen');
 assert.deepEqual(page.errors,[]);await page.close();
 // Every layout at two PC sizes: own parts visible, no overlap between the HUD blocks, minimap in biome colours.
 for(const [width,height] of [[1920,1080],[1366,768]])for(const layout of ['a','b','c']){
  page=await open({viewport:{width,height}},{hudLayout:layout,hudLayoutChosen:true});
  await page.locator('[data-action="start"]').click();assert.equal(await page.locator('.hunt-intro [data-hud-pick]').count(),0);await play(page);
  assert.equal(await page.evaluate(()=>document.querySelector('.primal-shell').dataset.hud),layout);
  const parts={card:await box(page,'.hud-card'),goal:await box(page,'.hunt-counter'),actions:await box(page,'.hud-actions'),top:await box(page,'.hud-top'),arena:await box(page,'.arena')};
  assert.ok(parts.actions&&parts.goal,`${layout} ${width}: action bar and goal are visible`);
  assert.equal(!!parts.card,layout!=='b');assert.equal(!!parts.top,layout==='b');
  for(const k of ['card','goal','actions'])if(parts[k])assert.ok(parts[k].x>=parts.arena.x&&parts[k].r<=parts.arena.r+1&&parts[k].b<=parts.arena.b+1,`${layout} ${width}: ${k} stays inside the arena`);
  if(layout!=='c')for(const [a,b] of [['card','goal'],['card','actions'],['goal','actions']])assert.ok(!overlap(parts[a],parts[b]),`${layout} ${width}: ${a} overlaps ${b}`);
  assert.equal(await page.evaluate(()=>document.querySelector('.hud-actions [data-slot="attack"] kbd').textContent),'SPACE');
  // Minimap: reveal the map; it must show several land colours, not just the dark fill.
  const colours=await page.evaluate(()=>new Promise(done=>{const r=primalRun.game.run;for(let x=0;x<60;x++)for(let y=0;y<60;y++)r.explored[x+','+y]=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{let c=document.querySelector('.arena canvas'),[x,y,w,h]=c.dataset.minimap.split(',').map(Number),d=c.getContext('2d').getImageData(x+2,y+2,w-4,h-4).data,lit=0,n=0;for(let i=0;i<d.length;i+=4){n++;if(d[i]+d[i+1]+d[i+2]>150)lit++;}done(lit/n);}));}));
  assert.ok(colours>.5,`${layout} ${width}: the revealed minimap is painted in land colours (${colours.toFixed(2)})`);
  assert.deepEqual(page.errors,[]);await page.close();
 }
 // Settings lists all four layouts; picking classic brings the original HUD back.
 page=await open({viewport:{width:1280,height:900}},{hudLayout:'a',hudLayoutChosen:true});
 await page.locator('[data-action="settings"]').click();
 assert.deepEqual(await page.locator('[data-hud-pick]').evaluateAll(b=>b.map(x=>x.dataset.hudPick)),['classic','a','b','c']);
 await page.locator('[data-hud-pick="classic"]').click();assert.equal(await page.evaluate(()=>primalRun.game.save.settings.hudLayout),'classic');
 await page.locator('[data-action="back"]').click();await page.locator('[data-action="start"]').click();await play(page);
 assert.equal(await page.evaluate(()=>document.querySelector('.primal-shell').dataset.hud),'classic');assert.ok(await box(page,'.run-info'));assert.equal(await box(page,'.hud-actions'),null);
 assert.deepEqual(page.errors,[]);await page.close();
 // Touch keeps the classic HUD and never shows the picker.
 page=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true},{hudLayout:'c',hudLayoutChosen:false});
 await page.locator('[data-action="start"]').click();assert.equal(await page.locator('[data-hud-pick]').count(),0);await play(page);
 assert.equal(await page.evaluate(()=>document.querySelector('.primal-shell').dataset.hud),'classic');assert.equal(await box(page,'.hud-actions'),null);
 assert.deepEqual(page.errors,[]);await page.close();
 console.log('PASS: HUD layout picker, layouts A/B/C on PC, classic in settings and on touch, biome-coloured minimap');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
