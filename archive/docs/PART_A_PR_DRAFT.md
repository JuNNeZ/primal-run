# Del A: sammenhængende artsangreb, dyreadfærd og vandgrafik

Spilleren og NPC’er får artsrigtige angreb og tydeligere naturlige/sårede poses,
mens vandet bruger overgangstiles frem for brede linjestreger. Ankylosaurus’
24 gamle halesving genbruges byte-identisk; Parasaurolophus’ 24 revision2-spark
aktiveres uden at erstatte de oprindelige levende assets.

Pakken tilføjer 288 ecology-frames for ni arter, 312 injured-walk-frames for
13 arter, 48 vandtiles og 32 Velociraptor-/Utahraptor-ådsler/skeletter.
Injury indeholder 88 tegnede keyposes og 224 native frames, heraf 16 eksplicitte
fallbacks for afviste poses. Ecology-grooming har senest 276 aktive tegnede poses/12
native fallbacks. Alle gamle 160 corpse-poses er uændrede.
632 tidligere behavior-studieframes er runtime-deaktiveret. Kilder, forkastede
forsøg, anchors, hashes og native previews er bevaret i repositoryet.

Validation: slutpakken består 141 unit-tests, 22 browser-suiter og tre kit-kontroller.
Log og samlet rapport: docs/validation/part-a-final-test.log og
PART_A_FINAL_VERIFICATION.json. De 312 injury-PNG’er består palette/alpha/kildegenudtræk og
byte-identisk genbrug; vandets rettede hjørner består deres tekniske gate.
Dette erstatter ikke anatomi-review eller faktisk GDJS-validering; den aktuelle
GDevelop-eksport er ikke kørt. Alle assets forbliver unapproved prototypes.
Ingen nye balancekonklusioner udledes af præsentationsændringerne.

Review: `part_a_review.html`, `native_behavior_review.html`, `injured_walk_review.html` samt de native
light/dark-grids under `PRIMAL_RUN_Game/previews/`. A6 er valgfri og fortsat åben.

Sourcebranch: `codex/sprites-and-mechanics`. PR-base: `claude/overhaul`.
Ingen gh-pages-publicering. PR-oprettelse afventer GitHub API-netværksadgang;
se `docs/GITHUB_API_ACCESS.md`. CI-link tilføjes først til den relevante commits
faktiske resultater.
