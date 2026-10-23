# Stat icons for Dit build

Eight review-only icons in `assets/hud_icons/stats/`, each with a 16px PNG and
an exact nearest-neighbor 32px `_32.png` companion. Status: `prototype_static`;
Jonas supplies visual approval. No `approval.json`, runtime code or flags changed.

The brief explicitly requests 16/32px instead of the legacy rule's 40px UI
canvas. It also explicitly requests contour #101b16, which is absent from
`palette.json`. This delivery records that single contour exception; all other
opaque colors use Primal Earth 32. The approved tag references actually use
#151b19, so this contour follows the new brief rather than claiming an exact
palette match. The palette file itself is unchanged.

Preserved generated sources, per-icon fixed integer sampling coordinates and
native indexed pixels are in `Source_Generated/hud_icons/stats/`. No smoothing
or invented detail is used during export. The 32px files enlarge native pixels
2x; they do not add detail. Raw and exported SHA-256 values are in the HUD manifest.

Review `previews/stat_icons_review.png`: each icon at 16px, 32px and 4x native
on #101b16 and #e8ece1. Check the heart/bone edge, three teeth, curved claw and
sparkle, armor ridge, drop/up arrow, dinosaur foot/speed lines, ring/bolt and
four leaves/sparkle. Automated export checks cannot approve motif readability.

Reproduce: `python tools/export_stat_icons.py`,
`python tools/validate_hud_icons.py`, `python tools/validate_game_sprites.py`.
The project rule is `../PRIMAL_RUN_Sprites/SPRITE_RULES.md`, supplemented by the
explicit size and contour choices above. All assets retain two transparent
native pixels of padding. See `hud_icons_validation.json` for technical evidence.

Claude can update `SHEET_ICONS` after Jonas approves. These icons have not been
wired into the character panel or tested in a browser/GDevelop runtime.

## Validation results

- HUD technical gate: PASS, 96 total PNGs including 16 new stat files.
- Game asset gate: PASS, 5,985 assets; no inventory or palette errors.
- Prototype Kit: PASS, 104 assets.
- `git diff --check`: PASS.
- Broad `npm test` in an isolated copy of the tracked starting tree: atlas tests
  passed; 384/385 game unit tests passed. Existing
  `rig-animator.test.cjs:176` fails because Iguanodon cutout parts differ from
  their recorded approval. That baseline copy did not include the new stat
  assets. The failing unit stage prevented browser and historical kit stages.
  Full output: `Source_Generated/hud_icons/stats/npm_test.txt`.

The generated grids are irregular and require fixed integer sampling. Fine
sparkles and tooth serrations simplify at 16px; inspect the native row before
approval. A passing technical gate does not certify every outline or motif.
