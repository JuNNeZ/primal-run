# Codex: tegn en art i løse dele, så Claude kan rigge den

Du tegner én art i hvileposition i fire retninger, men hver kropsdel på sit eget lag. Claude sætter bevægelsen på
bagefter (gang, løb, angreb, skade, død, 120 frames), så du skal ikke tegne animationer. Allosaurus er lavet sådan
(`PRIMAL_RUN_Game/Source_Generated/cutout/allosaurus/`) og er det bedste eksempel at kigge i.

Én art pr. opgave. Rækkefølge og noter pr. art står i tabellen nederst.

## Hvad der var galt med de gamle tegninger (ret det)

- Tobenede dyr har benene lodret **under** kroppen som en fugl, ikke spredt ud til siden som en øgle. Set oppefra
  (S/N) stikker fødderne kun lidt ud på hver side af kroppen, men de skal kunne ses.
- Firbenede dyr har også benene under kroppen. Forbenene sidder under skuldrene, bagbenene under hofterne.
- Formerne må ikke være runde pølser. Tegn kantet kranie, tydelige kæber, muskler på lår og hals, en spids hale og
  mønstre, ligesom de godkendte `assets/player_full/baryonyx_*` og `carnotaurus_*`.
- Hovedet følger fossilet. Se noten for arten.

## Lærred og regler (som altid)

- 144×144 RGBA, kun Primal Earth 32 (`palette.json`), alpha 0 eller 255, gennemsigtig RGB 0.
- Hoften (kroppens anker) ligger på pixel **72,72** i alle retninger. Samme kamera og lys som
  `assets/new_species/<id>_<retning>.png`. Brug dem til størrelse, kamera og farver, men ikke til form.
- Fire retninger: S (mod beskueren), N, E (mod højre), W (mod venstre). W skal tegnes for sig og må ikke spejles.

## Delene

Hver del er sin egen PNG på hele 144×144-lærredet, placeret præcis hvor den sidder i hvileposen. Lagt oven på
hinanden i lagrækkefølge giver de den færdige tegning. Hvilke dele en art har, afhænger af kropsbygningen:

| kropsbygning | dele |
|---|---|
| alle | `body`, `neck`, `head`, `jaw`, `tail1`, `tail2`, `tail3` |
| tobenet (bagben) | `thigh_L/R`, `shin_L/R`, `foot_L/R` |
| små arme | `arm_L/R` (hele armen med kløer) |
| firbenet, bagben | `thigh_L/R`, `shin_L/R` (skinnebenet med foden) |
| firbenet, forben | `upperarm_L/R`, `forearm_L/R` (underarmen med foden) |
| Pteranodon | `wing_L/R` (hele vingen fra skulderen) |
| Microraptor | `forewing_L/R`, `hindwing_L/R` |
| Archelon | `front_L/R`, `hind_L/R` (luffer); `body` er skjoldet |

`L` er dyrets egen venstre side. Kør skabelonen (nedenfor), så står de præcise delnavne for din art i `parts.json`.
En del, arten ikke har, udelader du (fx `neck` på Archelon). Armene på Therizinosaurus og Oviraptor er en del af
`body`, fordi riggen ikke bevæger dem.

- Tegn hver del **hel**, også det stykke, der er skjult bag andre dele, og også det fjerne ben, der næsten ikke ses.
  Det kommer til syne, når delen drejer.
- Lad delene overlappe 2–3 px ved leddet, og gør leddets ende rund, så der ikke opstår huller, når den drejer.
- **Tegn ikke det sorte omrids,** heller ikke en mørk kant hvor en del møder sin forælder (halsrod, haleled, hofte).
  Riggen tegner selv 1 px `#151b19` rundt om hele dyret og der, hvor en del ligger over en anden, men ikke hen over et
  led. Mørke toner inde i delen (skygger, striber, mundlinje) er fine.

## Skabelon at starte fra

```
python tools/cutout_rig.py --species <id> --template SKABELON
```

Det skærer min 3D-model ud i de samme dele med `parts.json`, lagrækkefølge og drejepunkter. Brug den kun til
filnavne, størrelse og ca. placering. Benene i skabelonen er spredt ud som på en øgle, og det er netop det, du skal
rette: tegn benene under kroppen og flyt `pivot`/`tip` i `parts.json` med, hvor du har tegnet leddene.

T-rex har ingen 3D-model. Den bruger Allosaurus' bevægelse, så start fra `--template allosaurus` og omdøb filerne
til `tyrannosaurus_*`. Riggen skalerer skridtene efter de ben, du tegner.

## Filer

Læg alt i `PRIMAL_RUN_Game/Source_Generated/cutout/<id>/`:

```
<id>_<D>_<del>.png        én pr. del og retning (fx stegosaurus_E_upperarm_L.png)
<id>_<D>_full.png         alle delene lagt sammen (kontrol)
<id>_parts.json           se nedenfor
```

`<id>_parts.json`:

