# Iguanodon — afvist walk-review, 13. oktober 2026

**Status: IKKE færdig; IKKE klar til Jonas' endelige kvalitetsgodkendelse.**
De to imagegen-forsøg opfylder hverken rig-kravene eller den samlede visuelle
arts- og stilkontrol. Ingen frames er godkendt til integration. De øvrige
animationer er ikke påbegyndt, fordi opgaven kræver godkendt walk først.

Efterfølgende feedback: Jonas afviste hovedets artsgenkendelighed. Et enkelt
nyt E_000-hovedstudie er bevaret under `head_revision/`, med før/efter,
uændret validator og separat rapport. Studiet har ingen individuelle
validatorfejl, men består ikke den præcise 2 px-regel og er ikke godkendt.
Tallene nedenfor beskriver de to oprindelige 24-frame-forsøg; det nye studie
tilføjer én revisionspose, ikke en ny unik animationstidsframe.

Branch: `codex/iguanodon-rig-anim-2026-10-12`, baseret på
`origin/claude/project-thread-9luicd`. Base-commit og SHA-256 for uændrede
rig-værktøjer, validator og referencer står i `audit_summary.json`.

## Antal og validering

| Resultat | Første forsøg v1 | Rettelsesforsøg v2 |
| --- | ---: | ---: |
| Eksporterede walk-frames | 24 | 24 |
| Validatorfejl, walk | 10 | 35 |
| Frames uden individuelle validatorfejl | 16 | 2 |
| Frames uden individuelle **eller seriefejl** | 13 | 0 |
| Frames med hele silhuetten højst 2 px fra guiden | 0 | 0 |
| Visuelt godkendte frames | 0 | 0 |
| Validatorens exit-kode | 1 | 1 |

Der er tegnet 48 versionsframes, svarende til **24 af de krævede 120 unikke
animationstidsframes**. 24 frames blev forsøgt rettet; **0 godkendte rettelser**.
Alle 120 rig-guideframes blev genereret, men de er ikke færdig spilgrafik og
tæller ikke som leverede animationsframes. Root-mappens 24 PNG'er er v1,
valgt som det mindst fejlende forsøg til sammenligning; de er stadig afvist.
`rejected_v1/` og `rejected_v2/` bevarer begge forsøg, deres rapporter og previews.

Slutkørslen uden `--states` gav **exit 1, 106 fejl**: 96 manglende
idle/run/attack/hurt/death-frames og v1's 10 walk-fejl. Se `report.json`,
`validation_full.txt` og `overlay.png`. `walk_report.json` er v1's walk-kontrol.
Ingen komplet serie består validatoren. De 13 frames uden validatorfejl
består stadig ikke den strengere silhuetregel eller den visuelle kontrol.

Validatorens tolerance måler 85 % præcision/dækning med 2 px slæk; det er
ikke det samme som opgavens krav om højst 2 px afvigelse for hele silhuetten.
En separat kontrol af alle silhuetpixels med uændret 2 px-radius står i
`audit_summary.json`. Den erstatter ikke validatoren.

## Præcise walk-fejl i det valgte v1-forsøg

- S_000, S_003, S_005: tyngdepunkt henholdsvis ca. 3,6, 3,1 og 3,3 px fra riggen.
- S_005: benene matcher rig-frame S_003 bedre end deres egen fase.
- N_000: benområde 0,69 mod minimum 0,70.
- N_001 og N_003: matcher henholdsvis rig-frame N_002 og N_005 bedre.
- Hele N_000–005: benbevægelse 47,87 % af riggens, under minimum 50 %.
- E_003: matcher rig-frame E_004 bedre end sin egen fase.
- W_005: bbox-størrelse afviger ca. 11 %.

Det betyder 11 berørte frames, når N-seriefejlen medregnes:
S_000/003/005, N_000–005, E_003 og W_005.
Alle navne har præfikset `iguanodon_walk_` og suffikset `.png`.

V2 forsøger at rette både disse ben-/ankerfejl og de for varme markeringer.
Farverne bliver køligere, men geometrien forværres: alle S har tyngdepunktsfejl,
alle E/W har størrelsesfejl (ca. 13–18 %), og samtlige retninger har utilstrækkelig
benbevægelse. Bevægelsesforholdene er ca. S 36 %, N 41 %, E 33 %, W 29 %.
Fasefejl rammer N_000/001/003/004, E_002/003 og W_000/003/005.
Alle 24 v2-frames er berørt af individuelle eller seriefejl. De præcise
fejltekster og metrics står i `rejected_v2/report.json` og dets overlay.

