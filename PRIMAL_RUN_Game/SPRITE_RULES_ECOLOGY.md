# Jungle, biome and species-display supplement

Follow PRIMAL_RUN_Sprites/SPRITE_RULES.md and the active fixed32 palette rule.
Preserve original PNGs, sources, full player frames and anatomical origins.

The new ecology series has 18 native112×112 static props and six native32×32
insect poses (two for each dragonfly, beetle, firefly). Origin is the centre of
the canvas. Insects are decorative two-pose studies at8fps, not approved flight
animations. Plants use overhead/slight-side perspective; source variation
remains. Both backgrounds are in previews/ecology and ecology_review.html.

Source_Generated/ecology/jungle_props.png is preserved byte-for-byte. The source
is a six-column sheet; manually reviewed row boundaries are0/320/575/790/1024,
not uniform256 rows: uniform cuts clipped the first row's plant bases and were
rejected before delivery. Source pixels are sampled at integer3 steps for plants
and10 for ambient insects. Alpha>=192 becomes255, transparent RGB=0; colours
map to the fixed32 palette. No drawing, interpolation or smoothing is used.
Native canvases have at least two pixels of transparent padding.

Species colours are display-only, cached exact per-pixel palette substitutions
in src/core.js SPECIES_COLORS. Every output colour belongs to palette.json;
alpha, silhouettes, native dimensions, sources and origins remain unchanged.
Compy is moss green, Utahraptor teal, Carnotaurus ochre, Ankylosaurus slate.
NPC Parasaurolophus olive/cream, Deinosuchus dark green, Triceratops stone/cream
and T.rex brown. These are fictional readability colours, not fossil evidence.
The review page shows both original and runtime colours. All states/directions
of a species share its mapping. Historical review pages show original colours.

Default actor scale is native1×. The first Carnotaurus boss uses integer2×
nearest-neighbour and a stable42px torso radius, twice regular21px. Its warning
capsule uses that actual body radius. Other boss illustrations are natively
larger. Render scale never follows a frame's bounding box. The scale audit
records full silhouettes and torso radii separately; tails never set collision.
These are gameplay proportions, not literal palaeontological length ratios.
Menu foreground uses integer2× props; game props and ambient insects use1×.

All new art remains prototype_static, production_approved=false,
animation_ready=false. Technical checks do not approve anatomy or animation.
Small frame registration/marking differences in generated dinosaurs remain.
