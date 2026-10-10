# Canonical sprite anatomy

The game mixes periods as a fictional prehistoric roguelite. Colours/patterns are
art direction, not fossil claims. Anatomy stays consistent in every state.

| Core ID | Limbs / silhouette | Head / tail landmarks |
|---|---|---|
| velociraptor | Two hind legs, feathered forearms; one tail | Slender small starter, narrow skull and sickle claw; no horns |
| compy | Two hind legs, two small arms; smallest biped | Narrow head, long thin tail; no horns |
| utahraptor | Two hind legs, two arms; sickle claws | Teal player identity, feather shapes; no horns |
| carnotaurus | Two hind legs, two very small arms | Exactly two brow horns above eyes; no nasal horn |
| parasaurolophus | Hind legs + short forelimbs, consistent gait | One long backward crest, no horns; never invent a second leg pair |
| ankylosaurus | Four short legs, broad armoured body | Tail club, paired armour rows; no brow/nasal horns |
| triceratops | Four weight-bearing legs, broad body | Two long brow horns, one shorter nasal horn; frill behind head |
| deinosuchus | Four sprawling legs, low long body | Long crocodilian jaw/tail; no dinosaur horns |
| tyrannosaurus | Two hind legs, two tiny two-finger arms | Massive head; no horns; same body volume north and sides |
| pachycephalosaurus | Two hind legs, two small arms | Thick rounded skull dome; no Carnotaurus horns |
| gallimimus | Two hind legs, two arms, slim neck | Beak, slender body; no teeth/horns |
| baryonyx | Two hind legs, two arms with large thumb claw | Long narrow fish-catching jaw; no horns |

Corpse north rear views can hide the nasal horn behind the frill: show only two
brow horn tips, not a third central frill spike.

North=up, East=right, South=down, West=left. Skull lies ahead of frill for a
north-facing Triceratops; the nose horn must not become a huge central frill spike.
Top-down Carnotaurus E/W show both brow attachment points, including open-jaw
frames; side occlusion must be anatomically motivated rather than a unicorn.

Use fixed hip anchors per source cell; keep skull width, pelvis, limb lengths and
colour landmarks consistent across idle/walk/run/attack/hurt/death. NPC sex uses
subtle palette changes only; elite/albino identity never changes anatomy.

Player names use core aliases compy/carnotaurus/ankylosaurus; full NPC registry
is authoritative for actual IDs. Read sources.json for exporter dimensions and
anchors. Native canvases differ between overlays, and T. rex runtime has its
existing declared integer scale of two. Do not normalize every animal to one size.

Status: existing and revised generated sheets are prototypes. This table is an
audit checklist, not a claim all legacy frames are anatomically approved.

Baryonyx north: one continuous tapering tail behind pelvis; two short hindlegs
with visible toes must not look like a second tail. Inspect native extraction
for disconnected neighbouring tail fragments as well as drawn anatomy.

2026-10-09 user exception: Baryonyx living North now losslessly rotates South180; lighting rotates too. Compy has extra integer4 body sampling and radius4; Velociraptor integer2 and radius12. Raw sources and rejected Veloci N directions are retained.

Deinonychus: two rear hindlegs at pelvis near tailbase, two very short feather
forearms at chest, one tapering tail with compact fan. Brown/cream mantle, dark
dorsal stripe and cream tail band; no horns. About3m fossil length, contrasted
with Velociraptor~2m and Utahraptor~5–7m. Runtime pixels are a readability budget,
not a scientifically calibrated metre scale. Starter radius14, source stride4,
no runtime zoom. New sprites must distinguish featherarms from extra feet.
