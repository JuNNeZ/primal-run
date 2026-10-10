# Godkendt grafik og native sprite-atlas · 10. oktober 2026

Basis: `integration/next` ved `522e1b42faf9efa3a7a0fda27daf33e905d3a888`.
Arbejdsgren: `codex/approved-art-and-atlas`.

Jonas godkendte de 17 PNG'er med “Det er så fint godkendt. implementer dem og
forsæt”. Hver godkendelse er knyttet til den konkrete eksporthash i
`presentation_manifest.json`. De godkendte pixels er kopieret byte-identisk;
øvrige animations- og produktionsgodkendelser ændres ikke.

| Integration | Adfærd |
| --- | --- |
| Sol og måne | Native 16×16 HUD-ikoner; eksisterende tekstsymbol ved manglende billede |
| Allieret raptor | Native teal fjermarkør; eksisterende diamant som fallback |
| Bennys bobler | Fire native 16×16 frames styret af partiklens levetid; skjult ved reduceret bevægelse |
| Karls askesky | Fire native frames og tre overlappende puffs inden for den eksisterende zone; stabil frame ved reduceret bevægelse |
| Tørret mudder | Fire nordvendte 32×32 kanttiles følger den skrumpende dams oprindelige nordkant |
| Basaltpassager | To bevarede 256×256 billeder tegnes uden skalering inden for den eksisterende passageellipse |

`FEATURES.presentationArt` styrer integrationen. Spillets skade, vand, lava,
passager, partikellevetider og simuleringspause bruger de eksisterende regler.
Mudderpakken indeholder kun nordkanter; øvrige kanter bruger den eksisterende
tegning. En fuld natpalet og nye lava-/aske-overgangstiles er stadig åbne.

## Atlas

`tools/build_sprite_atlases.py` pakker alle aktive manifestposter i deterministiske
ark pr. art eller fælles assetmappe. Store grupper opdeles i højst 2048×2048 ark.
PNG og JSON ligger i `assets/atlases/`; hver JSON-post er
`path → {x,y,w,h,anchor}`. Alle frames har en pixel helt transparent padding.
Originale PNG'er og kilder bevares, og arkene bruges af både browserkoden og det
genererede GDevelop-projekt.

`tools/build_game.py` genererer atlas og indlejrer indeks i `src/assets.js`.
`FEATURES.spriteAtlas` kan slå atlas fra. Loaderen deler billedhentninger mellem
frames og prøver bevarede PNG'er, hvis et ark fejler. Framebeskrivelser undgår
separate decoded billeder for hver frame. Beskårne thumbnails, recolor, hit-flash,
artsbog, patterns og HUD går gennem samme native crop-funktion.

`PrimalApp.drawRecord(image,args)` beskriver den faktiske frame i et canvas-kald,
så browserharnesset kontrollerer den samplede atlasregion, destination og native
mål. Testene afhænger dermed ikke længere af en separat PNG-URL pr. frame.

## Verifikation

- `python PRIMAL_RUN_Art_Handoff/validate_art.py`: 17 eksporter, kildehashes, palette og alpha.
- `python tools/validate_sprite_atlases.py`: 2.993 aktive frames i 36 ark, eksakte RGBA-pixels, ankre, dimensioner, padding og overlap.
- `node tests/presentation-atlas-browser.cjs`: nye tegnekald, fire effektframes, fire muddervarianter, begge basaltvarianter, allieretmarkør, sol/måne, reduceret bevægelse, feature-fallback og manglende atlas.
- PNG-måling: 17 requests i menuen; 27 i alt efter vulkanbanens preload.
- Alle komponenter fra `npm test` består i separat kopi: 231 simulationstests, 26 spil-browserchecks og tre historiske kitchecks. 1.440 spiller- og 1.200 fjendeframes er kontrolleret ved faktiske tegnekald.
- CI og Pages-gaten kontrollerer atlas-pixels og den godkendte pakke.

Se `sprite_atlas_validation.json` og `presentation_atlas_runtime_report.json`.
Browserresultater er standalone Chromium. Det genererede GDevelop-projekt er
bygget og kontrolleret via sourcehash-testen; en ny eksport gennem den faktiske
GDevelop-editor/GDJS-exporter er ikke udført her. gh-pages er ikke udgivet.
