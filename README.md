# PRIMAL RUN

Privat arbejdsrepository til et top-down dinosaur-roguelite i pixel art.

Den aktuelle kerne er **PRIMAL_RUN_Prototype_Kit**: 104 individuelle PNG-assets,
otte WAV-placeholderlyde, en browserdemo og lokale GDevelop-byggeguides.
Demoen har fire bevægelsesretninger, bite, HP, fjender, XP, mutationsvalg/stacks,
pounce/stamina, death/restart og lokal DNA.

## Start

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
animationer. Der er endnu ikke et GDevelop `project.json`, og GDevelop-runtime
er ikke testet. Se sprite-regler og rapporter for de præcise begrænsninger.
