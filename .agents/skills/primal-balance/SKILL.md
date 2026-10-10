---
name: primal-balance
description: Run reproducible bot experiments against the actual gameplay core.
---

# primal-balance

Use npm run simulate:balance -- --help and tools/simulate_balance.cjs. It calls the real Game.step; never duplicate combat formulas.
Specify seed, species, profile/build, upgrades, mode, duration, policy and target/stage. Keep all settings in outputs with core SHA.
Run mode uses normal map, AI and progression. Duel mode is an isolated enemy encounter with documented fixture changes. Neither is a human win-rate benchmark.
Starting mutations are research grants; permanent DNA upgrades use actual levels/prices. Banked DNA alone does not strengthen a dinosaur.
Compare identical seeds/scenarios across builds, multiple policies and enemy tiers. Separate deaths, wins and timeouts, use confidence intervals and sample counts.
Do not label something OP from an easy target where all bots win. Report survival, time, food/DNA/kill rates and uncertainty.
Keep report.json, summary.csv and incremental runs.jsonl under balance_runs. Document reproduction commands and caveats. Regenerate samples after core changes or mark their source SHA stale.
New species must be added to the core registries and asset rules; the simulator discovers PLAYER_SPECIES rather than a second hard-coded species list.
