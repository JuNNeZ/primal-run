# Ground-opdatering · 10. oktober 2026

Skærmbilledets brune oval var `map.mud`: en ensfarvet ellipse med en meget
svag gentaget dirt-tekstur og en glat outline. Baggrunden brugte samtidig
bløde zonetints og ekstra procedurelle streger.

`FEATURES.nativeGround` bruger nu de 16 bevarede feathered-tiles til skov,
flodbred, klipper og vulkan. Alle PNG'er er genbrugt byte-identisk fra
`codex/preserved-feathered-starter`; 32×32, origin 0,0, original palette,
kildeatlas, source-crops og hashes er bevaret i `ground_reuse_manifest.json`.
Kilder og tilemasters er under `Source_Generated/ground_reused`.

Rendereren bygger deterministiske 128×128 chunks af native 32×32 tiles.
Teksturen tegnes ved 38 % kontrast over biomets bundfarve, så terrænet ikke
konkurrerer med planter og dyr. Der er ingen skalering eller interpolation.
De tidligere ekstra zonetints, farvepletter og confetti-streger bruges kun i
fallback-renderingen.

Mudder og tørrede damkanter bruger den bevarede flodbredstekstur med forskellig
bundfarve og kontrast. Konturen har binær alpha, to-pixel trin og otte-pixel
kantklynger. Den bryder den glatte ellipse uden at ændre mudderets fysiske
område eller vandreglerne. Teksturen er fast i verdenskoordinater, og caches
har faste grænser: 128 groundchunks og 64 mudder-/damlag. Ingen gameplay-RNG
forbruges. Den gamle rendering bevares ved flag off eller manglende billeder.

Tørkebunden tegnes før vandtiles, så den ikke skjuler dammens vand.

Vandtiles, lava, basaltpassager, dyr og øvrige godkendte PNG'er er uændrede.
De 16 terræn-PNG'er indgår i det eksisterende ground-atlas.

Kontroller:

- `python tools/validate_ground_reuse.py`: 16 source-/exporthashes, immutable masters, native mål, palette og opaque alpha.
- `python tools/validate_sprite_atlases.py`: 3.009 aktive frames i 36 ark; eksakte kildepixels, ankre og gutters.
- `node tests/native-ground-browser.cjs`: fire biomer, tekstureret mudder/tørke, binære kanter, fysiske overflader, pause og fallback.
- Målrettede eksisterende terrain-, vand-, tørke-, presentation- og generated-source checks.

Før/efter: `previews/native_ground/forest_before.png` og
`previews/native_ground/biome_0_after.png`. De tre øvrige biomer ligger samme sted.
Dette er standalone-browserverifikation; en ny GDevelop-editor-eksport er
ikke kørt. Genbrugte tiles beholder deres oprindelige prototype-status.
