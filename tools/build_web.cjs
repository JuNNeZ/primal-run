'use strict';
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), game = path.join(root, 'PRIMAL_RUN_Game');
const out = path.join(root, 'dist');
fs.mkdirSync(out, { recursive: true });
// Ship game and optional sprite-review evidence; omit source art and GDevelop project.
for (const name of ['index.html', 'style.css', 'src', 'assets', 'sounds', 'player_review.html', 'player_combat_animations.json', 'player_sprite_validation.json', 'enemy_review.html', 'enemy_animations.json', 'enemy_sprite_validation.json', 'enemy_animation_manifest.json', 'enemy_animation_runtime_report.json', 'palette.json', 'SPRITE_RULES_ENEMIES.md']) {
  fs.cpSync(path.join(game, name), path.join(out, name), { recursive: true });
}
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('Built static browser game in dist/. All paths are relative for GitHub Pages.');
