# System 1 – Hall of Fame & Hall of Shame, statistics model and event schema

Status: **New work**. It builds on the existing `save.lifetime`, `save.scores`, `r.stats` and achievement
code in `core.js`. No backend exists, so every board is **local to one browser profile**.

## 1. What exists today (audited on `codex/sprites-and-mechanics` @ 4d9115f)

| Thing | Where | Notes |
|---|---|---|
| Save | `localStorage['primalRun.save.v1']`, `save.version = 2` | Fields: version, name, dna, upgrades, settings, scores, bindings, fieldGuide, unlockedSpecies, achievements, lifetime, dietRecords, skins, skin, selectedSpecies |
| Lifetime totals | `save.lifetime` | runs, kills, bosses, albinos, rivals, plantsEaten, fishCaught, distance (**pixels**), zones, herbivoreElites, seconds, victories. Banked once per run in `finish()` → `bankLifetime()` |
| Highscores | `save.scores` (top 10) | name, score, stage, bosses, seconds, victory |
| Run stats | `r.stats` (base keys at run start; crits, albinos, rivals, zones, herbivoreElites, finteHits are added lazily) | attacks, landedAttacks, hits, kills, fishCaught, plantsEaten, meatEaten, abilities, avoidedHits, damageTaken, damageDealt, healing, distance, staminaSpent, food, dna, dropRolls, drops, mutations, killsBySpecies, crits, albinos, rivals, zones, herbivoreElites |
| End screen | `app.js` statistics `<details>` | Shows "Distance (pixels)" and "Estimerede skridt" = distance/24 |
| Run summary text | `runSummary()` | 6 hard-coded titles → replaced by System 2 |
| Death cause | **partial** | `damage()` sets `r.lastHit = {kind, direction, mode, boss, sex}` for animal sources and `null` otherwise (lava). The result screen prints "Dræbt af <art>" or "Ingen registreret dræber". Not persisted; no level/boss identity, no hazard type |

## 2. Scopes

| Scope | Key | Storage | Reset |
|---|---|---|---|
| Session | – | memory only (`game.session`) | page reload |
| Today | local date `YYYY-MM-DD` | `save.records.periods.day` | when the key changes at run end or on load |
| Week | ISO week `YYYY-Www` (Monday start, local time) | `save.records.periods.week` | key change |
| Month | `YYYY-MM` | `save.records.periods.month` | key change |
| All time | – | `save.records.allTime` | never (only "reset statistics" in settings, with confirmation) |
| Global | – | **not built** | see §8 |

Periods are **rolling aggregates**, not recomputed from a run log, so storage stays bounded no matter how many
runs a player does. A capped `save.records.recent` (last 50 run summaries, ~350 bytes each ≈ 18 KB) feeds the
"last runs" list and lets a bug fix recompute derived boards without losing data.

The period key is computed from the **run end time** (`Date.now()` at `finish()`), in the browser's local time
zone. A run that starts 23:58 and ends 00:04 counts for the new day. Clock changes never delete all-time data.

## 3. Aggregation types

- `sum` – add the run value (e.g. total kills).
- `best` – keep the single best run value plus a run reference (`{value, species, date, seed}`); ties keep the
  **earlier** record (first to reach it owns it).
- `least` – like `best` but lower wins; only runs that satisfy the board's eligibility rule count.
- `count` – count runs matching a predicate (e.g. deaths by Carl).
- `streak` – running counter plus best; resets on the opposite outcome.
- `mode` – most frequent value with its count; ties → most recent.
- `ratio` – stored as numerator + denominator so it aggregates exactly.

## 4. Hall of Fame (29 statistics)

`run` values come from the RunSummary (`data/run_summary_variables.json`). Eligibility rules prevent tiny
samples from winning ratio boards.

