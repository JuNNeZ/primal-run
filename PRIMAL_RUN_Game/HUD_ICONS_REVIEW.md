# HUD icons A-C: native prototypes

30 lossless RGBA PNGs: relics 10 x 32px plus 10 independently drawn 16px chips;
sets 4 x 24px; loot 4 x 24px and 2 x 32px. No runtime wiring or flags changed.
All entries remain `prototype_static`, `production_approved: false`.

The A-C concept sheet is a visual reference. These are new hand-plotted native
integer-pixel drawings, not downscaled crops of that sheet. The 21 October native
PNG request follows the concept review. Exact source pixels are preserved in
`Source_Generated/hud_icons/native_pixels_ac.json`; the reproducible drawing source
is `tools/draw_hud_icons_ac.py`. All visible pixels use Primal Earth 32; transparent
pixels are RGBA 0,0,0,0. Highlights are upper-left, contours #151b19.

Review `previews/hud_icons_review.png`: all 30 files at 1x and nearest-neighbor 4x,
on #101713 and #e8ece1. Labels name the actual exported files. The 4x copies are
previews only. Chips have their own simpler native geometry.

The reveal frame uses 8/8/8 segments on each axis; its central 8x8 pixels are
transparent and straight-edge slices repeat without seams. It intentionally
touches the canvas boundary, unlike the standalone icons' 2px padding.
`armor_points.png` leaves columns 16-23 transparent for the HUD number.

## Checks

Run `python tools/draw_hud_icons_ac.py`, then `python tools/validate_hud_icons.py`.
The latter independently reconstructs each PNG from its indexed source and checks
native dimensions, palette, binary alpha, transparent RGB, inventory, padding,
hashes, number space and nine-slice seams. See `hud_icons_validation.json`.
`hud_icons_checks.txt` records rebuild and game-sprite validation output, including
the local checkout baseline. Rebuilt runtime files were restored after checking;
the separate HUD manifest is accepted by the sprite inventory validator without
registering these assets in the game. No `src/*.js` change is part of this batch.

## Visual review still required

Least convincing: `feathered_arms_16` loses feather/claw separation at 16px;
`display_crest` may read as a curved horn without dinosaur context; `fat_hump`
is necessarily generic. Review these before approving the family or expanding
groups D-I. No additional groups are included in this batch.
