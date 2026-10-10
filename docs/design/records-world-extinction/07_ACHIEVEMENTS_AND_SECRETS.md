# System 6 – Hidden achievements, secret collectibles and the extinction level

Status: **New work**, extends (never replaces) the 17 existing achievements:
firstBlood, firstBoss, albinoHunter, critMaster, grazer, explorer, hundredKills, closeCall, untouchable,
rivalSlayer, survivor, marathon, fisherKing, riverMaw, gentleGiant, apex, threeDiets.

## 1. Achievement model additions

New optional fields on `ACHIEVEMENTS` entries (existing entries unchanged):

- `hidden: true` – listed as "???" with a one-line hint until earned.
- `secret: true` – not listed at all until earned (counts toward a separate "Hemmeligheder x/y").
- `rarity` – same scale as titles; drives the toast colour.
- `requires` – feature flag (`'B2'`, `'records'`, `'amber'`…) so an achievement never shows before its system exists.

Checks keep using `checkAchievements(flags)` with `c.run`, `c.life`, `c.save`, `c.flags`.

## 2. New achievements (exact conditions)

| ID | Name (da / en) | Visibility | Condition | Needs |
|---|---|---|---|---|
| amberFirst | Fanget i Tiden / Caught in Time | hidden | first amber piece ever (`life.amber ≥ 1`) | amber |
| amberAll | Ravets Vogter / Keeper of Amber | hidden | 8 amber in one run | amber |
| lastSky | Under den Sidste Himmel / Under the Last Sky | secret | enter the extinction level | §4 |
| survivors | De Blev til Fugle / They Became Birds | secret | reach the refuge in the extinction level | §4 |
| rivalSweep | Ingen Rivaler Tilbage / No Rivals Left | hidden | kill every rival in a full run (see §3.2) | rival guarantee |
| littleKing | Lille men Farlig / Small but Deadly | hidden | win the normal ending as Compsognathus | – |
| kingUntouched | Kongen Rørte Dig Aldrig / The King Never Touched You | hidden | beat Ragnar with `untouchable` true for that fight | – |
| whiteHerd | Hvid Flok / White Herd | hidden | 3 albinos in one run | – |
| fireWalker | Ildgænger / Fire Walker | hidden | ≥ 20 s in lava during one run **and** clear level 7 | records (lavaSeconds) |
| revenge | Hævn / Revenge | hidden | kill the boss that killed you in your previous run, in the next run | records (deathCause persisted) |
| bossTourist | Turist i Helvede / Tourist in Hell | secret | lifetime: died to each of the 8 level bosses at least once | records |
| quickHunt | Lynjagt / Lightning Hunt | hidden | win in under N minutes (N set from bot data, see §6) | – |
| pacifistWay | Fredens Vej / Way of Peace | hidden | reach level 4 having killed nothing except level bosses | records |
| fullCodex | Hele Artsbogen / The Whole Field Guide | hidden | every species observed in the field guide | – (uses `save.fieldGuide`) |
| nightOwl | Natugle / Night Owl | hidden | 15 kills at night in one run | Part B2 |
| packAlpha | Flokkens Alfa / Pack Alpha | hidden | win with 2 raptor allies alive | Part B5 |
| allChallenges | Alt på Spil / All In | secret | win with every B6 challenge active | Part B6 |

Rewards: hidden ones give 10–25 DNA like existing ones; `amberAll` unlocks the **amber skin** (cosmetic
palette swap, every species); `survivors` unlocks a title and the ending in the gallery.

Scope: amber, rivals-for-route-B and level 9 exist only in the 8-level **journey** campaign. The classic campaign
(4 levels) and the secret seed 1993 (one level, boss "Mathias") keep their current rules and normal victory.

## 3. Secret collectibles: amber (rav)

### 3.1 Placement (deterministic, per level)

- Exactly **one amber piece per level** (8 per run), seeded from the level seed.
- Candidate cells: walker-reachable (System 4 nav BFS from the start), ≥ 900 px from the start position,
  ≥ 300 px from the boss arena, ≥ 120 px from any site/event, not in water/lava/cliff-adjacent cells.
- Prefer the **zone farthest from the start** (by path length); inside it, pick the candidate with the most
  Solid/Soft obstacles within 150 px (tucked away, not in the open).
- If no candidate exists (generator failure) → place in the farthest reachable cell and log a dev warning.
  The unit test in §6 must show this never happens over 500 seeds.

### 3.2 Rival guarantee (needed for route B)

