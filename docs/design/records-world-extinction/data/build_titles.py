#!/usr/bin/env python3
"""Source of truth for run titles and the run-summary variables they may read.

Writes run_titles.json, run_summary_variables.json and ../RUN_TITLES.md, and fails if a
title reads a variable that is not declared, if IDs/names repeat, or if fewer than 75
titles exist. Run: python docs/design/records-world-extinction/data/build_titles.py
"""
import json, re, pathlib, sys

HERE = pathlib.Path(__file__).parent

# ---------------------------------------------------------------- run-summary variables
# status: "existing" = already in core.js (r.stats / run fields), "new" = must be tracked
# by the records phase, "partB:<id>" = only exists once that Part B package ships.
V = {}
def var(name, status, source, desc):
    V[name] = {"status": status, "source": source, "description": desc}

var("species", "existing", "r.species", "Player species id")
var("diet", "existing", "PLAYER_SPECIES[species].diet", "carnivore / herbivore / omnivore / piscivore")
var("victory", "existing", "r.result.victory", "Final boss defeated (normal ending)")
var("seconds", "existing", "r.seconds", "Run time in seconds (simulation time, pauses excluded)")
var("levelReached", "existing", "r.levelIndex + 1", "Highest level number reached (1-8)")
var("kills", "existing", "r.stats.kills", "Animals killed by the player")
var("killsBySpecies", "existing", "r.stats.killsBySpecies", "Map species -> kills")
var("bosses", "existing", "r.bosses", "Level bosses defeated")
var("albinos", "existing", "r.stats.albinos", "Albino animals killed")
var("rivals", "existing", "r.stats.rivals", "Rival mini-bosses killed")
var("herbivoreElites", "existing", "r.stats.herbivoreElites", "Elite/rival kills while playing a herbivore")
var("attacks", "existing", "r.stats.attacks", "Attacks started")
var("landedAttacks", "existing", "r.stats.landedAttacks", "Attacks that hit at least one target")
var("crits", "existing", "r.stats.crits", "Critical hits")
var("abilities", "existing", "r.stats.abilities", "Species ability uses")
var("avoidedHits", "existing", "r.stats.avoidedHits", "Hits avoided by i-frames/pounce (shown as UNDVIGET)")
var("damageDealt", "existing", "r.stats.damageDealt", "Damage dealt (HP removed from enemies during player steps) - see stats spec risk R3")
var("damageTaken", "existing", "r.stats.damageTaken", "Damage taken")
var("healing", "existing", "r.stats.healing", "HP healed")
var("distancePx", "existing", "r.stats.distance", "World pixels moved by the player's own movement")
var("plantsEaten", "existing", "r.stats.plantsEaten", "Plant portions eaten")
var("meatEaten", "existing", "r.stats.meatEaten", "Meat portions eaten")
var("fishCaught", "existing", "r.stats.fishCaught", "Fish caught")
var("food", "existing", "r.stats.food", "Food value gained")
var("dna", "existing", "r.stats.dna", "DNA earned this run")
var("mutationsTaken", "existing", "r.stats.mutations", "Mutations chosen")
var("zonesFound", "existing", "r.stats.zones", "Named zones discovered (incl. start zones)")
var("exploration", "existing", "r.exploration", "Explore actions + new non-start zones")
var("finteHits", "existing", "r.stats.finteHits", "Deinonychus feint follow-up bites that landed (4d9115f)")
var("staminaSpent", "existing", "r.stats.staminaSpent", "Stamina spent")
# derived from existing
var("minutes", "derived", "seconds / 60", "Run minutes")
var("distanceM", "derived", "distancePx / PX_PER_METER (see distance spec)", "Calibrated metres")
var("accuracy", "derived", "landedAttacks / max(1, attacks)", "Hit ratio 0-1")
var("damageRatio", "derived", "damageDealt / max(1, damageTaken)", "Damage efficiency")
var("hpLeftPct", "derived", "100 * r.health / r.maxHealth at run end", "HP left at end (0 on death)")
# new tracking required
var("deathCauseType", "new", "r.deathCause.type", "'boss' | 'enemy' | 'lava' | 'environment' | 'abandon' | null")
var("deathCauseKind", "new", "r.deathCause.kind", "Species id of the killer, or hazard id ('lava')")
var("deathBossId", "new", "r.deathCause.bossId", "LEVELS[i].boss + level index, e.g. 'carnotaurus@2'")
var("killerIsCompy", "new", "r.deathCause.kind === 'compy'", "Killed by a Compsognathus")
var("minibossKills", "new", "r.stats.minibossKills", "Kills of e.miniboss (rivals) + mini-level bosses")
var("eliteKills", "new", "r.stats.eliteKills", "Kills of e.elite")
var("rareKills", "new", "r.stats.rareKills", "Kills of e.rare")
var("bossAttempts", "new", "r.stats.bossAttempts", "Boss encounters started (boss spawned and aggroed)")
var("bossNoHitKills", "new", "r.stats.bossNoHitKills", "Bosses killed without being hit by that boss (existing 'untouchable' flag, counted)")
var("bossCloseCalls", "new", "r.stats.bossCloseCalls", "Bosses killed with <10% HP left (existing 'closeCall' flag, counted)")
var("fastestBossSeconds", "new", "min over bossKills[].fightSeconds", "Shortest boss fight (aggro -> death)")
var("maxHitDamage", "new", "r.stats.maxHitDamage", "Largest single damage instance dealt")
var("longestNoHitSeconds", "new", "r.stats.longestNoHitSeconds", "Longest stretch of play time without taking damage")
var("lowHpSeconds", "new", "r.stats.lowHpSeconds", "Seconds spent below 15% HP")
var("lavaDamage", "new", "r.stats.lavaDamage", "Damage taken from lava")
var("lavaSeconds", "new", "r.stats.lavaSeconds", "Seconds spent standing in lava")
var("deepWaterSeconds", "new", "r.stats.deepWaterSeconds", "Seconds in deep water (swimmers only can enter)")
var("mudSeconds", "new", "r.stats.mudSeconds", "Seconds in mud")
var("hiddenSeconds", "new", "r.stats.hiddenSeconds", "Seconds concealed (r.hidden)")
var("ambushKills", "new", "r.stats.ambushKills", "Kills where the first hit landed on an unalerted animal")
var("foodStolen", "new", "r.stats.foodStolen", "Food portions stolen from the player by compys")
var("eventsClaimed", "new", "r.stats.eventsClaimed", "Zone reward events claimed (spring/fossil/cache)")
var("sitesClaimed", "new", "r.stats.sitesClaimed", "Explore sites taken (nest/fossil/rare)")
var("zonesAvailable", "new", "sum of map.zones.length over levels visited", "Zones that existed in visited levels")
var("explorationPct", "derived", "100 * zonesFound / max(1, zonesAvailable)", "Exploration completion")
var("epicMutations", "new", "count of epic+legendary in r.mutationLog", "Epic or legendary mutations taken")
var("mutationLog", "new", "r.mutationLog[]", "Ordered list {id, rarity, seconds}")
var("levelUps", "existing", "r.level - 1", "Level-ups this run")
var("achievementsThisRun", "new", "r.stats.achievementsUnlocked", "Achievements first unlocked during this run")
var("secretsFound", "new", "r.stats.secretsFound", "Secret collectibles (amber) found - System 6")
var("secretLevel", "new", "r.secretLevelReached", "Entered the post-Ragnar extinction level - System 6")
var("secretEnding", "new", "r.result.ending === 'survivors'", "Reached the survivors ending - System 7")
var("abandoned", "new", "r.result.abandoned", "Run ended via quit/abandon")
var("nightKills", "partB:B2", "r.stats.nightKills", "Kills during night (needs B2 day/night)")
var("alliesRecruited", "partB:B5", "r.stats.alliesRecruited", "Raptor allies recruited (needs B5)")
var("challengeCount", "partB:B6", "r.challenges.length", "Active risk modifiers (needs B6)")
var("dailySeed", "partB:B7", "r.daily === true", "Run is the daily hunt (needs B7)")

