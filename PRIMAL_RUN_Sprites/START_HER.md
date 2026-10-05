# PRIMAL RUN - individuelle sprites til GDevelop

Pakken indeholder 176 PNG-filer udtrukket fra dit vedhaeftede konceptark.
01-08 mapperne indeholder game-assets. Previews indeholder kun oversigtsbilleder.
Manifestet beskriver hver enkelt PNG. SPRITE_RULES.md er projektets faelles regel.

## Foerste milepael

1. Pak ZIP-filen ud i samme projektmappe som dit GDevelop-projekt.
2. Opret et Sprite-objekt med navnet Player.
3. Tilfoej en animation kaldet Idle med EN fil:
   `01_Player_Utahraptor/idle/utahraptor_idle_pose_01.png`.
4. Saet Origin til 64,64. Billedets laerred er 128 x 128 pixels.
5. Behold pixel-art-indstillingen. Brug 1x eller en heltallig forstoerrelse.
6. Til baggrunden kan du afproeve et Tiled Sprite med
   `03_Environment/Source_Crops/grass.png`.
   Det er et prototypetexturudsnit; gentagelsen kan vise soemme.

Opret en separat animation med et enkelt billede, hvis du vil bruge en anden pose.
Laeg IKKE alle billederne fra walk-mappen ind som frames i samme animation:
de viser forskellige retninger og uens positurer.

## Hvad pakken kan bruges til

- Import og den foerste prototype med en dinosaur og en baggrund.
- Statiske enemies, props, pickups, UI og effekter.
- Stilreference for en senere, kontrolleret animationsproduktion.

## Kendte graenser

Konceptarket har ikke ensartet dinosauranatomi, perspektiv eller relative skalaer
og indeholder ikke komplette animationer. Transparens er udtrukket fra en moerk
baggrund, saa moerke udvendige detaljer kan vaere gaaet tabt i originaludtraekket.
Enkelte props bestaer af flere elementer, som allerede haenger sammen i arket.
Tiles er originale rektangulaere udklip og ikke et seamless 32 x 32 tileset.
Den fjerde cliff-crop er et smalt udsnit af det nederste kildebillede.
UI-barenes farvefyld er indbygget i billedet. Effekterne er statiske.
Ens canvas er kontrolleret; kropsankre gennem animationer er ikke godkendt.
Pakken er ikke afproevet i en koerende GDevelop-scene.

Officiel importguide:
https://wiki.gdevelop.io/gdevelop5/objects/sprite/
