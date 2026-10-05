# PRIMAL RUN - faelles sprite-regel v1

Denne regel gaelder ALLE sprites, tiles, UI-ikoner, effekter og fremtidige
animationer. Den skal altid foelge med en asset-pakke. Nye eller aendrede billeder
maa ikke kaldes faerdige, foer relevante kontroller er gennemfoert.

## 1. Visuel stil

- Semi-realistisk pixel art med laesbare silhuetter, naturlige dinosaurfarver,
  varme jordfarver, daempet groent og tydelige gameplay-effekter.
- Verdensobjekter bruger samme haeldning: top-down med en let synlig side.
  Rene sideprofiler fra konceptarket er kun referencer, indtil perspektivet er rettet.
- Lys kommer fra oeverst til venstre. Farver, kontrast, skyggedybde og
  konturbehandling skal matche den godkendte mastersprite i samme asset-familie.
- En art har samme anatomi, farvemaerker, kropsstoerrelse og detaljeniveau
  i alle frames. En animation maa ikke skifte art, kropsform eller kameravinkel.
- Nye sprites bruger en faelles fast palette. Paletten og den foerste mastersprite
  skal fastlaegges og vedlaegges, foer en produktionsserie kan godkendes.
  Konceptarket er stilreference; det er ikke en godkendt palette eller mastersprite.

## 2. Pixel-perfect eksport

- Lossless PNG, RGBA, native 1x pixels. Transparent baggrund til enkeltobjekter.
  Terræn og UI-panelernes indre maa vaere opaque.
- Ingen blur, anti-aliasing, JPEG-kompression, automatisk smoothing eller
  interpolation i game-assets. Oversigtsbilleder er kun previews.
- Alpha er 0 eller 255. Et transparent pixel har RGB 0,0,0.
- Alle placeringer, anchors, kameraoffsets og spritepositioner afrundes til hele
  pixels. Skalering sker i hele multiplaer med nearest-neighbor.
- Eksport maa ikke medtage labels, rammer fra konceptarket eller dele af naboobjekter.
- Der skal vaere mindst 2 transparente pixels rundt om fritstaaende sprites.
  Tiles skal udfylde deres tilecelle uden transparent kant.
- Udklip fra konceptarket bevarer kildepixels: baggrund og naboobjekter fjernes,
  men manglende detaljer opfindes ikke. Source-crops er prototyper, indtil stilen
  er kontrolleret mod en godkendt master.

## 3. Faste laerreder og skala

| Familie | Eksportlaerred | Center/origin |
| --- | --- | --- |
| Utahraptor | 128 x 128 | 64,64 |
| Compy | 64 x 96 | 32,48 |
| Ung Parasaurolophus | 96 x 128 | 48,64 |
| Ung Carnotaurus | 96 x 128 | 48,64 |
| T. rex | 96 x 160 | 48,80 |
| UI-statistikikoner | 40 x 40 | 20,20 |
| Mutationsknapper/slots | 64 x 64 | 32,32 |
| Pickups | 80 x 80 | 40,40 |

Disse maal er eksportaftalen for det nuvaerende konceptark, ikke en godkendelse
af dyrenes indbyrdes stoerrelse. Produktionstilessystemet bruger 32 x 32 pixels.
Stoerre objekter kan fylde flere celler. Source_Crops har deres originale maal og
er ikke godkendte 32 x 32 tiles.

Et dyrs BodyAnchor skal ligge paa samme anatomiske punkt mellem hofterne i hver
frame. Origin og BodyAnchor skal vaere identiske gennem hele animationsserien.
Centrering efter synlig bounding box alene godkendes ikke som animationsalignment.
Poser i denne pakke er centreret som stillbilleder; BodyAnchor er endnu ikke valideret.
En ny canvasstoerrelse maa kun indfoeres ved at opdatere reglen og hele serien.

## 4. Animationer

- Foerste produktionsdino er Utahraptor. Byg og verificer en retning ad gangen.
- Hver serie har navngiven state og retning: N, NE, E, SE, S, SW, W eller NW.
  Filnavn: `utahraptor_walk_S_000.png`. Nummeret er et tidsframe, ikke en retning.
- En walk-serie maa kun indeholde samme state, retning, skala, palette og anchor.
- Produktionens udgangspunkt: idle 4 frames / 4 fps, walk 6 / 8 fps,
  run 6 / 12 fps, bite 4 / 10 fps, hurt 2 / 8 fps, death 6 / 8 fps.
  Idle, walk og run looper; bite, hurt og death afspilles en gang.
- En anden frameplan kraever en dokumenteret opdatering af animationsmanifestet.
- Visuelle gates: ingen pixeljitter ved BodyAnchor, ingen skala- eller farvehop,
  ingen afklippede taeer/haler, ingen pludseligt skiftende ben, ingen utilsigtet
  dobbeltframe og ingen spring ved overgangen fra sidste til foerste loopframe.
- Movement og collision drives af et stabilt body-hitbox. Halen og skiftende
  animationssilhuetter maa ikke aendre collision-geometrien mellem frames.
- Mirror maa kun bruges, hvis anatomi, markeringer og faelles lys stadig passer.
- Hver serie ses frame for frame og i loop ved 1x og 4x paa lys/moerk baggrund,
  derefter testes den i GDevelop under movement, stop, attack og state-skift.
- GDevelop runtime-resultatet skal registreres. Uden runtime-test er serien ikke
  godkendt til produktion, selv om PNG-valideringen bestaar.

## 5. Tiles, UI og effekter

- Produktionsground-tiles er 32 x 32 og testes gentaget i et 3 x 3 grid.
  Alle kanter og corners i et transition-saet skal testes samlet.
- UI-barer skal i produktion bestaa af frame/baggrund og separat fill.
  De udklippede barer er statiske illustrationer med indbygget delvis fill.
- Effekter skal have fast canvas og anchor gennem serien. Et enkelt splash-billede
  er en statisk effekt, ikke en godkendt effektanimation.

## 6. Status og leverance

Hver asset har en manifestpost med fil, maal, kildeudsnit, origin og status.

- `prototype_static`: importabelt enkeltbillede. Fuld stil og animationskontrol mangler.
- `approved_static`: stil, skala, perspektiv, pixels og visuel kontrol er godkendt.
- `approved_animation`: ogsaa alle animations- og runtime-gates er bestaaet.

Denne foerste pakke indeholder kun `prototype_static` og `animation_ready: false`.
Der er ingen godkendte animationer, seamless tiles eller funktionelle UI-barer.
Automatiske kontroller er tekniske eksportkontroller, ikke en garanti for fejlfri kunst.

Koer `python validate_sprites.py`, inspicer alle previews, og vedlaeg rapporten.
Hvis en gate fejler, ret fejlen eller behold prototype-status; skjul ikke problemet.
