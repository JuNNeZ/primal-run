# Rekorder, distance og run-titler – status (R-DIST · R-TRACK · R-RECORDS · R-REPORT)

Branch: `claude/records-implementation` (same history as `claude/records-impl`; built from `claude/primal-skills` → `codex/sprites-and-mechanics` @ 33d78a1).
Specs: `docs/design/records-world-extinction/` (copied unchanged from `claude/records-design`; data files `run_titles.json`
and `run_summary_variables.json` are the source of truth for titles).

## Arkitektur

| Fil | Indhold |
|---|---|
| `src/records.js` (ny) | Pure helpers: `PX_PER_METER`, `formatDistance`, period keys, `buildRunSummary`, 54 statistics, `applySummary`, v2→v3 migration, `pickTitles`. `install()` wraps `Game` methods for tracking, so core logic is unchanged. |
| `src/run_titles.js` (genereret) | `tools/build_run_titles.py` → 96 titles with conditions as functions (no `eval`). The build rejects undeclared variables. |
| `src/core.js` | 8 lines added, 3 changed: load records, Gallimimus 10 km, save v3 fields, lava passes `{hazard:'lava'}`, `install()`, exports. Falls back without records.js (review pages load only core.js). |
| `src/app.js` | Records screen (Fame/Shame/Top 10 × I dag/Uge/Måned/Altid), run card, cause line, metre display, "Opgiv" → `giveUp()`. |
| `tools/i18n/tr_records.py` | 283 rows da/en/de/sv/no/ja/zh (UI labels, 54 statistics, 96 title names + descriptions). |

Overlap with Part A: no sprite, animation, terrain or boss AI changes. `core.js` gets only the small adapter lines above, all in places that Part A does not touch (`git diff --numstat`: 8 added, 3 removed).

## Proven (tests)

| QA | Check | Evidence |
|---|---|---|
| Q16 | 60 s movement 3–13 m/s for all 12 species | `tests/records.test.cjs` |
| Q17 | Idle / teleport adds 0 | same |
| Q18 | Walking into a rock for 10 s < 1 m | same |
| Q19 | Every level 150–400 m wide (4032 px = 201.6 m) | same |
| – | Gallimimus now 10 km = 200 000 px; existing unlocks remain | same |
| Q1 | Same summary sequence → byte-identical records | same |
| Q2 | Day/ISO week (2026-W53 → 2027-W01)/month rollover, archived `previous` | same |
| Q3 | Karl (`carnotaurus@7`) → S2 +1, S1/S3–S8 unchanged; seed 1993 = `secret:` | same |
| Q4 | Lava death via the real `step()` burn path → `lava`, S10/S11 +1 | same |
| Q5 | Abandon → S15 + S16, not S14 | same |
| Q6 | v2 → v3: lifetime-seeded sums, "—" for the rest, no NaN, corrupt fields dropped | same |
| Q7 | 1000 runs: records + titles < 64 KB, recent capped at 50 | same |
| Q8 | Records screen 390×844 da/de/ja, no horizontal scroll, labels translated | `tests/records-browser.cjs` |
| Q9 | Ecology hunt next to an idle player: `damageDealt` = 0 | `tests/records.test.cjs` |
| Q10 | All 96 conditions: true and false fixtures | same |
| Q11 | `pickTitles` 1000× identical, key order irrelevant | same |
| Q12 | Victory never gives a shame primary | same |
| Q13 | Compy death → "Compy-snack" + cause line (unit and browser) | both |
| Q15 | Every variable required by a title exists in the RunSummary | `tests/records.test.cjs` |
| Q41 | i18n for every new string in 6 languages | same |

## Assumptions and approximations (not proven)

