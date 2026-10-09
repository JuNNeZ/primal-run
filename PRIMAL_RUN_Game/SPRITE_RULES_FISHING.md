# Fish prototype supplement

Follow ../PRIMAL_RUN_Sprites/SPRITE_RULES.md and palette.json. Four separately
drawn poses, no production approval. Native 64x64, origin32,32. The preserved
1254x1254 sheet has four627x627 cells. Extraction samples integer13 pixels at
offset1, places at8,8, maps fixed32 palette, thresholds alpha192. No drawing,
rotation, mirroring or interpolation. export_fishing.py checks padding and
emits a manifest, technical report and light/dark native previews. These poses
remain prototype_static / production_approved=false / animation_ready=false.
