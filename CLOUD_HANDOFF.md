# PRIMAL RUN — aktuel cloud-overdragelse

Arbejd i `/workspace/primal-run`, branch `codex/primal-run-playable`.
Aktivt spil: **PRIMAL_RUN_Game**. Demo: https://junnez.github.io/primal-run/.
`gh-pages` indeholder web-build; kildebranchen indeholder kode og rå spriteark.
Brug det eksisterende isolerede checkout. Opret ikke et ekstra worktree.

## Læs kun det relevante

AGENTS.md ruter til fire korte skills i `.agents/skills` og den relevante
sprite-families regel. SPECIES_ANATOMY.md er den fælles anatomitabel.
Nuværende ændringer/status: PRIMAL_RUN_Game/FEATHERED_STARTER_AND_TERRAIN.md.
Balance: PRIMAL_RUN_Game/balance_runs/EVOLUTION_RESULTS.md.
Historiske milestones er bevaret i CLOUD_HANDOFF_HISTORY.md; læs dem kun ved
undersøgelse af en konkret ældre regression.

## Workflow

Node24, Python3 med requirements.txt, npm-lockfile og Playwright er nødvendige.
Cloudens installerede Chromium findes på `/usr/bin/chromium`; sæt
`PRIMAL_CHROME_PATH` ved tests. `tools/cloud-setup.sh` er installationshjælpen.
Native Git bruger den injicerede HTTPS-proxy; et manglende GH_TOKEN er ikke i
sig selv et loginproblem. Udskriv aldrig tokens eller hele miljøet.

Editér `src/core.js`, `src/app.js`, `src/audio.js` og style.css. Rebuild med
`npm run build:game`; project.json er genereret. `npm run build:web` laver dist.
`PRIMAL_CHROME_PATH=/usr/bin/chromium npm test` tester kerne/browser/kit.
Kør tests i en midlertidig kopi med node_modules-link, da ældre reports/screenshots
ellers overskrives. Bevar eksisterende brugerændringer og Source_Generated-ark.
Nyeste standalone-evidence: evolution_validation_report.json og evolution_*-reports.
En historisk officiel GDJS5.6.283 eksport er bevaret; den nye version er ikke
friskeksporteret/testet i den rigtige GDevelop-motor. Enginebinærer er ikke tilgængelige.

## Aktuel kontrakt

11 spilbare arter; nye saves starter som Deinonychus. Bevar tidligere artsvalg,
DNA, upgrades og highscores. Alle arter har personlige mutationer i fem rarities;
den fælles pool er stadig tilgængelig. Space bekræfter aldrig mutation/næste bane.
Otte baner og navngivne bosser; biome-index og level-index er forskellige.
Seed1993 er en separat én-bane-secret. Meteorfinalen er en vundet jagts afslutning,
med bevaret DNA/score og reduced-motion-visning.

Alle genererede ark og tiles er **prototype_static**, ikke produktionsgodkendte.
Source_Generated indeholder både aktive og forkastede revisioner. Tekniske tests
certificerer ikke anatomi, loop-kvalitet, metrisk skala eller seamless terræn.
