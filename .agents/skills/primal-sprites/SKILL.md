---
name: primal-sprites
description: Audit and edit dinosaur anatomy, directions, poses and animation consistency.
---

# primal-sprites

Read `PRIMAL_RUN_Game/SPECIES_ANATOMY.md` and the relevant overlay rule only.
Canonical animals are in `src/core.js`; the anatomy table defines their visual identity.
Compare the changed head/body against the same species in idle, walk, attack and death in all four directions.
Carnotaurus: two brow horns above eyes, zero nasal horns. Triceratops: two brow horns and one shorter nasal horn, frill behind skull. No spikes substituted for horns.
North faces up, East right, South down, West left; body origin stays the declared hip landmark.
Do not change body volume, limb count, marking locations or species colour between poses. Account for perspective occlusion explicitly; do not casually add/remove limbs or horns.
Keep source atlases immutable; save revisions with a new filename and point sources.json to the revision.
Use image generation for anatomical edits. Extraction must not draw missing anatomy or invent a pose.
All generated atlases remain prototype_static and unapproved until the visual and runtime gates are approved. File checks cannot certify anatomy.
Inspect revised source sheets, native exports on light/dark backgrounds and the actual animated renderer. Document remaining defects and rejected revisions.
Run the corresponding exporter and validator, then build:game and relevant browser animation tests in a temporary copy.
