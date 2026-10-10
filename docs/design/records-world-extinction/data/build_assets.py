#!/usr/bin/env python3
"""Graphical asset queue for ChatGPT image generation -> asset_queue.json + ../10_ASSET_QUEUE_CHATGPT.md"""
import json, pathlib
HERE = pathlib.Path(__file__).parent
A = []
def a(aid, system, prio, size, frames, layout, anchor, desc, prompt, notes=""):
    A.append(dict(id=aid, system=system, priority=prio, nativeSize=size, frames=frames, layout=layout,
                  anchor=anchor, description=desc, prompt=prompt, notes=notes,
                  background="transparent", palette="PRIMAL_RUN_Game/palette.json (quantize after generation)",
                  status="queued"))

# P1 – needed by the first implementation steps
a("amber_pickup", "S6 secrets", 1, "16x16", 4, "horizontal strip 64x16", "center-bottom (8,15)",
  "Amber nugget on the ground with a tiny insect inside; frames 2-4 add a glint",
  "a small piece of golden amber with a tiny prehistoric insect trapped inside, lying on dark earth, top-down view")
a("amber_icon_hud", "S6 secrets", 1, "12x12", 1, "single", "center", "HUD counter icon", "a tiny golden amber gem icon")
a("amber_fieldguide", "S6 secrets", 2, "64x64", 1, "single", "center", "Field-guide portrait of the amber with insect",
  "a detailed piece of amber with a mosquito trapped inside, backlit, warm glow")
a("rarity_badges", "S2 run report", 1, "16x16", 6, "strip 96x16 (common, uncommon, rare, epic, legendary, secret)", "center",
  "Title rarity badges", "six small badge emblems in a row from plain bone to glowing gold and a mysterious dark star")
a("records_icons", "S1 records", 2, "16x16", 12, "grid 4x3", "center",
  "Board icons: claw, skull, crown, footprint, map, heart, clock, DNA, star, lava drop, compy head, broken tooth",
  "twelve small prehistoric-themed UI icons: claw, skull, crown, footprint, map, heart, hourglass, DNA helix, star, lava drop, tiny dinosaur head, broken tooth")
a("run_card_frame", "S2 run report", 2, "9-slice 48x48 (16px corners)", 1, "single", "-",
  "Stone/bone frame for the run card and share image", "a carved stone and bone border frame, 9-slice friendly, empty center")
# P2 – ending (port preserved cinematic first; these fill gaps or upgrade it)
for aid, size, frames, desc, prompt in [
    ("end_sky_gradient", "480x120", 3, "Dusk, red-sky and ash-sky backdrops", "a wide prehistoric sky at dusk; same sky turning blood red; same sky choked with grey ash"),
    ("end_far_volcanoes", "480x60", 1, "Far volcano silhouettes", "distant volcano silhouettes on the horizon, flat dark shapes"),
    ("end_forest_silhouette", "480x70", 2, "Mid forest silhouette, normal and bent by blast", "a band of prehistoric tree silhouettes; the same trees bent sideways by a blast wave"),
    ("end_meteor", "16x16", 4, "Meteor growing", "a glowing meteor fireball, four sizes"),
    ("end_meteor_trail", "48x12", 3, "Meteor trail", "a fiery smoke trail behind a meteor"),
    ("end_shockwave_ring", "480x60", 6, "Expanding shockwave on the horizon", "a bright expanding shockwave dome on the horizon, six stages"),
    ("end_dust_wall", "480x140", 4, "Rising dust wall", "a towering wall of dust and debris rolling forward, four stages"),
    ("end_ash_particles", "64x64", 8, "Falling ash flakes", "falling grey ash flakes and embers, sprite sheet"),
    ("end_fleeing_silhouettes", "32x20", 16, "4 species x 4 running frames (silhouettes)", "silhouettes of small herbivorous dinosaurs running, side view"),
    ("end_bird_silhouettes", "12x8", 4, "Small bird flap cycle", "a tiny bird flying, four wing-flap frames, silhouette"),
    ("end_ash_plain_dawn", "480x180", 1, "Ash plain at dawn (E3)", "a quiet grey ash plain at dawn with burnt stumps, pale light"),
    ("end_burnt_stump", "24x24", 1, "Burnt stump a bird lands on", "a charred tree stump")]:
    a(aid, "S7 ending", 2, size, frames, "horizontal strip", "top-left (backdrops) / center (sprites)", desc,
      prompt + ", side view pixel art scene layer", "Side-view layer for the 480x180 end-scene canvas, not top-down.")
