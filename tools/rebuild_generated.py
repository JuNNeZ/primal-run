#!/usr/bin/env python3
"""Regenerates every generated game file after a merge or source change, identically on
Windows, macOS and Linux. Generated files are rebuilt, never hand-merged:
  src/run_titles.js   <- tools/build_run_titles.py   (title catalogue JSON)
  src/lang.js         <- tools/i18n/build_lang.py    (translation tables)
  project.json, integration_report.json, manifest.json, src/assets.js ... <- tools/build_game.py
Then: CRLF -> LF for files the build touched (Windows writes CRLF), restore
Source_Generated/README.md (the build truncates it), and recompute integration_report
source_sha256 from the LF files so tests/game.test.cjs matches CI.
Run from the repo root:  python tools/rebuild_generated.py"""
import hashlib, json, pathlib, subprocess, sys
root = pathlib.Path(__file__).resolve().parent.parent
game = root / 'PRIMAL_RUN_Game'
def run(*cmd):
    print('>', ' '.join(cmd)); subprocess.run(cmd, cwd=root, check=True)
for script in ['tools/build_run_titles.py', 'tools/i18n/build_lang.py', 'tools/build_game.py']:
    if (root / script).exists():
        run(sys.executable, script)
changed = subprocess.run(['git', 'status', '--porcelain'], cwd=root, check=True, capture_output=True, text=True).stdout.splitlines()
for line in changed:
    path = root / line[3:].strip().strip('"')
    if path.is_file() and path.suffix in {'.js', '.json', '.md', '.html', '.css', '.py', '.cjs'}:
        data = path.read_bytes()
        if b'\r\n' in data:
            path.write_bytes(data.replace(b'\r\n', b'\n'))
subprocess.run(['git', 'checkout', '--', 'PRIMAL_RUN_Game/Source_Generated/README.md'], cwd=root, check=False)
report = game / 'integration_report.json'
if report.exists():
    r = json.loads(report.read_text(encoding='utf-8'))
    r['source_sha256'] = {f: hashlib.sha256((game / f).read_bytes()).hexdigest() for f in r.get('source_sha256', {})}
    report.write_bytes((json.dumps(r, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
print('generated files rebuilt; review `git status` before committing')
