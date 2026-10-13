# Iguanodon rig review — godkendt østdesign og nye retninger

Aktuelt: [fire enkeltposer N/S/W/E](cardinal_review/REVIEW.md), med uændret,
visuelt godkendt østdesign og tre nye retninger til review. Intet er integreret.

Den oprindelige animationsopgaves Definition of Done er ikke opfyldt.
Læs [kvalitetsrapporten](QUALITY_REPORT.md) for de tidligere afviste walk-forsøg.

Efter Jonas' afvisning af hovedets artsgenkendelighed er et enkelt nyt
[hovedstudie](head_revision/REVIEW.md) vedlagt. Jonas har siden godkendt
det højre østdesign som reference. Før/efter og rig-begrænsningerne er bevaret.

- Root-mappens 24 walk-frames er det mindst fejlende v1-forsøg, ikke et godkendt sæt.
- `rejected_v1/` og `rejected_v2/` indeholder begge bevarede forsøg.
- `overlay.png` og `report.json` viser slutkørslen med alle tilstande.
- `walk_report.json` viser v1's walk-kontrol; `audit_summary.json` supplerer med
  præcis 2 px silhuetkontrol, referencehashes og validatorens berørte frames.
- `walk_<S|N|E|W>_<light|dark>_<1|4>x.gif` er 8 fps review-loops.
- `walk_light_1x.png` og `walk_dark_4x.png` viser alle 24 poser på faste canvasser.
- De to `walk_source_v*.png` er imagegen-originaler; prompts og eksportkode
  ligger ved siden af dem. `walk_pose_reference.png` er kun en rig-guide.

Origin/canvas i review-manifestet er 72,72 / 144×144. Det anatomiske hoftepunkt,
artsgenkendeligheden, benfaserne og stilmatch er ikke godkendt.
