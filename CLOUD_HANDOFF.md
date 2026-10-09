# Fortsæt PRIMAL RUN i cloud

Repository: https://github.com/JuNNeZ/primal-run — privat.

## Aktuel udviklingsversion

Det nye spil ligger i **PRIMAL_RUN_Game**. Se mappens README.md og
DEVELOPMENT_PLAN.md. `project.json` kan åbnes i GDevelop 5; det bruger
JavaScript-events med en fælles spilkerne og canvas/HTML-menuer.
En rigtig GDevelop 5.6.283 HTML5-eksport er testet i Chromium. Den gamle
Prototype_Kit-demo og nedenstående oprindelige overdragelse er bevaret som
historik; der findes nu et GDevelop-projekt.

Start browserudgaven med `npm run preview` og åbn
`/PRIMAL_RUN_Game/index.html`. Kør `npm run test:game` efter kodeændringer
og `npm run build:game` for at opdatere det genererede GDevelop-event.
`npm run build:web` samt den manuelle Pages-workflow klargør publicering.
Ingen GitHub-push eller deployment er foretaget automatisk.

## Tilslut i Codex

Vælg repositoryet i din cloud-environment-opsætning og giv GitHub-integrationen
adgang til dette private repository, hvis det ikke vises. Lad Codex klargøre og
teste environmentet, gennemgå resultatet og publicér environmentet, før du starter
en opgave. Denne GitHub-upload aktiverer ikke i sig selv et Codex-environment.

Ved manuel setup kan `bash tools/cloud-setup.sh` installere dependencies og køre
vores checks. Det kræver netadgang under installation og rettigheder til at
installere Chromium-systemafhængigheder. Brug allerede installerede afhængigheder
eller få environmentet klargjort via UI, hvis installationen er begrænset.

Officiel dokumentation, kontrolleret 5. oktober 2026:
https://learn.chatgpt.com/docs/cloud

## Prompt du kan indsætte i morgen

> Fortsæt PRIMAL RUN. Læs AGENTS.md, README.md og
> PRIMAL_RUN_Prototype_Kit/HANDOFF.md. Vi bygger en GDevelop-prototype med
> Utahraptor, WASD, bite, fjender, XP, pause ved level-up med 1 af 3 mutationer,
> death og restart. Bevar den fælles pixelstil og alle tidligere assetpakker.
> Browserdemoen er en fungerende reference; der findes endnu ikke et GDevelop
> project.json. Start med at kontrollere assets og køre npm test. Arbejd derefter
> på et konkret GDevelop-projekt til den lille kerne. Hold action-poser som
> placeholders og rapportér GDevelop-test separat fra browser-tests.

## Projektets vigtigste beslutninger

- Semi-realistisk top-down pixel art; native sprites, heltalsplacering, ingen blur.
- Første spillerart er Utahraptor; øvrige arter/bosses er stillbilleder til prototyper.
- V5 gav fire retninger. North er South drejet 180°, inklusive lyset, som midlertidig løsning.
- Noget wobble/markeringvariation består; højere animationshastighed er ikke en løsning.
- Armsilhuetter skal være små brystarme, ikke øre-/fjerfaner ved kraniet.
- Prototype_Kit udvider den gamle 24-farvepalette til et fast fælles sæt på 32 farver.
- Ingen godkendte produktionsanimationer endnu; bevar prototype-status.
- Lokal DNA er kun en browser-lagret tæller; ingen unlock-menu eller konto-sync.

## Næste arbejde

1. Opret et reelt GDevelop-projekt og test movement/idle i alle fire retninger.
2. Tilføj én fjende, bite, XP, pause/valg og death/restart i GDevelop.
3. Kontroller origins, torso-hitbox og blockage/state-skift i den engine.
4. Forbedr walk-kontinuitet og action-registrering efter den fungerende kerne.
5. Bosses, biomes, extinction og længere runs bygges senere.

Cloud-checks kan validere PNG'er og browsermekanik; de erstatter ikke visuel
vurdering eller GDevelop Preview. Brug en `codex/`-branch til næste ændring.

## 2026-10-08: exploration and rarities

