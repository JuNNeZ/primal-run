---
name: primal-status
description: Find current Primal Run development branch, status, project owners and safe next task. Use when asked for project status.
model: haiku
effort: low
---
Audit read-only, with minimal context.
1. Inspect current git branch/HEAD and most recent upstream commits. Do not assume main is current; it is an older prototype.
2. Read PRIMAL_RUN_Game/SPRITES_AND_MECHANICS_STATUS.md and CODEX_TASKS_2026-10.md; inspect claude/records-design if the design docs are not in this branch.
3. Mark Codex-owned A1-A6, independent Claude tasks, dependent Part B, art pending and unverified areas.
4. Reply in Danish with actual evidence (commit, tests, changed files) and a safe next action.
Never write to the repo or declare something done without evidence.
