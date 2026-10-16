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

## Grafiske rettelser efter auditten

Den konkrete kilderevision findes i [ANIMATION_POLISH.md](ANIMATION_POLISH.md).
Store pose-/rækkeplaceringer er rettet ved eksplicitte anatomiske punkter og
heltalsforskydninger; Deinonychus South hurt og Parasaurolophus' spark er lokalt
revideret. Triceratops/Pachy/Galli/Anky bruger nu matching native våbenposes.

Den tidligere beskrivelse af blandede T. rex North-kilder var forkert. Den
aktive serie bruger ét samlet North-revisionsark; den konkrete placering mellem
states er kontrolleret og korrigeret. Der er ikke tegnet en ny T. rex-krop.

Automatiske area-/centroid-/loop-målinger forbliver review-kandidater. Halebevægelse,
ben, angreb og fald ændrer legitimt silhouetten. Se den separate native kilde-,
registrerings- og runtime-evidens; metrics alene er ikke visuel godkendelse.

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
`../archive/docs/validation/SPECIES_ANIMATION_AUDIT_2026-10-12.json`.
Tekniske checks og standalone Chromium er adskilt fra anatomisk godkendelse og
faktisk GDJS-runtime. Art forbliver prototype_static; teknisk audit er ikke produktionsgodkendelse.
Den efterfølgende native/standalone/GDJS-kontrol registreres separat i
ANIMATION_POLISH.md og dens runtime-rapporter.
