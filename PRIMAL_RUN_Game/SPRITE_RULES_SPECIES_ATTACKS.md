# A1 — artsangreb

Artskorrekt våben: Triceratops horn; Ankylosaurus halekølle; Pachycephalosaurus kuppel/hovedstød; Gallimimus næb/hals. Parasaurolophus skal have bagbensspark; dens to udkast er forkastet (første ændrede kameravinkel, andet viser halebevægelse og mangler et tydeligt kontakt-spark).

Fire integrerede prototype-serier: S/N/E/W med seks frames, kontakt i frame3 (0-baseret), native144 ×144, fast deklareret hoftepunkt72,72 og samme32-farvepalette. Hvert angreb følger artens eksisterende angrebsvarighed. Ingen skade/collision/cooldown ændres af spritevalg. Features.speciesAttacks kan deaktivere overlaget; gamle player_full/enemy_full frames må aldrig overskrives.

Source_Generated/species_attacks/exports.json er eneste aktive eksportplan. Ankylosaurus South frame5 anvender recovery_revision1; de andre23 celler kommer stadig fra det oprindelige prototypeark. Kilden blev skabt ved en generativ rettelse; kun den navngivne celle må eksporteres fra revisionen. Ingen anatomisk tegning, interpolation eller dynamisk bbox-recentrering i eksporteren. Fast heltalssampling2 og alfagrænse192 bevarer den tynde haleforbindelse; vælg ikke kun største komponent, da det kan kassere køllen.

Alle assets forbliver prototype_static, production_approved=false, animation_ready=false. Tekniske kontroller beviser ikke kropsvolumen, benantal, markeringer eller overgange. Kontroller hud_attack_review.html, native previews og den faktiske renderer på begge baggrunde. Kendt: små skal-/markeringvariationer og skift mellem gammel gang og nyt angreb kræver videre polering; ingen komplet idle-, halten- eller vandpakke påstås færdig her.
