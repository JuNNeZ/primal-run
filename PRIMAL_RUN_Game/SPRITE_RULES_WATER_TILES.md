# Authored16-mask water transitions

Families: soil→shallow, sand→shallow, shallow→deep. Each opaque native32×32 tile
uses corner bits NW1, NE2, SE4, SW8, row-major masks0–15. Draw this actual shape,
not an arbitrary nice-looking bank. Shared vertices on the32px world grid select masks
using the same isWater/isDeepWater geometry as movement. No forced arbitrary water
colliders; fords omit deep water and retain stones. Preserve foam/glints independently
of base rendering, tracing the river path before drawing animated strokes.

The original revision1 source size is1254×1254, not the requested1024. Its explicit
cell boundaries0,314,627,941,1254 and integer10 sampling offset1 are recorded. Export
uses fixed32palette; all-water/depth samples use a water-colour subset from that palette.
No interpolation, rotations, invented banks or painted pixels during extraction.
Corner connectivity and texture seams require visual/source QA in addition to hashes.
Misdrawn masks must be revised with imagegen and original tiles as references; do not
silently map a mask to a different shape or report a48file inventory as seamless art.

Cache world vertices per map/geometry signature; render only visible tiles. Refresh when
pond/river/ford geometry changes. FEATURES.waterTiles rolls back the visual layer.
Native previews, manifest and provenance live alongside raw Source_Generated/water_transitions.
Use tools/export_water_transitions.py and tools/validate_part_a.py; quality gates must
cover actual corner assignments and the renderer, not merely PNG dimensions.

Revision2 corrects seven incorrectly drawn corner masks via a separate authored source.
Named320×320 interior crops and integer10 sampling replace only the three bank/four
depth tiles; no other tile shape is synthesized. Depthpalette keeps existing #3b4144
dark water rather than flattening it into shallowblue. tools/validate_water_corners.py
checks all48 corner assignments; trace(map.river) is independent of tiled base drawing.

Runtime visual limitation: repeated foam/depth patterns can remain visibly tiled, especially in a straight test river. Corner topology and collision agreement are validated; organic seam/pattern polish still needs visual approval. Do not label these tiles seamless production art.
