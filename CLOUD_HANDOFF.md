# Fortsæt PRIMAL RUN i cloud

Repository: https://github.com/JuNNeZ/primal-run — privat.

## Aktuel leverance til 6. oktober 2026

Åbn GDevelop/project.json med GDevelop 5.6.283. Se GDevelop/START_HER.md og
GDevelop/STATUS.md. Native core + faktisk HTML5-export/runtime er verificeret
i cloud. Historikken nedenfor beskriver udgangspunktet før dette arbejde.
Næste ændringer testes med npm run test:gdevelop og reel engine-export/runtime.
Læs GDevelop/README.md for scripts og officielle formatkilder.

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