# ---------------------------------------------------------------- titles
RARITY = ["common", "uncommon", "rare", "epic", "legendary", "secret"]
T = []
def title(tid, da, en, desc_da, desc_en, cond, prio, rarity, tie, cat):
    T.append(dict(id=tid, name={"da": da, "en": en}, description={"da": desc_da, "en": desc_en},
                  condition=cond, priority=prio, rarity=rarity, tieBreak=tie, category=cat))

# combat
title("first_blood", "Første Bid", "First Bite", "Nedlagde mindst ét dyr.", "Killed at least one animal.", "s.kills >= 1", 5, "common", "margin:kills", "combat")
title("persistent_hunter", "Vedholdende Jæger", "Persistent Hunter", "10 eller flere byttedyr.", "10 or more kills.", "s.kills >= 10", 20, "common", "margin:kills", "combat")
title("predator_path", "Rovdyrets Vej", "Path of the Predator", "30 eller flere byttedyr.", "30 or more kills.", "s.kills >= 30", 40, "uncommon", "margin:kills", "combat")
title("apex_predator", "Topprædator", "Apex Predator", "60+ dyr og mindst 4 bosser.", "60+ kills and at least 4 bosses.", "s.kills >= 60 && s.bosses >= 4", 70, "epic", "margin:kills", "combat")
title("extinction_expert", "Udryddelsesekspert", "Extinction Expert", "Nedlagde 6 eller flere forskellige arter, mindst 3 af hver.", "Killed 6+ species, at least 3 of each.", "Object.values(s.killsBySpecies).filter(n => n >= 3).length >= 6", 60, "rare", "count:speciesWith3", "combat")
title("sharpshooter", "Præcisionsjæger", "Sharpshooter", "Mindst 40 angreb med 85 % træfsikkerhed.", "40+ attacks at 85% accuracy.", "s.attacks >= 40 && s.accuracy >= 0.85", 45, "rare", "margin:accuracy", "combat")
title("flailing_jaws", "Blæsende Kæber", "Flailing Jaws", "Mindst 40 angreb, under 35 % ramte.", "40+ attacks, under 35% landed.", "s.attacks >= 40 && s.accuracy < 0.35", 15, "uncommon", "inverse:accuracy", "shame")
title("crit_storm", "Kritisk Masse", "Critical Mass", "25 eller flere kritiske træf.", "25 or more critical hits.", "s.crits >= 25", 45, "rare", "margin:crits", "combat")
title("glass_jaw", "Glaskæbe", "Glass Jaw", "Gav under halvt så meget skade, som du tog (min. 100 modtaget).", "Dealt less than half the damage taken (100+ taken).", "s.damageTaken >= 100 && s.damageRatio < 0.5", 12, "uncommon", "inverse:damageRatio", "shame")
title("efficient_killer", "Effektiv Dræber", "Efficient Killer", "Skade-effektivitet på 5:1 med mindst 500 skade.", "5:1 damage ratio with 500+ dealt.", "s.damageDealt >= 500 && s.damageRatio >= 5", 50, "rare", "margin:damageRatio", "combat")
title("heavy_hitter", "Tungt Slag", "Heavy Hitter", "Ét enkelt slag på 60 skade eller mere.", "A single hit of 60+ damage.", "s.maxHitDamage >= 60", 35, "uncommon", "margin:maxHitDamage", "combat")
title("ambusher", "Bagholdsjæger", "Ambusher", "8 nedlæggelser, hvor byttet aldrig så dig komme.", "8 kills on unalerted prey.", "s.ambushKills >= 8", 40, "uncommon", "margin:ambushKills", "combat")
title("albino_hunter", "Hvid Skygge", "White Shadow", "Nedlagde en albino.", "Killed an albino.", "s.albinos >= 1", 30, "uncommon", "margin:albinos", "combat")
title("albino_collector", "Albinosamleren", "Albino Collector", "Nedlagde 3 albinoer i ét run.", "Killed 3 albinos in one run.", "s.albinos >= 3", 65, "epic", "margin:albinos", "combat")
title("elite_breaker", "Elitebryder", "Elite Breaker", "Nedlagde 5 elite- eller sjældne dyr.", "Killed 5 elite or rare animals.", "s.eliteKills + s.rareKills >= 5", 45, "rare", "margin:eliteRare", "combat")
# bosses
title("boss_hunter", "Bossjæger", "Boss Hunter", "Besejrede 2 bosser.", "Defeated 2 bosses.", "s.bosses >= 2", 35, "common", "margin:bosses", "boss")
title("boss_specialist", "Bossspecialist", "Boss Specialist", "Besejrede 5 bosser.", "Defeated 5 bosses.", "s.bosses >= 5", 55, "rare", "margin:bosses", "boss")
title("untouchable", "Urørlig", "Untouchable", "Besejrede en boss uden at blive ramt af den.", "Beat a boss without being hit by it.", "s.bossNoHitKills >= 1", 60, "epic", "margin:bossNoHitKills", "boss")
title("ghost_of_the_valley", "Dalens Spøgelse", "Ghost of the Valley", "Tre bosser uden at blive ramt af dem.", "Three bosses without being hit by them.", "s.bossNoHitKills >= 3", 85, "legendary", "margin:bossNoHitKills", "boss")
title("by_a_thread", "På et Hængende Hår", "By a Thread", "Besejrede en boss med under 10 % liv.", "Beat a boss under 10% HP.", "s.bossCloseCalls >= 1", 50, "rare", "margin:bossCloseCalls", "boss")
title("speed_slayer", "Lynnedlægger", "Speed Slayer", "Besejrede en boss på under 25 sekunder.", "Beat a boss in under 25 s.", "s.fastestBossSeconds > 0 && s.fastestBossSeconds < 25", 55, "rare", "inverse:fastestBossSeconds", "boss")
title("rival_slayer", "Rivalernes Skræk", "Rival Slayer", "Nedlagde 3 rivaler i ét run.", "Killed 3 rivals in one run.", "s.rivals >= 3", 50, "rare", "margin:rivals", "boss")
title("rival_sweep", "Ingen Rivaler Tilbage", "No Rivals Left", "Nedlagde alle rivaler, der fandtes i et fuldt run.", "Killed every rival that spawned in a full run.", "s.levelReached === 8 && s.rivals >= s.rivalsSpawned && s.rivalsSpawned >= 7", 90, "legendary", "fixed", "boss")
title("mini_menace", "Minibossenes Mareridt", "Mini-boss Menace", "6 mini-bosser (rivaler og mini-banebosser).", "6 mini-bosses (rivals and mini level bosses).", "s.minibossKills >= 6", 60, "epic", "margin:minibossKills", "boss")
title("king_slayer", "Kongemorderen", "King Slayer", "Besejrede Ragnar – Dalens Konge.", "Defeated Ragnar, King of the Valley.", "s.victory", 80, "epic", "fixed", "boss")
title("perfect_journey", "Den Perfekte Rejse", "The Perfect Journey", "Vandt med over 50 % liv og ingen boss-fejl.", "Won with >50% HP and no failed boss attempts.", "s.victory && s.hpLeftPct > 50 && s.bossAttempts === s.bosses", 95, "legendary", "margin:hpLeftPct", "boss")
# survival
title("survivor", "Overlever", "Survivor", "Overlevede 10 minutter.", "Survived 10 minutes.", "s.minutes >= 10", 30, "uncommon", "margin:minutes", "survival")
title("marathon_survivor", "Maratonoverlever", "Marathon Survivor", "Overlevede 25 minutter.", "Survived 25 minutes.", "s.minutes >= 25", 55, "rare", "margin:minutes", "survival")
title("ironhide", "Jernhud", "Ironhide", "Tog over 600 skade og vandt alligevel.", "Took 600+ damage and still won.", "s.victory && s.damageTaken >= 600", 65, "epic", "margin:damageTaken", "survival")
title("flawless_stretch", "Uberørt", "Flawless", "5 minutter i træk uden at tage skade.", "5 minutes in a row without damage.", "s.longestNoHitSeconds >= 300", 50, "rare", "margin:longestNoHitSeconds", "survival")
title("living_dangerously", "Lever Farligt", "Living Dangerously", "Over 60 sekunder under 15 % liv – og overlevede banen.", "60+ s below 15% HP and cleared the level.", "s.lowHpSeconds >= 60 && s.bosses >= 1", 40, "uncommon", "margin:lowHpSeconds", "survival")
title("medic", "Selvhelbreder", "Self-Healer", "Helede 400 liv i ét run.", "Healed 400 HP in one run.", "s.healing >= 400", 30, "uncommon", "margin:healing", "survival")
title("dodger", "Undvigeren", "The Dodger", "Undveg 20 angreb.", "Avoided 20 hits.", "s.avoidedHits >= 20", 35, "uncommon", "margin:avoidedHits", "survival")
title("shadow", "Skyggen", "The Shadow", "Skjult i over 3 minutter i alt.", "Hidden for 3+ minutes in total.", "s.hiddenSeconds >= 180", 35, "uncommon", "margin:hiddenSeconds", "survival")
# exploration / movement
title("wanderer", "Vandringsdyr", "Wanderer", "Tilbagelagde 2 km.", "Travelled 2 km.", "s.distanceM >= 2000", 15, "common", "margin:distanceM", "exploration")
title("long_legs", "Lange Ben", "Long Legs", "Tilbagelagde 6 km.", "Travelled 6 km.", "s.distanceM >= 6000", 40, "uncommon", "margin:distanceM", "exploration")
title("marathon_runner", "Maratonløber", "Marathon Runner", "Tilbagelagde 12 km i ét run.", "Travelled 12 km in one run.", "s.distanceM >= 12000", 60, "rare", "margin:distanceM", "exploration")
title("cartographer", "Kartografen", "Cartographer", "Fandt 90 % af områderne på de besøgte baner.", "Found 90% of zones on visited levels.", "s.explorationPct >= 90 && s.levelReached >= 3", 55, "rare", "margin:explorationPct", "exploration")
title("explorer", "Dalens Opdagelsesrejsende", "Explorer of the Valley", "Fandt 15 områder.", "Found 15 zones.", "s.zonesFound >= 15", 35, "uncommon", "margin:zonesFound", "exploration")
title("treasure_seeker", "Skattejæger", "Treasure Seeker", "Tog 10 skjulte belønninger (kilder, fossiler, gemmer).", "Claimed 10 hidden rewards.", "s.eventsClaimed >= 10", 40, "uncommon", "margin:eventsClaimed", "exploration")
title("nest_raider", "Redeplyndrer", "Nest Raider", "Undersøgte og tog fra 6 steder.", "Took from 6 explore sites.", "s.sitesClaimed >= 6", 30, "uncommon", "margin:sitesClaimed", "exploration")
title("tunnel_vision", "Skyklapper", "Tunnel Vision", "Klarede 3 baner, men fandt under 30 % af områderne.", "Cleared 3 levels, found under 30% of zones.", "s.levelReached >= 4 && s.explorationPct < 30", 10, "uncommon", "inverse:explorationPct", "shame")
title("couch_dino", "Sofadino", "Couch Dino", "Under 300 m på over 5 minutter.", "Under 300 m in over 5 minutes.", "s.minutes >= 5 && s.distanceM < 300", 8, "uncommon", "inverse:distanceM", "shame")
title("amber_hunter", "Ravsamler", "Amber Hunter", "Fandt 5 skjulte ravstykker.", "Found 5 hidden amber pieces.", "s.secretsFound >= 5", 70, "epic", "margin:secretsFound", "exploration")
title("amber_keeper", "Ravets Vogter", "Keeper of Amber", "Fandt alle 8 ravstykker i ét run.", "Found all 8 amber pieces in one run.", "s.secretsFound >= 8", 92, "legendary", "fixed", "exploration")
# ecology / diet
title("green_teeth", "Grønne Tænder", "Green Teeth", "Spiste 40 planteportioner.", "Ate 40 plant portions.", "s.plantsEaten >= 40", 30, "uncommon", "margin:plantsEaten", "ecology")
title("pacifist", "Pacifist", "Pacifist", "Nåede bane 3 uden at nedlægge andet end bosser.", "Reached level 3 killing nothing but bosses.", "s.levelReached >= 3 && s.kills - s.bosses <= 0", 75, "epic", "fixed", "ecology")
title("gentle_giant", "Blid Kæmpe", "Gentle Giant", "Planteæder, der nedlagde 2 elite- eller rivaldyr.", "Herbivore that killed 2 elite or rival animals.", "s.diet === 'herbivore' && s.herbivoreElites >= 2", 55, "rare", "margin:herbivoreElites", "ecology")
title("river_hunter", "Flodjæger", "River Hunter", "Fangede 15 fisk.", "Caught 15 fish.", "s.fishCaught >= 15", 35, "uncommon", "margin:fishCaught", "ecology")
title("fish_king", "Fiskekongen", "King of Fish", "Fangede 40 fisk i ét run.", "Caught 40 fish in one run.", "s.fishCaught >= 40", 60, "rare", "margin:fishCaught", "ecology")
title("carrion_connoisseur", "Ådselkender", "Carrion Connoisseur", "Spiste 40 kødportioner.", "Ate 40 meat portions.", "s.meatEaten >= 40", 30, "uncommon", "margin:meatEaten", "ecology")
title("robbed_blind", "Plyndret", "Robbed Blind", "Compys stjal 8 portioner fra dig.", "Compys stole 8 portions from you.", "s.foodStolen >= 8", 25, "uncommon", "margin:foodStolen", "shame")
title("omnivore_gourmet", "Altæder-gourmet", "Omnivore Gourmet", "Spiste mindst 15 planter og 15 kød.", "Ate 15+ plants and 15+ meat.", "s.plantsEaten >= 15 && s.meatEaten >= 15", 35, "uncommon", "min:plants,meat", "ecology")
title("species_curator", "Artssamler", "Species Curator", "Nedlagde 9 forskellige arter.", "Killed 9 different species.", "Object.keys(s.killsBySpecies).length >= 9", 50, "rare", "count:species", "ecology")
# mutation / progression
title("mutant", "Mutanten", "The Mutant", "Valgte 8 mutationer.", "Chose 8 mutations.", "s.mutationsTaken >= 8", 30, "uncommon", "margin:mutationsTaken", "mutation")
title("epic_genome", "Episk Genom", "Epic Genome", "Fik 2 episke eller legendariske mutationer.", "Got 2 epic or legendary mutations.", "s.epicMutations >= 2", 55, "rare", "margin:epicMutations", "mutation")
title("dna_hoarder", "DNA-hamster", "DNA Hoarder", "Tjente 60 DNA i ét run.", "Earned 60 DNA in one run.", "s.dna >= 60", 45, "rare", "margin:dna", "mutation")
title("achiever", "Bedriftsjæger", "Achiever", "Låste 3 bedrifter op i ét run.", "Unlocked 3 achievements in one run.", "s.achievementsThisRun >= 3", 45, "rare", "margin:achievementsThisRun", "mutation")
title("stamina_burner", "Pustløs", "Breathless", "Brugte 3000 stamina.", "Spent 3000 stamina.", "s.staminaSpent >= 3000", 20, "common", "margin:staminaSpent", "mutation")
title("ability_addict", "Evnemisbruger", "Ability Addict", "Brugte artens evne 60 gange.", "Used the species ability 60 times.", "s.abilities >= 60", 25, "uncommon", "margin:abilities", "mutation")
# environment
title("lava_dancer", "Lavadanser", "Lava Dancer", "Stod i lava i 10 sekunder i alt – og overlevede banen.", "10 s in lava total and cleared the level.", "s.lavaSeconds >= 10 && s.levelReached >= 8", 55, "rare", "margin:lavaSeconds", "environment")
title("hot_feet", "Varme Fødder", "Hot Feet", "Tog 40 skade fra lava.", "Took 40 lava damage.", "s.lavaDamage >= 40", 20, "uncommon", "margin:lavaDamage", "shame")
title("swamp_thing", "Sumpvæsen", "Swamp Thing", "Over 2 minutter i mudder.", "2+ minutes in mud.", "s.mudSeconds >= 120", 20, "uncommon", "margin:mudSeconds", "environment")
title("deep_diver", "Dybdedykker", "Deep Diver", "Over 2 minutter i dybt vand.", "2+ minutes in deep water.", "s.deepWaterSeconds >= 120", 30, "uncommon", "margin:deepWaterSeconds", "environment")
# death / shame (only when victory is false)
title("lava_bath", "Lavabadet", "Lava Bath", "Døde i lava.", "Died in lava.", "!s.victory && s.deathCauseType === 'lava'", 70, "uncommon", "fixed", "shame")
title("compy_snack", "Compy-snack", "Compy Snack", "Blev dræbt af en Compsognathus.", "Killed by a Compsognathus.", "!s.victory && s.killerIsCompy", 80, "rare", "fixed", "shame")
title("carls_lunch", "Carls Frokost", "Carl's Lunch", "Blev ædt af Carl – Skovens Vogter.", "Eaten by Carl, Warden of the Forest.", "!s.victory && s.deathBossId === 'carnotaurus@2'", 65, "common", "fixed", "shame")
title("karls_ashes", "Karls Aske", "Karl's Ashes", "Faldt til Karl – Askens Jæger.", "Fell to Karl, Hunter of Ash.", "!s.victory && s.deathBossId === 'carnotaurus@7'", 65, "uncommon", "fixed", "shame")
title("benny_bait", "Bennys Madding", "Benny's Bait", "Blev slugt af Benny ved fiskebankerne.", "Swallowed by Benny at the shoals.", "!s.victory && s.deathBossId === 'baryonyx@3'", 65, "uncommon", "fixed", "shame")
title("doris_dinner", "Doris' Middag", "Doris' Dinner", "Blev trukket ned af Doris – Flodens Gab.", "Dragged under by Doris, Maw of the River.", "!s.victory && s.deathBossId === 'deinosuchus@4'", 65, "uncommon", "fixed", "shame")
title("palle_pushover", "Palles Slagoffer", "Palle's Pushover", "Tabte til Palle på første bane.", "Lost to Palle on level 1.", "!s.victory && s.deathBossId === 'pachycephalosaurus@1'", 70, "uncommon", "fixed", "shame")
title("asta_anvil", "Astas Ambolt", "Asta's Anvil", "Knust af Asta – Klippernes Skjold.", "Crushed by Asta, Shield of the Cliffs.", "!s.victory && s.deathBossId === 'ankylosaurus@5'", 65, "uncommon", "fixed", "shame")
title("tina_skewer", "Tinas Spyd", "Tina's Skewer", "Spiddet af Tina – Klippelandets Vogter.", "Skewered by Tina, Warden of the Crags.", "!s.victory && s.deathBossId === 'triceratops@6'", 65, "uncommon", "fixed", "shame")
title("so_close", "Så Tæt På", "So Close", "Faldt til Ragnar på sidste bane.", "Fell to Ragnar on the final level.", "!s.victory && s.deathBossId === 'tyrannosaurus@8'", 75, "rare", "fixed", "shame")
title("speedrun_to_death", "Hurtigt Uddød", "Speedrun to Extinction", "Døde inden for 60 sekunder.", "Died within 60 seconds.", "!s.victory && !s.abandoned && s.seconds < 60", 85, "rare", "inverse:seconds", "shame")
title("herbivore_casualty", "Græssende Offer", "Grazing Casualty", "Planteæder dræbt af en anden planteæder.", "Herbivore killed by a herbivore.", "!s.victory && s.diet === 'herbivore' && s.deathCauseType === 'enemy' && s.killerDiet === 'herbivore'", 70, "rare", "fixed", "shame")
title("quitter", "Gik Hjem", "Went Home", "Opgav runnet.", "Abandoned the run.", "s.abandoned", 1, "common", "fixed", "shame")
title("punching_bag", "Boksebold", "Punching Bag", "Tog over 1000 skade uden at vinde.", "Took 1000+ damage without winning.", "!s.victory && s.damageTaken >= 1000", 30, "uncommon", "margin:damageTaken", "shame")
# species specific
title("raptor_ace", "Raptoresset", "Raptor Ace", "Velociraptor med 40 nedlæggelser.", "Velociraptor with 40 kills.", "s.species === 'velociraptor' && s.kills >= 40", 50, "rare", "margin:kills", "species")
title("tiny_terror", "Lille Rædsel", "Tiny Terror", "Compy, der besejrede en boss.", "Compy that defeated a boss.", "s.species === 'compy' && s.bosses >= 1", 70, "epic", "margin:bosses", "species")
title("living_tank", "Den Levende Kampvogn", "The Living Tank", "Ankylosaurus, der tog 800 skade og overlevede 15 minutter.", "Ankylosaurus that took 800 damage and lasted 15 min.", "s.species === 'ankylosaurus' && s.damageTaken >= 800 && s.minutes >= 15", 55, "rare", "margin:damageTaken", "species")
title("headbanger", "Hovedstøderen", "Headbanger", "Pachycephalosaurus med 15 kritiske træf.", "Pachycephalosaurus with 15 crits.", "s.species === 'pachycephalosaurus' && s.crits >= 15", 45, "rare", "margin:crits", "species")
title("road_runner", "Vejløberen", "Road Runner", "Gallimimus, der løb 10 km.", "Gallimimus that ran 10 km.", "s.species === 'gallimimus' && s.distanceM >= 10000", 55, "rare", "margin:distanceM", "species")
title("three_horned_fury", "Trehornet Raseri", "Three-Horned Fury", "Triceratops med 3 bosser.", "Triceratops with 3 bosses.", "s.species === 'triceratops' && s.bosses >= 3", 55, "rare", "margin:bosses", "species")
title("bull_rush", "Tyrens Storm", "Bull Rush", "Carnotaurus, der brugte sin evne 40 gange og nedlagde 25.", "Carnotaurus with 40 ability uses and 25 kills.", "s.species === 'carnotaurus' && s.abilities >= 40 && s.kills >= 25", 45, "rare", "min:abilities,kills", "species")
title("croc_lord", "Krokodilleherre", "Croc Lord", "Deinosuchus med 4 minutter i dybt vand og 20 nedlæggelser.", "Deinosuchus with 4 min in deep water and 20 kills.", "s.species === 'deinosuchus' && s.deepWaterSeconds >= 240 && s.kills >= 20", 50, "rare", "margin:kills", "species")
title("tyrant", "Tyrannen", "The Tyrant", "T. rex, der vandt.", "T. rex that won.", "s.species === 'tyrannosaurus' && s.victory", 75, "epic", "fixed", "species")
title("feint_artist", "Fintekunstneren", "Feint Artist", "Deinonychus med 25 vellykkede finte-bid.", "Deinonychus with 25 successful feint bites.", "s.species === 'deinonychus' && s.finteHits >= 25", 45, "rare", "margin:finteHits", "species")
title("utah_unleashed", "Utah Sluppet Løs", "Utah Unleashed", "Utahraptor med 20 nedlæggelser i spring.", "Utahraptor with 20 pounce kills.", "s.species === 'utahraptor' && s.abilityKills >= 20", 45, "rare", "margin:abilityKills", "species")
# secret / meta
title("last_sky", "Under den Sidste Himmel", "Under the Last Sky", "Nåede efterskælvsbanen efter Ragnar.", "Reached the aftermath level after Ragnar.", "s.secretLevel", 97, "secret", "fixed", "secret")
title("they_became_birds", "De Blev til Fugle", "They Became Birds", "Overlevede udryddelsen – den hemmelige slutning.", "Survived the extinction - the secret ending.", "s.secretEnding", 100, "secret", "fixed", "secret")
title("night_stalker", "Natjægeren", "Night Stalker", "15 nedlæggelser om natten.", "15 kills at night.", "s.nightKills >= 15", 45, "rare", "margin:nightKills", "partB")
title("pack_leader", "Flokleder", "Pack Leader", "Rekrutterede 2 raptor-allierede.", "Recruited 2 raptor allies.", "s.alliesRecruited >= 2", 45, "rare", "margin:alliesRecruited", "partB")
title("masochist", "Masochisten", "The Masochist", "Vandt med 3 udfordringer slået til.", "Won with 3 challenges active.", "s.victory && s.challengeCount >= 3", 96, "legendary", "fixed", "partB")
title("daily_champion", "Dagens Jæger", "Hunter of the Day", "Klarede 4 baner i dagens jagt.", "Cleared 4 levels in the daily hunt.", "s.dailySeed && s.levelReached >= 5", 40, "uncommon", "margin:levelReached", "partB")
title("new_branch", "En Ny Gren på Stamtræet", "A New Branch on the Tree", "Standardtitel, når intet andet passer.", "Default title when nothing else applies.", "true", 0, "common", "fixed", "fallback")

