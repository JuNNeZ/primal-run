# Source generation history

Generated using image_gen with a native directional reference sprite for each
species. Six columns, five rows, transparent landscape1536×1024; no labels.
Every source is kept lossless. Source filenames and anatomical registration
landmarks are in sources.json; SHA-256 hashes are in player_full_manifest.json.

Common source prompt:

Create a full 1990s PC/SNES top-down dinosaur pixel art animation atlas matching the attached reference's species, natural colours and markings. Head faces DOWN the screen (South) in EVERY pose, tail up, same overhead camera and left-top light. LANDSCAPE 1536x1024 transparent sheet, EXACT SIX columns FIVE rows of evenly spaced invisible cells, thirty complete individual dinosaurs. Cell hip midpoint at cell centre, same body anatomy, scale and markings throughout. Body fits inside each cell with generous padding, no labels, borders or background. Row1: columns1-4 four breathing idle frames; columns5-6 two hit/recoil frames. Row2 six distinct walking frames, alternating legs and tail balance, seamless closed gait cycle. Row3 six distinct sprint frames, stronger strides, seamless cycle. Row4 six attack frames: ready, windup, active anticipation, contact, recoil, return ready. Row5 six death frames: hit reaction, knees buckle, fall, collapse, settle, still complete corpse. Crisp pixel clusters, semi-realistic anatomy, no smoothing or antialiasing. ALL cells are down-facing overhead poses including attacks and corpses. No missing toes/tail tips. Complete real temporal frames, not a concept sheet.

East: head RIGHT, tail LEFT; retain overhead view, both torso sides visible.
North: head UP, tail DOWN; draw a separate North view, upper-left lighting,
never rotate South. Ask explicitly for sequential collapse/splayed corpse.
West: head LEFT, tail RIGHT; never mirror East; specify exact cell centres.

Ankylosaurus overrides jaw attack with a six-frame tail-club sweep while the
mouth stays closed. East initially produced a jaw attack and was rejected;
ankylosaurus_E_rejected_bite.png preserves it. A separate image_gen correction
preserved rows1–3 and replaced row4 with ready/up-left/up/down-left/recoil/ready
tail poses, retaining a complete padded club. Only corrected East is exported.

Export is fixed2px nearest sampling, palette/alpha normalization and reviewed
expanded crops, excluding isolated neighbour fragments. No new artwork is
drawn by the exporter. Frames retain prototype status despite complete plans.
