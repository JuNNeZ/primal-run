'use strict';
// FEATURES.coopBuddy in the real page: the menu toggle starts a run with player 2's raptor, which moves on IJKL.
const assert=require('node:assert/strict'),path=require('node:path');const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
const shots=process.env.FRIEND_SHOTS||'';
(async()=>{const browser=await chromium.launch(browserOptions());try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{});
  await page.waitForSelector('[data-action="start"]:not(:disabled)');
  await page.locator('#coop-buddy').check();await page.locator('[data-action="start"]').click();
  const begin=page.locator('[data-action="begin"]');if(await begin.count())await begin.click();
  await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.buddy,null,{timeout:20000});
  const before=await page.evaluate(()=>document.querySelector('canvas').dataset.buddy);
  await page.keyboard.down('KeyL');await page.waitForTimeout(1200);await page.keyboard.up('KeyL');
  const after=await page.evaluate(()=>document.querySelector('canvas').dataset.buddy);
  assert.ok(Number(after.split(',')[0])>Number(before.split(',')[0])+80,'player 2 walked right: '+before+' -> '+after);
  if(shots)await page.screenshot({path:shots+'/coop.png'});
  assert.deepEqual(errors,[]);console.log('coop-buddy-browser: ok');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
