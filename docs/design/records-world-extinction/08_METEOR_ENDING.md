# System 7 – Meteor ending, branching order and storyboards

Status: **Partially implemented elsewhere.** `codex/preserved-feathered-starter` (b2eb9f3, *not merged*) has a
9-second pixel cinematic after the last boss (your species running, meteor arrival, impact/shockwave, death and
ash), the original theme **"Den sidste himmel"**, one impact SFX, a reduced-motion still, and the rules that
seed 1993 and the classic route keep their normal victory, and that Space cannot skip the screens. The current
line (`claude/overhaul` → `codex/sprites-and-mechanics`) only has the short death/victory end scene in `app.js`
(480 × 180 canvas, ~3 s). **Port the preserved cinematic and its tests first, then apply this storyboard on top**
instead of drawing a new one from scratch.

## 1. Branching order

```
Ragnar dies
  └─ bank victory (score, DNA, records, victory=true)              ← normal ending can never be lost
      ├─ seed 1993 / classic campaign → existing victory screen → run report
      ├─ no secret route met → Storyboard N (10.0 s) → run report
      └─ route A or B met    → Storyboard S (0–7.0 s) → choice card
            ├─ "Afslut jagten"        → Storyboard N from 7.0 s → run report
            └─ "Fortsæt ind i asken"  → Level 9 "Den Sidste Himmel"
                  ├─ reach refuge → Storyboard E3 "De blev til fugle" (8.0 s) → run report (victory + survivors)
                  └─ die          → 2.0 s ash fade → run report (victory + "Faldt i asken")
```

Reduced motion (`reducedMotion` setting or OS): each storyboard shows 3 static frames (before, impact, after) for
2 s each with the same text. Space never skips; click/tap or the confirm key after 2 s does (as today).

## 2. Storyboard N – "Himlen faldt" (10.0 s, 480 × 180 native, integer upscale)

Layers back→front: L0 sky gradient · L1 stars/clouds · L2 far volcano silhouettes · L3 horizon glow · L4 meteor
+ trail · L5 mid forest silhouettes · L6 fleeing-animal silhouettes · L7 ground strip · L8 player sprite ·
L9 dust wall · L10 ash particles · L11 flash/fade overlay · L12 text.

| t (s) | Camera | Visual | Sound |
|---|---|---|---|
| 0.0–1.0 | static wide, horizon at y=118 | dusk valley; player species idle on ground strip at x=330 facing W (its own sprite, current skin); Ragnar not shown | wind bed, music silent |
| 1.0–2.5 | slow pan up 8 px, ease-in-out | L0 shifts orange→red; a white point appears top-left (x=60, y=18) | low rumble fades in (−18 dB → −10 dB) |
| 2.5–4.0 | hold | meteor grows 2→14 px with 40 px trail, moving toward (300,118); L6: 4–6 silhouettes run right; player turns to N/E frame | whoosh rising; birds' alarm calls |
| 4.0–4.8 | 1 px shake | meteor touches the horizon behind L5; L3 glow intensifies | whoosh peaks |
| 4.8–5.0 | freeze | everything holds | **silence** (all audio −∞) |
| 5.0–5.3 | – | white flash: 100 % → 60 % → 20 % over 3 steps | impact boom (preserved SFX) |
| 5.3–6.5 | shake 3 px decaying to 0 | shockwave ring expands from (300,118) to full width; L5 trees bend 2 px away; L9 dust wall rises to y=60 | high ringing (tinnitus) + low boom tail |
| 6.5–8.5 | slow push-in 4 % | dust wall overtakes the ground; palette desaturates to ash; player braces (hurt frame), then lies down (death frame 3) – no blood | wind + debris rattle; theme "Den sidste himmel" fades in at 7.0 |
| 8.5–9.5 | hold | near-black, ash particles falling; text "JAGTEN ER VUNDET" then "Himlen faldt." | theme |
| 9.5–10.0 | – | fade to the run report | theme continues under the report |

## 3. Storyboard S and E3

**S (secret route met):** identical to N until 7.0 s, but the player stays standing (no death frames). At 7.0 s
the choice card slides in over the dust: "Noget i dig vil stadig leve. **Fortsæt ind i asken** / **Afslut jagten**".

**E3 – "De blev til fugle" (8.0 s, after reaching the refuge in level 9):**

| t (s) | Visual | Sound |
|---|---|---|
| 0.0–2.0 | player enters the burrow; screen fades to black | footsteps, muffled rumble |
| 2.0–4.0 | text "Uger senere …"; slow fade up on a grey ash plain at dawn | silence → soft wind |
| 4.0–6.0 | three small bird silhouettes fly across left→right; one lands on a burnt stump | bird calls, theme (gentle variant) |
| 6.0–7.5 | text: "De store dinosaurer forsvandt. Nogle overlevede." then "I dag kalder vi dem fugle." | theme |
| 7.5–8.0 | fade to run report with title "De Blev til Fugle" | – |

Scientific note for the text: non-avian dinosaurs died out at the end of the Cretaceous; birds are the surviving
dinosaur lineage. The ending does not claim the player's species survived.

## 4. Implementation notes

- Drawn on the existing end-scene canvas; timeline driven by a data table (`ENDINGS.N/S/E3`) of keyframes so
  tests can assert timing.
- Uses the player's own species sprite and skin; falls back to Velociraptor frames if a frame is missing.
- No stats are changed by the cinematic (no damage, no DNA loss) – matches the preserved-branch rule.
- All text is Danish source through `tools/i18n`.

## 5. Asset manifest (minimal; full queue in `10_ASSET_QUEUE_CHATGPT.md`)

| ID | Size (native px) | Frames | Used in |
|---|---|---|---|
| end_sky_gradient | 480 × 120 | 3 (dusk, red, ash) | N, S |
| end_far_volcanoes | 480 × 60 | 1 | N, S |
| end_forest_silhouette | 480 × 70 | 2 (normal, bent) | N, S |
| end_meteor | 16 × 16 | 4 (growing) | N, S |
| end_meteor_trail | 48 × 12 | 3 | N, S |
| end_shockwave_ring | 480 × 60 | 6 | N, S |
| end_dust_wall | 480 × 140 | 4 | N, S |
| end_ash_particles | 64 × 64 sheet | 8 | N, S, L9 |
| end_fleeing_silhouettes | 32 × 20 | 4 species × 4 frames | N, S |
| end_bird_silhouettes | 12 × 8 | 4 (flap) | E3 |
| end_ash_plain_dawn | 480 × 180 | 1 | E3 |
| end_burnt_stump | 24 × 24 | 1 | E3 |
