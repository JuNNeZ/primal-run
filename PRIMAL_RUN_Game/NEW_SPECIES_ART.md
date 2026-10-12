# Nye arter: statiske pladsholdertegninger (overdragelse til Codex)

Status: **prototype_static**, `production_approved: false`, `animation_ready: false`.
Spillet tegner de levende poser, kadavere, skeletter og avatarer som stillbilleder bag `FEATURES.newSpecies`
(`staticFrame` i `src/core.js`; `src/app.js` giver dem en lille gå-bevægelse). Filerne står i `manifest.json`
som `prototype_static`. Omgivelsesdyrene i `ambient/` bruges ikke (`runtime_enabled: false`).

Når Codex leverer rigtige animationer, falder spillet automatisk over på dem: sæt `animated:true` på arten i
`NEW_PLAYERS`/`NEW_NPCS` i `core.js` (som Parasaurolophus har), så bruges de normale `player_full`/`enemy_full`-frames.

Gennemsyn: `new_species_review.html` (2×, pixelated, med eksisterende arter ved siden af til sammenligning af skala).
Data: `new_species_manifest.json`. Den indeholder rolle, filer, alpha-bbox pr. retning og sha256 for hver art.

## Hvad er tegnet

Der er tegnet 16 nye arter. Hver art har én stillestående pose pr. retning. Det er **ikke** animationer, men
reference- og pladsholdertegninger, som Codex kan animere ud fra (farver, proportioner, kendetegn og skala).

| Art | Rolle | Kendetegn | Foreslået visualScale |
|---|---|---|---|
| spinosaurus | spilbar | lang krokodillesnude, højt rust/orange sejl, mørk blågrå krop, lang hale | 2 |
| allosaurus | spilbar | stor theropod, små rustfarvede hornkamme over øjnene, tan/brun med mørke bånd | 1 |
| stegosaurus | spilbar | olivengrøn firbenet, to forskudte rækker rustfarvede plader, halepig med fire pigge, lille hoved | 1 |
| therizinosaurus | spilbar | tyk mave, grå/cremefarvede fjer, lang hals, lille hoved med næb, lange segl-kløer | 1 |
| pteranodon | spilbar | flyvende pterosaur set ovenfra, lyse/grå vinger, langt næb, rustfarvet kam bagud | 1 |
| microraptor | spilbar | lille firvinget raptor, sort med blå/indigo glans | 1 |
| pachyrhinosaurus | spilbar | ceratopsid med tyk, flad, lys næseknude (intet næsehorn) og pigget nakkeskjold | 1 |
| oviraptor | spilbar | fjerklædt, tandløst næb, rund orange kam, lange arme med kløer | 1 |
| dryosaurus | vild | lille, slank tobenet planteæder, lysegrøn/tan | 1 |
| hypsilophodon | vild | lille tobenet, grønbrun med mørke striber | 1 |
| leaellynasaura | vild | meget lille, meget lang hale, store lyse øjne, grå/blå | 1 |
| protoceratops | vild | lille sandfarvet firbenet med nakkeskjold og næb, ingen horn | 1 |
| iguanodon | vild | stor oliven/grå planteæder med tommelpigge | 1 |
| psittacosaurus | vild | lille tobenet, papegøjenæb, børster på halen, brun/oliven | 1 |
| edmontosaurus | vild | stor andenæbbet hadrosaur uden kam, brun/grøn | 1 |
| archelon | vild | kæmpe grå/blågrøn havskildpadde, skjold med kamme, fire luffer | 1 |

Parasaurolophus er **ikke** tegnet, fordi den allerede findes.

Filer pr. art i `assets/new_species/`:

| Fil | Størrelse | Indhold |
|---|---|---|
| `<id>_S.png`, `<id>_N.png`, `<id>_E.png`, `<id>_W.png` | 144×144 | levende pose. S = hoved mod bunden, N = hoved op, E = hoved mod højre, W = præcis spejling af E. Hofte/krop-anker 72,72 |
| `<id>_corpse.png` | 144×144 | rådnende krop på siden, E-orientering (som `assets/corpses/<art>_decayed_E_0.png`) |
| `<id>_skeleton.png` | 144×144 | skelet i samme pose og registrering som kadaveret (som `assets/corpses/<art>_skeleton_E_0.png`) |
| `<id>_avatar.png` | 64×64 | hovedportræt forfra, origin 32,32 (som `assets/avatars/<art>_idle_000.png`) |

Kadaver og skelet er placeret, så kadaverets bbox-centrum ligger ved ca. 74,78, som de eksisterende kadaver-props.
`corpse_model_anchor` i manifestet angiver, hvor modellens hofte endte.

## Sådan er de lavet

`tools/draw_new_species.py` er deterministisk: samme kode giver byte-identiske PNG'er. Hvert dyr er én lille 3D-model
af ellipsoider (krop, hals, hale, lemmer) og flade polygonplader (sejl, plader, nakkeskjold, vinger, luffer).
Modellen tegnes med fast kamera ovenfra, hvor image_up = 0,82·y + 0,36·z. Forkortningen i N/S svarer til de
eksisterende 144×144-frames. Lyset er fast, der bruges 3× supersampling, og farverne kvantiseres til
paletramper med ordnet dither. Til sidst kommer en 1 px omrids i `#151b19`. S, E og N er separate renderinger af
samme model og har derfor ens lys. W er en spejling af E.

Regler, som også gælder Codex' endelige frames:

- Kun de 32 farver i `palette.json` (Primal Earth 32) plus fuld gennemsigtighed.
- Alpha er kun 0 eller 255. Gennemsigtige pixels har RGB 0.
- Mindst 2 px gennemsigtig margin. Det faste hofte/krop-anker ligger ved 72,72 i alle levende frames.

