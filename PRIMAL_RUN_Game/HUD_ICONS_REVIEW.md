# HUD icons A-I: native prototypes

80 lossless RGBA PNGs: relics 20, sets 4, loot 6, rarity 7, tags 6, mutations 14,
HUD/menu 13, difficulty 2, future 8. No runtime wiring or flags changed.
All entries remain `prototype_static`, `production_approved: false`.

The A-C concept sheet is a visual reference. These are new hand-plotted native
integer-pixel drawings, not downscaled crops of that sheet. The 21 October native
PNG request follows the concept review. Exact source pixels are preserved in
`Source_Generated/hud_icons/native_pixels_ac.json`; the reproducible drawing source
is `tools/draw_hud_icons_ac.py`. All visible pixels use Primal Earth 32; transparent
pixels are RGBA 0,0,0,0. Highlights are upper-left, contours #151b19.

Review `previews/hud_icons_review.png`: all 80 files at 1x and nearest-neighbor 4x,
on #101713 and #e8ece1. Labels name the actual exported files. The 4x copies are
previews only. Chips have their own simpler native geometry.

The reveal frame uses 8/8/8 segments on each axis; its central 8x8 pixels are
transparent and straight-edge slices repeat without seams. It intentionally
touches the canvas boundary, unlike the standalone icons' 2px padding.
`armor_points.png` leaves columns 16-23 transparent for the HUD number.

## Checks

Run `python tools/draw_hud_icons_ac.py`, then `python tools/validate_hud_icons.py`.
To reproduce the remaining batches, run `python tools/draw_hud_icons_remaining.py
--batch def` and then `python tools/draw_hud_icons_remaining.py --batch ghi` before
validation. These commands preserve the existing other groups and their pixels.
The latter independently reconstructs each PNG from its indexed source and checks
native dimensions, palette, binary alpha, transparent RGB, inventory, padding,
hashes, number space and nine-slice seams. See `hud_icons_validation.json`.
`hud_icons_checks.txt` records rebuild and game-sprite validation output, including
the local checkout baseline. Rebuilt runtime files were restored after checking;
the separate HUD manifest is accepted by the sprite inventory validator without
registering these assets in the game. No `src/*.js` change is part of this batch.

## Visual review

Jonas approved the A-C review on 21 October and requested D-I. The existing
A-C icon files have not changed. The new groups retain prototype status and
await visual review. See HUD_ICONS_DEF_REVIEW.md and HUD_ICONS_GHI_REVIEW.md for
batch details, caveats and the least convincing motifs. Technical validation
does not replace visual approval.
