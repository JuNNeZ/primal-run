'use strict';const test=require('node:test'),assert=require('node:assert/strict'),C=require('../PRIMAL_RUN_Game/src/core.js');
test('opening rocks, foliage clusters and river orientation visibly vary for repeat runs of the same level',()=>{
 for(let stage=0;stage<4;stage++){
 const variants=new Set(),openings=new Set(),rivers=new Set();
 for(let seed=0;seed<32;seed++){const m=C.createMap(stage,seed);variants.add(m.layout);rivers.add(m.riverOrientation);openings.add(JSON.stringify({rocks:m.rocks.filter(p=>Math.hypot(p.x-480,p.y-340)<650),plants:m.decorations.filter(p=>p.x<960&&p.y<640)}));assert.ok(m.rocks.every(p=>Math.hypot(p.x-480,p.y-340)>150));assert.deepEqual(m,C.createMap(stage,seed));}
 assert.equal(variants.size,3);assert.equal(rivers.size,2);assert.equal(openings.size,32);
 }
});
test('map constraints preserve safe start and broad access to habitats and sites',()=>{
 for(let stage=0;stage<4;stage++)for(let seed=0;seed<16;seed++){
 const m=C.createMap(stage,seed),step=60,cols=Math.ceil(m.width/step),rows=Math.ceil(m.height/step),queue=[[8,6]],visited=new Set();
 const blocked=(x,y)=>x<1||y<2||x>=cols-1||y>=rows-1||m.rocks.some(r=>Math.hypot(x*step-r.x,y*step-r.y)<r.radius+23);
 for(let n=0;n<queue.length;n++){const [x,y]=queue[n],key=x+','+y;if(visited.has(key)||blocked(x,y))continue;visited.add(key);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])queue.push([x+dx,y+dy]);}
 assert.ok(visited.size>(cols-2)*(rows-3)*.85,'open traversable wilderness '+stage+'/'+seed);
 for(const site of m.sites){let near=false;for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if(visited.has((Math.round(site.x/step)+dx)+','+(Math.round(site.y/step)+dy)))near=true;assert.ok(near,'exploration site reachable');}
 }
});