- `maxHitDamage` = largest HP drop on one enemy within a single player step, counted only for animals the player provoked in that step (`provoke()` sets `lastAttackedAt`). Not exactly the final per-hit damage from `resolveBite`.
- `bossAttempts` counts a boss once it is within 420 px of the player or damaged (core spawns bosses already `alert`). Boss fight time runs from the boss's spawn.
- `ambushKills` = a kill within 1.5 s of an attack started while hidden.
- `rivalsSpawned` counts rivals seen in `r.enemies` (one per level).
- Untracked (`null` → titles hidden, boards show "—"): `foodStolen`, `secretsFound`, `secretLevel`, `secretEnding` and Part B (`nightKills`, `alliesRecruited`, `challengeCount`, `dailySeed`). Affects the titles robbed_blind, amber_*, last_sky, they_became_birds and the 4 Part B titles.
- PX_PER_METER = 20 rests on the sprite body-length table in 04 §2. Q20 (re-measuring after Part A redraws) is still a human task.

## Not done / remaining integration

- "Del resultat" copies a text card (clipboard, no network). A PNG share image is not built.
- **Q14 FAIL (bot evidence, not human playtests):** `balance_runs/title_distribution_2026-10-10.json` – 72 bot runs (12 species × 6 styles, 600 s), 58 ended. `speed_slayer` was primary in 60.3 % (target ≤ 25 %), fallback 0 % (target < 10 %). Cause: bots kill Palle (mini-boss, level 1, 100 HP) within 25 s of the boss spawning. Recommendation for Jonas: limit `speed_slayer` to non-mini bosses or require `bosses >= 2`. Changing the reviewed catalogue is a design decision, so it was not changed.
- Run log for bots in `tools/playstyle_sim.cjs` is not extended; `tools/title_distribution.cjs` reuses its bots instead.
- Merging into the Codex branch happens only on Jonas' instruction. Expect conflicts only in `core.js` (8 lines), `app.js` (result/scores screens), `project.json`/`integration_report.json` (regenerate with `npm run build:game`) and `lang.js` (regenerate with `python tools/i18n/build_lang.py`).

## Independent review (subagent, read-only) – 89cb630

Fixed: the fatal hit is now included in the summary (lava/flawless), boss chips in classic/secret runs show the right boss, record keys are restricted to plain ids and values are escaped, weighted-cause ties follow §5.1, and a boss attempt counts at engagement. Not changed (noted): poison ticks count as hits for "no damage taken" streaks; a `seeded` sum keeps the "fra tidligere runs" note after new runs are added.

## Ankylosaurus/Karl lava exploit – 64a889c

`node tools/boss_exploit_probe.cjs` (seed 3, real core, stationary player holding Space):

| Setup | Karl HP lost | Player HP lost | Result |
|---|---|---|---|
| Ankylosaurus 90 px from the lava line | 100 % (21.8 s) | 26 % | exploit reproduced |
| Ankylosaurus 70 px | 100 % | 72.7 % | |
| Same distance, open ground (control) | 62 % | 100 % | player dies |
| Velociraptor 50–70 px | 100 % | 77.8 % | |
| Triceratops 90 px | 100 % | 0 % | worse than Anky |
| Ankylosaurus vs Carl across deep water (level 2) | 100 % | 98.7 % | Carl reaches; no exploit there |

Karl never enters lava (X7 holds); his charges stop at the edge and he cannot reach the far bank. `tests/boss-exploit.test.cjs` pins the repro, and X1 (≤ 25 % HP loss across lava) is a TODO test for Codex' B1 reachability/stalk work (05 §4.3). No boss AI was changed.

## Rival bug – 89cb630

Probe over 500 seeds × 8 levels: the rival was missing on level 3 (39×) and level 4 (35×), i.e. on 7.4 % of river maps. Cause: the Baryonyx rival needs `suitableHabitat` (riverside) **and** `!isWater(margin -40)`, and on those maps no habitat satisfied both. Fix: fall back to margin 0 (never in water). After the fix 0 were missing across 2000 maps. Rivals that did spawn were all still alive after 60 s (470/470), so they do not disappear.
