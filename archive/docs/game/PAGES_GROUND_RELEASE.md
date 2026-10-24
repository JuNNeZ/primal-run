# Ground i hovedmenu og Pages

Jonas har 10. oktober 2026 bedt om push og live-udgivelse.

Hovedmenuens levende verden bruger `drawMenu → draw → background` med samme
`nativeGround`-renderer som spillet. `tests/native-ground-browser.cjs` kontrollerer
nu eksplicit, at hovedmenuen viser native ground før spilstart.

Den udgivne Pages-version på `2ac7ad1` indeholdt endnu ikke ground-opdateringen.
Denne release samler grafik-/atlas-arbejdet med `integration/next @ 286b74c` og
bevarer Claudes nye advarselstekst, titler, håndoff og balance-dokumentation.

`tools/build_web.cjs` versionerer scripts, stylesheet og runtime-asset-URL'er
med en hash af kode og atlasbilleder. Gamle cached atlasbilleder bliver derfor
ikke blandet med nye frame-koordinater. `release.json` identificerer versionen
og source-commit ved CI eller med `PRIMAL_RELEASE_COMMIT` ved lokal udgivelse.

`pages_build_runtime_report.json` dokumenterer kontrol af den konkrete lokale
Pages-build: menu-ground, versionerede requests, start/pause og ingen manglende
ressourcer eller JavaScript-fejl. GDevelop-editor-eksport er ikke kørt.

Natgradienten bruger multiply-blanding, så natlyset også dæmper den mørkere
feathered-ground i stedet for at løfte de dybeste skygger. Det eksisterende
B2-check kræver fortsat mindst 25 % mørkere skærmkant ved fuld nat.
