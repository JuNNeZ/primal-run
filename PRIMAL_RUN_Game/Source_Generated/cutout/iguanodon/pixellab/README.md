# Iguanodon fra PixelLab (prototype)

Spillet viser dyrene ovenfra i alle fire retninger, også E og W.

- `topdown_input_<D>.png`: S og N fra første forsøg; E = S drejet 90° til venstre, W = S drejet 90° til højre.
- `topdown_output_<D>.png`: PixelLabs svar, ét `edit-images-v2`-kald (seed 21, prompt i `cut_spec.json`). Kostede 10 generationer.
- `topdown_<D>.png`: samme, med den yderste pig på hver hånd malet væk (Iguanodon har én tommelpig, på indersiden). Jonas syntes om udseendet 2026-10-20.
- `input_<D>.png` / `output_<D>.png`: første forsøg, hvor E/W kom tilbage fra siden (forkert kamera). Gemt som reference.

Genskab delene: `python tools/pixellab_cutout.py --species iguanodon cut`, derefter `python tools/rig_to_game.py --species iguanodon --cutout PRIMAL_RUN_Game/Source_Generated/cutout/iguanodon`.

Kunsten er `prototype_static`, indtil Jonas har godkendt animationen.
