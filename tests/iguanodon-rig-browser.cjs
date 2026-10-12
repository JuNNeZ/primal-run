const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {pathToFileURL}=require('node:url');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
const root=path.resolve(__dirname,'../PRIMAL_RUN_Species_Pilot');

test('Iguanodon reference reviewer: ordered poses, pause, step, backgrounds and actual sprite pixels',async()=>{
  const browser=await chromium.launch(browserOptions());
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'iguanodon-portable-'));
  const copied=path.join(temporary,'review.html');
  fs.copyFileSync(path.join(root,'iguanodon_rig_review.html'),copied);
  try {
    const errors=[],scenarios=[];
    let poseChecks=0,pixelChecks=0;
    for(const [mode,url] of [['http_without_external_assets',await localURL(path.join(root,'iguanodon_rig_review.html'))],
                            ['single_copied_file_offline',pathToFileURL(copied).href]]) {
    const context=await browser.newContext({viewport:{width:1100,height:1000},offline:mode==='single_copied_file_offline'});
    let page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    const dependencies=[];
    const intercept=route=>{
      if(route.request().url()==='http://portable-review.invalid/review.html'){
        return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:fs.readFileSync(copied,'utf8')});
      }
      if(route.request().resourceType()==='document')return route.continue();
      dependencies.push(route.request().url());return route.abort();
    };
    await page.route('**/*',intercept);
    let directFileAccess=mode==='single_copied_file_offline'?'PASS':'not_applicable';
    try {await page.goto(url);} catch(error) {
      // Managed Chromium prohibits all file:// navigation. Preserve that policy
      // and test the copied file bytes via an offline intercepted document.
      if(mode!=='single_copied_file_offline'||!error.message.includes('ERR_BLOCKED_BY_ADMINISTRATOR'))throw error;
      directFileAccess='blocked_by_managed_browser_policy';
      await page.close();page=await context.newPage();
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',intercept);
      await page.goto('http://portable-review.invalid/review.html');
    }
    await page.waitForFunction(()=>window.iguanodonReview?.ready);
    assert.match(await page.locator('#status').textContent(),/Klar/);
    await page.click('#play');
    const paused=await page.evaluate(()=>window.iguanodonReview.frame);
    await page.waitForTimeout(180);
    assert.equal(await page.evaluate(()=>window.iguanodonReview.frame),paused);
    for(const dark of [false,true]) {
      if(dark) await page.click('#background');
      for(let i=0;i<12;i++) {
        await page.locator('#frame').evaluate((el,i)=>{el.value=i;el.dispatchEvent(new Event('input'));},i);
        const expectedSrc='data:image/png;base64,'+fs.readFileSync(path.join(root,`review/iguanodon_rig/iguanodon_walk_E_${String(Math.floor(i/2)).padStart(3,'0')}.png`)).toString('base64');
        const report=await page.evaluate(async({i,expectedSrc})=>{
          const c=document.getElementById('sprite'),ctx=c.getContext('2d');
          const expected=document.createElement('canvas');expected.width=expected.height=144;
          const e=expected.getContext('2d');e.imageSmoothingEnabled=false;
          e.fillStyle=window.iguanodonReview.dark?'#151b19':'#e8ece1';e.fillRect(0,0,144,144);
          const im=new Image;im.src=expectedSrc;
          await im.decode();e.drawImage(im,0,0);
          const a=ctx.getImageData(0,0,144,144).data,b=e.getImageData(0,0,144,144).data;
          return {state:window.iguanodonReview,equal:a.every((v,k)=>v===b[k]),smoothing:ctx.imageSmoothingEnabled};
        },{i,expectedSrc});
        assert.equal(report.state.frame,i);assert.equal(report.state.spriteFrame,Math.floor(i/2));
        assert.equal(report.state.dark,dark);assert.equal(report.equal,true);assert.equal(report.smoothing,false);
        poseChecks++;pixelChecks++;
      }
    }
    await page.click('#step');assert.equal(await page.evaluate(()=>window.iguanodonReview.frame),0);
    await page.click('#play');
    await page.waitForFunction(()=>window.iguanodonReview.frame>=3);
    await page.click('#play');
    assert.deepEqual(errors,[]);
    assert.deepEqual(dependencies,[],'portable reviewer must not request any external assets');
    await page.screenshot({path:path.join(root,'review/iguanodon_rig/browser_review.png'),fullPage:true});
    scenarios.push({mode:mode==='single_copied_file_offline'?'copied_html_offline_asset_isolation':mode,
      status:'PASS',direct_file_navigation:directFileAccess,external_asset_requests:dependencies.length});
    await context.close();
    }
    const reportPath=path.join(root,'review/iguanodon_rig/validation_report.json');
    const report=JSON.parse(fs.readFileSync(reportPath));
    report.browser={status:'PASS',pose_checks:poseChecks,actual_canvas_pixel_checks:pixelChecks,
      pause_step_loop_backgrounds:true,portable_scenarios:scenarios,
      renderer:'standalone HTML Canvas; no GDevelop production certification',errors};
    fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
  } finally {await browser.close();fs.rmSync(temporary,{recursive:true,force:true});}
});

test('Iguanodon viewer reports failed embedded image prominently and keeps controls disabled',async()=>{
  const browser=await chromium.launch(browserOptions());
  try {
    const page=await browser.newPage();
    const html=fs.readFileSync(path.join(root,'iguanodon_rig_review.html'),'utf8')
      .replace(/"referenceAtlas":"data:image\/png;base64,[^"]+"/,'"referenceAtlas":"data:image/png;base64,AAAA"');
    await page.setContent(html);
    await page.waitForFunction(()=>Boolean(window.iguanodonReview?.error));
    assert.match(await page.locator('#status[role=alert]').textContent(),/Led-\/kropsreference kunne ikke indlæses/);
    assert.equal(await page.locator('#controls').evaluate(el=>el.disabled),true);
  } finally {await browser.close();}
});
