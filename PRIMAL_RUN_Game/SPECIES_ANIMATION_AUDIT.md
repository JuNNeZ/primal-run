# Animationer og artsidentitet · 12. oktober 2026

**Grundplanen er komplet; kildegrafikken er ikke fejlfri.** Audit af de aktive
spiller-/NPC-valg finder 13 arter, 312 state/retningsserier og 1.560 poses uden
manglende eller runtime-deaktiverede frames. Alle arter har idle4, walk6, run6,
attack6, hurt2 og death6 i S/E/N/W. Origins er faste inden for serien, og ingen
serie indeholder en utilsigtet byte-identisk gentagelse af et tidsframe.
Angreb er én state; våbnet følger arten (kløer/kæber/horn/halekølle/kuppel/næb/spark).

Se [fælles afspiller](species_animation_review.html),
[native artsoversigt](previews/animation_audit/species_identity_1x.png),
[raptorer ved lignende synlig størrelse](previews/animation_audit/raptor_identity_integer.png)
og `species_animation_audit.json`. Review bruger samme native144 canvas og
deklarerede hofter; ×2/×4 i raptoroversigten er kun heltals-preview, ikke en
ændring af spillets skala. Afspilleren viser 1×/4×, alle retninger, lyse/mørke
baggrunde, arts-/original-/natfarver, pause/frame-step og walk→attack→walk.
Reviewangreb afspilles illustrativt over0,5s; spillets varighed afhænger af arten.

## Rettede kodefejl

- Slutscenens angriber viste kun frames0–2 i sit0,5s angreb. Den spiller nu
  frames0–5 i rækkefølge; løb bruger12fps frem for6fps.
- Flokkens Velociraptorer brugte6fps for både gang og løb. Deres separate
  pause-/stop-sikre gaitPhase følger nu8fps gang og12fps løb, beholder fodfasen
  ved state-skift og bruger samme low-health frameholds som almindelige dyr.
- Flok-idle og sejrsscenens idle respekterer stableIdle. De holder pose0,
  ligesom øvrige aktører, så de ufuldstændigt koordinerede idle-studier ikke
  introducerer ekstra wobble.

Angrebsvarighed, skade, kontakt, AI, loot, collision og artsskala er bevaret.
`tests/animation-continuity-browser.cjs` kontrollerer faktisk tegnede frames
ved30/60fps, flok-gang/løb/idle, pause og alle review-states/retninger.
`tests/animation-continuity.test.cjs` kontrollerer simulationens fodfase.

## Grafiske fund, som stadig kræver kildepolering

| Prioritet | Fund | Konkret review |
|---|---|---|
| Høj | T. rex North har smal krop i bevaret idle/attack/death og anden kropsfylde i revideret walk/run. Det giver et synligt kryds-state skift. | `tyrannosaurus`, N, idle→walk→attack; `previews/animation_audit/tyrannosaurus_gait.png` |
| Høj | Deinonychus South hurt-poses flytter den synlige kropsmasse tydeligt. Fast eksportorigin beviser ikke, at den tegnede hofte er fast. | `deinonychus`, S, hurt0→1 og walk→hurt |
| Mellem | Separat genererede Triceratops/Pachy/Galli/Para-angreb har variation i krop/markeringer i forhold til grundsættet. Anky genbruger de oprindelige24 halesving. | Afspillerens walk→attack→walk i alle fire retninger |
| Mellem | Flere gang-/løbs-/idle-loops har store ændringer i silhouettecentrum, især Carno S, Triceratops N, Pachy N og T. rex S. Man skal skelne halebevægelse fra faktisk hoftejitter. | `species_animation_audit.json` → review_candidates, samt de native gait-grids |
| Mellem | Raptorernes farver er forskellige, men silhuet og faste markeringer skal fortsat kontrolleres gennem alle states; farve/skala alene er ikke en identitetsgodkendelse. | S/E/N/W i raptoroversigten og fælles afspiller |

