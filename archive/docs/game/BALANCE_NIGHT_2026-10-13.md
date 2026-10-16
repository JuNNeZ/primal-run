# PRIMAL RUN: nye powerups, mekanikker og evner (nat til 13. oktober 2026)

I nat byggede jeg 20 nye idéer som prototyper i simulatoren og kørte ca. 4.300 hele runs mod PR #7's nuværende spil. Selve spillet er ikke ændret: prototyperne ligger i `tools/experiments.cjs` (draft PR #9) og slås kun til i simulatoren.

**Sådan er der målt.** 12 arter × 8 bot-profiler (optimerer, gennemsnitlig, casual, slagsbror, ny spiller, hit-and-run, forsigtig, speedrunner) × 2 seeds = 192 runs à 900 sek. pr. eksperiment. Hvert run sammenlignes med præcis samme art, profil og seed i baseline, så støjen er ca. **±0,15 bane samlet** og ca. ±0,5 bane pr. art. Baseline (PR #7 med Part C slået til) når i snit **bane 3,39**; 58 % når bane 3, 20 % bane 5.

> Bots er ikke mennesker. Tallene siger, hvor meget en idé flytter sværhedsgraden, ikke om den er sjov. Det skal du mærke selv.

## Det skal du tage stilling til

1. **Jagtrus** (drab i hurtig rækkefølge giver skade og fart): mit bedste bud på en ny mekanik. Belønner aggressivt spil og hjælper også casual. Byg den med lidt lavere tal.
2. **Nye evne-twists**: byg dem for de arter, hvor de virkede (Parasaurolophus, Utahraptor, Ankylosaurus, Gallimimus, Pachy, Allosaurus), og drop dem, hvor de ikke gjorde.
3. **Powerups på kortet**: sjove, men de midlertidige buffs gør næsten ingen forskel alene. Det er **Hjertefrugt** (+12 maks. liv permanent), der bærer effekten. Vil du have powerups for variationens skyld, så byg den lette udgave og gør Hjertefrugt sjælden.
4. **Spinosaurus er for stærk** (bane 6,19 mod 3,95 for de nye arter) og **Parasaurolophus for svag** (2,19). Det er uafhængigt af de nye idéer.
5. **Alle tre gode idéer på én gang er for meget** (+1,31 bane). Vælger du flere, skal tallene ned, eller bosskurven op.

## Rangering

| # | Idé | Bane (gns.) | Ændring | Når bane 3 | Når bane 5 | Bedømmelse |
|---:|---|---:|---:|---:|---:|---|
| – | Baseline | 3,39 | – | 58 % | 20 % | |
| 1 | **Jagtrus** | 3,99 | **+0,61** | 67 % | 29 % | Anbefales (lavere tal) |
| 2 | **Nye evne-twists** (12 arter) | 3,83 | **+0,44** | 69 % | 31 % | Anbefales for udvalgte arter |
| 3 | **Powerups, let** (1 helligdom + 2 % drop) | 3,86 | **+0,47** | 65 % | 31 % | Anbefales for variation |
| 4 | **Urraseri-måler** | 3,80 | +0,42 | 64 % | 29 % | God, men hjælper mest dem, der spammer evner |
| 5 | **Dusørjagt** | 3,60 | +0,22 | 62 % | 25 % | God til DNA (+27 %) uden at gøre spillet lettere |
| 6 | Økologi-pres (blodspor, flokforsvar, ådselgæster, natjægere) | 3,55 | +0,16 | 61 % | 26 % | Neutral; kan bygges for stemningen |
| 7 | Kontra efter undvigelse | 3,45 | +0,07 | 57 % | 23 % | Kan ikke måles med bots |
| 8 | Elite-egenskaber | 3,27 | −0,11 | 59 % | 19 % | Neutral; giver variation |
| 9 | Baby-start, blid (80 % liv, 85 % skade) | 3,69 | +0,31 | 53 % | 30 % | Interessant (se nedenfor) |
| 10 | Baby-start, hård (60 % liv, 70 % skade) | 2,43 | **−0,95** | 30 % | 11 % | Kun som svær tilstand |
| – | Powerups, fuld (3 helligdomme + 5 % drop) | 4,15 | +0,77 | 68 % | 36 % | For mange (16 pr. run) |
| – | Pakke: jagtrus + evne-twists + lette powerups | 4,69 | **+1,31** | 80 % | 42 % | For meget samlet |

### Pr. bot-profil (ændring i bane)

| Idé | Optimerer | Gns. | Casual | Ny | Slagsbror | Hit-and-run | Forsigtig | Speedrunner |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Jagtrus | +1,21 | +0,38 | +0,42 | 0 | −0,17 | +1,00 | +0,29 | +1,75 |
| Evne-twists | +0,75 | +0,38 | +0,29 | 0 | −0,46 | +0,96 | +0,67 | +0,96 |
| Powerups, let | +1,29 | −0,25 | +0,42 | −0,25 | +0,38 | +1,42 | +0,33 | +0,46 |
| Urraseri | +0,33 | +0,38 | +0,13 | 0 | +0,17 | +0,42 | +0,17 | +1,75 |
| Dusørjagt | +0,79 | −0,21 | +0,17 | −0,08 | +0,38 | +0,29 | +0,21 | +0,21 |
| Økologi-pres | +1,21 | +0,13 | +0,13 | −0,42 | −0,63 | +0,50 | +0,17 | +0,21 |
| Baby-start, hård | −0,42 | −1,08 | −0,29 | −1,25 | −2,33 | −0,83 | −0,29 | −1,13 |

Pr. profil er støjen ca. ±0,3-0,6. Ny spiller bruger aldrig evner og samler ikke powerups langt væk, derfor står den ofte på 0.

## 1. Jagtrus (ny mekanik)

Et drab inden for 5 sek. efter det forrige giver et trin mere (højst 5). Hvert trin giver +6 % skade og +4 % fart, og fra trin 3 heler hvert drab 5 liv. Rusen falder bort efter 5 sek. uden drab.

- **+0,61 bane.** Botterne når i snit trin 4-5 hvert run, så den bliver brugt.
- Den belønner at blive i kampen i stedet for at trække sig, og den hjælper både speedrunner (+1,75), optimerer (+1,21) og casual (+0,42).
- Pr. art: Ankylosaurus (+1,44), Baryonyx (+1,38), Utahraptor og Deinonychus (+1,0) får mest; Compy og Gallimimus intet, fordi de sjældent dræber i serie.
- **Forslag:** +4 % skade og +3 % fart pr. trin. Det burde give ca. +0,4 bane. Tæller op som et lille flammeikon ved livsbjælken.

## 2. Nye evne-twists til nuværende og kommende arter

Hver art fik et ekstra twist oven i sin nuværende evne. Effekten er målt pr. art (16 runs pr. art, støj ca. ±0,5):

| Art | Twist | Før | Efter | Ændring |
|---|---|---:|---:|---:|
| **Parasaurolophus** | Trompetstød: kaldet skræmmer rovdyr væk i 2 sek. og heler 4 | 2,19 | 3,81 | **+1,63** |
| **Utahraptor** | Slagterspring: 14 skade til alle inden for 70 px | 3,25 | 4,13 | +0,88 |
| **Ankylosaurus** | Halekølle-ladning: næste haleslag ×2 inden for 3 sek. | 4,19 | 5,06 | +0,88 |
| **Gallimimus** | Vindløb: +25 % fart i 3 sek. og 6 liv | 3,19 | 4,06 | +0,88 |
| **Pachycephalosaurus** | Hjernerystelse: dyr inden for 90 px vakler 1 sek. | 3,13 | 3,88 | +0,75 |
| **Allosaurus** | Flænserus: næste bid ×1,6 inden for 3 sek. | 4,00 | 4,69 | +0,69 |
| Deinosuchus | Dødsgreb: dyr inden for 80 px vakler 1,2 sek. | 3,63 | 4,19 | +0,56 |
| Deinonychus | Fjerdans: næste bid ×1,6 inden for 2 sek. | 3,31 | 3,81 | +0,50 |
| Compy | Smutbid: næste bid ×2 | 2,94 | 3,31 | +0,38 |
| Triceratops | Flokmur: 18 skjold i 4 sek. | 4,00 | 4,38 | +0,38 |
| Tyrannosaurus | Kæbelås: næste bid ×2,2 inden for 3 sek. | 2,38 | 2,56 | +0,19 |
| Velociraptor | Flokhvin: dyr inden for 120 px vakler 0,5 sek. | 3,00 | 3,19 | +0,19 |
| Carnotaurus | Tyrefægter: dyr inden for 80 px vakler 0,8 sek. | 3,31 | 3,44 | +0,13 |
| Oviraptor | Æggekast: dyr inden for 130 px bliver sinket | 3,19 | 3,25 | +0,06 |
| Stegosaurus | Thagomizer-retur: 12 skade inden for 110 px | 4,00 | 4,00 | 0 |
| Therizinosaurus, Pachyrhinosaurus | Høstkløer / Panserflok | 4,00 / 3,94 | 3,94 / 3,88 | −0,06 |
| Baryonyx | Vandsprøjt: dyr inden for 140 px bliver sinket | 4,31 | 3,94 | −0,38 |
| Spinosaurus, Microraptor, Pteranodon | Sejlskræk / Fjerflimmer / Styrtdyk | 6,19 / 3,25 / 4,81 | 5,75 / 2,81 / 4,31 | −0,44 til −0,50 |

- **Parasaurolophus er den store vinder:** den svageste nye art går fra 2,19 til 3,81, fordi trompeten nu både kalder hjælp og skubber faren væk.
- **"Næste bid gør mere skade" virker for raptorer og Allosaurus, men ikke for T. rex,** der i forvejen bider langsomt. T. rex er den svageste af de gamle arter (2,38) og har brug for noget andet: fx at brølet giver 15 skjold, eller +20 % liv.
- **"Sink dyr i nærheden" virker ikke** (Baryonyx, Oviraptor). Det er for svagt til at mærkes.
- **Negative tal for Spinosaurus, Microraptor og Pteranodon er inden for støjen.** Twisten hjælper dem bare ikke.
- **Forslag:** byg de 6 øverste. De kan også bruges som legendariske artsmutationer i stedet for at være altid slået til, så "nu spiller jeg anderledes"-øjeblikket kommer midt i runnet.

## 3. Powerups på kortet

Otte slags lysende powerups ligger ved helligdomme på kortet og falder af og til fra drab, elitedyr og når en boss brydes:

| Powerup | Effekt | Alene (5 helligdomme, 96 runs) |
|---|---|---:|
| **Hjertefrugt** | +12 maks. liv resten af runnet og 20 heling | **+2,26** |
| Kometstøv | De næste 4 bid er kritiske | +0,18 |
| Ravskjold | 35 skjold i 10 sek. | +0,11 |
| Vampyrbregne | 20 % af din skade heler dig i 12 sek. | +0,08 |
| Fjerlethed | +35 % fart i 10 sek. | +0,02 |
| Istidsdug | Dyr inden for 500 px bevæger sig 50 % langsommere i 6 sek. | −0,06 |
| Adrenalinbær | Uendelig stamina i 8 sek. | −0,10 |
| Blodmåne-kød | +30 % skade og 15 % hurtigere angreb i 12 sek. | −0,16 |

- **De midlertidige powerups ændrer ikke sværhedsgraden** (alle inden for ±0,25 = støjen). Effekten forsvinder ofte, før man møder noget at bruge den på. Deres værdi er variation og øjeblikke, ikke styrke.
- **Hjertefrugt er for stærk,** fordi den er permanent. Med 5 helligdomme når 96 % bane 3.
- **Kun optimereren får meget ud af dem** (+1,2 til +1,5 for hver slags), fordi den samler dem målrettet. Gennemsnitlig og ny spiller får intet eller mindre end intet: de bliver trukket ind i kampe på vej til en powerup. Skal de virke for alle, skal de vises på minikortet.
- **Forslag:** byg den lette udgave (1 helligdom pr. bane + 2 % chance pr. drab, ca. 4 pr. run, +0,47). Hjertefrugt kun når en boss brydes, og uden de 20 liv heling. Midlertidige powerups skal vare mindst 15 sek.

## 4. Urraseri-måler

Skade, du gør, fylder en måler. Når den er fuld (160 skade), bliver din næste evne til "Urraseri": +35 % skade, 20 % hurtigere angreb og 15 % af skaden heler dig i 6 sek. Botterne udløser den ca. 7 gange pr. run.

- **+0,42 bane**, men det er mest speedrunneren (+1,75), der spammer evnen. De andre profiler får +0,1 til +0,4.
- Den passer godt til bosskampe som et "nu slår jeg igen"-øjeblik. Den kan erstatte Jagtrus, hvis du kun vil have én ny kampmekanik.

## 5. Dusørjagt

Hvert minut bliver det nærmeste farlige dyr markeret som dusørdyr. Dræber du det, får du 3 × dets DNA og 12 sek. raseri.

- **+0,22 bane og +27 % DNA pr. run** (84 → 107). Botterne nåede ca. 3 dusører pr. run.
- Den giver noget at gå efter mellem bosserne og gør labbet hurtigere at fylde. Det er en god måde at give mere fremskridt uden at gøre selve runnet meget lettere.

## 6. Det ikke-byggede fra idébanken

**Økologi-pres** (alle fire slået til samtidig):
- *Blodspor:* under 40 % liv lokker du hvert 3. sek. det nærmeste rovdyr inden for 650 px til (ca. 14 gange pr. run).
- *Flokforsvar:* rammer du et forsvarsdyr i en flok, kommer flokfællerne inden for 260 px til hjælp.
- *Ådselgæster:* 30 % af dine drab lokker 2 compyer til (ca. 5 pr. run).
- *Natjægere:* rovdyr gør 20 % mere skade og er 10 % hurtigere om natten, men natdrab giver 50 % mere DNA.

Samlet **+0,16 bane, altså neutralt.** Blodsporet gør det sværere, men ådselgæsterne giver mere føde, så det går lige op. Det rammer dog ny spiller (−0,42) og slagsbror (−0,63). Kan bygges for stemningens skyld; blodspor bør være mildere tidligt i spillet.

**Baby-start:**
- *Hård* (60 % liv, 70 % skade, 25 % mindre XP pr. niveau, vokser +15 % pr. boss): **−0,95 bane.** 90 af 192 runs dør på bane 1 (baseline 20). Kun egnet som en svær tilstand med ekstra DNA.
- *Blid* (80 % liv, 85 % skade): **+0,31 bane.** De ekstra mutationer opvejer mere end det svagere udgangspunkt. Det er en god udgave af "start som baby og vokser": man er sårbar på bane 1 (48 dødsfald) men stærkere senere.

**Elite-egenskaber** (elitedyr får en af fem: brutal, pansret, hurtig, torne eller regenerende): **−0,11, neutral.** Giver mere variation i elitekampe uden at gøre spillet sværere, undtagen for slagsbroren (−1,0), der løber ind i tornene.

**Kontra** (undgår du et angreb, gør dit næste bid +40 % i 2 sek.): **+0,07.** Botterne undviger kun ca. 3 gange pr. run, så den kan ikke vurderes her. Den kræver en menneskelig test.

**Ikke testet:** procedural banerækkefølge (bosskurven er bygget til den faste rækkefølge) og alt, der kun er grafik.

## 7. Arterne i dag (baseline)

| Art | Bane | Casual + ny spiller |
|---|---:|---:|
| **Spinosaurus** | **6,19** | 2,75 |
| Pteranodon | 4,81 | 1,75 |
| Baryonyx | 4,31 | 4,00 |
| Ankylosaurus | 4,19 | 2,75 |
| Allosaurus, Stegosaurus, Therizinosaurus, Triceratops | 4,00 | 1,50-3,00 |
| Pachyrhinosaurus | 3,94 | 2,25 |
| Deinosuchus | 3,63 | 2,25 |
| Carnotaurus, Deinonychus, Microraptor, Utahraptor | 3,25-3,31 | 1,50-2,00 |
| Gallimimus, Oviraptor, Pachycephalosaurus | 3,13-3,19 | 1,00-1,75 |
| Velociraptor | 3,00 | 1,75 |
| Compy | 2,94 | 2,00 |
| **Tyrannosaurus** | **2,38** | 2,00 |
| **Parasaurolophus** | **2,19** | 1,25 |

- **Spinosaurus er for stærk** og bør have mindre liv eller skade (fx 150 liv i stedet for 175). De nye arter ligger i snit en halv bane over de gamle (3,95 mod 3,39).
- **T. rex og Parasaurolophus er de svageste.** Parasaurolophus' twist (afsnit 2) løser det. T. rex har brug for noget andet end mere bidskade.
- Carnotaurus-bosserne (Carl og Karl) er stadig det, der dræber flest runs for næsten alle arter.

## Data

Rådata ligger i `balance/nat_2026-10-13/data`: én mappe pr. eksperiment med `REPORT.md`, `summary_compact.json` og `vs_base.json` (parret sammenligning med baseline pr. profil og art). Navnene: `base`, `base_new` (de 9 nye arter), `powerups`, `powerups_lite`, `pu_<type>` (én powerup ad gangen), `ability2`, `ability2_new`, `streak`, `rageMeter`, `counter`, `babyStart`, `baby_soft`, `eliteAffix`, `ecology`, `bounty`, `pkg`.

Kør selv: `node tools/playstyle_sim.cjs --exp '{"streak":true}'` (tal i toppen af `tools/experiments.cjs`).
