# Morgenoverdragelse — 6. oktober 2026

Leverancen er et åbent, selvstændigt **GDevelop 5.6.283-projekt**, `project.json`,
med Game-scene, 11 native objekter, relative assetstier, 104 oprindelige PNG'er og
8 importerede WAV-placeholders. Ingen billeder er ændret eller godkendt på ny.

## Fungerende kerne

- Utahraptor: normaliseret WASD/piletast-bevægelse, fire retninger, 6 walk-frames
  ved 8 fps, idle ved stop/blokering og bevaret retning ved stop.
- Fast 28×28 torso-mask for alle 28 spillerframes; art-origins er bevaret.
- Radialt bite med separat VFX, cooldown, Compy, mad, HP og engangs-XP.
- Parasaurolophus og Carnotaurus følger kit-balancen og bliver spawn-muligheder
  efter 10/20 sekunder. Ingen bosser eller biomes.
- XP, level-up, ét af tre mutationsvalg, fuld gameplay-/animationspause og stacks.
- Ben giver +15% fart/stack; tænder giver bleed; fjer giver +20% stamina-regen/stack.
  Shift-spring bruger de eksisterende stamina-/pounce-tal.
- Death, restart, engangs-DNA og lokal persistens med fallback ved blokeret lager.

## Testbevis — kørt i cloud på denne leverance

| Kontrol | Resultat | Præcis betydning |
| --- | --- | --- |
| 104 kit-PNG'er + 176 historiske sprite-PNG'er | PASS | Tekniske PNG-checks, ikke visuel godkendelse |
| Oprindeligt npm test | PASS | Kun den separate browserdemo/katalog/guide |
| Project integrity | PASS | Relative stier, resource-inventory, byte-identiske assets, editor-objektliste |
| 11 kernel-/strukturtests | PASS | Gameplay-logik og faste frame-masker; separat fra engine |
| GDevelop WASM serializer 5.6.283 | PASS | Faktisk indlæsning/roundtrip af native project/eventformat |
| GDevelop HTML5-exporter | PASS | Faktisk engine-kodegenerering, resource-copy og export/ |
| GDevelop HTML5-runtime i Chromium 151 Headless Shell | PASS | Genererede events, native SpriteRuntimeObject/Pixi, hitboxes og tastatur; 7 testgrupper |
| Desktop-editorens UI | IKKE KØRT | Åbn/Preview skal også afprøves manuelt første gang |

Detaljerne er i reports/*.json. `game.png` og `mutation.png` er screenshots fra
**den reelle GDevelop-export**, ikke fra den gamle browserdemo. Mutationsbilledet
bruger en kontrolleret testtilstand. Engine- og browsertests er uafhængige.

Den normale cloud-Chromium-launch blev blokeret af Unix-socket-oprettelse. Den
reelle runtime blev derefter testet med officielt Chromium Headless Shell,
single-process og SwiftShader; ingen engine-klasser eller renderere er mocket.

## Begrænsninger og bevaringer

- Alle tidligere pakker og deres rapporter/status bevares. Den kopierede
  animation_manifest indeholder oprindelig prototype-status, aldrig approved_animation.
- North er drejet South inklusive lyset. Walk har variation/wobble. Ingen nye
  sprite-gensynteser, smoothing eller ændrede source-pixels.
- Action-poser er med som ubrugte studier. Bite er en radial gameplay-effekt,
  ingen ny produktions-bite-animation. Fjender bruger South-stillbilleder.
- Lyde er registreret som ressourcer, men ikke afspillet. Ingen inventory,
  unlock-menu, boss, biome, cloud-DNA eller fuldt roguelite-slutspil.
- Det nye GDevelop-run er en arena til death; browserdemoens 60 s sejr er bevaret
  i browserdemoen. DNA følger dens death-formel, floor(hunts/2)+floor(time/15).
- Kernens JavaScript-event er fuldt redigerbart i GDevelop; dette er ikke en
  no-code omskrivning til hundredvis af standard-events. Debugger-variabler er
  spejlet fra runtimeScene.__primal.core; kernens tilstand er autoritativ.
- HTML5-exporten er testet; desktop-export til EXE, touch og mobile er ikke testet.

Start med START_HER.md og MANUEL_TEST.md. Næste nyttige skridt er lyde, bedre
læsbarhed af Compy og en særskilt, visuelt kontrolleret walk-korrektion.
