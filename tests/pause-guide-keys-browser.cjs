'use strict';
// FEATURES.pauseGuide + keybindMenu in the real page: Esc shows the guide with the species and the player's keys, the
// guide folds away (button and H) and stays folded, the keyboard page swaps a taken key, resets, and hints follow it.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
const shots=process.env.PRIMAL_SHOTS;
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const url=process.env.PRIMAL_GAME_URL||await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html'));
 const open=async(opts,settings)=>{const page=await browser.newPage(opts),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(url);await page.evaluate(s=>{localStorage.clear();localStorage.setItem('primalRun.save.v1',JSON.stringify({version:2,settings:{language:'da',languageChosen:true,hudLayoutChosen:true,...s}}));},settings);await page.reload();await page.waitForSelector('[data-action="start"]:not(:disabled)');page.errors=errors;return page;};
 const play=async page=>{await page.locator('[data-action="start"]').click();await page.locator('[data-action="begin"]').click();await page.waitForFunction(()=>primalRun.game.phase==='playing');await page.waitForTimeout(200);};
 const snap=async(page,name)=>{if(shots)await page.screenshot({path:path.join(shots,name+'.png')});};
 let page=await open({viewport:{width:1366,height:900}},{});
 await play(page);await page.keyboard.press('Escape');await page.waitForSelector('.pause-guide:not(.folded)');
 const guide=await page.locator('.pause-guide').innerText();
 assert.match(guide,/Sådan spiller du/i);assert.match(guide,/Dine knapper/i);assert.match(guide,/SPACE/);assert.match(guide,/WASD/);
 assert.equal(await page.locator('.pause-keys kbd').first().textContent(),'WASD');
 await snap(page,'1_pause_guide');
 await page.locator('[data-action="toggle-guide"]').click();await page.waitForSelector('.pause-guide.folded');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('primalRun.save.v1')).settings.pauseGuide),false,'folded guide is saved');
 await snap(page,'2_pause_folded');
 await page.keyboard.press('KeyH');await page.waitForSelector('.pause-guide:not(.folded)');
 // Keyboard page from the pause screen: Q goes to attack, the pack command gets Space, the toast names the swap.
 await page.locator('[data-action="keys"]').click();await page.waitForSelector('.keys-panel');
 await page.locator('[data-binding="attack"]').click();await page.keyboard.press('KeyQ');
 assert.deepEqual(await page.evaluate(()=>[primalRun.game.save.bindings.attack,primalRun.game.save.bindings.command]),['KeyQ','Space']);
 assert.match(await page.locator('.toast').textContent(),/Byttet med Flok/);
 await page.locator('[data-binding="eat"]').click();await page.keyboard.press('Digit7');
 assert.equal(await page.evaluate(()=>primalRun.game.save.bindings.eat),'Digit7');
 assert.equal(await page.locator('[data-binding="eat"] kbd').textContent(),'7');
 assert.equal(await page.locator('[data-reset-binding="up"]').isDisabled(),true,'an unchanged key has nothing to reset');
 await snap(page,'3_keys_menu');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>primalRun.game.phase==='paused');
 assert.equal(await page.locator('.pause-keys div:has-text("Angreb") kbd').textContent(),'Q','the guide shows the new key');
 // The new key attacks in play; the old one no longer does.
 await page.keyboard.press('Escape');await page.waitForFunction(()=>primalRun.game.phase==='playing');
 const attacks=async code=>page.evaluate(async code=>{const g=primalRun.game,orig=g.step.bind(g);let hit=false;g.step=(dt,input)=>{if(input.attack)hit=true;return orig(dt,input);};window.dispatchEvent(new KeyboardEvent('keydown',{code}));await new Promise(r=>setTimeout(r,120));window.dispatchEvent(new KeyboardEvent('keyup',{code}));g.step=orig;return hit;},code);
 assert.equal(await attacks('KeyQ'),true);assert.equal(await page.evaluate(()=>primalRun.game.save.settings.autoAttack),false);
 // Reset all from Settings.
 await page.keyboard.press('Escape');await page.locator('[data-action="settings"]').click();await page.locator('.settings [data-action="keys"]').click();
 await page.locator('[data-action="reset-bindings"]').click();
 assert.deepEqual(await page.evaluate(()=>primalRun.game.save.bindings.attack),'Space');
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>primalRun.game.phase),'settings');
 assert.deepEqual(page.errors,[]);await page.close();
 // English and phone width: translated guide, stacked under the pause panel, no horizontal overflow.
 page=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true},{language:'en'});
 await play(page);await page.evaluate(()=>{primalRun.game.pause();});await page.waitForSelector('.pause-guide');
 const text=await page.locator('.pause-guide').innerText();assert.match(text,/How to play/i);assert.match(text,/Your controls/i);assert.doesNotMatch(text,/Dine knapper|Skjul guide|Nedlæg|ved liget/);
 assert.ok(await page.evaluate(()=>{const s=document.querySelector('.screen');return s.scrollWidth<=s.clientWidth+1;}),'no sideways scroll on a phone');
 await snap(page,'4_phone_en');
 assert.deepEqual(page.errors,[]);await page.close();
 console.log('PASS: pause guide (fold, H, saved), keyboard page (swap, digit, reset), hints follow, phone + English');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
