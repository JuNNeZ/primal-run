# D-F: rarity, mutation tags, mutation themes

27 new native PNGs: rarity 7 x 16px, tags 6 x 16px, mutations 14 x 32px.
The approved A-C artwork is preserved byte-for-byte. The cumulative manifest
contains 57 icons. All retain prototype_static / production_approved=false.

Source: tools/draw_hud_icons_remaining.py --batch def. Exact indexed pixels:
Source_Generated/hud_icons/native_pixels_def.json. Nothing is downscaled; only
review copies use 4x nearest-neighbor. The seven rarity symbols share the gem
silhouette for common-legendary, with increasingly subdivided facets; evolution
has a gold spiral and trophy an orange rook/tower. No runtime code is changed.

See previews/hud_icons_def_detail.png for this batch, and the cumulative
previews/hud_icons_review.png for every file at 1x/4x on both backgrounds.
hud_icons_checks_def.txt records rebuild and validator output on the local
baseline. As in A-C, the sandbox prevents rebuild's nonfatal git-checkout
cleanup; generated tracked files are restored from read-only git show afterward.
The newer PR base still needs CI; these local results do not claim to test it.

Least satisfying: pack_call has very compact raptor heads; pounce's footprints
are simplified; crit is sparse at 16px. All need Jonas' visual review before
being treated as approved artwork. This batch builds on A-C (PR #39).
