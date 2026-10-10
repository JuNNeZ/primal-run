# Corpse and skeleton overlay

Follow PRIMAL_RUN_Sprites/SPRITE_RULES.md and SPECIES_ANATOMY.md.
Sources live in Source_Generated/corpses, originals remain byte-identical.
Each 1536x1024 sheet: columns S/E/N/W; rows decayed variant0, decayed variant1,
skeleton variant0, skeleton variant1. These are static props, not animation frames.
Export with tools/export_corpses.py: integer4 sampling offset1, alpha>=192,
existing fixed32 palette, explicit approximate hip landmarks, neighbour isolation plus reviewed per-cell neighbour exclusions in sources.json,
144x144 native canvas, origin72,72 and minimum two-pixel padding. Never invent
missing bones/poses, rotate, mirror or interpolate during extraction.
Validate with tools/validate_corpses.py, inspect native light/dark previews and
actual runtime corpse-age transitions. Source anatomical variation remains a
prototype limitation; production_approved=false and animation_ready=false.
Two variants per species/direction; 12 NPC-ready species =>192 assets (160 preserved +32 raptor poses). Fresh corpses
use the existing death series; after7s use decayed props, after14–18s use skeletons.
Food expires independently; bones persist60–70s and fade in the last5s.
Keep separate current browser evidence from historical GDevelop evidence.

Compy relative-size revision: extra integer2 sampling about the fixed72,72 hip, recorded as native_sample_stride; source sheets intact. Carnotaurus revision2 moves E/W horn bases back over eye sockets. Previous revisions retained.

Per-direction source overrides are allowed to preserve unchanged S/N exports during an E/W correction. Each manifest entry names and hashes the actual source used for that cell, not only the default sheet. Verify unchanged directions against previous export hashes.

Raptor sources declare their own integer source_sample_stride (Utah4, Velociraptor6), preserving the fixed72,72 landmark. NPC-ready corpse art does not itself alter biome spawn rules.
