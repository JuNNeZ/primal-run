'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');const sandbox={};vm.runInNewContext(fs.readFileSync('PRIMAL_RUN_Game/src/audio.js','utf8'),sandbox);const Audio=sandbox.PrimalAudio;
test('menu, four biomes, four bosses and results have distinct actual compositions',()=>{
 const a=new Audio(x=>x,{master:1,music:1,sfx:1}),ids=['menu'];
 for(let stage=0;stage<4;stage++){a.setScene({phase:'playing',stage});ids.push(a.trackId);a.setScene({phase:'playing',stage,boss:true});ids.push(a.trackId)}
 a.setScene({phase:'result',victory:true});ids.push(a.trackId);a.setScene({phase:'result'});ids.push(a.trackId);assert.equal(new Set(ids).size,11);
 const scores=ids.map(id=>JSON.stringify(Audio.SCORES[id]));assert.equal(new Set(scores).size,11);
 const composed=[];a.context={state:'running',currentTime:0};a.tone=(...args)=>composed.push(args.slice(0,6));
 for(const id of ids){a.trackId=id;a.beat=0;a.nextBeat=0;const before=composed.length;a.schedule();assert.ok(composed.length>before,'actual scheduling for '+id);}
});
test('health layers have 50/25/10 thresholds, hysteresis, coexist with boss music and duck on pause',()=>{
 const a=new Audio(x=>x,{master:1,music:1,sfx:1});const scene={phase:'playing',stage:2,boss:true,maxHealth:100};
 for(const [health,band]of [[100,0],[50,1],[52,1],[56,0],[25,2],[27,2],[31,1],[10,3],[12,3],[16,2],[100,0]]){a.setScene({...scene,health});assert.equal(a.healthBand,band);assert.equal(a.trackId,'boss2');}
 a.setScene({...scene,phase:'mutation',health:8});assert.equal(a.healthBand,3);assert.equal(a.ducked,true);assert.equal(a.trackId,'boss2');
 a.setScene({phase:'menu'});assert.equal(a.healthBand,0);assert.equal(a.trackId,'menu');
});
test('crossfades reuse unchanged scenes, retire buses and mute avoids new music voices',()=>{
 const a=new Audio(x=>x,{master:1,music:1,sfx:1});let ramps=[];const gain=()=>({gain:{value:1,setValueAtTime(){},cancelScheduledValues(){},linearRampToValueAtTime(v,t){ramps.push([v,t])}},connect(){},disconnect(){this.disconnected=true}});
 a.context={currentTime:10,state:'running',createGain:gain};a.music={};a.bus=gain();const old=a.bus;
 a.setScene({phase:'playing',stage:0});assert.equal(a.retiredBuses.size,1);assert.ok(ramps.some(([v,t])=>v===0&&t===10.65));const bus=a.bus;a.setScene({phase:'playing',stage:0});assert.equal(a.bus,bus);
 a.context.currentTime=13;a.settings.music=0;a.tone=()=>{throw Error('Muted schedule creates voice')};a.schedule();assert.equal(a.retiredBuses.size,0);assert.equal(old.disconnected,true);
});
