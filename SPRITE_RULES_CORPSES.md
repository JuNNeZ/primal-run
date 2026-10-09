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
Two variants per species/direction; 10 NPC species =>160 assets. Fresh corpses
use the existing death series; after7s use decayed props, after14–18s use skeletons.
Food expires independently; bones persist60–70s and fade in the last5s.
Keep separate current browser evidence from historical GDevelop evidence.