Audit (`probes/audit_probes.cjs`, 200 seeds × 8 levels): **33 of 1 600 levels had no rival** – 15 on level 3
and 18 on level 4 (the river biome) – so only **169 / 200 runs** could ever kill all eight. Before route B ships,
`spawnRival()` gets a fallback. Today it filters `map.habitats` by: not water, > 900 px from the start,
`suitableHabitat(stage, map, kind, h)`, ≥ 70 px from rocks and ≥ 260 px from sites, and returns `null` if
nothing is left. Fallback order: (1) site clearance 260 → 160 px, (2) distance 900 → 600 px in 100 px steps,
(3) drop `suitableHabitat` but keep "not water", (4) any walker-reachable nav cell ≥ 600 px from the start.
Unit test: 0 missing rivals over 500 seeds × 8 levels.

### 3.3 Discovery and feedback

- A faint amber glint every 4 s (visible only within 260 px), a soft chime within 160 px.
- Pick up with the existing explore key (E) → +3 DNA, toast "RAV FUNDET · 3/8", field-guide entry with the
  trapped insect. HUD shows an amber counter only after the first ever pickup.
- Minimap never shows amber.

## 4. The extinction level – "Den Sidste Himmel" (level 9, optional)

### 4.1 Unlock routes (either one, checked when Ragnar dies)

| Route | Condition in that run | Why it is achievable |
|---|---|---|
| A – Amber | ≥ 6 of 8 amber pieces | one per level, always reachable (§3.1 test) |
| B – Rivals | every rival of the run killed (8/8 after §3.2) | rivals always spawn after the fix |
| C (optional, later) | win with ≥ 2 B6 challenges | depends on Part B6 |

### 4.2 Flow and the normal ending

1. Ragnar dies → victory is **banked immediately** (score, DNA, records, `victory = true`). The normal ending
   is never lost.
2. If no route is met → normal ending (System 7 storyboard, version N) → run report.
3. If a route is met → storyboard version S plays to the impact, then a choice card:
   **"Fortsæt ind i asken"** / **"Afslut jagten"** (defaults to continue after 8 s; Space excluded as today).
4. Level 9 result: dying there does not undo the victory; the run report shows "Sejr + Den Sidste Himmel".
   Reaching the refuge → secret ending (System 7 §3) and achievement `survivors`.

### 4.3 Level design

- Biome: the level-8 valley **after impact**, reusing stage 3 assets with a darkened palette (palette swap,
  not new art, for v1): ash ground, burning trees (fire overlay particles), red sky glow.
- Goal: reach the **refuge** (a burrow under a rock overhang) placed ≥ 2 400 px away by path; survive the trip.
- Hazards (all telegraphed ≥ 0.6 s, none hit-scan):
  - **Falling debris:** shadow circle grows for 0.9 s, then impact (damage 12, small crater decal).
    Density ramps from 1 per 3 s to 1 per 1.2 s over 3 minutes.
  - **Fire spread:** burning trees ignite neighbours every 6 s; fire tiles behave like lava for damage (4/0.5 s)
    but are visible and slow-spreading.
  - **Darkness:** light radius 320 px around the player, shrinking to 220 px; ash fall reduces visibility of
    distant animals (they still exist).
  - **Collapse:** ground cracks (class 1 Solid, then lava after 5 s) open along seeded lines, at most 3, always
    leaving a path (BFS check each time).
- Animals: few, panicked (flee mode, ignore the player unless cornered); no boss. Optional mini-event: a
  starving Karl-variant rival blocks one route (fight or detour).
- Length target: 3–5 minutes.

### 4.4 Achievability tests

- 500 seeds: refuge reachable at start and after every collapse event (BFS).
- Explorer bot (sim) reaching level 8: ≥ 6 amber in 30–60 % of runs (tune the glint radius if outside).
- Optimizer bot: route B success rate reported; if < 5 % for completers, consider "≥ 7 of 8 rivals".
- Debris: an idle player is hit at most once per 4 s on average (dodgeable density).

## 5. UI and localisation

- Achievement screen: three groups – Bedrifter, Skjulte (???), Hemmeligheder (count only).
- All names/hints are Danish source strings through `tools/i18n` (da/en/de/sv/no/ja/zh).

## 6. Tuning that must come from data (not guessed)

- `quickHunt` N: set to the 10th percentile of winning-run time for the optimizer bot, rounded up to a whole minute.
- Route A threshold (6/8) and glint radius: from explorer-bot results.
- Debris density: from the idle/human-like bot damage rate.
