# Sprites der stadig mangler (til en senere art-runde)

Overhaulen bruger kode-tegnede effekter, hvor der mangler tegnede frames. Disse ville løfte
grafikken mest, i prioriteret rækkefølge:

1. **Angreb pr. art** (S/N/E/W, 6 frames): Triceratops hornstød, Ankylosaurus halesving,
   Pachycephalosaurus hovedstød, Gallimimus næbhak. Der er nu 96 integrerede prototypeframes for disse fire arter, med native review og fallback. Endelig konsistens mellem gang og angreb mangler stadig; Parasaurolophus har endnu ikke et godkendeligt spark.
2. **Idle-variationer**: græsse, drikke, kradse sig, sove – for planteædere og de store rovdyr.
   I dag vises adfærden som et lille ikon (❀, ≈, z).
3. **Halten**: walk-cyklus ved lavt liv for alle arter.
4. **Vand-overgange**: kant-tiles mellem sand/lavt vand/dybt vand og vadesteder, så floden
   ikke kun tegnes med streger og mønstre.
5. **Velociraptor og Utahraptor som fjender** kræver ådsel- og skeletsprites (decayed/skeleton
   i S/N/E/W, 2 posevarianter), hvis de skal kunne mødes i naturen.
6. **Ideer fra idébanken**: æg, udklækning og baby-/ungestadier pr. art.

Følg `SPRITE_RULES*.md`: native pixels, fast palet, en validerings- og manifestfil pr. levering.

## Deinosuchus

Spillerintegrationen genbruger de eksisterende 120 levende frames og 16 ådsel-/skeletposes. Ingen nye tegninger er nødvendige for denne integration. Kilderne forbliver prototype_static; kryds-state anatomi er ikke produktionsgodkendt.
