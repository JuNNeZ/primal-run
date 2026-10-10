# System 8 – Art QA and character anatomy

Status: **Improvement of existing rules** (`PRIMAL_RUN_Sprites/SPRITE_RULES.md`, `PRIMAL_RUN_Game/SPRITE_RULES*.md`,
`PRIMAL_RUN_Game/SPECIES_ANATOMY.md`). Nothing here replaces them; it adds measurable checks, species
landmarks, and an approval flow. Redrawing existing walk/idle sets is **new work after Part A** (A1–A6 own
attacks, idles, limp, water tiles and raptor corpses).

All existing requirements stay: fixed palette, native pixels, no smoothing, transparent background, declared
canvas/pivot, manifest + validation file per delivery, review page per delivery.

## 1. Findings

### 1.1 Deterministic (measured on `codex/sprites-and-mechanics` @ 4d9115f)

E vs. horizontally mirrored W, alpha-mask IoU per frame, averaged over all states (1.0 = W is an exact mirror):

| Species (set) | Mean IoU E↔mirror(W) | Lowest state (min frame IoU) | N area / E area | S area / E area |
|---|---|---|---|---|
| deinonychus (player, new starter) | 0.44 | death 0.32 | 0.65 | 0.89 |
| gallimimus (player) | 0.47 | hurt 0.27 | 0.78 | 0.78 |
| baryonyx (player) | 0.48 | attack 0.38 | 0.80 | 0.80 |
| tyrannosaurus (enemy) | 0.51 | walk/idle 0.39 | 0.77 | 0.73 |
| compy (player) | 0.54 | run 0.29 | 0.71 | 0.75 |
| triceratops (enemy) | 0.56 | run 0.48 | 0.71 | 0.83 |
| ankylosaurus (player) | 0.58 | run 0.48 | 0.96 | 0.97 |
| deinosuchus (enemy) | 0.58 | death 0.48 | 0.67 | 0.86 |
| velociraptor (player) | 0.60 | death 0.40 | 0.68 | 0.77 |
| utahraptor (player) | 0.61 | death 0.38 | 0.68 | 0.75 |
| carnotaurus (player) | 0.62 | run 0.51 | 0.81 | 1.01 |
| pachycephalosaurus (player) | 0.63 | death 0.48 | 0.88 | 0.83 |
| parasaurolophus (enemy) | 0.63 | death 0.49 | 0.72 | 0.85 |

Reading: **no species has W as a mirror of E** – they are separate drawings, which is where the "some directions
look worse" impression comes from. Part of the low IoU is legitimate (walk-cycle phase can differ per direction),
so IoU alone is a flag, not a verdict. N views are 30–35 % smaller in area than E/W for the raptors, Deinonychus
and Deinosuchus – a strong hint that north is under-drawn. A1 attack frames integrated on 4d9115f (Triceratops,
Ankylosaurus, Pachycephalosaurus, Gallimimus) are included in these numbers.

### 1.2 Vision checks (reviewer look, needs human confirmation)

- **T. rex walk W** (enemy_full, frames 0, 1, 5): the far forelimb is drawn at the same size and claw count as a
  hind foot and placed low beside the chest, so the silhouette reads as three legs (two below, one above).
  The W body is also bulkier than the mirrored E walk.
- **Triceratops idle W:** only two horns read; the nasal horn is missing.
- **Triceratops idle E:** three horns of nearly equal length; the nasal horn should be clearly shorter and sit on
  the snout ahead of the brow horns.
- Triceratops S looks correct (two brow horns, short nasal horn); N shows horn tips above the frill – acceptable
  per the existing rule, check that the central tip is the nasal horn and not a frill spike.

## 2. Species landmarks (additions to SPECIES_ANATOMY.md)

General top-down rules for **bipeds** (compy, raptors, carnotaurus, pachy, gallimimus, baryonyx, T. rex):

- Exactly two ground-contact hind feet; in walk/run they alternate fore/aft along the body axis.
- Forelimbs: area ≤ 35 % of a hind foot, attached within the front 30 % of the torso, **no ground shadow**,
  lighter value than the feet, claws ≤ 2 px each. T. rex: two fingers, arms ≤ 25 % of foot area and often
  hidden under the chest in N/S.
- In E/W at most one forelimb may break the body outline on the far side; never place it level with the feet.

**Quadrupeds** (triceratops, ankylosaurus, deinosuchus): four feet visible in E/W with a diagonal gait
(front-left with hind-right); body width constant across frames ± 2 px.

