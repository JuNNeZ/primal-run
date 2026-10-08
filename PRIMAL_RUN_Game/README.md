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
er den primære testede styring; mobiltilpasning skal fortsat spiltestes.

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
tilgængelige, selv om kilde-repositoryet er privat. Ingen publicering er udført
af udviklingsarbejdet her.

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
beholder deres gamle stillbilleder. Nye billeder er prototyper; markeringer,
body registration og fuld temporal kvalitet kræver fortsat kunstreview.

## Kampfeedback og første bane

Bid, der rammer, giver en kort lys markering på fjenden, et skadetal og en
separat dyb kontaktlyd. Almindelige fjender skubbes 18 pixels væk og bremses i
0,12 sekunder; panser begrænser skubbet til 8 pixels. Bosser kan ikke stunlåses.
Kontaktlyden følger master- og effektvolumen, uafhængigt af musikvolumen.

Første bane starter med to Compy og én Parasaurolophus. Første ekstra fjende
kommer efter fem sekunder. Åbningen har højst tre fjender, derefter fem og til
sidst syv; spawnintervallet går fra 4 til 3,2 til 2,6 sekunder. Carnotaurus kan
først dukke op efter 12 opsamlede kødenheder; højst én almindelig Carnotaurus
ad gangen. Eskaleringen følger opsamlet kød, så en langsom første jagt ikke
bliver overfyldt, før man har lært styringen.
Bossen kræver nu 24 kød. Tiderne fryser i pause og under mutationsvalg.
Dette er en første balancejustering; menneskelig spiltest skal afgøre det
endelige tempo til første mutation og boss.

## Status og næste arbejde

Dette er en spilbar udviklingsversion, ikke et færdigbalanceret produktionsspil.
Progressions- og browserkontroller gennemfører bossforløbet med kontrollerede
testtilstande; de erstatter ikke en fuld menneskelig gennemspilning.

Næste arbejde er kampbalance, bedre fjendeadskillelse/pathfinding, unikke
biomefarer og mere særprægede bossmønstre, fuld mobiltest samt visuel gennemgang
af animationerne. Musikken er et kort genereret loop; længere kompositioner og
endelige effektlyde er en senere lydopgave. Highscores er lokale; online-score
kræver backend og validering.

Alle billeder beholder deres prototype-status. De øvrige enemy-billeder er South-
stillbilleder; de fire nye serier er animerede prototype-studier. Utahraptorens North-walk er
fortsat prototype-drejningen af South med dens kendte lysbegrænsning.
Se `SPRITE_RULES.md`, `manifest.json`, `palette.json`, `validation_report.json`
og `integration_report.json`. Ingen kildepixels eller origins ændres.
