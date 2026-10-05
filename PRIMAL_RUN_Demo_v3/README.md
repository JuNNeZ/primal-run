# PRIMAL RUN - south walk demo v3

Open demo.html in a browser. Move SOUTH with S or Down to see Walk_S.
WASD/arrows still move in all directions; other views remain static placeholders.
Space bites, meat heals, and R restarts. V2 is preserved separately.

## GDevelop import

1. Create a Sprite named Player.
2. Create Idle_S with assets/player/utahraptor_idle_S_000.png as its single image.
3. Create Walk_S, then import utahraptor_walk_S_000.png through _005.png IN ORDER.
4. Set time between frames to 0.125 seconds and enable loop for Walk_S.
5. Set origin and BodyAnchor to X=64, Y=72 for EVERY image in both animations.
6. Keep the canvas at 128x128, filtering disabled and integer display scale.
7. Change to Walk_S during actual southward movement and Idle_S when stopped.
   Use a stable torso collision shape, not an auto-generated tail silhouette.

The matching rest frame replaces the idle image in this new V3 package, avoiding
body-size/stripe changes on animation switches. Original V2 remains intact.

Official Sprite guide: https://wiki.gdevelop.io/gdevelop5/objects/sprite/

## Review material

- walk_loop_native.gif: 1x at 8 fps.
- walk_loop_light.gif / walk_loop_dark.gif: 4x with light/dark backgrounds.
- walk_contact_sheet.png: all six frames for comparison.
- animation_manifest.json: frame order, timing, origin, scope and approval status.
- walk_assembly.json: fixed-body/limb-window assembly details.
- validation_report.json and browser_test_report.json: what was actually tested.

Original animation drawings were generated with built-in imagegen. Full prompts
and the untouched source sheet are included. Export uses nearest-neighbor,
the existing fixed palette, binary alpha and deterministic layer assembly.

This is a browser-tested animation prototype. It is not a GDevelop export and
the animation has not yet been run inside GDevelop. No production approval is
claimed. The other five demo sprites remain the original V2 assets.
