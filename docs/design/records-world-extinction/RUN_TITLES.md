# Run titles (generated - edit data/build_titles.py)

95 titles (+1 fallback). Columns: rarity, priority, tie-break, variables, implementation status.
Localized names: Danish (source) and English here; de/sv/no/ja/zh are produced by the normal `tools/i18n` pipeline from the Danish name.

## combat

| ID | Navn (da) / Name (en) | Condition | Rarity | Prio | Tie-break | Variables | Status |
|---|---|---|---|---|---|---|---|
| `first_blood` | **Første Bid** / First Bite<br><small>Nedlagde mindst ét dyr.</small> | `s.kills >= 1` | common | 5 | margin:kills | kills | trackable today |
| `persistent_hunter` | **Vedholdende Jæger** / Persistent Hunter<br><small>10 eller flere byttedyr.</small> | `s.kills >= 10` | common | 20 | margin:kills | kills | trackable today |
| `predator_path` | **Rovdyrets Vej** / Path of the Predator<br><small>30 eller flere byttedyr.</small> | `s.kills >= 30` | uncommon | 40 | margin:kills | kills | trackable today |
| `apex_predator` | **Topprædator** / Apex Predator<br><small>60+ dyr og mindst 4 bosser.</small> | `s.kills >= 60 && s.bosses >= 4` | epic | 70 | margin:kills | bosses, kills | trackable today |
| `extinction_expert` | **Udryddelsesekspert** / Extinction Expert<br><small>Nedlagde 6 eller flere forskellige arter, mindst 3 af hver.</small> | `Object.values(s.killsBySpecies).filter(n => n >= 3).length >= 6` | rare | 60 | count:speciesWith3 | killsBySpecies | trackable today |
| `sharpshooter` | **Præcisionsjæger** / Sharpshooter<br><small>Mindst 40 angreb med 85 % træfsikkerhed.</small> | `s.attacks >= 40 && s.accuracy >= 0.85` | rare | 45 | margin:accuracy | accuracy, attacks | trackable today |
| `crit_storm` | **Kritisk Masse** / Critical Mass<br><small>25 eller flere kritiske træf.</small> | `s.crits >= 25` | rare | 45 | margin:crits | crits | trackable today |
| `efficient_killer` | **Effektiv Dræber** / Efficient Killer<br><small>Skade-effektivitet på 5:1 med mindst 500 skade.</small> | `s.damageDealt >= 500 && s.damageRatio >= 5` | rare | 50 | margin:damageRatio | damageDealt, damageRatio | trackable today |
| `heavy_hitter` | **Tungt Slag** / Heavy Hitter<br><small>Ét enkelt slag på 60 skade eller mere.</small> | `s.maxHitDamage >= 60` | uncommon | 35 | margin:maxHitDamage | maxHitDamage | needs new tracking |
| `ambusher` | **Bagholdsjæger** / Ambusher<br><small>8 nedlæggelser, hvor byttet aldrig så dig komme.</small> | `s.ambushKills >= 8` | uncommon | 40 | margin:ambushKills | ambushKills | needs new tracking |
| `albino_hunter` | **Hvid Skygge** / White Shadow<br><small>Nedlagde en albino.</small> | `s.albinos >= 1` | uncommon | 30 | margin:albinos | albinos | trackable today |
| `albino_collector` | **Albinosamleren** / Albino Collector<br><small>Nedlagde 3 albinoer i ét run.</small> | `s.albinos >= 3` | epic | 65 | margin:albinos | albinos | trackable today |
| `elite_breaker` | **Elitebryder** / Elite Breaker<br><small>Nedlagde 5 elite- eller sjældne dyr.</small> | `s.eliteKills + s.rareKills >= 5` | rare | 45 | margin:eliteRare | eliteKills, rareKills | needs new tracking |

## shame