Active game now has per-stage world bounds, prepopulated habitats, proximity AI,
offscreen replenishment/boss placement, responsive camera/minimap and distinct
player/hostile/prey labels. Meat has four weighted rarities; mutation cards have
fixed weighted rarities and current → next rank. XP bar includes percentage and
remaining meat value. Jonas unlocks a cosmetic crown/title only. Legacy three
boss species rotate their old South stills in cardinal steps; four newer species
use their direction frames. PNGs and prototype approval status unchanged.

`tests/world-browser.cjs` is included in `npm run test:game`; covers desktop,
portrait, landscape and ultrawide. `PRIMAL_RUN_Game/world_runtime_report.json`
records separate standalone and official GDevelop 5.6.283 checks plus source
hashes. Entire npm test and PNG validators passed in temporary copy, preserving
historical kit outputs. Original 19-case enemy runtime report remains historical
evidence for pre-map timing; use world report for current mechanics.

Pages continues to publish static `dist/` on gh-pages; source development remains
on codex/primal-run-playable. Demo: https://junnez.github.io/primal-run/.

## 2026-10-08: dinosaur crowd collision

NPC fixed-torso collision now separates mixed species after AI movement. Twelve
solver passes handle crowds; pinned animals transfer correction to neighbours.
Mass scales with body radius, boss status and charging, preserving attack aim
and timers. No friendly fire, NPC rewards or new player movement blocking.
24 core cases, all browser regressions and original kit tests PASS. Mixed crowd
in actual frame loop and progression also PASS in official GDevelop 5.6.283.
Current standalone/GDJS evidence and source hashes: world_runtime_report.json.

## 2026-10-08: terrain, combat feedback and first-boss polish

Maps now compose the unchanged kit art with subdued terrain textures, organic
regions/clearings, winding trails, biome-specific props and visual river/lava
features. Minimap includes trails/features; nearby canopies fade. No new PNGs
or terrain damage, and sprite approval status is unchanged.

Bites have 33/50 ms hit-stop, capped blood/dust particles/decals and a sharper
SFX transient; pause freezes FX. First Carnotaurus boss has phase-one charge/bite,
recovery rear/flank +50% bonus, half-health enrage, phase-two double charge with
a new locked telegraph, directional bite and one-hit/pounce-avoidable stomp.
HUD explains phase and openings. Warning geometry matches bite cone / charge
capsule. Boss reward/progression unchanged; other boss AIs retained.

29 core tests plus complete npm test and kit/active/enemy PNG validators PASS.
Official GDevelop 5.6.283 export passes progression, player/enemy frames, world
layouts and polish checks; final warning geometry rechecked in final GDJS export.
A complete isolated boss fight passes through normal input without HP edits.
Reports: PRIMAL_RUN_Game/polish_runtime_report.json and world_runtime_report.json.
Temporary checks: /tmp/primal-polish-final-checks; engine binaries remain /tmp.
Publication continues via source codex/primal-run-playable and static gh-pages.

## 2026-10-08: seeded roguelite, playable species and priorities 2–5

This update supersedes the fixed terrain/trails and Utahraptor-only start above.
New saves start as Compy. PLAYER_SPECIES defines four classes; species selection
and DNA unlocks (Utahraptor 25, Carnotaurus 60, Ankylosaurus 85) persist under the
existing save key, preserving previous DNA/upgrades/settings/scores. Unlocks
and selection are blocked mid-run. Shift uses a class ability; Carnotaurus
charges on a locked heading and has no immunity, Ankylosaurus braces without
moving, and Compy/Utahraptor have short protected dashes/leaps. Shared mutations
and species-restricted mutations form a 20-entry pool; class effects are real.

createMap(stage, seed) uses its own seeded RNG, separate from loot. Each run
gets a seed visible in pause; map bounds and safe start remain fixed. Random
habitats, rocks, foliage, river and six sites vary per seed. There are no roads
or artificial clearings. Dense plants fade near the player; cyan pointer/ring
and red species names identify actors. Original PNGs and origins are unchanged.
New playable classes reuse existing native directional pose studies (idle,
stride, action); Utahraptor retains its 24-frame combat overlay. None is newly
production-approved.

E/touch Undersøg claims fossils or opens a fully paused nest choice. Rewards
are once per site, guardians are preplaced and dormant until theft/attack,
rare prey/elite meat is at least rare, elites guarantee extra DNA. Discovered
sites appear on the minimap. All bosses now have half-health phase transitions,
locked warning shapes and rear/flank recovery vulnerability. Later bosses use
laterBossAI: Deinosuchus lunge/bite/wave, Triceratops hornstorm/rock recovery,
T. rex stamina-draining roar/stomp/double bite. Historical palette and art
validation reports stay intact. The game is explicitly a fantasy mix of time
periods; Deinosuchus is a crocodyliform.