Automatiske area-/centroid-/loop-målinger er **review-kandidater**, ikke en
fejlliste eller en garanti for sidestepfri animation. Tail swing, bevægelige ben,
angreb og fald kan legitimt ændre silhouetten. Der er ikke centreret sprites
efter bounding box, interpoleret lemmer eller ændret anatomy/source art for at
skjule forskelle. Korrigér de faktiske source-hips eller tegn artsrefererede
revisioner med image generation, behold raw/rejected kilder, og kør familie-
export/validator samt native/runtime-review igen. Følg
`../PRIMAL_RUN_Sprites/SPRITE_RULES.md` og `SPRITE_RULES_PLAYER_FULL.md` /
`SPRITE_RULES_ENEMY_FULL.md` / `SPRITE_RULES_SPECIES_ATTACKS.md`.

## Artskontrakt

| Art | Farver / genkendelige træk |
|---|---|
| Compy | Mosgrøn; meget lille, spinkel biped, smalt hoved og tynd hale |
| Utahraptor | Teal/blå, lyse markeringer; robust raptorkrop, bredere hoved og tydelige fjerformer |
| Velociraptor | Oliven/creme; spinklere raptor, smal/lang snude, lettere lemmer og hale |
| Deinonychus | Kastanje/creme; tydelige lyse fjerpartier på arme/hale, mellemstor raptor |
| Carnotaurus | Okker/brun; præcis to brynhorn og meget små arme |
| Ankylosaurus | Skifer/grå; bred firbenet panserkrop og halekølle |
| Parasaurolophus | Oliven/creme; én lang bagudvendt kam, artskorrekt bagbensspark |
| Triceratops | Sten/creme; nakkeskjold, to brynhorn og ét kortere næsehorn |
| T. rex | Brun; stort hoved og robust krop, små tofingrede arme, ingen horn |
| Pachycephalosaurus | Jord/creme; rund kraniekuppel, ingen Carno-horn |
| Gallimimus | Jord/creme med grå partier; slank hals, næb, lange lette ben |
| Baryonyx | Mørk teal/grå; lang smal fiskefangerkæbe og stor tommelfingerklo |
| Deinosuchus | Mørkgrøn; lav lang krokodillekrop, fire spredte ben og lang kæbe/hale |

Utahraptor må ikke leveres som en opskaleret/recoloured Velociraptor. Lås artens
kanoniske master, proportioner, markeringer og head/limb-landmarks før nye poser.
Sammenlign ved omtrent samme synlige størrelse med heltals-preview samt i spillet;
godkend ikke identitet ud fra et forskelligt filnavn, palette eller collisionradius.
Ingen aktive frames er præcise cross-species RGBA-kloner; det beviser alene pixel-
forskelle. Tæt silhouette-/anatomisk lighed kræver stadig menneskeligt review.

## Scope og verificering

Grundplanen gælder dinosaurer, ikke statiske HUD-/terræn-sprites. Ekstra
fødesøgning/drik/søvn/kradsning er diæt-/situationsbestemt; deres eksisterende
native fallback-/rejected-rapporter gælder fortsat. Stable idle er med vilje
statisk i live-spillet, selv om fire study-poses eksisterer. Ikke-dødelige
flokfæller bruger idle/walk/run/attack; hp er allerede clamped ved1, så de har
ingen døds-state i AI'en. Der er ikke ændret gameplay for at påtvinge en dødsanimation.

Kør `npm run validate:animation-audit` og `npm test`. `build:game` regenererer
audit/report og review-data og stopper ved manglende grundframes eller ustabilt
deklareret origin; CI kører også auditten. Kildepolering markeres særskilt og
bliver aldrig automatisk en visuel godkendelse. Resultater og aktuelt
testlog findes i `animation_continuity_runtime_report.json` samt
`../docs/validation/SPECIES_ANIMATION_AUDIT_2026-10-12.json`.
Tekniske checks og standalone Chromium er adskilt fra anatomisk godkendelse og
faktisk GDJS-runtime. Art forbliver prototype_static; intet er produktionsgodkendt
på baggrund af denne audit, og en ny GDJS-eksport er ikke kørt.
