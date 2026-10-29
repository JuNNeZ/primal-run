#!/usr/bin/env node
'use strict';
// PreToolUse hook for Bash (registered in .claude/settings.json). Turns three CLAUDE.md rules into hard stops,
// idea borrowed from Claude Code Game Studios' validate-commit/validate-push hooks:
//   1. Commits: browser tests rewrite tracked *_report.json and previews/*.png; committing them needs `# keep-reports`.
//   2. Pushes: never force-push (--force-with-lease only to claude/*), never push to main or codex/*,
//      gh-pages only with `# udgiv` in the command, written after Jonas wrote "udgiv". The marker is not the approval.
//   3. Token sink: generated files with megabyte-long lines (project.json, assets.js, lang) must not be printed whole
//      by cat/grep/sed/git diff; bound the output (-o, -c, -l, cut -c, --stat, rg -M ...) or add `# bounded`.
// Exit 2 blocks the call and shows stderr to Claude; exit 0 lets it through. Any internal error lets it through.
const { spawnSync } = require('node:child_process');

const MONOLINE = /(^|[\s'"\/=])((PRIMAL_RUN_Game\/)?project\.json|(PRIMAL_RUN_Game\/)?src\/(assets|lang)\.js|(PRIMAL_RUN_Game\/)?src\/lang\/(\*|[\w.*-]*\.js)?)(?=$|[\s'"])/;
const BROAD_TARGET = /^(\.|\.\/|PRIMAL_RUN_Game\/?|PRIMAL_RUN_Game\/src\/?|PRIMAL_RUN_Game\/src\/lang\/?)$/;
const BOUNDED = /(^|\s)(-[a-zA-Z]*[olcLqM][a-zA-Z]*|--only-matching|--count|--files-with-matches|--files-without-match|--quiet|--max-columns(=\S+)?|--stat|--shortstat|--numstat|--name-only|--name-status|--exclude(-dir)?(=\S+)?|--include(=\S+)?|-g|--glob(=\S+)?)(?=\s|$)|\|\s*(cut\s+-c|head\s+-c|wc\b)|#\s*bounded\b/;

function segments(cmd) {
  return cmd.replace(/#[^\n]*/g, ' ').split(/&&|\|\||;|\n|\|(?!\|)/).map(s => s.trim()).filter(Boolean);
}
function words(seg) {
  return (seg.match(/"[^"]*"|'[^']*'|\S+/g) || []).map(w => w.replace(/^["']|["']$/g, ''));
}
function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : '';
}
// git [-C dir] [-c k=v] <sub> ... -> { sub, dir, rest }
function gitCall(w, cwd) {
  if (w[0] !== 'git') return null;
  let i = 1, dir = cwd;
  while (i < w.length && w[i].startsWith('-')) {
    if (w[i] === '-C') { dir = require('node:path').resolve(cwd, w[i + 1] || '.'); i += 2; }
    else if (w[i] === '-c') i += 2;
    else i++;
  }
  return { sub: w[i], dir, rest: w.slice(i + 1) };
}

