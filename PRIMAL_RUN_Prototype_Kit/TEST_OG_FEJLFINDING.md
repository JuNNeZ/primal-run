# Test og fejlfinding

## De kontroller der er gennemført

PNG-kontrollen: 104 filer, dimensioner, RGBA, binary alpha, transparent RGB,
32-farvepalette og objekt-padding. Se validation_report.json.

Browserdemoen testes i Chrome fra lokale filer. Kardinal-testen dækker alle
fire retninger, stop, blockage, loop-overgang og disabled smoothing.
Progression-testen dækker hunt XP, level-up pause, keyboard-valg, stacks,
hastighed, regeneration, pounce, bleed, healing, death-DNA én gang, reload-
persistens, sejrbonus og restart. Se de medfølgende testrapporter.

De tests er ikke en GDevelop-runtime-test. Kunst og animationskontinuitet skal
vurderes visuelt. Bosses og events er endnu kun tegninger og opskrifter.

## Hvis noget driller på arbejdscomputeren

- Ingen billeder: pak ZIP-filen helt ud; hold assets ved siden af demo.html.
- Intet bevæger sig: klik i spilet; afslut et åbent mutationvalg med 1/2/3.
- Browser vil ikke åbne lokale filer: brug dens Open file/Ctrl+O, eller flyt
  den udpakkede mappe til en almindelig lokal mappe. Browserpolitik kan variere.
- En MD-guide åbner som download: læs GUIDE.html, som indeholder samme lokale tekst.
- GDevelop-dino glider/skifter størrelse: kontrollér origins på hvert frame,
  canvas 128×128 og at du bruger assets/player frem for action-pose-studierne.
- Walk står på frame 0: skift ikke samme animation ved hvert event/frame.
- Walk spiller mod en sten: vælg idle ud fra faktisk movement, ikke kun holdt tast.
- Diagonal er for hurtig: brug Top-down movement/normaliser retningen.
- Fjender rører sig under level-up: Playing-vagten skal også omfatte behaviors,
  kræfter og tidligere aktiveret movement, ikke kun spawn-events.
- Flere levels vælges på ét tryk: UI skal kræve LevelUpOpen og lukke efter ét valg.
- Ingen XP: For each Enemy med HP<=0 skal tilføje XP før Enemy slettes.
- Gentaget XP/DNA: slet døde Enemy i samme event; brug Awarded til DNA.
- Lager nulstillet: browserens lokale data kan være væk/afvist. Core-loop fungerer
  uden lagring. I GDevelop må Storage implementeres og testes separat.
- Sløret art: filtering fra; native canvas; integer display scale og positioner.

## Lokal validering, hvis Python er tilgængeligt

Fra pakkens mappe: python tools/validate_kit.py. Det kræver Pillow, men ikke NumPy.
Python er ikke nødvendigt for at spille demo eller åbne katalog/guide.

## Før nye serier laves

Fastlås et visuelt master-frame, hip-pivot og palette. Tegn de seks poses som
kontrollerede ændringer af samme krop. Undgå at skjule wobble ved høj afspilnings-
hastighed. Kontrollér hele serien ved 1× og 4× på både lys og mørk baggrund.
Lad næste art få sit eget læsbare silhouette- og størrelsestjek før masseproduktion.
