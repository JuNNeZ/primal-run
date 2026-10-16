# PRIMAL RUN - original demo sprites, rule v2

This demo replaces the old concept-sheet crops with original generated assets.
Keep this rule, the palette, the manifest, the prompts and the validation report
with every delivery. The project's original rule remains applicable unless this
document explicitly refines a demo constraint.

## Locked demo specification

- Semi-realistic, overhead pixel art, earthy colors, upper-left light.
- One shared 24-color palette, defined in palette.json. Every exported visible
  pixel must match this palette. No dithering or interpolated export pixels.
- Individual lossless RGBA PNGs. Alpha is exactly 0 or 255. Transparent pixels
  have RGB 0,0,0. Generated source images are preserved separately.
- Nearest-neighbor sampling to native export dimensions is allowed for original
  generated assets. This is a documented export step, not a native-pixel fidelity
  claim for high-resolution generated sources. No smoothing or blur is allowed.
- Utahraptor: 128x128; Compy: 64x96; fern and rock: 64x64; food and ground: 32x32.
- At least two transparent pixels around standalone exported objects.
- Player and Compy each have one SOUTH-facing static pose. The demo has no sprite
  frame animations. Their origin/body-anchor coordinates are in the manifest.
- Object origins use whole pixels. Display at 1x, 2x or 4x, with smoothing off.
- No rotation or mirroring of the directional dinosaur sprites in the demo;
  other directional views require their own matched assets.
- Collision remains attached to the torso, never the whole tail silhouette.
- The grass tile is a prototype until repeated edges are visually approved.
- New animation series must follow the original rule's canvas, anatomy, anchors,
  frame order, loop review and GDevelop runtime gates. Single poses are not loops.

## Status

All six assets are `prototype_static`. Passing the palette/export validator
does not mean production art or GDevelop runtime validation is complete.
The playable HTML preview is a separate demo, not a GDevelop export.

Before any production animation is accepted, inspect all frames at 1x and 4x on
light and dark backgrounds and test the sequence in GDevelop.
