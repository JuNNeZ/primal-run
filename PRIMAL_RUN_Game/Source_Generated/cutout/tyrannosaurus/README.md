# tyrannosaurus — E/W set skråt ovenfra

Revision fra `claude/project-thread-klzsxf` ved `158d6dde2db675337d621ca93b68c9bd41da869d`.
Aktuel brief: `tools/CODEX_CUTOUT_BRIEF.md`, inklusive overhead-kameraet i E/W.
Arbejdsgren: `codex/rex-allo-topdown`.

E/W er tegnet separat med synlig ryg og begge flanker, fødder på begge sider og
lys fra øverste venstre. Ingen spejling eller rotation af W. E-længde:
115 px; 144×144 RGBA, body-pivot 72,72, Primal Earth 32.
S/N PNG'er og deres komplette `parts.json`-retninger er byte-/dataidentiske med basen.
Delnavne og forældre er bevaret. Det fjerne ben og den fjerne arm kommer før alle haledele.

## Aktuelle kilder og genkørsel

- `sources/topdown_core_v3.png`: sammenhængende ryg, hals, hoved og hale i E/W.
  Delene udtages med overlap fra samme tegning, uden mørke tegnede samlingskanter.
- `sources/topdown_EW_v2.png`: separate hele ben/arme. V2-ryg/hals/hale blev fravalgt
  på grund af synlige endeflader; kilden er bevaret til historik.
- `topdown_registration.json`: aktiv registrering for E/W, heltalssampling og navngivne led.
- `source_sampling.json`: aktuel provenance pr. del; S/N-poster er bevaret.
- `registration.json` og `extract.py`: tidligere registrering/eksport, bevaret som historik.
  Brug den nye kommando nedenfor for den aktuelle E/W-revision.
- `sources/README_before_topdown.md`: tidligere leverances noter.
- `topdown_manifest.json`, `SPRITE_RULES.md`, `validation_report.json`: leverancekontrakt og kontrol.

```sh
python PRIMAL_RUN_Game/Source_Generated/cutout/tyrannosaurus/extract_topdown.py
python tools/cutout_rig.py --species tyrannosaurus --parts PRIMAL_RUN_Game/Source_Generated/cutout/tyrannosaurus --out /tmp/frames --gif /tmp/gif
python PRIMAL_RUN_Game/Source_Generated/cutout/tyrannosaurus/review_topdown.py
```

Eksporten udfører kun heltalssampling, fast paletmapping, binær alpha, fravalg af
kildens yderste ink-pixels og translation omkring eksplicitte led. Ingen ny anatomi
tegnes af Python, ingen interpolation eller spejling. Rå kilder og prompts er bevaret.

## Gennemgang

`previews/topdown_compare_SEW_3x.png` viser S/E/W ved samme native skala.
Lys/mørk kontrol ved 1×/3× findes i `topdown_light_*` og `topdown_dark_*`;
alle E/W-dele har 2×-grids på begge baggrunde.
Gang-, løbe- og angrebs-GIF'er er gennemgået frame for frame via
`topdown_gif_*_contact.png` og E/W-loops under `previews/gif/`.
120 rigframes genereres uden afklip; E/W-ledflader forbliver i kontakt i gang/løb/angreb.
S/N i disse kontaktark er referenceoutput fra kontrollen, ikke nye S/N-kildedele.
Eksisterende S/N-GIF-filer bevares uændret.

Kæbeåbning og dødsbevægelse følger den eksisterende 2D-rig. Enkelte yderste
halepixels kan skifte under riggens nearest-neighbor-sampling. Ingen runtime-assets
eller GDevelop-integration er ændret eller testet af denne kildegrafikopgave.

**Status: prototype_static; visual_status=unapproved; production_approved=false.**
Teknisk PASS er ikke kunstgodkendelse. Intet er markeret som godkendt.
