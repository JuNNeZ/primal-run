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
