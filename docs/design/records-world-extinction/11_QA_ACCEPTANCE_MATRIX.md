# QA acceptance matrix

Type: **U** unit (`node --test`), **B** browser (Playwright, CI), **S** simulation (`tools/playstyle_sim.cjs`
or a probe), **V** deterministic visual/asset check, **H** human review (Jonas). Every row must pass before its
package is called done. Evidence goes to `ci-results/<branch>` or `PRIMAL_RUN_Game/balance_runs/`.

| ID | Sys | Check | Type | Pass condition |
|---|---|---|---|---|
| Q1 | S1 | Same RunSummary sequence → identical `save.records` | U | byte-identical JSON |
| Q2 | S1 | Day / ISO week (incl. year boundary) / month rollover | U | injected clock; old period archived, new empty |
| Q3 | S1 | Death by Karl increments S2 only | U | S1, S3–S8 unchanged |
| Q4 | S1 | Lava death recorded as `lava` | U | `deathCauseType === 'lava'`, S10/S11 +1 |
| Q5 | S1 | Abandon counts S15 + S16, not S14 | U | – |
| Q6 | S1 | v2 save migration | U | lifetime-backed sums seeded; other boards "—"; no NaN |
| Q7 | S1 | Storage after 1 000 simulated runs | U | `records` + `titles` < 64 KB |
| Q8 | S1 | Records screen at 390 × 844, da/de/ja | B | no horizontal scroll, all labels translated |
| Q9 | S1 | Ecology hunt beside an idle player | U | `damageDealt` unchanged (risk R3) |
| Q10 | S2 | Each title condition true/false fixtures | U | 96/96 titles |
| Q11 | S2 | `pickTitles` deterministic & key-order independent | U | 1 000 runs identical |
| Q12 | S2 | Victory never yields a shame primary | U | – |
| Q13 | S2 | Scripted compy death | B | card shows "Compy-snack" and cause line |
| Q14 | S2 | Title distribution over bot runs | S | no title > 25 % as primary; fallback < 10 % |
| Q15 | S2 | Every number on the card maps to a declared variable | U | build script + card renderer audit |
| Q16 | S3 | 60 s movement per species | U | 3–13 m/s |
| Q17 | S3 | Idle 60 s / knockback-only / teleport | U | distance unchanged |
| Q18 | S3 | Walking into a rock 10 s | U | < 1 m |
| Q19 | S3 | Level width in metres | U | 150–400 m for all 8 levels |
| Q20 | S3 | Body-length median after Part A redraws | V | 17–23 px/m or constant revisited |
| Q21 | S4 | X1–X12 anti-exploit matrix | U/S | thresholds in 05 §5 |
| Q22 | S4 | Exploiter bot boss-kill rate | S | ≤ optimizer bot's rate |
| Q23 | S5 | No spawn inside Solid colliders / cliff-adjacent cells | U | 500 seeds × 8 levels |
| Q24 | S5 | Start zone reaches every zone, site, event | U | BFS, 500 seeds |
| Q25 | S5 | Trample: fern under T. rex | U | flattened, no cover 20 s |
| Q26 | S5 | Mobile frame time with W1+W2 | B | ≤ +10 % vs baseline |
| Q27 | S6 | Rival present on every level | U | 0 missing over 500 seeds × 8 |
| Q28 | S6 | Amber placement reachable, ≥ 900 px from start | U | 500 seeds |
| Q29 | S6 | Explorer bot amber ≥ 6/8 among level-8 reachers | S | 30–60 % |
| Q30 | S6 | Refuge reachable after every collapse event | U | BFS each event |
| Q31 | S6 | Debris density on an idle player | S | ≤ 1 hit / 4 s average |
| Q32 | S6 | Hidden/secret achievements gated by `requires` | U | none visible when feature off |
| Q33 | S7 | Victory banked before the cinematic | U | `save.scores`/records written before level 9 |
| Q34 | S7 | Storyboard keyframe timing | U | data table times within ±1 frame |
| Q35 | S7 | Reduced motion | B | 3 static frames, same text |
| Q36 | S7 | Space cannot skip; confirm works after 2 s | B | – |
| Q37 | S7 | Seed 1993 / classic keep normal victory | U | no meteor, no level 9 |
| Q38 | S8 | Deterministic sprite checks (09 §4.1) | V | `art_qa_report.json` all pass or flagged |
| Q39 | S8 | Anatomy checklist per species × direction | H | signed in review page |
| Q40 | All | Existing test suite | U/B | all existing unit + browser tests pass |
| Q41 | All | i18n | U | every new Danish string has da/en/de/sv/no/ja/zh rows; `build:lang` clean |
| Q42 | All | Patch notes | H | new section per package |
| Q43 | All | No claims without evidence | H | PR lists CI run, commit and artefact paths |