| ID | Navn (da) / Name (en) | Condition | Rarity | Prio | Tie-break | Variables | Status |
|---|---|---|---|---|---|---|---|
| `flailing_jaws` | **Blæsende Kæber** / Flailing Jaws<br><small>Mindst 40 angreb, under 35 % ramte.</small> | `s.attacks >= 40 && s.accuracy < 0.35` | uncommon | 15 | inverse:accuracy | accuracy, attacks | trackable today |
| `glass_jaw` | **Glaskæbe** / Glass Jaw<br><small>Gav under halvt så meget skade, som du tog (min. 100 modtaget).</small> | `s.damageTaken >= 100 && s.damageRatio < 0.5` | uncommon | 12 | inverse:damageRatio | damageRatio, damageTaken | trackable today |
| `tunnel_vision` | **Skyklapper** / Tunnel Vision<br><small>Klarede 3 baner, men fandt under 30 % af områderne.</small> | `s.levelReached >= 4 && s.explorationPct < 30` | uncommon | 10 | inverse:explorationPct | explorationPct, levelReached | trackable today |
| `couch_dino` | **Sofadino** / Couch Dino<br><small>Under 300 m på over 5 minutter.</small> | `s.minutes >= 5 && s.distanceM < 300` | uncommon | 8 | inverse:distanceM | distanceM, minutes | trackable today |
| `robbed_blind` | **Plyndret** / Robbed Blind<br><small>Compys stjal 8 portioner fra dig.</small> | `s.foodStolen >= 8` | uncommon | 25 | margin:foodStolen | foodStolen | needs new tracking |
| `hot_feet` | **Varme Fødder** / Hot Feet<br><small>Tog 40 skade fra lava.</small> | `s.lavaDamage >= 40` | uncommon | 20 | margin:lavaDamage | lavaDamage | needs new tracking |
| `lava_bath` | **Lavabadet** / Lava Bath<br><small>Døde i lava.</small> | `!s.victory && s.deathCauseType === 'lava'` | uncommon | 70 | fixed | deathCauseType, victory | needs new tracking |
| `compy_snack` | **Compy-snack** / Compy Snack<br><small>Blev dræbt af en Compsognathus.</small> | `!s.victory && s.killerIsCompy` | rare | 80 | fixed | killerIsCompy, victory | needs new tracking |
| `carls_lunch` | **Carls Frokost** / Carl's Lunch<br><small>Blev ædt af Carl – Skovens Vogter.</small> | `!s.victory && s.deathBossId === 'carnotaurus@2'` | common | 65 | fixed | deathBossId, victory | needs new tracking |
| `karls_ashes` | **Karls Aske** / Karl's Ashes<br><small>Faldt til Karl – Askens Jæger.</small> | `!s.victory && s.deathBossId === 'carnotaurus@7'` | uncommon | 65 | fixed | deathBossId, victory | needs new tracking |
| `benny_bait` | **Bennys Madding** / Benny's Bait<br><small>Blev slugt af Benny ved fiskebankerne.</small> | `!s.victory && s.deathBossId === 'baryonyx@3'` | uncommon | 65 | fixed | deathBossId, victory | needs new tracking |
| `doris_dinner` | **Doris' Middag** / Doris' Dinner<br><small>Blev trukket ned af Doris – Flodens Gab.</small> | `!s.victory && s.deathBossId === 'deinosuchus@4'` | uncommon | 65 | fixed | deathBossId, victory | needs new tracking |
| `palle_pushover` | **Palles Slagoffer** / Palle's Pushover<br><small>Tabte til Palle på første bane.</small> | `!s.victory && s.deathBossId === 'pachycephalosaurus@1'` | uncommon | 70 | fixed | deathBossId, victory | needs new tracking |
| `asta_anvil` | **Astas Ambolt** / Asta's Anvil<br><small>Knust af Asta – Klippernes Skjold.</small> | `!s.victory && s.deathBossId === 'ankylosaurus@5'` | uncommon | 65 | fixed | deathBossId, victory | needs new tracking |
| `tina_skewer` | **Tinas Spyd** / Tina's Skewer<br><small>Spiddet af Tina – Klippelandets Vogter.</small> | `!s.victory && s.deathBossId === 'triceratops@6'` | uncommon | 65 | fixed | deathBossId, victory | needs new tracking |
| `so_close` | **Så Tæt På** / So Close<br><small>Faldt til Ragnar på sidste bane.</small> | `!s.victory && s.deathBossId === 'tyrannosaurus@8'` | rare | 75 | fixed | deathBossId, victory | needs new tracking |
| `speedrun_to_death` | **Hurtigt Uddød** / Speedrun to Extinction<br><small>Døde inden for 60 sekunder.</small> | `!s.victory && !s.abandoned && s.seconds < 60` | rare | 85 | inverse:seconds | abandoned, seconds, victory | needs new tracking |
| `herbivore_casualty` | **Græssende Offer** / Grazing Casualty<br><small>Planteæder dræbt af en anden planteæder.</small> | `!s.victory && s.diet === 'herbivore' && s.deathCauseType === 'enemy' && s.killerDiet === 'herbivore'` | rare | 70 | fixed | deathCauseType, diet, killerDiet, victory | needs new tracking |
| `quitter` | **Gik Hjem** / Went Home<br><small>Opgav runnet.</small> | `s.abandoned` | common | 1 | fixed | abandoned | needs new tracking |
| `punching_bag` | **Boksebold** / Punching Bag<br><small>Tog over 1000 skade uden at vinde.</small> | `!s.victory && s.damageTaken >= 1000` | uncommon | 30 | margin:damageTaken | damageTaken, victory | trackable today |

