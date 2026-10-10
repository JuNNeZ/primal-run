# Grafiske opgaver efter del A

A1–A5 har nu integrerede **prototyper**. Produktionsgodkendelse og den samlede
slutverifikation mangler; se `SPRITES_AND_MECHANICS_STATUS.md`.

1. **Kryds-state konsistens:** finpuds kropsform, markeringer og loop-overgange.
   Fem arter har 120 artsangrebsframes, inklusive Parasaurolophus-spark.
   Ankylosaurus genbruger sine oprindelige 24 halesving byte-identisk.
2. **Ecology-idles:** ni arter har 288 frames for fødesøgning, drikning, søvn og
   kradsning: 276 aktive tegnede poses og 12 native fallbacks. Baryonyx W
   hvile/kløen samt T-rex S/E drikning og W snusen/drikning mangler størrelsestro poses.
3. **Sårede keyposes:** 13 arter har 312 frames, men 16 tegnede keyposes blev
   afvist. Compy mangler otte størrelsestro keyposes; Deinonychus mangler fem;
   Carnotaurus N2, Triceratops S2 og Baryonyx E3 bruger også originalen.
4. **Vandpolering:** 48 overgangstiles er bygget; syv rettede hjørnetiles består
   hjørnekontrollen. Visuel sømløshed og samlet renderer-/collision-review skal
   færdiggøres uden at ændre vandreglerne for at skjule grafikfejl.
5. **Raptor-ådsler:** Velociraptor/Utahraptor har nu 32 NPC-klare ådsel-/skeletposes.
   De 160 ældre poses er uændrede. Endelig anatomi- og farvereview mangler.
6. **Valgfri A6:** lava/aske-overgange, pixel-HUD-chips og natpaletter.
7. **Fremtid:** æg, udklækning og baby-/ungestadier pr. art, efter gameplay-/balancevalg.

De 632 tidligere behavior-studieframes er runtime-deaktiveret og bevaret som
kilder/review. Alle nye assets er prototype_static uden produktionsgodkendelse.
Følg `SPRITE_RULES*.md`: native pixels, fast palette, kilder, manifest, previews
og særskilt PNG-/browser-/GDevelop-validering.
