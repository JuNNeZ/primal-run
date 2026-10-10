# Sprites og mekanikker — oktober 2026

Basis: `claude/overhaul` ved `89e7c8b`. PR #2 er ikke indeholdt i den aktuelle
`codex/primal-run-playable` ved `139fe7a`. Arbejdsbranch: `codex/sprites-and-mechanics`.
Live/gh-pages må ikke ændres. Opgave: `docs/tasks/SPRITES_AND_MECHANICS_2026-10.md`.

Tidligere ufærdig Deinonychus/terræn/meteor-udvikling og rå spriteark er bevaret på
`codex/preserved-feathered-starter`, commit `b2eb9f3`. Den er ikke automatisk flettet
ind i overhaulen; grundlagene har forskellige balance- og renderændringer.

## Leveringspakker

- Deinosuchus som spiller: implementeret; fuld testpakke består (126 kernetests, 20 browser-suiter, 3 kit-kontroller) plus ekstra tradeoff-test. Før/efter:180/198 runs; 60 eksisterende art/stil-grupper uændrede. Genbrug eksisterende
  120 levende frames samt eksisterende 16 ådsel-/skeletposes; ingen nye anatomiske tegninger.
- Deinonychus: gratis startart integreret fra den bevarede snapshot, 120 native frames og fem egne rariteter; eksisterende saves beholder valgt art.
- HUD: 240 separate hovedposes for 12 spilbare arter, fem reaktioner; rå kilder og forkastet body-atlas bevaret.
- A1 artsangreb: 96 native prototypeframes integreret for Triceratops, Ankylosaurus, Pachycephalosaurus og Gallimimus. Ankylosaurus bruger nu de 24 gamle player_full-angreb byte-identisk; den nye genererede kropsform er forkastet. Parasaurolophus mangler stadig et tydeligt kontakt-spark; to udkast er forkastet og bevaret; revision2 har 24 review-only sparkposes, endnu ikke aktive.
- Føde: otte nye ground-pickups, deterministisk variation, advarsel og kort forgiftning fra enkelte svampe.
- Mekanik/UI: sjældne belønninger er idempotente, arts-/diætfiltre deles, Compys rekrutterer mindst fire, reder kræver drab, førstegangssprogvalg og pauset build er implementeret.
- Idle-overgange: stabil verdenspose som midlertidig forbedring; nye tegninger er ikke færdige. Gang/sprint deler benfase.
- A2 ecology-idle: afventer.
- A3 halten: timing-prototype under 30 % HP er integreret for alle spiller-/NPC-serier; bruger uændrede walk/run-poses. Anatomiske skåneben-poses afventer.
- A4 vand-autotiles: afventer.
- A5 raptor-ådsler/skeletter: afventer.
- A6 lava/HUD/natpaletter: valgfri, afventer.
- B1 boss-signaturer: afventer før/efter-simulering og telegraph-tests.
- B2 dag/nat: afventer.
- B3 blodspor/lugt: afventer.
- B4 tørke: afventer.
- B5 allierede raptorer: afventer.
- B6 udfordringer: afventer.
- B7 dagens jagt: afventer.
- B8 Baryonyx-bedrift/skin og unlock-tekst: afventer.

Udklækning/opvækst bliver i idébanken. Ingen ventende pakke kaldes bygget.
Der oprettes A/B-PR efter relevante pakker og tests, ikke som færdige leverancer nu.
