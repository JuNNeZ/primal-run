# Overdragelse til næste artschat · 13. oktober 2026

Review-værktøjer og den selvstændige Iguanodon-afspiller er overført fra
`codex/iguanodon-rig-anim-2026-10-12` til `integration/next` efter Jonas' instruktion.
Kildecommits: `73927a3`, `76b7f4a`, `69dac81`. Integrationens eksisterende spilændringer er bevaret.

Det brugbare er den reproducerbare rig/reference-pipeline, validatoren, kildeprovenance,
diagnostikken og den portable HTML-afspiller. `tools/draw_new_species.py` er med som
uændret modelafhængighed for animatoren; den er ikke kørt for at installere arter i spillet.
Ingen af disse review-sprites er valgt som runtime-assets, og ingen ny art er aktiveret.

Status til næste chat:

- 120 genererede Iguanodon-frames; rig-validatoren består med 0 fejl og 0 advarsler.
- Streng konturkontrol fejler i 115 frames: højst 2 pixels afvigelse er endnu ikke opfyldt.
- Walk-hovederne er delvist forbedret. Smalle S/N-kranier og variation i hoveddesign,
  kropsmarkeringer og lysstyrke består. Ingen kunstnerisk produktionsgodkendelse.
- Begynd med at vurdere kranium/næb i alle fire retninger og låse materialet på en
  stabil rig. Se README.md og de bevarede fejloverlays før yderligere generering.
- Bevar `tools/rig_animate.py`, `tools/validate_rig_frames.py` og deres grænser.
  En nødvendig anatomisk rig-revision skal beskrives særskilt, ikke skjules i eksporten.

`NEW_SPECIES_ART_REFERENCE.md` er et bevaret snapshot af Claudes artsvejledning;
dets omtale af nye runtime-features beskriver kildebranchen, ikke aktivering i integration.

Kør `npm run test:rig` for værktøjskontrollen. README.md beskriver eksport,
rig-validering og `python tools/check_iguanodon_review.py`; sidstnævnte skal stadig
returnere exit 1, indtil den strenge konturfejl faktisk er løst.

Afspiller: `iguanodon_animation_review_standalone.html` i denne mappe.
Intet er sendt til gh-pages eller publiceret som et nyt spilrelease.
