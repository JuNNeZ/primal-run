# Water/fishing and Baryonyx north repair

Living Baryonyx north only:30 revised drawn frames, single tapering tail, two
shorter hindlegs with recognizable toes. Original source is preserved and the
revision is selected in Source_Generated/player_full/sources.json. Existing
hip origins and native144 canvases are retained. Cell neighbour isolation is
tighter for this one source to remove disconnected neighbouring tail fragments.
Other player directions/species and all corpse/skeleton art remain unchanged.
Source/native light-dark grids and real browser animation checks are separate
from production approval: the atlas remains a prototype.

Fish schools are confined to water. Larger ponds remain in all four biomes;
stage2 also has schools along its real river. The final biome's river is lava,
so its fish occur in its separate ponds only. Plants, rocks, mud and tall props
clear pond/river water; edible plants no longer overlap fish at habitat points.
Discovery props are relocated to nearby dry habitats rather than covering water.

The same ellipse geometry classifies visible pond water and movement; river
water exists only in the river biome. Fish centers require a14-pixel inset.
Baryonyx alone catches fish, with actual stamina and stock costs. Dry-land schools
and stray fish pickups cannot grant food/healing; herbivores/omnivores cannot
fish. Fish render only in valid water. Plants use the existing herb sprite.

The previous972 balance samples retain their original core SHA and are historical
before this map-placement change. Do not mistake them for samples of the new
water distribution. The CLI remains usable for new seeded comparisons.

Fresh evidence: water_fishing_runtime_report.json and bary_n_runtime_report.json.
Standalone Chromium is tested; a fresh official GDevelop GDJS export is not run
because the engine binaries are absent in this restored environment.
