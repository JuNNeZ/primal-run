/* Tests a REAL exported gdjs game, with Playwright interception serving files.
   Works without a TCP server; only the test bootstrap exposes RuntimeGame. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium,browserOptions}=require('../../tools/browser.cjs');
(async()=>{
 const root=path.resolve(__dirname,'../export'),report=path.resolve(__dirname,'../reports');
 const b=await chromium.launch(browserOptions());
 try {
 const page=await b.newPage({viewport:{width:960,height:640}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('http://primal.test/**',async route=>{
  const p=path.resolve(root,'.'+new URL(route.request().url()).pathname);
  if(!p.startsWith(root+path.sep)||!fs.existsSync(p)){await route.fulfill({status:404,body:'missing'});return;}
  const ext=path.extname(p),types={'.js':'application/javascript','.html':'text/html','.png':'image/png','.wav':'audio/wav','.json':'application/json'};
  let body=fs.readFileSync(p);
  if(ext==='.html')body=Buffer.from(body.toString().replace('var game = new gdjs.RuntimeGame(gdjs.projectData, gdjs.runtimeGameOptions);','var game = new gdjs.RuntimeGame(gdjs.projectData, gdjs.runtimeGameOptions); window.__game=game;'));
  await route.fulfill({status:200,body,contentType:types[ext]||'application/octet-stream'});
 });
 await page.goto('http://primal.test/index.html');
 console.log('runtime: loaded page');
 await page.waitForFunction(()=>window.__game?.getSceneStack().getCurrentScene()?.__primal,{timeout:20000});
 const scene=()=>window.__game.getSceneStack().getCurrentScene();
 await page.evaluate(()=>{window.__scene=window.__game.getSceneStack().getCurrentScene();});
 await page.screenshot({path:path.join(report,'game.png')});
 console.log('runtime: scene ready');
 const checks=await page.evaluate(()=>{
  const r=__scene,a=r.__primal,c=a.core,im=r.getGame().getInputManager(),checks=[];
  const check=(v,m)=>{if(!v)throw Error(m);};
  const run=(keys=[])=>{for(const k of [87,65,83,68,37,38,39,40,32,49,50,51,82])im.onKeyReleased(k);for(const k of keys)im.onKeyPressed(k);gdjs.GameCode.func(r);};
  // Force 50ms through the actual TimeManager while synchronously driving generated events.
  const tm=r.getTimeManager(),old=tm.getElapsedTime;tm.getElapsedTime=()=>50;
  c.reset();c.state.enemies=[];c.state.food=[];run();
  for(const [k,dir] of [[83,'S'],[87,'N'],[68,'E'],[65,'W']]){c.state.player={x:480,y:320};run([k]);const p=r.getObjects('Player')[0];check(p.getAnimationName()==='Walk_'+dir,'walk '+dir);run();check(p.getAnimationName()==='Idle_'+dir,'idle '+dir);
    const verts=p.getHitBoxes()[0].vertices.map(v=>[v[0]-p.getX(),v[1]-p.getY()]);check(JSON.stringify(verts)===JSON.stringify([[-14,-14],[14,-14],[14,14],[-14,14]]),'torso hitbox '+dir);
  }checks.push('actual SpriteRuntimeObject cardinal walk/idle and world-space torso masks');
  c.reset();c.state.enemies=[];c.state.food=[];c.addEnemy(540,320,'carnotaurus');c.addEnemy(700,320,'parasaurolophus');c.state.mutations.teeth=2;run([32]);check(r.getObjects('Carnotaurus').length===1&&r.getObjects('Parasaurolophus').length===1,'native enemy variants');for(let i=0;i<19;i++)run();check(c.state.hunts===1&&c.state.level===2,'native bleed XP');check(r.getObjects('Carnotaurus').length===0,'killed native enemy removed');checks.push('native enemy variants, stacked bleed kill, XP once and object removal');
  c.reset();c.state.enemies=[];c.state.food=[];c.state.player={x:236,y:230};run([87]);check(c.state.animation==='Idle_N'&&c.state.player.y===230,'blocked');checks.push('blocked movement idles');
  c.reset();c.state.enemies=[];c.state.hp=50;c.state.xp=4;c.addEnemy(510,320);c.addEnemy(500,320);run([32]);check(c.state.phase==='mutation','pause');check(!r.getObjects('Choices')[0].isHidden(),'choices visible');
  const snapshot=JSON.stringify(c.state);run([68,32]);run([87]);check(JSON.stringify(c.state)===snapshot,'all clocks frozen');
  const px=r.getObjects('Player')[0].getX(),frame=r.getObjects('Player')[0].getAnimationFrame();r.getObjects('Player')[0].update(r);check(r.getObjects('Player')[0].getX()===px&&r.getObjects('Player')[0].getAnimationFrame()===frame,'engine animation paused');checks.push('mutation freezes whole gameplay and engine animation; native choices shown');
  run([50]);check(c.state.mutations.legs===1&&c.state.phase==='playing','selection');run([50]);check(c.state.mutations.legs===1,'key held not duplicated');run();
  c.state.enemies=[];c.state.xp=c.state.nextXP;run();run([50]);check(c.state.mutations.legs===2,'stack');checks.push('native input selects once, resumes, stacks');
  c.state.food=[];c.state.enemies=[];c.addEnemy(480,320);c.state.hp=1;c.state.hunts=4;c.state.time=31;run();check(c.state.phase==='dead','death');const dna=a.savedDNA;run([68,32]);check(a.savedDNA===dna,'DNA once');check(!r.getObjects('Choices')[0].isHidden(),'death overlay');run([82]);check(c.state.hp===100&&c.state.xp===0&&c.state.mutations.legs===0,'restart');check(a.savedDNA===dna,'DNA persists');run();check(r.getObjects('Compy').length===1,'no duplicate enemies after restart');checks.push('death, native object cleanup, DNA once and restart');
  tm.getElapsedTime=old;for(const k of [87,65,83,68,32,49,50,51,82])im.onKeyReleased(k);
  return checks;
 });
 console.log('runtime: deterministic checks',checks.length);
 // Real DOM keyboard input in addition to direct InputManager deterministic tests.
 await page.keyboard.down('d');console.log('runtime: key down');await page.waitForFunction(()=>__scene.__primal.core.state.animation==='Walk_E');await page.keyboard.up('d');console.log('runtime: key up');await page.waitForFunction(()=>__scene.__primal.core.state.animation==='Idle_E');checks.push('Playwright DOM keyboard binding moves and stops actual exported game');
 await page.evaluate(()=>{const c=__scene.__primal.core;c.state.xp=c.state.nextXP;});
 await page.waitForFunction(()=>__scene.__primal.core.state.phase==='mutation');
 await page.screenshot({path:path.join(report,'mutation.png')});
 console.log('runtime: mutation visible');await page.keyboard.press('2',{delay:100});await page.waitForFunction(()=>__scene.__primal.core.state.phase==='playing');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(report,'runtime-tests.json'),JSON.stringify({result:'PASS',engine:'GDevelop 5.6.283 HTML5 export',browser:'Chromium 151 headless shell',checks,pageErrors:errors,scope:'REAL gdjs generated events, SpriteRuntimeObject/Pixi renderer and InputManager in Chromium; not desktop editor UI'},null,2)+'\n');
 console.log(checks.length+' real GDevelop runtime tests PASS');
 }finally{await b.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
