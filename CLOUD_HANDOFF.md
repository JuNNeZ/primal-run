# Fortsæt PRIMAL RUN i cloud

Repository: https://github.com/JuNNeZ/primal-run — privat.

## Aktuel udviklingsversion

Det nye spil ligger i **PRIMAL_RUN_Game**. Se mappens README.md og
DEVELOPMENT_PLAN.md. `project.json` kan åbnes i GDevelop 5; det bruger
JavaScript-events med en fælles spilkerne og canvas/HTML-menuer.
En rigtig GDevelop 5.6.283 HTML5-eksport er testet i Chromium. Prototype_Kit er
bevaret som assetpakke; ældre demoer og den oprindelige overdragelse ligger i
`archive/`.

Start browserudgaven med `npm run preview` og åbn
`/PRIMAL_RUN_Game/index.html`. Kør `npm run test:game` efter kodeændringer
og `npm run build:game` for at opdatere det genererede GDevelop-event.
`npm run build:web` samt den manuelle Pages-workflow klargør publicering.
Ingen GitHub-push eller deployment er foretaget automatisk.

## Tilslut i Codex

Vælg repositoryet i din cloud-environment-opsætning og giv GitHub-integrationen
adgang til dette private repository, hvis det ikke vises. Lad Codex klargøre og
teste environmentet, gennemgå resultatet og publicér environmentet, før du starter
en opgave. Denne GitHub-upload aktiverer ikke i sig selv et Codex-environment.

Ved manuel setup kan `bash tools/cloud-setup.sh` installere dependencies og køre
vores checks. Det kræver netadgang under installation og rettigheder til at
installere Chromium-systemafhængigheder. Brug allerede installerede afhængigheder
eller få environmentet klargjort via UI, hvis installationen er begrænset.

Officiel dokumentation, kontrolleret 5. oktober 2026:
https://learn.chatgpt.com/docs/cloud

## Prompt til en ny session

> Fortsæt PRIMAL RUN fra `integration/next`. Læs AGENTS.md og CLAUDE.md først.

Den tidligere dato-log fra oktobers første uge ligger nu i [archive/docs/CLOUD_HANDOFF_log_2026-10.md](archive/docs/CLOUD_HANDOFF_log_2026-10.md).
