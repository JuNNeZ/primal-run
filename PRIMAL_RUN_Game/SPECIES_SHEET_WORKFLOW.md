# Artsark og fremtidige sprites

Runtime bruger artsopdelte PNG-atlasser. Alle states, retninger, HUD-hoveder,
adfærd og lig fra samme art pakkes sammen. Fælles HUD, pickups og effekter
ligger i `world_shared`; terræn, kanter, props og miljø ligger i `world_terrain`.
Grupperne styres i `tools/atlas_config.json`. Ark er højst 2048×2048; store
artsgrupper får flere sider. Kun relevante arter indlæses til menu/bane.

Byg med `npm run build:game`, kontrollér med `npm run validate:atlases`.
Builderen laver PNGs, crop-indekser og `sprite_atlas_manifest.json` automatisk.
Der skal ikke vedligeholdes manuelle atlas-koordinater eller filnumre.
En ny manifest-entry med `species` bliver automatisk samlet med arten, også
i en ny assetfamilie. Valgfri `atlas_group` giver en eksplicit pakkegruppe.
Catalogets `species` styrer preload/eviction uafhængigt af mappenavnet.

Alle pixels, native størrelser og origins bevares. Pixel-identiske frames med
samme dimensioner deler én crop inden for gruppen; deres logiske filnavne og
individuelle origins bevares. Én transparent pixel omgiver hver unik crop.
Ingen rotation, skalering eller palettekonvertering sker ved pakning.
Kilder og individuelle lossless PNG-eksporter bevares til review og fallback.
Loaderen deler én billedhentning per ark og bruger original-PNG ved arkfejl.
`PrimalCore.FEATURES.spriteAtlas=false` før mount giver det gamle loadflow.

## Plan til en ny art

Fra repositoryets rod:

```bash
python tools/species_sheet_plan.py --species new_species --output PRIMAL_RUN_Game/Source_Generated/player_full/new_species/plan.json
```

Resultatet er en **authoring-plan**, uden tegning eller runtime-registrering.
Default er fire native 864×720 masters, ét for hver separat tegnet S/E/N/W.
Hver master har 6×5 celler à144×144 med origin72,72:

| Række | Kolonner0–5 |
|---|---|
| 0 | idle0–3, hurt0–1 |
| 1 | walk0–5 |
| 2 | run0–5 |
| 3 | attack0–5 |
| 4 | death0–5 |

Planen beskriver alle120 frames, faste crops, filnavne, states, loop/fps og
attackkontakt på frame3. Angrebstiming følger artens gameplay-varighed.
`--size W H` og `--origin X Y` ændrer den erklærede native plan; `--anchors`
tager en JSON-fil med retning→[x,y] til arter med forskellige retningsankre.
Kopiér aldrig andre arters origins uden at kontrollere den kanoniske hofte.

Brug den eksisterende art, `SPECIES_ANATOMY.md`, sprite-regler og fixed32
paletten som reference ved generering. Et AI-masterark kan have andre faktiske
dimensioner/celler end prompten: registrér kildens faktiske crops, heltalssampling
og landmarks i familiens exporter. Planen er ikke en universel extractor.
Bevar raw masters med hashes/prompts; brug `tools/export_player_full.py` eller
den relevante familie-exporter til reviewed lossless native frames og manifest.
Byg derefter runtime-atlas automatisk. Gameplay/stats/unlocks for en ny art er
en separat integration; atlas-pakning gør ikke arten spilbar.

Review native light/dark grids, anatomi, retninger, animationer og faktisk
runtime som beskrevet i `SPRITE_RULES_PLAYER_FULL.md` og projektreglen
`../PRIMAL_RUN_Sprites/SPRITE_RULES.md`. Plan/tekniske tests giver ingen visuel
eller produktionsgodkendelse. Genererede artsark forbliver prototyper.

## Bedre første generation · erfaring og kilder fra 12. oktober 2026

Et flot AI-billede er ikke i sig selv en stabil animation. Vores polering krævede
både kildeændringer og eksplicit registrering: hele kroppen flyttede mellem rækker,
skadeposes drejede, og særskilte angrebsark ændrede markeringer og anatomi.
En mere kontrolleret arbejdsgang til næste art er:

1. Fastlæg artens egen silhuet, størrelse, palette, hoved, fjer/panser og hale i
   `SPECIES_ANATOMY.md`. Sammenlign i native størrelse med beslægtede arter;
   Utahraptor må ikke blot læses som en opskaleret Velociraptor.
