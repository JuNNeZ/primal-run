# Deinosuchus — før/efter

Baseline: 180 runs, 10 arter × 6 spillestile × 3 seeds (1000–1002), 600s.
Efter: 198 runs, 11 arter med samme seeds, varighed og DNA-upgrades (ingen).
Ingen simulatorfejl. Alle 60 eksisterende art/stil-grupper har identiske kompakte tal
ved før/efter; Deinosuchus-NPC/boss-AI er bevidst bevaret i denne pakke.

Deinosuchus (3 runs pr. stil):

| Stil | Døde | Median bane | Første mutation | Første boss | Første bossdrab | Median føde | DNA | Angreb | Stamina-mangel i kamp |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| average | 3 | 4 | 10.28 | 50.58 | 66.43 | 105 | 170 | 145 | 50 |
| brawler | 2 | 4 | 11.28 | 63.64 | 76.8 | 104 | 85 | 232 | 92.7 |
| casual | 2 | 4 | 30.74 | 44.93 | 61.74 | 107 | 154 | 136 | 59.3 |
| explorer | 2 | 3 | 10.21 | 72.28 | 86.71 | 47 | 129 | 82 | 51.8 |
| newbie | 3 | 3 | 28.85 | 79.23 | 92.05 | 77 | 80 | 124 | 0 |
| optimizer | 2 | 2 | 11.21 | 52.49 | 67.69 | 42 | 34 | 76 | 19.4 |

Ingen Deinosuchus-run nåede sidste bane i denne korte prøve. 3 seeds pr. stil er
for lidt til en sikker pris-/skadevurdering. Optimereren nåede median bane2, mens
average/casual nåede bane4: bot-navigation og evnepolitik er også måleobjekter;
"optimizer" er ikke et bevis for perfekt spil. Behold derfor prøve-balancen, indtil
længere runs med flere seeds og menneskelige tests er gennemført.

Stamina er en reel begrænsning (casual59,3 %, slagsbror92,7 % af kamptiden under
evneprisen). En generel stamina-nerf anbefales ikke ud fra disse målinger.

`killedBy` i dette checkpoint angiver arten, ikke entydigt bossens navn eller
om den var en almindelig fjende. Boss-andelen på35 % kan ikke valideres med
denne version af rapporten; B1 kræver eksplicit boss-identifikation.
DNA-tempoets auto-advarsel "alle arter" betyder kun DNA-køb (450DNA); arter
låst af bedrifter kræver også deres bedrifter.

Rådata: playstyle_2026-10-10-06-03/ og deinosuchus_after/. Core-SHA findes i
summary_compact.meta og adskiller de to code checkpoints.
