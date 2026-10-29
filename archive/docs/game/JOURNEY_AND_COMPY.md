# Velociraptor, Compy-flokke og den længere jagt

Velociraptor er den gratis startart i nye saves:90 liv,8 bid-skade,32 stamina
for Kløspring. Gamle valgte arter, DNA, upgrades og highscores bevares.
Compy forbliver en gratis lille challenge-art. Ti spilbare arter i alt.

## Den normale rute

| Bane | Biome | Føde til boss | Boss | DNA |
|---|---|---:|---|---:|
|1|Skov|12|Palle - Skovbrynets Bølle (Pachy)|8|
|2|Skov|24|Carl - Skovens Vogter (Carnotaurus)|15|
|3|Flod|26|Benny - Fiskebankens Hersker (Baryonyx)|12|
|4|Flod|34|Doris - Flodens Gab (Deinosuchus)|20|
|5|Klipper|38|Asta - Klippernes Skjold (Ankylosaurus)|16|
|6|Klipper|46|Tina - Klippelandets Vogter (Triceratops)|25|
|7|Aske|48|Karl - Askens Jæger (Carnotaurus)|20|
|8|Aske|58|Ragnar - Dalens Konge (T. rex)|35|

Minibosser på1/3/5/7 har mindre liv. De nye bossarter bruger det eksisterende
låste charge/bid/områdeslag-system med egne navne; de er ikke tre helt nye
angrebssystemer. Carnotaurus beholder sin særskilte stormløbssekvens, også i aske.
Deinosuchus, Triceratops og T. rex beholder deres særskilte fase2-opførsel.
To baner i samme biome får forskellige kort-seeds, naturklynger og klipper.
Mutationer beholdes, og overgang heler30%. Space vælger aldrig belønninger.
`run.stage` er stadig biome0–3; `levelIndex` og `campaign` styrer baner/bosser.
`start({campaign:'classic'})` bevarer den gamle4-bossrute til historiske fixtures.

## Compys og NPC-evner

Compys bruger mindre sprites og radius4. NPC'er har8 liv,3 skade,1 basis-kød og
2% almindelig DNA-chance. Kvalitetsmultiplikatorer gælder stadig for sjældent kød.
Tre preplacerede tyveflokke med op til6 individer lever ude på kortet, med egne
kollisioner, flokalarmer og højst2 samtidige almindelige angrebsoptræk.
De søger kadavere inden for850pixels og tager én fødeportion pr.0,8sekund,
uden at belønne spilleren. Når højst2 flokfæller er tilbage, spredes de i6sekunder;
den brudte flok fornyer ikke flugten for evigt. Compys kan fortsat leve naturligt.

Almindelige NPC'er med en spilbar art får dens basale evne, baseline stamina-pris,
varighed og cooldown fra samme `PLAYER_SPECIES`-data. NPC-stamina100 regenererer
18/s efter1,25s delay. Synligt optræk og låst retning går forud for aktiv fase.
Compy undviger som såret; Gallimimus flygter; Carnotaurus/Triceratops/Pachy/Bary
bruger deres kontaktstød; Anky beskytter sig; T. rex brøl sænker spilleren og
stamina som en PvE-tilpasning af frygt. NPC-Bary kan fange en reel fiskestime i
vand uden at give spilleren XP. Ingen spiller-mutationer forstærker NPC-evner.
Bosser springer denne logik over. Utahraptor/Velociraptor er aktuelt spillerarter,
så der er ikke tilføjet nye NPC-versioner af dem i denne ændring.

## Hemmeligt seed

Skriv **1993** i menuens seed-felt eller brug `?seed=1993`. “Compy-tyvenes banket”
er en hemmelig enkeltbane med op til6 tyveflokke og **Mathias - Kødvogteren**.
Samme kamp-/fødesystem, egne intro-/sluttekster; ikke en separat minigame-motor.

## Grafik og kildestatus

Velociraptor har120 frames i seks states/four retninger, med eksisterende Utah-
atlasser som referencer. N-original og første N-revision blev afvist for forkerte
retninger i nederste rækker; begge er bevaret. N-revision2 er aktiv og bruger
en tæt kildecelle samt alpha248 for at fjerne dens bløde brune alpha-halo.
Andre kilder beholder alpha192. Ingen manglende anatomi tegnes af exporteren.

Compy-kroppe eksporteres ved ekstra integer4 sampling, corpse-props ved integer2;
Velociraptor ved integer2. Kilder/origins/palette bevares. Det er en relativ
størrelsesrettelse; alle legacy-arter er ikke videnskabeligt målfaste modeller.
Carnotaurus' ådsels-/skeletrevision2 flytter E/W-hornbaser tilbage over øjenhulerne;
S/N-props og levende Carno-serier er bevaret byte-for-byte. Baryonyx N er efter brugerens udtrykkelige ønske
South roteret180grader. Det er en prototype-undtagelse: lyset roterer også.

960 player_full-PNGs og192 serier; Triceratops/T.rex deler deres eksisterende
120-frames-serier. Ti spillere har1200 frames til rådighed.160 corpse-props.
Alle nye kilder ligger i `Source_Generated`, også afviste billeder. Alt genereret
art er stadig `prototype_static`, ikke produktionsgodkendt. Browserkontrol er
adskilt fra en rigtig GDJS-eksport, som ikke er kørt på denne revision.

## Balance og multiplayer

Se `balance_runs/JOURNEY_RESULTS.md` for reproducerbare aktuelle botmålinger.
Lette enkeltdueller og bot-timeouts er ikke menneskelige win-rates. Startmutationer
i profilerne er research-grants; DNA-priser og artens unlockpris registreres.

Anbefalet første multiplayer-version er2–4-spiller co-op PvE med fælles seed,
separate figurer, genoplivning, fair loot og fælles bossprogression. GitHub Pages
kan fortsat levere klienten, men realtids-spil kræver en separat WebSocket-server.
Serveren bør eje kamp, AI, drops og tick-simulering; klienterne sender input og
interpolerer snapshots. Mutationer kræver fælles pause eller sikkert valgområde.
Det er en større ombygning af `run.player`, kamera/input og save-/reward-regler.
Start med to spillere på én biome, derefter boss/loot, lobby/reconnect og skalering.
PvP kræver yderligere lag-/hit- og klassebalance, og bør komme senere som arena.
Multiplayer er en anbefalet næste opgave, ikke implementeret her.
