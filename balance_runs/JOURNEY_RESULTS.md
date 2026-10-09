# Balance checkpoint: ottebaners ruten

Core SHA-256: `e06fe7e292490fd6abb534e7be7ce705fa10f7bc224af4019a5c347db14b35ef`.

240 nye boteksperimenter:90 normale runs (180s budget) og150 isolerede T. rex-bossdueller (90s budget). Ti arter × baseline/tradeoff/artsprofil; seeds42–44 for runs og42–46 for dueller. Cautious policy i runs, aggressive i dueller. Alle bruger den rigtige Game.step. Startmutationer er research-grants, ikke normale gratis start-builds. DNA-upgrades og artspriser registreres separat.

| Art | Run dødsfald /3 | Mean bosser | Mean føde | Boss baseline wins /5 | Boss baseline tid(s) | Tradeoff wins /5 | Tradeoff tid(s) |
|---|---:|---:|---:|---:|---:|---:|---:|
|compy|1|0.67|27.7|0|21.3|0|9.6|
|utahraptor|1|2.00|50.3|5|24.9|5|10.8|
|carnotaurus|0|2.33|63.0|0|16.3|5|9.5|
|ankylosaurus|0|2.33|63.0|5|30.6|5|14.6|
|triceratops|0|2.00|56.7|0|27.6|5|10.8|
|pachycephalosaurus|0|2.33|53.7|0|16.3|5|12.1|
|gallimimus|1|0.67|24.0|0|9.6|0|9.5|
|baryonyx|0|3.33|94.0|5|23.2|5|9.6|
|tyrannosaurus|0|1.67|44.7|5|20.0|5|7.8|
|velociraptor|0|1.67|42.0|0|18.5|5|10.9|

## Fortolkning

Ingen normale bots nåede hele8-bossruten inden180s; timeouts tælles ikke som sejre. Baryonyx nåede flest bosser i baselineprøven. Compy, Utahraptor og Gallimimus havde hver1/3 dødsfald; flere af de tungere arter overlevede alle tre budgetter. Velociraptor fungerer som starter i denne lille prøve, men menneskelig spiltest mangler.

Tradeoff-buildet kombinerer glassCannon2, heavyMuscle2, overclock2 og digestion2: stor skadebonus, højere modtaget skade, mindre fart og dyrere stamina. T. rex går fra cirka20s til8s i den isolerede bosskamp; Carno/Pachy/Veloci skifter fra0/5 til5/5 i samme aggressive fixture. Det peger på en stærk kombination af angrebshastighed og skade, som bør testes videre mod grupper/terræn og under samme menneskelige strategi.

Det beviser ikke OP: få seeds, én fjende, fjernet terræn i dueller, forskellig unlockpris og kunstigt tildelte mutationer. De samme faste dueltimings kan give identiske udfald på alle seeds. Wilson-intervaller ligger i report.json, men dækker ikke bot-strategiens bias. Legendary builds er ikke dækket af disse tre profiler. Undgå endnu en vilkårlig nerf, før Mathias og menneskelige runs har testet den nye pacing.

## Reproduktion

```bash
npm run simulate:balance -- --runs 3 --seconds 180 --species all --profiles baseline,tradeoff,species --mode run --policy cautious --seed 42 --out /tmp/primal-journey-runs
npm run simulate:balance -- --runs 5 --seconds 90 --species all --profiles baseline,tradeoff,species --mode duel --policy aggressive --target tyrannosaurus --stage 3 --boss true --seed 42 --out /tmp/primal-journey-boss
```

Resultater: journey_runs/{report.json,summary.csv,runs.jsonl} og journey_boss/{report.json,summary.csv,runs.jsonl}. --stage betyder startbiome0–3; normale runs springer til første relevante bane. Isolerede dueller bruger den deklarerede gamle4-biomefixture, også ved seed1993. Secret-runs er én bane og kan ikke starte i en anden biome. Ældre972 eksperimenter i denne mappe er bevarede historiske checkpoints; bland ikke deres normal-runs med den nye8-bossrute.