## boss

| ID | Navn (da) / Name (en) | Condition | Rarity | Prio | Tie-break | Variables | Status |
|---|---|---|---|---|---|---|---|
| `boss_hunter` | **Bossjæger** / Boss Hunter<br><small>Besejrede 2 bosser.</small> | `s.bosses >= 2` | common | 35 | margin:bosses | bosses | trackable today |
| `boss_specialist` | **Bossspecialist** / Boss Specialist<br><small>Besejrede 5 bosser.</small> | `s.bosses >= 5` | rare | 55 | margin:bosses | bosses | trackable today |
| `untouchable` | **Urørlig** / Untouchable<br><small>Besejrede en boss uden at blive ramt af den.</small> | `s.bossNoHitKills >= 1` | epic | 60 | margin:bossNoHitKills | bossNoHitKills | needs new tracking |
| `ghost_of_the_valley` | **Dalens Spøgelse** / Ghost of the Valley<br><small>Tre bosser uden at blive ramt af dem.</small> | `s.bossNoHitKills >= 3` | legendary | 85 | margin:bossNoHitKills | bossNoHitKills | needs new tracking |
| `by_a_thread` | **På et Hængende Hår** / By a Thread<br><small>Besejrede en boss med under 10 % liv.</small> | `s.bossCloseCalls >= 1` | rare | 50 | margin:bossCloseCalls | bossCloseCalls | needs new tracking |
| `speed_slayer` | **Lynnedlægger** / Speed Slayer<br><small>Besejrede en boss på under 25 sekunder i et run med mindst 2 bosser.</small> | `s.bosses >= 2 && s.fastestBossSeconds > 0 && s.fastestBossSeconds < 25` | rare | 55 | inverse:fastestBossSeconds | fastestBossSeconds, bosses | needs new tracking |
| `rival_slayer` | **Rivalernes Skræk** / Rival Slayer<br><small>Nedlagde 3 rivaler i ét run.</small> | `s.rivals >= 3` | rare | 50 | margin:rivals | rivals | trackable today |
| `rival_sweep` | **Ingen Rivaler Tilbage** / No Rivals Left<br><small>Nedlagde alle rivaler, der fandtes i et fuldt run.</small> | `s.levelReached === 8 && s.rivals >= s.rivalsSpawned && s.rivalsSpawned >= 7` | legendary | 90 | fixed | levelReached, rivals, rivalsSpawned | needs new tracking |
| `mini_menace` | **Minibossenes Mareridt** / Mini-boss Menace<br><small>6 mini-bosser (rivaler og mini-banebosser).</small> | `s.minibossKills >= 6` | epic | 60 | margin:minibossKills | minibossKills | needs new tracking |
| `king_slayer` | **Kongemorderen** / King Slayer<br><small>Besejrede Ragnar – Dalens Konge.</small> | `s.victory` | epic | 80 | fixed | victory | trackable today |
| `perfect_journey` | **Den Perfekte Rejse** / The Perfect Journey<br><small>Vandt med over 50 % liv og ingen boss-fejl.</small> | `s.victory && s.hpLeftPct > 50 && s.bossAttempts === s.bosses` | legendary | 95 | margin:hpLeftPct | bossAttempts, bosses, hpLeftPct, victory | needs new tracking |

