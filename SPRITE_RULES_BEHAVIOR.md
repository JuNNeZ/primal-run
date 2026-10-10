# Ecology, grooming and injured movement

Start with the preserved native species poses, including WALK2/3 when drawing injured
keyposes. Match body footprint, hip, limb count, palette and markings across actions.
An atlas being valid PNG does not prove anatomical or motion consistency.

Current ecology source layout: six256px columns, four256px rows S/N/E/W. Pairs are
graze/sniff, drink, sleep/rest; each pair changes mainly neck/head/breathing, not body
position. Native144canvas and existing species/direction origin. Slow1.5fps, paused
naturalTime drives both frames. Predators sniff rather than graze plants. Nearby
mode icons are suppressed only when their actual authored pose is visible.

Source_Generated/behavior_exports.json declares integer sampling, approximate hip
landmarks, margins and neighbour isolation. Padding crops may extend over cell borders
because some author sheets overlap. Keep the full connected animal and inspect tail tips;
never draw anatomy or recenter by bounding box. Changes to landmarks require light/dark
native comparison against the old source. Runtime eligibility belongs to the individual
manifest entry and is preserved in src/assets.js.

Revision1 groom/injury studies remain review-only: their body shape/scale changes are
visible. They must not be quietly enabled because a technical validator passes.
The six-frame injury studies retain four old native walk frames byte-identically; the two
new keyposes and scratch pairs need a consistent-body reference revision. Rendering keeps
the native timing-based limp until an eligible corrected series exists.

Source files, generation prompts, sampling plans and hashes stay in Source_Generated.
Use tools/export_behavior.py and tools/validate_part_a.py. Separate pilot families need
separate manifests/rules when their actual source layout differs. Technical approval is
not production approval: prototype_static, production_approved=false, animation_ready=false.

Active revision: all632 earlier study frames are runtime_enabled:false. Corrected288-pose ecology overlay uses native_behavior_manifest.json and SPRITE_RULES_NATIVE_BEHAVIOR.md; injured_walk_manifest.json has312 frames (88 authored,224 native reuse), governed by SPRITE_RULES_LIMP.md. The layouts above document quarantined historical sources, not the current active exporter plan.
