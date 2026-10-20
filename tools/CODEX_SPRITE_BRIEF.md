# Ny art eller nye frames: kort brief til Codex

Læs kun denne side til artsanimationer. De lange `SPRITE_RULES_*.md` gælder stadig, men alt det mekaniske er
samlet i ét script, så du ikke behøver køre trinene i hånden.

## Udgangspunkt: riggen laver alle 120 frames

```
python tools/rig_to_game.py --species <id> --review /tmp/review   # render + kontrol + eksport + manifest
python tools/rebuild_generated.py && npm test
```

Arten skal stå i `RIG_SPECIES` i `PRIMAL_RUN_Game/src/core.js` (scriptet siger til, hvis den mangler). Så viser spillet
rig-animationen i stedet for stillbilledet. Arten beholder WIP-mærket, indtil Jonas har godkendt grafikken.

## Flottere grafik: tegn kun fire poser

Tegn én pose pr. retning (S, N, E, W), så farver alle 120 frames sig selv ud fra dem:

```
python tools/rig_paint_transfer.py --species <id> --templates SKABELONER   # <id>_rest_<D>.png at male oven på
python tools/rig_to_game.py --species <id> --paint MIN_MAPPE               # alle 120 frames med din maling
python tools/rebuild_generated.py && npm test
```

Mal inden for skabelonens silhuet (S/N/E er de statiske tegninger; W er sin egen render, ikke spejlet). Har du
tegnet en anden rig-pose, så angiv den: `--pattern '{sid}_walk_{d}_000.png' --ref walk:0`. Små forskydninger på
nogle få pixels rettes automatisk. Silhuet og omrids følger riggen, så hovedform og kontur skal stemme med riggen.

## Når du skal rette enkelte frames

Tegn kun det, der er bestilt (fx én tilstand i én retning), ikke hele sættet. Brug rig-framen med samme navn som
posereference og den statiske tegning i `assets/new_species/<id>_<retning>.png` som udseende.

Krav: 144×144 RGBA, kun Primal Earth 32 (`palette.json`), alpha 0/255, gennemsigtig RGB 0, hofte-anker 72,72,
mindst 2 px margen, silhuet inden for 2 px af rig-framen.

Kontrollér kun det, du har tegnet:

```
python tools/rig_animate.py --species <id>        # guide i PRIMAL_RUN_Rig/<id>/ (samme frames som i spillet)
python tools/validate_rig_frames.py --species <id> --frames DIN_MAPPE --rig PRIMAL_RUN_Rig/<id> \
       --states walk --directions E --sheet overlay.png
```

Læg derefter dine frames over de tilsvarende filer i `assets/rig_full/` og kør `rebuild_generated.py`. Kør ikke
`rig_to_game.py` for arten igen bagefter, for det overskriver dine frames med riggens. Godkendt grafik
(`approved_animation`) kræver Jonas' visuelle godkendelse. Filkontroller godkender aldrig kunst.
