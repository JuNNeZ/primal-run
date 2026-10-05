# PRIMAL RUN - walk prototype v3

Follow the included v1 and v2 reference rules, with these explicit demo updates.

- SOUTH-facing Utahraptor walk: 6 frames, 8 fps, looping, 0.75 seconds per cycle.
- Every Player image is RGBA 128x128, origin and body anchor exactly (64,72).
- One fixed generated body layer is reused in every frame. Generated limb phases
  are assembled inside the two recorded windows in walk_assembly.json.
- Torso, tail, head and every pixel outside these limb windows must be identical
  throughout Walk_S and Idle_S. Validate this directly, not just by bounding boxes.
- Idle_S uses the matching assembled phase 1, so state changes preserve scale.
- No body scaling, rotation, mirroring, blur, shading regeneration or dithering.
- The shared 24-color palette and binary alpha rules remain mandatory.
- Draw at integer pixels. Collision remains attached to the torso and unchanged
  by animation. The loop advances only when actual southward movement occurs.
- Other movement directions remain static south-facing demo placeholders.
- Individual PNG images have prototype status. The Walk_S series is ready for
  this browser demo, but not production-approved before GDevelop runtime review.
- Inspect the native and 4x GIFs and all frames on light/dark backgrounds. Verify
  5 -> 0 closure, moving -> stopped, blocked movement and restart in the browser.
- The raw generated sheet is a reference: it contains body color/detail drift.
  Import the assembled assets/player PNGs, not the raw sheet, into GDevelop.

This prototype uses a stable body and foot-phase motion. A later full walk cycle
can add controlled tail/hip motion after directional artwork is complete.
