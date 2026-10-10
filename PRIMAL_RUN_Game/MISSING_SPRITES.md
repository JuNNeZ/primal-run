# Grafiske opgaver efter del A

A1–A5 har nu integrerede **prototyper**. Produktionsgodkendelse og den samlede
slutverifikation mangler; se `SPRITES_AND_MECHANICS_STATUS.md`.

1. **Kryds-state konsistens:** finpuds kropsform, markeringer og loop-overgange.
   Fem arter har 120 artsangrebsframes, inklusive Parasaurolophus-spark.
   Ankylosaurus genbruger sine oprindelige 24 halesving byte-identisk.
2. **Ecology-idles:** ni arter har 288 frames for fødesøgning, drikning, søvn og
   kradsning: 276 aktive tegnede poses og 12 native fallbacks. Baryonyx W
   hvile/kløen samt T-rex S/E drikning og W snusen/drikning mangler størrelsestro poses.
3. **Sårede keyposes:** 13 arter har 312 frames, men 16 tegnede keyposes blev
   afvist. Compy mangler otte størrelsestro keyposes; Deinonychus mangler fem;
   Carnotaurus N2, Triceratops S2 og Baryonyx E3 bruger også originalen.
4. **Vandpolering:** 48 overgangstiles er bygget; syv rettede hjørnetiles består
   hjørnekontrollen. Visuel sømløshed og samlet renderer-/collision-review skal
   færdiggøres uden at ændre vandreglerne for at skjule grafikfejl.
5. **Raptor-ådsler:** Velociraptor/Utahraptor har nu 32 NPC-klare ådsel-/skeletposes.
   De 160 ældre poses er uændrede. Endelig anatomi- og farvereview mangler.
6. **Valgfri A6:** lava/aske-overgange, pixel-HUD-chips og natpaletter.
7. **Fremtid:** æg, udklækning og baby-/ungestadier pr. art, efter gameplay-/balancevalg.

De 632 tidligere behavior-studieframes er runtime-deaktiveret og bevaret som
kilder/review. Alle nye assets er prototype_static uden produktionsgodkendelse.
Følg `SPRITE_RULES*.md`: native pixels, fast palette, kilder, manifest, previews
og særskilt PNG-/browser-/GDevelop-validering.
Følg `SPRITE_RULES*.md`: native pixels, fast palet, en validerings- og manifestfil pr. levering.

## Deinosuchus

Spillerintegrationen genbruger de eksisterende 120 levende frames og 16 ådsel-/skeletposes. Ingen nye tegninger er nødvendige for denne integration. Kilderne forbliver prototype_static; kryds-state anatomi er ikke produktionsgodkendt.

## Del B (claude/part-b) – pladsholdere, der venter på grafik

Claude laver ingen original grafik. Disse elementer tegnes i dag procedurelt i `app.js` og bør erstattes
af ChatGPT-art (Codex integrerer). Palet: Primal Earth 32.

| Pakke | Element | I dag | Ønsket asset |
|---|---|---|---|
| B1b | Basaltkrydsning over lava (bane 7) | mørk ellipse (#3b4144) med sekskantede sten (#626861/#929387), radius 70 px | 2 varianter `basalt_crossing_0/1.png` ca. 160×120 px, opaque kant mod lava (A6 lava-/askekanter). Den bevarede gren `codex/preserved-feathered-starter` har prototyper i `assets/ground/`. |
| B1c | Bobler (Bennys dyk) | partikler i #a2d4c1 | lille bobleanimation (3–4 frames, 16×16) |
| B1c | Askesky efter Karls stormløb | 5 halvgennemsigtige cirkler (#626861), radius 90 px | askesky-effekt (4 frames, ca. 192×128), kan genbruges til ASKEKAST-nedslaget |
| B1c | Benny under vandet | Bennys sprite med 30 % alpha | valgfri: rygfinne/silhuet i vand (S/N/E/W) |
| B8 | Fiskekongens farver (Baryonyx-skin) | paletskift af de eksisterende Baryonyx-frames | valgfrit: ChatGPT kan foreslå en bedre 4-farvers swap-tabel eller et kronemærke; ingen nye frames nødvendige |
| B4 | Tørret mudderkant om skrumpende damme | ellipse i #8d6042 med revner i #674333 | tørret mudder-kanttile (A6), helst med 3–4 revnevarianter, så kanten kan følge dammens radius |
| B2 | Natpalet | radial mørkning (#151b19) + let blå multiply (#3c7180) i `screenAmbience` | A6 nat-paletskift for terræn og dyr (fx 8-farvers swap-tabel), evt. øjenglimt for rovdyr |
| B2 | Sol-/måneikon i HUD | tekstsymbolerne ☀ og ☾ foran uret | 2 små HUD-ikoner (16×16) i UI-stil |
| B5 | Vilde og allierede raptorer | spillerens Velociraptor-frames (`player_full/velociraptor_*`), teal ◆ og HP-bjælke tegnet i kode | valgfrit: et lille flokmærke-ikon (12×12), og NPC-ådsel/skelet for Velociraptor, hvis allierede senere skal kunne dø (punkt 5 ovenfor) |

## Sprite-atlas (anmodning til Codex, 10. okt.) – færre HTTP-requests på GitHub Pages

Spillet hentede ca. 1666 enkelt-PNG'er ved sideindlæsning, og GitHub Pages rate-limiter det.
Claude har gjort menuen lazy (`preload({menu:true})` i `app.js`: kun UI plus valgt arts idle-frames, ca. 222 requests).
Banens grafik hentes nu først ved START, men en bane koster stadig flere hundrede til ca. 1000 requests.

**Ønske:** Codex samler frames i atlas-ark i build-trinnet (`tools/build_web.cjs` / `build_game.py`). Det er ikke ny grafik, kun pakning af de eksisterende PNG'er pixel for pixel.

- Lav ét ark pr. art pr. mappe, fx `player_full/velociraptor.png` + `.json`, og ét ark pr. fjende/boss. Gør det samme for `behavior*/`, `corpses/`, `effects/` og `ecology/`.
- Atlas-JSON skal gemme `{path: {x,y,w,h,anchor}}`, så `catalog` og de faste ankre er uændrede. `sprite(path)` slår op i atlasset og tegner med `drawImage(sheet, x,y,w,h, …)`.
- Behold Primal Earth 32 og de nøjagtige pixels. Brug ingen skalering, ingen komprimering med tab, og 1 px gennemsigtig padding mod bleeding.
- Mål: højst ca. 40 requests pr. bane og ca. 30 i menuen. Validatorerne (`validate:game-sprites` / `validate:enemy-sprites`) skal køre på kilde-PNG'erne som i dag.
