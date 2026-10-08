'use strict';
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), game = path.join(root, 'PRIMAL_RUN_Game');
const out = path.join(root, 'dist');
fs.mkdirSync(out, { recursive: true });
// Ship game and optional sprite-review evidence; omit source art and GDevelop project.
for (const name of ['index.html', 'style.css', 'music_manifest.json', 'adaptive_runtime_report.json', 'src', 'assets', 'sounds', 'player_review.html', 'player_full_review.html', 'ecology_review.html', 'NEXT_IMPROVEMENTS.md', 'ecology_manifest.json', 'ecology_validation.json', 'sprite_size_audit.json', 'jungle_runtime_report.json', 'SPRITE_RULES_ECOLOGY.md', 'player_full_manifest.json', 'player_full_animations.json', 'player_full_validation.json', 'player_full_runtime_report.json', 'SPRITE_RULES_PLAYER_FULL.md', 'SPRITE_RULES.md', 'SPRITE_RULES_v1_reference.md', 'SPRITE_RULES_v2_reference.md', 'player_combat_animations.json', 'player_sprite_validation.json', 'enemy_review.html', 'enemy_animations.json', 'enemy_sprite_validation.json', 'enemy_animation_manifest.json', 'enemy_animation_runtime_report.json', 'world_runtime_report.json', 'polish_runtime_report.json', 'roguelite_runtime_report.json', 'palette.json', 'SPRITE_RULES_ENEMIES.md']) {
  fs.cpSync(path.join(game, name), path.join(out, name), { recursive: true });
}
fs.cpSync(path.join(game, 'previews/player_full'), path.join(out, 'previews/player_full'), {recursive:true});
fs.cpSync(path.join(game, 'previews/ecology'), path.join(out, 'previews/ecology'), {recursive:true});
fs.cpSync(path.join(game, 'previews/layout'), path.join(out, 'previews/layout'), {recursive:true});
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('Built static browser game in dist/. All paths are relative for GitHub Pages.');
