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

## Måling

Se `../docs/validation/SPRITE_ATLAS_OPTIMIZATION_2026-10-12.json` for samme
menu/vulkanbane før og efter. Målingen gælder standalone Chromium. Færre
hentninger er verificeret; FPS og indlæsningstid på fysiske mobiler er ikke målt.
Bevarede fallback-PNGs betyder, at repository/deployment stadig indeholder dem.
