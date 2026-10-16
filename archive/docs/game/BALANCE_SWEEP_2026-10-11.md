# PRIMAL RUN: balance-anbefalinger (11. oktober 2026)

Kørt på `integration/next` (med PR #5 og #6) i ca. 2.800 simulerede runs. Hvert run er 900 sekunder spil med botspillere i stilene optimerer, gennemsnitlig, casual, slagsbror og ny spiller (og udforsker/terræn-udnytter for Ankylosaurus og Gallimimus). Simulatoren er deterministisk: samme seed giver nøjagtig det samme run, så forskellene skyldes ændringen og ikke tilfældigheder i kørslen.

> Bots er ikke mennesker. Tallene er bedst til at sammenligne arter og ændringer med hinanden, ikke som præcise sværhedsgrader.

**Mål for styrke:** "Bane" er den gennemsnitlige bane (1-8), som runs når. Hele feltet ligger i baseline på **2,51**.

## Det skal du tage stilling til

1. **Ankylosaurus' halesving: 270° + rækkevidde 90** (anbefalet), eller ren 285-300° uden ændring af rækkevidde.
2. **Carl (boss på bane 2): skade × 0,75.**
3. **Gallimimus: liv 70 → 100, skade 4 → 7.**
4. **NPC-ankylosaurer får også 270°-bue** (realisme; ingen målbar effekt på sværhedsgrad).

Alle fire er slået til i draft-PR'en, så du kan prøve dem i spillet.

## 1. Ankylosaurus: hvor stor skal svingbuen være?

Med 270° kan halen ikke ramme den kegle på 90°, der ligger foran hovedet. Botterne lærer at vende ryggen til, før de slår: optimereren gør det altid, den gennemsnitlige spiller i 70 % af tilfældene og den nye spiller i 10 %.

20 seeds × 5 stile (100 runs pr. linje):

| Bue | Bane (gns.) | DNA (gns.) | Træfprocent | Skade givet |
|---|---:|---:|---:|---:|
| 360° (i dag) | **3,34** | 79 | 74 % | 2.088 |
| 315° (10 seeds) | 3,02 | 75 | 58 % | 1.847 |
| 300° | 2,90 | 65 | 54 % | 1.713 |
| 285° | 2,95 | 67 | 50 % | 1.735 |
| **270° + rækkevidde 90** | **2,85** | 65 | 49 % | 1.613 |
| 270° + skade 13 | 2,77 | 60 | 48 % | 1.528 |
| 270° + skade 14 (10 seeds) | 3,18 | 78 | 48 % | 2.044 |
| 270° | 2,74 | 60 | 48 % | 1.481 |
| 225° (10 seeds) | 2,48 | 52 | 47 % | 1.264 |
| 180° (10 seeds) | 2,42 | 52 | 43 % | 1.180 |

Til sammenligning ligger de andre tunge arter i baseline på: Triceratops 2,68, Carnotaurus 2,84, Tyrannosaurus 2,92 og Deinosuchus 2,96. Det giver et snit på **ca. 2,85**.

**Konklusion:** Med 360° er Ankylosaurus klart den stærkeste art i spillet. Den giver ca. 35 % mere skade og får ca. 30 % mere DNA end den næstbedste art. Den mest balancerede løsning, der beholder din 270°-idé, er **270° + rækkevidde 80 → 90**. Den lander på 2,85, præcis midt blandt de tunge arter, og det passer til, at den er den dyreste art (170 DNA). Ren 270° gør den lidt for svag (2,74). +2 skade (14) overkompenserer.

Under 270° falder den hurtigt. 225° og 180° gør den svagere end gennemsnittet for hele feltet.

Billede af den nye bue i spillet: `balance/ankylosaurus_270_bue.png` i projektmappen

**NPC-ankylosaurer med 270°.** Fjendens halesving rammer ikke en spiller, der står foran hovedet. Telegrafen tegnes som en 270°-kile i stedet for en cirkel. Målt fra bane 5 med 10 arter × 3 stile × 4 seeds var den gennemsnitlige bane 5,18 med 360° og 5,16 med 270°. Der er altså ingen målbar ændring, så den er ren realisme og mulighed for skill-spil.

## 2. Hvad dræber spilleren? Carl er muren

Fordeling af dødsfald i baseline (300 runs):

| Hvor | Dødsfald |
|---|---:|
| Bane 2, **Carl-bossen** (stormløb 55, tramp 21, bid 11) | **87** |
| Bane 1, Palle-bossen | 42 |
| Almindelige carnotaurer, bane 1-4 (stormløb) | 69 |
| Bane 3, Benny (Baryonyx-boss) | 21 |
| Bane 4, Doris (Deinosuchus-boss) | 18 |

Kun 117 af 300 runs kom forbi bane 2.

| Eksperiment | Forbi bane 2 | Døde på bane 2 | Bane (gns.) |
|---|---:|---:|---:|
| Baseline | 117 | 110 | 2,51 |
| Carl-skade × 0,8 | 141 | 86 | 2,59 |
| **Carl-skade × 0,7** | **156** | **71** | **2,67** |
| Palle-skade × 0,8 | 119 | – | 2,51 |
| Carnotaurus-NPC skade 13 → 10 | 122 | – | 2,56 |

**Anbefaling:** Giv Carl skade × 0,75 (mellem de to testede). Palle- og carnotaurus-nerfs gør næsten ingen forskel, så dem lader jeg være. Hvis Carl stadig føles hård i rigtigt spil, er det næste at prøve et længere varsel før hans stormløb frem for mindre skade.

## 3. Gallimimus er for svag

| Variant | Bane (gns.) | DNA (gns.) | Dødsrate |
|---|---:|---:|---:|
| Liv 70, skade 4 (i dag) | 1,44 | 27 | 100 % |
| Liv 90, skade 6 | 2,13 | 42 | 94 % |
| **Liv 100, skade 7** | **2,60** | **56** | 91 % |

(10 seeds × 7 stile, 70 runs pr. linje.) I dag dør Gallimimus typisk allerede på bane 1, og det er den eneste art, der ligger langt under resten. Liv 100 og skade 7 bringer den op på feltets niveau (2,51), mens den stadig er den art med lavest skade.

## 4. Samlet pakke (alle anbefalinger slået til)

300 runs, de samme seeds som baseline:

| | Baseline | Pakke |
|---|---:|---:|
| Bane (gns.) | 2,51 | **2,74** |
| Forbi bane 2 | 117 | **156** |
| Døde på bane 2 | 110 | 85 |
| DNA (gns.) | 52 | 58 |

Pr. art (gns. bane, baseline → pakke): Compy 2,08 → 2,16 · Utahraptor 2,56 → 2,68 · Carnotaurus 2,84 → 3,12 · **Ankylosaurus 3,12 → 3,08** · Triceratops 2,68 → 2,68 · Pachycephalosaurus 2,00 → 2,32 · **Gallimimus 1,32 → 2,64** · Baryonyx 2,92 → 3,00 · Tyrannosaurus 2,92 → 3,20 · Deinonychus 2,32 → 2,56 · Velociraptor 2,40 → 2,24 · Deinosuchus 2,96 → 3,20.

I pakken er Ankylosaurus ikke længere i top. Den ligger midt blandt de tunge arter, fordi de andre får mere ud af Carl-nerfen, end den selv gør. Velociraptor falder lidt (5 seeds pr. art, så det er inden for støjen). De svageste arter bagefter er Compy, Pachycephalosaurus og Velociraptor (2,2-2,3), og de er et godt næste mål.

## Andre fund

- **Natural ecology (PR #6) ændrer ikke sværhedsgraden:** gns. bane er 2,51 med og 2,44 uden.
- **Næsten alle bot-runs dør (96 %),** og medianen for et run er ca. 3½ minut. Ingen bot gennemførte alle 8 baner. Botterne er dårligere end mennesker, men et menneske møder de samme mure.
- **Næste forslag at teste:** længere varsel før Carls stormløb, en lille buff til Compy og Pachycephalosaurus, og Velociraptor med flere seeds.

## Mangler før merge

- Beskrivelsen af Ankylosaurus siger stadig "haleslag hele vejen rundt om dig". Den skal omskrives og oversættes til de 24 sprog, når du har valgt vinkel.

## Data

Rådata pr. eksperiment (REPORT.md + summary_compact.json) ligger i `balance/data` i projektmappen. Simulatoren har fået to nye flag: `--set '<json>'` til at justere tal uden at ændre koden og `--level N` til at starte på en bestemt bane.
## Opfølgning: 1v1-bossdueller og DNA-lab-upgrades

### Bossdueller (1v1)

Hver art mødte hver boss alene, med det antal mutationer man typisk har ved banens start: 0, 2, 4, 5, 7, 9, 11 og 13 (målt i almindelige runs). 12 arter × 3 stile (optimerer, gennemsnitlig, casual) × 8 seeds giver 288 dueller pr. boss. Sejr i %:

| Boss | Uden upgrades | Max upgrades | Optimerer | Gennemsnitlig | Casual |
|---|---:|---:|---:|---:|---:|
| 1 Palle | **93** | 97 | 100 | 93 | 85 |
| 2 Carl | 66 | 71 | 93 | 65 | 42 |
| 3 Benny | 77 | 88 | 97 | 75 | 58 |
| 4 Doris | 49 | 58 | 95 | 36 | 17 |
| 5 Asta | 58 | 67 | 91 | 57 | 25 |
| 6 **Tina** | **22** | 26 | 57 | **8** | **1** |
| 7 Karl | 48 | 57 | 70 | 45 | 28 |
| 8 Ragnar | 59 | 67 | 79 | 54 | 43 |

(Stil-kolonnerne er uden upgrades.)

- **I 1v1 er Carl ikke den sværeste.** Tina (bane 6) er klart sværest, og Doris og Karl er sværere end Carl. Carl er dødelig i hele runs, fordi man møder ham tidligt med kun 2 mutationer, ofte efter at have mistet liv til almindelige carnotaurer på vejen.
- **Kurven er ujævn:** Benny (bane 3) er nemmere end Carl, og slutbossen Ragnar er nemmere end Tina og Karl.
- **Palle er meget nem 1v1** (93 %). Han dræber kun, når man møder ham med lidt liv.

### DNA-lab-upgrades betyder lidt

Max upgrades (alle 5 på rang 5) giver kun +10 % liv og +10 % skade. Effekten er derfor lille:

| | Uden upgrades | Max upgrades |
|---|---:|---:|
| Bane (gns.), hele runs | 2,51 | 2,85 |
| Forbi bane 2 | 117/300 | 151/300 |
| Bossduel-sejre | 59 % | 66 % |

**Svar på dit spørgsmål:** Lige nu kan man ikke forvente, at et par runs med upgrades flytter én forbi en boss. Upgrades giver kun ca. +7 procentpoint i dueller. Hvis tanken er "man skal grinde lidt for at komme videre", skal upgrades være stærkere (fx +4-5 % pr. rang i stedet for +2 %), frem for at bosserne gøres nemmere. Palle og Benny kan så godt gøres lidt sværere.

### Ankylosaurus med max upgrades

| Bue | Bane (gns.) |
|---|---:|
| 360° | 3,92 |
| 300° | 3,58 |
| 270° + rækkevidde 90 | 3,66 |
| 270° (rækkevidde 80) | 3,40 |

De tunge arter ligger med max upgrades på: Triceratops 3,20, Deinosuchus 3,08, Tyrannosaurus 3,64 og Carnotaurus 2,56. Med upgrades ligger 270° + 90 på niveau med T-rex (top). Ren 270° ligger mellem T-rex og Triceratops.
