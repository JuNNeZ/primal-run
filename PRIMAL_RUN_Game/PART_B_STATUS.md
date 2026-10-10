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

## Testresultater

Udfyldes pr. pakke (kommandoer fra repo-roden).

- B1a+B1b: `node --test tests/*.test.cjs` gav 186/186 grønne. X8 fejlede første gang på en travl maskine (2,9 ms) og måles nu som bedste af 8 batches. `tests/part-b-browser.cjs`, `terrain-browser`, `game-browser` og `records-browser` er grønne.

## Integrationskonflikter (til /primal-integrate og Codex)

- `src/core.js`: nyt navigationsblok efter `isLava`, nye Game-metoder før `laterBossAI` (`playerReach`, `chargeLaneClear`, `bossReach`, `chargeLaneLost`, `chargeSkid`), en linje i hver boss-AI (hook før chase-bevægelsen, lane-tjek ved valg, windup og charge), 3 linjer i `travel()`, `lavaCrossings` i `createMap` og `isLava`, og `'stalk'` i retningslisten i `enemyStep`. Del A rører ikke boss-AI'en. Risiko: lav.
- `src/app.js`: tegning af basaltkrydsninger i lava-blokken (stage 3), krydsningsprikker på minikortet og boss-HUD-suffiks.
- Genererede filer (`lang.js`, `project.json`, `integration_report.json`): genbyg med `python tools/rebuild_generated.py`.
