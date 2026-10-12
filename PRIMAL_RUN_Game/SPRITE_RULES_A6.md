# A6 HUD and lava/ash – native prototype contract

Follow `PRIMAL_RUN_Sprites/SPRITE_RULES.md`. Preserve all existing sources and
the separately approved presentation-art package.

New HUD chips use a native **24×24 RGBA canvas**, origin 12,12. This explicitly
extends the old 40×40 statistics-icon contract and complements the unchanged
16×16 sun/moon. Native 1× UI placement, no downscaling or icon-only buttons that
replace readable text. Two transparent border pixels minimum, binary alpha,
zero RGB under transparency, fixed Primal Earth 32 palette.

The HUD master actually generated at 1254×1254 with column boundaries 0,314,627,941,1254
and source row boundaries 0,392,784. Integer sampling at stride20/offset10 yields 16×20 samples;
place them at fixed offset4,2 on the 24×24 canvas. No interpolated resize,
redrawn pixels or auto-centering by visible bounding boxes. Record source crop,
sampling, offsets and hashes individually. Lower unused source rows are retained.

Lava/ash uses opaque native32×32 tiles with origin0,0. The 16 marching-square
masks have lava bits NW1, NE2, SE4, SW8. Raw sources, exact sampling and any
authored corrections are preserved. An incorrectly drawn mask must be corrected
with image generation or quarantined; never rotate a different tile into place.
Test actual corner content, every mask, repeated grids and terrain rendering.

Lava art follows existing `isLava`/`riverDistance` and basalt passage geometry.
Native pixel clipping may keep lava pixels on the hazard footprint while bank
pixels blend over existing terrain. Art must never redefine damage, crossings,
spawning, AI or navigation. Animated glints remain separate, frozen on pause
and reduced-motion. Missing images/disabled features preserve existing drawing.

New icons/tiles are `prototype_static`, `production_approved:false` and
`animation_ready:false`. Technical tests do not certify seamless art or GDJS.
Deliver source provenance, manifest, native light/dark and repeated-grid previews,
an interactive review page and separate standalone browser evidence.
