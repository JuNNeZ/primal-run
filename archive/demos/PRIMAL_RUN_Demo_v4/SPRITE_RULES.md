# PRIMAL RUN - corrected walk prototype v4

Follow the included v1/v2 rules with these user-requested corrections to v3.
- Six South-facing whole poses at 8 fps; fixed 128x128 canvas and logical origin (64,72).
- Replace the v3 frozen-body rule: hip, torso and tail motion is intentional.
- Keep two muscular hind legs and two small tucked forearms attached at the chest.
  The skull and neck must not acquire ear-like feather fans.
- Native lossless PNG; shared 24-color palette; binary alpha; transparent RGB zero.
- No smoothing, scaling per frame, automatic bounding-box recentering or limb-window assembly.
- Collision and movement use the fixed logical pivot, independent of visible pose motion.
- Review all six whole poses, light/dark previews and 5-to-0 loop closure.
- Browser tests cover movement, stop, blockage, restart and existing demo mechanics.
- Automated checks certify export structure, not anatomy or perfect animation.
- Anatomical registration and residual generated texture variation require visual review.
- Other directions remain static placeholders. GDevelop runtime has not been tested.
- All artwork remains prototype status; production_approved is false.
