---
name: primal-integrate
description: Merge Codex and Claude work into integration/next as one playable, tested game for Jonas to preview. Never publishes.
model: opus
effort: high
disable-model-invocation: true
---
Build the combined game on `integration/next`. Extra sources from Jonas: $ARGUMENTS

1. `git fetch origin`. Sources, in order: `codex/sprites-and-mechanics`, `claude/records-implementation`, `claude/part-b`, plus any branch Jonas names. Skip a source that is already contained (`git merge-base --is-ancestor`). Report each source's head commit.
2. `git switch integration/next && git pull --ff-only`. Merge each source with `git merge --no-ff --no-edit origin/<branch>`. Never rebase, force-push or rewrite history, and never push to a source branch.
3. Conflicts:
   - Generated files (`PRIMAL_RUN_Game/project.json`, `integration_report.json`, `manifest.json`, `animation_manifest.json`, `src/assets.js`, `src/lang.js`, `src/run_titles.js`): take either side, then regenerate in step 4.
   - Translation tables (`tools/i18n/tr_*.py`): keep both sides' rows.
   - `core.js` / `app.js`: keep both features. Codex owns sprites/animation/Part A; Claude owns records.js, titles and Part B blocks behind `FEATURES` flags. If a hunk changes the same logic in two ways, stop, `git merge --abort`, and report the file/lines and both intents to Jonas instead of guessing.
4. `python tools/rebuild_generated.py`, then commit the regenerated files as "Rebuild generated files for integration".
5. Verify: `npm ci` if needed, `node --test tests/*.test.cjs`, then `npm run test:game`; `npm run validate:game-sprites`, `npm run validate:enemy-sprites`. Browser tests rewrite tracked `*_report.json` and `previews/*.png`: restore them with `git checkout` unless they are part of the merge. A failing test blocks the push unless Jonas accepts it; known TODO tests (X1 boss exploit until B1a lands) are allowed.
6. Push `integration/next` and report in Danish: merged commits, conflicts and how they were resolved, test counts, known failures, and how to preview:
   - Local: `git switch integration/next`, `npm run preview`, open http://localhost:8000/PRIMAL_RUN_Game/
   - Online preview only if Jonas set one up (separate repo/Pages); never the live site.
Never update `gh-pages`, run the Pages workflow, merge PRs or publish. Going live is a separate, explicit "udgiv" from Jonas: then run `.github/workflows/pages.yml` (workflow_dispatch) on `integration/next` only after he confirms Settings > Pages > Source is "GitHub Actions".
