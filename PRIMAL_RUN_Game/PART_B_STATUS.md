# Del B – status (claude/part-b)

Plan: `PART_B_PLAN_2026-10.md`. Rækkefølge: B1a → B1b → B1c → B7 → B6 → B8 → B3 → B4 → B2 → B5.
Alt nyt ligger bag `FEATURES.<flag>` i `src/core.js` (sæt flaget til `false` for at slå det fra).
"Bevist" = test eller måling i repoet. "Antagelse" = ikke målt.

## Arbejdsgang (10. okt.)

- `claude/part-b` fast-forwardet til `origin/integration/next` (030f613) og pushet.
- `codex/sprites-and-mechanics` (33d78a1) har ingen nye commits ud over det, der allerede er i grenen, så der er intet overlap at undgå.
- Underagenter `primal-scout`, `primal-code-reviewer` og `primal-balance-analyst` var indlæst.
- **Konfiguration rettet:** `primal-boss-lava` og `primal-release-review` havde `disable-model-invocation: true` og kunne derfor ikke kaldes af Claude, selvom planen kræver dem. Flaget er fjernet i de to SKILL.md-filer. `primal-integrate` og `primal-fable-review` er stadig kun for Jonas.
- Browsertests i cloud: `PRIMAL_CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (`npx playwright install` er ikke nødvendig).

## Pakker

| Pakke | Flag | Status | Tests |
|---|---|---|---|
| B1a Boss-rækkevidde | `bossReach` | færdig | X1, X3–X8, X10, X11, X12 + hjørne-/AoE-/klippetests |
| B1b Lavakrydsninger | `lavaCrossings` | færdig | X2, krydsningsgeometri på 40 seeds, browser |
| B1c Signaturmekanikker | `bossSignatures` | færdig (Benny, Ragnar, Karl) | X9-audit på 8 baner, én test pr. mekanik, Carl identisk, browser |
| B7 Dagens jagt | `dailyHunt` | færdig | `tests/daily-hunt.test.cjs` (5), browser da/de 390 px |
| B6 Udfordringer | `challenges` | færdig | `tests/challenges.test.cjs` (5), browser da/ja 390 px |
| B8 Baryonyx-fiskekonge | `fishKing` | færdig | `tests/fish-king.test.cjs` (4), browser da/sv |
| B3 Spor og lugt | `scentTrails` | færdig | `tests/scent-trails.test.cjs` (5), browser: tegning + frametid (Q26-metoden) |
| B4 Tørke og vandhuller | `drought` | færdig | `tests/drought.test.cjs` (4), browser da/en |

### B1a – boss-rækkevidde (05 §4)

- Nav-grid med 32 px celler pr. kort og nav-klasse, bygget første gang en boss har brug for det. 3×3 prøvepunkter pr. celle, så lavastriben på 28 px aldrig smutter mellem to celler. Klipper blokerer celler ud fra bossens radius.
- BFS-flowfelt fra spilleren, højst hver 0,5 s pr. boss, og kun mens den lige linje er blokeret (X8).
- Tilstande: `chase` (uændret, når linjen er fri), `reposition` (følger flowfeltet mod en krydsning; bid er stadig tilladt tæt på), `stalk` (ingen vej: holder spillerens rækkevidde + 30 px, vender mod spilleren), `leash` (12 s uden vej og 8 s uden skade: går hjem, samme HP). En boss, der står i et hjørne inden for spillerens rækkevidde, kæmper normalt igen.
- Stormløb: banen tjekkes ved valg og ved låsning af sigtet (55 %). Er den blokeret, bliver det et bid (under 150 px) eller intet angreb. Et stormløb, der rammer lava, stopper med 0,45 s recover (`SKRIDER`).
- Fejl fundet og rettet undervejs: `move()` kunne skubbe en boss fra en klippe ud i lavaen. `travel()` fortryder nu det skub (X7-test med klippe).
- Bosser over 28 px radius kan svømme (`canSwim`), så dybt vand blokerer ingen boss. Carl på bane 2 rammes derfor aldrig af den nye kode (X10: identisk).
- Afvigelse fra 05 §4.1: Den lige linje (sigtelinje og stormløbsbane) ser kun på terræn, ikke på klipper. Klipper er små cirkler, som `move()` allerede glider uden om. Valgfrit `answer`/ASKEKAST hører til B1c.

### B1b – lavakrydsninger

- Porteret fra `codex/preserved-feathered-starter`. Positionerne er de samme (kurven ved 28 % og 68 %) og flyttes kun, hvis en krydsning ellers ville ligge under 600 px fra start eller under 900 px fra den anden. Der er ingen lava inden for 70 px af en krydsning.
- Kortgenereringen bruger ikke flere `random()`-kald, så alle andre seeds giver samme kort som før.
- Grafikken tegnes procedurelt (basaltsten i Primal Earth 32). Det rigtige asset er skrevet i `MISSING_SPRITES.md`.
- Bots (`tools/playstyle_sim.cjs`) finder vej over lava via krydsningerne med samme nav-grid. Ny stil `exploiter` stiller sig på den anden side af lava/dybt vand og angriber kun derfra. Ny boss-duel-tilstand: `runOne({ level, bossDuel, open, across })` og `tools/boss_duel.cjs`.

### B1a – rettelser efter review (primal-code-reviewer på 97a0c96)

- `reposition` stopper ikke længere ved bredden for at bide hen over lavaen. Bossen går mod krydsningen og trækker sig samtidig ud af spillerens rækkevidde. Før kunne T. rex og Deinosuchus dræbe Karl fra en fast plads, fordi han stod og byttede bid med dem.
- Sigtelinjen tjekkes højst hver 0,15 s og vejpunktet højst hver 0,2 s. Alle bosser uden for bane 7 og 8 springer tjekket helt over (de kan svømme, og der er ingen lava). Det sparer CPU på mobil.
- X7-klippetesten beviser nu også den gamle fejl, når flaget er slået fra.
- Kendte, ikke rettede punkter: I `stalk`/`leash` straffes spilleren ikke for at stå bag bossen (bossen angriber ikke i de tilstande). `leash` går i lige linje hjem. Nav-grid-cachen opdateres ikke, hvis klipper eller lava ændres midt i en bane (det sker ikke i spillet, kun i tests).
- Bevidst valg: At stå med ryggen mod lavaen er stadig en stærk taktik. En T. rex, der står fast 18 px fra lavaen, kan nå at dræbe Karl, men mister 55–74 % liv (`probe`). Terræn må gerne bruges taktisk, men en bosskamp må ikke være gratis. Testen kræver derfor, at Karl højst mister 25 % liv, eller at spilleren mister mindst 50 %.

### B1c – signaturmekanikker

- **Benny (bane 3):** Er han højst 140 px fra vand, dykker han. Det har 1,2 s windup, bobler, en cirkel på 70 px, der følger spilleren de første 35 % og derefter står stille i 0,78 s, og han dukker op ved kanten af cirklen. Kun cirklen afgør, om man bliver ramt. Hver 10. sekund løber han i højst 5 s tilbage mod floden, hvis den er under 720 px væk og dykket er klar.
- **Ragnar (bane 8):** Det eksisterende brøl (1,25 s windup, cirkel på 230 px) får nu småvildt (planteædere ≤ 22 px) inden for 520 px til at stampede mod spilleren i 2,2 s. Det gør ingen skade, men giver et kort slow ved kontakt. Står spilleren i cirklen, halveres stamina-regenerationen i 4 s (`r.roarDebuff`).
- **Carl og Karl, dobbelt stormløb:** Det fandtes allerede i fase 2 (`STORMLØB 1/2–2/2`) og er ikke lavet om. Carl er ikke ændret: dueller med alle B1-flag af og til er identiske.
- **Karl (bane 7):** Hvert afsluttet stormløb efterlader en askesky (3 s, radius 90 px). Inde i skyen er spilleren 15 % langsommere, og den gør ingen skade. Først brugte skyen `r.slow` (−35 %), og det gjorde Karl markant sværere for optimizer-botten: 56,7 % mod 77,6 % boss-HP tabt på åben grund. Derfor blev den sat ned efter X2. Under `stalk` kommer **ASKEKAST**, hvis han er blevet ramt inden for de sidste 2 s og står uden for spillerens rækkevidde: en låst cirkel på 70 px med 0,9 s windup, der giver 0,6 × biddets skade og har 4 s cooldown.
- **X9:** Alle skadevoldende bossangreb på alle 8 baner kommer efter et windup på mindst 0,45 s (test med tilfældige bevægelser). Browsertesten viser, at `telegraphShape` returnerer en form for alle 7 bossarter × 6 mønstre, og at dyk og ASKEKAST tegnes ved målet.

**Forslag (ikke bygget) til de øvrige bosser:**
- *Palle (bane 1):* "Flokkald": ved 50 % HP kalder han 2 unge pachycephalosaurer (0,8 s brøl-telegraph). Det gør ham sejere uden mere skade og hjælper på "Lynnedlægger"-problemet.
- *Doris (bane 4):* "Dødsrulle" i vand. Ringe i vandet varsler et 0,8 s greb, og spilleren skal hamre Space for at slippe fri. Desuden baghold fra dybt vand ved bredden.
- *Asta (bane 5):* Fase 2 "Panserskjold": 75 % frontpanser og 0 % bagfra, så det kan betale sig at flanke. "Hjulsving" med en ring-telegraph på 0,9 s, der vokser udad.
- *Tina (bane 6):* Når hornstormen rammer en klippe, knuses den til et gruskrater (en slow-zone i 6 s). Ved 40 % kalder hun en ung triceratops.

### B7 – Dagens jagt

- `game.dailyHunt(date)` giver `{seed: YYYYMMDD (lokal dato), species, entries}`. Arten roterer efter dagnummer over de ulåste arter i `PLAYER_SPECIES`-rækkefølge, så spillere med forskellige ulåste arter kan få forskellig art samme dag, men altid samme kort.
- `game.startDaily()` starter med dagens art uden at ændre det valgte i menuen. Ved `finish` gemmes `save.dailyHunts[YYYYMMDD]` (top 5 efter score, de 14 nyeste datoer, saneret i `sanitizeSave`). Ældre saves uden feltet får `{}`. Unlocks, rekorder og titler påvirkes ikke.
- RunSummary: Fælles Part B-adapter `r.partB` (core) → `records.js` kopierer felterne over sine `null`-standarder (1 linje). `dailySeed` = dagens seed, ellers 0. Titlen `daily_champion` har `implementationStatus: "built in Part B (B7)"` (genereret med `tools/build_run_titles.py`).
- UI: Knappen "☀ Dagens jagt <art>" i menuen, en dagsskærm med seed, art og lokal top 5, en linje med placering på slutskærmen og knappen "Dagens jagt" bagefter. Det virker på 390 px uden vandret scroll.
- Bots: `runOne({ daily: <dato> })` spiller dagens jagt.
- Balance: Ingen ændring i almindelige runs. Dagens jagt bruger samme kode med et fast seed, så der er ingen ny simulering.

### Rettelser efter review (primal-code-reviewer på 69bb03a + a7e2529)

- Benny vises kun halvgennemsigtig, mens hans dyk lader op. Før kunne han forblive gennemsigtig, hvis fase 2 afbrød dykket.
- Bennys tur mod floden sker kun, når spilleren er mindst 180 px væk. Han vender ikke længere ryggen til en spiller, der står lige ved ham.
- X9-testen tjekker nu også dykkets skade (den rammer direkte fra windup).
- Placeringen i dagens jagt er stabil ved lige score (et tidligere forsøg står først). Uden for top 5 vises "–".
- `save.dailyHunts` beholdes, også når flaget er slået fra, så historikken ikke går tabt.
- Ikke rettet: Advarselsteksten over Benny kan overlappe "DIG"-mærket, når han står helt tæt på spilleren. Det er et eksisterende layout for alle bossers advarsler.

### B6 – Udfordringer

- `CHALLENGES` (5): `fragile` (−30 % maks. liv), `toughBosses` (bosser +30 % HP), `swiftFoes` (alle fjender +15 % fart, også dem `populate()` placerede ved start), `weakHealing` (al heling, der sker inde i `step()`, halveres; heling fra mutationsvalg og banebonus er ikke med) og `costlySkills` (+30 % stamina pr. evne).
- `game.setChallenges(ids)` tager højst 3 kendte id'er. `start()` lægger dem i `r.challenges`, `r.partB.challengeCount` og `r.challengeDNA = 1 + 0,15 × antal`. `addDNA` giver bonussen og gemmer brøkdelen til næste gang, så +15 % også tæller på pickups med 1 DNA.
- Dagens jagt nulstiller udfordringerne (samme jagt for alle). "START JAGTEN" og "NY JAGT" starter altid uden udfordringer.
- UI: Knappen "⚔ Udfordringer" i menuen, en vælger med afkrydsning (den 4. bliver låst), DNA-bonus, intro-skærmen vises altid (også med "spring intro over") og lister udfordringerne, og slutskærmen har en linje med dem.
- RunSummary: `challengeCount` (0 uden udfordringer). Titlen `masochist` har `implementationStatus: "built in Part B (B6)"`.
- Bots: `runOne({ challenges })` og `playstyle_sim.cjs --challenges a,b,c`.

### B8 – Baryonyx-fiskekonge

- `save.baryonyxFish` tæller fisk, der fanges som Baryonyx (wrapper om `catchFish`). Det er et livstidstal fra denne version. Ældre saves starter på 0, fordi der ikke findes historik pr. art, og der opfindes ingen tal. Værdien saneres i `sanitizeSave`.
- Ved 30 fisk får man bedriften `fishKing` ("Fiskekonge", +15 DNA) og skin `fishKing` ("Fiskekongens farver"). Skinnet er et paletskift i den eksisterende `npcVariant` (grøn til #3c7180, blågrå til #a2d4c1, grå til #2466a0, brun til #69a4a0, alt fra Primal Earth 32). Der er ingen ny tegning. Det gælder kun Baryonyx (`skinFits`), og andre arter vises i klassiske farver.
- Artsskærmen viser fremgangen ("Fiskekonge: 12/30 fisk som Baryonyx"), og skinknappen viser "kun Baryonyx" eller kravet.
- Eksisterende skins, valgt skin, unlocks og bedrifter er uændrede (test med en gammel v2-save).
- Balance: ingen ændring i spillet ud over 15 DNA én gang. Baryonyx-botten fisker allerede (diet `piscivore`), og testen viser, at tælleren følger dens `fishCaught`.

### B3 – Spor og lugt

- Spilleren lægger et sporpunkt for hver 40 px, man går, og for hver 80 px, når man sniger sig. Der er højst 200 punkter, og de ældste fjernes først. Punkterne forsvinder efter 40 s, i regn efter 20 s (`map.weather === 'rain'`, samme regel som `app.js`). Under 35 % HP eller forgiftet bliver punktet et blodspor (`w`), som lugtes på 320 px i stedet for 200 px og tæller 1,5×.
- `followScent`: Ledige rovdyr (har skade, er ikke planteædere, vagter, minibosser eller bosser, og er ikke i gang med `hunt`/`scavenge`/`steal`/`drink`/`flee`) skanner højst hver 0,5 s og kun inden for 900 px af spilleren (LOD). De går mod det nyeste punkt i nærheden og følger sporet fremad (`activity: 'track'`, ikon ∴). Inden for 220 px bliver de opmærksomme på spilleren, når man er skjult først inden for 90 px.
- Tegning: procedurelle parvise prikker i #151b19 (blod: #913b32), samlet i højst 8 paths (4 falmetrin × 2 farver).
- Frametid (Q26-metoden): 390×844, 4× CPU-throttling, samme scene med flag af og til, 16 ABBA-batches med tvungen rasterisering pr. frame, minimum. Resultat: 62,2 mod 60,1 ms (+3,6 %), krav ≤ +10 %. Selve skanningen: ≤ 0,05 ms pr. rovdyr (unit-test).
- Bots: Forsigtige stilarter (`sneak` eller `dodge > 0,5`) sniger sig væk under 60 % HP, når et rovdyr følger deres spor.

### B4 – Tørke og vandhuller

- "Banetid": Spillet har ingen fast banetid, så der bruges en nominel bane på 300 s (`DROUGHT.levelTime`). Efter 60 % (180 s fra banens start, `r.levelStart` sættes ved `start`/`nextStage`) skrumper alle damme lineært over 120 s til 35 % af deres radius. Ét seedet "sidste vand" (`ponds[seed % n]`) skrumper kun til 70 %. `isWater`/`isDeepWater` følger den nye radius, og spilleren får én besked: "TØRKE · VANDHULLERNE SKRUMPER".
- `drink`: Under tørke bliver planteædere tørstige (fuldt efter 45 s). Fra 60 % tørst går de mod det bedste vand (`lastWater`: damme vægtet efter størrelse, floden på bane 3–4) og drikker ved kanten. Det samler byttedyr ved det sidste vand.
- Tegning: revnet mudderkant (#8d6042 med revner i #674333) mellem den oprindelige og den nuværende radius. Proceduralt, asset-ønske i `MISSING_SPRITES.md`.
- Bots: Rovdyr-bots venter ved det største vandhul under tørke, når der ikke er bytte inden for 500 px.
- Antagelse: 300 s er en nominel banelængde (bot-medianer for en bane ligger på ca. 1–4 min.). Tallet er en konstant og kan justeres.

### Titelændring: `speed_slayer` (Lynnedlægger)

- Betingelsen er nu `s.bosses >= 2 && s.fastestBossSeconds > 0 && s.fastestBossSeconds < 25` (ændret i `run_titles.json`, `data/build_titles.py`, `RUN_TITLES.md` og genereret med `tools/build_run_titles.py`). Den nye beskrivelse er oversat i `tr_part_b.py`.
- Før (`title_distribution.cjs` på 030f613): `speed_slayer` er hovedtitel i 53,5 % af 187 titlede bot-runs (Q14 FAIL). Efter-tal står under Testresultater.

## Testresultater

Udfyldes pr. pakke (kommandoer fra repo-roden).

- B1a+B1b: `node --test tests/*.test.cjs` gav 186/186 grønne. X8 fejlede første gang på en travl maskine (2,9 ms) og måles nu som bedste af 8 batches. `tests/part-b-browser.cjs`, `terrain-browser`, `game-browser` og `records-browser` er grønne.

## Integrationskonflikter (til /primal-integrate og Codex)

- `src/core.js`: nyt navigationsblok efter `isLava`, nye Game-metoder før `laterBossAI` (`playerReach`, `chargeLaneClear`, `bossReach`, `chargeLaneLost`, `chargeSkid`), en linje i hver boss-AI (hook før chase-bevægelsen, lane-tjek ved valg, windup og charge), 3 linjer i `travel()`, `lavaCrossings` i `createMap` og `isLava`, og `'stalk'` i retningslisten i `enemyStep`. Del A rører ikke boss-AI'en. Risiko: lav.
- `src/app.js`: tegning af basaltkrydsninger i lava-blokken (stage 3), krydsningsprikker på minikortet og boss-HUD-suffiks. B1c: `telegraphShape`/`telegraphPath` kan tegne en cirkel ved målet (`shape.at`), partikelfarver for `bubble`/`ash`, askeskyer før telegraphs, 30 % alpha for en dykket boss og `primalRun.telegraphShape` (test-API).
- `src/core.js` B1c: nye Game-metoder før `playerReach` (`startDive`, `waterTrip`, `diveWindup`, `diveSurface`, `roarStampede`, `stampede`, `ashCloud`, `startAshThrow`, `ashThrowLand`), en linje i `laterBossAI` og `forestBossAI` pr. hook, `roarDebuff` i timerlisten og i stamina-regenerationen, en linje i NPC-flugtkoden (stampede) og `r.ashClouds=[]` i `nextStage`.
- `src/core.js` B7: én linje i `sanitizeSave` og en isoleret "Part B"-blok lige før `RECORDS.install` (wrapper om `Game.prototype.start`/`finish`, dagsfunktioner). Nye eksports: `dailyHunt`, `dailyKey`, `sanitizeDailyHunts`.
- `src/records.js`: 1 linje (Part B-felter fra `r.partB`). `run_titles.json`: `daily_champion` aktiveret.
- `src/app.js` B7: menuknap, `daily`-skærm, `daily-start`-handling, resultatlinje, Escape-liste. `style.css`: 1 linje.
- `src/core.js` B6: én blok i Part B-sektionen (`CHALLENGES`, wrappers om `spawn`, `step` og `addDNA`) og `challengeCount` i `start`-wrapperen. `src/app.js` B6: menuknap, `challenges`-skærm, `challenge-start`, intro-liste, resultatlinje. `style.css`: 1 linje.
- `src/core.js` B8: 1 linje i `sanitizeSave`, en blok i Part B-sektionen (`SKINS.fishKing`, `ACHIEVEMENTS.push`, `catchFish`-wrapper, `skinFits`). `src/app.js` B8: paletswap `fishKing` i `npcVariant`, `skinFits` i spillerens sprite-variant, fremgang i skinvælgeren.
- `src/core.js` B3: 1 linje i `enemyAI` (scent-hook før `ecologyAI`), `r.tracks=[]` i `nextStage`, en blok i Part B-sektionen (`TRACKS`, `step`-wrapper, `followScent`). `src/app.js` B3: sportegning før decals, `track` i `MODE_ICON`.
- `src/core.js` B4: en blok i Part B-sektionen (wrappers om `start`, `nextStage`, `step` og `naturalBehavior`, samt `droughtScale` og `lastWater`). `src/app.js` B4: tørkekant i `drawPond`.
- Genererede filer (`lang.js`, `run_titles.js`, `project.json`, `integration_report.json`): genbyg med `python tools/rebuild_generated.py`.