function checkCommit(call, cmd, cwd) {
  if (/#\s*keep-reports\b/.test(cmd)) return null;
  const staged = git(call.dir, ['diff', '--cached', '--name-only']).split('\n');
  const addsAll = /\bgit\s+add\s+(-A|--all|\.)(\s|$)/.test(cmd) || call.rest.some(a => /^-[a-zA-Z]*a[a-zA-Z]*$/.test(a) || a === '--all');
  const unstaged = addsAll ? git(call.dir, ['status', '--porcelain', '-uno']).split('\n').map(l => l.slice(3)) : [];
  const hits = [...new Set([...staged, ...unstaged])].filter(f => /_report\.json$|(^|\/)previews\/.*\.png$/.test(f));
  if (!hits.length) return null;
  return `Commit stopped: it includes files the browser tests rewrite (${hits.slice(0, 5).join(', ')}${hits.length > 5 ? ', ...' : ''}).\n` +
    'Restore them with `git checkout -- <file>` (CLAUDE.md "Code and generated files"), or, if the change is intended, add `# keep-reports` to the end of the commit command.';
}

function checkPush(call, cmd) {
  const opts = call.rest.filter(a => a.startsWith('-')), pos = call.rest.filter(a => !a.startsWith('-'));
  const lease = opts.some(a => a.startsWith('--force-with-lease'));
  const force = opts.some(a => a === '--force' || a === '--mirror' || /^-[a-zA-Z]*f[a-zA-Z]*$/.test(a)) || pos.slice(1).some(r => r.startsWith('+'));
  const head = git(call.dir, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const refs = pos.length > 1 ? pos.slice(1) : [head];
  const dsts = refs.map(r => {
    let d = r.replace(/^\+/, ''); d = d.includes(':') ? d.split(':').pop() : d;
    if (d === 'HEAD' || d === '') d = head;
    return d.replace(/^refs\/heads\//, '');
  });
  if (force) return 'Push stopped: force-push is never allowed here (CLAUDE.md "Branches and PRs"). Use --force-with-lease, and only on your own claude/* branch.';
  if (lease && !dsts.every(d => d.startsWith('claude/'))) return 'Push stopped: --force-with-lease is only for your own claude/* branch, never ' + dsts.join(', ') + '.';
  if (dsts.includes('main')) return 'Push stopped: main only receives releases, never direct pushes (CLAUDE.md). Push a claude/* branch and open a PR to integration/next.';
  const codex = dsts.find(d => d.startsWith('codex/'));
  if (codex) return `Push stopped: ${codex} belongs to Codex; never push to or overwrite a codex/* branch (CLAUDE.md).`;
  if (dsts.includes('gh-pages') && !/#\s*udgiv\b/.test(cmd)) {
    return 'Push stopped: gh-pages is the live site. Publish only after Jonas has written "udgiv" (CLAUDE.md "Going live"): back up first, ' +
      'build with npm run build:web, then rerun the push with `# udgiv` at the end. The marker records that he did; it does not replace his word.';
  }
  return null;
}

function checkOutput(w, seg, cmd) {
  if (BOUNDED.test(cmd)) return null;
  const call = w[0] === 'git' ? gitCall(w, '.') : null;
  const prints = call ? ['diff', 'show', 'log', 'blame'].includes(call.sub) : /^(cat|grep|egrep|fgrep|rg|sed|awk|head|tail|less|more)$/.test(w[0]);
  if (!prints) return null;
  const msg = 'Command stopped: it would print generated files whose lines are up to 1.4 MB (project.json, src/assets.js, src/lang*). ' +
    'Bound the output (grep -o / -c / -l, rg -M 300, cut -c1-300, git diff --stat) or exclude them; add `# bounded` if you are sure it stays small.';
  if (MONOLINE.test(' ' + seg)) return msg;
  // A recursive search from the repo root or the game folder also reaches those files.
  const recursive = w[0] === 'rg' || (/grep$/.test(w[0]) && w.some(a => /^-[a-zA-Z]*[rR]/.test(a) || a === '--recursive'));
  if (recursive) {
    const targets = w.slice(1).filter(a => !a.startsWith('-')).slice(1);
    if (!targets.length || targets.some(t => BROAD_TARGET.test(t))) return msg;
  }
  return null;
}

function check(input) {
  if (input.tool_name !== 'Bash') return null;
  const cmd = String((input.tool_input || {}).command || ''), cwd = input.cwd || process.cwd();
  for (const seg of segments(cmd)) {
    const w = words(seg), call = gitCall(w, cwd);
    const why = call && call.sub === 'commit' ? checkCommit(call, cmd, cwd)
      : call && call.sub === 'push' ? checkPush(call, cmd)
      : checkOutput(w, seg, cmd);
    if (why) return why;
  }
  return null;
}

if (require.main === module) {
  let raw = '';
  process.stdin.on('data', d => { raw += d; });
  process.stdin.on('end', () => {
    let why = null;
    try { why = check(JSON.parse(raw)); } catch (e) { process.exit(0); }
    if (why) { process.stderr.write(why + '\n'); process.exit(2); }
    process.exit(0);
  });
}
module.exports = { check };
