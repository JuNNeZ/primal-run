# Codex: tegn en art i løse dele, så Claude kan rigge den

Du tegner én art i hvileposition i fire retninger, men hver kropsdel på sit eget lag. Claude sætter bevægelsen på
bagefter (gang, løb, angreb, skade, død, 120 frames), så du skal ikke tegne animationer. Start med **Allosaurus**.

## Hvad der er galt i dag (ret det)

- Theropoder er tobenede. Benene står lodret **under** kroppen (som en fugl), ikke spredt ud til siden som en øgle.
  Set oppefra (S/N) må fødderne højst stikke en smule ud på hver side af kroppen.
- Formerne må ikke være runde pølser. Tegn kantet kranie, tydelige kæber, muskler på lår og hals, en spids hale og
  en mørk rygstribe, ligesom de godkendte `assets/player_full/baryonyx_*` og `carnotaurus_*`.
- Hovedet følger fossilet: Allosaurus har et kileformet kranie, små trekantede horn foran øjnene og to lave kamme
  hen ad snuden.

## Lærred og regler (som altid)

- 144×144 RGBA, kun Primal Earth 32 (`palette.json`), alpha 0 eller 255, gennemsigtig RGB 0.
- Hoften (kroppens anker) ligger på pixel **72,72** i alle retninger. Samme kamera og lys som
  `assets/new_species/<id>_<retning>.png`. Brug dem til størrelse, kamera og farver, men ikke til form.
- Fire retninger: S (mod beskueren), N, E (mod højre), W (mod venstre). W skal tegnes for sig og må ikke spejles.

## Delene

Hver del er sin egen PNG på hele 144×144-lærredet, placeret præcis hvor den sidder i hvileposen. Lagt oven på
hinanden i lagrækkefølge giver de den færdige tegning.

| del | sidder fast på | bemærk |
|---|---|---|
| `body` | (rod) | torso med hofter og bryst |
| `neck` | body | |
| `head` | neck | overkæbe og kranie |
| `jaw` | head | underkæbe, lukket mund |
| `tail1`, `tail2`, `tail3` | body, tail1, tail2 | tre stykker fra roden til spidsen |
| `thigh_L`, `shin_L`, `foot_L` | body, thigh_L, shin_L | venstre bagben (dyrets venstre) |
| `thigh_R`, `shin_R`, `foot_R` | body, thigh_R, shin_R | højre bagben |
| `arm_L`, `arm_R` | body | hele armen med kløer |

- Tegn hver del **hel**, også det stykke, der er skjult bag andre dele. Det kommer til syne, når delen drejer.
- Lad delene overlappe 2–3 px ved leddet, og gør leddets ende rund, så der ikke opstår huller, når den drejer.
- Ingen omrids mellem dele, der hører sammen. Hver del har kun sit eget ydre omrids (sort `#151b19`, 1 px).

## Filer

Læg alt i `PRIMAL_RUN_Game/Source_Generated/cutout/<id>/`:

```
<id>_<D>_<del>.png        én pr. del og retning (fx allosaurus_E_thigh_L.png)
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
- `pivot`: pixel-punktet hvor delen drejer om leddet til sin forælder (hofte, knæ, ankel, skulder, halsrod, kæbeled).
- `tip`: pixel-punktet hvor næste del sidder fast (knæ for låret, ankel for skinnebenet, tæer for foden, snudespids
  for hovedet, halespids for `tail3`).

## Kontrol før du afleverer

1. Alle delene lagt sammen i `order` giver præcis `<id>_<D>_full.png`.
2. Hver PNG holder sig til paletten, binær alpha, 144×144.
3. Hver `pivot` og `tip` ligger inde i delens egne pixels.
4. Vis Jonas de fire `_full.png` side om side. Han godkender udseendet, og filkontroller godkender aldrig kunst.

Commit på en `codex/*`-gren. Claude kører derefter `tools/cutout_rig.py --species <id>`, som lægger rig-bevægelsen på
delene og laver alle 120 frames.
