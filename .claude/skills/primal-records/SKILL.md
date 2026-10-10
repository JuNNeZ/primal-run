---
name: primal-records
description: Build Primal Run run tracking, Hall of Fame and Shame, 95 titles and save v3 migration.
model: opus
effort: medium
---
Work only on a Claude-owned implementation branch. Read 02_STATISTICS_AND_RECORDS.md, 03_RUN_REPORT_AND_TITLES.md, RUN_TITLES.md, data/run_titles.json, data/run_summary_variables.json and 11_QA_ACCEPTANCE_MATRIX.md from claude/records-design.
Implementation order: R-TRACK -> R-RECORDS -> R-REPORT, after R-DIST. Prefer isolated deterministic pure helpers and small core/app adapter patches. Register genuine death causes, named bosses, player-only damage and the actual RunSummary. Implement 29 Fame + 25 Shame stats, day/week/month/all-time local records, bounded recent results and save v2->v3 with preserved unlocks. Implement configurable 95-title selection, a responsive run card and optional share image. Unknown historical values display an em dash, not invented data. Do not claim live multi-user leaderboards. Gate title conditions depending on unfinished Part B. Run unit and browser tests, update da/en/de/sv/no/ja/zh, patch notes, commit and report remaining integration.