# variables introduced by titles above that need declaring
var("rivalsSpawned", "new", "count of map.rival over visited levels", "Rivals that existed in this run (System 6)")
var("killerDiet", "new", "SPECIES[r.deathCause.kind].diet", "Diet of the killer species")
var("abilityKills", "new", "r.stats.abilityKills", "Kills where the final hit was the species ability")

def check():
    errs = []
    ids = [t["id"] for t in T]
    if len(ids) != len(set(ids)): errs.append("duplicate ids")
    for lang in ("da", "en"):
        names = [t["name"][lang] for t in T]
        if len(names) != len(set(names)): errs.append("duplicate %s names" % lang)
    for t in T:
        for v in set(re.findall(r"s\.(\w+)", t["condition"])):
            if v not in V: errs.append("%s reads undeclared s.%s" % (t["id"], v))
        if t["rarity"] not in RARITY: errs.append(t["id"] + " bad rarity")
        tb = t["tieBreak"]
        if not re.match(r"^(fixed|margin:\w+|inverse:\w+|count:\w+|min:[\w,]+)$", tb): errs.append(t["id"] + " bad tieBreak")
        t["requiredVariables"] = sorted(set(re.findall(r"s\.(\w+)", t["condition"])))
        st = {V[v]["status"] for v in t["requiredVariables"]}
        t["implementationStatus"] = "needs Part B" if any(s.startswith("partB") for s in st) else ("needs new tracking" if "new" in st else "trackable today")
    non_fallback = [t for t in T if t["category"] != "fallback"]
    if len(non_fallback) < 75: errs.append("only %d titles" % len(non_fallback))
    return errs

