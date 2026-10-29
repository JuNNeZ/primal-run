'use strict';
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), game = path.join(root, 'PRIMAL_RUN_Game');
const out = path.join(root, 'dist');
fs.mkdirSync(out, { recursive: true });
// Start from an empty dist (keep a .git so dist can be a gh-pages worktree): stale sheets or files removed from the
// game must not linger on the live site.
for (const name of fs.readdirSync(out)) if (name !== '.git') fs.rmSync(path.join(out, name), { recursive: true, force: true });
// Ship only what the browser game loads. Review pages, previews, reports and docs stay in the repo.
for (const name of ['index.html', 'style.css', 'src', 'assets', 'sounds', 'PATCH_NOTES.html', 'patch_notes']) {
  fs.cpSync(path.join(game, name), path.join(out, name), { recursive: true });
}
fs.writeFileSync(path.join(out, '.nojekyll'), '');
// Pages caches stable URLs. Version scripts and images together so new atlas
// coordinates cannot be paired with a cached sheet from the previous release.
const crypto = require('node:crypto');
const releaseHash = crypto.createHash('sha256');
for (const name of [...fs.readdirSync(path.join(out, 'src')).filter(n=>n.endsWith('.js')).sort().map(n=>'src/'+n), 'style.css', ...fs.readdirSync(path.join(out, 'assets/atlases')).filter(n=>n.endsWith('.png')).sort().map(n=>'assets/atlases/'+n)]) {
  releaseHash.update(name); releaseHash.update(fs.readFileSync(path.join(out,name)));
}
const version = releaseHash.digest('hex').slice(0,16);
const entry = path.join(out, 'index.html');
let html = fs.readFileSync(entry,'utf8');
html = html.replace(/(src|href)="(src\/[^"?]+\.js|style\.css)"/g, '$1="$2?v='+version+'"');
html = html.replace('PrimalApp.mount();', 'PrimalApp.mount({resolve:path=>path+(path.includes("?")?"&":"?")+"v='+version+'"});');
fs.writeFileSync(entry, html);
const sourceCommit = process.env.PRIMAL_RELEASE_COMMIT || process.env.GITHUB_SHA || null;
fs.writeFileSync(path.join(out,'release.json'), JSON.stringify({source_commit:sourceCommit,version,native_ground:true},null,2)+'\n');
console.log('Built static browser game in dist/. All paths are relative for GitHub Pages.');