| # | ID | Danish label | Type | Value | Eligibility / tie-break |
|---|---|---|---|---|---|
| F1 | most_kills_run | Flest nedlæggelser i ét run | best | kills | earlier wins |
| F2 | total_kills | Nedlæggelser i alt | sum | kills | – |
| F3 | most_bosses_run | Flest bosser i ét run | best | bosses | then shorter seconds |
| F4 | total_bosses | Bosser i alt | sum | bosses | – |
| F5 | total_minibosses | Mini-bosser i alt | sum | minibossKills | – |
| F6 | most_minibosses_run | Flest mini-bosser i ét run | best | minibossKills | earlier wins |
| F7 | most_played_species | Mest spillede art | mode | species (runs) | ties → most recent |
| F8 | most_successful_species | Mest succesfulde art | derived | mean levelReached per species | ≥3 runs with that species; tie → victories, then runs |
| F9 | longest_run | Længste run | best | seconds | earlier wins |
| F10 | longest_distance_run | Længste tur | best | distanceM | earlier wins |
| F11 | total_distance | Distance i alt | sum | distanceM | displayed in km, 1 decimal |
| F12 | most_zones_run | Flest områder i ét run | best | zonesFound | then explorationPct |
| F13 | best_exploration | Bedste udforskning | best | explorationPct | levelReached ≥3 |
| F14 | highest_damage_run | Mest skade i ét run | best | damageDealt | earlier wins |
| F15 | biggest_hit | Største enkeltslag | best | maxHitDamage | earlier wins |
| F16 | longest_flawless | Længste skadefri periode | best | longestNoHitSeconds | earlier wins |
| F17 | most_dna_run | Mest DNA i ét run | best | dna | earlier wins |
| F18 | total_dna | DNA tjent i alt | sum | dna | – |
| F19 | most_achievements_run | Flest bedrifter i ét run | best | achievementsThisRun | earlier wins |
| F20 | achievements_completed | Bedrifter fuldført | current | count of `save.achievements` | all-time only |
| F21 | highest_score | Højeste score | best | result.score | existing `save.scores` logic |
| F22 | fastest_victory | Hurtigste sejr | least | seconds | victory only |
| F23 | fastest_boss | Hurtigste bossdrab | least | fastestBossSeconds | >0 |
| F24 | most_crits_run | Flest kritiske træf | best | crits | earlier wins |
| F25 | total_albinos | Albinoer i alt | sum | albinos | – |
| F26 | total_victories | Sejre i alt | sum | victory?1:0 | – |
| F27 | best_accuracy | Bedste træfsikkerhed | best | accuracy | attacks ≥40 |
| F28 | most_fish_run | Flest fisk i ét run | best | fishCaught | earlier wins |
| F29 | titles_collected | Titler samlet | current | count of `save.titles` | all-time only |

## 5. Hall of Shame (25 statistics)

| # | ID | Danish label | Type | Predicate / value |
|---|---|---|---|---|
| S1 | deaths_carl | Ædt af Carl | count | deathBossId == 'carnotaurus@2' |
| S2 | deaths_karl | Brændt af Karl | count | 'carnotaurus@7' |
| S3 | deaths_palle | Væltet af Palle | count | 'pachycephalosaurus@1' |
| S4 | deaths_benny | Slugt af Benny | count | 'baryonyx@3' |
| S5 | deaths_doris | Trukket ned af Doris | count | 'deinosuchus@4' |
| S6 | deaths_asta | Knust af Asta | count | 'ankylosaurus@5' |
| S7 | deaths_tina | Spiddet af Tina | count | 'triceratops@6' |
| S8 | deaths_ragnar | Ædt af Ragnar | count | 'tyrannosaurus@8' |
| S9 | deaths_rivals | Dræbt af rivaler | count | deathCause.rival |
| S10 | deaths_lava | Lavadødsfald | count | deathCauseType == 'lava' |
| S11 | deaths_environment | Naturen vandt | count | deathCauseType in {lava, environment} |
| S12 | deaths_compy | Ædt af en compy | count | killerIsCompy |
| S13 | shortest_survival | Korteste overlevelse | least | seconds of non-abandoned deaths |
| S14 | failed_runs | Mislykkede runs | count | !victory && !abandoned |
| S15 | abandoned_runs | Opgivne runs | count | abandoned |
| S16 | defeat_streak | Flest nederlag i træk | streak | death/abandon +1, victory resets; best kept |
| S17 | most_damage_taken_run | Mest skade taget i ét run | best | damageTaken |
| S18 | total_damage_taken | Skade taget i alt | sum | damageTaken |
| S19 | failed_boss_encounters | Tabte bosskampe | sum | bossAttempts − bosses (≥0) |
| S20 | embarrassing_cause | Mest pinlige dødsårsag | weighted mode | see §5.1 |
| S21 | most_food_stolen_run | Mest stjålet føde | best | foodStolen |
| S22 | worst_accuracy | Dårligste træfsikkerhed | least | accuracy, attacks ≥40 |
| S23 | total_lava_damage | Lavaskade i alt | sum | lavaDamage |
| S24 | most_low_hp_time | Længst tid på et hængende hår | best | lowHpSeconds |
| S25 | nemesis | Ærkefjende | mode | deathCauseKind over deaths (species that killed you most) |

**Total: 54 statistics** (29 Fame + 25 Shame).

### 5.1 Embarrassment weights (deterministic)

Each death gets one cause key and a fixed weight. The board shows the cause with the highest
`count × weight`; ties → higher weight, then alphabetical key.

| Cause key | Weight | Rule |
|---|---|---|
| compy | 10 | killed by a compy |
| sub_minute | 9 | died before 60 s |
| herbivore_on_herbivore | 8 | herbivore player killed by a herbivore |
| lava | 7 | lava damage was the killing blow |
| level1_boss | 6 | Palle |
| fleeing_prey | 6 | killer was in `flee` mode when it hit |
| boss_other | 3 | any other boss |
| enemy_other | 2 | any other animal |

