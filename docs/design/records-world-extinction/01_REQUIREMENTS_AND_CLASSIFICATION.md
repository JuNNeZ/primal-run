# Requirements and classification

Every request in the phase brief, compared with the repository on 2026-10-10.

Classes: **Implemented** · **Partial** · **Part A** (active Codex session) · **Part B** (already specified in
`CODEX_TASKS_2026-10.md`) · **New** · **Assets** (needs graphics) · **Investigate**.
A row may carry two classes (e.g. New + Assets).

Baseline used for the audit: `codex/sprites-and-mechanics` @ `4d9115f` (= `claude/overhaul` @ `89e7c8b` + playable
Deinosuchus + Deinonychus as the free default starter + 96 A1 attack prototype frames for four species + new food
pickups, HUD head poses and ecology fixes). Status file: `PRIMAL_RUN_Game/SPRITES_AND_MECHANICS_STATUS.md` – A1 is
partly integrated (Parasaurolophus still missing); A2–A6 and B1–B8 are "afventer" (pending).

## System 1 – Hall of Fame / Shame

| ID | Requirement | Class | Notes |
|---|---|---|---|
| R1.1 | Today / Week / Month / All Time scopes | New | rolling period aggregates (02 §2) |
| R1.2 | Fame: kills, boss kills, mini-boss kills | Partial | lifetime kills/bosses/rivals exist; per-period and mini-boss counts new |
| R1.3 | Most-played / most successful species | New | needs per-run species log |
| R1.4 | Longest run, distance, explored areas | Partial | lifetime seconds/distance/zones exist; distance unit wrong (R3.1) |
| R1.5 | Highest damage, longest flawless survival | New | `damageDealt` exists per run; flawless timer new |
| R1.6 | Most DNA, most achievements | Partial | DNA per run exists; achievements count exists |
| R1.7 | Shame: deaths by each named boss | New | `r.lastHit` exists but not persisted, no boss identity |
| R1.8 | Lava / environmental deaths | New | lava damage passes `null` source today |
| R1.9 | Shortest survival, failed runs, defeat streak | New | – |
| R1.10 | Embarrassing causes, damage taken, failed boss encounters | New | weights in 02 §5.1 |
| R1.11 | ≥ 40 statistics | New | 54 specified |
| R1.12 | Local vs session vs global | New | global explicitly out of scope (no backend) |
| R1.13 | Accumulate / reset / aggregate / migrate | New | save v2 → v3, seeded from `lifetime` |
| R1.14 | Daily-seed board | Part B (B7) | B7 adds a local highscore per date; records only reads it |

## System 2 – Run report

| ID | Requirement | Class | Notes |
|---|---|---|---|
| R2.1 | Run card with real stats | Partial | result screen + raw `<details>` exist |
| R2.2 | Derived stats (efficiency, streaks, boss performance, exploration %) | New | only where data exists (03 §2) |
| R2.3 | ≥ 75 titles with full metadata | New | 95 + fallback in `data/run_titles.json` |
| R2.4 | Deterministic selection | New | 03 §4 |
| R2.5 | No fabricated stats | New (rule) | every title variable declared; build script enforces it |
| R2.6 | Share image | New + Assets | `run_card_frame` |

## System 3 – Distance

| ID | Requirement | Class | Notes |
|---|---|---|---|
| R3.1 | Explain 103 km | Implemented (diagnosis) | px displayed as m; ~10.5 min of movement (04 §1) |
| R3.2 | Calibration method | New | `PX_PER_METER`, recommendation 20 after validation |
| R3.3 | Never increases while standing still | Implemented | verified 0 px idle / teleport; add regression test |
| R3.4 | Movement-type handling table | New (rules) | 04 §3 |
| R3.5 | Gallimimus unlock threshold | Investigate | currently ~2 min of running; proposal 10 km (200 000 px) |

## System 4 – Boss exploit

| ID | Requirement | Class | Notes |
|---|---|---|---|
| R4.1 | Lava-river exploit fix | New | probe shows charges neutralised + free recover (05 §2) |
| R4.2 | Pathfinding / nav grid | New | none exists; animals use local steering |
| R4.3 | Hazard navigation and crossings | Partial | water fords exist; lava crossings only on preserved branch |
| R4.4 | Aggro / leash / fallback states | New | `reposition`, `stalk`, `answer`, `leash` |
| R4.5 | Ranged attacks | New | optional Karl "Askekast" only |
| R4.6 | Boss signature mechanics | Part B (B1) | do not duplicate; System 4 states must coexist with B1 |
| R4.7 | Carl not more lethal | Rule | test X10 |
| R4.8 | Exact repro of Jonas's case | Investigate | species/position/video |

