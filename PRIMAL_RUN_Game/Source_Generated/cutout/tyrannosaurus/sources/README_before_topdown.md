# Tyrannosaurus — cutout-hvilepose S/N/E/W

**Status: `prototype_static`, visuelt ikke godkendt.** Der er ikke foretaget
runtime-integration eller givet kunst-/animationsgodkendelse.

Gren: `codex/tyrannosaurus-cutout`, fra `claude/project-thread-klzsxf`
`1eb6680f33721f6d6fa88bb05c06e4ad94b04a7e`. Den læste brief følger med som
`BRIEF.md`; `source_context.json` registrerer brief-blob og referencehashes.

## Leverance

- 15 hele dele i hver retning: `body`, `neck`, `head`, `jaw`, `tail1..3`,
  `thigh_L/R`, `shin_L/R`, `foot_L/R`, `arm_L/R`.
- 60 native PNG-dele samt fire `tyrannosaurus_<D>_full.png`, alle 144×144 RGBA.
- `tyrannosaurus_parts.json` med hierarki, anatomiske L/R-navne, rækkefølge,
  heltalspunkter og body-pivot `[72,72]` i alle retninger.
- Råkilder, reproducerbar udskæring og teknisk rapport i samme mappe.
- Lys/mørke kontaktark ved 1×/3×, alle dele ved 2×, GIF-kontaktark og de
  12 gang-/løbe-/angrebs-GIF'er under `previews/`.

`_full.png` er den pixelidentiske sammensætning af delene i JSON-rækkefølgen,
før riggen tilføjer sit omrids. Selve delene har ingen sort eller mørkegrøn
kontur. Den medfølgende projektregel er uændret; den nyere briefs konkrete
aftale om 144×144-cutouts uden omrids gælder denne leverance.

## Skabelon, anatomi og kilder

Startkommandoen var:

```sh
python tools/cutout_rig.py --species allosaurus --template /tmp/tyrannosaurus-SKABELON
```

Skabelonfilerne blev kopieret med `tyrannosaurus_*`-navne. Den oprindelige
skabelon er bevaret under `sources/template/`. Den giver struktur og
bevægelsesreference; den er ikke en T-rex-model. Kæben er tilføjet som separat
del med `head` som forælder, understøttet af riggens skelet.

Farve-/størrelsesreferencerne er de eksisterende
`assets/enemy_full/tyrannosaurus_idle_{S,N,E,W}_000.png`. Filhashes, lærreder
og synlige bounding boxes er registreret i `source_context.json`. Den smallere
E/W-benhøjde følger den rettede placering under kroppen frem for gamle
spredte ben. Kobber/rødbrun hud, mørke tværstriber og lys fra øverste venstre
bevares. Hoften er registreret anatomisk, ikke ved bbox-centrering.

Tegningerne har bredt, dybt kassekranie, kraftig underkæbe, tykke tænder,
små ru knuder over øjnene, tyk hals, tunge lår og små to-finger-arme. Der er
ingen Allosaurus-horn. S/N-benkæderne står under torsoen, og tæerne er synlige.
E-L og W-R er de fjerne ben; deres hele tegnede overflader findes i PNG'erne.
W er selvstændigt tegnet med korrekt lys, ikke spejlet fra E.

`sources/core.png` indeholder sammenhængende torso/hale og hals/kranie.
`S.png`, `N.png`, `E.png`, `W.png` indeholder hele ben og arme.
`corrections.png` erstatter de første forkert vendte N-lår og kæber med
korrekt orienterede kilder. Fravalgte celler i de bevarede ark bruges ikke.
Prompts følger med i `sources/prompts.json`.

`registration.json` indeholder eksplicitte kildeudsnit, heltalssampling og
anatomiske landmarks. `source_sampling.json` registrerer de faktisk samplede
punkter, forskydninger og SHA-256. Udskæringen bruger ingen spejling,
rotation, interpolation eller tegning af nye kropsflader. Sammenhængende
kildeudsnit overlapper ved leddene; en 3 px afrundet udskæringsmaske vælger
eksisterende kildepixels ved navngivne snitplaner. Palettekvantisering og
alpha-tærskel 192 giver Primal Earth 32, binær alpha og transparent RGB=0.
Udvendigt kildeblæk (`#151b19`/`#28372a`) fjernes også ved blotlagte snit,
mens indvendige skygger/striber bevares. Riggen ejer det færdige omrids.

## Rig-kontrol og gennemgang

```sh
python PRIMAL_RUN_Game/Source_Generated/cutout/tyrannosaurus/extract.py
python tools/cutout_rig.py --species tyrannosaurus --parts PRIMAL_RUN_Game/Source_Generated/cutout/tyrannosaurus --out /tmp/frames --gif /tmp/gif
python PRIMAL_RUN_Game/Source_Generated/cutout/tyrannosaurus/review.py
```

Riggen genererer 120 testframes og 24 GIF-sekvenser fra hvileposen med lånt
Allosaurus-bevægelse. Frames forbliver i `/tmp/frames`; der er ikke tegnet
animationsposer eller kopieret frames til runtime-assets. Døden er riggens
2D-krumning, ikke en ny tegnet dødsserie.

GIF'erne er gennemgået via samtlige frames i kontaktarkene. Undervejs blev
N-benstilling, fodsynlighed, arm-/kæbetilslutninger og ankeloverlap rettet.
Seneste gennemgang af gang/løb/angreb viser sammenhængende ledflader uden
synlige huller. Alle forælder/barn-par har pixeloverlap i disse 72 frames;
ingen af de 120 frames er klippet ved lærredskanten.

`validation_report.json` dokumenterer palette, alpha, native lærreder,
fravær af udvendigt blæk, alle opaque pivot/tip-punkter, tilslutning til
forældre, synlige S/N-fødder, pixelidentisk lag-sammensætning, kilder,
GIF-frametider og den beregnede motion gain. Tekniske PASS-resultater
godkender ikke kunsten eller animationen. Status forbliver ikke godkendt.

Kun denne mappe leveres. Spilkode, værktøjer, eksisterende assets, manifests
og genererede spilfiler er ikke ændret.
