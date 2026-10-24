# Del B – revideret plan efter tests (10. oktober 2026)

Erstatter rækkefølgen og ansvarsfordelingen i `CODEX_TASKS_2026-10.md` §DEL B. Mekanikkernes indhold
er det samme; nyt er målte fund, acceptkriterier og hvem der gør hvad.

**Princip:** Claude bygger al ren kode for del B (AI, regler, UI, tests, simulering) på sin egen gren
`claude/part-b` (fra `claude/records-implementation`). Codex fokuserer på assets (del A + B-assets nedenfor)
og integrerer bagefter. Alt nyt bag `FEATURES.<navn>`-flag i `core.js`, så det kan slås fra.
Hvor der mangler en sprite, bruges eksisterende grafik/procedural tegning som pladsholder og
assetbehovet skrives i `MISSING_SPRITES.md` – ingen ny original grafik fra Claude.

## Målte fund, der ændrer B

| Fund | Kilde | Konsekvens for B |
|---|---|---|
| Ankylosaurus 90 px fra lavaen dræber Karl på 21,8 s og mister 26 % liv; samme afstand på åben grund = død | `tools/boss_exploit_probe.cjs`, `tests/boss-exploit.test.cjs` | B1 starter med **rækkevidde-adfærd** (05 §4), ikke kun signaturangreb |
| Triceratops 90 px fra lavaen: Karl dør, spilleren mister 0 % | samme | Gælder alle arter med lang rækkevidde, ikke kun halesving |
| Karl går aldrig i lava (X7 OK); charges stopper ved kanten og giver 1,2–1,5 s gratis recover | 05 §2 + probe | Skid-stop med 0,45 s recover ved blokeret charge (05 §4.2) |
| Carl over dybt vand (bane 2) når spilleren (spilleren mister 98,7 %) | probe | Intet akut exploit på bane 2; behold X11-test |
| Rivaler manglede på bane 3/4 på 7,4 % af kortene | rettet i 89cb630 | Ingen B-handling; regressionstest findes |
| Titlen "Lynnedlægger" bliver hovedtitel i 60 % af bot-runs (Palle dør < 25 s) | `tools/title_distribution.cjs` | B1-Palle må gerne blive lidt sejere **eller** titlen kræver ≥ 2 bosser – Jonas vælger |
| Bots: Palle står for 12 % af dødsfald, "palle_pushover" | samme | Mål B1 mod "ingen boss > 35 % af dødsfald" |

## Rækkefølge og ansvar

| # | Pakke | Kode (Claude) | Assets (Codex/ChatGPT) | Accept (skal bestå) |
|---|---|---|---|---|
| B1a | **Boss-rækkevidde** | nav-grid 32 px pr. bane, BFS flow field (≤ 2/s/boss), tilstande `chase/reposition/stalk/leash`, charge-raycast + skid-stop 0,45 s | ingen | `tests/boss-exploit.test.cjs` X1 (fjern `todo`), X3–X7, X10, X12 fra 05 §5 |
| B1b | Lavakrydsninger bane 7 | to basaltkrydsninger ≥ 900 px fra hinanden (port fra `codex/preserved-feathered-starter`, genbrug – ikke genopfind) | basalt-krydsningstile (A6 lava/aske-kanter) | X2: kamp via krydsning ±10 % af åben grund |
| B1c | Signaturmekanikker | Benny dyk (1,2 s windup, bobler), Ragnar brøl (småvildt flygter mod spilleren, stamina-debuff), Carl/Karl dobbelt-charge, Karl askesky + valgfrit ASKEKAST (05 §4.3), forslag til Palle/Doris/Asta/Tina; alt med `telegraphShape` ≥ 0,45 s | boble-/askesky-FX kan være procedural; evt. sprite-effekter senere | X9 telegraph-audit; optimizer-bot taber ≥ 1/10 til hver boss; Carl ikke sværere (±5 %) |
| B7 | Dagens jagt | seed = YYYYMMDD, art roterer over ulåste, lokal liste pr. dato, `dailySeed` i RunSummary | ingen | unit + browser; titlen `daily_champion` aktiveres |
| B6 | Udfordringer | op til 3 modifikatorer, +X % DNA, intro-skærm, `challengeCount` i RunSummary | ingen | unit + browser; titlen `masochist` aktiveres |
| B8 | Baryonyx-fiskekonge | bedrift (30 fisk med Baryonyx) → skin via eksisterende palet-skift (`SKINS`), tydelig lås-op-tekst | evt. skin-palet (ingen ny tegning) | unit; gamle unlocks bevares |
| B3 | Spor og lugt | ≤ 200 sporpunkter, falmer 40 s, regn hurtigere, rovdyr følger spor (også såret spiller), LOD | procedural prikker (ingen sprite) | perf ≤ +10 % frametid mobil (Q26-metoden) |
| B4 | Tørke/vandhuller | damme skrumper efter 60 % af banetid, `drink`-adfærd søger sidste vand | tørret mudder-kant (tile) | unit: dam-radius, AI søger vand |
| B2 | Dag/nat | cyklus, synsvidde, compys aggressive, planteædere sover i flok, `nightKills` | nat-palet-skift (A6), sol/måne HUD-ikon | unit + browser; titlen `night_stalker` aktiveres |
| B5 | Raptor-flok | fodring → allieret (maks 2), angriber spillerens mål, flygter lavt liv, tæller ikke som kills, `alliesRecruited` | lille markering over allieret (kan være procedural) | unit + browser; titlen `pack_leader` aktiveres |
| B9 | Idébank | flyt byggede punkter til "bygget" | – | – |

Hver pakke: `tools/playstyle_sim.cjs` skal forstå mekanikken (fx `exploiter`-stil for B1), og
`npm run simulate:quick` før/efter gemmes i `balance_runs/<dato>-<pakke>.json`.

## Records-afhængigheder (allerede bygget på `claude/records-implementation`)

- RunSummary-felterne `nightKills`, `alliesRecruited`, `challengeCount`, `dailySeed` er `null` i dag →
  titlerne er skjult. Når en B-pakke er bygget: sæt feltet i `buildRunSummary` (records.js) og ret
  `implementationStatus` i `docs/design/records-world-extinction/data/run_titles.json` + kør
  `python tools/build_run_titles.py`.
- `bossAttempts` tæller ved engagement (≤ 420 px eller skadet). Hvis B1 indfører `stalk`, skal stalk også tælle som engagement.

## Til Codex, når arbejdet genoptages

1. Del A fortsætter uændret (A1–A6). Lever B-assets fra tabellen ovenfor som del af A6.
2. Integration af Claude-grene sker først på Jonas' ord. Konfliktflader: `core.js` (records-adapter
   ~12 linjer + B-kode i egne blokke), `app.js` (resultat-/rekordskærme, B-UI), genererede filer
   (`project.json`, `integration_report.json`, `lang.js`) – genbyg dem i stedet for at merge dem.
3. Rediger ikke `src/records.js` / `src/run_titles.js` direkte; titler ændres i JSON + generator.
4. Kendte, ikke-løste: X1 (lava-exploit) indtil B1a er merget; "Lynnedlægger" for hyppig (designvalg);
   rav/hemmelige baner (S6) og meteor-slutning (S7) er ikke påbegyndt.
