const {chromium, browserOptions}=require('./tools/browser.cjs');
const path=require('path'),fs=require('fs'),{pathToFileURL}=require('url');
let browser;
(async()=>{
browser=await chromium.launch(browserOptions());
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(pathToFileURL(path.join(__dirname,'PRIMAL_RUN_Prototype_Kit/demo.html')).href);
await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Idle S'));
const results=await page.evaluate(()=>{
 const check=(condition,message)=>{if(!condition)throw Error(message);};
 const api=primalDemo,s=api.getState();s.enemies=[];s.food=[];
 const results=[];
 for(const [d,key] of [['S','KeyS'],['N','KeyW'],['E','KeyD'],['W','KeyA']]){
  api.keys.clear();s.player={x:480,y:300};s.walkTime=0;api.keys.add(key);api.step(.15);
  check(s.facing===d&&s.playerAnimation==='Walk_'+d,'Incorrect moving direction '+d);
  const phase=s.walkFrame;api.step(.15);check(s.walkFrame!==phase,'Frame did not advance '+d);
  api.keys.clear();api.step(.01);check(s.playerAnimation==='Idle_'+d&&s.facing===d,'Stop lost facing '+d);
  api.keys.add(key);s.walkTime=.70;api.step(.03);check(s.walkFrame===5,'Frame5 missing '+d);
  api.step(.05);check(s.walkFrame===0,'Loop failed '+d);api.keys.clear();results.push(d+' movement/idle/loop');
 }
 for(const [d,key,position] of [['S','KeyS',{x:480,y:566}],['N','KeyW',{x:480,y:82}],['E','KeyD',{x:914,y:300}],['W','KeyA',{x:46,y:300}]]){
  s.player=position;api.keys.clear();api.keys.add(key);api.step(.1);
  check(s.playerAnimation==='Idle_'+d,'Blocked direction animates '+d);results.push(d+' blockage');
 }
 api.keys.clear();s.player={x:480,y:300};api.keys.add('KeyD');api.keys.add('KeyW');api.step(.01);
 check(s.facing==='N','Diagonal tie choice wrong');api.keys.clear();api.step(.01);
 check(s.playerAnimation==='Idle_N','Diagonal stop direction wrong');api.draw();
 check(ctx.imageSmoothingEnabled===false,'Pixel smoothing enabled');
 results.push('diagonal tie facing','pixel smoothing disabled');return results;
});
if(errors.length)throw Error(errors.join(';'));
const report={result:'PASS',engine:'Chrome browser; GDevelop NOT RUN',checks:results};
fs.writeFileSync(path.join(__dirname,'PRIMAL_RUN_Prototype_Kit/cardinal_test_report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1;});

