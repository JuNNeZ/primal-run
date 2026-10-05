# PRIMAL RUN - sprite work

## Repository and cloud work

Read README.md and CLOUD_HANDOFF.md before continuing. The active deliverable is
PRIMAL_RUN_Prototype_Kit; earlier packs are preserved references. There is no
GDevelop project.json yet. Keep browser evidence separate from GDevelop runtime.
Install Python requirements and npm dependencies; use Playwright Chromium in
cloud. Run `python PRIMAL_RUN_Prototype_Kit/tools/validate_kit.py` and `npm test`
after relevant changes. GitHub Actions runs these checks on Linux.
New work uses a codex/ branch. ZIPs are generated outputs, excluded from Git.
Source art is tracked in package Source_Generated directories; do not depend on
the original Windows user profile or temporary clipboard paths.

Read and follow `PRIMAL_RUN_Sprites/SPRITE_RULES.md` before creating, extracting,
editing, exporting or integrating any art. This is the user's project-wide rule.
Include the rule, manifest and validation report with every sprite delivery.
For original v2 demo assets, also follow `PRIMAL_RUN_Demo_v2/SPRITE_RULES.md`.
Its documented native export sizes, shared palette and static-pose scope apply
to that package. The original concept-sheet export must remain unchanged.
For the preserved v3 south walk demo, follow `PRIMAL_RUN_Demo_v3/SPRITE_RULES.md` and its
animation manifest. Preserve V2. Validate the entire fixed-body region and test
movement, stopped and blocked animation states before repackaging V3.
For the corrected v4 walk, follow `PRIMAL_RUN_Demo_v4/SPRITE_RULES.md`.
The user's body-motion and arm-anatomy corrections override the v3 fixed-body
constraint. Preserve V3; export whole poses and verify controlled motion,
loop closure, palette, transparency and browser state changes for V4.
For V5 cardinal directions, follow `PRIMAL_RUN_Demo_v5/SPRITE_RULES.md`.
North is the user's explicit prototype rotation exception; retain its lighting
caveat. Validate all four direction origins and movement/stop/blocked states.
For the offline Prototype Kit, follow `PRIMAL_RUN_Prototype_Kit/SPRITE_RULES.md`.
The fixed palette extends to 32 colors; existing 24 colors remain unchanged.
Action poses are unapproved studies. Export only reviewed overhead enemy cells.
Keep guides, manifest, prompts and independent browser/PNG reports with the kit.

Never describe a concept sheet, extracted direction samples or unreviewed images
as a finished animation. Never replace `prototype_static` with `approved_animation`
until all visual and runtime gates in the rule have passed. Automated file checks
alone do not certify style, anatomy, perspective, animation or GDevelop behavior.

Keep source art intact. Export individual lossless PNGs; use native pixels and
integer coordinates. Do not resize with smoothing or invent missing frames during
extraction. Update the export manifest whenever assets change. Run
`python validate_sprites.py` after exporting, and inspect every changed asset on
both light and dark backgrounds. Report any remaining source limitations plainly.
