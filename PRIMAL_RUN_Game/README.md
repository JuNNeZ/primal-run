# PRIMAL RUN — første spilbare version

Spil som Utahraptor gennem fire biomer. Jagt, saml kød, vælg mutationer,
besejr bosser, og brug gemt DNA på små start-upgrades.

## Spil i browseren

Fra repositoryets rod: `npm run preview`. Åbn
`http://localhost:8000/PRIMAL_RUN_Game/index.html`.
Til publicering bygger `npm run build:web` en selvstændig webudgave i `dist/`.
Alle webstier er relative og fungerer under `/primal-run/` på GitHub Pages.

WASD/piletaster flytter, Space bider foran spilleren, Shift pouncer under
bevægelse, og Escape pauser. Der er også touch-knapper. Tastatur på desktop
er testet sammen med responsive touch-layouts i portræt og landskab.
Langvarig spiltest på fysiske mobiler er stadig relevant.

## Åbn direkte i GDevelop

1. Hent repositoryet, og behold hele `PRIMAL_RUN_Game` samlet.
2. I GDevelop 5 vælger du at åbne et lokalt projekt og vælger `project.json`.
3. Åbn scenen `PrimalRun`, og start Preview.
4. Eksportér via GDevelops HTML5/web-eksport. Host den eksporterede mappe
   på en statisk webserver; upload hele eksporten, ikke kun `index.html`.

**Projektet bruger JavaScript-events og en canvas/HTML-grænseflade.**
Spilmekanikkerne er ikke bygget som individuelle visuelle GDevelop-events eller
Sprite-objekter i sceneeditoren. Scenen starter og opdaterer den fælles spilkerne.
Det gør begge udgaver ens, men mekanikker og menuer redigeres i kildekoden.

Redigér `src/core.js` for balance, AI og progression, `src/app.js` for menuer,
styring og rendering, `src/audio.js` for musik og lyd og `style.css` for udseende.
Kør derefter `npm run build:game` fra repositoryets rod. Den opdaterer det
genererede JavaScript-event i `project.json`; håndredigér ikke dette event,
da næste build erstatter det. Art kopieres byte-for-byte fra Prototype Kit.

### Nye player-angreb

Utahraptoren har nu **24 nye bid-sprites: seks frames i hver af S/N/E/W**.
Animationen viser optakt, åbent gab, kontakt og recoil ved 14 fps. Skaden
udløses én gang på kontaktframe3; retningen låses under angrebet, og bevægelse
under bid er lidt langsommere. Quick Jaws skalerer hele animationen og
kontaktøjeblikket sammen. Pause fryser animationen, og død annullerer den.

Åbn [player_review.html](player_review.html) for alle frames ved 1× og loops
ved 4× på lys/mørk baggrund. En kort video ligger i
`previews/player_combat/bite_four_directions_4x.webm`.
Se `SPRITE_RULES_PLAYER_COMBAT.md`, `player_combat_manifest.json`,
`player_sprite_validation.json` og `player_animation_runtime_report.json`.

De nye poses er gennemgåede angrebsstudier til spiltest. De erstatter ikke de
historiske walk/idle-filer, og mindre forskelle i krop/striber samt overgangen
til den gamle walk kræver yderligere visuel forfining. De gamle fjendesprites er
bevaret som reference; fire arter har nu nye retnings- og animationsstudier.

Til reproduktion af eksporten fra de bevarede kilder:

```sh
python tools/export_player_attacks.py
npm run build:game
npm run validate:game-sprites
npm run test:game
```

En rigtig eksport med libGD/GDJS fra GDevelop **5.6.283** er testet i Chromium.
Til reproduktion med et installeret/udpakket GDevelop kan du bruge:

```sh
node tools/export_gdevelop.cjs /sti/til/libGD.js /sti/til/GDJS /tom/eksportmappe
```

`GDJS` skal indeholde `Runtime/`. `libGD.js` og `libGD.wasm` skal ligge sammen.
I Linux-portableudgaven findes runtime i `resources/GDJS`; libGD findes i
appens `www`-mappe inde i `resources/app.asar`. Normalt er eksport fra
GDevelops brugerflade den letteste løsning. Ingen motorfiler ligger i Git.

## GitHub Pages

Workflowet `.github/workflows/pages.yml` bygger browserudgaven fra samme
spilkerne; det downloader ikke GDevelop og er ikke GDevelops runtime-eksport.

