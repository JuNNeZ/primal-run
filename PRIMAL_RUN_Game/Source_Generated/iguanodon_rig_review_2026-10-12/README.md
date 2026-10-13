# Iguanodon · rig-animation review · 2026-10-12

**Rig-validator PASS: 120/120 frames, 0 fejl, 0 advarsler. Samlet kravstatus: FAIL.**
Den strenge 2-pixelkonturkontrol fejler i 115 frames. Kunstnerisk status: prototype, ikke godkendt.

Branch: `codex/iguanodon-rig-anim-2026-10-12`, fra Claude-base `a9a0293811bd8a2f354175a9bad7811dd341ff6c`.
Ingen integration, asset-ændringer, hovedmanifest-ændringer, merge eller udgivelse.

Åbn `iguanodon_animation_review_standalone.html`. PNG-atlas, guide-atlas, overlay og metadata er indbygget;
den behøver ingen separate asset-filer. `walk_light_preview.gif` viser alle fire retninger samtidig.
Alle seks tilstande har GIFs og native lys/mørk kontaktark. HTML stopper ikke-loopende tilstande ved sidste frame;
GIFs gentager disse til review. `review_atlas.png` indeholder alle 120 sprites. Guide-atlasset er tydeligt reference,
og ingen rig-frames er afleveret som spilgrafik.

## Generering og rettelser

| Tilstand | Frames pr. retning | I alt |
|---|---:|---:|
| idle | 4 | 16 |
| walk | 6 | 24 |
| run | 6 | 24 |
| attack | 6 | 24 |
| hurt | 2 | 8 |
| death | 6 | 24 |

Alle 120 er ny imagegen-grafik med matchende navngivne rig-frames som reference. W er genereret separat.
Walk blev først lavet framevis og bestod 24/24. De øvrige tilstande blev først genereret som 20 kontaktark.
Det gav 179 validatorfejl; den rapport og overlay er bevaret som `initial_full_report.*`.
66 forskellige kropsframes blev derefter tegnet om enkeltvis efter deres egne guider. De sidste 30 oprindelige
kontaktark-frames blev bevaret. 24 walk-frames fik lokale hovedrettelser, hvor alle pixels uden for de deklarerede
hovedvinduer er identiske med deres eksisterende krop/ben/hale. I alt er 90 af de 120 afleverede frames rettet.
De første lokale hovedrettelser gav seks nye fejl i fem frames; `head_patch_rejected_*` dokumenterer dem.
Disse fem hovedkilder blev tegnet om igen. Endelig validator exit-kode er 0, uden ændring af værktøjer/grænser.

`generation_log.json` og `head_generation_log.json` indeholder prompts, referencer og bevarede råkilder.
`export_provenance.json` og `head_patch_provenance.json` indeholder kilde-SHA256, sampling, eksplicitte vinduer
og de genbrugte kroppes SHA256. Afviste PNG-eksporter er bevaret under `revisions/`.
`source_inventory.json` dokumenterer alle råkilder og inputbilleder. `delivery_checks.json` har optælling og hashkontrol.

## Det, der stadig ikke er færdigt visuelt

Brugerens bogstavelige krav om højst 2 pixels konturafvigelse er IKKE opfyldt i denne levering.
En ekstra symmetrisk, euklidisk afstandskontrol mellem native silhuetgrænser finder 115/120 frames med en
konturafstand over 2 pixels; maksimum er 9,220 pixels. `strict_contour_diagnostic.json` viser hver frame,
og `strict_contour_overlay.png` markerer afvigelserne og fejlende frames. Dette er ikke et nyt acceptkrav:
det undersøger det allerede stillede 2-pixelkrav mere bogstaveligt end den uændrede validator.
Validatorens silhuettest kræver kun 85 % præcision/dækning med 2-pixels slæk, og tillader dermed resterende
konturafvigelser. Bbox-/skalagrænserne tillader også mindre størrelsesforskelle. PASS fra værktøjet beviser
derfor ikke, at alle konturpunkter er inden for 2 pixels. Denne forskel skal løses i en ny genereringspassering;
kravet og værktøjerne er ikke svækket. Det nuværende imagegen-/heltalssamplingforløb holder ikke konturen
præcist nok. Hverken rå rig-pixels, maske til riggen eller fit-to-rig er brugt til at skjule afvigelser.

