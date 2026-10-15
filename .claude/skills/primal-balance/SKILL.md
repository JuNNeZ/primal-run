---
name: primal-balance
description: Analyze Primal Run balance by running seeded simulator comparisons.
model: opus
effort: high
---
Method: `.agents/skills/primal-balance/SKILL.md`. Play-style comparisons: `npm run simulate:quick` / `node tools/playstyle_sim.cjs` with fixed seeds on baseline and candidate; for the baseline set `PRIMAL_CORE=<baseline core.js>` (`--core` does not reach worker threads); `--exp` for simulator-only prototypes. Isolated duels/scenarios: `tools/simulate_balance.cjs`. Track win rate, death cause by boss, stages reached, DNA/run, time, stuckSeconds, species and attack styles. Identify if bots need updating for a new mechanic before interpreting results. State sample sizes, seeds, baseline commit and differences. Do not confuse bot results with human playtesting. Offer only evidence-based balance recommendations,.