## survival

| ID | Navn (da) / Name (en) | Condition | Rarity | Prio | Tie-break | Variables | Status |
|---|---|---|---|---|---|---|---|
| `survivor` | **Overlever** / Survivor<br><small>Overlevede 10 minutter.</small> | `s.minutes >= 10` | uncommon | 30 | margin:minutes | minutes | trackable today |
| `marathon_survivor` | **Maratonoverlever** / Marathon Survivor<br><small>Overlevede 25 minutter.</small> | `s.minutes >= 25` | rare | 55 | margin:minutes | minutes | trackable today |
| `ironhide` | **Jernhud** / Ironhide<br><small>Tog over 600 skade og vandt alligevel.</small> | `s.victory && s.damageTaken >= 600` | epic | 65 | margin:damageTaken | damageTaken, victory | trackable today |
| `flawless_stretch` | **Uberørt** / Flawless<br><small>5 minutter i træk uden at tage skade.</small> | `s.longestNoHitSeconds >= 300` | rare | 50 | margin:longestNoHitSeconds | longestNoHitSeconds | needs new tracking |
| `living_dangerously` | **Lever Farligt** / Living Dangerously<br><small>Over 60 sekunder under 15 % liv – og overlevede banen.</small> | `s.lowHpSeconds >= 60 && s.bosses >= 1` | uncommon | 40 | margin:lowHpSeconds | bosses, lowHpSeconds | needs new tracking |
| `medic` | **Selvhelbreder** / Self-Healer<br><small>Helede 400 liv i ét run.</small> | `s.healing >= 400` | uncommon | 30 | margin:healing | healing | trackable today |
| `dodger` | **Undvigeren** / The Dodger<br><small>Undveg 20 angreb.</small> | `s.avoidedHits >= 20` | uncommon | 35 | margin:avoidedHits | avoidedHits | trackable today |
| `shadow` | **Skyggen** / The Shadow<br><small>Skjult i over 3 minutter i alt.</small> | `s.hiddenSeconds >= 180` | uncommon | 35 | margin:hiddenSeconds | hiddenSeconds | needs new tracking |

## exploration

