# Spiltest: prioritet1–4

Spil: https://junnez.github.io/primal-run/

1. Alle syv fjendearter har idle/gang/løb/angreb/skade/død i S/E/N/W.
480 nye frames til Parasaurolophus, Deinosuchus, Triceratops og T.rex;
Compy, Carnotaurus og Ankylosaurus deler deres eksisterende komplette serier.
Gaitfasen bevares ved vending, gang/løb bruger fælles1,5-sekunders ur uden
forkert loop-reset. Aktive spillerangreb prioriteres over korte skadeposer.
Døde dyr afslutter deres dødsserie og forsvinder efter8simulationssekunder.
Se enemy_full_review.html; genereret art har stadig små anatomiske variationer
og er ikke produktionsgodkendt.

2. Flodvand:60% bevægelsesfart, mudder:75%, buske:90%. Deinosuchus beholder
fuld fart i vand og90% i mudder. Fysikken følger den tegnede flodkurve.
Stå stille eller hold C i buske i0,6sekunder for at skjule dig. C giver45%
snigefart før terrænfaktoren. Normal bevægelse afslører dig; angreb/evner
holder dig afsløret i2sekunder. Nære dyr indenfor70pixels og dyr, du har ramt
indenfor8sekunder, kan stadig opdage dig. Bosser ignorerer skjul.
HUD viser SKJULT eller det terræn, der sænker dig. Pause fryser alle timere.

3. Compy og Parasaurolophus danner lokale flokke. Flokfæller indenfor240pixels
alarmeres af en træffer; alarmen varer4sekunder. Kun det ramte dyr får8sekunders
jagtgrace. Bytte græsser, hviler og bevæger sig sammen omkring sit hjem; rovdyr
hviler og strejfer. Cyklus22sekunder, forskudt mellem dyr. Store territoriale
dyr advarer ved yderkanten og angriber tæt på; efter8sekunder uden træffer
vender de hjem, hvis du forlader hjemmets radius+200pixels. Tilfældig opgivelse
og personlig afstand for fredeligt bytte bevares. Dyrene angriber ikke hinanden.

4. Arts-unlocks:Compy0, Utahraptor25, Carnotaurus55, Ankylosaurus75DNA.
Ankylosaurus-angreb:0,74sekunders cooldown. Compys Lille specialist:+25%
bytteskade/rang; additive damage-bonuser forhindrer utilsigtede multiplikationer.
Carnotaurus Fremdrift returnerer højst24stamina/stormløb, under35stamina-prisen.
DNA-upgradepriser:10,26,47,70,95… Maksranger og gamle unlocks/saves bevares.
Blødningsteksten forklarer den eksisterende3sekunders varighed og fornyelse.
Bossernes sikre DNA-belønninger er15/20/25/30, i alt90 over et helt run.
Små/mellemstore/store dyr giver i gennemsnit0,05/0,30/1,20DNA pr. drab,
udover fossiler og valgfrie elites. Målinger af stationære mål findes i balance_audit.json; de viser timing og
mutationseffekt, ikke menneskelige winrates. Klassenes mobilitet, evner og
områdeangreb skal vurderes i din spiltest.

Test især: føles bevægelse og angreb godt ved vendinger, kan du bruge buske
til at snige dig tættere på, forlader dyr jagten uden at give op midt i kamp,
og virker de fire arter interessante uden at én er det oplagte valg?

Prioritet5–8 afventer din spiltest.
