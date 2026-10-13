'use strict';
// HUD time icon stays 16 px, touch HUD text cannot be selected, and control hints follow keyboard / touch / gamepad in every language.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const url=process.env.PRIMAL_GAME_URL||await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html'));
 const open=async(opts,lang)=>{const page=await browser.newPage(opts),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(url);await page.locator(`[data-first-language="${lang}"]`).click({timeout:2000}).catch(()=>{});await page.waitForSelector('[data-action="start"]:not(:disabled)');page.errors=errors;return page;};
 const play=async page=>{await page.locator('[data-action="start"]').click();await page.locator('[data-action="begin"]').click();await page.waitForFunction(()=>primalRun.game.phase==='playing');await page.waitForTimeout(200);};
 // Desktop: keyboard hints, unstretched time icon, then a gamepad press switches every hint to Xbox-layout buttons.
 let page=await open({viewport:{width:1280,height:900}},'en');await play(page);
 const icon=await page.evaluate(()=>{const c=document.querySelector('.time-icon'),b=c.getBoundingClientRect();return {hidden:c.hidden,w:b.width,h:b.height};});
 assert.ok(icon.hidden||icon.w===16&&icon.h===16,'time icon must not stretch over the HUD: '+JSON.stringify(icon));
 assert.match(await page.locator('#attack-ready').textContent(),/^SPACE · /);
 await page.evaluate(()=>{window.pad={axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});pad.axes[2]=1;});
 await page.waitForFunction(()=>document.querySelector('.primal-shell').dataset.input==='gamepad');await page.evaluate(()=>pad.axes[2]=0);await page.waitForTimeout(100);
 assert.match(await page.locator('#attack-ready').textContent(),/^A · /);assert.match(await page.locator('#ability-ready').textContent(),/^B · /);
 assert.match(await page.locator('footer .control-hints').innerText(),/LEFT STICK Move · A Attack · B Ability · RB Sneak \/ hide · X Hold to eat · Y Inspect · ☰ Pause/);
 await page.keyboard.press('KeyW');await page.waitForFunction(()=>document.querySelector('.primal-shell').dataset.input==='keyboard');assert.deepEqual(page.errors,[]);await page.close();
 // Phone: touch hints in Danish, no "hold F", no text selection on the HUD or buttons.
 page=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true},'da');
 assert.equal(await page.evaluate(()=>document.querySelector('.primal-shell').dataset.input),'touch');
 await page.locator('[data-action="start"]').click();const intro=await page.locator('.hunt-intro').innerText();assert.match(intro,/\[SPIS\]/);assert.doesNotMatch(intro,/hold F\b|SPACE|SHIFT/);
 await page.locator('[data-action="begin"]').click();await page.waitForFunction(()=>primalRun.game.phase==='playing');await page.waitForTimeout(200);
 assert.match(await page.locator('#attack-ready').textContent(),/^ANGREB · /);
 assert.deepEqual(await page.evaluate(()=>['.touch-controls button','.run-info','.hud'].map(s=>getComputedStyle(document.querySelector(s)).userSelect)),['none','none','none']);
 assert.deepEqual(page.errors,[]);await page.close();
 // Every full language translates the new touch and gamepad hints (help screen, HUD and world labels).
 const I=require('../PRIMAL_RUN_Game/src/i18n.js');globalThis.PrimalI18n=I;require('../PRIMAL_RUN_Game/src/lang.js');
 const hints=['Gå tæt på og tryk [ANGREB]. Kritiske træf giver ekstra skade og stagger.','Hold [SPIS] ved planter med en lysende ring','Stå stille i buske. Dybt vand kan kun krydses ved vadesteder.','Stå stille eller hold RB i buske. Dybt vand kan kun krydses ved vadesteder.','Kød rådner efter et stykke tid. [☰] pauser spillet.','Kød rådner efter et stykke tid. [PAUSE] pauser spillet.','BUSKE · stå stille','HOLD [SPIS] · FISK','VILD RAPTOR · [UNDERSØG] FODR','[EVNE] KLAR','[VENSTRE PIND]','[JOYSTICK]'];
 for(const lang of I.LANGUAGES.map(l=>l.id).filter(l=>l!=='da')){I.setLanguage(lang);I.missing.clear();hints.forEach(h=>I.t(h));assert.deepEqual([...I.missing],[],lang);}
 console.log('PASS: HUD time icon, no text selection on touch, keyboard/touch/gamepad control hints in all languages');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
