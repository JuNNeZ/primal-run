'use strict';
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), game = path.join(root, 'PRIMAL_RUN_Game');
const out = path.join(root, 'dist');
fs.mkdirSync(out, { recursive: true });
// Atlas regrouping can remove pages. Do not ship stale sheets from an earlier build.
fs.rmSync(path.join(out, 'assets/atlases'), { recursive: true, force: true });
// Ship game and optional sprite-review evidence; omit source art and GDevelop project.
for (const name of ['native_behavior_review.html','native_behavior_manifest.json','NATIVE_BEHAVIOR_VALIDATION.json','NATIVE_BEHAVIOR_BODY_AUDIT.json','SPRITE_RULES_NATIVE_BEHAVIOR.md','injured_walk_manifest.json','injured_walk_review.html','INJURED_WALK_STATUS.md','INJURED_WALK_VALIDATION.json','water_corner_validation.json','behavior_review.html','behavior_manifest.json','water_transition_manifest.json','PART_A_ASSET_VALIDATION.json','part_a_environment_runtime_report.json','SPRITE_RULES_BEHAVIOR.md','SPRITE_RULES_WATER_TILES.md','PART_A_REUSE_VALIDATION.json','part_a_review.html','part_a_runtime_report.json','SPRITE_RULES_LIMP.md','forage_manifest.json','forage_validation.json','SPRITE_RULES_FORAGE.md','hud_attack_review.html','avatar_manifest.json','avatar_validation.json','species_attack_manifest.json','species_attack_animations.json','species_attack_validation.json','SPRITE_RULES_AVATARS.md','SPRITE_RULES_SPECIES_ATTACKS.md','OVERLAPPING_DISCOVERIES.md','deinosuchus_playable_review.html','deinosuchus_playable_manifest.json','deinosuchus_playable_validation.json','SPRITES_AND_MECHANICS_STATUS.md','IDEABANK.md','MISSING_SPRITES.md','OVERHAUL_2026-10.md','JOURNEY_AND_COMPY.md','journey_validation_report.json','journey_runtime_report.json','journey_player_runtime_report.json','journey_enemy_runtime_report.json','WATER_AND_BARYONYX_FIX.md','water_fishing_runtime_report.json','bary_n_runtime_report.json','corpse_anatomy_review.json','corpse_scenes_runtime_report.json','RESEARCH_AND_ECOLOGY.md','corpse_manifest.json','corpse_validation.json','SPRITE_RULES_CORPSES.md','SPECIES_ANATOMY.md','research_runtime_report.json','carrion_rex_runtime_report.json','CARRION_AND_REX.md','fishing_manifest.json','fishing_validation.json','SPRITE_RULES_FISHING.md','CODE_AUDIT.md','combat_feedback_runtime_report.json','COMBAT_FEEDBACK.md','eating_priorities_5_8_runtime_report.json','eating_priorities_5_8_gdevelop_report.json','PRIORITIES_5_8.md','priorities_1_4_runtime_report.json','enemy_full_review.html', 'enemy_full_manifest.json','enemy_full_animations.json','enemy_full_validation.json','enemy_full_runtime_report.json','terrain_runtime_report.json','balance_audit.json','PRIORITIES_1_4.md','SPRITE_RULES_ENEMY_FULL.md','index.html', 'PATCH_NOTES.html', 'patch_notes', 'style.css', 'music_manifest.json', 'adaptive_runtime_report.json', 'src', 'assets', 'sounds', 'player_review.html', 'player_full_review.html', 'ecology_review.html', 'NEXT_IMPROVEMENTS.md', 'ecology_manifest.json', 'ecology_validation.json', 'sprite_size_audit.json', 'jungle_runtime_report.json', 'SPRITE_RULES_ECOLOGY.md', 'player_full_manifest.json', 'player_full_animations.json', 'player_full_validation.json', 'player_full_runtime_report.json', 'SPRITE_RULES_PLAYER_FULL.md', 'SPRITE_RULES.md', 'SPRITE_RULES_v1_reference.md', 'SPRITE_RULES_v2_reference.md', 'player_combat_animations.json', 'player_sprite_validation.json', 'enemy_review.html', 'enemy_animations.json', 'enemy_sprite_validation.json', 'enemy_animation_manifest.json', 'enemy_animation_runtime_report.json', 'world_runtime_report.json', 'polish_runtime_report.json', 'roguelite_runtime_report.json', 'palette.json', 'SPRITE_RULES_ENEMIES.md']) {
  fs.cpSync(path.join(game, name), path.join(out, name), { recursive: true });
}
for (const name of ['previews', 'balance_runs']) {
  if (fs.existsSync(path.join(game, name))) fs.cpSync(path.join(game, name), path.join(out, name), {recursive:true});
}
for (const name of ['species_animation_review.html','species_animation_review_data.js',
  'species_animation_audit.json','SPECIES_ANIMATION_AUDIT.md','animation_continuity_runtime_report.json',
  'ANIMATION_POLISH.md','animation_polish_validation.json','animation_polish_runtime_report.json',
  'animation_polish_gdevelop_report.json','animation_polish_gdevelop_player_report.json',
  'animation_polish_gdevelop_enemy_report.json','animation_polish_gdevelop_continuity_report.json']) {
  if (fs.existsSync(path.join(game, name))) fs.copyFileSync(path.join(game, name), path.join(out, name));
}
for (const name of ['sprite_atlas_manifest.json','sprite_atlas_validation.json','presentation_manifest.json','presentation_atlas_runtime_report.json','presentation_implementation_validation.json','SPRITE_RULES_PRESENTATION.md','PRESENTATION_AND_ATLAS.md','GROUND_REUSE.md','ground_reuse_manifest.json','ground_reuse_validation.json','native_ground_runtime_report.json','native_ground_implementation_validation.json','SPRITE_RULES_GROUND.md','PAGES_GROUND_RELEASE.md','pages_build_runtime_report.json','SHORE_BLEND.md','shore_blend_runtime_report.json','NATURAL_LAKES_AND_FISHING.md','natural_fishing_runtime_report.json']) fs.copyFileSync(path.join(game,name),path.join(out,name));
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
