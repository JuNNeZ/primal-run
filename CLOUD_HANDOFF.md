# Fortsæt PRIMAL RUN i cloud

Repository: https://github.com/JuNNeZ/primal-run — privat.

## Aktuel udviklingsversion

Det nye spil ligger i **PRIMAL_RUN_Game**. Se mappens README.md og
DEVELOPMENT_PLAN.md. `project.json` kan åbnes i GDevelop 5; det bruger
JavaScript-events med en fælles spilkerne og canvas/HTML-menuer.
En rigtig GDevelop 5.6.283 HTML5-eksport er testet i Chromium. Den gamle
Prototype_Kit-demo og nedenstående oprindelige overdragelse er bevaret som
historik; der findes nu et GDevelop-projekt.

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

## Prompt du kan indsætte i morgen

> Fortsæt PRIMAL RUN. Læs AGENTS.md, README.md og
> PRIMAL_RUN_Prototype_Kit/HANDOFF.md. Vi bygger en GDevelop-prototype med
> Utahraptor, WASD, bite, fjender, XP, pause ved level-up med 1 af 3 mutationer,
> death og restart. Bevar den fælles pixelstil og alle tidligere assetpakker.
> Browserdemoen er en fungerende reference; der findes endnu ikke et GDevelop
> project.json. Start med at kontrollere assets og køre npm test. Arbejd derefter
> på et konkret GDevelop-projekt til den lille kerne. Hold action-poser som
> placeholders og rapportér GDevelop-test separat fra browser-tests.

## Projektets vigtigste beslutninger

- Semi-realistisk top-down pixel art; native sprites, heltalsplacering, ingen blur.
- Første spillerart er Utahraptor; øvrige arter/bosses er stillbilleder til prototyper.
- V5 gav fire retninger. North er South drejet 180°, inklusive lyset, som midlertidig løsning.
- Noget wobble/markeringvariation består; højere animationshastighed er ikke en løsning.
- Armsilhuetter skal være små brystarme, ikke øre-/fjerfaner ved kraniet.
- Prototype_Kit udvider den gamle 24-farvepalette til et fast fælles sæt på 32 farver.
- Ingen godkendte produktionsanimationer endnu; bevar prototype-status.
- Lokal DNA er kun en browser-lagret tæller; ingen unlock-menu eller konto-sync.

## Næste arbejde

1. Opret et reelt GDevelop-projekt og test movement/idle i alle fire retninger.
2. Tilføj én fjende, bite, XP, pause/valg og death/restart i GDevelop.
3. Kontroller origins, torso-hitbox og blockage/state-skift i den engine.
4. Forbedr walk-kontinuitet og action-registrering efter den fungerende kerne.
5. Bosses, biomes, extinction og længere runs bygges senere.

Cloud-checks kan validere PNG'er og browsermekanik; de erstatter ikke visuel
vurdering eller GDevelop Preview. Brug en `codex/`-branch til næste ændring.

## 2026-10-08: exploration and rarities

Active game now has per-stage world bounds, prepopulated habitats, proximity AI,
offscreen replenishment/boss placement, responsive camera/minimap and distinct
player/hostile/prey labels. Meat has four weighted rarities; mutation cards have
fixed weighted rarities and current → next rank. XP bar includes percentage and
remaining meat value. Jonas unlocks a cosmetic crown/title only. Legacy three
boss species rotate their old South stills in cardinal steps; four newer species
use their direction frames. PNGs and prototype approval status unchanged.

`tests/world-browser.cjs` is included in `npm run test:game`; covers desktop,
portrait, landscape and ultrawide. `PRIMAL_RUN_Game/world_runtime_report.json`
records separate standalone and official GDevelop 5.6.283 checks plus source
hashes. Entire npm test and PNG validators passed in temporary copy, preserving
historical kit outputs. Original 19-case enemy runtime report remains historical
evidence for pre-map timing; use world report for current mechanics.

Pages continues to publish static `dist/` on gh-pages; source development remains
on codex/primal-run-playable. Demo: https://junnez.github.io/primal-run/.
