# Fjerjæger, jord og den sidste himmel

Nye saves starter som **Deinonychus**. I et eksisterende save vælges den gratis
under Vælg dinosaur; tidligere valg, Velociraptor, DNA/upgrades og scores bevares.
Deinonychus har100HP,9angreb,165fart,radius14 og26stamina-finte. Shift+bevægelse
undviger kort; inden for2sek. giver næste vellykkede bid +50% fra siden/bagfra.
Et bid forfra bruger fintens mulighed uden bonus. Misses bruger ikke bonussen.
Finten laver ikke kontaktskade. Utahraptor beholder sit beskyttede kløspring.

Deinonychus har brun/creme-fjermantel, mørk rygstribe og en lille halefane. Utah
forbliver større/teal/stribet, Velociraptor mindre/olivenfarvet. Fjer hos Deinonychus
og Utahraptor er en rimelig rekonstruktion ud fra slægtskabet; farverne er art direction.
120 nye frames: idle4/walk6/run6/attack6/hurt2/death6 iS/N/E/W.11spillere har1320
runtimeframes. Den nye art bruger direkte source-stride4 på144canvas,pivot72,72,
ingen runtimeopskalering. Alle kilder, master og forkastede forsøg er bevaret.

To bagben og to korte brystarme er korrekt hos bipeder; de fire lemmer må ikke
læses som fire gangben. Triceratops, Ankylosaurus og Deinosuchus har korrekt fire
ben. Nye fjerarme er kortere/lysere end de mørke bagfødder. Der er fortsat mindre
pose-/volumen-/markeringvariation; især ældre bipeders arm-læsbarhed og nogle
Para-gaits skal finpudses frame for frame. Vi har ikke blanket-godkendt alle gamle
sprites eller genskrevet de tidligere målrettede ådsel/horn-rettelser.

## Mutationer

75 mutationer:16fælles og59artsbundne. Hver af11arter har egne IDs i
common/uncommon/rare/epic/legendary; almindelige rangcaps3, legendariske1.
Nye artsbundne effekter dækker arts-evnens stamina/cooldown, spisning og flankebid,
med faktiske begrænsede tal i core. Fælles tradeoffs og mutationer bevares.
Mutationvalget pauser hele simulationen; cards viser eksisterende→næste rang.
Artsregler og automatiske tests kræver fuld rarity-dækning ved fremtidige arter.

## Biomer

16 nye opaque32×32jordtiles (4varianter×4biomer), to vulkaner og to basaltformationer
med256canvas. Kilder og crop/stride/hashes: Source_Generated/ground og
[ground_manifest.json](ground_manifest.json).3×3repeats og lyse/mørke propgrids
ligger i previews/ground. Renderer dæmper kontrast, varierer jordpletter efter seed,
bruger ujævn mudderkontur og har fjernet flod/lavaens vej-lignende midterstriber.

Søer og flod følger samme core-geometri som fiskeri og vandets langsommere
bevægelse. Fisk forbliver i vand; planter/NPC-spawn rydder shore/crater-zoner.
Vulkaner ligger langt fra det sikre startområde, med korte røgpartikler.
Lava har et1sek. varmevarsel, derefter8skade via normal damage-immunity-timing;
forlad strømmen for at køle ned. To naturlige basaltkrydsninger er sikre.
Artens krydsning er klippet til den samme sikre zone som core. NPC'er går ikke
frivilligt ind i aktiv lava. De har endnu ikke generel pathfinding til en fjern
krydsning; jagt på tværs af lava skal derfor testes yderligere.

## Finale

Efter sidste normale boss: bekræft med klik/freshEnter. Et9sek. pixel-cinematic
viser din egen art løbe, meteorens ankomst, nedslag/chokbølge, død og aske.
Originalt tema **Den sidste himmel** plus ét nedslags-SFX. Reduced motion viser
et roligt statisk slutbillede. Jagten er vundet; score/DNA bevares. Stats får ikke
kunstige skadetal fra cinematic. Secret1993 og classic-ruten beholder deres normale
sejr. Space kan hverken springe næste-bane-skærmen eller resultatet over.

## Data og status

[Balanceforsøg](balance_runs/EVOLUTION_RESULTS.md):1.672aktuelt-core-forsøg med
alle11arter, repræsentative builds/DNA-grants, seeds og to bot-politikker.
Det er ikke alle teoretiske kombinationer eller et menneskeligt winrate-estimat.
Baryonyx farmer hurtigst; Gallimimus og Utahraptor kræver mere artsbevidst bot-
og mennesketest; skade/CD-tradeoff-kombinationen er stærk i korte boss-dueller.

Se evolution_validation_report.json,evolution_runtime_report.json,
evolution_player_runtime_report.json,evolution_corpses_runtime_report.json.
Standalone og genereret GDevelop-projekt kontrolleres særskilt. En frisk virkelig
GDJS-eksport er **ikke kørt**; enginebinærer er ikke tilgængelige i dette miljø.

**Prototype-status bevares.** Tekniske checks erstatter ikke anatomisk, temporal,
seamless eller videnskabelig skala-godkendelse. Rå kilder og85tidligere genererede
ark er bevaret byte-for-byte. Næste grafikarbejde: gamle arm/ben-silhuetter,
projekteret kropsvolumen og individuelle loop-overgange efter playtesterfeedback.