# P2 – extinction level
a("debris_rock", "S6 level 9", 2, "24x24", 3, "strip", "center-bottom", "Falling burning rock (in flight, impact, crater decal)",
  "a burning rock falling, top-down; the impact burst; the small smoking crater left behind")
a("debris_shadow", "S6 level 9", 2, "48x48", 4, "strip", "center", "Growing impact warning shadow (telegraph)", "a dark circular shadow growing larger in four steps")
a("fire_overlay", "S6 level 9", 2, "32x32", 6, "strip", "center-bottom", "Looping flames for burning trees/tiles", "flickering orange flames loop, top-down")
a("tree_burning", "S6 level 9", 2, "64x80", 2, "strip", "center-bottom (trunk base)", "Burning and burnt variants of tree_canopy", "a prehistoric tree on fire, top-down; the same tree burnt to black")
a("refuge_burrow", "S6 level 9", 2, "64x48", 1, "single", "center-bottom", "Burrow under a rock overhang (level goal)", "a small dark burrow entrance under an overhanging rock, top-down")
a("collapse_crack", "S6 level 9", 3, "32x32 autotile", 16, "4x4 blob subset", "tile", "Ground crack that becomes lava", "a long ground fissure glowing with lava, seamless tile set")
# P2/P3 – world
a("basalt_crossing", "S4/S5 world", 1, "32x32 autotile", 16, "4x4", "tile", "Safe basalt crossing over a lava line", "dark cooled basalt slabs bridging a lava stream, seamless tiles",
  "Compare with the preserved-branch ground tiles first; reuse if approved.")
a("cliff_faces", "S5 world W3", 3, "32x32 autotile", 16, "4x4", "tile", "Terrace cliff faces (south/east visible)", "a low rocky cliff edge seen from above at a slight angle, seamless tiles per biome")
a("ramps", "S5 world W3", 3, "32x32", 4, "N/E/S/W", "tile", "Ramps between heights", "a gentle earthen ramp going up a terrace, top-down")
a("mound_decals", "S5 world W1", 2, "64x48", 3, "strip", "center", "Small mounds (visual height cue)", "a low grassy mound with a soft shadow, top-down")
a("ground_decals", "S5 world W1", 2, "48x48", 24, "grid 6x4 (6 per biome)", "center",
  "Cracks, leaf litter, trail wear, footprints, bone scatter, scorch marks", "subtle ground detail decals: cracks, fallen leaves, worn trail, dinosaur footprints, scattered small bones, scorch mark")
a("soft_flattened", "S5 world W2", 2, "match source prop", 4, "fern_large, flower_bush, shrub, fruit_bush flattened", "same as source",
  "Trampled variants of soft obstacles", "the same plant pressed flat as if a huge animal walked over it")
# P3 – art QA redraws (draft only, finished by hand under SPRITE_RULES)
a("trex_walk_W_fix", "S8 art QA", 3, "144x144 (runtime x2)", 6, "existing walk layout", "pivot 72,72",
  "T. rex walk W without forelimbs reading as legs", "reference only - redraw by hand; ChatGPT may draft pose ideas",
  "Not shipped from ChatGPT output; anatomy checklist + human approval required.")
a("triceratops_horns_fix", "S8 art QA", 3, "144x144", 6, "idle/walk/run E and W", "pivot 72,72",
  "Two brow horns + one short nasal horn in E/W", "reference only", "As above.")

PIPE = """## Processing pipeline (every asset)

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
"""
(HERE / "asset_queue.json").write_text(json.dumps(A, ensure_ascii=False, indent=1) + "\n")
md = ["# ChatGPT graphical asset queue (generated - edit data/build_assets.py)", "",
      "Separate from Part A (A1–A6 sprites are owned by the active Codex session and are **not** listed here).", "",
      PIPE, "## Queue", "", "| P | ID | System | Native size | Frames | Layout | Anchor | Description |", "|---|---|---|---|---|---|---|---|"]
for x in sorted(A, key=lambda x: (x["priority"], x["system"])):
    md.append("| %d | `%s` | %s | %s | %d | %s | %s | %s%s |" % (x["priority"], x["id"], x["system"], x["nativeSize"], x["frames"], x["layout"], x["anchor"], x["description"], (" – *" + x["notes"] + "*") if x["notes"] else ""))
md += ["", "Prompts per asset: see `data/asset_queue.json` (`prompt` field).", ""]
(HERE.parent / "10_ASSET_QUEUE_CHATGPT.md").write_text("\n".join(md))
print(len(A), "assets")
