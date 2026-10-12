# Artsforsøg og Iguanodon-reference

Aktuelt forsøg: **kun Iguanodon**, østretning, firebenet gang.
Åbn `iguanodon_rig_review.html` direkte eller gennem repositoryets HTTP-preview for at
sammenligne tolv 3D-referenceposes med seks genererede sprites.
HTML-filen indeholder begge PNG-ark og posedata, så den også virker alene og
offline. Atlasudsnit bevarer de enkelte poses pixels uden skalering eller
rotation. Dokumentationslinks kræver stadig den samlede pakke.

Den ortografiske kamerareference og de faste IK-led er brugbare til at
beskrive poserne. Imagegen holder endnu ikke fodbevægelse og markeringer
tilstrækkeligt stabilt. Der er derfor **ingen færdig animation eller ny skill**
i pakken. Spriteforsøget ligger under `review/`, ikke i spillets assetmanifest.
Se `IGUANODON_RESEARCH.md` for litteratur og modelbegrænsninger.

Tidligere Edmontosaurus-, Iguanodon- og Archelon-mastere og mislykkede
animationer bevares i `Source_Generated`, med deres tidligere manifests og
previews. De er historiske prototyper. Ingen af de tre arter er gjort spilbare.
`canonical_plan.json` beskriver de tidligere stillposes, ikke den nye gangcyklus.

## Reproducer

```sh
blender -b --python tools/iguanodon_reference_rig.py
python tools/build_iguanodon_rig_review.py
python tools/build_iguanodon_review_html.py  # kun genpakning af HTML
python tools/validate_iguanodon_rig.py
PRIMAL_CHROME_PATH=/usr/bin/chromium node --test tests/iguanodon-rig-browser.cjs
```

Kør fra repositoryets rod. Blender genererer en selvbygget anatomisk proxy;
PNG-eksportøren tegner ingen anatomi. Den mekaniske eksport anvender eksplicit
4-pixel-sampling, fixed32, binær alpha og manuelt deklarerede hoftepunkter.
GIFs er previews, ikke lossless game-assets. `.blend` indeholder første pose
til inspektion; scriptet og `reference_manifest.json` definerer hele forløbet.

`review/iguanodon_rig/validation_report.json` skelner geometri, PNG-kontrol,
standalone-afspiller og manglende visuel godkendelse. Ingen GDJS-integration
eller produktionstest er foretaget, fordi dette er et separat afprøvningsværktøj.
`SPRITE_RULES_BASE.md` og `palette.json` følger med pakken.
