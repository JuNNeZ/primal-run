# PRIMAL RUN

Privat arbejdsrepository til et top-down dinosaur-roguelite i pixel art.

Det aktive spil er **PRIMAL_RUN_Game**: en spilbar udviklingsversion med
Utahraptor, fire biomer/bosser, kød/levels, mutationer, permanent DNA-shop,
startmenu, lokale highscores, lydindstillinger og original proceduremusik.
Den fælles spilkerne kører i browseren og i et GDevelop 5-projekt.

Fire fjendearter har nu gang/action-studier i fire retninger og forskellig AI.
[Se fjendeanimationerne](PRIMAL_RUN_Game/enemy_review.html).

Utahraptoren har nu et seks-frame bid i hver af fire retninger med skade på
kontaktframen. [Se alle nye player-frames og animationer](PRIMAL_RUN_Game/player_review.html).

**PRIMAL_RUN_Prototype_Kit** er den bevarede assetpakke og tidligere browserdemo
med 104 PNG-assets, otte WAV-placeholderlyde og GDevelop-byggeguides.

## Start

Kør `npm run preview`, og åbn
`http://localhost:8000/PRIMAL_RUN_Game/index.html`.

I GDevelop åbnes **[PRIMAL_RUN_Game/project.json](PRIMAL_RUN_Game/project.json)**
direkte. Behold hele projektmappen samlet. Mekanikkerne bruger JavaScript-events
og redigeres i `src/`; de er ikke individuelle visuelle events i sceneeditoren.
Projektet er indlæst og eksporteret med GDevelop 5.6.283, og eksporten er testet
i Chromium. Se [spillets vejledning](PRIMAL_RUN_Game/README.md) og
[udviklingsplanen](PRIMAL_RUN_Game/DEVELOPMENT_PLAN.md).

`npm run build:web` klargør `dist/` til GitHub Pages. Den manuelle workflow
**Publish PRIMAL RUN to GitHub Pages** publicerer efter opsætning i GitHub.
Den færdige webdemo ligger også på branchen **gh-pages**. Vælg
**Settings → Pages → Deploy from a branch → gh-pages → / (root) → Save**.
Efter GitHubs deployment er adressen https://junnez.github.io/primal-run/.
Publicering er først aktiv, når Pages er slået til i repositoryets indstillinger.

Læs [cloud-overdragelsen](CLOUD_HANDOFF.md), når arbejdet fortsættes på en anden computer.
Den komplette asset-guide ligger i
[HANDOFF.md](PRIMAL_RUN_Prototype_Kit/HANDOFF.md) og
[GUIDE.html](PRIMAL_RUN_Prototype_Kit/GUIDE.html).

## Udvikling og tests

```sh
python -m pip install -r requirements.txt
npm ci
npx playwright install --with-deps chromium
python PRIMAL_RUN_Prototype_Kit/tools/validate_kit.py
npm test
npm run build:game
npm run build:web
```

På Windows kan de installerede Chrome-filer bruges automatisk. En anden browsersti
kan sættes med `PRIMAL_CHROME_PATH`. På Linux/cloud bruges Playwright Chromium.
GitHub Actions kører asset- og browserkontroller ved push og PR.

`npm run test:game` tester den nye spilkerne og browserversionen.
`npm run test:kit` tester den tidligere prototype via lokal HTTP. Kit-testene
skriver rapporter og screenshots; brug en midlertidig kopi, hvis historiske
rapporter skal bevares. `npm run build:game` opdaterer det genererede GDevelop-
event og kopierer kit-assets byte-for-byte; kør det efter ændringer i `src/`.

Tidligere V2–V5-pakker og konceptudklip er bevaret som referencer. Arbejd videre
i PRIMAL_RUN_Game; regenerér ikke historiske pakker uden en konkret grund.
ZIP-filer, som kan genskabes lokalt, er udeladt fra Git.

Alle assets er prototyper. Action-poser og enemy-stillbilleder er ikke færdige
animationer. Den nye GDevelop-runtime er funktionelt testet, men det godkender
ikke grafikkens stil, anatomi eller animationskvalitet. Balance, mobilstyring og
endelige animationer kræver videre spiltest. Se sprite-regler og rapporter.
