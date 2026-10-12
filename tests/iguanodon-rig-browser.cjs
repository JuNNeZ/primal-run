const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium,browserOptions,localURL}=require('../tools/browser.cjs');
const root=path.resolve(__dirname,'../PRIMAL_RUN_Species_Pilot');

test('Iguanodon reference reviewer: ordered poses, pause, step, backgrounds and actual sprite pixels',async()=>{
  const browser=await chromium.launch(browserOptions());
  try {
    const page=await browser.newPage({viewport:{width:1100,height:1000}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(await localURL(path.join(root,'iguanodon_rig_review.html')));
    await page.waitForFunction(()=>window.iguanodonReview?.ready);
    await page.click('#play');
    const paused=await page.evaluate(()=>window.iguanodonReview.frame);
    await page.waitForTimeout(180);
    assert.equal(await page.evaluate(()=>window.iguanodonReview.frame),paused);
    let poseChecks=0,pixelChecks=0;
    for(const dark of [false,true]) {
      if(dark) await page.click('#background');
      for(let i=0;i<12;i++) {
        await page.locator('#frame').evaluate((el,i)=>{el.value=i;el.dispatchEvent(new Event('input'));},i);
        const report=await page.evaluate(async(i)=>{
          const c=document.getElementById('sprite'),ctx=c.getContext('2d');
          const expected=document.createElement('canvas');expected.width=expected.height=144;
          const e=expected.getContext('2d');e.imageSmoothingEnabled=false;
          e.fillStyle=window.iguanodonReview.dark?'#151b19':'#e8ece1';e.fillRect(0,0,144,144);
          const im=new Image;im.src=`review/iguanodon_rig/iguanodon_walk_E_${String(Math.floor(i/2)).padStart(3,'0')}.png`;
          await im.decode();e.drawImage(im,0,0);
          const a=ctx.getImageData(0,0,144,144).data,b=e.getImageData(0,0,144,144).data;
          return {state:window.iguanodonReview,equal:a.every((v,k)=>v===b[k]),smoothing:ctx.imageSmoothingEnabled};
        },i);
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
    await page.screenshot({path:path.join(root,'review/iguanodon_rig/browser_review.png'),fullPage:true});
    const reportPath=path.join(root,'review/iguanodon_rig/validation_report.json');
    const report=JSON.parse(fs.readFileSync(reportPath));
    report.browser={status:'PASS',pose_checks:poseChecks,actual_canvas_pixel_checks:pixelChecks,
      pause_step_loop_backgrounds:true,renderer:'standalone HTML Canvas; no GDevelop production certification',errors};
    fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
  } finally {await browser.close();}
});
