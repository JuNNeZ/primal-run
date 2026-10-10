# Primal Run — shared Claude Code rules

Repo: JuNNeZ/primal-run. The default `main` is a historical kit, not the authoritative playable game. Inspect git HEAD and latest upstream branch before coding.

- Codex owns A1-A6 on `codex/sprites-and-mechanics` until explicitly completed. Never push there or overwrite Codex work.
- Claude may implement independent R-DIST, R-TRACK, R-RECORDS and R-REPORT on Claude-owned feature branches, with tests. Specs live on `claude/records-design`; fetch relevant docs without overwriting code.
- ChatGPT owns generated art. Claude reviews artwork and may generate procedural helpers and validators, but not replace original artwork.
- B1-B8 boss/terrain changes require coordination due to overlapping `core.js`/`app.js` and Part A work.
- Reuse preserved 9-second meteor prototype on `codex/preserved-feathered-starter` rather than reimplementing it blindly.
- Checks: `python tools/build_game.py`, `npm test`, `npm run validate:game-sprites`, `npm run validate:enemy-sprites`, `npm run simulate:quick` as appropriate.
- Danish is the source language. Maintain da/en/de/sv/no/ja/zh through existing i18n pipeline. Preserve saves, unlocks, historical sprites, Primal Earth 32 palette, fixed anchors and mobile layout.
- Always distinguish proven results from assumptions and include commit references and tests. Use small, scoped commits.
- NEVER update `gh-pages`, merge PRs, auto-publish, force-push a shared branch, or silently overwrite overlapping changes without Jonas's explicit instruction.
- Known issue: Ankylosaurus holds Space and hits Karl across level 7 lava while stationary; test that exact scenario rather than just a bite attack.
- Favor inexpensive lookup and routine coding. Use High / XHigh for genuine complexity, and Fable only by explicit request.

## Update 2026-10-10 (Claude records branch)
- Current Claude base: `claude/records-implementation` (records, titles, metre distance, exploit/rival tests). Part B code plan and ownership: `PRIMAL_RUN_Game/PART_B_PLAN_2026-10.md` (Claude builds B code on `claude/part-b`; Codex does assets + integration). Status: `PRIMAL_RUN_Game/RECORDS_STATUS.md`.
- Windows checkout: `git config core.longpaths true` and `git config core.autocrlf false` before checkout, or CRLF breaks the GDevelop source-hash test.
- `python tools/build_game.py` on Windows writes CRLF and truncates `PRIMAL_RUN_Game/Source_Generated/README.md`: convert changed files to LF, `git checkout` that README, then recompute `integration_report.json` `source_sha256` from the LF files.
- Browser tests rewrite tracked `*_report.json` and `previews/*.png`; restore them with `git checkout` before committing unless the change is intended.
- New features go behind `FEATURES.<flag>`; keep core edits in small, isolated blocks; tests: `node --test tests/*.test.cjs`, then `npm run test:game` before pushing.
- Combined game: `integration/next` (Codex + Claude, merged and tested by `/primal-integrate`). Start new Claude work from it; keep feature work on `claude/*` branches. After any merge or source change use `python tools/rebuild_generated.py` instead of hand-merging generated files. Preview locally: `npm run preview` → http://localhost:8000/PRIMAL_RUN_Game/. Publishing (`pages.yml` → live site) only on Jonas' explicit "udgiv".
