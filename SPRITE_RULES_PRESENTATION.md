# October handoff art contract

The project-wide rule is included in `reference/SPRITE_RULES.md` and applies.
This separate delivery uses the requested handoff dimensions instead of the
older kit's UI dimensions: sun/moon 16×16; ally marker 12×12; bubbles 16×16;
ash clouds 192×128. All origins and sizes are in `manifest.json`.
Reused basalt remains native 256×256/origin 128,128 under the included
`Source_Reused/feathered/reference/SPRITE_RULES_GROUND.md` contract, unchanged.
Bubble sampling is recorded per source. These are unapproved size/timing studies,
not an extension of dinosaur sampling exceptions.

Ground files are 32×32 **transparent north-facing shoreline overlays**, not
opaque ground tiles or a complete edge/corner set. Their outer left/right
columns match. They must be composited over terrain. Other edge orientations
are not supplied; do not rotate them automatically and reverse the lighting.

Use lossless native RGBA, the included Primal Earth 32 palette, binary alpha,
zero RGB under transparency, integer placement, and nearest-neighbor scaling.
Free-standing assets have at least two transparent pixels at every border.
Lighting remains at the upper left.

Every asset remains `prototype_static`, `production_approved=false`.
Four-frame effects are original timing studies, not approved animations.
Review at 1× and 4×, then test in the actual game before approval.
