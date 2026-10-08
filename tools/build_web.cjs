'use strict';
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), game = path.join(root, 'PRIMAL_RUN_Game');
const out = path.join(root, 'dist');
fs.mkdirSync(out, { recursive: true });
// Exclude GDevelop project, source art and authoring documents from the website.
for (const name of ['index.html', 'style.css', 'src', 'assets', 'sounds', 'player_review.html', 'player_combat_animations.json', 'player_sprite_validation.json']) {
  fs.cpSync(path.join(game, name), path.join(out, name), { recursive: true });
}
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('Built static browser game in dist/. All paths are relative for GitHub Pages.');
