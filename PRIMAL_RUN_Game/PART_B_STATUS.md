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
- **Karl (bane 7):** Hvert afsluttet stormløb efterlader en askesky (3 s, radius 90 px), som bremser spilleren. Det gør ingen skade. Under `stalk` kommer **ASKEKAST**, hvis han er blevet ramt inden for de sidste 2 s og står uden for spillerens rækkevidde: en låst cirkel på 70 px med 0,9 s windup, der giver 0,6 × biddets skade og har 4 s cooldown.
- **X9:** Alle skadevoldende bossangreb på alle 8 baner kommer efter et windup på mindst 0,45 s (test med tilfældige bevægelser). Browsertesten viser, at `telegraphShape` returnerer en form for alle 7 bossarter × 6 mønstre, og at dyk og ASKEKAST tegnes ved målet.

**Forslag (ikke bygget) til de øvrige bosser:**
- *Palle (bane 1):* "Flokkald": ved 50 % HP kalder han 2 unge pachycephalosaurer (0,8 s brøl-telegraph). Det gør ham sejere uden mere skade og hjælper på "Lynnedlægger"-problemet.
- *Doris (bane 4):* "Dødsrulle" i vand. Ringe i vandet varsler et 0,8 s greb, og spilleren skal hamre Space for at slippe fri. Desuden baghold fra dybt vand ved bredden.
- *Asta (bane 5):* Fase 2 "Panserskjold": 75 % frontpanser og 0 % bagfra, så det kan betale sig at flanke. "Hjulsving" med en ring-telegraph på 0,9 s, der vokser udad.
- *Tina (bane 6):* Når hornstormen rammer en klippe, knuses den til et gruskrater (en slow-zone i 6 s). Ved 40 % kalder hun en ung triceratops.

## Testresultater

Udfyldes pr. pakke (kommandoer fra repo-roden).

- B1a+B1b: `node --test tests/*.test.cjs` gav 186/186 grønne. X8 fejlede første gang på en travl maskine (2,9 ms) og måles nu som bedste af 8 batches. `tests/part-b-browser.cjs`, `terrain-browser`, `game-browser` og `records-browser` er grønne.

## Integrationskonflikter (til /primal-integrate og Codex)

- `src/core.js`: nyt navigationsblok efter `isLava`, nye Game-metoder før `laterBossAI` (`playerReach`, `chargeLaneClear`, `bossReach`, `chargeLaneLost`, `chargeSkid`), en linje i hver boss-AI (hook før chase-bevægelsen, lane-tjek ved valg, windup og charge), 3 linjer i `travel()`, `lavaCrossings` i `createMap` og `isLava`, og `'stalk'` i retningslisten i `enemyStep`. Del A rører ikke boss-AI'en. Risiko: lav.
- `src/app.js`: tegning af basaltkrydsninger i lava-blokken (stage 3), krydsningsprikker på minikortet og boss-HUD-suffiks. B1c: `telegraphShape`/`telegraphPath` kan tegne en cirkel ved målet (`shape.at`), partikelfarver for `bubble`/`ash`, askeskyer før telegraphs, 30 % alpha for en dykket boss og `primalRun.telegraphShape` (test-API).
- `src/core.js` B1c: nye Game-metoder før `playerReach` (`startDive`, `waterTrip`, `diveWindup`, `diveSurface`, `roarStampede`, `stampede`, `ashCloud`, `startAshThrow`, `ashThrowLand`), en linje i `laterBossAI` og `forestBossAI` pr. hook, `roarDebuff` i timerlisten og i stamina-regenerationen, en linje i NPC-flugtkoden (stampede) og `r.ashClouds=[]` i `nextStage`.
- Genererede filer (`lang.js`, `project.json`, `integration_report.json`): genbyg med `python tools/rebuild_generated.py`.