| Species | Must have | Must not |
|---|---|---|
| Triceratops | 2 long brow horns above the eyes pointing forward; 1 nasal horn on the snout midline, length 30–45 % of a brow horn; frill behind the head; beak | equal-length three horns; missing nasal horn in E/W; frill spike mistaken for a horn |
| T. rex | massive head ≥ 18 % of body length; tiny two-finger arms; thick tail tapering | arms read as legs; head narrower than neck |
| Carnotaurus | exactly 2 brow horns, both attachment points visible in E/W | nasal horn; unicorn single horn |
| Pachycephalosaurus | round dome, small knobs at the back | horns |
| Ankylosaurus | tail club, paired armour rows | horns |
| Baryonyx | long narrow snout, large thumb claw | second tail (hind feet in N must not read as a tail) |
| Gallimimus | beak, long neck, long legs | teeth |
| Deinosuchus | long jaw, sprawling legs | upright legs |
| Velociraptor / Utahraptor / Deinonychus | sickle claw on each foot, feathered arms; Deinonychus sits between the two in size | arms longer than legs; arms read as a second leg pair |
| Compy | small, long tail | adult-raptor proportions |

## 3. Mirroring policy

- **E/W may be produced by horizontal mirroring** when all hold: the species pattern is bilaterally symmetric
  (stripes/markings may flip), the light convention is "light from the north/top" so a flip keeps light
  direction, and the skin variants are palette swaps. All current species meet the first and last conditions.
  Check each set's highlight side before approving: if highlights sit on one lateral side, repaint highlights
  to top-centre first.
- Choose the better-reviewed of E or W as master per state; export the other as a **lossless flip** (exporter
  writes the file; runtime unchanged, manifests unchanged, hashes recorded).
- **N and S stay separate drawings** (a 180° rotation exception exists for Baryonyx N, approved by Jonas
  2026-10-09; no new rotations without explicit approval).
- Mirrored sets must still pass the anatomy checklist (a flip can expose a wrongly sided sickle claw etc.).

## 4. Checks

### 4.1 Deterministic (script, CI) – extend the existing validators

| Check | Threshold |
|---|---|
| Palette | every opaque pixel in `palette.json` (existing) |
| Alpha | binary alpha (0 or 255) except declared effect layers (existing) |
| Canvas & pivot | declared size and pivot in manifest (existing) |
| Edge clearance | silhouette ≥ 2 px from every canvas edge |
| Pivot drift | hip anchor (centroid of lowest 30 % of alpha rows) moves ≤ 2 px within a cycle |
| Frame continuity | consecutive-frame IoU ≥ 0.70 for idle/walk/run (catches pops) |
| Direction volume | N/E and S/E area ratio within the species band (bipeds 0.80–1.05, quadrupeds 0.85–1.05) |
| Mirror consistency | if a state is declared mirrored: IoU = 1.0 and identical pixels; otherwise report IoU < 0.55 as a review flag |
| Player vs enemy version | same species, same state: area ratio 0.95–1.05 after declared scale |
| Frame counts | per state as in the manifest |

Output: `art_qa_report.json` + a contact sheet per species with flags drawn in.

### 4.2 Human / vision-model checklist (per species × state × direction)

1. Count of legs that touch the ground matches the species (2 or 4).
2. Forelimbs read as arms, not legs.
3. Head landmarks (horns, dome, crest, beak, jaw) as in §2.
4. Tail is one continuous shape.
5. Body volume matches the other directions.
6. Gait reads (feet alternate; no sliding).
7. Lighting from the top, consistent across directions.
8. Readable at 1× on a 390 px wide screen next to other species.

A vision model may pre-screen with this prompt: "Top-down pixel sprite of a {species}. Answer yes/no with a
reason for each: 1) exactly {n} ground-contact legs visible … 8)". Its result is advisory; **approval is human**.

### 4.3 Approval

A set is approved when 4.1 passes, 4.2 passes for every direction, and Jonas signs off in the review page; the
manifest records `approved: {by, date, notes}`. Unapproved sets stay "prototype" as today.

## 5. Fix queue (after Part A)

1. T. rex walk W (forelimbs; bulk) → redraw W or replace with mirrored E after review.
2. Triceratops idle/walk/run E and W horn anatomy.
3. Gallimimus and Baryonyx E/W consistency (lowest IoU).
4. Deinonychus, raptor and Deinosuchus north views (area 0.65–0.68 of E); Deinonychus also has the lowest E/W consistency.
5. Re-run the body-length table in `04_DISTANCE_CALIBRATION.md` after redraws.
