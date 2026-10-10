# Ground overlay — prototype contract

Follow PRIMAL_RUN_Sprites/SPRITE_RULES.md. Native terrain tiles are 32×32,
opaque, fixed32 palette, lossless integer sampling of preserved generated art.
Four biome rows (forest, riverbank, rocky scrub, volcanic ash); four variants
per row. Compare against existing ecology/player art. No roads or tile borders.
Extraction never invents ground details. Sources and exact crops/hashes live in
Source_Generated/ground. Repeated3×3 previews show seams explicitly.
Terrain rendering may use irregular clipped patches of these textures. Water
must match core isWater ellipses/riverCurve; lava uses its own channel, never fish.
Volcanic cones occupy land beyond the safe start and all spawn/food constraints
must respect their footprints. Ground is not a collision hitbox.
All outputs stay prototype_static, animation_ready=false, production_approved=false.
Technical checks do not approve seamlessness/style or GDevelop behavior.

Volcanic props: two cones and two basalt crossings, separately generated2x2
source1280x1280, sampled at integer3 onto256x256 transparent canvases.
Fixed128,128origin is the reviewed crater/formation landmark. Alpha192 then
fixed palette, no procedural invented anatomy or noninteger image resizing.
Smoke is a bounded presentation effect; it does not change crater damage.
