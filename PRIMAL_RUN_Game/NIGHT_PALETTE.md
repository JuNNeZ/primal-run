# A6 – native natpalet · 12. oktober 2026

Fortsættelse fra `integration/next`. A1–A5 er allerede implementeret; Jonas har
godkendt leverancen og push. Originale, forkastede og aktive spritefiler bevares.

Natvarianten skifter de 32 farver i `palette.json` til en mørkere rampe inden for
samme palette. Ingen nye tegninger, beskæringer, skaleringer eller animationer.
`PrimalCore.NIGHT_PALETTE` er den konkrete mapping. Manifestet ligger i
`night_palette_manifest.json`, og `night_palette_review.html` viser native
1×/4× på lys/mørk baggrund. Species-paletten og valgt
skin anvendes først, derpå natpaletten: classic, male, elite, albino og fishKing.
Levendes gang/angreb/idle og sårede poses samt ådsler/skeletter deler den samme
regel. Alpha, native dimensioner og origins bevares.

`FEATURES.nightPalette` kan slå skiftet fra; `FEATURES.dayNight=false` bruger
også den uændrede dagsgrafik. HUD, terrain, pickups og VFX beholder deres farver;
den eksisterende B2-lys-overlay styrer omgivelserne. Natcache indeholder højst
128 native frames og ryddes ved skift af bane/art. Det kræver ingen PNG-requests.
Hit-flash bevarer sine lyse farver. Rendering ændrer ingen AI, skade eller balance.

`tests/night-palette.test.cjs` kontrollerer den faste palette.
`tests/night-palette-browser.cjs` kontrollerer de faktisk tegnede spritepixels,
skin-komposition, alpha/origins, tilbagevenden til dag, begge feature-flags,
cachegrænsen og pause. Rapport og desktop/390px screenshots ligger i
`night_palette_runtime_report.json` og `previews/night_palette/`.
Det er standalone Chromium; en ny GDevelop GDJS-eksport er ikke kørt.

A6 er stadig delvist åben: nye mad/DNA/zone-HUD-chips og et komplet
lava/aske-overgangssæt mangler. Godkendte sol/måne, basaltpassager og askeskyer
fra presentation-pakken forbliver aktive. Denne leverance publicerer ikke gh-pages.

Verifikation: 249 unit-tests, alle 31 spil-browser-suiter og tre kit-checks
består, kørt i en separat kopi. En kendt zone/rede-race i browserfixturet
er isoleret, og den rettede suite samt resten af testkomponenterne består.
Asset- og sourcechecks består også. Se
`../docs/validation/A_SERIES_2026-10-12.json` med manifester og logs.
