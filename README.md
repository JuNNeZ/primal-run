# PRIMAL RUN

Privat arbejdsrepository til et top-down dinosaur-roguelite i pixel art.

Den aktuelle kerne er **PRIMAL_RUN_Prototype_Kit**: 104 individuelle PNG-assets,
otte WAV-placeholderlyde, en browserdemo og lokale GDevelop-byggeguides.
Demoen har fire bevægelsesretninger, bite, HP, fjender, XP, mutationsvalg/stacks,
pounce/stamina, death/restart og lokal DNA.

## Åbn GDevelop-projektet

**Ny leverance:** [GDevelop/project.json](GDevelop/project.json) kan åbnes direkte i
GDevelop 5.6.283. Læs [START_HER](GDevelop/START_HER.md) og
[testet status](GDevelop/STATUS.md). Native Game-scene, movement/bite, fjender,
HP/mad, XP, tre mutationer/stacks, pause, death/restart og lokal DNA er bygget.
Faktisk GDevelop-serializer, HTML5-export og Chromium-runtime er testet i cloud.
Desktop-editorens UI og produktionsanimationer er ikke godkendt.

## Start browserreferencen

Åbn `PRIMAL_RUN_Prototype_Kit/START_HER.html` i en browser efter download/clone.
Eller kør `npm run preview` og gå til
`http://localhost:8000/PRIMAL_RUN_Prototype_Kit/START_HER.html`.

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
```

På Windows kan de installerede Chrome-filer bruges automatisk. En anden browsersti
kan sættes med `PRIMAL_CHROME_PATH`. På Linux/cloud bruges Playwright Chromium.
GitHub Actions kører asset- og browserkontroller ved push og PR.

Tidligere V2–V5-pakker og konceptudklip er bevaret som referencer. Arbejd videre
i Prototype_Kit; regenerér ikke historiske pakker uden en konkret grund.
ZIP-filer, som kan genskabes lokalt, er udeladt fra Git.

Alle assets er prototyper. Action-poser og enemy-stillbilleder er ikke færdige
animationer. Det oprindelige kit er stadig en assetpakke/browserreference. Det nye native
projekt ligger separat i GDevelop/; dets runtime-rapporter gælder kun denne
leverance. Se sprite-regler og STATUS.md for de præcise begrænsninger.
