# Rig-animator og frame-validator (værktøj til Codex)

Problemet med genererede animationer har været, at vinklen ikke er den samme i alle retninger, og at benene
glemmes. To værktøjer løser det:

- `tools/rig_animate.py` laver en **guide** for hver art: et skelet med ben, der går, i samme kamera og lys i
  S, N, E og W.
- `tools/validate_rig_frames.py` **kontrollerer** Codex' egne frames mod guiden og afviser frames, hvor benene
  står stille, kommer i forkert fase, eller hvor kamera, skala eller anker har flyttet sig.

Ingen af dem ændrer spillet. Status for rig-frames er guide/prototype. Om de må bruges direkte som spil-assets,
bestemmer Jonas.

## 1. Lav guiden

```
python tools/rig_animate.py --species iguanodon                     # -> PRIMAL_RUN_Rig/iguanodon/
python tools/rig_animate.py --species iguanodon --sheet ark.png      # kontaktark med led og fodkontakt
python tools/rig_animate.py --species iguanodon --gif gif/           # preview-GIFs (ikke assets)
python tools/rig_animate.py --species all                            # alle 16 nye arter
```

Det tager ca. 30 sekunder pr. art. Ud kommer:

| Fil | Indhold |
|---|---|
| `<id>_<tilstand>_<S\|N\|E\|W>_<NNN>.png` | 144×144 RGBA, Primal Earth 32, binær alpha, hofte/krop-anker 72,72 |
| `<id>_rig.json` | tilstande (frames, fps, loop, kontakt-frame), og pr. frame: fil, sha256, bbox, **projicerede led** og **fodkontakt** |

Tilstande og frame-antal følger `player_full`/`enemy_full`: idle 4, walk 6, run 6, attack 6 (kontakt-frame 3),
hurt 2, death 6. Det giver 30 frames pr. retning og 120 pr. art.

Sådan virker riggen:

- Modellen er den samme som de statiske tegninger i `assets/new_species` (`tools/draw_new_species.py`). Benene er
  kæder (hofte, knæ, ankel, fod), som riggen stiller med to-leds IK.
- Gang og løb bruger plantede fødder. Tobenede arter har modfase. Firbenede går i rækkefølgen venstre bag,
  venstre for, højre bag, højre for og løber i trav. Halen svinger som en bølge, og kroppen gynger.
- Pteranodon og Microraptor slår med vingerne. Archelon ror med lufferne. Grupperne står i `APPENDAGES` øverst
  i filen, og en ny art med vinger eller luffer skal have en linje dér.
- Angreb følger angrebsstilen fra `app.js`: bid, horn, hak, hale eller kløer. Kameraet ser oppefra, så angreb
  vises som udfald, halsstræk og halesving i vandret retning.
- Death ruller dyret om på siden mod kadaverposen. Vingerne foldes ind.
- Alle fire retninger renderes for sig med samme kamera (`image_up = 0,82·y + 0,36·z`) og lys fra øverst til
  venstre. W er altså ikke spejlet, men det er samme pose og vinkel som E set fra den anden side.

## 2. Tegn eller generér ud fra guiden

For hver frame bruges rig-framen med samme navn som posereference. Den statiske tegning bruges som reference
for udseende (farver, mønstre, proportioner). Reglerne:

- Silhuetten skal ligge inden for 2 px af rig-framen. Det gælder især benene, hvor fødderne skal stå, hvor
  riggen sætter dem (`joints` og `foot_contact` i JSON).
- Hofte/krop-ankeret bliver på 72,72. Kroppen må ikke glide inden for en tilstand.
- Kameraet er det samme i alle retninger. N og S har samme længde, og W er E set fra den anden side.
- Kun paletten, alpha 0/255, gennemsigtige pixels har RGB 0, og der er mindst 2 px margen.

## 3. Kontrollér

```
python tools/validate_rig_frames.py --species iguanodon --frames MIN_MAPPE --rig PRIMAL_RUN_Rig/iguanodon \
       --sheet overlay.png --report rapport.json
```

Exit 1 betyder fejl. Hver fejl nævner framen og årsagen. `overlay.png` viser frames med rig-silhuetten i rødt og
benområdet i cyan, og frames med fejl får en rød ramme. `--states walk,run` og `--directions E` begrænser
kontrollen, fx til et forsøg med én retning.

| Kontrol | Grænse | Fanger |
|---|---|---|
| Teknik | 144×144, RGBA, palette, alpha 0/255, RGB 0 under gennemsigtig, margen 2 px | forkert eksport |
| Silhuet mod rig | præcision og dækning ≥ 0,85 med 2 px slæk | forkert pose eller anatomi |
| Bbox og tyngdepunkt mod rig | centrum ≤ 3 px, størrelse ≤ 10 % (eller ≤ 3 px) | kamera, skala eller anker flyttet |
| Benområde mod rig | ≥ 0,70 med 1 px slæk | ben i en anden stilling end riggen |
| Benfase | framens ben ligner deres egen rig-frame bedst | **stillestående ben** eller forkert fase |
| Benbevægelse | ≥ 50 % af riggens bevægelse i benområdet | ben, der næsten ikke bevæger sig |
| Omridsbevægelse (walk/run) | ≥ 7 % pr. frame (riggen ligger på 14–18 %, spillets sprites på 14–35 %) | frosne ben og hale |
| Fryste frames | mindst 0,4 % ændring fra forrige frame | dubletter |
| Loop-søm | sidste til første frame ≤ 3× den normale ændring | hop i loopet |
| W mod spejlet E | ≥ 0,80 | **anden vinkel eller pose i W** |
| N mod S og W mod E | størrelse som i riggen ±10 % | **andet kamera i én retning** |
| E-længde / S-længde | som riggen ±12 % | anden kamerahældning |

Uden `--rig` køres teknik, bevægelse, loop og retningskontrol. Den statiske tegning bruges så som reference for
proportionerne, og kroppen må højst flytte sig 4 px inden for idle/walk/run. Uden rig kan den ikke se ben, der
står stille under en krop eller hale, der bevæger sig. Brug derfor altid `--rig`, når der findes en.

Kontrollen er teknisk og godkender ikke kunsten.

## 4. Ind i spillet

Eksportér til `assets/player_full` (spilbare) eller `assets/enemy_full` (vilde) med navne og manifester som i
`PRIMAL_RUN_Game/NEW_SPECIES_ART.md`. Sæt `animated:true` på arten i `NEW_PLAYERS`/`NEW_NPCS` i `src/core.js`,
og kør `python tools/rebuild_generated.py`, `npm test`, `npm run validate:game-sprites` og
`npm run validate:enemy-sprites`.

## Afprøvet

- Iguanodon i alle 120 frames: riggen består sin egen kontrol med og uden `--rig`.
- Ødelagte kopier fanges med `--rig`. Når alle walk/run-frames er kopier af frame 0, giver det 114 fejl. Når kun
  benene står stille, mens krop og hale bevæger sig, giver det 65 fejl. W tegnet 15 % større giver 87 fejl, og S
  med fladere kamera giver 66 fejl.
- Codex' Iguanodon-forsøg (walk E, 6 frames) fejler på omridsbevægelse. Det flytter sig 4,1 % pr. frame, hvor
  grænsen er 7 % og riggen ligger på 14 %.
- `tests/rig-animator.test.cjs` gentager de vigtigste dele i `npm test`.
