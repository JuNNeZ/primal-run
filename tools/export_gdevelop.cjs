#!/usr/bin/env node
/* Uses the real libGD exporter and GDJS runtime from an installed GDevelop 5.
 * No mock runtime. Keep these binaries outside Git; pass their explicit paths.
 * Usage: node tools/export_gdevelop.cjs /path/to/libGD.js /path/to/GDJS output
 */
'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const [libPath, runtimePath, outputPath] = process.argv.slice(2);
if (!libPath || !runtimePath || !outputPath) {
  console.error('Usage: node tools/export_gdevelop.cjs <libGD.js> <GDJS directory containing Runtime> <empty output directory>');
  process.exit(1);
}
const out = path.resolve(outputPath);
if (fs.existsSync(out) && fs.readdirSync(out).length) throw Error('Export destination must be empty; existing files are preserved.');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'primal-gdexport-'));
const allowed = target => {
  const resolved = path.resolve(target);
  if (![out, scratch].some(base => resolved === base || resolved.startsWith(base + path.sep))) throw Error('Exporter write outside output/temp: ' + resolved);
  return resolved;
};
(async () => {
  const gd = await require(path.resolve(libPath))();
  gd.initializePlatforms();
  const projectPath = path.resolve(__dirname, '../PRIMAL_RUN_Game/project.json');
  const data = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
  const project = gd.ProjectHelper.createNewGDJSProject(), element = gd.Serializer.fromJSObject(data);
  project.unserializeFrom(element); project.setProjectFile(projectPath);
  if (project.getLayoutsCount() !== 1 || project.getLayoutAt(0).getName() !== 'PrimalRun') throw Error('GDevelop did not load the expected scene.');
  const roundTrip = new gd.SerializerElement(); project.serializeTo(roundTrip);
  const parsed = gd.Serializer.toJSObject(roundTrip);
  if (parsed.layouts[0].events[1].inlineCode.length < 100) throw Error('JavaScript event did not survive GDevelop serialization.');
  const afs = new gd.AbstractFileSystemJS();
  afs.mkDir = dir => { fs.mkdirSync(allowed(dir), { recursive: true }); return true; };
  afs.clearDir = dir => { const target = allowed(dir); if (fs.existsSync(target)) for (const file of fs.readdirSync(target)) fs.rmSync(path.join(target, file), { recursive: true }); return true; };
  afs.getTempDir = () => scratch;
  afs.fileNameFrom = full => path.basename(full); afs.dirNameFrom = full => path.dirname(full);
  afs.makeAbsolute = (relative, base) => path.resolve(base, relative); afs.makeRelative = (absolute, base) => path.relative(base, absolute);
  afs.isAbsolute = file => path.isAbsolute(file); afs.dirExists = dir => fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  afs.fileExists = file => fs.existsSync(file) && fs.statSync(file).isFile();
  afs.readDir = dir => { const v = new gd.VectorString(); for (const file of fs.readdirSync(dir)) v.push_back(file); return v; };
  afs.readFile = file => fs.readFileSync(file, 'utf8');
  afs.copyFile = (src, dst) => { const target = allowed(dst); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(src, target); return true; };
  afs.writeToFile = (file, content) => { const target = allowed(file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, content); return true; };
  const exporter = new gd.Exporter(afs, path.resolve(runtimePath));
  const options = new gd.ExportOptions(project, out);
  if (!exporter.exportWholePixiProject(options)) throw Error(exporter.getLastError());
  if (!fs.existsSync(path.join(out, 'index.html')) || !fs.existsSync(path.join(out, 'data.js'))) throw Error('Incomplete export');
  options.delete(); exporter.delete(); afs.delete(); roundTrip.delete(); element.delete(); project.delete();
  console.log('PASS: GDevelop loaded/serialized the project and exported its GDJS runtime to ' + out);
})().catch(e => { console.error(e.message || e); process.exitCode = 1; });