| ID | Navn (da) / Name (en) | Condition | Rarity | Prio | Tie-break | Variables | Status |
|---|---|---|---|---|---|---|---|
| `wanderer` | **Vandringsdyr** / Wanderer<br><small>Tilbagelagde 2 km.</small> | `s.distanceM >= 2000` | common | 15 | margin:distanceM | distanceM | trackable today |
| `long_legs` | **Lange Ben** / Long Legs<br><small>Tilbagelagde 6 km.</small> | `s.distanceM >= 6000` | uncommon | 40 | margin:distanceM | distanceM | trackable today |
| `marathon_runner` | **Maratonløber** / Marathon Runner<br><small>Tilbagelagde 12 km i ét run.</small> | `s.distanceM >= 12000` | rare | 60 | margin:distanceM | distanceM | trackable today |
| `cartographer` | **Kartografen** / Cartographer<br><small>Fandt 90 % af områderne på de besøgte baner.</small> | `s.explorationPct >= 90 && s.levelReached >= 3` | rare | 55 | margin:explorationPct | explorationPct, levelReached | trackable today |
| `explorer` | **Dalens Opdagelsesrejsende** / Explorer of the Valley<br><small>Fandt 15 områder.</small> | `s.zonesFound >= 15` | uncommon | 35 | margin:zonesFound | zonesFound | trackable today |
| `treasure_seeker` | **Skattejæger** / Treasure Seeker<br><small>Tog 10 skjulte belønninger (kilder, fossiler, gemmer).</small> | `s.eventsClaimed >= 10` | uncommon | 40 | margin:eventsClaimed | eventsClaimed | needs new tracking |
| `nest_raider` | **Redeplyndrer** / Nest Raider<br><small>Undersøgte og tog fra 6 steder.</small> | `s.sitesClaimed >= 6` | uncommon | 30 | margin:sitesClaimed | sitesClaimed | needs new tracking |
| `amber_hunter` | **Ravsamler** / Amber Hunter<br><small>Fandt 5 skjulte ravstykker.</small> | `s.secretsFound >= 5` | epic | 70 | margin:secretsFound | secretsFound | needs new tracking |
| `amber_keeper` | **Ravets Vogter** / Keeper of Amber<br><small>Fandt alle 8 ravstykker i ét run.</small> | `s.secretsFound >= 8` | legendary | 92 | fixed | secretsFound | needs new tracking |

## ecology

| ID | Navn (da) / Name (en) | Condition | Rarity | Prio | Tie-break | Variables | Status |
|---|---|---|---|---|---|---|---|
| `green_teeth` | **Grønne Tænder** / Green Teeth<br><small>Spiste 40 planteportioner.</small> | `s.plantsEaten >= 40` | uncommon | 30 | margin:plantsEaten | plantsEaten | trackable today |
| `pacifist` | **Pacifist** / Pacifist<br><small>Nåede bane 3 uden at nedlægge andet end bosser.</small> | `s.levelReached >= 3 && s.kills - s.bosses <= 0` | epic | 75 | fixed | bosses, kills, levelReached | trackable today |
| `gentle_giant` | **Blid Kæmpe** / Gentle Giant<br><small>Planteæder, der nedlagde 2 elite- eller rivaldyr.</small> | `s.diet === 'herbivore' && s.herbivoreElites >= 2` | rare | 55 | margin:herbivoreElites | diet, herbivoreElites | trackable today |
| `river_hunter` | **Flodjæger** / River Hunter<br><small>Fangede 15 fisk.</small> | `s.fishCaught >= 15` | uncommon | 35 | margin:fishCaught | fishCaught | trackable today |
| `fish_king` | **Fiskekongen** / King of Fish<br><small>Fangede 40 fisk i ét run.</small> | `s.fishCaught >= 40` | rare | 60 | margin:fishCaught | fishCaught | trackable today |
| `carrion_connoisseur` | **Ådselkender** / Carrion Connoisseur<br><small>Spiste 40 kødportioner.</small> | `s.meatEaten >= 40` | uncommon | 30 | margin:meatEaten | meatEaten | trackable today |
| `omnivore_gourmet` | **Altæder-gourmet** / Omnivore Gourmet<br><small>Spiste mindst 15 planter og 15 kød.</small> | `s.plantsEaten >= 15 && s.meatEaten >= 15` | uncommon | 35 | min:plants,meat | meatEaten, plantsEaten | trackable today |
| `species_curator` | **Artssamler** / Species Curator<br><small>Nedlagde 9 forskellige arter.</small> | `Object.keys(s.killsBySpecies).length >= 9` | rare | 50 | count:species | killsBySpecies | trackable today |

## mutation

