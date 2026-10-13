# Fire Iguanodon-retninger — enkeltposer til review

Jonas godkendte højre/øst-spriten fra hovedstudiet og bad om nord, syd, vest og
øst først. Her er fire separate 144×144 RGBA PNG'er, én pr. retning. Øst er
byte-identisk med den godkendte reference. N/S/W er tegnet særskilt med
imagegen fra samme design og deres egne rig-led; ingen rotation eller spejling.

`cardinals_light_4x.png` viser N/S øverst og W/E nederst. Lys/mørk 1× og
nearest-neighbor 4× er vedlagt. Filnavne er `iguanodon_walk_<N|S|W|E>_000.png`,
fordi de bruger disse rig-frames som pose. De er enkeltposer, ikke animationer.

## Godkendelse og kildevalg

`approval.json` bevarer Jonas' godkendelse og den nye fire-pose-opgave.
`review_manifest.json` markerer East-designet som visuelt godkendt af brugeren;
N/S/W er ikke automatisk godkendt. Animation og integration er ikke godkendt.
East-PNG SHA-256: `851998fd15921ad4f69350e51afcaab65b7b649bec0661136c9dcb2d56c5695e`.

To forsøg pr. ny retning giver seks bevarede source-originaler. Valget er
N_v2, S_v1, W_v1. N_v2 forbedrer benmatch fra 0,18 til 0,56 og størrelse fra
28 % til 13 % afvigelse. S_v1 har bedre benmatch end S_v2 (0,54 mod 0,47).
W_v1 har mindre tyngdepunktsafvigelse og færre fejl end W_v2. Begge forsøg,
rapporter, overlays og previews bevares i `attempt_v1/` og `attempt_v2/`.

`rig_<N|S|W>_joints_reference_8x.png` er guider med cyan ledkæder, lyse led
og røde kontaktpunkter fra de uændrede rig-frames og deres joints/foot_contact.
De er kun guider. Referencerne vises ved integer8× fra et 128×128 crop med
8 px kant fjernet fra native 144×144 uden synlig clipping. Prompts er vedlagt.

## Validering og visuelle begrænsninger

Alle fire eksportfiler består PNG-kontrollen: RGBA, native 144×144, Fixed32,
binær alpha, transparent RGB 0 og mindst 2 px margin. Easts byte-identiske
genbrug er verificeret. Se `audit.json` for præcise tal.

Uændret rig-validator: exit1, 26 fejl. 20 er manglende tidsframes001–005,
som ikke er del af den aktuelle enkeltpose-opgave. De øvrige seks er reelle:

- Syd: bbox-centrum 4,5 px og tyngdepunkt ca. 3,7 px fra riggen;
  benområde 0,54 mod minimum 0,70.
- Nord: størrelse afviger ca. 13 % og benområde 0,56 mod minimum 0,70.
- Vest: tyngdepunkt ca. 4,2 px fra riggen.
- Øst: ingen individuelle fejl i den almindelige validator.

Den strengere 2 px-silhuetregel består ingen af de fire. Kandidatpixels uden
for 2 px / udækkede guidepixels: N 4/188, S 159/104, W 76/152, E 12/40.
Jonas' visuelle E-godkendelse er bevaret; målingerne er hverken en omstødelse
af godkendelsen eller en antaget dispensation fra rig-kravene.

De nye retninger anvender samme oliven/grå/creme-design og pixelkonturer.
Nord viser bagsiden af hovedet og syd forsiden i overhead-forkortning.
Markeringer, lemplacering og volumen varierer stadig. Syds hals/hoved fremstår
længere end øst, og nord kan se smallere ud. Kamera-/anatomimatch er ikke fuldt
godkendt. Ingen blind artsgenkendelighedstest eller GDevelop-test er udført.

## Eksport og reproduktion

Imagegen returnerede 1254×1254 i stedet for 1024×1024. Originalerne er bevaret.
`export_cardinals.py` anvender E-studiets review-plan: crop 7 px tom kant,
integer 10 sampling med fase 5, Fixed32, alpha>=192, kildeanker 627,627 til
native 72,72 via offset 10,10. East kopieres uændret. Ingen interpolation,
procedurale lemmer, bbox-centrering eller silhouette-maskering med riggen.
Deklareret origin beviser ikke det tegnede hoftepunkts præcision.

Fra repository-roden:

```sh
python PRIMAL_RUN_Game/Source_Generated/iguanodon_rig_review_2026_10_12/cardinal_review/export_cardinals.py
python tools/validate_rig_frames.py --species iguanodon --frames PRIMAL_RUN_Game/Source_Generated/iguanodon_rig_review_2026_10_12/cardinal_review --rig PRIMAL_RUN_Rig/iguanodon --states walk --sheet PRIMAL_RUN_Game/Source_Generated/iguanodon_rig_review_2026_10_12/cardinal_review/overlay.png --report PRIMAL_RUN_Game/Source_Generated/iguanodon_rig_review_2026_10_12/cardinal_review/report.json
```

Alt ligger i review-mappen. Rig, validator, tolerancer, assets, spilmanifester
og runtime er uændrede. Arbejdet på 120 animationsframes er sat efter den nu
ønskede reviewfase for de fire grundretninger.
