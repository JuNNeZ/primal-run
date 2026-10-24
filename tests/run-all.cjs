'use strict';
// Runs every tests/*.test.cjs with node --test, then every tests/*-browser.cjs one at a time (they share a port and
// rewrite previews). New test files are picked up automatically, so package.json never needs a list again.
// Usage: node tests/run-all.cjs [unit|browser]
const fs = require('node:fs'), path = require('node:path'), { spawnSync } = require('node:child_process');
const dir = __dirname, only = process.argv[2], files = fs.readdirSync(dir).sort();
const run = args => spawnSync(process.execPath, args, { stdio: 'inherit', cwd: path.resolve(dir, '..') }).status;
if (only !== 'browser') {
  const unit = files.filter(f => f.endsWith('.test.cjs')).map(f => path.join('tests', f));
  if (run(['--test', ...unit]) !== 0) process.exit(1);
}
if (only !== 'unit') {
  for (const f of files.filter(f => f.endsWith('-browser.cjs'))) {
    console.log('\n== ' + f);
    if (run([path.join('tests', f)]) !== 0) { console.error('FAIL ' + f); process.exit(1); }
  }
}