```json
{
  "species": "allosaurus",
  "directions": {
    "E": {
      "order": ["thigh_R", "shin_R", "foot_R", "arm_R", "tail3", "tail2", "tail1", "body", "neck", "jaw", "head",
                "thigh_L", "shin_L", "foot_L", "arm_L"],
      "parts": {
        "body":    {"parent": null,    "pivot": [72, 72], "tip": [90, 70]},
        "thigh_L": {"parent": "body",  "pivot": [74, 70], "tip": [78, 80]},
        "...":     {}
      }
    }
  }
}
```

- `order`: lagrækkefølgen bagfra og frem for den retning (det, der er længst væk fra kameraet, kommer først).
- `pivot`: pixel-punktet hvor delen drejer om leddet til sin forælder (hofte, knæ, ankel, skulder, albue, halsrod,
  kæbeled, vingerod).
- `tip`: pixel-punktet hvor næste del sidder fast (knæ for låret, ankel for skinnebenet, tæer for foden, snudespids
  for hovedet, halespids for `tail3`, vingespids for en vinge).

## Kontrol før du afleverer

```
python tools/cutout_rig.py --species <id> --parts MAPPE --out /tmp/frames --gif /tmp/gif
```

Scriptet afviser delene, hvis en PNG ikke er 144×144, har farver uden for paletten, har halvgennemsigtig alpha, hvis
et `pivot`/`tip` ikke ligger på delen, eller hvis delene lagt sammen afviger fra `<id>_<D>_full.png`. Gå igennem GIF'erne
(gang, løb, angreb), og ret de dele, der hopper, åbner huller i leddene eller viser en mørk streg ved et led.
Dødsanimationen bliver en 2D-krumning, og spillet viser derefter liget, så den skal du ikke tegne.

Vis Jonas de fire `_full.png` side om side. Han godkender udseendet, og filkontroller godkender aldrig kunst.
Lav en gren `codex/<id>-cutout` fra `claude/project-thread-klzsxf` (der ligger værktøjet), commit kun mappen
`cutout/<id>/` og lav en draft-PR. Claude lægger derefter frames i spillet.

## Arterne, i den rækkefølge de skal laves

| # | art (`<id>`) | bygning | det vigtigste at få rigtigt |
|---|---|---|---|
| 1 | `tyrannosaurus` | tobenet + arme | Dyb, bred, kasseformet kranie med kraftig underkæbe og tykke tænder; små ru knuder over øjnene, øjnene vender lidt frem. Tyk, muskuløs hals. Ganske små arme med to fingre. Tykke lår, lange skinneben, vandret krop med halen som modvægt. Behold farverne fra `assets/enemy_full/tyrannosaurus_*` (kobber/rødbrun med mørke striber) og den samme størrelse på lærredet. Det er bossen, så den skal se tung og farlig ud. |
| 2 | `spinosaurus` | tobenet + arme | Lang, smal krokodillesnude med næsebor langt tilbage. Højt sejl (rust/orange) langs ryggen. Korte bagben, kraftige arme med stor tommelklo, høj padleformet hale. |
| 3 | `stegosaurus` | firbenet | Korte forben og lange bagben, så ryggen er højest over hoften. To forskudte rækker af plader, fire halepigge, lille, lavt hoved helt nede ved jorden. |
| 4 | `iguanodon` | tobenet bagben + forben | Kraftige bagben, forben der kan bære vægt, tommelpig på hver hånd, langt hestelignende hoved med næb. |
| 5 | `edmontosaurus` | tobenet bagben + forben | Bredt, fladt andenæb uden kam, lang lav krop, kraftig hale. |
| 6 | `therizinosaurus` | tobenet (armene i `body`) | Oprejst krop med tyk mave, lang hals, lille næbhoved, lange arme med tre meget lange seglkløer. Grå/creme fjer. |
| 7 | `pachyrhinosaurus` | firbenet | Tyk, flad, lys næseknude (intet næsehorn), krave med pigge, tungt bygget. |
| 8 | `protoceratops` | firbenet | Lille og sandfarvet, krave og papegøjenæb, ingen horn. |
| 9 | `oviraptor` | tobenet (armene i `body`) | Fjer, tandløst papegøjenæb, rund orange kam, lange arme med kløer. |
| 10 | `psittacosaurus` | tobenet + arme | Papegøjenæb, små horn på kinderne, børster på halen. |
| 11 | `dryosaurus` | tobenet + arme | Lille og slank planteæder, lange ben, lang hale. |
| 12 | `hypsilophodon` | tobenet + arme | Lille, grønbrun med mørke striber, store øjne. |
| 13 | `leaellynasaura` | tobenet + arme | Bitte lille, meget lang hale, store lyse øjne, grå/blå. |
| 14 | `pteranodon` | vinger | Set oppefra i flugt. Lang, tandløs næb og en kam der peger bagud. Vingerne er hele dele fra skulderen. |
| 15 | `microraptor` | fire vinger | Lille rovdinosaur med vinger på både arme og ben, sort-iriserende fjer. |
| 16 | `archelon` | luffer | Kæmpe havskildpadde med riflet skjold, krogformet næb og fire luffer. |
