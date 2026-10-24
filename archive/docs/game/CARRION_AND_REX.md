# Carrion, escape recovery and playable T. rex · 2026-10-09

Nine playable species. T. rex costs120 DNA:190HP,38 base damage,95speed,
32px torso radius. Bite cooldown1.6s, animation1.1s, contact0.55s; heading
locks when attacking. Shift costs50 stamina/CD6s and scares ordinary nearby
animals within250px for2s (+0.5s/rank Voice); bosses and nest guards are immune.
No player invulnerability. Roaring slows movement to30%. Jaw gives15% damage
per rank; Urkongens bid is a rare legendary20% damage addition.
T. rex shares the existing120 enemy_full frames at integer2x, matching NPC size.

Corpses last14–18 simulation seconds depending on body size. Darkening starts
at7s, first lost food portion at9.5s, then one every2.5s; final5s fade. Pause
freezes decay. Food remaining is labelled FRISK/FORDÆRVER. Rarity does not extend
shelf life. Consumed/expired portions give no player rewards.

Non-boss animals regenerate2.5% maxHP/s only after10s without a player hit,
not alerted, farther than350px, not bleeding and alive. Returning/wandering
animals can recover. New hits reset the delay; never overheal or revive.

Idle carnivores notice food clusters within650px. More nearby food and fresher
corpses are more attractive; approach at40% normal speed, using terrain/collision.
Eating takes2s/portion and heals3HP; no DNA/XP/food rewards for the player.
Combat awareness takes precedence. Herbivores, bosses and nest guards do not
seek carrion. Empty corpses do not attract predators.

DNA laboratory shows selected-class mechanics and exact upgraded start stats,
links to the nine-species archive, shows owned→next rank and DNA shortfall.
New permanent digestion upgrade:5% faster feeding/fishing per rank, five ranks.
Old saves keep DNA/unlocks/settings/upgrades, new rank defaults0. The existing
DNA price curve is unchanged. Permanent damage upgrade renamed for all diets.

The previously blocked player export now contains840 frames; new classes each
have120. Triceratops/T. rex share240 enemy frames. Fish:four native64x64 poses.
Para E/N/W anatomy candidates are exported; T. rex N hip registration adjusted.
All art remains prototype_static, production_approved=false, animation_ready=false.
Generated source body/marking and death-pose variation remains; this is not final
production animation. Preservation inventory remains immutable.

Tests: carrion-rex.test.cjs covers spoilage, pause, regeneration exclusions,
predator attraction/consumption, slow locked attack, roar and save/upgrades.
carrion-rex-browser.cjs checks laboratory purchases, nine-class selector,
T. rex live canvas attack and mobile layout without missing asset requests.

Validation completed:87 core tests,14 standalone browser suites,3 historical
kit suites. The actual canvas draws1080 frames across9 classes; all9 portraits
match exact runtime palette/alpha. Player/enemy/fish and kit technical checks
pass. See carrion_rex_runtime_report.json. Official GDevelop runtime NOT RUN:
engine binaries missing after recovery; project generation/source check passed.
