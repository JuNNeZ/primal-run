# A2 body-consistent native behavior overlay

Follow project-wide rules, species anatomy and ecology/grooming supplements.
This family uses canonical native idle pixels as the atlas-position/body reference.
The reference grid is mechanically constructed with integer2x nearest-neighbor;
it is a reference preview, not a newly drawn action. Whole transparent144canvases
are placed at48,-16 in384x256source cells, keeping canonical hip192,128.
Nine herbivore/large-predator species receive four two-pose activities per
S/N/E/W: graze/sniff, drink, sleep and scratch. Predators' graze row is ground
sniffing, not plant-eating or a gameplay dietary change.

Each species has two1536x1024RGBA generated atlases. Feed columns0/1graze,
2/3drink; rest columns0/1sleep,2/3scratch. Sample at integer2, offset1; use the
explicit192,128hip landmark and original native144canvas/origin. No bbox
recentering or anatomical drawing in exporters, no interpolation, mirroring,
rotation, smoothing or scaling bad source bodies into apparent consistency.
Raw source atlases/prompts/SHA-256 and canonical reference hashes are preserved
under Source_Generated/behavior_native. Native light/dark comparisons show the
unchanged old idle next to each pair, so relative torso/marking changes remain
visible. Playback is quiet1.5fps, with activity timers frozen during pause.

Rejected poses use an explicitly recorded byte-identical canonical idle fallback
and runtime_enabled=false. That is a fallback, not a drawn graze/drink/sleep/
scratch animation. A source may pass PNG tests yet fail anatomy/scale review.
All generated art remains prototype_static, production_approved=false,
animation_ready=false. Existing player/NPC animation sources and PNGs remain
unchanged. Browser renderer evidence remains separate from GDevelop GDJS.

Source alpha threshold192 is explicit in exports/manifests; opaque pixels map
to fixed32 palette, transparentRGB=0. Revisions may provide named state/direction
source overrides while other rows remain byte-stable. Direction-isolated source
revisions containoneorientation repeatedin16cells; only the correctrowisused,
never relabel theunusedrowsasotherdirections. Rejection applies to bothframes
of anactivity/directionpair toavoid alternating changedbody andnativefallback.
