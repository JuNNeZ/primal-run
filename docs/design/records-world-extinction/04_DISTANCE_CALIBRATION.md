# System 3 – Distance calibration

Status: **Needs a fix (root cause found)**. The game measures distance correctly in **world pixels** but
displays pixels as metres.

## 1. Finding: why two short runs showed 103 km

Code (`core.js`, player movement in `step()`):

```js
const beforeX = r.player.x, beforeY = r.player.y;
this.travel(r.player, dx / n * speed * dt, dy / n * speed * dt);
r.stats.distance += Math.hypot(r.player.x - beforeX, r.player.y - beforeY);
```

- Only the player's own movement input moves the counter, and only by the **actual** displacement after
  terrain slowdown, deep-water blocking (non-swimmers), rock push-out and map clamping. Lava does not block the
  player (`travel()` only refuses lava for animals); walking through it counts like any ground.
- `bankLifetime()` adds `r.stats.distance` to `save.lifetime.distance` once per run (one call site, in `finish()`).
- The achievements screen prints `(life.distance / 1000).toFixed(1) + ' km'` → **1 px is shown as 1 m**.
- The run report prints "Distance (pixels)" and "Estimerede skridt" = px / 24.

Probe (`probes/audit_probes.cjs`, velociraptor at 170 px/s, enemies removed):

| Measurement | Result |
|---|---|
| 60 s of continuous movement | 9 778 px → shown as **9.8 km** |
| 60 s standing still | 0 px |
| Teleporting the player 500 px | 0 px added |
| Movement needed for "103 km" | **10.5 minutes** |

So 103 km is exactly what ~10 minutes of moving produces. No double counting was found. The Gallimimus
unlock ("Løb 20 km i alt") is therefore reached after ~2 minutes of movement, which is not the intent.

## 2. Calibration method

A metre must mean the same for every species (a T. rex and a compy running 100 m cover the same ground),
so the conversion is **one global constant** `PX_PER_METER`, validated three ways:

1. **Body length.** Measure each species' body length in world pixels (alpha bounding box of the E-facing
   idle frame × render scale; T. rex and Deinosuchus render at 2×) and divide by a reference adult length.
2. **Speed plausibility.** `speed_px_s / PX_PER_METER` must fall inside published top-speed estimates.
3. **Map plausibility.** A level (≈ 4 000–5 400 px wide) should read as a believable valley, a few hundred metres across.

Audit measurements (sprites as shipped; reference lengths are typical adult estimates):

| Species | Body px | Ref. length | px/m | Speed px/s | m/s at 20 px/m |
|---|---|---|---|---|---|
| Compsognathus | 26 | 1.0 m | 26.0 | 175 | 8.8 |
| Velociraptor | 60 | 2.0 m | 30.0 | 170 | 8.5 |
| Utahraptor | 119 | 6.0 m | 19.8 | 155 | 7.8 |
| Pachycephalosaurus | 102 | 4.5 m | 22.7 | 155 | 7.8 |
| Gallimimus | 116 | 6.0 m | 19.3 | 215 | 10.8 |
| Carnotaurus | 117 | 7.8 m | 15.0 | 140 | 7.0 |
| Baryonyx | 123 | 8.5 m | 14.5 | 140 | 7.0 |
| Ankylosaurus | 108 | 7.0 m | 15.4 | 110 | 5.5 |
| Triceratops | 112 | 8.5 m | 13.2 | 100 | 5.0 |
| T. rex | 252 | 12.3 m | 20.5 | 95 | 4.8 |
| Deinonychus (new starter) | 56 | 3.4 m | 16.5 | 165 | 8.3 |
| Deinosuchus | 250 | 10.0 m | 25.0 | 85 | 4.3 |

**Median ≈ 19.6 px/m** (12 species). Small species are drawn larger than true scale for readability, which is why compy and
raptor sit above the median. With **20 px/m**, speeds land between 4 and 11 m/s (plausible for every species),
and a level is roughly 200–270 m wide.

**Recommendation:** `PX_PER_METER = 20`, but only after the validation test in §5 passes. Do not change it
per species.

Effect of the recommendation: Jonas's "103 km" becomes ≈ 5.2 km, a plausible ~10 minutes of running.

## 3. Movement-type rules

| Case | Counts? | Rule |
|---|---|---|
| Normal movement | yes | actual displacement after `travel()` |
| Sneaking / winded / mud / water slowdown | yes | already the actual (smaller) displacement |
| Abilities that move the player (pounce, charge, dash) | yes | they move through the same block; actual displacement |
| Sprinting | – | no separate sprint exists; if added later it uses the same block |
| Knockback / being pushed by an enemy | **no** | the player has no knockback today (only `travel()` moves the player); if added, apply it outside the measured block |
| `separateDinosaurs()` overlap resolution | **no** | today it only separates enemies from each other; if the player is ever included, keep it outside the measured block |
| Collision with rocks | yes, net only | push-out happens inside `travel()`; walking into a rock nets ~0 |
| Map-edge clamp | yes, net only | clamped movement adds 0 |
| Level transition / respawn position reset | **no** | `nextStage()` sets x/y outside the block |
| Teleport/debug/test placement | **no** | verified: +0 |
| Camera movement, cinematics, menu world | **no** | not player state |
| Standing still with no input | **never** | `n === 0` skips the block; add an assert in tests |
| Input held while blocked by deep water (non-swimmers) | 0 | blocked axes produce 0 displacement; lava never blocks the player |

## 4. Implementation notes

- Keep storing **pixels** (`r.stats.distance`, `lifetime.distance`) – no save migration of the unit.
- Add `PX_PER_METER` to the core export; all UI goes through `formatDistance(px)` → "850 m" / "3,4 km"
  (locale decimal separator through i18n).
- Replace "Distance (pixels)" and "Estimerede skridt" with metres and, if wanted, steps from stride length
  per species (`stepsPerMetre` measured from the walk cycle) – otherwise drop steps.
- **Gallimimus unlock:** today 20 000 px ≈ 2 minutes of running. Keep the stored threshold in px, but restate
  the achievement as metres. Proposal: **10 km = 200 000 px** (~20 minutes of total movement at 170 px/s).
  Players who already earned it keep it (achievements are never revoked).
- Titles and boards use `distanceM` (§ titles data).

## 5. Validation test (must pass before the constant ships)

1. Unit: for every species, 60 s straight-line movement on open ground → `distanceM / 60` is within
   [3, 13] m/s.
2. Unit: 60 s idle → distance unchanged; 60 s of knockback-only (enemy hits, no input) → unchanged.
3. Unit: walking into a rock for 10 s adds < 1 m.
4. Unit: level width / `PX_PER_METER` between 150 and 400 m for all 8 levels.
5. Visual check (human): body-length table above re-measured with final sprites from Part A; if the median
   moves outside 17–23 px/m, revisit the constant instead of silently keeping 20.
