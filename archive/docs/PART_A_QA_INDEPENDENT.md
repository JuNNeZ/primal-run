# Independent Part A QA — 10 October 2026

This is a review of the in-progress source package, not art approval or a test
of an exported GDevelop GDJS runtime. Existing historical reports were preserved.

Standalone Chromium passed the existing environment fixture with isolated
outputs under `/tmp/primal-part-a-independent-qa`: all 216 ecology frames and
32 new raptor decomposition props reached the actual renderer, ford geometry
and water-cache invalidation worked, the water rollback worked, and rendering
did not advance a paused run. Desktop/mobile screenshots and `report.json` are
in that directory. These are inventory/behavior checks, not anatomy checks.

## Findings on the reviewed snapshot

1. **Water mask content does not always match the declared bit mask.**
   In `shore_sand_01.png`, pixel NW `(1,1)` is land `(146,147,135)` and
   NE `(30,1)` is water `(60,113,128)`, although mask 1 requires only NW.
   `shore_sand_11.png` has land at SW `(1,30)` despite bit 8. The soil
   mask 11 also has pale non-water NE/SW corners. These observations are
   consistent with the native contact sheets. Renderer corner classification
   passing does not establish that the authored tile content matches it.
   Correct or quarantine those authored tiles and add a visual/corner gate.
   A 4×4 corner-patch test identifies exactly these three bank mismatches:
   soil 11→1, sand 1→2, sand 11→3. The depth source also has missing
   dark corners: 7→6, 11→9, 13→12, 14→12, using 40×40 source-corner
   patches and green <90 as the dark-water classifier. None of the missing
   masks has an intact correctly matching substitute in its atlas. This is
   a bounded request for source corrections, not permission to rotate tiles.
   The restricted export palette collapses much of the source's dark grey
   depth texture into shallow-water blue; inspect the full existing palette.

2. **River foam depends on a stale canvas path in tiled mode.**
   In the reviewed `drawRiver`, `trace(map.river)` was inside `if (!tiled)`;
   the later foam/glint strokes were outside. Explicitly trace the river
   before the animated strokes so ponds or prior drawing cannot supply the
   path. The source owner was informed immediately.

3. **Several ecology rows visibly move the whole animal.**
   T.rex E graze bbox `(23,23,130,81)` versus old idle E
   `(12,48,138,112)`; Para E graze `(15,22,130,79)` versus old idle E
   `(15,55,129,106)`; Baryonyx E graze `(26,64,137,110)` versus old idle E
   `(13,45,136,91)`. These are evidence of a transition that needs visual
   hip/torso review, not a recommendation to recenter by bounding box.
   Explicit anatomical source anchors should align the rows; preserve raw
   sources and use consistent row registration before enabling the poses.
   Old/new native comparisons also show wider Anky/Trice/Para/Galli bodies
   in some S/N ecology rows; translation alone will not repair these changes.
   `/tmp/primal-part-a-independent-qa/ecology-anchor-candidates.json` gives
   approximate manual dorsal-rump/hip registration candidates. They are
   explicitly unapproved first-pass review coordinates, not integration data.

4. **Behavior identity remains a prototype limitation.**
   Several Anky/Bary sleep frames look like upright idle breathing rather
   than a distinct resting posture. North Bary in the inspected ecology
   preview has one continuous tail; that does not certify every other frame.
   Keep prototype labels and avoid describing these studies as approved
   finished animation.

Review artifacts are isolated and may be copied into the repository only when
the source owner chooses a final, current package to document. Findings above
describe the inspected snapshot; subsequent fixes need their own verification.

## Resolution in the subsequent integration

The original 632 behavior studies are now all marked `runtime_enabled:false`.
Replacement native behavior pairs are assessed together; rejected pairs retain
the original runtime fallback. Exact eligible/fallback counts remain pending
the final grooming manifest. This preserves the old sources without presenting
them as approved or active animation.

The seven incorrect water-mask corners identified above received authored
source overrides. The integration adds a gate for all 48 exported masks and
explicitly traces the river before its foam/glint strokes. Earlier independent
QA artifacts are preserved under `previews/part_a/qa_revision1` rather than
rewriting the evidence of the reviewed revision.

The focused browser fixture now also checks the legacy draft review, native
injured-walk review and native behavior review: real rendered canvas pixels,
species/direction controls, selected-pose status and paused canvas stability.
These remain standalone browser checks, separate from GDevelop validation and
visual production approval.

The native injury review initially failed on its first requestAnimationFrame callback: a timestamp older than initialization made phase negative and selected frame -1. Both new review pages now clamp elapsed time to zero; actual canvas pixels, selection changes and paused playback pass the focused Chromium test.

Final package: 276 authored behavior poses +12 quarantined/native fallbacks. The full final suite passes 141 unit tests,22 Chromium browser suites and3 kit checks. Renderer covers288 ecology cases,32 raptor props, water/fords/cache, feature rollback and pause. See validation/PART_A_FINAL_VERIFICATION.json and part-a-final-test.log. GDJS remains unrun; visual production approval remains separate.