37 core tests, all six browser suites, complete npm test (including preserved
kit checks) and all three PNG validators PASS. Standalone and real GDevelop
5.6.283 export results are separate in roguelite_runtime_report.json; world
and polish reports refreshed. Legacy attack suites explicitly select unlocked
Utahraptor. Facing/boss timing fixtures isolate random obstacles; seeded-map
tests cover 80 stage/seed combinations. Temporary full checks at
/tmp/primal-roguelite-final-checks and actual exported GDJS at
/tmp/primal-roguelite-final-gd. Source branch and gh-pages deployment unchanged.

## 2026-10-08: chase disengagement and complete playable animation studies

All four playable classes now use 480 new native 144×144 frames across six
states and four directions. Historical PNGs remain untouched. Sources, exact
prompts and anatomical anchors are in Source_Generated/player_full. Export with
`python tools/export_player_full.py`; validate with
`python tools/validate_player_full.py`, then rebuild the GDevelop project.
Reviewed source crops expand 32 pixels around cells and isolate the connected
subject before lossless extraction/palette mapping. Never mirror North/West.
All art remains prototype_static, production_approved=false, animation_ready=false.
Minor marking/anatomy/registration variation remains for future visual polish.

Pursuit has an eight-second no-disengagement window after player damage,
distance/time weighted random disengagement, four-second reaggro delay and
return-home behavior. Bosses never disengage. Stationary observers let prey
settle at 110px; movement/recent damage uses 260px. RNG is isolated from loot.
42 core tests include five pursuit tests; seven browser suites include all
480 actual player draws, hurt/death, stable collision/origins and mutation freeze.
See player_full_runtime_report.json for separate standalone/official GDevelop
results. Run kit tests/legacy validators in a temporary checkout to preserve
historical reports. Browser path here: /usr/bin/chromium.

## 2026-10-08: cinematic menu, ecology and species readability

Menu-only clock/parallax/actors live in app.js; reduced motion freezes the
cinematic and no simulation state is touched. 24 new ecology PNGs are additive;
read SPRITE_RULES_ECOLOGY.md before art work. Source sheet has manually reviewed
nonuniform rows0/320/575/790/1024. Export/validate via tools/export_ecology.py
and tools/validate_ecology.py; size audit via tools/audit_sprite_sizes.cjs.
SPECIES_COLORS performs cached display-only exact fixed32 palette remapping
without modifying source PNGs. New frames use the same per-species mappings.
All original frames and sources remain unchanged and art remains prototype.

BIOMES/suitableHabitat enforce real population/reinforcement/boss spawn habitat:
riverbank Deinosuchus, land animals out of the water core, no lava spawns.
Natural wandering/chase is not restricted to the birth habitat. Explicit
spawn(kind,position) remains available for controlled fixtures. First boss is
integer2× with42px body; Deinosuchus/T.rex NPC32 and Triceratops28 better match
native art. Attack warning tests use actual entity contact radii.
46 core tests include128 stage/seed population cases,48 map habitat variants
and actual biome vegetation checks. Eight browser suites include responsive
cinematic controls, reduced motion, actual four-class recoloured pixels and
pause isolation. See jungle_runtime_report.json for separate final standalone/
official GDevelop evidence. NEXT_IMPROVEMENTS.md records the requested proposals.

## 2026-10-08: adaptive music, varied opening layouts and Space guard

Audio.SCORES has11 original scene compositions: menu, four biomes, four bosses,
victory and defeat. setScene chooses theme and health layers50/25/10 with release
hysteresis55/30/15; a0.65s bus crossfade retires old channels without timer leaks.
Pause/mutations/nest/stage-cleared duck music and suppress danger pulses. Existing
music/master/sfx controls and browser gesture unlock remain intact.

Map seeds were already random, but fixed opening rocks and large empty starter
area looked repeated. Fixed ROCKS are now legacy exported data, not population.
createMap adds varying opening rocks, three grove-distribution profiles and
horizontal/vertical river/lava channels. Starter prey positions are seeded and
avoid obstacles; biome spawn and safe-start constraints remain. New shore habitat
samples ensure river bosses have suitable offscreen positions for both orientations.
No new art exports or palette changes. Opening snapshots are in previews/layout.

