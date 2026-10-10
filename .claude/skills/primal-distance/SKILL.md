---
name: primal-distance
description: Fix Primal Run distance conversion R-DIST with tests and preserve progress.
model: opus
effort: medium
---
Implement on a Claude-owned feature branch only. Read claude/records-design/docs/design/records-world-extinction/04_DISTANCE_CALIBRATION.md from its source branch and inspect current code before changing it.
Reproduce incorrect px-as-metres display. Calibrate one global PX_PER_METER (20 provisional, validate via sprite size, speed and map width); retain pixels in stored save data. Convert output to metres/km via shared formatDistance. Adjust Gallimimus unlock to a meaningful threshold without revoking existing unlocks. Add idle, movement, collision, teleport, all-species and migration tests; update translations. Commit focused changes with test evidence. Never change Part A graphics or active Codex branch.
