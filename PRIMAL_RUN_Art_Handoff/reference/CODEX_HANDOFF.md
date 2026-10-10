# Handoff til Codex · 10. oktober 2026

Claude skriver til Codex. Del B (B1–B8) er bygget, testet og live, og del A (A1–A5) er integreret.
Herunder står hvad der mangler, i prioriteret rækkefølge. For hver opgave står hvor i koden den hører hjemme, og hvordan den testes.

## Udgangspunkt

- **Base:** `integration/next`. Den er lig med `claude/part-b` og er live på gh-pages. Kodedelen af Codex' A1–A5 og al del B-kode er med.
  - [PR #3](https://github.com/JuNNeZ/primal-run/pull/3) (`integration/next` → `main`) venter på Jonas.
- **Arbejdsgang:** Codex arbejder på `codex/sprites-and-mechanics`, og samling sker med `/primal-integrate`. Claude pusher aldrig til Codex' gren.
- **Udgivelse:** Kun når Jonas siger det (gh-pages).
- **Art:** ChatGPT laver original grafik, og Codex integrerer og validerer den. Claude laver ingen original grafik.
- **Kode:** Nye ting skal bag `FEATURES.<flag>` i `src/core.js`. Kerneændringer skal være små og isolerede.

## Det skal du vide om koden, der kom til i dag

1. **Lazy loading.** Menuen henter kun UI og den valgte arts idle-frames med `preload({menu:true})` i `app.js`. Det er ca. 222 requests mod 1666 før.
   - Banens grafik hentes ved START, og resten hentes, når den bruges.
   - **Nye asset-mapper pr. art skal med i regex'en i `preload({menu:true})`.** Ellers hentes de i menuen og belaster GitHub Pages' rate limit.
   - Browser-tests skal vente på `primalRun.game.phase === 'playing'` efter START.
2. **CI kører kun filerne i `package.json` → `test:game`.** Listen er eksplicit. En ny testfil skal tilføjes der, ellers kører CI den ikke. Det var tilfældet for 8 af del B's testfiler indtil i dag.
3. **Genererede filer:** Kør `python tools/rebuild_generated.py` som sidste trin før hver commit, der ændrer `src/`. Ellers fejler GDevelop-hash-testen i `tests/game.test.cjs`.
   - Det skete for `c65e8e8`.
   - Gentag efter hver eneste rettelse i `src/`, også små rettelser efter en build.
4. **i18n:** 24 sprog plus dinosaurisk. Ny UI-tekst skal gennem `tools/i18n/` (stilguide i `tools/i18n/STYLE_GUIDE.md`).
   - Patch notes: `python tools/i18n/patch_notes.py extract|check|build`. Nye punkter skal oversættes til de 21 rigtige sprog.
5. **Menuens baggrund:** Dinosauren styres af `C.menuPilot(run, goal)` (`FEATURES.menuPilot`). Fjendernes navneskilte er skjult i menuen, og lærredet er vippet i `style.css` (`.cinematic-menu .arena>canvas`).
6. **Artsbogen:** Hver set art vises animeret med `drawGuideModels()` i `app.js` (`FEATURES.guideModels`). Den bruger `enemyFrame(kind,'walk'|'attack','E',n)`. Nye walk- eller attack-frames dukker automatisk op der.

## Prioriteret opgaveliste

### 1. Sprite-atlas: ingen ny grafik, størst effekt
**Problem:** En bane koster stadig flere hundrede til ca. 1000 enkelte PNG-requests, og GitHub Pages rate-limiter det.

**Specifikation:** Står i `MISSING_SPRITES.md` under "Sprite-atlas".
- Lav ét ark pr. art pr. mappe ved build (`tools/build_web.cjs`) med JSON `{path:{x,y,w,h}}` og en 1 px gennemsigtig kant.
- `sprite()`, `loadImage()` og `catalog` skal slå op i arket. Ankre og pixels skal være uændrede.

**Test:**
- Alle browser-tests skal bestå.
- Tæl requests i headless Chromium med `page.on('request')`. Målet er højst ca. 30 i menuen og højst ca. 40 pr. bane.
- `validate:game-sprites` og `validate:enemy-sprites` skal køre på kilde-PNG'erne.

**Bemærk:** Testene tjekker `drawImage`-kald på `im.src`, for eksempel `player-full-browser`'s "Not drawn"-tjek. De skal tilpasses, så de genkender frames fra et atlas.

### 2. A6: lava/aske, natpalet og HUD (art fra ChatGPT)
| Element | I dag (procedurelt) | Kodested | Ønsket |
|---|---|---|---|
| Basaltkrydsning over lava (B1b, bane 7) | mørk ellipse med sekskantsten, radius 70 | `background(stage,map,view)` → `for (const c of map.lavaCrossings …)` | `basalt_crossing_0/1.png` ca. 160×120. **Genbrug prototypen i `assets/ground/` på `codex/preserved-feathered-starter`** |
| Lava-/askeovergange | kun lavafarve og partikler | lavablokken i `background()` (stage 3) | overgangstiles som A4-vandtiles |
| Natpalet (B2) | radial mørkning og blå multiply i `screenAmbience(r,time)` | `screenAmbience` | 8-farvers swap-tabel pr. biom, eventuelt øjenglimt for rovdyr |
| Sol/måne i HUD (B2) | ☀/☾ foran `#time-label` | HUD-opdateringen i `draw()` → `#time-label` | 2 ikoner, 16×16 |
| Pixel-HUD-chips | CSS-chips | `.hud-chips` | valgfrit |

### 3. Del B-pladsholdere (art fra ChatGPT)
| Pakke | Element | Kodested i `app.js` (alle i `draw()`, undtagen `drawPond`/`npcVariant`) | Ønsket asset |
|---|---|---|---|
| B1c | Bobler under Bennys dyk | partikelløkken (`r.particles`, farve for `bubble`) | 3–4 frames, 16×16 |
| B1c | Benny under vand | `sprite(...)`-kaldet med `o.enemy.submerged` (30 % alpha) | rygfinne eller silhuet S/N/E/W |
| B1c | Karls askesky (også ASKEKAST-nedslag) | `for (const c of r.ashClouds…)` | 4 frames, ca. 192×128 |
| B4 | Tørret mudderkant om skrumpende damme | `drawPond(pond,time,tiled)` | kanttile med 3–4 revnevarianter |
| B5 | Flokmærke over allierede raptorer | `for (const a of r.raptors …)` (teal ◆) | ikon, 12×12 |
| B8 | Fiskekongens farver | `npcVariant` → `swaps.fishKing` | valgfrit: bedre 4-farvers swap-tabel |

Alle elementer har i dag en procedurel fallback. Behold den, så spillet virker, også hvis en PNG mangler.

### 4. Produktionsgodkendelse af A1–A5 (fra `MISSING_SPRITES.md` og `SPRITES_AND_MECHANICS_STATUS.md`)
- **A2:** Baryonyx W hvile/kløen, T. rex S/E drikning og W snusen/drikning mangler størrelsestro poses.
- **A3:** Sårede keyposes mangler: Compy 8 og Deinonychus 5. Derudover bruger Carnotaurus N2, Triceratops S2 og Baryonyx E3 originalen.
- **A4:** Vandets overgangstiles skal poleres visuelt, så gentagelser ikke kan ses. Vandreglerne må ikke ændres.
- **A5:** De 32 nye raptor-ådsler skal have et endeligt anatomi- og farvereview.
- Alle nye assets er `prototype_static`. Godkendelse sker pr. levering med manifest, validering og preview.

### 5. Valgfrit, når 1–4 er gjort
- **NPC-ådsel for Velociraptor:** Allierede raptorer (B5) kan i dag ikke dø og efterlade et ådsel. Med et ådsel kan Claude bygge den regel.
- **Raptor-NPC'er i `r.enemies`:** De mangler NPC-ådsler i dag, så raptorer ligger separat i `r.raptors`.

### Venter på Jonas' beslutning (byg ikke endnu)
- Æg, udklækning og unger (`IDEABANK.md` → "Udklækning og opvækst").
- Nye spilbare arter og stemnings-NPC'er (`IDEABANK.md` → "Nye arter og dyr").

## Claude-status (til orientering)
Opdateres nederst i `PART_B_STATUS.md`. Åbne Claude-punkter: balance pr. pakke, `speed_slayer`-andelen og titel-metadata. Se afsnittet "Opfølgning 10. okt. aften".

## Tjekliste før push
`python tools/rebuild_generated.py` → `node --test tests/*.test.cjs` → `npm run test:game` → `npm run validate:game-sprites` → `npm run validate:enemy-sprites`.
Gendan de `*_report.json` og `previews/*.png`, som browser-testene omskriver (`git checkout`), medmindre ændringen er tilsigtet.
