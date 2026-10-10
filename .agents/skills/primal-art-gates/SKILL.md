---
name: primal-art-gates
description: Verify external Primal Run art through technical pixel, visual, in-engine and terrain/cinematic gates before promotion.
---

# Art gates (required for every incoming graphics pack)
Read AGENTS.md, PRIMAL_RUN_Sprites/SPRITE_RULES.md, the appropriate family supplement and PRIMAL_RUN_Game/palette.json. Never overwrite canonical art during review.

1. GATE 1: RGBA native size, allowed Primal Earth 32 palette, binary alpha, transparent black RGB, >=2 px padding for independent sprites, 32x32 opaque terrain, validated hashes and origin. Run family validators.
2. GATE 2: compare side-by-side with actual current game master PNG and rendered frames at 1x/4x, on light/dark background; review semi-realistic style, top-left light, top-down 3/4 orientation (side view only in cinematic), silhouette, correct animal anatomy, art scale, and loops. Without reference images, status is NOT VERIFIED—not approved.
3. GATE 3: integrate ONLY on isolated scratch branch; run python tools/build_game.py, npm test, npm run validate:game-sprites, npm run validate:enemy-sprites, browser/actual GDevelop runtime, 390px mobile and error fallback. A standalone demo is not an in-game pass.
4. GATE 4: 3x3 tile repeats and random mixed-variant patches; assess seams AND perceptual motifs. Never replace Codex A4/A6 tiles. Cinematic follows docs/design/records-world-extinction/08_METEOR_ENDING.md on claude/records-design: native 480x180, horizon meteor near 4.8s, impact near 5s, total ~10s, reduced-motion and secret route. Reuse 9s preserved branch before replacing any frame. All particle images must actually render.
Produce item-by-item ART_INTAKE_REPORT.md with evidence and prototype / approved / rejected or NOT VERIFIED status. Technical pass never grants visual/runtime approval. Do not publish or merge.
