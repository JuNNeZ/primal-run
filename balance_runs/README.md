# Nye målinger

[Aktuel rute:240 nye boteksperimenter](JOURNEY_RESULTS.md).

# Historical bot samples before the water-placement fix

These samples predate WATER_AND_BARYONYX_FIX.md. Their recorded source SHA is
retained; rerun the CLI to evaluate the changed food/water distribution.

Core SHA-256: `a1028c82077ba94365c8129921bc2a96288f0100c212fe7bd76b773c569492fb`. Commands/settings: ../RESEARCH_AND_ECOLOGY.md.

972 experiments:162 normal run budgets +540 ordinary duels +270 boss duels.
No human win-rate claims. Normal runs have a180-second budget; no full-run
victories within this budget. Boss fixtures are stage4 without earlier
earned mutations. Same single target can produce identical outcomes across seeds.

| Species | Normal baseline deaths /3 | Normal mean bosses | Normal mean food | Boss baseline wins /5 | Boss mean time(s) |
|---|---:|---:|---:|---:|---:|
| compy | 1 | 0.67 | 42.7 | 0 | 21.27 |
| utahraptor | 0 | 1.00 | 62.7 | 5 | 24.93 |
| carnotaurus | 0 | 1.00 | 70.3 | 0 | 16.26 |
| ankylosaurus | 0 | 1.33 | 69.7 | 5 | 30.58 |
| triceratops | 0 | 1.00 | 72.3 | 0 | 27.59 |
| pachycephalosaurus | 1 | 1.00 | 64.3 | 0 | 16.29 |
| gallimimus | 3 | 0.33 | 30.0 | 0 | 9.57 |
| baryonyx | 0 | 1.67 | 94.7 | 5 | 23.19 |
| tyrannosaurus | 0 | 0.67 | 33.3 | 5 | 20.00 |

- run_sample: 33 death, 129 timeout.

- duel_sample: 530 duel_win, 10 death.

- boss_sample: 110 death, 160 duel_win.

## Findings and next comparisons

1. Ordinary single-target fights are mostly easy for the bots; do not use their
   near-perfect win rate as evidence all classes are equally strong. Compare
   time-to-kill, damage taken and attacks as well as outcome.
2. The stage4 aggressive boss fixture separates classes/builds. Compy, Carno,
   Triceratops, Pachy and Gallimimus baseline die; Utahraptor, Anky, Baryonyx and
   T. rex baseline win. This stresses tanking/positioning and is not a normal
   stage4 arrival. Test cautious policy and realistically earned builds next.
3. Normal maps test food acquisition and biome movement; herbivore and fishing
   bots are imperfect. Check actual playtests before adjusting their DNA prices.
4. Increase normal seed samples and duration, test both policies, compare
   individual mutation ranks against the same baseline, and test legendary
   combinations explicitly before labelling a combination OP.
5. Corpse source/animation anatomy is a separate visual gate. None of these
   bot metrics certify sprite consistency.

All report.json settings, builds, sample counts and Wilson intervals are kept.
summary.csv is suitable for spreadsheets; runs.jsonl preserves each completed
sample even if a longer experiment is interrupted.
