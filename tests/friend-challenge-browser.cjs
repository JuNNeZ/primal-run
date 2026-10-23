'use strict';
// FEATURES.friendChallenge in the real page: a #udfordring= link shows the challenge in the menu, accepting starts the
// challenger's seed, and the result screen compares scores and offers a new challenge link.
const assert=require('node:assert/strict'),path=require('node:path');const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
const C=require('../PRIMAL_RUN_Game/src/core.js');
const shots=process.env.FRIEND_SHOTS||'';
(async()=>{
 const g=new C.Game();g.save.name='Mikkel';g.start({seed:777});for(let i=0;i<60*20;i++)g.step(1/60,{x:i<600?1:0,y:i<600?.2:1});g.finish(false);
 const code=C.encodeChallenge(g.run);
 const browser=await chromium.launch(browserOptions());try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html'))+'#udfordring='+code);await page.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{});
  await page.waitForSelector('[data-action="start"]:not(:disabled)');
  assert.match(await page.locator('.friend-challenge').innerText(),/Mikkel udfordrer dig!/);
  if(shots)await page.screenshot({path:shots+'/menu.png'});
  await page.locator('[data-action="friend-accept"]').click();
  const begin=page.locator('[data-action="begin"]');if(await begin.count())await begin.click();
  await page.waitForFunction(()=>!document.querySelector('.screen .panel')||document.querySelector('.hud'),null,{timeout:20000});
  await page.waitForTimeout(800);await page.keyboard.down('d');await page.waitForTimeout(2500);await page.keyboard.up('d');
  if(shots)await page.screenshot({path:shots+'/ghost.png'});
  await page.keyboard.press('Escape');await page.waitForSelector('[data-action="abandon"]');
  assert.match(await page.locator('.screen').innerText(),/777/,'the challenger seed is used');
  await page.locator('[data-action="abandon"]').click();await page.waitForSelector('[data-action="friend-share"]');
  assert.match(await page.locator('.friend-result').innerText(),/Mikkel|Uafgjort/);
  if(shots)await page.screenshot({path:shots+'/result.png'});
  assert.deepEqual(errors,[]);console.log('friend-challenge-browser: ok');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
