# PRIMAL RUN – spillestil-simulering

Kørt: 2026-10-10T07:26:32.760Z · core.js SHA 149132549ab9 · 12 runs · 180s sim-budget pr. run · 4 CPU-tråde · 13s

> Bots er ikke mennesker. Brug tallene til at sammenligne arter/spillestile med hinanden – ikke som præcise sværhedsgrader.

## Automatiske advarsler

- deinonychus/optimizer: første mutation allerede efter 12.58s.
- deinonychus/casual: første mutation allerede efter 12.96s.
- deinonychus/explorer: første mutation allerede efter 11.04s.
- deinonychus/average: første mutation allerede efter 13.79s.
- deinonychus/brawler: første mutation allerede efter 12.12s.
- deinonychus/newbie: første mutation allerede efter 11.57s.
- Unlock-tempo (optimizer): ~91.5 DNA pr. run → alle arter (450 DNA) efter ~5 runs (uden upgrades).
- Unlock-tempo (casual): ~36 DNA pr. run → alle arter (450 DNA) efter ~13 runs (uden upgrades).
- Unlock-tempo (explorer): ~38.5 DNA pr. run → alle arter (450 DNA) efter ~12 runs (uden upgrades).
- Unlock-tempo (average): ~86.5 DNA pr. run → alle arter (450 DNA) efter ~6 runs (uden upgrades).
- Unlock-tempo (brawler): ~38 DNA pr. run → alle arter (450 DNA) efter ~12 runs (uden upgrades).
- Unlock-tempo (newbie): ~20 DNA pr. run → alle arter (450 DNA) efter ~23 runs (uden upgrades).

## Resultater (median, [p25–p75])

| Art | Stil | Runs | Sejre | Død | Bane nået | 1. mutation (s) | 1. boss (s) | 1. boss død (s) | Bosskamp (s) | Sidste bane (s) | Kød | DNA | Angreb | Evner/min | Stamina-mangel % kamp | Stagger/min | Skade taget | Dræbt af |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| deinonychus | average | 2 | 0 | 0 | 3 [3–3] | 13.79 [13.26–14.32] | 31.28 [31.17–31.39] | 49.1 [46.96–51.24] | 30.04 [27.95–32.14] | – (0/2) | 56.5 [54.75–58.25] | 86.5 [78.75–94.25] | 115 [109–121] | 11.84 [11.67–12.02] | 31.45 [28.23–34.67] | 0.51 [0.43–0.59] | 152 [144–160] |  |
| deinonychus | brawler | 2 | 0 | 2 | 2 [2–2] | 12.12 [11.99–12.24] | 36.64 [33.3–39.97] | 52.51 [49.52–55.49] | 15.87 [15.52–16.22] | – (0/2) | 42 [42–42] | 38 [35–41] | 76.5 [74.25–78.75] | 13.51 [13.05–13.97] | 80.4 [80.15–80.65] | 0.25 [0.13–0.38] | 152.5 [148.75–156.25] | carnotaurus:2 |
| deinonychus | casual | 2 | 0 | 2 | 2 [2–2] | 12.96 [11.41–14.51] | 47.3 [42.44–52.15] | 65.41 [62.65–68.17] | 18.11 [16.02–20.2] | – (0/2) | 42 [42–42] | 36 [36–36] | 98.5 [97.75–99.25] | 10.93 [10.46–11.41] | 17.1 [16.65–17.55] | 0.22 [0.11–0.33] | 170 [165–175] | carnotaurus:2 |
| deinonychus | explorer | 2 | 0 | 2 | 2 [2–2] | 11.04 [9.8–12.29] | 30.57 [29.73–31.41] | 50.18 [49.58–50.79] | 19.61 [18.16–21.05] | – (0/2) | 42 [42–42] | 38.5 [32.25–44.75] | 108.5 [101.25–115.75] | 12.49 [11.67–13.3] | 26.1 [25.1–27.1] | 0 [0–0] | 194.5 [185.25–203.75] | carnotaurus:2 |
| deinonychus | newbie | 2 | 0 | 1 | 1.5 [1.25–1.75] | 11.57 [10.14–13] | 103.13 [73.52–132.74] | 175.81 [175.81–175.81] (1/2) | 13.45 [13.45–13.45] (1/2) | – (0/2) | 19.5 [19.25–19.75] | 20 [17–23] | 43 [39–47] | 0 [0–0] | 0 [0–0] | 0 [0–0] | 115 [107.5–122.5] | pachycephalosaurus:1 |
| deinonychus | optimizer | 2 | 0 | 0 | 3 [3–3] | 12.58 [12.4–12.76] | 33.79 [32.15–35.43] | 51.29 [47.51–55.07] | 23.31 [21.8–24.82] | – (0/2) | 56.5 [55.25–57.75] | 91.5 [87.75–95.25] | 122.5 [119.25–125.75] | 12.7 [12.61–12.79] | 36.95 [30.88–43.03] | 0.85 [0.77–0.94] | 21.5 [21.25–21.75] |  |

(n/m) betyder at kun n af m runs nåede dertil.

Spillestile:

- **optimizer** – Optimerer (min-maxer): reaktion 0.05s, undvigelse 95 %, evnebrug "smart", mutationsvalg "best".
- **average** – Gennemsnitlig spiller: reaktion 0.18s, undvigelse 65 %, evnebrug "smart", mutationsvalg "mixed", udforsker.
- **casual** – Afslappet/casual: reaktion 0.3s, undvigelse 35 %, evnebrug "sometimes", mutationsvalg "random", udforsker.
- **brawler** – Slagsbror (angriber alt): reaktion 0.12s, undvigelse 15 %, evnebrug "spam", mutationsvalg "offence".
- **explorer** – Udforsker/samler: reaktion 0.2s, undvigelse 60 %, evnebrug "smart", mutationsvalg "defence", udforsker.
- **newbie** – Ny spiller: reaktion 0.45s, undvigelse 15 %, evnebrug "never", mutationsvalg "random".