## 6. Required tracking changes in core (implementation notes for Codex)

1. **Death cause.** Extend the existing `r.lastHit` in `damage(amount, source)` (keep its current fields,
   which the end scene reads) to `{type, kind, bossId, rival, mode, direction, boss, sex, at: r.seconds}` where
   `type = source?.hazard || (source?.boss ? 'boss' : source ? 'enemy' : 'environment')`.
   Lava calls `this.damage(4, {hazard:'lava'})` instead of `null` and must no longer reset `r.lastHit` to
   `null` afterwards (it does today); keep `null` handling for any other caller.
   `bossId = source.kind + '@' + (r.levelIndex + 1)` for level bosses **in the journey campaign only**.
   Classic-campaign and secret-seed (1993, boss "Mathias") runs use `bossId = 'classic:' + kind` /
   `'secret:' + kind`, so Mathias never counts as Palle; they appear on S9–S25 but not on the named-boss rows S1–S8.
   `finish(false)` copies `r.lastHit` to `r.deathCause`; `abandon()` sets `{type:'abandon'}`.
2. **Counters** listed as `new` in `data/run_summary_variables.json` are incremented at the single
   place the event happens (`kill()`, `damage()`, `catchFish()`, terrain sampling in `step()`).
   Terrain timers (`lavaSeconds`, `mudSeconds`, `deepWaterSeconds`, `hiddenSeconds`, `lowHpSeconds`) use
   the `terrainAt(r.player)` result already computed each player step.
3. `longestNoHitSeconds`: track `r.noHitSince`; on damage update the max; at run end close the open span.
4. `bossAttempts`: increment when a level boss first enters an aggro mode (not on spawn).
5. `maxHitDamage`: in `resolveBite` and ability hits, take the max of the final per-target damage.
6. `damageDealt` risk (R3): it is computed as the HP drop of **all** enemies during a player step
   (metrics wrapper at the end of `core.js`). Verify that NPC-vs-NPC hunting, lava and bleed-outs of
   animals the player never hit are excluded; the audit's 3-minute idle probe showed 0, so no evidence of
   contamination yet, but there is no test. Add one: an ecology hunt beside an idle player must not raise
   `damageDealt`.
7. Build the RunSummary (`s`) once in `finish()`; it is the only input to records, titles and the run
   report. Nothing in records reads live run state.

## 7. Save migration (version 2 → 3)

```
save.records = {
  allTime: { <statId>: <aggregate> },
  periods: { day: {key, stats}, week: {key, stats}, month: {key, stats} },
  streaks: { defeat: {current, best} },
  recent: [ RunSummary (compact) ... ]   // max 50, newest first
}
save.titles = { <titleId>: { first: ISODate, count: n } }
save.version = 3
```

- Existing `lifetime` stays and keeps feeding achievements. All-time `sum` boards whose value exists in
  `lifetime` (kills, bosses, albinos, rivals, fish, zones, seconds, victories, distance) are **seeded** from it.
- `lifetime.distance` keeps its pixel unit; display converts via `PX_PER_METER` (System 3).
- Boards with no historical source (e.g. deaths by Carl) start empty and show "—" with the tooltip
  "Registreres fra version X" – **never back-filled with guesses**.
- `save.scores` seeds F21 only.
- Unknown/corrupt fields are dropped individually, as `normalizeSave` already does.

## 8. Global leaderboards (future, not in scope)

The game is a static GitHub Pages site. A real global board needs a backend, identity and anti-cheat; a
client-side game cannot prevent forged results. Recommendation: do not build one now. Instead offer a
**share card** (System 2 renders the run report to a PNG/text the player can post). If a backend is ever
added, the RunSummary JSON is the upload format and the seed + species + version make runs comparable.

## 9. UI

- Menu → "♛ Rekorder" replaces "Highscores" with two tabs (Hall of Fame / Hall of Shame) and a scope
  switch (I dag / Uge / Måned / Altid). Mobile: one column, 8 rows visible, scroll.
- Each row: icon, label, value, small run reference (art + dato). Empty: "—".
- All labels are Danish source strings run through the `tools/i18n` pipeline.

## 10. Acceptance (summary – full list in QA_ACCEPTANCE_MATRIX.md)

- Deterministic: same RunSummary sequence → identical records JSON.
- Period rollover unit-tested with injected clock (day, ISO week across new year, month).
- A run killed by Karl increments S2 exactly once and nothing else in S1–S8.
- Abandon counts in S15 and S16, not S14.
- Migrating a v2 save with lifetime data shows seeded all-time sums and "—" for unseeded boards.
- Storage after 1000 simulated runs stays under 64 KB for `records` + `titles`.