Efter at ændringerne er lagt på GitHub:

1. Vælg **Settings → Pages → Source: GitHub Actions**.
2. Kør **Actions → Publish PRIMAL RUN to GitHub Pages → Run workflow**.
3. Brug den URL, GitHub viser efter en vellykket deployment.

Et privat repository kræver en GitHub-plan med understøttelse af Pages fra
private repositories. Webspillet og dets leverede assets kan være offentligt
tilgængelige, selv om kilde-repositoryet er privat. Den aktive demo publiceres også som statiske filer på `gh-pages`:
https://junnez.github.io/primal-run/. Ved branch-deployment vælges gh-pages / root
i Pages-indstillingerne. Workflowet ovenfor er en alternativ publiceringsvej.

## Implementeret

- Startmenu, navn, hjælp, pause og resultatskærm.
- Retningsbestemt seks-frame bid med kontaktstyret skade, pounce/stamina,
  faste kropshitboxes og klippekollision.
- Syv fjendetyper; fire bosser med varslede stormløb og for de sidste to også
  områdeangreb. Frontpanser gør Triceratops/Ankylosaurus sværere at angribe forfra.
- Fire kødmål: 24/50/75/100. Kød giver XP ved opsamling; kills giver ikke XP direkte.
- Ti mutationer, tre tilfældige forskellige valg, højst tre rangtrin hver.
- DNA-drop: Compy 5 %/1 DNA, Parasaurolophus 15 %/2 DNA, store dyr 30 %/4 DNA.
  Bosser giver garanteret 15/20/25/30 DNA direkte til den gemte bank.
- DNA-shop: fire upgrades med højst fem rangtrin; starter med 10 DNA i pris.
- Lokal top 10, navn, DNA, upgrades og lydindstillinger via `primalRun.save.v1`.
- Separate master-, musik- og effektvolumener, mute, fuldskærm og kamerarystelse.
- Original proceduremusik med pentatonisk motiv, bas og trommepulser; flere lag
  og højere tempo under bosskamp. De eksisterende originale WAV-placeholders
  bruges til effekter. Musikken starter efter første brugerhandling.

Data gemmes i denne browsers lager på denne webadresse. Det synkroniseres ikke
mellem maskiner eller mellem Preview og GitHub Pages. Ved blokeret lagring kan
man stadig spille, men fremgangen varer kun i sessionen. Den gamle demos DNA
ændres eller migreres ikke automatisk.

## Nye fjender

Compy, Parasaurolophus, Carnotaurus og Ankylosaurus har nu 64 nye PNGs: fire poses
(klar/venstretrin/højretrin/action) i fire retninger. Gang bruger et fire-frame
loop med bevidst genbrugte planted-frames. Action-timing følger AI-varslet,
angrebet og recovery. Se [enemy_review.html](enemy_review.html),
SPRITE_RULES_ENEMIES.md og enemy_animation_runtime_report.json.

- Compy bevæger sig hurtigere i nærheden af andre Compy, holder afstand fra
  hinanden og varsler et kort bid; ren kropskontakt giver ikke straks skade.
- Parasaurolophus er ufarlig, flygter ved 260 pixels og søger en fri retning langs
  kanter/klipper frem for at fortsætte direkte ind i en væg.
- Carnotaurus har 0,9 sekunders fastlåst varsel og stormløb allerede på første
  bane; efter angrebet er der 0,9 sekunders recovery.
- Ankylosaurus varsler haleslag i 0,9 sekunder og rammer én gang inden for 90 pixels.
  Frontpanser halverer bid; bagfra tager den fuld skade. Det røde område viser
  slagets rækkevidde, og 1,6 sekunders recovery giver en åbning.

Boss-Carnotaurus bruger også nye retningsposer. De øvrige bossarter og fjender
beholder deres gamle stillbilleder, som nu roteres i 90-graders trin omkring
kroppens faste origin, så de vender mod bevægelsen. Smoothing er slået fra;
roteret lys er stadig en prototypebegrænsning. Nye billeder er prototyper; markeringer,
body registration og fuld temporal kvalitet kræver fortsat kunstreview.

## Kampfeedback og første bane

