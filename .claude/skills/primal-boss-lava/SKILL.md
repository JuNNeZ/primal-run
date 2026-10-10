---
name: primal-boss-lava
description: Reproduce Ankylosaurus holding Space against Karl across lava and design regression tests for terrain exploits.
model: opus
effort: xhigh
disable-model-invocation: true
---
Test the real repro, NOT only Velociraptor bite. Player Ankylosaurus stands still on far bank of level 7 lava, holds Space within tail-swing range, damages Karl repeatedly while Karl cannot reach.
On Claude-owned QA branch, add deterministic reproducer for held-space attack rate/hitbox, boss/player HP, boss charge selection and recovery, navigation state and line of sight. Check deep water, stone, trees, other AoE attacks; compare open ground and unaffected Carl fight. Check 05_BOSS_EXPLOIT_REVIEW.md from claude/records-design. Preserve ability to use terrain tactically but disallow cost-free boss kills. Recommend fair reachable-target behavior, crossing/reposition and telegraphs >=0.45s. DO NOT implement B1 boss AI on the active Codex branch; deliver tests and exact technical handoff.
