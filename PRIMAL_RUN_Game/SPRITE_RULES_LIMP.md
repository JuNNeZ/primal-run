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

This is a timing-based limp prototype for all player/NPC walk/run series, not a
newly drawn injured-limb animation. A3 anatomy-specific held-leg poses remain
pending. Check part_a_review.html and part_a_runtime_report.json; browser
evidence does not certify an actual GDevelop export.
