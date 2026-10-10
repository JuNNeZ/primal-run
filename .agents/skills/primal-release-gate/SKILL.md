---
name: primal-release-gate
description: Verify game readiness with build, runtime, balance, localization and art QA without publishing to Pages.
---

# Independent release gate
Record exact branch SHA/diff. In a clean checkout run python tools/build_game.py, npm test, npm run validate:game-sprites, npm run validate:enemy-sprites, relevant deterministic browser and actual GDevelop smoke tests at desktop and 390px. Compare balance using identical seeds after AI/damage changes; distinguish bots and human testing. Check save version upgrades, unlock preservation, 7 language strings, patch notes, secret seed1993, results, controls, reduced motion and missing-asset fallback. Every graphics candidate requires $primal-art-gates. Output PASS, PASS WITH NOTES, FAIL or NOT VERIFIED by test with evidence. Never merge, push to gh-pages or publish without Jonas permission.
