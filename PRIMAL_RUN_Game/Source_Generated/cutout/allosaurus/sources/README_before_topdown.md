# Allosaurus — cutout i hvile, S/N/E/W

Leverance efter `tools/CODEX_CUTOUT_BRIEF.md` fra
`origin/claude/project-thread-klzsxf`, commit
`12ab82dd3b9ee7dd1c568c94d77f5ac92212aea7` (brief-blob
`bbed204077be0b8a7d5a1549684a7ad695d22ebc`). Arbejdsgrenen er
`codex/allosaurus-rest-cutout`, startet fra `origin/integration/next`
`daf41206967b94e2182e5caa2c11ed91e99c3689`.

## Filer til Claude

- `allosaurus_<D>_<del>.png`: 15 hele dele pr. retning, alle 144×144 RGBA.
- `allosaurus_<D>_full.png`: præcis sammensætning af delene i JSON-rækkefølgen.
- `allosaurus_parts.json`: den ønskede `species`/`directions`/`order`/`parts`-struktur.
  L/R er dyrets venstre/højre; `pivot` og `tip` er heltal på det fælles lærred.
  Body-pivot er altid `[72,72]`.

Der er kun én hvilepose pr. retning. Ingen animationsframes er fremstillet,
og cutout-riggen er ikke kørt. Claude kan bruge delene som input til sin rig.

## Tegning og registrering

Kamera/skala blev sammenholdt med `assets/new_species/allosaurus_{S,N,E,W}.png`.
`assets/player_full/baryonyx_idle_*_000.png` og `carnotaurus_idle_*_000.png`
blev læst som stil- og kamerareferencer. Disse filer er uændrede.

S/N holder bagben og fødder under torsoen. E/W viser de bøjede, smalle fugleben
under hoften. Hovedet har kileform, små parrede horn foran øjnene og lave
snudekamme. Lyset kommer fra billedets øverste venstre. W er tegnet separat;
ingen kilde eller del er spejlet eller roteret.

Alle rå tegninger er bevaret i `sources/`, inklusive fravalgte områder:

- `east_first.png`: den første samling blev forkastet som for lateral. Kun de
  hele, isolerede skinneben bruges som lokale kildeoverrides.
- `E.png`, `S.png`, `N.png`, `W.png`: retningstegninger; udvalgte hele kæber,
  ben og arme bruges. Kildearkenes sammenstillede eksempler er ikke leverancen.
- `corrections.png`: rettelser; udvalgte N-fødder og N-arme bruges.
- `limbs.png`: selvstændigt tegnede E/W-fødder, N-lår og S-skinneben.
- `continuous.png`: endelig torso/hale og hals/kranie. Sammenhængende
  kildepixels giver samlinger uden tværgående snitflader.
- `prompts.json`: de anvendte tegningsinstruktioner.

`registration.json` fastlægger hvert kildeudsnit, heltalssampling og anatomiske
landmarks. `source_sampling.json` registrerer de faktisk samplede punkter,
heltalsforskydninger og kildehashes. Der er ingen bbox-centrering eller
interpolation. Farver vælges fra spillets eksisterende Primal Earth 32-palette;
alpha tærskles ved 192, og transparent RGB nulstilles.

Torso/hale og hals/kranie udskilles fra de sammenhængende tegninger med
overlappende kildeudsnit. Ved navngivne snitplaner vælges en 3 px afrundet
ledflade blandt eksisterende kildepixels; masken fjerner kun hjørnepixels,
tegner ikke nye pixels og flytter ikke anatomien. De skjulte ledflader findes
også i PNG-delene. En samplet landmark kan flyttes højst 2 px inden for sin
egen kildeflade, så pivot/tip ligger på en opaque pixel. Alle tilsluttede pivots
ligger også i forælderens pixels.

## Kontrol og status

Kør fra repositoryets rod:

```sh
python PRIMAL_RUN_Game/Source_Generated/cutout/allosaurus/extract.py
python PRIMAL_RUN_Game/Source_Generated/cutout/allosaurus/validate.py
```

`validation_report.json` dokumenterer de tekniske kontroller. Alle 64 native
PNG'er valideres; større råkilder og kontaktark under deres egne mapper er
ikke game-eksporter. `previews/` indeholder de fire `_full.png` side om side
ved 1× og 3× på lys/mørk baggrund, samt alle dele ved 2× på begge baggrunde.

Status er `prototype_static`, `production_approved=false`,
`animation_ready=false`. Udseendet afventer Jonas' godkendelse. Filkontroller
godkender hverken anatomi, kunst eller animation. Der er ikke foretaget
runtime-test, fordi dette er en kildeleverance uden runtime-integration.

Alle ændringer ligger i denne mappe. Ingen runtime-assets, manifests,
genererede spilfiler eller spilkode er ændret. Den medfølgende `SPRITE_RULES.md`
er en uændret kopi af projektreglen; briefens konkrete 144×144-cutout-aftale
gælder denne leverance. Det krævede `allosaurus_parts.json` er delbeskrivelsen;
der er ikke ændret noget spilmanifest.
