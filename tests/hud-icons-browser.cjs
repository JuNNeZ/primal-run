'use strict';
// FEATURES.hudIcons: Codex' native icons on the build screen (relics, relic sets), the mutation cards (rarity gems, tags)
// and the HUD relic chip. Every icon must load; with the flag off the old glyphs stay. PRIMAL_SHOTS=<dir> saves screenshots.
const assert=require('node:assert/strict'),path=require('node:path');const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
(async()=>{const browser=await chromium.launch(browserOptions());try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(await localURL(path.resolve(__dirname,'../PRIMAL_RUN_Game/index.html')));await page.locator('[data-first-language="da"]').click({timeout:2000}).catch(()=>{});
 await page.waitForSelector('[data-action="start"]:not(:disabled)');
 await page.evaluate(async()=>{await primalRun.preload({species:'velociraptor',stage:1,kinds:Object.keys(PrimalCore.SPECIES)});});
 await page.locator('[data-action="start"]').click();await page.locator('[data-action="begin"]').click();
 const shots=process.env.PRIMAL_SHOTS,shot=async n=>{if(shots)await page.screenshot({path:path.join(shots,n+'.png')});};
 const icons=()=>page.evaluate(async()=>{const imgs=[...document.querySelectorAll('img.hud-icon')];await Promise.all(imgs.map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r;})));return imgs.map(i=>({src:i.getAttribute('src'),ok:i.naturalWidth>0}));});
 const choices=on=>page.evaluate(on=>{const F=PrimalCore.FEATURES;F.hudIcons=on;const g=primalRun.game,r=g.run;r.enemies=[];r.spawnTimer=999;r.health=r.maxHealth=1e6;
   r.mutations.keenClaws=1;const pick=['common','rare','legendary'].map(k=>PrimalCore.MUTATIONS.find(m=>m.rarity===k&&g.mutationAvailable(m)&&m.tag)||PrimalCore.MUTATIONS.find(m=>m.rarity===k&&g.mutationAvailable(m)));
   g.phase='playing';primalRun.update(performance.now());r.choices=pick.map(m=>m.id);g.phase='mutation';primalRun.update(performance.now());return document.querySelector('.mutation-grid').textContent.includes('♛');},on);
 assert.equal(await choices(false),true,'flag off: the old ♛ glyph');assert.deepEqual(await icons(),[]);
 assert.equal(await choices(true),false,'flag on: gems replace the glyphs');await shot('hud_icons_cards');
 const cardIcons=await icons();assert.ok(cardIcons.some(i=>i.src.includes('rarity/legendary')));assert.ok(cardIcons.every(i=>i.ok),JSON.stringify(cardIcons.filter(i=>!i.ok)));
 await page.evaluate(()=>{const F=PrimalCore.FEATURES;F.lootTables=F.relics=true;const g=primalRun.game,r=g.run;g.phase='playing';r.choices=[];
   r.relics={osteoderm_plates:true,horn_shield:true,keen_eye:true,meteor_shard:true};primalRun.update(performance.now());g.phase='build';primalRun.update(performance.now());});
 await shot('hud_icons_build');
 const build=await icons();for(const want of ['relics/osteoderm_plates.png','relics/meteor_shard.png','sets/set_armor.png','sets/set_hunter.png','relics/keen_eye_16.png'])assert.ok(build.some(i=>i.src.endsWith(want)),want);
 assert.ok(build.every(i=>i.ok),JSON.stringify(build.filter(i=>!i.ok)));
 // the reel shows rarity gems while spinning and the relic itself when it locks
 const reel=await page.evaluate(()=>{const F=PrimalCore.FEATURES,g=primalRun.game;F.lootReveal=true;g.phase='playing';primalRun.update(performance.now());const t0=performance.now();
   g.revealLoot(3,{big:true,kind:'relic',label:'Seglklo',icon:'relics/sickle_claw'});primalRun.update(t0);primalRun.update(t0+2000);
   const b=[...document.querySelectorAll('.loot-reel b')];return {first:b[0].querySelector('img')?.getAttribute('src'),last:b.pop().querySelector('img')?.getAttribute('src')};});
 assert.deepEqual(reel,{first:'assets/hud_icons/rarity/legendary.png',last:'assets/hud_icons/relics/sickle_claw.png'});
 await shot('hud_icons_reel');
 // main menu: menu glyphs and difficulty icons
 await page.evaluate(()=>{const g=primalRun.game;PrimalCore.FEATURES.difficulties=true;g.abandon();primalRun.update(performance.now());});
 await page.waitForTimeout(100);await shot('hud_icons_menu');
 const menu=await icons();for(const want of ['ui/dna_lab.png','ui/achievement.png','ui/settings.png','ui/records.png','difficulty/normal.png','difficulty/extinction.png'])assert.ok(menu.some(i=>i.src.endsWith(want)),want);
 assert.ok(menu.every(i=>i.ok),JSON.stringify(menu.filter(i=>!i.ok)));
 assert.equal(await page.evaluate(()=>document.querySelector('.menu-grid').textContent.includes('⬡')),false,'glyph replaced');
 assert.deepEqual(errors,[]);
 console.log('PASS: HUD icons · glyphs with the flag off · rarity gems and tags on cards · relic and set icons on the build screen · relic chip · reel gems + relic · menu and difficulty icons · all icons load · no page errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