## Visuel kontrol

Kontrollen omfatter samtlige native PNG-poser på lyse/mørke kontaktark ved 1×
og nearest-neighbor 4×, arts-/stilreferencearket, begge overlays og
validatorens benfase-, bevægelses- og loop-målinger. GIF'er ved 8 fps er leveret
i hver retning på begge baggrunde ved 1×/4× til Jonas' afspilning og kontrol.
Ingen real GDevelop-test af disse frames er foretaget; de er ikke integreret.

**Artsgenkendelighed i alle retninger: ikke godkendt.** Lang hale og kraftige
hofter er bevaret, men hovedet er for generisk og tommelfingerpiggen kan ikke
aflæses entydigt som en anatomisk korrekt indvendig håndpig i hele serien.
Små lyse hånd-/fodpixels dokumenterer ikke Iguanodon-identitet. S/N har meget
enkle, afrundede lemmer. En blind artsgenkendelighedstest med en person uden
filnavne er ikke udført og kan derfor ikke angives som bestået.

**Match med Iguanodon-referencen: ikke godkendt.** V1 erstatter referencegrå
pletter med varme beige/orange bånd og et lysere næb. V2 nærmer sig oliven/grå,
men de regelmæssige lyse rygbånd og den ændrede ben-/kropsform er stadig ikke
en trofast kopi af det eksisterende design. Ingen nyt design godkendes.

**Match med eksisterende Primal Run-stil: ikke godkendt.** Fast palette,
binær alpha og pixels er teknisk korrekte efter eksport. Det er ikke en garanti
for stilmatch: markeringer, glattere kropsshading og lemmernes læsbarhed varierer
fra referencerne. Repositoryets egne regler beskriver de eksisterende arts-
og animationseksempler som `prototype_static`, ikke selvstændigt godkendt
produktionsgrafik. De anvendes som etablerede stilreferencer uden at opfinde
en eksisterende kvalitetsgodkendelse.

**Anatomisk kontinuitet, fodkontakt og troværdig gang: ikke godkendt.**
Markeringernes form, bentykkelse, fødder og hale varierer. Validatoren måler
reel benbevægelse og afviser ovenstående faser; helkropsbevægelse eller
teksturvariation bruges ikke som erstatning. Et fast eksport-origin på 72,72
beviser ikke, at det tegnede anatomiske hoftepunkt forbliver dér.

## Referencer og kildehistorik

Artsfacit: `PRIMAL_RUN_Game/assets/new_species/iguanodon_{S,N,E,W}.png`.
Stil-/kamerasammenligning: `PRIMAL_RUN_Game/assets/enemy_full/`:
`parasaurolophus_walk_{S,E}_000.png`, `triceratops_walk_{S,E}_000.png` og
`tyrannosaurus_walk_{S,E}_000.png`. Filer og hashes står i `audit_summary.json`;
`references_1x.png`/`references_3x.png` viser dem sammen uden at ændre kilderne.

Riggen blev kørt med opgavens præcise kommando. `walk_pose_reference.png`
er udelukkende et posereferenceark: rig-canvasser beskåret med 8 px på hver
side og forstørret lossless 2×, seks kolonner og rækker S/N/E/W.
Ingen synlige rig-pixels blev skåret af. Det er ikke en færdig spriteatlas.
`guide_rig.json` bevarer joints, foot_contact og alle 120 guide-hashes.

`walk_source_v1.png` og `walk_source_v2.png` er bevarede imagegen-originaler.
Prompts står i `generation_prompts.json`. V1 anvender posearket og referencearket;
v2 anvender de samme referencer samt v1 som rettelseskilde. Alle retninger er
genereret i arket; eksporten roterer eller spejler intet. Separat generering
er ikke i sig selv bevis for korrekt West-lys eller konsistent anatomi.

Eksporten følger enemy_full-pipelinens faste heltalsprøvetagning, alpha>=192,
Primal Earth 32-kvantisering og eksplicit hofteregistrering. Et review-only
script, `export_review.py`, håndterer walk-arkets deklarerede 6×4 celler og
skriver udelukkende til review-mapper. Det eksisterende whole-family-exporter
skriver direkte til assets og ændrer manifester, så det kan ikke køres på disse
afviste review-ark under integrationsstoppet. Ingen pixeltegning, limb-warp,
silhuetkopiering fra riggen, smoothing eller bbox-centrering anvendes.
Review-manifester angiver kilde, crop, sample phase, offset, anchor og hashes.