Space is preventDefault on both keydown and keyup outside text inputs; only
playing adds it to attack keys. Focused mutation/next buttons therefore cannot
receive native Space click. Intentional Enter, click and mutation digits remain.

51 core tests and nine browser suites PASS standalone and official GDJS export.
Full npm test/kit PNG validation run in /tmp/primal-adaptive-validation. Tests
include128 opening layout seeds,64 connectivity maps, real held/repeated Space
across phase transitions and OfflineAudioContext waveforms for all nine base
menu/biome/boss themes plus three health layers. See adaptive_runtime_report.json
and music_manifest.json; old feature reports remain historical evidence.

## Prioritet1–4 · 8. oktober2026

Komplette NPC-serier:480 nye enemy_full frames til Para/Deino/Trice/T.rex;
Compy/Carno/Anky deler player_full. Runtime viser840 NPC frames i seks states
og fire retninger. Gait bevares ved vending; korrekt gang/løb-loopperiode;
kontaktposer følger bid/slam-timing. Corpse6frames afsluttes og fades efter8s.
Vand/mudder/buske giver terrain-fart; C og ro i buske skjuler efter0,6s.
Flokalarmer, græsning/hvile, lokale hjem/territorier og8s-træffergrace.
Klassepriser0/25/55/75DNA, Compy Hunter25%, Anky cooldown0,74s, Momentum
max24stamina/cast, DNA-priskurve1,4. Se PRIORITIES_1_4.md og balance_audit.json.

60 kernetests+10browserforløb PASS, fuld npmtest inkl. tre historiske kitchecks
kørt i /tmp/primal-priorities-check. Alle seks PNG-validatorer PASS.
Officiel GDevelop5.6.283 eksport /tmp/primal-priorities-gdexport-v2 og alle
10browserforløb PASS,1184ressourcer. Nye rapporter enemy_full_runtime_report,
terrain_runtime_report og priorities_1_4_runtime_report; ældre rapporter bevaret.
Art beholder prototype_static/production_approvedfalse/animation_readyfalse.
Spiltest skal afgøre næste balance- og artfinpudsning;5–8 afventer brugeren.

### Spisning og prioriteter 5–8 (2026-10-08)

- Lig: 25–30 simulationsekunder, mørkner efter 10 sek., fader de sidste 5 sek.
  Stationær F-spisning giver 1 kødværdi hver 0,6 sek.; afbrydes af input/skade og
  bruger ingen stamina. DNA og løse redebelønninger beholder opsamling.
- Naturlyd har separat ambient-slider; biomer skifter vind/vand/kald/insekter.
  Musikmotiver varierer efter 64 beats; eksisterende boss-crossfade/livslag bevares.
- Joystick, gamepad, autoangreb, gemte tasteskift, tekst/HUD-skala og reduceret
  bevægelse. Space vælger fortsat aldrig mutationer eller skifter bane.
- Fog følger synsfeltet; to seedede opdagelser og biomeegnede alternative
  bossrydninger. Pausemenu har kopierbart seed-link; startmenu tager seed-input.
- Lazy frames og farvelag; assetStats estimerer kun appens RGBA-billed/canvaslager,
  ikke GPU/browser-cache. 128-pixel gitter til dyrekollision og viewport-culling.
- Ny regression: tests/eating-discovery.test.cjs og
  tests/eating-accessibility-browser.cjs. Kør npm test i en midlertidig kopi, da
  historiske kit-tests skriver rapporter og screenshots. Art-fixtures preloader
  eksplicit alle frames; det er ikke spillets normale opstartsadfærd.
- Performance rapporteres separat for standalone og officiel GDevelop-eksport i
  cloud Chromium med 390×844 viewport. Fysiske telefoner er ikke målt.
- Ingen PNG-kildepixels ændret. Alle assets forbliver prototyper uden visuel
  produktionsgodkendelse. project.json genereres stadig fra src/ og style.css.

## Mathias playtest fixes · 2026-10-09

- See PRIMAL_RUN_Game/COMBAT_FEEDBACK.md for implemented balancing, diet,
  legendary mutations and the next suggestions. Ability stamina costs28/38/45/45,
  regeneration12/s calm or8/s combat, blocked after casts/damage and during casts.