| ID | Navn (da) / Name (en) | Condition | Rarity | Prio | Tie-break | Variables | Status |
|---|---|---|---|---|---|---|---|
| `mutant` | **Mutanten** / The Mutant<br><small>Valgte 8 mutationer.</small> | `s.mutationsTaken >= 8` | uncommon | 30 | margin:mutationsTaken | mutationsTaken | trackable today |
| `epic_genome` | **Episk Genom** / Epic Genome<br><small>Fik 2 episke eller legendariske mutationer.</small> | `s.epicMutations >= 2` | rare | 55 | margin:epicMutations | epicMutations | needs new tracking |
| `dna_hoarder` | **DNA-hamster** / DNA Hoarder<br><small>Tjente 60 DNA i ét run.</small> | `s.dna >= 60` | rare | 45 | margin:dna | dna | trackable today |
| `achiever` | **Bedriftsjæger** / Achiever<br><small>Låste 3 bedrifter op i ét run.</small> | `s.achievementsThisRun >= 3` | rare | 45 | margin:achievementsThisRun | achievementsThisRun | needs new tracking |
| `stamina_burner` | **Pustløs** / Breathless<br><small>Brugte 3000 stamina.</small> | `s.staminaSpent >= 3000` | common | 20 | margin:staminaSpent | staminaSpent | trackable today |
| `ability_addict` | **Evnemisbruger** / Ability Addict<br><small>Brugte artens evne 60 gange.</small> | `s.abilities >= 60` | uncommon | 25 | margin:abilities | abilities | trackable today |

## environment

| ID | Navn (da) / Name (en) | Condition | Rarity | Prio | Tie-break | Variables | Status |
|---|---|---|---|---|---|---|---|
| `lava_dancer` | **Lavadanser** / Lava Dancer<br><small>Stod i lava i 10 sekunder i alt – og overlevede banen.</small> | `s.lavaSeconds >= 10 && s.levelReached >= 8` | rare | 55 | margin:lavaSeconds | lavaSeconds, levelReached | needs new tracking |
| `swamp_thing` | **Sumpvæsen** / Swamp Thing<br><small>Over 2 minutter i mudder.</small> | `s.mudSeconds >= 120` | uncommon | 20 | margin:mudSeconds | mudSeconds | needs new tracking |
| `deep_diver` | **Dybdedykker** / Deep Diver<br><small>Over 2 minutter i dybt vand.</small> | `s.deepWaterSeconds >= 120` | uncommon | 30 | margin:deepWaterSeconds | deepWaterSeconds | needs new tracking |

## species

