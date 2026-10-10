---
name: primal-release-review
description: Independent read-only Primal Run test and review gate for a commit or PR; never publish.
model: opus
effort: high
disable-model-invocation: true
---
Target: $ARGUMENTS
Identify exact branch/commit and requirements. Execute relevant npm test, npm run validate:game-sprites, npm run validate:enemy-sprites, browser smoke and balanced simulation where feasible. Verify actual screenshots, mobile 390px, save migration, translations and claims against code. Mark each criterion PASS, PASS WITH NOTES, FAIL or NOT VERIFIED with evidence. No gh-pages, no merge, no push or automatic fixes to the active branch. Return smallest blockers and precise follow-up.
