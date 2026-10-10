# Preserved follow-up sources — 2026-10-10

All raw masters and rejected attempts are retained. Generated art is a prototype, not an anatomical approval.

- player_full: Deinonychus source sheets, including rejected source variants; native export configuration and previews retained.
- avatars: three accepted head source sheets and the rejected full-body attempt; sources.json preserves fixed extraction landmarks. 240 native 64px reaction frames.
- species_attacks: four integrated prototype families (Triceratops, Pachycephalosaurus, Gallimimus, Ankylosaurus), 96 native 144px frames; Ankylosaurus recovery revision retained. Parasaurolophus kick revision is rejected and NOT used in game.
- forage: raw food pickup sheet and fixed extraction config; eight native 64px pickups.

SHA-256 hashes, native pivots, extraction coordinates and status are in avatar_manifest.json, species_attack_manifest.json, forage_manifest.json and player_full_manifest.json in the game directory. See the matching SPRITE_RULES documents and local primal-assets skill before re-exporting. No automatic anatomical redraw or bounding-box recentering is allowed.

## Ankylosaurus reuse / further A

The former generated Ankylosaurus A1 body and recovery revision are rejected, retained with config under rejected_generation. Its active24 overlay frames now reuse the preserved player_full originals exactly. Parasaurolophus kick revision2 uses the four original source atlases as references and remains review-only. Its whole raw image, native24 derivative poses, extraction coordinates, crop exclusions and hashes are retained. No generated files are dependent on /workspace/generated_images surviving.
