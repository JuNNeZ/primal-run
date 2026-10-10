# Feathered reuse — October handoff art, revision 3

This revision replaces earlier procedural effect/terrain drawings with existing
PRIMAL RUN pixel work. There are 17 delivered PNGs:

- Two basalt crossings copied byte for byte from `codex/preserved-feathered-starter`,
  native 256×256, origin 128,128.
- Four ash frames reuse the branch's dust at 1×, with a recorded gray palette
  swap, placed at 48,16 on 192×128 canvases. Source shading and geometry remain.
- Four 32×32 dry-bank overlays reuse river textures, with foliage dried through
  palette swaps, a transparent north edge and Codex-drawn crack details.
- Four 16×16 bubble timing studies reuse original bubble samples with explicit
  integer sampling, placement and fixed-palette conversion.
- One 12×12 teal ally feather reuses the existing insulating-feathers UI icon.
- Sun/moon remain Codex-drawn 16×16 symbols in the kit palette.

15 assets derive from existing artwork; only the two time icons are new drawings.
Source PNGs, GitHub provenance, original ground manifest and family rule are
under `Source_Reused/`. Reused manifest entries record SHA-256 and operations.
Earlier v1/v2 archives preserve the previous attempts. No image generator was
used for this revision. All delivered assets retain `prototype_static`.

## Rebuild

```sh
python PRIMAL_RUN_Art_Handoff/Source_Generated/reuse_art.py
python PRIMAL_RUN_Art_Handoff/validate_art.py
```

`reuse_art.py` is authoritative. `draw_art.py` retains earlier authoring studies
and provides icon/preview functions; running it alone restores obsolete effects.
See `REVIEW.md` and `previews/feathered_comparison.png` for findings.

## Integration limits

This is an art package; gameplay and historical asset packs were not changed.
Use manifest origins and keep the handoff's procedural fallbacks. Basalt stays
256×256 under its source contract, despite the handoff's approximate 160×120
request; do not stretch or shrink it to impose that approximation.

Ash occupies its original 96×96 region on the larger canvas. It is not a finished
full-width 192-pixel cloud. Review native coverage against the actual ash zone.
Bubbles need reflection/registration continuity review. Mud includes only a
north bank, not complete pond edges/corners. Proposed effects run once at 10fps.
GIFs are repeating review previews, not game runtime evidence.

The local checkout remains the earlier prototype at 17618bf. Terminal Git fetch
still fails at the proxy. The connected GitHub app successfully fetched preserved
branch art and rules, superseding the earlier blanket access blocker. No game
integration, atlas/request-count or GDevelop runtime checks were performed.
Nothing was pushed or published.

The uploaded handoff is preserved under `reference/`. The user's direct request
to create/reuse art takes precedence over its ChatGPT/Codex division of work.
Atlas, lava transitions, night swaps, submerged silhouettes and A1–A5 review
remain outside this style-correction delivery.
