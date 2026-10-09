---
name: primal-assets
description: Generate, extract, register and integrate consistent sprites and props.
---

# primal-assets

Read `PRIMAL_RUN_Sprites/SPRITE_RULES.md` plus the active family supplement before art work.
Active families: player_full, enemy_full, ecology, fishing and corpses under PRIMAL_RUN_Game. Legacy packages are preserved references.
Start with the existing canonical species atlas. Give prompts the species anatomy, palette, camera, native target, cell plan and explicit anchors. Review one master before expanding its poses.
Image generation performs drawing/edits. Python is for lossless integer sampling, fixed palette, binary alpha, explicit registration and PNG extraction only. No smoothing, arbitrary zoom, rotation, mirrored directions, procedural invented limbs or bbox centering.
Copy every generated source into Source_Generated/{family}; include SHA-256, parameters/anchors and honest review status. Never rely on generated_images or /tmp surviving.
Use tools/export_{player_full,enemy_full,ecology,corpses}.py and matching validate_* scripts. Existing exporters encode each family's actual native plan; do not apply one universal scale.
Integrate overlays through tools/build_game.py; edit src files, never generated project events. Update manifests/resources after every export.
Native light/dark previews and validation reports accompany changes. Browser evidence and real GDevelop GDJS evidence are distinct.
Check legacy source hashes and git diff; commit raw sources and derivatives with clear prototype status.
