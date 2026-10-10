# A2 quiet grooming overlay

Follow the project-wide sprite rule, species anatomy and active ecology supplement.
Canonical idle PNGs are the body/palette/camera masters. New grooming pairs show
one quiet forefoot/neck grooming movement, closed mouths, no attack/biting pose.
Exactly two frames per direction S/N/E/W, native144 canvas, original species hip
origin, playback2fps. Source atlas1536x1024, two768x256 cells per row. The source
hip landmark is384,128; sample every second pixel from offset1 then register the
landmark to the canonical native origin. No bbox recentering, interpolation,
anatomical drawing in exporters, smoothing, rotation, mirroring or scale correction.
Binary alpha and the game's fixed32 palette apply. Two transparent pixels remain.

Raw generated PNGs and exact prompts/hashes live in Source_Generated/behavior_grooming.
Older scratch candidates in behavior_limp are preserved and not silently enabled.
All new files remain prototype_static, production_approved=false and
animation_ready=false. Runtime eligibility requires a recorded native comparison
against the old body; passing PNG/provenance tests alone cannot enable a sheet.
If body size/markings/anatomy differ materially, keep runtime_enabled=false and
report the missing grooming action instead of mislabeling an old bite as scratch.
