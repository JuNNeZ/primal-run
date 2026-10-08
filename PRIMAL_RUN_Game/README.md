# PRIMAL RUN — første spilbare version

Start som Compy og udforsk fire tilfældige biomer. Jagt, saml kød, vælg
mutationer, og besejr bosser. DNA låser nye arter op og køber start-upgrades.

## Spil i browseren

Fra repositoryets rod: `npm run preview`. Åbn
`http://localhost:8000/PRIMAL_RUN_Game/index.html`.
Til publicering bygger `npm run build:web` en selvstændig webudgave i `dist/`.
Alle webstier er relative og fungerer under `/primal-run/` på GitHub Pages.

WASD/piletaster flytter, Space angriber, Shift bruger artens evne, E undersøger
fossiler/reder, og Escape pauser. Der er også touch-knapper. Tastatur på desktop
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
- Tyve mutationer: ti fælles og ti artsmutationer; tre forskellige valg, højst tre rangtrin hver.
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

Spilleren har blågrøn ring, pil og `DIG · art`; farlige dyr har rød ring og
rødt artsnavn, fredeligt bytte grønt artsnavn, bosser gul ring og `◆ artsnavn`. De fire
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
kødværdi til næste dino-level; biome-kødmålet står separat øverst.

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

## Tilfældige naturkort, arter og udforskning

Hver jagt får et 32-bit seed; alle fire kort genereres af dette seed og biome-ID.
Samme seed giver samme landskab, habitater og begyndelsesbestand. Loot bruger
sin egen RNG og følger fortsat artens oprindelige dropchancer. Seed står i pausemenuen.
Kortene er 2880×1920 til 3840×2688. De første tre svage dyr ligger i startområdet;
farlige habitater, reder og elitevogtere placeres mindst 650 pixels fra starten.
Klipper har mellemrum; planter har ingen kollision. Forstærkninger og bosser
kommer fortsat uden for synsfeltet, når progressionen udløser dem.

Der er ingen veje eller kunstige hovedstier. Bregner, trækroner og småplanter
ligger tæt i skov/flodslette; klippe- og vulkanområder har deres egen spredning.
Ground patches er dæmpede, organiske farvevariationer. Planter bliver
halvgennemsigtige tæt på spilleren. Flod/lava er scenery uden skjult skade.
Spilleren har en tydelig blågrøn pil og ring; farlige dyr har rødt artsnavn,
fredeligt bytte grønt. Elitevogtere har ★, sjældent bytte ✦ og bosser ◆.

| Spilbar art | DNA-unlock | Spillestil | Shift |
|---|---:|---|---|
| Compy | Gratis | 80 liv, hurtige bid, 175 fart | Kort beskyttet undvigelse |
| Utahraptor | 25 | 100 liv, balanceret, 155 fart | Springangreb med én kløetræffer pr. dyr |
| Carnotaurus | 60 | 125 liv, tunge bid, 140 fart | Fastlåst stormløb med kontaktskade; ingen immunitet |
| Ankylosaurus | 85 | 150 liv, langsom, 110 fart | Panserstilling: 75 % mindre skade i ét sekund |

Ankylosaurus' normale angreb er et haleslag omkring hele kroppen. Alle arter
har fælles upgrades/mutationer og deres egen mutationspulje. Eksempler:
Compy jagter fredeligt bytte bedre; Utahraptor får blødning/baghold/springkløer;
Carnotaurus kombinerer ekstra stormløbsskade og genvundet stamina;
Ankylosaurus kombinerer pigpanser, bred hale og heling under forsvar.
Overlevelsesraseri virker sammen med fælles panser/heling ved lavt liv.
Der er intet standard-giftbid. Artsvalg og unlocks gemmes sammen med eksisterende
DNA, indstillinger og upgrades; mutationer nulstilles ved en ny jagt.

Hvert kort har seks udforskningssteder: to fossiler, to reder og to sjældne
byttedyr. Fossiler giver 3–6 permanent DNA via E. Reder pauser spillet og lader
dig vælge sjældent kød eller gå videre. Kød vækker en allerede placeret
elitevogter. Eliter har 1,6× liv, 1,3× skade, bedre kød og garanteret ekstra
DNA. Belønninger fra et sted kan kun tages én gang. Minikortet viser steder,
når du kommer inden for 550 pixels, og fjerner dem efter fuldførelse.

## Kampfeedback og alle fire bosser

Træffere giver kort hit-stop, blod/støv, skadetal, en kontaktlyd og valgfri
kamerarystelse. Pause, mutationer og redevalg fryser også alle effekter.
Alle bosser får en varslet fase 2 ved halvt liv; angrebsvarsler låser sigtet.
Efter et angreb har de recovery, hvor bid mod flankerne giver +50 % skade.

- Carnotaurus: stormløb og bid; fase 2 dobbelt stormløb og tramp.
- Deinosuchus: bagholdslunge, gab og halebølge; fase 2 hurtigere lunge og
  større bølge, som kort sænker bevægelseshastigheden.
- Triceratops: hornstorm, hornstød og tramp; fase 2 dobbelt hornstorm.
  Stormløb mod en klippe giver længere recovery.
- T. rex: jordrystelse, kæmpebid og brøl; brøl koster stamina og sænker farten.
  Fase 2 giver et ekstra bid med nyt varsel.

Bosser giver stadig 15/20/25/30 garanteret DNA og åbner næste biome.
Røde varsler viser den faktiske cirkel, bidkegle eller stormløbscapsule.
Kerneregler og UI er testet i standalone Chromium og en officiel GDevelop
5.6.283 GDJS-eksport; se `roguelite_runtime_report.json` og tests/roguelite*.

## Dinosaurernes tidsperioder

