# Grafisk polering · 12. oktober 2026

De store kropstranslationer i kildearkene er korrigeret med eksplicit heltalsregistrering.
Deinonychus' South-skadeposes holder nu retningen, og artsangrebene matcher den
kanoniske art bedre gennem gang→angreb→gang. Arternes farver, fjer/panser,
hovedformer, skala og gameplay er bevaret.

## Kilde- og placeringsrettelser

- Carnotaurus, Triceratops, T. rex og Deinonychus: individuelle kropslandmærker
  kontrolleret i native kontaktgrids. Carnotaurus South korrigeret manuelt på
  den centrale ryg/sacrum, hvor et farvepatch-forslag ramte siden af kroppen.
- Øvrige store rækkeplaceringer: samme heltalsforskydning for hele den pågældende
  kilde-række. Dette fjerner store kryds-state spring uden at ændre benenes,
  halens eller faldets oprindelige interne bevægelse.
- Den synlige anatomiske reference holdes på en fast plads i forhold til det
  eksisterende logiske draw-/collision-origin. Offsettet er registreret særskilt;
  det anatomiske punkt og canvascentrum påstås ikke at være identiske.
- Gallimimus og T. rex West flyttes samlet3px mod venstre for at bevare hele den
  lange hale og2px fri kant. Ingen kildepixels klippes eller resizes.
- Sårede keyposes arver den kontrollerede registrering fra deres normale walk2/3;
  deres rå review-eksporter forbliver urørte. Native fallback-poses genbruges
  byte-identisk fra det opdaterede grundsæt. Adfærdsposer følger idle-placeringen.
- Deinonychus South hurt bruger kun to ændrede celler fra en lokal billedrevision.
  De øvrige28 poses udtages fortsat fra den oprindelige master.

Den tidligere forklaring om blandede gamle og nye T. rex North-kilder var forkert.
Den aktive North-serie bruger ét samlet revisionsark. Dens målte kryds-state
placeringsskift er nu registreret; der er ikke tegnet en ny T. rex-krop.

## Artsangreb

Triceratops hornstød, Pachycephalosaurus kuppelstød, Gallimimus næbhug og
Ankylosaurus halesving genbruger96 native angrebsposes med oprindelig rå
kildeprovenance. De separat tegnede mismatching overlays er bevaret som
forkastede generationer i eksportplanen.

Parasaurolophus'24 sparkposes bygger på lokale ændringer af de fire kanoniske
masters. Kontaktposes i N/E/W er yderligere repareret lokalt: én hel hale og
én separat, forbundet bagbensfod. S/E/N/W bevares gennem hele angrebet. Foden
mister ingen pixels ved cellekanten. Eksplicitte kilde-rektangler udelukker
nabocellernes hale-/fodfragmenter; de udfylder aldrig manglende anatomi.

Isolerede kontaktrevisioner bruger den dokumenterede384×256 referenceframing
genereret ved4× kildeopløsning og fast heltalssampling8. Det giver samme native
144-canvas og spilskala; eksporten anvender ingen billed-resize. De øvrige
sparkposes bruger den eksisterende2px kildesampling. Prompts, rå resultater,
forkastelser, kildehashes og source-cell anchors følger pakken i
`Source_Generated/animation_polish` og `Source_Generated/species_attacks/exports.json`.

## Kontrol og afspilning

`animation_polish_validation.json` kontrollerer inverse pixel-forskydninger,
rå kildehashes, faste referencemål, padding, byte-identiske våbenposes og
uafhængig genudtagning af alle lokale angrebsrevisioner. Eksporten stopper, hvis
et registreringspunkt tilhører en anden kildeudtagning, eller pixels ville blive klippet.

`species_animation_review.html` afspiller alle13 arter og deres seks grundstates
i fire retninger via de rigtige atlas-crops. Native lyse/mørke kontaktgrids og
GIF-afspilninger ligger i `previews/animation_polish`. Brug1× og heltals4× til at
bedømme kroppens landmærker og loopets sidste→første pose.

`tests/animation-polish-browser.cjs` driver den faktiske simulation og renderer:
alle12 spillerarter ved normal30/60fps og maksimale attack-speed-modifiers ved60fps,
seks tegnede poses i rækkefølge, frame3 ved kontakt, præcis én træffer, idle recovery
og fuld pause. De andre browserchecks dækker alle spiller-/NPC-frames, såret gang,
adfærd, farver/nat og atlasudtagning. Framerate-kravet betyder ikke, at vilkårligt
korte modifier-angreb kan vise seks forskellige displayframes på en30fps-skærm.

Standalone Chromium og den officielle GDevelop GDJS5.6.283-eksport registreres
separat i runtime-rapporterne. Se `../docs/validation/ANIMATION_POLISH_2026-10-12.json`
for de færdige kørsler. Rå originalmasters og historiske V2–V5/kit-pakker er bevaret.

Dette er en visuelt gennemgået udviklingsrevision. Små tegnede variationer i
silhuet/markeringer findes stadig i genererede study-poses; automatisk pixel-
integritet er ikke en produktionsgodkendelse. `prototype_static` og
`production_approved=false` er bevaret. Følg projektets sprite-regler og
`SPRITE_RULES_PLAYER_FULL.md`, `SPRITE_RULES_ENEMY_FULL.md`,
`SPRITE_RULES_SPECIES_ATTACKS.md` ved senere kilderevisioner.
