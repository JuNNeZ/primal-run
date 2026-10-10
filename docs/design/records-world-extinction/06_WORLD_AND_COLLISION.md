# System 5 – World depth and collision

Status: **Partially implemented / new work**. Procedural sub-biomes (`ZONES`, `buildZones`, `zoneAt`) and
terrain kinds (`terrainAt`: lava, deep, water, mud, ash, gravel, bush) exist. Water edges are **Part A4**
(not repeated here). This spec covers ground variety, height and collision.

## 1. Audit: what blocks what today

`move()` resolves collisions **only against `map.rocks`** (circles, drawn as `assets/environment/rock.png`).
Everything in `map.decorations` is visual. `map.cover` circles (soft bushes) give speed × 0.9 and concealment –
but only where no other terrain wins first (`terrainAt` checks lava, deep water, water, mud and ash zones before
cover; in the canyon, cover beats gravel).

Probe on level 3 (seed 3), `probes/audit_probes.cjs`:

| Prop | Count | Has a rock collider | Is soft cover |
|---|---|---|---|
| fern_large | 591 | 2 % (coincidence) | 100 % |
| fallen_log | 368 | 3 % | ~1 % |
| tree_canopy | 357 | 3 % | ~1 % |
| flower_bush / shrub / fruit_bush | 467 | ~3 % | 100 % |
| fern, reeds, moss, flowers, roots … | many | – | – |

So **dinosaurs walk through tree trunks and fallen logs.** Across the four biomes the props used are:
fern, fern_large, flower_bush, tree_canopy, fallen_log, dead_tree, twigs, boulder_large, lichen, lava_rock,
dry_grass, succulent, shrub, meteorite, flowers, ribcage, conifer, moss, horsetail, roots, broad_fern, cycad,
reeds, leaf_litter, fruit_bush, mushrooms, seed_fern. There is no elevation.

## 2. Obstacle classes

| Class | Movement | Vision/cover | Nav grid | Examples (existing assets) |
|---|---|---|---|---|
| **1 Solid** | blocks all species (circle or capsule collider) | blocks line of sight for stealth checks | blocked (inflated by radius) | rocks, boulder_large, tree trunks (tree_canopy, conifer, dead_tree – trunk only), fallen_log (capsule), meteorite, large lava_rock, cliff faces |
| **2 Soft** | slows by size class; large species trample | gives concealment while inside | passable with cost | fern_large, flower_bush, shrub, fruit_bush, reeds, horsetail, broad_fern, cycad, dry_grass clumps |
| **3 Decorative** | none | none | ignored | fern, moss, lichen, flowers, leaf_litter, twigs, mushrooms, roots, succulent, ribcage, seed_fern, ground decals |

### 2.1 Size classes and soft obstacles

| Size class | Radius | Soft-obstacle speed | Trample |
|---|---|---|---|
| small | < 14 (compy, velociraptor) | × 0.85 | no – hides best (concealment bonus as today) |
| medium | 14–27 | × 0.90 (today's value) | no |
| large | ≥ 28 (T. rex, Deinosuchus, enemy Triceratops/Ankylosaurus at boss scale) | × 0.97 | yes: the bush is flattened for 20 s (no cover, drawn bent/flattened), sway particles |

Large species never pass through Solid obstacles. A fallen log is Solid for small/medium but a **step-over**
for large species (speed × 0.8 while crossing) – it reads naturally and avoids T. rex snagging.

### 2.2 Collider shapes

- Circle for rocks/trunks/meteorites: `radius = round(visibleBaseWidth × 0.35)` measured from the sprite's
  bottom 25 % alpha rows (trunk base, not canopy).
- Capsule for fallen logs (two end points from the sprite's long axis). `move()` gains capsule push-out.
- Colliders are generated at map creation from the prop's manifest entry (`collider: {type, r | p0,p1}`),
  never from per-frame alpha.
- Spawns, forage, sites, events and arenas keep clearance from Solid colliders (as they already do from rocks).

### 2.3 Canopies

Tree canopies are drawn **above** dinosaurs (they already have `canopy:true`). When the player is under a
canopy it fades to 35 % alpha within 80 px so the player is never hidden from themselves.

## 3. Ground variety (visual, no gameplay risk)

- **Sub-biome palettes:** each `ZONES` entry gets 2–3 ground-tile variants and a decal set. Existing
  `zoneTint` stays as the base.
- **Transitions:** between zones, a 64 px dithered blend band using a seeded noise mask (deterministic per
  map seed). Mud, ash and gravel get irregular edges (`terrainAt` geometry unchanged).
- **Ground decals** (class 3): cracks, leaf-litter patches, game trails (darker worn paths between water and
  clearings – reuse `map.trails`), footprints near water, bone scatter near carrion sites, scorch marks in ash.
  Max 1 decal per 96 × 96 px cell, rendered into the cached ground layer (no per-frame cost).
- **Environmental shadows:** large props and cliffs cast a soft shadow toward the same direction as
  `shadowUnder` (consistent light), baked into the cached layer.

## 4. Elevation

Introduce **discrete height levels 0–2** on the nav grid, built from seeded noise per zone, used sparingly:

| Feature | Gameplay | Visual |
|---|---|---|
| **Mound** (visual only) | none | darker base ring, lighter top, small drop shadow – cheap "not flat" cue |
| **Terrace** (height 1–2) | normal ground on top | raised plate with a cliff face on its south/east edges |
| **Cliff edge** | Solid between heights (movement and nav blocked) | cliff-face tiles, shadow below |
| **Ramp** | passable between adjacent heights, speed × 0.9 uphill / × 1.05 downhill | sloped tiles, lighter |

Rules:

- **Combat range:** melee and contact attacks only connect between entities on the same height, or when
  either stands on a ramp cell. This prevents a new "attack from the cliff top" exploit. Ranged boss
  `answer` actions (System 4) ignore height.
- **Pathfinding:** cliffs are blocked edges in the nav grid; ramps are normal cells. Every terrace must have
  ≥ 1 ramp (generator asserts reachability from the start zone with BFS; reject and reseed the terrace otherwise).
- **Arenas, rival spawn, sites and events** are never placed on cells adjacent to a cliff edge; boss arenas are
  flat (height 0).
- **Stealth:** standing on a higher level does not change detection (keep it simple); optional later.
- **Rendering:** entities on height h are drawn with a y-offset of −6 px × h and their shadow at ground level of
  that height; sorting by (y, h).
- **Budget:** ≤ 3 terraces per level, ≤ 25 % of level area raised. Level 1 (tutorial) has mounds only.

## 5. Phasing

1. **W1 visual** – transitions, decals, shadows, mounds, canopy fade (no gameplay change).
2. **W2 colliders** – trunk/log/meteorite colliders, size classes, trample. Needs the System 4 nav grid to
   mark the same cells blocked.
3. **W3 terraces** – cliffs, ramps, height rules. Requires assets (cliff and ramp tiles) and the nav grid.

## 6. Acceptance

- No spawn (animal, forage, fish, site, event, rival, boss) inside a Solid collider or on a cliff-adjacent cell
  over 500 seeds × 8 levels.
- Every level: start zone reaches every zone, site and event via the walker nav class (BFS).
- Large species trample: fern_large under a T. rex is flattened and gives no cover for 20 s.
- Frame time on the mobile profile (390 × 844, CI Chromium) does not increase > 10 % vs. baseline with W1+W2.
- Existing browser tests keep passing (rock-based tests unchanged).
