# Sprites og mekanikker — oktober 2026

Basis: `claude/overhaul` ved `89e7c8b`. Arbejdsbranch:
`codex/sprites-and-mechanics`; A-PR retter sig mod `claude/overhaul`.
Live/gh-pages ændres ikke. Opgave: `docs/tasks/SPRITES_AND_MECHANICS_2026-10.md`.
Tidligere ufærdigt arbejde og rå ark er bevaret på
`codex/preserved-feathered-starter` (`b2eb9f3`), uden automatisk sammenfletning.

## Del A — integrerede og browser-testede prototyper

| Pakke | Leveret | Begrænsning |
| --- | --- | --- |
| A1 artsangreb | 120 native frames for fem arter; Ankylosaurus’ 24 oprindelige halesving genbruges byte-identisk; Parasaurolophus’ 24 revision2-spark er aktive | Visuel produktionsgodkendelse mangler |
| A2 ecology-idles | 288 native frames for ni arter: græsning/snusen, drikning, søvn og kradsning | Seneste grooming-review: 276 aktive tegnede poses og 12 byte-identiske native fallbacks |
| A3 såret gang | 312 frames for 13 arter: 88 tegnede keyposes og 224 byte-identiske native frames | 16 afviste keyposes bruger fallback; Compy har kun originalerne, Deinonychus har fem fallback-keyposes |
| A4 vand | 48 tiles: jord/lavt vand, sand/lavt vand og lavt/dybt vand; syv hjørnetiles rettet | Hjørne-/renderer-kontrol PASS; synlige gentagelser kræver visuel polering |
| A5 raptor-ådsler | 192 ådsel-/skeletposes: gamle 160 uændrede, 32 nye til Velociraptor/Utahraptor | NPC-klare assets er ikke en påstand om nye spawn-regler |
| A6 lava/HUD/natpaletter | Valgfri pakke | Åben |

De 632 tidligere behavior-studieframes er i karantæne med runtime slået fra.
Forkastede og review-only exports er bevaret under Source_Generated.
Alle nye assets er `prototype_static`, `production_approved:false` og
`animation_ready:false`. Tekniske checks godkender ikke anatomi eller animation.

Slutpakken består **141 unit-tests, 22 browser-suiter og tre kit-kontroller**.
Se docs/validation/PART_A_FINAL_VERIFICATION.json og part-a-final-test.log.
Den aktuelle GDJS/GDevelop-eksport er ikke kørt; browserresultater holdes særskilt.
GitHub API til PR-oprettelse er fortsat blokeret af netværksadgang; Git-push er
separat. Se `docs/GITHUB_API_ACCESS.md` og `docs/PART_A_PR_DRAFT.md`.

## Tidligere implementeret

- Deinosuchus som spiller med eksisterende 120 levende frames og 16 døde poses.
- Deinonychus som gratis startart; fem egne rariteter og bevarede gamle saves.
- 240 HUD-hovedposes, varieret planteføde og giftadvarsler.
- Idempotente sjældne belønninger, fælles arts-/diætfiltre, Compy-indkaldelse,
  territoriale reder, førstegangssprogvalg og pauset build-visning.
- Stabil idle og fælles gang-/sprintfase. Tidligere balance- og testdata bevares;
  grafikken giver ikke nye balancekonklusioner.

## Del B og fremtidige ideer

B1 boss-signaturer, B2 dag/nat, B3 blodspor/lugt, B4 tørke, B5 allierede
raptorer, B6 udfordringer, B7 dagens jagt og B8 Baryonyx-bedrift/skin afventer
hver deres implementering, simulering og tests. Udklækning/opvækst bliver i idébanken.
