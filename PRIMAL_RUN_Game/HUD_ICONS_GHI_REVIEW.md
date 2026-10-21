# G-I: HUD/menu, difficulty, future systems

23 new native 24px PNGs: HUD/menu 13, difficulty 2, future 8.
All 80 requested PNGs now exist across A-I. All remain prototype_static and
production_approved=false. The new icons await Jonas' visual review; A-C art
was approved earlier and remains unchanged. No runtime code or flags changed.

Source: tools/draw_hud_icons_remaining.py --batch ghi. Exact indexed pixels:
Source_Generated/hud_icons/native_pixels_ghi.json. No source sprite is resized.
Review-only 4x copies use nearest-neighbor. The final combined review is
previews/hud_icons_review.png; this batch also has hud_icons_ghi_detail.png.

Every file uses the fixed palette, binary alpha and black transparent RGB.
All standalone files have 2px padding. See hud_icons_validation.json and
hud_icons_checks_ghi.txt for technical checks and the exact local test baseline.
Generated tracked runtime files are restored after rebuild. Local tests are on
the available older Windows checkout; CI must test the PR's newer base.

Least satisfying: rival is a highly simplified frontal dinosaur skull;
extinction_pressure squeezes two motifs into 24px; bounty_target's footprint
loses some toes beneath the reticle. The future icons are unused art only.
This cumulative batch depends on the preceding A-C and D-F batches.