errs = check()
if errs:
    print("\n".join(errs)); sys.exit(1)

(HERE / "run_titles.json").write_text(json.dumps({"rarityOrder": RARITY, "titles": T}, ensure_ascii=False, indent=1) + "\n")
(HERE / "run_summary_variables.json").write_text(json.dumps(V, ensure_ascii=False, indent=1) + "\n")

md = ["# Run titles (generated - edit data/build_titles.py)", "",
      "%d titles (+1 fallback). Columns: rarity, priority, tie-break, variables, implementation status." % (len(T) - 1),
      "Localized names: Danish (source) and English here; de/sv/no/ja/zh are produced by the normal `tools/i18n` pipeline from the Danish name.", ""]
cats = []
for t in T:
    if t["category"] not in cats: cats.append(t["category"])
for c in cats:
    md += ["## " + c, "", "| ID | Navn (da) / Name (en) | Condition | Rarity | Prio | Tie-break | Variables | Status |", "|---|---|---|---|---|---|---|---|"]
    for t in [t for t in T if t["category"] == c]:
        md.append("| `%s` | **%s** / %s<br><small>%s</small> | `%s` | %s | %d | %s | %s | %s |" % (
            t["id"], t["name"]["da"], t["name"]["en"], t["description"]["da"], t["condition"].replace("|", "\\|"),
            t["rarity"], t["priority"], t["tieBreak"], ", ".join(t["requiredVariables"]), t["implementationStatus"]))
    md.append("")
(HERE.parent / "RUN_TITLES.md").write_text("\n".join(md))
from collections import Counter
print("titles", len(T) - 1, "+ fallback;", dict(Counter(t["implementationStatus"] for t in T)), dict(Counter(t["rarity"] for t in T)))
print("variables", len(V), dict(Counter(v["status"].split(":")[0] for v in V.values())))
