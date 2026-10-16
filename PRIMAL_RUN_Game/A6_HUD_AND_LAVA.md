# A6 – HUD-ikoner og lava/aske · 12. oktober 2026

Fortsættelse på `codex/a-series-approval-2026-10-12`, PR #8 mod integration/next.
A1–A5 og A6-natpaletten bevares. Denne pakke tilføjer otte native24×24
HUD-ikoner og seksten native32×32 lava/aske-masker med rå kilder, manifester,
native previews og en interaktiv `a6_review.html`. Al ny art er prototype_static.

## HUD

- Mad: kød, planter og fisk vælges efter den eksisterende arts diæt.
- DNA og zone beholder deres tal/navn; en tom zone skjuler hele chippen.
- Flok: følg/fokus og mutation-reroll er forberedt til Part C-kontrollerne.
- `FEATURES.hudIcons=false` eller manglende atlas/PNG bevarer tekstsymbolerne.
- Alle ikoner er dekorative og aria-hidden; de erstatter ikke læsbare labels.
- Nye canvas-ikoner og de eksisterende sol/måne har specifikke CSS-regler,
  så den globale arena-canvas-regel ikke strækker dem hen over HUD'en.

## Lava/aske

Alle 16 maskers faktiske 4×4 hjørnepatches matcher NW1/NE2/SE4/SW8.
Et marching-square-valg bruger samme `isLava` som skade. Rendererens native
pixelkomposition klipper lava til den præcise skadegeometri og udfylder smalle
kanaler, der løber gennem en celle uden at røre hjørnerne. Den ændrer hverken
spritesource, skade, AI, kollidere eller basaltpassager. Bankpixel uden for
lavaen blander over den eksisterende vulkanske jord.

Glow/glimt er separate og klippes også væk fra de sikre passager. Cache
invalideres ved ændret riverCurve/river eller lavaCrossings, er begrænset til
512 native canvases pr. kort og bygges under et lille budget under live-spil.
Pause/mutationsvalg udfylder den synlige cache straks, så gentagne pauserenders
er identiske. `FEATURES.lavaTiles=false` eller manglende billeder bruger den
gamle tegning. Der er fortsat synlig gentagelse; et bestået masketjek er ikke
en påstand om sømløs produktionsgrafik.

## Ny udvikling fra andre devs

Kontrolleret snapshot: integration/next `1c96b47`, samt
claude/project-thread-9luicd `4e14a27` (Part C). Part C er endnu ikke i
integration/next på dette tidspunkt. Den indeholder nye mutationer, rerolls,
DNA-lab-spor, vækst/mastery og Q-flokkommandoer. Det udvider A6's HUD-behov med
følg/fokus-ikoner og reroll. Mutationer/lab-spor beholder deres eksisterende
ikonsystem; de kræver ikke en ny HUD-række i denne pakke.

Et separat art-behov er også fundet: Part C `app.js:849` multiplicerer
spillerens visualScale med `1 + 0.04 * growth`. Det giver ikke-heltallig
skalering (1,04–1,28) i strid med native/integer-spritekontrakten. Det kræver
egne native vækstposes eller en særskilt rettelse hos Part C-ejeren før
produktionsgodkendelse. A6-ikoner og lava skaleres fortsat i native pixels.
Gallimimus-støvskyen er også stadig en procedural ellipse i Part C; en native
støv-FX-pakke kan genbruge effect-kontrakten senere. De er dokumenterede
separate art-opgaver, ikke importeret som skjulte A6-mekanikændringer.

En separat lokal kompatibilitetskopi kombinerer Part C og A6, genbygger de
genererede filer og tester den faktiske renderer samt de rigtige Q/reroll-kontroller.
Part C's mekanikker er ikke lagt ind på vores kildebranch eller publiceret.
Ved en senere sammenfletning skal begge sæt core FEATURES/exports bevares;
package.json skal beholde begge testsæt, og project.json/integration_report
skal genbygges med `python tools/rebuild_generated.py`. App-patchen anvendes
rent i trevejs-merge på det kontrollerede Part C-snapshot.

## Kontrol og review

`python tools/export_a6.py` udfører kun lossless integer sampling, fast palet og
binary alpha. `python tools/validate_a6.py` kontrollerer kildehashes, de faktisk
samplede pixels, padding og maskebits. `tests/a6-browser.cjs` kontrollerer 110.592
native lava-pixels mod skadereglen, passage-refresh, HUD-diæter/tekst, Part C's
ikonadapter, feature/missing-PNG-fallbacks, pause og 390px layout.
`archive/legacy_scripts/a6-part-c-compat.cjs` (arkiveret; Part C er nu integreret) kører kun dér, hvor Part C er til stede; på den
isolerede kombination tester den rigtig Q-kommando og reroll-knap.

Se `a6_validation.json`, `a6_runtime_report.json`, `../archive/legacy_scripts/a6_part_c_compat_report.json`
og `../archive/docs/validation/A6_2026-10-12.json`. Previews og mobil/desktop-evidens
ligger under `previews/a6/`. Kildedimensioner og eksportafvigelser er dokumenteret
i `SPRITE_RULES_A6.md` og `Source_Generated/a6/PROMPTS.md`.

Resultater er standalone Chromium. Det genererede GDevelop-projekt genbygges,
men en ny faktisk GDJS-eksport er ikke kørt. Ingen gh-pages-publicering.

Slutverifikation: `npm test` består samlet i en separat kopi: 249 unit-tests,
32 spil-browser-suiter og tre kit-checks. Alle 24 nye exports og 3.033 aktive
atlasframes består de tekniske gates. Se rapporten og de bevarede logs ovenfor.

Efterfølgende atlasoptimering samler samme assets i20 ark og bevarer alle3.033
logiske frames. HUD og lava ligger nu i de fælles runtime-bundles; tests af
manglende HUD-ark bruger `world_shared`. Se [artsark-workflowet](SPECIES_SHEET_WORKFLOW.md)
og den særskilte før/efter-rapport for aktuelle loadmålinger og artsplan-CLI.