Brugerens kritik af det ormelignende ansigt var berettiget. Walk har nu et kortere, lyst næb, tydeligere kind/kranie
og færre kropsbånd på hovedet, især i W. `head_before_after_2x.png` viser den reelle forskel.
S/N-hovederne er stadig smalle, og nogle af de fem omtegnede hoveder er mere spidse end de øvrige.
Det forbedrede hoveddesign er ikke konsekvent gennemført i alle de andre tilstande.
Kropsbånd, skæl og lysstyrke varierer mellem individuelle imagegen-frames; det kan give teksturflimmer,
selv når benfase, konturbevægelse og loop består. Derfor kaldes dette ikke en færdig, smooth spilanimation.

Riggens egen snævre hovedsilhuet begrænser anatomiske ændringer inden for brugerens 2-pixelkrav.
En større korrektion af kranium, kinder og næb kræver en særskilt revision af rig/anatomireferencen før endnu en
fuld kunstnerisk passering. De beskyttede rig-/validatorværktøjer er ikke ændret her.
Til næste iteration bør et kranium i S/N/E/W vurderes først, og ét fast materiale/UV-mønster følge den godkendte
rig gennem alle poses; enkeltstående imagegen-genmaling er ikke stabil nok til låste kropsmarkeringer.

## Reproduktion

Fra repository-roden, med Pythonkrav installeret:

```sh
python tools/rig_animate.py --species iguanodon --sheet PRIMAL_RUN_Rig/iguanodon_sheet.png --gif PRIMAL_RUN_Rig/gif
python tools/export_iguanodon_rig_review.py --revision 1
python tools/export_iguanodon_rig_review.py --revision 2
python tools/export_iguanodon_rig_review.py --revision 3
python tools/export_iguanodon_head_patches.py
python tools/validate_rig_frames.py --species iguanodon --frames PRIMAL_RUN_Game/Source_Generated/iguanodon_rig_review_2026-10-12 --rig PRIMAL_RUN_Rig/iguanodon --sheet PRIMAL_RUN_Game/Source_Generated/iguanodon_rig_review_2026-10-12/overlay.png --report PRIMAL_RUN_Game/Source_Generated/iguanodon_rig_review_2026-10-12/report.json
python tools/check_iguanodon_review.py
python tools/build_iguanodon_review.py
```

Eksport: 144×144 RGBA, fixed32, binær alpha ved 192, RGB 0 under transparent, origin 72,72, heltalssampling.
Ingen glatning, spejling, bbox-centrering, fit-to-rig eller rig-maskering. Den deklarerede enkeltkildeplan håndterer
imagegens faktiske 1254×1254-output med 9-pixelsampling og transparent ydre padding; kontaktark bruger 3-pixelsampling.
Se provenance for præcise kildekoordinater. De ekstra hovedvinduer er mekanisk udtræk af ny imagegen-tegning.

`protected_hashes.json` bekræfter uændrede animator-, validator-, model- og rig-JSON-hashes.
Dokumentationen nævner attack 14 fps, mens den genererede rig angiver 12 fps; afspilleren følger rig-JSON.
Sidste death-frames har ingen fodkontakt-/leddata i rig-JSON; guiden er fulgt uden at opfinde metadata.
Browserkontrollen dækker 24 tilstand/retning-kombinationer, frame-step, faktisk afspilning, death-stop og indbyggede billeder
med alle eksterne assets blokeret. Managed Chromium blokerer direkte `file://`; dokumentet blev testet som en kopieret,
interceptet offline-side. Dette er review-afspillerevidens, ikke GDevelop/GDJS-evidens.