- New tests/combat-feedback.test.cjs and combat-feedback-browser.cjs cover
  plant-only feeding/rewards, telegraph timing, shields, stamina, HUD and minimap.
  npm test now contains72 core tests and12 game browser suites plus3 kit suites.
- Ankylosaurus uses map.forage and F rather than meat. Internal meat counters
  represent food progress for both diets. Triceratops remains NPC/boss only.
- Boss minimap marker is a diamond; telegraphs render above sprites with timers.
- Eighteen new native PNGs: Para South walk6, T. rex North walk6/run6.
  Source_Generated/enemy_full/sources.json state_overrides records two preserved
  source atlases, integer3px sampling and explicit hip anchors. Existing atlases
  and legacy overlays are preserved. Body consistency across states and Para's
  other directions still need redraws. Art remains prototype_static/unapproved.
- Exporter now reads per-state overrides; native size/pivot remains144/72.
  Source/project/Pages are rebuilt from current src/style and combined manifest.

## Species colour and legacy renderer audit · 2026-10-09

- Portraits prepare species skins even before first canvas draw and lazy-load
  missing classes. Death previews share that path; encoded skins are cached and
  evicted with species. No source PNG changes. See PRIMAL_RUN_Game/CODE_AUDIT.md.
- Player rendering only uses player_full; obsolete hardcoded Utah/legacy NPC
  fallbacks are removed. Intro background follows selected species.
- New tests/species-colour-browser.cjs checks all four portrait palettes against
  exact expected RGB substitutions and unchanged alpha, starting cold as Compy.
  It supports standalone and official GDJS resource filenames. npm test now has
  72 core tests, 13 game browser suites and 3 preserved-kit suites.

## Recovery checkpoint · 2026-10-09

Unfinished expansion and all 85 generated PNG originals are preserved. Read
[UNFINISHED_EXPANSION.md](PRIMAL_RUN_Game/UNFINISHED_EXPANSION.md) before continuing.
New class art export is incomplete; do not publish this checkpoint as a release.
The later decay/regeneration/predator attraction/DNA lab/playable T. rex request
is still pending. SHA-256 inventory is under Source_Generated/recovery_2026_10_09.

## Carrion and T. rex follow-up · 2026-10-09

See PRIMAL_RUN_Game/CARRION_AND_REX.md. New player/fish exports are integrated:
840 player_full +480 enemy_full +4 fish frames,1548 combined resources.
Nine playable classes (Trice/T. rex reuse enemy frames), faster carrion decay,
escape recovery and carnivore scavenging; DNA lab and digestion upgrade.
Preserved recovery report is now historical, all original PNGs retained.
Artwork remains prototype/unapproved; body/death-pose variation remains.
Current validation is standalone Chromium; no fresh official GDJS export
was possible because the engine binaries are absent in this restored machine.

Validation:87 core,14 standalone game browser suites,3 preserved kit suites;
1080 actual player frames and exact nine-class portrait palettes verified.
Current report:PRIMAL_RUN_Game/carrion_rex_runtime_report.json.

## Research/ecology/corpse follow-up · 2026-10-09

Read PRIMAL_RUN_Game/RESEARCH_AND_ECOLOGY.md for current mechanics and experiment
commands; focused project skills are routed in AGENTS.md. Corpse overlay160 PNGs
adds10 species x2 decomposition states x4 directions x2 variants. Selected raw
source hashes/anchors and rejected Triceratops revision are preserved under
Source_Generated/corpses. Only corpse horn art is repaired; living animation
atlases/exports stay byte-identical to the previous release. Original85 recovered
source hashes still pass. All new art remains prototype/unapproved.

New core systems: wounded ordinary AI/trails, persistent fieldGuide, actual run
and stage stats, factual killer/end-scene compositions, queued albino epic rewards,
NPC sex/elite/albino palettes, lightFrame/metabolicRush tradeoffs. No new scent
or NPC-versus-NPC attacks. There are9 playable species, unchanged from last release.

Balance CLI uses shared Game.step. Stored sample matrix:162 normal180s budgets,
540 ordinary T.rex duels,270 stage4 boss duels. Compare coreSHA256 before relying
on old samples; normal runs include timeouts and bots are not human win rates.
The newest current validation is standalone Chromium; no fresh official GDJS
export was run because the engine binaries are absent from this restored machine.
Historical GDevelop evidence is not current validation.
