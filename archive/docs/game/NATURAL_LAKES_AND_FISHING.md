# Natural lakes and repeat fishing

The permanent player, enemy, boss and food ellipses were visual markers,
not hitboxes. `FEATURES.cleanMarkers` removes their strokes. Player pointers,
food rarity labels, edible plant symbols, boss warnings and actual attack
telegraphs remain. Soft dinosaur shadows change axis with sprite facing;
combat colliders and attack geometry are unchanged.

`FEATURES.naturalPonds` gives every generated lake a seeded radius of 64–112,
an aspect of .60–.82 and an asymmetric shoreline. Water tiles, water slowdown,
deep water, fishing reach and drought use that geometry. The fallback water
render and ripples use the same contour. Handwritten legacy ellipse fixtures
remain compatible. Existing native water and shore PNGs are reused unchanged.

`FEATURES.fishingSpots` replaces the stationary fish with a small float,
FISKESTED label and remaining/initial catch count within 240 px. Empty spots
remain marked TØMT. Each lake starts with 16–18 catches; river spots have eight.
Stock remains finite for the current map and is not replenished by leaving it.

Baryonyx holds its configured eat key from the bank (45 px reach beyond the
lake contour). Timing is still 1.2 seconds divided by `1 + .2 * fisher`, and
each ordinary catch costs four stamina. Movement, attacks and damage cancel
the action. The existing ability catches one fish, or up to three with Tide;
it retains its own stamina and cooldown rules. Other diets cannot fish.

Each catch has a deterministic seeded rarity from the existing food tiers:
Common ×1, Nærende ×1.5, Sjældent ×2, Episk ×3. Food is the rounded-up base
value (2 + biome index) times rarity, plus the Fisher mutation bonus once.
Catch 8 is rare and catch 15 epic; other catches vary. The first is common.
The plan does not consume combat/loot randomness. A successful catch plays
the existing four native fish frames above the water and towards the fisher,
with rarity and food value. Reduced motion uses a still catch sprite; pause
and mutation screens freeze the effect and stock. Real catches still feed
food, XP, score, statistics and the Fish King achievement.

Focused simulation tests cover shape/seed consistency, bank fishing, timing,
stamina, rarity yields, burst stock limits, invalid spots, depletion and phase
gates. Standalone Chromium evidence checks indicators, catch sprites, oriented
shadows and pause; see `natural_fishing_runtime_report.json` and
`previews/natural_fishing`. This is browser runtime verification, not a new
GDevelop editor export or approval of new character art.
