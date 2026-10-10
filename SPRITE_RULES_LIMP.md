# A3 — reuse existing locomotion pixels

All existing native walk/run frames and raw atlases remain byte-identical. Below
30% HP, the renderer changes frame dwell times only: frames 0–5 have relative
durations 1,1,3,1,1,1. This holds one loaded step longer and preserves order,
loop, palette, size, hips and all existing markings. No interpolated pose,
limb deformation, scaling, mirroring or rotation is introduced.

The shared normalized gait phase is continuous across movement, stopping and
healing. At 30% HP the usual six equally timed poses return. Attacks, charge
timings, collisions and movement speed are unchanged. NPCs already move more
slowly below 35% HP; that existing gameplay rule remains separate. Pause and
choice screens freeze the existing phase. FEATURES.limpAnimation rolls back the
presentation change.

The original delivery was timing-only. Revision 2 adds an explicit injured-walk
overlay while preserving this gait timing and all original walk/run PNGs.
Check part_a_review.html and the new injured_walk_review.html; standalone
browser evidence does not certify an actual GDevelop export.

## Revision 2 — canonical injured-keypose overlay

Assets live under assets/behavior_injured and injured_walk_manifest.json. All
13 existing living species have six poses in S/N/E/W: 312 native144 PNGs.
88 authored keyposes come from minimal image-generation edits directly
referencing each species’ untouched WALK2/3. The other224 are byte-identical
legacy gait frames:208 continuity poses and16 explicit rejected-pose fallbacks.
Compy stays entirely native because generated tiny bodies failed scale review.
Deinonychus has3 accepted authored poses; its other5 keyposes stay native.

Generated sheets remain immutable in Source_Generated/behavior_limp. Each
revision2 review records the exact cell, sampling, binary-alpha threshold,
source hip landmark, registration and hashes. Fixed palette32, native144
canvas, two-pixel transparent border and original per-direction origins apply.
Named anatomical pelvis/tail-root overrides are permitted for actual source
registration drift; bbox centering, arbitrary zoom and anatomical drawing
during extraction are forbidden. Alpha192 normally preserves thin tails;
Velociraptor E3 explicitly uses128 after native continuity inspection.

Freshly drawn pixels need not match old pixels exactly, but body extent stays
within10%, hip stable, marking family/palette and limb/tail counts preserved.
Native silhouette IoU>=.87 is a rejection aid, never anatomical approval.
Inspect old/new at native1× on light/dark, all6 cycle poses and healing
transitions. Failed single keyposes must reuse the original with fallback_reason.
Reused frames require exact file bytes/SHA-256. No legacy animation is replaced.

Use tools/export_injured_walk.py followed by tools/validate_injured_walk.py.
INJURED_WALK_STATUS.md and INJURED_WALK_VALIDATION.json preserve honest counts.
Every new/reused overlay entry is prototype_static, production_approved:false,
animation_ready:false. Root runtime/browser validation is separate.