## Reproduktion

Kør fra repository-roden:

```sh
python tools/rig_animate.py --species iguanodon --sheet PRIMAL_RUN_Rig/iguanodon_sheet.png --gif PRIMAL_RUN_Rig/gif
REVIEW=PRIMAL_RUN_Game/Source_Generated/iguanodon_rig_review_2026_10_12
python "$REVIEW/export_review.py" "$REVIEW/walk_source_v1.png" "$REVIEW"
python tools/validate_rig_frames.py --species iguanodon --frames "$REVIEW" --rig PRIMAL_RUN_Rig/iguanodon --states walk --sheet "$REVIEW/overlay_walk.png" --report "$REVIEW/walk_report.json"
# Forventet exit 1: walk fejler.
python tools/validate_rig_frames.py --species iguanodon --frames "$REVIEW" --rig PRIMAL_RUN_Rig/iguanodon --sheet "$REVIEW/overlay.png" --report "$REVIEW/report.json"
# Forventet exit 1: 96 manglende frames plus walk-fejl.
```

## Begrænsning og næste nødvendige arbejde

De to imagegen-kørsler har ikke kunnet holde både identitet, benfaser,
anatomiske ankre og silhuetter inden for kravene. Det dokumenterer dette
forsøgs begrænsning, ikke et bevis for at enhver fremtidig metode er umulig.
Et nyt forsøg kræver lokalt tegnede rettelser med kontrollerede hånd-/fod-
positioner og samme artsdesign; det må fortsat bruge uændret rig og validator.
Walk skal først bestå automatisk og visuelt, derefter de manglende 96 frames.

Rig, validator og tolerancer er uændrede. Ingen assets, spilmanifester,
`animated:true`, merge, gh-pages eller publicering er ændret. Resultatet
bevares som en afvist review-leverance på egen branch.

## Repository-kontroller

- `python PRIMAL_RUN_Prototype_Kit/tools/validate_kit.py`: PASS, 104 assets.
- `python validate_sprites.py`: teknisk PASS, 176 bevarede assets;
  0 godkendte animationer i den historiske pakke.
- `export_checks.json`: PASS for alle 24 PNG'er i hver review-version,
  inklusive RGBA, canvas, palette, binær alpha, transparent RGB, 2 px margin,
  kildehenvisninger og seks frames i hver GIF. Root er en kopi af v1,
  så dette er ikke 72 unikke leverede tidsframes.
- De 37 testfiler i `npm test` bestod, inklusive rig-animator-kontrollen.
  Testene blev kørt i `/tmp/primal-iguanodon-checks`, en kopi af base-branchens
  filer uden det nye review-materiale, så gamle rapporter/assets ikke overskrives.
- Første `npm test` stoppede ved manglende Playwright-browser. Browserdownload
  fik HTTP 403 `Domain forbidden`. Systemets `/usr/bin/chromium` virker med
  den understøttede `PRIMAL_CHROME_PATH` og netværksadgang til lokal server.
  Et forsøg uden netværksadgang fejlede i Chromiums socket-oprettelse.
- Browserdelen blev derefter kørt separat med system-Chromium og lokal
  netværksadgang: de første 14 suites bestod. Suite 15,
  `tests/roguelite-browser.cjs:16`, fejlede efter 30 sekunders timeout ved
  `run.exploration === exploreBase + 1` efter et redevalg. De resterende 15
  suites blev ikke kørt, fordi testkæden stoppede. **Den samlede npm-suite er
  derfor ikke grøn.** Fejlen er observeret i kopien af den uændrede base;
  der er ikke lavet gameplay-ændringer for at skjule den.
- `npm_test.log`, `npm_test_system_chromium.log`, `browser_tests.log` og
  `kit_tests.log` bevarer kørselsresultaterne. Kit-browserdelen bestod separat:
  alle tre suites for retninger, progression og lokale filer.

Disse kontroller handler om det eksisterende repository og teknisk eksport;
de godkender hverken de nye Iguanodon-frames eller deres GDevelop-runtime.
