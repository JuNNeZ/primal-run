# ChatGPT graphical asset queue (generated - edit data/build_assets.py)

Separate from Part A (A1–A6 sprites are owned by the active Codex session and are **not** listed here).

## Processing pipeline (every asset)

1. Generate at 8× the native size on a flat magenta (#FF00FF) background, square pixels, no text, no border.
2. Downscale with nearest-neighbour to the native size listed; never smooth.
3. Key out the background to full transparency; alpha must be binary.
4. Quantize to `PRIMAL_RUN_Game/palette.json` (no new colours).
5. Place on the declared canvas with the declared anchor; record source file, prompt, seed/date and SHA-256 in
   the delivery manifest (same pattern as `Source_Generated/species_attacks/sources.json`).
6. Run the validators; add to a review page; status stays "prototype" until Jonas approves.

Prompt template (prepend to each asset's prompt):

> "Pixel art game asset, top-down 3/4 view (unless stated side view), limited palette, crisp square pixels,
> no anti-aliasing, flat magenta background, no text, no frame. Subject: {prompt}. Frames: {frames} laid out
> as {layout}."

## Queue

| P | ID | System | Native size | Frames | Layout | Anchor | Description |
|---|---|---|---|---|---|---|---|
| 1 | `rarity_badges` | S2 run report | 16x16 | 6 | strip 96x16 (common, uncommon, rare, epic, legendary, secret) | center | Title rarity badges |
| 1 | `basalt_crossing` | S4/S5 world | 32x32 autotile | 16 | 4x4 | tile | Safe basalt crossing over a lava line – *Compare with the preserved-branch ground tiles first; reuse if approved.* |
| 1 | `amber_pickup` | S6 secrets | 16x16 | 4 | horizontal strip 64x16 | center-bottom (8,15) | Amber nugget on the ground with a tiny insect inside; frames 2-4 add a glint |
| 1 | `amber_icon_hud` | S6 secrets | 12x12 | 1 | single | center | HUD counter icon |
| 2 | `records_icons` | S1 records | 16x16 | 12 | grid 4x3 | center | Board icons: claw, skull, crown, footprint, map, heart, clock, DNA, star, lava drop, compy head, broken tooth |
| 2 | `run_card_frame` | S2 run report | 9-slice 48x48 (16px corners) | 1 | single | - | Stone/bone frame for the run card and share image |
| 2 | `mound_decals` | S5 world W1 | 64x48 | 3 | strip | center | Small mounds (visual height cue) |
| 2 | `ground_decals` | S5 world W1 | 48x48 | 24 | grid 6x4 (6 per biome) | center | Cracks, leaf litter, trail wear, footprints, bone scatter, scorch marks |
| 2 | `soft_flattened` | S5 world W2 | match source prop | 4 | fern_large, flower_bush, shrub, fruit_bush flattened | same as source | Trampled variants of soft obstacles |
| 2 | `debris_rock` | S6 level 9 | 24x24 | 3 | strip | center-bottom | Falling burning rock (in flight, impact, crater decal) |
| 2 | `debris_shadow` | S6 level 9 | 48x48 | 4 | strip | center | Growing impact warning shadow (telegraph) |
| 2 | `fire_overlay` | S6 level 9 | 32x32 | 6 | strip | center-bottom | Looping flames for burning trees/tiles |
| 2 | `tree_burning` | S6 level 9 | 64x80 | 2 | strip | center-bottom (trunk base) | Burning and burnt variants of tree_canopy |
| 2 | `refuge_burrow` | S6 level 9 | 64x48 | 1 | single | center-bottom | Burrow under a rock overhang (level goal) |
| 2 | `amber_fieldguide` | S6 secrets | 64x64 | 1 | single | center | Field-guide portrait of the amber with insect |
| 2 | `end_sky_gradient` | S7 ending | 480x120 | 3 | horizontal strip | top-left (backdrops) / center (sprites) | Dusk, red-sky and ash-sky backdrops – *Side-view layer for the 480x180 end-scene canvas, not top-down.* |
| 2 | `end_far_volcanoes` | S7 ending | 480x60 | 1 | horizontal strip | top-left (backdrops) / center (sprites) | Far volcano silhouettes – *Side-view layer for the 480x180 end-scene canvas, not top-down.* |
| 2 | `end_forest_silhouette` | S7 ending | 480x70 | 2 | horizontal strip | top-left (backdrops) / center (sprites) | Mid forest silhouette, normal and bent by blast – *Side-view layer for the 480x180 end-scene canvas, not top-down.* |
| 2 | `end_meteor` | S7 ending | 16x16 | 4 | horizontal strip | top-left (backdrops) / center (sprites) | Meteor growing – *Side-view layer for the 480x180 end-scene canvas, not top-down.* |
| 2 | `end_meteor_trail` | S7 ending | 48x12 | 3 | horizontal strip | top-left (backdrops) / center (sprites) | Meteor trail – *Side-view layer for the 480x180 end-scene canvas, not top-down.* |
| 2 | `end_shockwave_ring` | S7 ending | 480x60 | 6 | horizontal strip | top-left (backdrops) / center (sprites) | Expanding shockwave on the horizon – *Side-view layer for the 480x180 end-scene canvas, not top-down.* |
| 2 | `end_dust_wall` | S7 ending | 480x140 | 4 | horizontal strip | top-left (backdrops) / center (sprites) | Rising dust wall – *Side-view layer for the 480x180 end-scene canvas, not top-down.* |
| 2 | `end_ash_particles` | S7 ending | 64x64 | 8 | horizontal strip | top-left (backdrops) / center (sprites) | Falling ash flakes – *Side-view layer for the 480x180 end-scene canvas, not top-down.* |
| 2 | `end_fleeing_silhouettes` | S7 ending | 32x20 | 16 | horizontal strip | top-left (backdrops) / center (sprites) | 4 species x 4 running frames (silhouettes) – *Side-view layer for the 480x180 end-scene canvas, not top-down.* |
| 2 | `end_bird_silhouettes` | S7 ending | 12x8 | 4 | horizontal strip | top-left (backdrops) / center (sprites) | Small bird flap cycle – *Side-view layer for the 480x180 end-scene canvas, not top-down.* |
| 2 | `end_ash_plain_dawn` | S7 ending | 480x180 | 1 | horizontal strip | top-left (backdrops) / center (sprites) | Ash plain at dawn (E3) – *Side-view layer for the 480x180 end-scene canvas, not top-down.* |
| 2 | `end_burnt_stump` | S7 ending | 24x24 | 1 | horizontal strip | top-left (backdrops) / center (sprites) | Burnt stump a bird lands on – *Side-view layer for the 480x180 end-scene canvas, not top-down.* |
| 3 | `cliff_faces` | S5 world W3 | 32x32 autotile | 16 | 4x4 | tile | Terrace cliff faces (south/east visible) |
| 3 | `ramps` | S5 world W3 | 32x32 | 4 | N/E/S/W | tile | Ramps between heights |
| 3 | `collapse_crack` | S6 level 9 | 32x32 autotile | 16 | 4x4 blob subset | tile | Ground crack that becomes lava |
| 3 | `trex_walk_W_fix` | S8 art QA | 144x144 (runtime x2) | 6 | existing walk layout | pivot 72,72 | T. rex walk W without forelimbs reading as legs – *Not shipped from ChatGPT output; anatomy checklist + human approval required.* |
| 3 | `triceratops_horns_fix` | S8 art QA | 144x144 | 6 | idle/walk/run E and W | pivot 72,72 | Two brow horns + one short nasal horn in E/W – *As above.* |

Prompts per asset: see `data/asset_queue.json` (`prompt` field).
