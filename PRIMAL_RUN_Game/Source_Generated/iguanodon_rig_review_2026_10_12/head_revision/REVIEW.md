# Hovedstudie efter Jonas' feedback — visuelt godkendt østdesign

Senere godkendelse: Jonas har godkendt højre/øst-spriten og bedt om fire
enkeltretninger ud fra skelettet først. PNG'en er bevaret uændret og genbruges
i `../cardinal_review/`. Den følgende rapport beskriver afprøvningen før
godkendelsen; rig-afvigelserne består fortsat. Godkendelsen gælder udseendet,
ikke animation, dispensation fra rig-krav eller integration.

Jonas kunne ikke genkende den tidligere sprite som Iguanodon uden den store
klo. Feedbacken behandles som en afvisning af hoveddesignet, ikke som en
godkendelse af resten af dyret.

Der er lavet **ét nyt E_000-studie**, ikke en ny animationsserie. Det viser
et mere afgrænset kranium, tydeligere kæbe, øje og stumpere beskæringsnæb.
Tommelfingerpiggen må stadig ikke være det eneste artskendetegn. Den endelige
artsgenkendelighed er ikke godkendt, og de øvrige retninger er ikke tegnet om.

Den almindelige, uændrede validator giver **ingen individuelle fejl** for
denne pose. Kørslens exit-kode er dog **1**, fordi E_001–005 mangler. Med kun
én pose er benbevægelse, fasekontinuitet og loop ikke valideret.

Opgavens strengere silhuetregel er fortsat ikke opfyldt: 12 kandidatpixels
ligger mere end 2 px fra riggen, og 40 guidepixels ligger mere end 2 px fra
kandidaten. Se `audit.json`. At den enkelte pose accepteres af validatorens
85 %-regel betyder derfor ikke, at den opfylder opgaven.

Imagegen ændrede også 813 pixels uden for det deklarerede hovedområde
`[105,55,136,82]`, selv om prompten bad om en lokal rettelse. Tekstur og nogle
ben-/kropskanter er ændret. Studiet er derfor ikke en godkendt lokal erstatning.
Ingen krops-/benpixels er efterfølgende tegnet med Python eller erstattet
med rig-pixels for at få en kunstig godkendelse.

`comparison_light_1x.png` og `comparison_light_4x.png` viser før/efter; mørke
varianter og `overlay.png` er vedlagt. Den oprindelige v1 er til venstre,
det nye studie til højre. Begge er uapproved review-art.

## Kilde og eksport

`head_source_v1.png` er den bevarede imagegen-original; `prompt.txt` indeholder
instruktionen. Referencerne er v1 E_000 og rig E_000, hver beskåret fra 144×144
til 128×128 med 8 px kant og vist lossless 8×. Ingen synlige referencepixels
blev skåret af. Der er ikke genereret nye ben proceduralt.

Imagegen returnerede **1254×1254** i stedet for de ønskede 1024×1024. Det
afvigende kildeformat er bevaret. `export_master.py` beskærer 7 tomme kantpixels,
sampler med fast heltals-step 10 og fase 5, bruger samme Fixed32-palette og
alpha>=192 og registrerer det deklarerede kildepunkt 627,627 til native 72,72
via offset 10,10. Ingen interpolation, resizing af kilden, rotation, spejling
eller bbox-centrering er brugt. Planen gælder kun dette review-studie;
den ændrer ingen eksisterende eksportregler eller andre arter.

Native PNG-kontrol består for RGBA 144×144, Fixed32, alpha 0/255, RGB 0 under
transparens og mindst 2 px margin. Et deklareret origin beviser fortsat ikke,
at det tegnede anatomiske hoftepunkt er korrekt.

Genkør fra repository-roden:

```sh
python PRIMAL_RUN_Game/Source_Generated/iguanodon_rig_review_2026_10_12/head_revision/export_master.py
python tools/validate_rig_frames.py --species iguanodon --frames PRIMAL_RUN_Game/Source_Generated/iguanodon_rig_review_2026_10_12/head_revision --rig PRIMAL_RUN_Rig/iguanodon --states walk --directions E --sheet PRIMAL_RUN_Game/Source_Generated/iguanodon_rig_review_2026_10_12/head_revision/overlay.png --report PRIMAL_RUN_Game/Source_Generated/iguanodon_rig_review_2026_10_12/head_revision/report.json
```

Næste nødvendige tegnearbejde er et genkendeligt Iguanodon-hoved, der samtidig
opfylder den præcise silhuetregel og bevarer resten af karakteren. Dette studie
skal ikke udbredes til 120 frames som et allerede godkendt design.
Der er ingen integration, ændringer i assets/manifester eller ændringer af rig
og validator. De tidligere walk-forsøg og deres afvisningsrapporter er bevaret.
