# Follow-up balance — 2026-10-10

These are automated heuristic playstyles, not human playtest measurements. Six styles and two seeds cover 144 distinct species/style/seed combinations with a 180-second budget. Repeated verification runs are not additional independent observations. No complete level-8 run was observed within this budget; this is not a full-run win-rate estimate.

The paired seed-1000 comparison uses the same eleven pre-existing species and six styles (66 cases). Before: 283 epic choices, median DNA 104.5, 19 deaths, median first mutation 17.046 seconds. After: 23 epic choices, median DNA 35.5, 25 deaths, median first mutation 13.579 seconds. Multiple mechanics changed together, so these differences cannot be attributed to one isolated balance adjustment. In particular, removal of repeated rewards intentionally removes inflated income.

Deinonychus verification: 12 cases (six styles × two seeds), seven deaths, maximum level 3. Optimizer first mutation 12.218–12.935 seconds; first boss spawn 30.504–37.072; first boss kill 43.721–58.857. Newbie reached first boss at 43.907 or 162.357 seconds and killed only one. This variation argues for retaining multiple playstyles, not tuning only for the optimizer. No legendary mutation occurred in these twelve cases; its multiplier is covered by the unit regression test rather than these runs.

Recommended next research: longer runs, more independent seeds, per-boss death attribution, and separate experiments for DNA starts, mutation tradeoffs, nesting and packs. Existing species killer counts cannot identify boss deaths reliably. These data do not establish that any species is OP. Do not change DNA prices from this small sample alone.

Raw runs, CSV, compact summary and reports are retained in balance_runs/2026-10-10-followup-* and balance_runs/2026-10-10-deinonychus-verified. Earlier intermediate samples are preserved and identified by their metadata; they are not the final gameplay build.