## Hvad Codex skal producere pr. art

Brug navngivning, tilstande, retninger og frame-antal fra `assets/player_full/` (spilbare) og
`assets/enemy_full/` (vilde). Alle frames er 144×144 RGBA med origin og body_anchor 72,72.

- Spilbare arter: `assets/player_full/<id>_<tilstand>_<retning>_<NNN>.png`, registreret i `player_full_manifest.json`.
- Vilde arter: `assets/enemy_full/<id>_<tilstand>_<retning>_<NNN>.png`, registreret i `enemy_full_manifest.json`.
- `<retning>` er `S`, `N`, `E` og `W`. `<NNN>` er nulpolstret og starter ved `000`.

| Tilstand | Frames | fps | Loop | Bemærkning |
|---|---|---|---|---|
| idle | 4 | 4 | ja | vejrtrækning/vægtskift |
| walk | 6 | 8 | ja | |
| run | 6 | 12 | ja | |
| attack | 6 | 14 | nej | kontakt-frame 3 |
| hurt | 2 | 8 | nej | |
| death | 6 | 8 | nej | sidste frame bør ligne kadaverposen |

Det giver 30 frames pr. retning og **120 frames pr. art**. Timing og kontakt-frame skal også i
`animation_manifest.json`, som for de eksisterende arter (fx `compy_attack_E`: fps 14, loop false, contact_frame 3).

Kadavere: `assets/corpses/<id>_<stadie>_<retning>_<variant>.png`. Stadiet er `decayed` eller `skeleton`,
retningen er S/N/E/W, og varianten er 0 eller 1. Det giver **16 filer pr. art** i 144×144 med origin 72,72,
registreret i `corpse_manifest.json`. Spillet slår kadavere op ad den sti og falder ellers tilbage til death-frames.

Avatarer: `assets/avatars/<id>_<tilstand>_<NNN>.png`. Tilstanden er `idle`, `eat`, `fight`, `hurt` eller `sneak`,
og der er frames `000`–`003`. Det giver **20 filer pr. art** i 64×64 med origin 32,32, registreret i `avatar_manifest.json`.

I alt er det 156 frames pr. art og 2.496 frames for alle 16 arter.

Efter eksport kører man `python tools/build_game.py`, `npm test`, `npm run validate:game-sprites`,
`npm run validate:enemy-sprites` og `npm run simulate:quick`.
Spinosaurus har allerede visualScale 2 i spillet (`STATIC_SCALE`), ligesom tyrannosaurus og deinosuchus.

## Små omgivelsesdyr (ekstra)

Disse ligger i `assets/new_species/ambient/<navn>_<frame>.png`. De er tegnet som `assets/ecology/beetle_0.png`
med hovedet mod toppen af billedet og centreret på et lille kvadratisk lærred. De bruger samme paletteregler.

| Navn | Lærred | Frames | Foreslået fps | Indhold |
|---|---|---|---|---|
| butterfly | 32×32 | 2 | 10 | vinger åbne / løftede |
| frog | 32×32 | 2 | 6 | sammenkrøben / midt i hop |
| small_mammal | 32×32 | 2 | 10 | lille spidsmuslignende pattedyr, løbecyklus |
| firefly_glow | 16×16 | 2 | 3 | lysglorie til at lægge over `assets/ecology/firefly_*`, svag / stærk |
| pterosaur_shadow | 48×48 | 2 | 4 | flad `#151b19`-silhuet af en flyvende pterosaur (glid / opslag); tegnes med lav opacitet som skygge |
| millipede | 32×32 | 2 | 8 | kæmpe tusindben, kropsbølge og benfase skifter |
| ash_ember | 12×12 | 2 | 8 | svævende glød til lava-/vulkanbaner, flimren |

## Kendte svagheder

- Det er stillestående poser. Benene står i neutral stilling, og der er ingen gangfase.
- Halvdelen af benene på tobenede arter er delvist skjult i E/W på grund af kameraets hældning.
  Det er det samme som i de eksisterende frames.
- De nye dyr er slankere og mere "rene" i formen end de eksisterende malede sprites (fx tyrannosaurus og
  triceratops, som er bredere og mere teksturerede). Se sammenligningen i `new_species_review.html`.
- De mindste arter (leaellynasaura, hypsilophodon, psittacosaurus) har få pixels til detaljer. Psittacosaurus'
  halebørster og leaellynasauras store øjne er kun lige synlige.
- Pteranodons vinger er meget lyse. Dens kadaver er en sammenfoldet vinge, og skelettet er tyndt.
- Avatarerne er enkle hoveder forfra med øjne, næsebor og tænder. De er mindre detaljerede end de eksisterende
  malede avatarer.
- Kadaver og skelet findes kun i E og kun som én variant.

## Kommandoer

```
python tools/draw_new_species.py                       # tegner alt igen + manifest + review-side
python tools/draw_new_species.py --sheet ark.png       # kontaktark (ikke versioneret)
python tools/draw_new_species.py --lineup skala.png    # E-views i spilskala ved siden af eksisterende arter
python tools/validate_new_species.py                   # teknisk kontrol, exit 1 ved fejl
```

`validate_new_species.py` kontrollerer:

- at filerne findes, og at størrelse og RGBA er korrekte;
- at kun paletten bruges, og at alpha kun er 0/255;
- at gennemsigtige pixels har RGB 0, og at margen er mindst 2 px;
- at W er en spejling af E;
- at tyngdepunktet ligger inden for spredningen af de eksisterende frames + 2 px;
- at manifestet passer (bbox, sha256), og at `assets/new_species` ikke indeholder andre filer;
- at intet i `src/*.js`, `project.json` eller `manifest.json` peger på `new_species`.

Kontrollen godkender ikke kunsten. Den er kun teknisk.
