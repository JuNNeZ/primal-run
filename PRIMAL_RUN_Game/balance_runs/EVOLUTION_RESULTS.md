# Nye balanceforsøg: fjerjæger, mutationer og terræn

**1.672 forsøg** på den aktuelle spilkerne:880 normale runs (11 arter ×8 builds ×5 seeds ×2 bot-stile) og792 isolerede bosskampe (11 ×4 builds ×3 bosser ×3 seeds ×2 bot-stile). Normalbudget150sek.; bossbudget90sek. Seeds7300–7304; boss7300–7302.

Der er 249 normale dødsfald og 631 timeouts; ingen fuldførte otte-bane-jagter inden for budgettet. En timeout tæller aldrig som sejr.

| Art | Unlock DNA | Død/5, forsigtig baseline | Bosser i150sek. | Føde | T-rex-boss baseline/3 | Tradeoff/3 |
|---|---:|---:|---:|---:|---:|---:|
|Compy|0|0|1.0|26.4|0|3|
|Utahraptor|25|1|2.0|49.4|0|3|
|Carnotaurus|55|0|2.0|58.4|3|3|
|Ankylosaurus|75|0|1.8|44.0|3|3|
|Triceratops|90|0|1.4|37.6|3|3|
|Pachycephalosaurus|35|0|1.8|38.0|0|3|
|Gallimimus|20|3|1.0|23.2|0|0|
|Baryonyx|65|0|3.0|89.2|3|3|
|Tyrannosaurus rex|120|0|1.8|39.2|3|3|
|Velociraptor|0|0|1.8|46.6|0|3|
|Deinonychus|0|0|2.0|47.2|3|3|

Deinonychus når i gennemsnit2 bosser uden baseline-dødsfald på de fem forsigtige map-seeds. Baryonyx når3 og89,2fødeværdi; fiskeri er en tydelig hurtig progressionvej. Gallimimus dør i3/5 af disse baseline-runs og taber samtlige T-rex-dueller med de afprøvede builds; det er et signal til særskilt menneskelig hit-and-run-test.

Glaskanonen2 + Tunge muskler2 + Højt stofskifte2 er stærk i korte skade-ræs: T-rex-spilleren vinder mod bossen på9,0sek. mod18,4sek. baseline. Carnotaurus går fra24,9 til9,5sek. Ulemperne er mere modtaget skade, mindre fart og dyrere evner. Vi har ikke erklæret kombinationen OP eller nerfet arter ud fra denne ene type fixture.

Utahraptorens forsigtige baseline taber T-rex-fixturen, mens gratis Deinonychus vinder. Botten spiller den nye finte mere bevidst end Utahraptorens offensive spring; dét må undersøges før ændringer af DNA-priser.

## Dækning og grænser

- Eight representative build families, not all theoretical mutation combinations.
- Granted initial mutations are research stress scenarios, not legal purchased starting mutations. DNA upgrade and species costs are recorded separately.
- Bot class expertise differs: starter flank strategy is supported, other species use a generic policy; human skill and hit-and-run can change outcomes.
- Five map seeds per normal scenario; paired comparisons share seeds.
- Isolated boss fixtures have fixed starts and deterministic attack cycles; repeated seed timings are not independent evidence of a human win rate. Wilson intervals are descriptive scenario counts only.
- No normal full-campaign victory within150sec; timeouts are not wins.
- Duel fixture strips obstacles, cover, forage/fish and reinforcements; it is not the normal eight-level campaign.

Alle report.json,summary.csv og inkrementelle runs.jsonl ligger i mapperne evolution_*. Hver række har art, seed, build, faktisk startmutations-snapshot, DNA-upgrader/pris, tid, hændelsesstatistik og resultat. Report har både core- og simulator-SHA. De ældre journey_* reports er historiske og blandes ikke ind her.

## Genskab

```sh
node tools/simulate_balance.cjs --species all --profiles baseline,offence,survival,tradeoff,mobility,species,legendary,mixed --runs 5 --seconds 150 --seed 7300 --policy cautious --out PRIMAL_RUN_Game/balance_runs/evolution_cautious
# Gentag med --policy aggressive og evolution_aggressive
node tools/simulate_evolution_duels.cjs
node tools/summarize_evolution.cjs
```
