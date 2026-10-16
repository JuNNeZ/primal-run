# PRIMAL RUN

Arbejdsrepository til et top-down dinosaur-roguelite i pixel art.
Live: https://junnez.github.io/primal-run/ (branchen `gh-pages`).

Det aktive spil er **[PRIMAL_RUN_Game](PRIMAL_RUN_Game/README.md)**: 21 spilbare arter,
otte tilfældige baner i fire biomer med navngivne bosser, en hemmelig askebane efter
bane 8, mutationer, DNA-lab og permanente unlocks, lokale rekorder og titler,
sværhedsgrader, PC-HUD-layouts og 24 sprog. Den fælles spilkerne (`src/core.js`)
kører både i browseren og i et genereret GDevelop 5-projekt (`project.json`).

## Branches og udgivelse

- Udvikling sker på `integration/next`; `main` får kun releases.
- Claude arbejder på `claude/*`, Codex på `codex/*`; begge laver draft-PR'er mod `integration/next`.
- Live-siden opdateres kun, når Jonas skriver "udgiv". Fremgangsmåden står i
  [CLAUDE.md](CLAUDE.md) under "Going live".
- Nye funktioner ligger bag `FEATURES.<flag>` i `PRIMAL_RUN_Game/src/core.js`.

## Start lokalt

```sh
python -m pip install -r requirements.txt
npm ci
npm run preview   # http://localhost:8000/PRIMAL_RUN_Game/
```

## Tests og bygning

```sh
node --test tests/*.test.cjs          # hurtige enhedstests
npm run test:game                     # enheds- og browsertests af spillet
npm run validate:game-sprites
npm run validate:enemy-sprites
npm test                              # alt inkl. atlas-værktøjer og Prototype Kit
python tools/rebuild_generated.py     # genererede filer efter merge
npm run build:web                     # webudgaven i dist/
```

I cloud bruges Playwright Chromium (`PRIMAL_CHROME_PATH=/opt/pw-browsers/chromium`).
Browsertests omskriver tracked `*_report.json` og `previews/*.png`; gendan dem med
`git checkout`, medmindre ændringen er tilsigtet. Balance simuleres med
`npm run simulate:styles` eller `SIMULER_BALANCE.bat` på Windows.

## Mapper

| Mappe | Indhold |
| --- | --- |
| `PRIMAL_RUN_Game/` | Spillet: `src/`, assets, lyde, GDevelop-projekt, sprite-regler og feature-dokumenter |
| `tests/` | Node- og Playwright-tests |
| `tools/` | Byggeværktøjer, eksportører, validatorer, balance-simulator, i18n-pipeline, rig-animator |
| `PRIMAL_RUN_Prototype_Kit/` | Bevaret assetpakke; `npm run build:game` kopierer dens assets |
| `PRIMAL_RUN_Sprites/` | Projektets sprite-regel (`SPRITE_RULES.md`) og de oprindelige sprites |
| `PRIMAL_RUN_Art_Handoff/` | Kildekunst til præsentation og ground-reuse |
| `docs/` | Design- og opgavenoter |
| `archive/` | Pensionerede demoer, engangsscripts og daterede rapporter ([oversigt](archive/README.md)) |

## Videre læsning

- [Spillets vejledning](PRIMAL_RUN_Game/README.md) og [udviklingsplanen](PRIMAL_RUN_Game/DEVELOPMENT_PLAN.md)
- [AGENTS.md](AGENTS.md) og [CLAUDE.md](CLAUDE.md): regler for Codex og Claude
- [CLOUD_HANDOFF.md](CLOUD_HANDOFF.md): opsætning af cloud-miljø
- [Forskning, økologi og balance-CLI](PRIMAL_RUN_Game/RESEARCH_AND_ECOLOGY.md),
  [balance-kørsler](PRIMAL_RUN_Game/balance_runs/README.md)
- [Rig-animatoren](tools/RIG_ANIMATOR.md)

Al grafik er prototype, indtil Jonas har godkendt den visuelt. Automatiske fil- og
runtime-tests godkender ikke stil, anatomi eller animation.