Spillets blanding er et fantasiunivers. Compsognathus levede i sen Jura
(ca. 150 millioner år siden), Utahraptor i tidlig Kridt, og de øvrige arter
her i sen Kridt. T. rex, Triceratops og Ankylosaurus overlappede i det vestlige
Nordamerika nær slutningen af Kridt (ca. 68–66 millioner år siden).
Carnotaurus levede i Sydamerika; Deinosuchus var en krokodilleslægt, ikke en
dinosaur. Alle arterne mødtes derfor ikke i ét historisk økosystem.

## Status og næste arbejde

Dette er en spilbar udviklingsversion, ikke et færdigbalanceret produktionsspil.
Progressions- og browserkontroller gennemfører bossforløbet med kontrollerede
testtilstande; de erstatter ikke en fuld menneskelig gennemspilning.

Næste arbejde er menneskelig kampbalance/spiltest, bedre pathfinding, unikke
biomefarer og menneskelig finjustering af de fire bossmønstre, fysisk mobiltest samt visuel gennemgang
af animationerne. Musikken er et kort genereret loop; længere kompositioner og
endelige effektlyde er en senere lydopgave. Highscores er lokale; online-score
kræver backend og validering.

Alle billeder beholder deres prototype-status. De øvrige enemy-billeder er South-
stillbilleder; de fire nye serier er animerede prototype-studier. De nye player-serier har særskilt genererede North-frames. Historiske drejede
North-studier er bevaret som reference.
Se `SPRITE_RULES.md`, `manifest.json`, `palette.json`, `validation_report.json`
og `integration_report.json`. Ingen kildepixels eller origins ændres.

## Komplette spilleranimationer og jagtadfærd

Compy, Utahraptor, Carnotaurus og Ankylosaurus bruger nu 480 nye PNG-frames:
4 idle, 6 gang, 6 løb, 6 angreb, 2 skade og 6 død i hver af fire retninger.
Angreb rammer på frame 3; Ankylosaurus svinger halen. Native canvas er 144×144
med transparent plads til haler; kropshitboxes er uændrede. Pause fryser alle
frames. Død afspiller én gang og bliver på sidste frame.
[Review med alle frames og loops](player_full_review.html),
[regler](SPRITE_RULES_PLAYER_FULL.md) og [runtime-test](player_full_runtime_report.json).
De 24 ældre Utahraptor-bidframes og alle øvrige originale PNGs er bevaret.
De nye serier er komplette animationsstudier i pixelstil; små variationer i
anatomi, markeringer og registrering kræver stadig visuel finjustering.

Efter en træffer har et dyr 0 % chance for at opgive jagten i 8 sekunder.
En ny træffer nulstiller perioden. Derefter stiger opgivelseschancen med afstand
(over 160 pixels) og tid siden sidste angreb. Dyret søger hjem med 4 sekunders
beskyttelse mod straks at starte jagten igen; et nyt angreb provokerer det igen.
Bosser og allerede varslede angrebsforløb afbrydes ikke af opgivelsesrollen.
Byttedyr stopper flugten ved cirka 110 pixels fra en stillestående, uforstyrret
spiller og vender mod spilleren. Bevægelse eller en nylig træffer øger deres
flugtafstand til 260 pixels. Adfærdsroller bruger en separat RNG fra loot.

`npm run validate:player-full` kontrollerer 480 frames/96 serier, alpha, palette,
padding, faste origins, kildehashes og forskellige frames. Teknisk PASS er
ikke en produktionsgodkendelse af grafikken.

## Animeret junglemenu og biomeøkologi

Menuen har tre lag parallax, lysstriber, Compy-flokke og passerende Utahraptor,
Carnotaurus og Ankylosaurus. Menuens ur er separat fra simulationen og følger
reduceret-bevægelse-indstillingen. Ved pause/mutationsvalg fryser vegetationens
og insekternes bevægelse med resten af verdenen. Musik- og effektvolumen virker
som hidtil; nye insekter er visuelle detaljer uden nye lydfiler.

18 nye props: cycad, to bregner, nåletræ, padderok, siv, buske, urt, tørt græs,
mos, lav, rødder, svampe, blade, blomster, sukkulent og kviste. Tre insektarter
har to poses hver. Flodbiomet får siv tæt ved vandet og guldsmede; klippelandet
har tør vegetation, og vulkanbiomet begrænser planter til områder væk fra lava.

Alle normale spawns, rede-/byttedyr og reinforcement/bossspawns kontrolleres mod
artspuljer og lokale habitater. Deinosuchus spawner38–135px fra flodens centerlinje;
landdyr mindst85px fra centerlinjen. Intet dyr spawner nærmere90px fra lavaens
centerlinje. Dyrene kan fortsat bevæge sig efter jagten; reglerne gælder spawn.
Klippelandet har også almindelige Triceratops. Fantasiblandingen af tidsperioder
er bevaret; farver og botaniske detaljer er stiliserede, ikke fossilrekonstruktioner.

Arterne bruger faste palette-substitutioner til grøn Compy, teal Utahraptor,
okker Carnotaurus og slate Ankylosaurus; original-PNGs bevares. Deinosuchus/T.rex
har nu32px torso-radius, Triceratops28px. Første Carnotaurus-boss tegnes2× med42px
torso og et tilsvarende kontaktvarsel. Tails påvirker aldrig collision. Størrelser
er gameplay-proportioner; [audit](sprite_size_audit.json) viser radier og forbehold.

[Grafisk review](ecology_review.html) viser native billeder på begge baggrunde
og original/spilfarver. Se SPRITE_RULES_ECOLOGY.md, ecology_manifest.json,
ecology_validation.json og jungle_runtime_report.json. Kør
`python tools/export_ecology.py`, `npm run validate:ecology`,
`node tools/audit_sprite_sizes.cjs`, derefter `npm run build:game`.
