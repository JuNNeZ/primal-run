# Complete enemy frame prototype supplement

Follow PRIMAL_RUN_Sprites/SPRITE_RULES.md, palette.json and the existing enemy,
player-full and ecology supplements. Legacy sources and assets remain intact.

The enemy_full overlay introduces separately drawn S/E/N/W series for
Parasaurolophus, Deinosuchus, Triceratops and Tyrannosaurus:480 native144×144
frames, origin/body pivot72,72, six states:idle4/4fps, walk6/8fps, run6/12fps,
attack6/contact3, hurt2/8fps, death6/8fps. Attack timing follows locked gameplay
windup/contact/recovery. Dead bodies hold frame5 then fade before8simulation
seconds. Paused worlds freeze both animation and corpse age.

Compy, Carnotaurus and Ankylosaurus NPCs share the corresponding complete
player_full series. All seven enemies therefore have840 directional/state
frames available. New directions are drawn separately, never rotated/mirrored.
Deinosuchus and Tyrannosaurus render at integer2× nearest neighbour; other
ordinary animals at1×. Boss Carnotaurus keeps its established2× scale.
Torso collisions stay fixed; silhouettes never set hitboxes.

Original1536×1024 sources live in Source_Generated/enemy_full. Sources.json
records explicit anatomical landmarks for each cell; export uses2px integer
sampling, hard alpha>=192, fixed32 palette and integer registration. Expanded
crops exclude disconnected neighbour fragments; no invented pixels, interpolation,
or automatic silhouette centring. Native light/dark grids and interactive1×/4×
loops live in previews/enemy_full and enemy_full_review.html.

Rejected lateral E/W generations are not used. New overhead replacements use
South atlases as anatomical references. Some generated markings, limb forms,
body volume and death poses still vary. This is an animation-complete gameplay
prototype, not production art approval. All files remain prototype_static,
production_approved=false and animation_ready=false. PNG/runtime checks alone
cannot certify anatomical/temporal consistency. Review alongside player-full.

Movement revision 2026-10-09: Parasaurolophus South walk use a separate
1536×1024 two-row source. This source uses fixed integer3px sampling because
its whole poses are drawn larger; original sources keep integer2px sampling.
The source and reviewed hip landmarks are recorded as state_overrides in
sources.json. Only these six native frames change. No limb pixels are
painted away during extraction. It remains a prototype: other directions and
North Tyrannosaurus volume still need a consistent anatomical redraw.

The same integer3px two-row source exception covers Tyrannosaurus North
walk/run (twelve frames), with a broader pelvis/head. Idle/attack/death are
preserved, so a complete cross-state anatomy/volume pass remains necessary.