Bid, der rammer, giver en kort lys markering på fjenden, et skadetal og en
separat dyb kontaktlyd. Almindelige fjender skubbes 18 pixels væk og bremses i
0,12 sekunder; panser begrænser skubbet til 8 pixels. Bosser kan ikke stunlåses.
Kontaktlyden følger master- og effektvolumen, uafhængigt af musikvolumen.

Første banes startområde har to Compy og én Parasaurolophus; længere væk
er dyrene allerede placeret i levesteder før jagtens start. Første ekstra fjende
kan komme efter fem sekunder uden for kameraet. Åbningen har højst tre
fjender inden for 900 pixels, derefter fem og til
sidst syv; spawnintervallet går fra 4 til 3,2 til 2,6 sekunder. Carnotaurus kan
først dukke op efter 12 opsamlede kødenheder; højst én almindelig Carnotaurus
ad gangen. Eskaleringen følger opsamlet kød, så en langsom første jagt ikke
bliver overfyldt, før man har lært styringen.
Bossen kræver nu 24 kød. Tiderne fryser i pause og under mutationsvalg.
Dette er en første balancejustering; menneskelig spiltest skal afgøre det
endelige tempo til første mutation og boss.

## Maps, rarities og progression

Hver biome har sit eget større kort: 2880×1920, 3200×2176, 3520×2432 og
3840×2688 simulationpixels. Kameraet følger spilleren og stopper ved kortkanten.
Visningen følger skærmens størrelse med kvadratiske pixels og heltalsskalering.
Dyr vandrer omkring deres levested, reagerer på nærhed eller angreb og opgiver
forfølgelsen ved stor afstand. Replenishment og bosser vælger positioner uden
for kameraet plus 128 pixels sikkerhed; de kommer ikke frem foran spilleren.
Minikortet viser spilleren, nærliggende dyr og bossen. Bevægelse og opsamling
bruger kortets grænser, ikke skærmens.

Spilleren har blågrøn ring og `▼ DIG`, fjender orange/rød ring og `◆ FJENDE`,
fredeligt bytte grøn ring og `◇ BYTTE`, bosser gul ring og `◆ BOSS`. De fire
animerede arter skifter retningssprite; de tre øvrige arter bruger en roteret
South-pose. Kropshitboxes følger ikke spriteformen.
Fjender og bytte kolliderer nu indbyrdes med faste torso-cirkler og fire pixels
afstand. Overlap løses efter AI-bevægelse, også i tætte flokke og ved kortkanter.
Store dyr har større masse; bosser og stormløb skubber mindre dyr til side.
Kollisionen ændrer ikke HP, angrebsretning eller angrebstiming og er pauset
under mutationsvalg. Spillerens bevægelse/pounce har fortsat fri passage;
fjenderne gør ikke skade på hinanden eller skaber gratis kød/DNA.

Kød har fire kvaliteter: almindeligt ×1, nærende ×1,5, sjældent ×2 og episk ×3
(afrundet op). Farvet ring, kvalitetsnavn og værdien `+X` vises på jorden.
Compy har 76/19/4,5/0,5 % chance; Parasaurolophus 60/28/10/2 %; store dyr
55/25/15/5 %. Værdien giver både XP, score og progression mod bossmålet.
DNA-chancerne er uændrede. XP-baren viser procent, opsamlet/mål og resterende
kødværdi til næste raptor-level; biome-kødmålet står separat øverst.

Mutationer har faste rarities med hvid/grøn/blågrøn/lilla markering:
almindelig (ben, udholdenhed, spring), usædvanlig (tænder, hjerte), sjælden
(panser, rækkevidde, hurtige kæber), episk (blødning, ådselæder).
Valg trækkes uden gentagelse med vægte 6/4/2/1 og udelukker maksimale rangtrin.
Kortene viser `RANG nu → efter valg / 3`. Alle effekter er fortsat beskrevet
på kortet, og simuleringen er pauset under valget.

Navnet Jonas (uanset store/små bogstaver) låser en kosmetisk krone, titlen
“Kødens konge” og en hemmelig hilsen op. Ingen ekstra stats eller DNA.

`world_runtime_report.json` adskiller standalone-browser og rigtig GDevelop
5.6.283 GDJS. `tests/world-browser.cjs` kontrollerer fire skærmformater,
kameraposition, bevægelsesretninger inklusive roteret boss-pose, rarity/rang,
XP-bar, sikre mutationsvalg, touch-layout og Jonas-hemmeligheden.

## Terræn, kampfeedback og første boss

