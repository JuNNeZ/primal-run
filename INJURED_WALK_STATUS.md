# A3 — såret gang, revision 2

Alle 13 eksisterende levende arter har fire retninger med seks frames under
30% liv. De 312 eksportframes indeholder **88 nye, anatomisk refererede
keyposes** og **224 byte-identiske originale gangframes**. Af de sidste er
208 almindelige overgangsframes og 16 er fallback for afviste keyposes.

Hver ny kilde bruger artens oprindelige walk2/walk3 som direkte reference.
Kropsskala, artspalette, hip-origin og antal ben/haler bevares. Navngivne
pelvis-/halerodsregistreringer retter enkelte forskudte source-celler; ingen
bounding-box-centrering, smoothing eller anatomisk Python-tegning bruges.
De eksisterende sourceark og levende walk/run-assets er ikke overskrevet.

| Art | Tegnede keyposes | Native fallback-keyposes |
| --- | ---: | ---: |
| Ankylosaurus | 8 | 0 |
| Baryonyx | 7 | 1 |
| Carnotaurus | 7 | 1 |
| Compy | 0 | 8 |
| Deinonychus | 3 | 5 |
| Deinosuchus | 8 | 0 |
| Gallimimus | 8 | 0 |
| Pachycephalosaurus | 8 | 0 |
| Parasaurolophus | 8 | 0 |
| Triceratops | 7 | 1 |
| Tyrannosaurus | 8 | 0 |
| Utahraptor | 8 | 0 |
| Velociraptor | 8 | 0 |

Compys genererede krop blev for stor/anderledes og afvises helt. Deinonychus
S/N og en W-keypose ændrede placering/silhuet og bruger originalen. Triceratops
S2, Carnotaurus N2 og Baryonyx E3 beholder originalen. T. rex har lidt lysere
tegnet shading, og ændringen af den belastede fod er bevidst subtil. Derfor
er denne leverance en **runtime-prototype**, ikke fuldt godkendt produktion eller
en påstand om 104 nye godkendte poses.

`injured_walk_review.html` viser normal og såret cyklus samt native 1× grids.
Kilder, prompts og per-pose målinger findes i Source_Generated/behavior_limp.
`injured_walk_manifest.json` registrerer hver kilde, anchor, stride, SHA-256,
reused_from og fallback_reason. `tools/export_injured_walk.py` samler kun
reviewede pixels; `tools/validate_injured_walk.py` kontrollerer alpha, palette,
marginer og original-/kildehashes. Runtimevalidering registreres separat.

English: 13-species injury prototype; 88 authored keyposes and 224 unchanged
native frames, with explicit rejected-pose fallbacks and no production approval.
