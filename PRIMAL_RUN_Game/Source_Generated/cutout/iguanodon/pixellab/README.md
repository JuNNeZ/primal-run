# Iguanodon fra PixelLab (prototype)

- `input_<D>.png`: riggens 3D-skabelon (`cutout_rig.py --template`), 128×128-udsnit af 144-lærredet (forskydning i `cut_spec.json`).
- `output_<D>.png`: PixelLabs svar, ét `edit-images-v2`-kald (edit_with_text, seed 11) for alle fire retninger. Kostede 1 generation af prøveperiodens 40.
- `cut_spec.json`: prompten og hvordan E/W skæres i dele (S/N bruger skabelonens delmasker).

Genskab delene: `python tools/pixellab_cutout.py --species iguanodon cut`. Nyt PixelLab-kald: `... generate` (bruger credits).

Kunsten er `prototype_static`. Intet er godkendt, før Jonas har set den.