Kortene har nu sammenhængende, snoede stier og uregelmæssige lysninger/grønne
områder. Originale tiles bruges med dæmpet kontrast, så dyr, loot og varsler
står tydeligere. Skoven har træer, bregner, blomster og stammer; flodsletten
har en flod med brede bredder; klippelandet har sten, døde træer og kranier;
vulkandalen har sprækker, lavasten og knogler. Stier og flod/sprække vises på
minikortet. Vegetation placeres uden for hovedstier og lysninger; trækroner
bliver gennemsigtige tæt på spilleren. Flod/lava er visuel scenery i denne
opdatering, uden nye skjulte terrænskader. Eksisterende sten-kollision bevares.
Alle PNG-kildepixels er uændrede; ingen nye sprite-animationer påstås.

Et bid, der rammer, giver 33 ms hit-stop (50 ms ved boss/stærkt/flere hits),
partikler, et kort blodmærke og lidt kamerarystelse. Misses giver ingen
kontakt-feedback. Blødende dyr efterlader kortvarige blodspor; pounce og bossens
stormløb giver støv. Effekterne har faste caps og udløber med simulationstiden;
pause/mutationsvalg fryser også dem. Kontaktlyden har en kort støj-transient,
og bossen får en syntetisk brummen. Alle lyde følger master/SFX separat fra
musikken; kamerarystelse kan fortsat slås fra.

Skovens jæger har en egen AI med to faser:

- Fase 1: 0,95 sekunders varsel før et fastlåst stormløb (320 px/s i 0,58 s).
  Tæt på spilleren veksler den med et varslet retningsbid (0,6 s varsel).
- Under recovery kan flankerne/bagkroppen bides for **+50 % skade**; fronten
  har ingen bonus. En blågrøn markering og HUD-tekst viser åbningen.
- Ved halvt liv: én tydelig 1,1 sekunders raseri-pause og fase-2-besked.
- Fase 2: hurtigere stormløb (370 px/s), et ekstra stormløb med nyt, fastlåst
  sigte efter **0,65 sekunders nyt varsel**, samt bid og varslet tramp tæt på.
  Tramp har 115 pixels radius, rammer én gang og kan undviges med pounce.
- Stormløb har 1,65 s recovery; bid 1,15 s; tramp 1,8 s. Bossen kan ikke
  stunlåses. DNA-belønningen er fortsat 15, og næste biome åbnes som før.

Bid-varslet viser den faktiske kegle (radius 100, facing dot >0,35).
Stormløbsvarslet viser en capsule med faktisk bane-længde og kontakt-radius 51,
ikke kun en smal midterlinje. HUD viser fase, afstand og aktuelt angreb/åbning.

`tests/polish-browser.cjs` kontrollerer faktiske renderinger af alle fire biomer,
kontaktframe/hit-stop/partikler, pause, fase- og rangevarsler samt en hel første
bosskamp med almindelige simulation-inputs uden ændringer af bossens HP efter
spawn. Det er en kontrolleret, isoleret boss-spiltest, ikke en menneskelig
slutgodkendelse af balance. `polish_runtime_report.json` registrerer standalone
og rigtig GDevelop 5.6.283 separat. Hele pakken består 29 core-tests plus
browser-/kit-regressioner og tekniske PNG-valideringer.

## Status og næste arbejde

Dette er en spilbar udviklingsversion, ikke et færdigbalanceret produktionsspil.
Progressions- og browserkontroller gennemfører bossforløbet med kontrollerede
testtilstande; de erstatter ikke en fuld menneskelig gennemspilning.

Næste arbejde er menneskelig kampbalance/spiltest, bedre pathfinding, unikke
biomefarer og videreudvikling af de øvrige bossmønstre, fysisk mobiltest samt visuel gennemgang
af animationerne. Musikken er et kort genereret loop; længere kompositioner og
endelige effektlyde er en senere lydopgave. Highscores er lokale; online-score
kræver backend og validering.

Alle billeder beholder deres prototype-status. De øvrige enemy-billeder er South-
stillbilleder; de fire nye serier er animerede prototype-studier. Utahraptorens North-walk er
fortsat prototype-drejningen af South med dens kendte lysbegrænsning.
Se `SPRITE_RULES.md`, `manifest.json`, `palette.json`, `validation_report.json`
og `integration_report.json`. Ingen kildepixels eller origins ændres.
