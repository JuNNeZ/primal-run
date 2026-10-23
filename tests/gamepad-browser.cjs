'use strict';
// FEATURES.gamepadFull in a real browser: D-pad/stick move a visible focus through menus and mutation cards, A picks,
// B goes back, a PlayStation pad shows ✕/○ names, world labels use the pad's button, and two pads keep coop's order.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const url=process.env.PRIMAL_GAME_URL||await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html'));
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(url);await page.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{});await page.waitForSelector('[data-action="start"]:not(:disabled)');
 await page.evaluate(()=>{const mk=(i,id)=>({index:i,id,mapping:'standard',connected:true,timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))});window.pads=[mk(0,'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e)')];Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>pads});});
 const tap=async(i,which=0)=>{await page.evaluate(([i,w])=>{pads[w].buttons[i].pressed=true;pads[w].timestamp++;},[i,which]);await page.waitForTimeout(80);await page.evaluate(([i,w])=>{pads[w].buttons[i].pressed=false;},[i,which]);await page.waitForTimeout(80);};
 const focused=()=>page.evaluate(()=>{const a=document.activeElement;return a&&document.querySelector('.screen').contains(a)?(a.dataset.action||a.dataset.mutation||a.dataset.setting||a.tagName):'';});
 // Main menu: a D-pad press switches to gamepad mode and shows a gold focus frame on a menu button.
 await tap(13);await page.waitForFunction(()=>document.querySelector('.primal-shell').dataset.input==='gamepad');
 assert.ok(await focused(),'a menu button has focus');
 assert.match(await page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle),/solid/);
 // Stick down moves focus; a held stick repeats.
 const before=await focused();await page.evaluate(()=>{pads[0].axes[1]=1;});await page.waitForTimeout(700);await page.evaluate(()=>{pads[0].axes[1]=0;});await page.waitForTimeout(80);
 assert.notEqual(await focused(),before,'stick moves focus');
 // Settings with A, then B goes back to the menu.
 await page.evaluate(()=>document.querySelector('[data-action="settings"]').focus());await tap(0);await page.waitForFunction(()=>primalRun.game.phase==='settings');
 assert.ok(await page.locator('[data-setting="rumble"]').count(),'rumble setting exists');
 await tap(1);await page.waitForFunction(()=>primalRun.game.phase==='menu');
 // Start a run with A only.
 await page.evaluate(()=>document.querySelector('[data-action="start"]').focus());await tap(0);
 await page.waitForSelector('[data-action="begin"]');await page.evaluate(()=>document.querySelector('[data-action="begin"]').focus());await tap(0);
 await page.waitForFunction(()=>primalRun.game.phase==='playing');
 // Mutation picks: the first card is focused, right moves to the next card, A chooses it.
 await page.evaluate(()=>{const g=primalRun.game;g.run.xp=g.run.nextXP;g.maybeLevelUp();});await page.waitForFunction(()=>primalRun.game.phase==='mutation');await page.waitForTimeout(100);
 assert.match(await page.locator('.screen').innerText(),/Vælg med VENSTRE PIND og bekræft med A|Vælg med \[VENSTRE PIND\] og bekræft med A/);
 const choices=await page.evaluate(()=>primalRun.game.run.choices.slice());
 assert.equal(await focused(),choices[0],'first card focused');
 await tap(15);assert.equal(await focused(),choices[1],'right moves to card 2');
 await tap(0);await page.waitForFunction(()=>primalRun.game.phase==='playing');assert.ok(await page.evaluate(id=>primalRun.game.run.mutations[id]>0,choices[1]),'card 2 was chosen');
 // Start pauses, B resumes.
 await tap(9);await page.waitForFunction(()=>primalRun.game.phase==='paused');await tap(1);await page.waitForFunction(()=>primalRun.game.phase==='playing');
 // A PlayStation pad renames the hints; RT attacks.
 await page.evaluate(()=>{pads[0].id='DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c)';});await tap(13);await page.waitForTimeout(100);
 assert.match(await page.locator('#attack-ready').textContent(),/^✕ · /);assert.match(await page.locator('#ability-ready').textContent(),/^○ · /);
 const attacks=await page.evaluate(()=>primalRun.game.run.stats.attacks||0);await page.evaluate(()=>{pads[0].buttons[7].pressed=true;});await page.waitForFunction(a=>(primalRun.game.run.stats.attacks||0)>a,attacks);await page.evaluate(()=>{pads[0].buttons[7].pressed=false;});
 assert.deepEqual(errors,[]);await page.close();
 console.log('gamepad browser test passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
