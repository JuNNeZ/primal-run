'use strict';
// FEATURES.titleBook + titleTips: the menu opens the title book with counts, and every title on the result card explains
// itself (title attribute on desktop, tap line on touch). Set PRIMAL_SHOTS=<dir> to save screenshots.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
const shots=process.env.PRIMAL_SHOTS;
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const url=process.env.PRIMAL_GAME_URL||await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html'));
 for(const [name,viewport] of [['desktop',{width:1366,height:768}],['mobile',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(url);
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('primalRun.save.v1',JSON.stringify({version:3,settings:{language:'da',languageChosen:true,hudLayoutChosen:true,skipIntro:true,shareData:false},
    titles:{first_blood:{first:'2026-10-10T10:00:00.000Z',count:12},persistent_hunter:{first:'2026-10-12T10:00:00.000Z',count:3},boss_hunter:{first:'2026-10-14T10:00:00.000Z',count:1}}}));});
  await page.reload();await page.waitForSelector('[data-action="titles"]:not(:disabled)');
  assert.match(await page.locator('[data-action="titles"]').innerText(),/3\/\d+/);
  await page.locator('[data-action="titles"]').click();
  assert.equal(await page.locator('.title-entry.done').count(),3);
  assert.match(await page.locator('.title-entry.done',{hasText:'Første Bid'}).innerText(),/Fået 12 gange/);
  assert.ok(await page.locator('.title-entry',{hasText:'???'}).count()>=2,'secret titles are hidden');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal scroll');
  if(shots)await page.screenshot({path:path.join(shots,`titelbog_${name}.png`),fullPage:false});
  await page.locator('[data-action="menu"]').last().click();
  await page.evaluate(()=>{const g=primalRun.game;g.start({seed:7});const r=g.run;r.stats.kills=12;r.seconds=200;g.finish(false);});
  await page.waitForSelector('.run-card');
  const chips=page.locator('.run-card [data-title-tip]');
  if(await chips.count()){
   assert.ok((await chips.first().getAttribute('title')).length>5,'hover text');
   await chips.first().click();assert.doesNotMatch(await page.locator('#title-tip').innerText(),/Tryk på en titel/);
  }
  assert.ok((await page.locator('.run-card .run-title').getAttribute('title')).includes('·'),'primary title has count');
  if(shots)await page.screenshot({path:path.join(shots,`slutskaerm_${name}.png`),fullPage:false});
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('title book browser test passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
