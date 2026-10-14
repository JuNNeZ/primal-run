---
name: primal-status
description: Find current Primal Run development branch, status, project owners and safe next task. Use when asked for project status.
model: haiku
effort: low
---
Audit read-only, with minimal context.
1. Inspect current git branch/HEAD and most recent upstream commits. The game is on `integration/next`; `main` is older.
2. List open PRs targeting `integration/next` and what `integration/next` has that `gh-pages` (live) does not.
3. Mark what is merged, open, waiting on Jonas (approval cards, "udgiv") and unverified.
4. Reply in Danish with actual evidence (commit, tests, changed files) and a safe next action.
Never write to the repo or declare something done without evidence.
