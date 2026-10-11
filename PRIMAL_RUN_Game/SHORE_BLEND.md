# Shore blending

Opaque land in the native shore tiles made 32-pixel rectangles against the
new darker ground. `FEATURES.shoreBlend` fades only the authored land pixels
using bilinear weights from the existing shared wet/dry corners. Neighbouring
tiles share the weights, so the transition follows the bank continuously.

Original water/depth/foam colours stay opaque and byte-identical in the cached
runtime layer. All source PNGs, masks, colliders, water classification and
fishing rules remain unchanged. Rendering stays at native 32 pixels without
image interpolation. At most 28 shore layers are cached, one per mixed mask
and bank family. The old layer is available with the feature disabled.

`tests/shore-blend-browser.cjs` checks soil and sand fades, original water/foam
pixels, paused-state stability and rollback. Before/after screenshots are in
`previews/shore_blend`; the standalone browser report is `shore_blend_runtime_report.json`.
This is renderer verification, not a new visual approval of the existing tiles
or a GDevelop editor export.
