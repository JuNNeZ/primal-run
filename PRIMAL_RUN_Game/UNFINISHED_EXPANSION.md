# Preserved unfinished expansion · 2026-10-09

This is a recovery checkpoint, not a finished release. Do not publish this
checkpoint to gh-pages until the missing assets and runtime checks are complete.

## Code preserved

Commit `9befad0` already contains the in-progress code and 12 source atlases for
Pachycephalosaurus, Gallimimus and Baryonyx, plus the new T. rex North atlas.
Triceratops reuses existing enemy frames. Code includes diets, fishing,
Compy pack attack coordination, mutation tradeoffs and +20% relative choice
weight per owned mutation rank, capped at +40%. It is not browser-validated as
an integrated release.

## Original artwork preserved

`Source_Generated/recovery_2026_10_09/preservation_manifest.json` inventories all
85 PNGs found in `/workspace/generated_images`, including original filenames,
SHA-256 hashes and tracked repository destinations. All originals were checked
byte-for-byte. 61 were already archived; 24 were newly preserved. No PNG pixels,
existing atlases, extraction configurations or runtime manifests were changed
by this recovery.

Three later Para candidates are saved as
`Source_Generated/enemy_full/parasaurolophus_{E,N,W}_anatomy_revision.png`.
They have not been registered in sources.json or exported. The four-pose fish
sheet is preserved in `Source_Generated/fishing/fish_sheet.png` but not exported.
Rejected earlier Para directions are under recovery_2026_10_09/rejected and
must not be used in the game. Other unmatched generation candidates are under
recovery_2026_10_09/unreviewed; their purpose/visual suitability remains unknown.

All artwork remains prototype_static, production_approved=false and
animation_ready=false. Archiving is not visual approval or a finished animation.
The common rule is `../PRIMAL_RUN_Sprites/SPRITE_RULES.md`.

## Known blockers and next steps

- player_full_validation.json currently reports FAIL: only 480 frames / 96
  sequences exist, while the expanded plan needs 840 / 168. The previous player
  export aborted on padding at Gallimimus W attack 0 and Baryonyx W hurt 0,
  death 3 and death 4. Resolve source hip registration without inventing pixels,
  then export and validate all new sequences.
- Revisit Baryonyx N/W and T. rex N anatomical anchors. North sources drift
  between cells; default cell-centre anchors are not visually reliable.
- Integrate the three later Para anatomy candidates only after frame-by-frame
  review. Preserve original atlases and South movement override.
- Fish asset paths referenced by app.js do not exist yet. Create documented
  integer/native extraction, a manifest and validation, and include it in builds.
- Inspect new assets on light/dark backgrounds and actual motion/state changes.
  Existing candidate death poses/body consistency remain prototype limitations.
- Rebuild the generated GDevelop project from src after integration; run full
  npm test in a temporary copy, PNG validators and a real GDevelop export.
  Historical browser/GDevelop reports do not validate this expansion.
- Faster decay, escape regeneration, predator attraction, new DNA laboratory
  descriptions and playable T. rex from the subsequent request are NOT
  implemented in this checkpoint. Do not claim these features are delivered.

## Recovery validation

`node --test tests/*.test.cjs` completed with exit 0 on 2026-10-09; the runner
reported 10 passing test files, zero failures. Exact output is retained in
Source_Generated/recovery_2026_10_09/core-test-run.txt. This is core validation
only: no browser/GDevelop tests or asset regeneration were run for the backup.
The source PNG inventory verified every file's SHA-256 after copying.
