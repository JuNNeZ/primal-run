/* Actual GDevelop 5.6.283 C++/WASM deserializer and HTML5 exporter.
   Usage: node .../export_gdevelop.cjs /path/to/extracted/GDevelop [output]. */
const fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{
 const root=path.resolve(__dirname,'..'),dist=path.resolve(process.argv[2]||'');
 const lib=process.env.GDEVELOP_LIBGD||path.join(dist,'resources/app/www/libGD.js');
 const gd=await require(lib)({wasmBinary:fs.readFileSync(path.join(path.dirname(lib),'libGD.wasm'))});
 gd.ProjectHelper.initializePlatforms();assert.equal(gd.VersionWrapper.fullString(),'5.6.283-0');
 const project=gd.ProjectHelper.createNewGDJSProject(),el=gd.Serializer.fromJSON(fs.readFileSync(path.join(root,'project.json'),'utf8'));
 project.unserializeFrom(el);project.setProjectFile(path.join(root,'project.json'));
 assert(project.hasLayoutNamed('Game'));const round=new gd.SerializerElement();project.serializeTo(round);
 const json=JSON.parse(gd.Serializer.toJSON(round)),scene=json.layouts[0];
 assert.equal(scene.objects.length,11);assert.equal(scene.events[1].type,'BuiltinCommonInstructions::JsCode');
 assert.deepEqual(scene.events[1].inlineCode,JSON.parse(fs.readFileSync(path.join(root,'project.json'))).layouts[0].events[1].inlineCode);
 fs.writeFileSync(path.join(root,'reports/serializer-roundtrip.json'),JSON.stringify({result:'PASS',engine:gd.VersionWrapper.fullString(),objects:scene.objects.map(o=>o.name),events:scene.events.map(e=>e.type),resources:json.resources.resources.length,scope:'Actual GDevelop WASM deserialization/serialization; not graphical preview'},null,2)+'\n');
 const afs=new gd.AbstractFileSystemJS();
 Object.assign(afs,{
  mkDir:p=>{fs.mkdirSync(p,{recursive:true});return true;},dirExists:p=>fs.existsSync(p),
  clearDir:p=>{fs.rmSync(p,{recursive:true,force:true});fs.mkdirSync(p,{recursive:true});},
  getTempDir:()=>fs.mkdtempSync('/tmp/primal-gd-'),fileNameFrom:p=>path.basename(p),dirNameFrom:p=>path.dirname(p),isAbsolute:p=>path.isAbsolute(p),makeAbsolute:(p,b)=>path.resolve(b,p),makeRelative:(p,b)=>path.relative(b,p),
  copyFile:(s,d)=>{try{fs.mkdirSync(path.dirname(d),{recursive:true});fs.copyFileSync(s,d);return true;}catch(e){console.error('copy',s,e.message);return false;}},
  writeToFile:(p,c)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,c);return true;},
  readFile:p=>{try{return fs.readFileSync(p,'utf8');}catch{return '';}},fileExists:p=>fs.existsSync(p),
  readDir:(p,ext)=>{const v=new gd.VectorString();if(fs.existsSync(p))for(const f of fs.readdirSync(p))if(!ext||f.toLowerCase().endsWith(ext.toLowerCase()))v.push_back(path.join(p,f));return v;}
 });
 const out=path.resolve(process.argv[3]||path.join(root,'export'));
 const exporter=new gd.Exporter(afs,path.join(dist,'resources/GDJS'));
 const options=new gd.ExportOptions(project,out);
 const ok=exporter.exportWholePixiProject(options);const error=exporter.getLastError();
 assert(ok,error);assert(fs.existsSync(path.join(out,'index.html')));assert(fs.existsSync(path.join(out,'code0.js')));
 fs.writeFileSync(path.join(root,'reports/export.json'),JSON.stringify({result:'PASS',engine:gd.VersionWrapper.fullString(),output:'export/',scope:'Actual GDevelop HTML5 exporter/code generator. Graphical browser runtime separate.'},null,2)+'\n');
 console.log('GDevelop 5.6.283 roundtrip and real HTML5 export PASS');
})().catch(e=>{console.error(e, e.stack);process.exitCode=1;});