2. Lav og gennemgå én kanonisk pose per retning, med dokumenteret anatomisk
   landmærke og offset til spillets logiske origin. Gem rå kilde og prompt.
3. Pilotér én kort gangcyklus og ét angreb i én retning før alle 120 poses.
   Brug den faktiske kanoniske sprite som identitetsreference og tegnede poses
   eller en rig som bevægelsesreference. Definér forberedelse, kontakt og recovery;
   anatomisk venstre/højre er ikke skærmens venstre/højre.
4. Generér en lille sammenhængende animationsstribe fra referencen. Hold kamera,
   kropsskala, palette og retning fælles. Genbrug en eksisterende god animation,
   når angrebet allerede passer; 96 af vores artsangrebsposes kunne genbruges.
5. Se den faktiske cyklus og idle→walk→attack→walk ved 1× på lys/mørk baggrund.
   Kontrollér fødder, hale, markeringer og sidste→første pose. Tekniske tests kan
   ikke alene afgøre, om et ben er byttet eller kroppen læses som en anden art.
6. Ved en lokal fejl: udtag målposen med nabo-/identitetsreference, ret kun den
   nødvendige celle, og bevar øvrige godkendte kildeceller. Det lykkedes bedre for
   Parasaurolophus end gentagne genredigeringer af et helt ark. Gem forkastelser.
7. Udtag med erklærede crops/sampling; registrér kun med kontrollerede anatomiske
   punkter og tabsfri heltalsforskydning. Afvis clipping, uventet alpha og ændret
   skala. Brug ikke centroid/bbox-centering som erstatning for kropsregistrering.
8. Udvid først efter pilotreview. Byg runtime-atlasser til sidst og test faktiske
   renderer-frames, timing, pause og stats i standalone og den rigtige GDJS-eksport.

Det er vores anbefaling ud fra denne revision, ikke en garanti for fejlfri
førstegenerering. Imagegen kan stadig ændre anatomi, selv med præcise prompts.
For mange nye arter bør vi afprøve én repræsentativ biped og én quadruped med
pose-/skeletstyring eller et enkelt rigget 3D-referenceforløb, før værktøj vælges.
PixelLabs dokumenterede skeletværktøj kræver andre canvasstørrelser end vores 144;
en eventuel pilot skal derfor dokumentere native eksport uden vilkårlig resize.

Offentlige kilder, læst 12. oktober 2026:

- [OpenAI sprite-pipeline](https://github.com/openai/plugins/blob/main/plugins/game-studio/skills/sprite-pipeline/SKILL.md)
  anbefaler en godkendt spil-sprite, én samlet animationsstribe og review i engine.
  Deres generelle normalisering er ikke automatisk tilladt af vores strengere
  native-regler; brug projektets egne eksportører og anatomiske registrering.
- [En brugers GPT-image/Codex-forsøg](https://community.openai.com/t/developing-sprite-sheets-with-gpt-image-2/1379831)
  beskriver gentagne poses og forvekslede ben, bruger pose-/mannequinreferencer
  og Codex til mekanisk opdeling. Det er et personligt forsøg, ikke en valideret
  produktionsmetode; rådet om individuel frame-generation konflikter med OpenAIs
  anbefaling om en samlet stribe. Vi starter med striben og reparerer lokalt.
- [PixelLab: Animate with skeleton](https://www.pixellab.ai/docs/tools/animate-with-skeleton)
  dokumenterer genbrugelige poses, fast reference, frosne frames og lokale
  inpainting-rettelser. Skeletestimering kræver også manuel kontrol.
- [Scenario: Create Spritesheets](https://help.scenario.com/articles/9088582240-create-spritesheets-with-scenario)
  demonstrerer referencebillede→video→udvalgte keyposes→spritesheet, inklusive
  attack→recovery. Det er en mulig bevægelsespilot; video garanterer ikke fast
  pixelpalette eller anatomi og skal gennem samme review som imagegen.

## Måling

Se `../docs/validation/SPRITE_ATLAS_OPTIMIZATION_2026-10-12.json` for samme
menu/vulkanbane før og efter. Målingen gælder standalone Chromium. Færre
hentninger er verificeret; FPS og indlæsningstid på fysiske mobiler er ikke målt.
Bevarede fallback-PNGs betyder, at repository/deployment stadig indeholder dem.