| ID | Navn (da) / Name (en) | Condition | Rarity | Prio | Tie-break | Variables | Status |
|---|---|---|---|---|---|---|---|
| `raptor_ace` | **Raptoresset** / Raptor Ace<br><small>Velociraptor med 40 nedlæggelser.</small> | `s.species === 'velociraptor' && s.kills >= 40` | rare | 50 | margin:kills | kills, species | trackable today |
| `tiny_terror` | **Lille Rædsel** / Tiny Terror<br><small>Compy, der besejrede en boss.</small> | `s.species === 'compy' && s.bosses >= 1` | epic | 70 | margin:bosses | bosses, species | trackable today |
| `living_tank` | **Den Levende Kampvogn** / The Living Tank<br><small>Ankylosaurus, der tog 800 skade og overlevede 15 minutter.</small> | `s.species === 'ankylosaurus' && s.damageTaken >= 800 && s.minutes >= 15` | rare | 55 | margin:damageTaken | damageTaken, minutes, species | trackable today |
| `headbanger` | **Hovedstøderen** / Headbanger<br><small>Pachycephalosaurus med 15 kritiske træf.</small> | `s.species === 'pachycephalosaurus' && s.crits >= 15` | rare | 45 | margin:crits | crits, species | trackable today |
| `road_runner` | **Vejløberen** / Road Runner<br><small>Gallimimus, der løb 10 km.</small> | `s.species === 'gallimimus' && s.distanceM >= 10000` | rare | 55 | margin:distanceM | distanceM, species | trackable today |
| `three_horned_fury` | **Trehornet Raseri** / Three-Horned Fury<br><small>Triceratops med 3 bosser.</small> | `s.species === 'triceratops' && s.bosses >= 3` | rare | 55 | margin:bosses | bosses, species | trackable today |
| `bull_rush` | **Tyrens Storm** / Bull Rush<br><small>Carnotaurus, der brugte sin evne 40 gange og nedlagde 25.</small> | `s.species === 'carnotaurus' && s.abilities >= 40 && s.kills >= 25` | rare | 45 | min:abilities,kills | abilities, kills, species | trackable today |
| `croc_lord` | **Krokodilleherre** / Croc Lord<br><small>Deinosuchus med 4 minutter i dybt vand og 20 nedlæggelser.</small> | `s.species === 'deinosuchus' && s.deepWaterSeconds >= 240 && s.kills >= 20` | rare | 50 | margin:kills | deepWaterSeconds, kills, species | needs new tracking |
| `tyrant` | **Tyrannen** / The Tyrant<br><small>T. rex, der vandt.</small> | `s.species === 'tyrannosaurus' && s.victory` | epic | 75 | fixed | species, victory | trackable today |
| `feint_artist` | **Fintekunstneren** / Feint Artist<br><small>Deinonychus med 25 vellykkede finte-bid.</small> | `s.species === 'deinonychus' && s.finteHits >= 25` | rare | 45 | margin:finteHits | finteHits, species | trackable today |
| `utah_unleashed` | **Utah Sluppet Løs** / Utah Unleashed<br><small>Utahraptor med 20 nedlæggelser i spring.</small> | `s.species === 'utahraptor' && s.abilityKills >= 20` | rare | 45 | margin:abilityKills | abilityKills, species | needs new tracking |

## secret

| ID | Navn (da) / Name (en) | Condition | Rarity | Prio | Tie-break | Variables | Status |
|---|---|---|---|---|---|---|---|
| `last_sky` | **Under den Sidste Himmel** / Under the Last Sky<br><small>Nåede efterskælvsbanen efter Ragnar.</small> | `s.secretLevel` | secret | 97 | fixed | secretLevel | needs new tracking |
| `they_became_birds` | **De Blev til Fugle** / They Became Birds<br><small>Overlevede udryddelsen – den hemmelige slutning.</small> | `s.secretEnding` | secret | 100 | fixed | secretEnding | needs new tracking |

## partB

| ID | Navn (da) / Name (en) | Condition | Rarity | Prio | Tie-break | Variables | Status |
|---|---|---|---|---|---|---|---|
| `night_stalker` | **Natjægeren** / Night Stalker<br><small>15 nedlæggelser om natten.</small> | `s.nightKills >= 15` | rare | 45 | margin:nightKills | nightKills | needs Part B |
| `pack_leader` | **Flokleder** / Pack Leader<br><small>Rekrutterede 2 raptor-allierede.</small> | `s.alliesRecruited >= 2` | rare | 45 | margin:alliesRecruited | alliesRecruited | needs Part B |
| `masochist` | **Masochisten** / The Masochist<br><small>Vandt med 3 udfordringer slået til.</small> | `s.victory && s.challengeCount >= 3` | legendary | 96 | fixed | challengeCount, victory | needs Part B |
| `daily_champion` | **Dagens Jæger** / Hunter of the Day<br><small>Klarede 4 baner i dagens jagt.</small> | `s.dailySeed && s.levelReached >= 5` | uncommon | 40 | margin:levelReached | dailySeed, levelReached | needs Part B |

## fallback

| ID | Navn (da) / Name (en) | Condition | Rarity | Prio | Tie-break | Variables | Status |
|---|---|---|---|---|---|---|---|
| `new_branch` | **En Ny Gren på Stamtræet** / A New Branch on the Tree<br><small>Standardtitel, når intet andet passer.</small> | `true` | common | 0 | fixed |  | trackable today |
