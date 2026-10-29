# Ecology, records and balance research

## Implemented

- A dead NPC retains its original species/direction and one of two corpse poses.
  Fresh death frames become a decayed prop at7 seconds, then a skeleton when food
  expires after14–18 seconds. Skeletons persist to60–70 seconds and fade during
  the final5 seconds. The existing32-corpse cap bounds memory; bones are not food.
- Wounded ordinary animals below35% HP move at72% speed, leave temporary blood
  trails when moving, and are twice as likely to abandon pursuit after the normal
  attack grace period. Boss movement/timing is unaffected. Escaped animal healing
  remains governed by the existing10-second, distance and damage conditions.
- Seeded male/female NPC palette variations, elite warm markings and rare albino
  colours preserve anatomy and combat stats. Dimorphism currently changes colour,
  not size. Decorative sex assignment does not consume the loot random stream.
- Albino kills award extra guaranteed DNA and a queued epic mutation choice.
  Choices respect species/rank caps and pause gameplay; fully exhausted epic
  choices become8 DNA. A rare choice does not consume XP or an ordinary level.
- The persistent species book records nearby sightings, actual biomes and observed
  attack types. It is separate from the playable-species unlock list.
- Level and run summaries use actual counters: attacks/træffere, abilities,
  avoided contacts, effective damage, healing, food, DNA, distance, mutations,
  missed secrets across stages, and observed random DNA drop percentage.
  Steps are explicitly an estimate (distance/24), not footfall simulation.
  Guaranteed DNA is excluded from the random-drop percentage. Damage totals are
  net effective HP loss per gameplay step, capped at remaining HP.
- Run titles follow recorded events: six fish as Baryonyx =>Flodjæger; two bosses
  =>Boss-specialist; surviving with at most3 HP gets its actual rounded HP title.
- End-of-run scenes show the recorded fatal attacker, with bite/charge/slam
  compositions available for all nine player classes. They reuse existing
  run/attack/hurt/death frames; they are not27 bespoke drawn cinematics. Reduced
  motion shows a static scene. Buttons are available immediately; no forced wait.
- Light frame: +15% speed / +15% damage received per rank. Metabolic rush: +25%
  feeding speed / -15% stamina regeneration per rank. Existing tradeoffs remain.

NPC-versus-NPC fighting and territory-based corpse scent are deferred together.
There is no newly added scent attraction; existing scavenging is unchanged.
Living animation sheets were not altered by the corpse horn repair.
All new corpse art is prototype_static, production_approved=false.

## Reproducible balance experiments

`npm run simulate:balance -- --help`

The CLI executes the same `Game.step` as the demo. Seeded map/loot RNG, build,
permanent upgrade ranks, target, stage, policy, core SHA and outcomes are stored.
All registered playable species are discovered automatically. Add future species
through the core and normal asset pipeline, not a separate simulator species list.

```
npm run simulate:balance -- --runs 3 --seconds 180 --seed 42 --profiles baseline,offence,survival,tradeoff,mobility,species --out PRIMAL_RUN_Game/balance_runs/run_sample
npm run simulate:balance -- --runs 10 --seconds 60 --seed 42 --profiles baseline,offence,survival,tradeoff,mobility,species --mode duel --target tyrannosaurus --stage 2 --policy aggressive --out PRIMAL_RUN_Game/balance_runs/duel_sample
npm run simulate:balance -- --runs 5 --seconds 90 --seed 42 --profiles baseline,offence,survival,tradeoff,mobility,species --mode duel --target tyrannosaurus --boss true --stage 3 --policy aggressive --out PRIMAL_RUN_Game/balance_runs/boss_sample
```

These samples are162 normal run budgets,540 ordinary duels and270 boss duels.
A normal-run budget is180 simulated seconds, not a promise that all four stages
finish. Duel mode clears obstacles/terrain/food and introduces one ordinary or
boss target without population respawns. The boss stress case starts on stage4
without previously earned mutations, intentionally harder than a normal run.

Profiles are baseline, damage/attack, survival, three existing tradeoffs,
mobility/metabolism, and species-specific ranks. Starting mutations are research
scenario grants, not purchasable normal starts. DNA upgrade prices are recorded
at their actual cost; banked DNA alone grants no combat bonus. The bot chooses
ordinary level rewards using a documented small preference list in the script.

Use `--config` for `{ "builds": [{ "name":"custom", "upgrades":{"health":2},
"mutations":{"lightFrame":1} }] }`. Invalid IDs, species restrictions and rank
caps are rejected. Compare identical seeds across builds before changing balance.
Outputs: report.json (settings, full runs, Wilson95% intervals), summary.csv,
runs.jsonl (incremental recovery). Timeouts remain separate from deaths/wins.

Bots use movement input to aim, attacks, abilities and food, with cautious and
aggressive policies. They are limited greedy policies, not optimal players.
Single-target fights can be deterministic despite varied seeds. Small sample
intervals do not cover policy bias. Treat results as regression/stress evidence,
not human win rates or proof an animal is OP. See balance_runs/README.md for
current findings and prioritized follow-up tests.

## Project skills

The short `.agents/skills/primal-{sprites,assets,mechanics,balance}/SKILL.md`
recipes are routed from AGENTS.md. SPECIES_ANATOMY.md supplies the shared visual
checklist. Read the relevant recipe/family supplement instead of all historical
packs. This does not remove visual review or certify generated art automatically.