## System 5 – World and collision

| ID | Requirement | Class | Notes |
|---|---|---|---|
| R5.1 | Varied terrain, transitions, decals, shadows | New + Assets | W1 |
| R5.2 | Water/shore transitions | Part A (A4) | excluded here |
| R5.3 | Lava/ash edge tiles | Part A (A6, optional) | excluded unless A6 is skipped |
| R5.4 | Elevation, cliffs, ramps | New + Assets | W3 |
| R5.5 | Better collisions (trees/logs) | New | only rocks collide today (06 §1) |
| R5.6 | Three obstacle classes, size-based push-through | New | 06 §2 |
| R5.7 | Elevation vs pathfinding/combat/collision | New | 06 §4 |

## System 6 – Achievements and secrets

| ID | Requirement | Class | Notes |
|---|---|---|---|
| R6.1 | Extend 17 achievements | New | 17 new (3 depend on Part B) |
| R6.2 | Hidden / rare achievements | New | `hidden`, `secret`, `rarity`, `requires` fields |
| R6.3 | Secret collectibles | New + Assets | amber, 1 per level |
| R6.4 | Post-final-boss level | New + Assets | "Den Sidste Himmel" (level 9) |
| R6.5 | ≥ 2 unlock routes | New | amber ≥ 6/8, all rivals |
| R6.6 | Achievability check | Investigate → partly done | rivals missing on 33/1 600 levels → fix required (07 §3.2) |
| R6.7 | Night / allies / challenges achievements | Part B (B2, B5, B6) | gated by `requires` |

## System 7 – Meteor ending

| ID | Requirement | Class | Notes |
|---|---|---|---|
| R7.1 | ~10 s storyboard after Ragnar | Partial | 9 s cinematic on `codex/preserved-feathered-starter`, not merged |
| R7.2 | Timing, camera, layers, sound | New (spec) | 08 §2 |
| R7.3 | Branching normal/secret | New | 08 §1 |
| R7.4 | ChatGPT asset manifest | Assets | 08 §5 / 10 |

## System 8 – Art QA

| ID | Requirement | Class | Notes |
|---|---|---|---|
| R8.1 | T. rex three legs walking W | Investigate → confirmed by reviewer look | forelimb drawn as a foot (09 §1.2) |
| R8.2 | Triceratops horns | Investigate → confirmed | W lacks nasal horn, E nasal too long |
| R8.3 | Weaker directions | Investigate → measured | E/W mirror IoU 0.47–0.63; N areas small |
| R8.4 | Species anatomy rules + approval criteria | New (extends SPECIES_ANATOMY.md) | 09 §2–4 |
| R8.5 | Mirroring policy | New | E/W via lossless flip when valid; N/S separate |
| R8.6 | Species attack sprites, idles, limp, water, raptor corpses | Part A | excluded |

## System 9 – Documentation

| ID | Deliverable | File |
|---|---|---|
| D1 | Requirements document | this file |
| D2 | 75+ run titles | `RUN_TITLES.md`, `data/run_titles.json` |
| D3 | Statistics event schema | `02_STATISTICS_AND_RECORDS.md` §6, `data/run_summary_variables.json` |
| D4 | Hidden achievements | `07_ACHIEVEMENTS_AND_SECRETS.md` |
| D5 | World collision spec | `06_WORLD_AND_COLLISION.md` |
| D6 | Boss anti-exploit matrix | `05_BOSS_EXPLOIT_REVIEW.md` §5 |
| D7 | Ending storyboard | `08_METEOR_ENDING.md` |
| D8 | Asset manifest | `10_ASSET_QUEUE_CHATGPT.md`, `data/asset_queue.json` |
| D9 | Codex handoff | `CODEX_HANDOFF.md` |
| D10 | README improvement plan | `12_README_PLAN.md` |
| D11 | QA acceptance matrix | `11_QA_ACCEPTANCE_MATRIX.md` |
