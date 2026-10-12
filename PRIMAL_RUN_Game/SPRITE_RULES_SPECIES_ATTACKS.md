# A1 — artsangreb, poleret revision

Artskorrekt våben: Triceratops hornstød; Ankylosaurus halekølle;
Pachycephalosaurus kuppelstød; Gallimimus næbhug; Parasaurolophus bagbensspark.
Alle fem har S/N/E/W med seks poses, kontakt i frame3, native144×144,
logisk origin72,72 og samme32-farvepalette. Angrebsvarighed, skade, collision og
cooldown ændres ikke af spritevalget.

`Source_Generated/species_attacks/exports.json` er den aktive eksportplan.
Triceratops genbruger native enemy_full-angreb; Anky/Pachy/Galli genbruger
player_full-angreb. Alle96 genbrugte poses er byte-identiske med deres
registrerede grundserie og bevarer rå kilde/crop/anchor/hash samt reused_from.
Tidligere mismatching generationsark og recovery-revisioner er bevaret i
rejected_generation og bruges ikke i runtime.

Parasaurolophus'24 poses bygger på lokale attack-row-revisioner af artens
kanoniske directional masters. N/E/W kontaktposes har lokale revisioner af
kicking bagben og fuld separat hale. Source overrides gør kun den angivne pose
aktiv; andre celler i en kontaktgeneration bruges ikke. Master-rækker udtages
med fast2px sampling; isolerede384×256-framing-revisioner genereret ved4× bruger
fast8px sampling. Der bruges ingen resize, interpolation, spejling, smoothing
eller anatomi-tegning i eksporten. Hvert source anchor og alfagrænse er eksplicit.
Dokumenterede cell_exclusions fjerner nabocellefragmenter uden at klippe dyret.

Følg ANIMATION_POLISH.md og Source_Generated/animation_polish/generation_review.json
for native review, navngivne kropspunkter, raw/rejected hashes og prompts.
Kontroller begge baggrunde og faktisk renderer, herunder sidste→første pose og
gang→angreb→gang. Familiens validator genudtager lokale poses uafhængigt fra
rå sources; byte/hash-checks alene godkender aldrig anatomi eller animationsstil.

Alle assets forbliver prototype_static, production_approved=false,
animation_ready=false. Små genererede study-variationer er ikke fuldt
produktionsgodkendte. Features.speciesAttacks kan deaktivere overlaget.
Historiske rå originalmasters og tidligere referencepakker er bevaret;
aktive native grundderivater må geneksporteres ved en autoriseret registreringsrettelse.
