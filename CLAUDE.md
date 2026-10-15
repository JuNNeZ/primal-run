# Primal Run — shared Claude Code rules

Repo: JuNNeZ/primal-run. The playable game lives on `integration/next` (folder `PRIMAL_RUN_Game/`). `main` is the older kit and only receives releases; start every task from `origin/integration/next`.

## Working with Jonas
- Reply in Danish. Show proposals before larger changes; small, scoped commits with tests.
- Always distinguish proven results from assumptions and include commit references and test output.
- Favor inexpensive lookup and routine coding. Use High / XHigh for genuine complexity, and Fable only by explicit request.

## Branches and PRs
- Claude: feature branch `claude/*` from `integration/next`, draft PR back to `integration/next`. Codex: `codex/*` the same way. Never push to or overwrite a `codex/*` branch.
- "Merge og push" means merge into `integration/next` only. Never merge PRs into `main`, force-push a shared branch or silently overwrite overlapping changes without Jonas's explicit instruction.
- Combine branches with `/primal-integrate`.

## Going live (one rule, referenced everywhere else)
The live site is the `gh-pages` branch. Publish ONLY after Jonas explicitly writes "udgiv". Then: back up the current site (`git push -q origin origin/gh-pages:refs/heads/backup/live-<date>`), run `npm run build:web`, and push `dist` to `gh-pages` with a commit naming the source commit. `.claude/settings.json` allows these pushes so they don't prompt; the permission is not the approval. Without "udgiv" nothing touches `gh-pages`.

## Art
- Original art may be drawn by Codex/ChatGPT or by Claude when Jonas assigns it. Nothing becomes `approved_animation` without Jonas' visual approval (approval card); file checks never approve art.
- Rig frames from `tools/rig_animate.py` may be used as prototype art (`prototype_static`), never as approved art without that approval. See `tools/RIG_ANIMATOR.md`.
- Preserve saves, unlocks, historical sprites, Primal Earth 32 palette, fixed anchors and mobile layout.

## Code and generated files
- New features go behind `FEATURES.<flag>` in `PRIMAL_RUN_Game/src/core.js`; keep core edits in small, isolated blocks.
- Never hand-merge generated files (`project.json`, `integration_report.json`, `manifest.json`, `animation_manifest.json`, `src/assets.js`, `src/lang.js`, `src/run_titles.js`): run `python tools/rebuild_generated.py`.
- Danish is the source language; all 24 languages in `tools/i18n/lang/` go through the i18n pipeline (`npm run build:lang`).
- Checks: `node --test tests/*.test.cjs`, `npm run test:game`, `npm run validate:game-sprites`, `npm run validate:enemy-sprites`. Browser tests rewrite tracked `*_report.json` and `previews/*.png`; restore them with `git checkout` before committing unless the change is intended.
- Preview: `npm run preview` → http://localhost:8000/PRIMAL_RUN_Game/

## Known pitfalls
- Merge conflict hotspots: the one-line `FEATURES={...}` list in `core.js` (keep both sides' flags), the `test:game` list in `package.json` (keep both sides' test files), generated `project.json` + `integration_report.json` (take either side, then rebuild).
- `roguelite-browser` and `player-full-browser` are timing-sensitive: one re-run is fine, a second failure is real.
- Balance sim against another core: `PRIMAL_CORE=<path> node tools/playstyle_sim.cjs ...` (`--core` does not reach worker threads). Simulator-only prototypes: `--exp`.
- Windows checkout: `git config core.longpaths true` and `git config core.autocrlf false`, or CRLF breaks the GDevelop source-hash test. `tools/build_game.py` on Windows writes CRLF: convert changed files to LF and recompute `integration_report.json` `source_sha256`.
