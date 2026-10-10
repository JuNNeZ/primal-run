const {chromium, browserOptions, localURL}=require('./tools/browser.cjs');
const path=require('path'),fs=require('fs');let browser;
(async()=>{
 browser=await chromium.launch(browserOptions());
 const page=await browser.newPage({viewport:{width:1200,height:950}}),root=path.join(__dirname,'PRIMAL_RUN_Prototype_Kit');
 await page.goto(await localURL(path.join(root,'START_HER.html')));
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));
 if(await page.locator('img').count()!==104)throw Error('Catalog image inventory incorrect');
 for(const file of ['START_HER.html','GUIDE.html','demo.html']){
  await page.goto(await localURL(path.join(root,file)));
  const links=await page.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
  for(const link of links){if(link.startsWith('#')||link.startsWith('http'))continue;if(!fs.existsSync(path.join(root,link)))throw Error(file+' missing '+link);}
 }
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Idle S'));
 const label=await page.evaluate(()=>{const s=primalDemo.getState();s.enemies=[];s.player={x:480,y:300};primalDemo.keys.add('KeyA');primalDemo.step(.1);primalDemo.draw();primalDemo.keys.clear();return document.querySelector('#status').textContent;});
 if(!label.startsWith('Walk W')||label.includes('Ã')||label.includes('Â'))throw Error('HUD encoding/direction failed: '+label);
 await page.goto(await localURL(path.join(root,'GUIDE.html')));
 if(await page.locator('section').count()!==5)throw Error('Offline guide sections missing');
 const report={result:'PASS',checks:['104 catalog PNGs load','all entrypoint/guide/demo local links exist','guide includes five documents','HUD displays correct direction and UTF-8 text'],scope:'Chromium over local HTTP; file:// access is not certified'};
 fs.writeFileSync(path.join(root,'offline_test_report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});
