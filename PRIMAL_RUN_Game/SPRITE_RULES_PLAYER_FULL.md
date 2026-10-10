# Spilbare arter — fulde frameplaner, prototype-supplement

Følg PRIMAL_RUN_Sprites/SPRITE_RULES.md, kit-reglen, palette.json samt de
historiske combat/enemy-supplementer. De gamle PNGs og kilder bevares.

Dette supplement indfører en separat player_full-serie til Compy, Utahraptor,
Carnotaurus og Ankylosaurus. Alle fire retninger S/E/N/W tegnes separat, uden
runtime-rotation eller spejling. Native canvas er 144×144 i hele den nye serie: otte ekstra transparente pixels
omkring den gamle 128×128 ramme giver plads til brede halekøller. Ingen
kropspixels opskaleres. Origins er 72,72
for Compy/Carnotaurus/Ankylosaurus; Utahraptor beholder S72,80 N72,64 E76,72 W68,72 (de gamle origins +8,+8).
Collision bruger artens faste torso-radius, aldrig frame-silhuetten.

Frameplan: idle4/4fps, walk6/8fps, run6/12fps, attack6/kontakt på frame3,
hurt2/8fps, death6/8fps. Idle/walk/run looper; øvrige states afspilles én gang.
Attack-varighed følger artens gameplay-varighed, inklusive mutationer.
Ankylosaurus angriber med haleslag; andre arter med kæber/lunge.

Kilder er nye separate 6×5 atlasser i Source_Generated/player_full. Row0 har
idle0–3/hurt0–1; row1 walk; row2 run; row3 attack; row4 death. De bevares
byte-for-byte sammen med prompts og hashes. Exporteren sampler kildepixels
ved et fast heltalstrin uden smoothing, normaliserer alpha>=192 og mapper til
den eksisterende32palette. Den opfinder eller interpolerer ingen nye poses.
Hver frame har eksplicit dokumenteret anatomisk hip-anchor og heltals-offset;
foreground bounding box bruges kun til paddingkontrol, ikke centrering.

Status forbliver prototype_static/animation_ready=false/production_approved=false.
Et komplet framesæt er ikke automatisk en produktionsgodkendt animation.
Kontrollér alle frames på lyse/mørke native grids og review-loops ved1×/4×,
derefter faktisk canvas-rendering, timing, state-skift, pause og GDevelop.
Variation i genereret anatomi/markeringer skal dokumenteres, aldrig skjules.
Lever manifests, palette, regel, kildehistorik, PNG- og runtime-rapporter.

Expansion 2026-10-09: Pachycephalosaurus, Gallimimus and Baryonyx add120
frames each using separate S/E/N/W atlases, integer2px sampling, fixed32 palette
and explicit source hips. Native144×144/pivot72,72 remain unchanged.
player_full now holds840frames for7species; playable Triceratops shares the
120directional enemy_full frames without duplicating pixels. All8players
have960state/direction frames available. Anatomy/markings/death pose limitations
remain; prototype_static/unapproved, not certified by technical export tests.

T. rex playable2026-10-09: shares120 existing enemy_full frames,144x144
native source at integer2x in runtime; fixed32px torso radius. Nine playable
classes total1080 drawn frames, no new production approvals. Para E/N/W and
T. rex N source revisions remain preserved under enemy_full.

Current extension: Velociraptor adds120 frames, total960/player_full and192sequences,10playables/1200frames with shared enemy_full. Existing South master and Utah cardinal references define its identity. Compy extra native integer4, Veloci integer2, before alpha/palette/origin-preserving render. Source N revision2 uses tight cells and reviewed alpha248 to reject a soft halo; all other active atlases retain192.

Explicit user-authorized exception: Baryonyx North is exactly its South frames rotated180 with lossless pixel transpose. Its source/origin/palette remain declared, lighting also rotates. No general mirroring/rotation permission for other species. Validate exact South->North pixel equality. All remain prototype_static, not approved.

Deinonychus starter extension:120frames, player_full1080/216sequences,
11playables/1320runtimeframes. Separate S/E/W and correctedN atlases reference
one feathered master. Source stride4 samples native pixels directly onto144canvas
at72,72; this is the recorded source plan for this family addition, no runtime
upscale. Rear hind thighs attach near tailbase; chest featherarms are much shorter
and cannot be presented as weight-bearing feet. Cream tail fan/dorsal stripe stay
consistent. Initial South and wrong-facing North sheets are preserved/rejected.
Minor generated volume/feather/foot registration variation still needs polish.
