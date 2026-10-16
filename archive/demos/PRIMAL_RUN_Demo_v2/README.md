# PRIMAL RUN - original demo kit v2

Original assets created with the built-in imagegen tool, not extracted from the
old attached concept sheet. Full prompts are in generation_prompts.json.

## Files to import in GDevelop

- assets/player/utahraptor_idle_S_000.png - 128x128
- assets/enemy/compy_idle_S_000.png - 64x96
- assets/environment/grass.png - 32x32 ground prototype
- assets/environment/fern.png - 64x64
- assets/environment/rock.png - 64x64
- assets/pickups/meat.png - 32x32

Import each dinosaur as a Sprite with one Idle animation containing its single
image. Use the exact origin in manifest.json; the player's origin is its pelvis,
not the center of the long tail's bounding box. Objects use normal Sprite images.
Grass can be evaluated with a Tiled Sprite; inspect the repeated texture before
using it for a large final map.

Keep Optimize for pixel art on. Use integer positions and scale, with filtering
disabled. Source_Generated files are source references, not final game sprites.

Official Sprite documentation: https://wiki.gdevelop.io/gdevelop5/objects/sprite/

## Preview

Open demo.html in a browser. WASD / arrow keys move; Space bites nearby Compys.
Meat restores health. R restarts. The scene uses the individual asset PNGs.
It is a lightweight browser preview to evaluate art and scale, not an imported
or tested GDevelop project. Both dinosaurs remain in their static south pose;
directional artwork and frame animations are future work.

The demo intentionally has no XP, mutation selection, bosses or meta-progression.
The full roguelite will be expanded after the movement and bite prototype.
