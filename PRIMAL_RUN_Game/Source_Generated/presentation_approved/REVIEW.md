# Revision 3: reuse feathered pixel work

The user correctly identified that the first two deliveries did not match the
existing art. Shared palette was insufficient: the procedural cloud had flat
regions, simple contours and the wrong pixel-cluster scale.

This revision uses exports from `codex/preserved-feathered-starter`.
`Source_Reused/provenance.json` records Git blob SHAs and URLs; PNG bytes are
checked against those SHAs. Every reused source/export also has a SHA-256 check.
The two basalt exports must match source bytes exactly.

## Visual findings

- Ash preserves dust silhouette and individual pixel clusters. The gray swap
  keeps upper-left lighting but merges adjacent warm shades. It is smaller than
  the old full-width procedural cloud; no resizing hides that coverage difference.
- Mud retains riverbank stone/grain distribution. Foliage is dried with a palette
  swap; cracks and the north-edge mask are new. Seam columns allow mixing variants,
  but repeating silhouette/texture patterns remain. Only north is supplied.
- Bubbles preserve original reflections. Integer sampling and palette conversion
  lose some detail. The four samples have not passed animation continuity review.
- The ally symbol reuses the existing feather, recolored teal. Tiny source sampling
  needs actual HUD readability review.
- Basalt is unmodified 256×256 art, including source lava accents. The handoff's
  approximate smaller size is not silently imposed.
- Sun/moon remain two drawn tiny UI symbols. No exact equivalents were found
  among fetched assets; their actual HUD fit needs separate review.

Inspected light/dark contacts, source-versus-delivery comparisons, native/4×
effect strips and repeated mud. GIFs are review loops only; proposed game effects
play once at 10fps. Technical checks do not approve animation or visual style.

## Validation

17 exports pass palette, RGBA, binary alpha, transparent RGB, dimensions, margins,
fixed effect origins, distinct frames, source/export hashes and seam checks.
Both basalt exports are byte-identical to the retrieved originals. Feathered PNG
Git blob hashes match. Existing kit assets remain unchanged.

Browser regressions were previously blocked by missing Chromium. No browser or
GDevelop test is claimed for this art-only revision. Terminal Git remains blocked
at the proxy; GitHub connector reads succeeded for the preserved branch.

All assets retain `prototype_static`, `production_approved=false`. Review coverage,
perspective, timing and readability in the game before approval. Source files and
earlier exports are preserved.
