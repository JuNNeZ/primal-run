# Validering af første spilbare version

Testet i cloud med Node 24, Python 3.12, Playwright og system-Chromium.
GDevelop blev hentet fra den officielle **5.6.283 Linux-portable release**.
Eksporten bruger dens libGD.js/libGD.wasm og GDJS, ikke en efterligning af motoren.

| Kontrol | Resultat |
| --- | --- |
| 11 Node-tests: kamp, kontaktstyret bid, opsamling, mutationer, DNA, bossforløb, shop, pause/død, lagringsfejl og genereret projekt | PASS |
| Browser: navn/menu, lydindstillinger, musikstart, tastaturbevægelse, bid og kød | PASS |
| Browser: pause/options/resume, mutationer, fire bossovergange og sejr | PASS |
| Browser: DNA-shop, reload, highscore, død/restart og blokeret localStorage | PASS |
| Samme funktionstest i rigtig GDevelop GDJS HTML5-eksport | PASS |
| Samme funktionstest i webpakken under `/dist/` URL-prefix | PASS |
| Enkel mobilkontrol ved 390×844: start, touch-bevægelse og release | PASS |
| Tre eksisterende Prototype Kit-browserkontroller via lokal HTTP | PASS |
| Prototype Kit-validator: 104 PNG-assets | PASS |
| Original sprite-validator: 176 PNG-assets | PASS |
| Integration: 104 byte-identiske kopier, manifest-origins og prototype-status bevaret | PASS |
| GDevelop indlæsning, serialiseringskontrol og HTML5-eksport | PASS |
| 24 nye native128×128 attack-PNGs: palette, alpha, padding, source-hash og origins | PASS |
| Alle seks faktisk tegnede attack-frames i fire retninger, pause/idle-retur og fast hitbox | PASS i browser og GDevelop |
| Kontakt-only skade én gang, låst angrebsretning under bevægelse og recovery | PASS i browser og GDevelop |
| Gentaget projektgenerering giver identisk project.json | PASS |

Browserforløbene kontrollerer også, at ressourcer indlæses uden HTTP-fejl og
uden JavaScript-pageerrors. De sætter kontrollerede kødmål og bossliv for at
teste overgangene; ingen påstand om en naturlig gennemspilning eller færdig
kampbalance. Musikstart/indstillinger er teknisk testet; lytte- og miksreview
er fortsat nødvendigt.

Historiske rapporter og screenshots blev bevaret ved at køre de skrivende
kit-tests i en midlertidig kopi. Originale sprites og kildebilleder blev ikke ændret.
PNG-tests og runtime-tests godkender ikke anatomi, perspektiv eller animationer.

## Gentag kontrollerne

```sh
npm run build:game
npm run test:game
npm run validate:game-sprites
python PRIMAL_RUN_Prototype_Kit/tools/validate_kit.py
```

Til GDevelop-kontrollen eksporteres projektet med GDevelop eller
`tools/export_gdevelop.cjs`, hvorefter eksportmappen serveres over HTTP:

```sh
PRIMAL_GAME_URL=http://127.0.0.1:8013/index.html \
PRIMAL_EXPECT_GDEVELOP=1 node tests/game-browser.cjs
```

Ved behov vælges system-Chromium med `PRIMAL_CHROME_PATH=/usr/bin/chromium`.
Den gamle cloudblokering af `file://` er løst ved at bruge HTTP i kit-testene.
GitHub Actions/Pages og GDevelops editor-UI er ikke kørt eksternt; testen
indlæser og eksporterer projektet gennem den samme GDevelop-core og afvikler
den eksporterede runtime i Chromium.
