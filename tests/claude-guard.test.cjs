'use strict';
// .claude/hooks/guard.cjs: the Bash hook that stops test-report commits, unsafe pushes and megabyte-line output.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync,execFileSync}=require('node:child_process');
const HOOK=path.join(__dirname,'..','.claude','hooks','guard.cjs'),{check}=require(HOOK);
function repo(branch='claude/x'){
  const d=fs.mkdtempSync(path.join(os.tmpdir(),'guard-')),g=(...a)=>execFileSync('git',a,{cwd:d,stdio:'pipe'});
  g('init','-q','-b',branch);g('config','user.email','t@t');g('config','user.name','t');
  fs.mkdirSync(path.join(d,'PRIMAL_RUN_Game/previews'),{recursive:true});
  for(const f of ['a.js','PRIMAL_RUN_Game/game_runtime_report.json','PRIMAL_RUN_Game/previews/hud.png'])fs.writeFileSync(path.join(d,f),'1');
  g('add','-A');g('commit','-qm','init');return {d,g};
}
const bash=(command,cwd)=>check({tool_name:'Bash',tool_input:{command},cwd});
const blocked=(command,cwd)=>assert.ok(bash(command,cwd),'should stop: '+command);
const allowed=(command,cwd)=>assert.equal(bash(command,cwd),null,'should allow: '+command);

test('a commit with test-rewritten reports or previews is stopped unless marked # keep-reports',()=>{
  const {d,g}=repo();fs.writeFileSync(path.join(d,'a.js'),'2');g('add','a.js');allowed('git commit -m "code"',d);
  fs.writeFileSync(path.join(d,'PRIMAL_RUN_Game/previews/hud.png'),'2');
  allowed('git commit -m "code"',d);blocked('git commit -am "code"',d);blocked('git add -A && git commit -m x',d);
  g('add','-A');blocked('git commit -m "code"',d);allowed('git commit -m "new HUD shots" # keep-reports',d);
});
test('pushes: own claude branch ok, main/codex/force stopped, gh-pages only with # udgiv',()=>{
  const {d}=repo('claude/feature');
  allowed('git push -u origin claude/feature',d);allowed('git push',d);allowed('git push origin integration/next',d);
  allowed('git push --force-with-lease origin claude/feature',d);
  allowed('git push -q origin origin/gh-pages:refs/heads/backup/live-2026-10-29',d);
  blocked('git push origin main',d);blocked('git push origin HEAD:main',d);blocked('git push origin codex/sprites',d);
  blocked('git push -f origin claude/feature',d);blocked('git push origin +claude/feature',d);blocked('git push --force origin x',d);
  blocked('git push --force-with-lease origin integration/next',d);
  blocked('git push origin gh-pages',d);blocked('cd dist && git push origin HEAD:gh-pages',d);
  allowed('git push origin gh-pages # udgiv',d);
});
test('printing the megabyte-line generated files is stopped unless bounded',()=>{
  blocked('cat PRIMAL_RUN_Game/project.json');blocked('grep -n Spinosaurus PRIMAL_RUN_Game/src/lang/de.js');
  blocked('git diff integration/next -- PRIMAL_RUN_Game/src/assets.js');blocked('rg Kraftigt');blocked('grep -rn foo PRIMAL_RUN_Game');
  allowed('grep -o "Spino[^\\"]*" PRIMAL_RUN_Game/src/lang/de.js');allowed('grep -c foo PRIMAL_RUN_Game/project.json');
  allowed('rg -M 300 Kraftigt');allowed('git diff --stat');allowed('rg foo tools');allowed('grep -rn foo tools PRIMAL_RUN_Game/src/core.js');
  allowed('head -c 300 PRIMAL_RUN_Game/src/assets.js');allowed('cat PRIMAL_RUN_Game/project.json | wc -c');allowed('ls PRIMAL_RUN_Game/src/lang');
  allowed('sed -n 1,5p PRIMAL_RUN_Game/project.json # bounded');
});
test('the hook process blocks with exit 2 and passes anything else with exit 0',()=>{
  const run=input=>spawnSync(process.execPath,[HOOK],{input:JSON.stringify(input),encoding:'utf8'});
  const r=run({tool_name:'Bash',tool_input:{command:'cat PRIMAL_RUN_Game/project.json'}});assert.equal(r.status,2);assert.match(r.stderr,/bounded/);
  assert.equal(run({tool_name:'Read',tool_input:{file_path:'x'}}).status,0);
  assert.equal(spawnSync(process.execPath,[HOOK],{input:'not json'}).status,0);
});
