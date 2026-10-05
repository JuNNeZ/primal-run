# PRIMAL RUN — tag dette med i morgen

**Ny native leverance:** ../GDevelop/project.json kan nu åbnes direkte i
GDevelop 5.6.283. Læs ../GDevelop/START_HER.md og ../GDevelop/STATUS.md.
Det nye projekt er testet med faktisk serializer, HTML5-export og Chromium-
runtime i cloud. Resten af dette dokument beskriver det bevarede originale kit;
dets tidligere NOT RUN-status og artwork-begrænsninger ændres ikke.

Kopiér hele den udpakkede PRIMAL_RUN_Prototype_Kit-mappe til arbejdscomputeren.
Åbn START_HER.html i Chrome eller Edge. Katalog, billeder og browserdemo virker
uden Codex, Python, server eller internet. GDevelop skal være tilgængeligt separat.
Gem også ZIP-filen som backup. Flyt ikke demo.html væk fra assets-mappen.

## Det du har

- 104 individuelle lossless PNG-filer; 71 nye oven på V5.
- Utahraptor: fire retninger med seks gå-frames og én idle pr. retning.
- 16 ekstra South-poser: bite, pounce, death, hurt, rest, juvenile og fossil.
- Syv nye top-down stillbilleder: Compy, Parasaurolophus, Carnotaurus,
  Deinosuchus, T. rex, Triceratops og Ankylosaurus.
- 16 props/pickups: træer, sten, log, blomster, reder, æg, kød, vand, DNA og fossiler.
- 12 VFX-frames til bite-slash, støv og meteor-impact.
- 12 UI-ikoner og otte 32×32 terrænprototyper.
- Otte korte originale WAV-lyde til bite, hit, pickup, level-up, pounce, death,
  meteor og UI. Simple syntetiske placeholders; ikke dinosauroptagelser.
- Offline katalog, previews, manifest, palette, sprite-regler, balancefil,
  objektliste, byggeguide, event-opskrifter og testresultater.
- Spilbar browserreference med bevægelse, bite, fjender, HP, mad, XP, pause ved
  level-up, tre mutationer, stacks, pounce/stamina, death, restart og lokal DNA.

Demoen varer 60 sekunder. Parasaurolophus og Carnotaurus kan spawne efter
henholdsvis 10 og 20 sekunder. Boss-kamp og extinction-event er ikke implementeret.
Mutationerne er tre faste valgmuligheder i denne prototype, ikke en tilfældig pulje.
DNA er en gemt tæller, endnu uden unlock-menu.
Lydene i sounds/ er ikke koblet til browserdemoen. De kan importeres særskilt i GDevelop.

## Start i denne rækkefølge

1. Spil demo.html og prøv S/W/A/D, Space, Shift, 1/2/3 og R.
2. Åbn GUIDE.html; den samler hele den lokale GDevelop-guide og event-opskrifterne.
3. Byg først bevægelse og retninger i en tom Game-scene.
4. Tilføj én Compy, bite og health. Gem en fungerende kopi.
5. Tilføj XP og level-up. Test at alle fjender står stille under valg.
6. Tilføj death/restart og DNA-tælleren.
7. Brug terræn, props og effekter til at forbedre læsbarheden.
8. Tilføj én ny fjendetype ad gangen. Gem efter hver fungerende milepæl.

## Hvad der stadig er foreløbigt

Alle assets er prototyper. Det fælles farvesæt og de tekniske PNG-kontroller
består, men det gør ikke billederne anatomisk eller animationsmæssigt perfekte.
GDevelop-runtime er IKKE testet; dette er en assetpakke og browserreference,
ikke et færdigt GDevelop-projekt, der kan åbnes som project.json.

Walk-poser har noget variation i markeringer og kropsform. North er drejet South,
inklusive lyset. De ekstra action-poser varierer i skala/registrering og bør først
bruges som enkeltposer; de er ikke færdige animationer og er ikke koblet på demoen.
Fjenderne har kun godkendt perspektiv som South-stillbilleder. Andre retninger
i deres rå kildeark blev fravalgt. Ingen boss eller ekstra spillerart er spilbar.
Tiles har gentagelsespreviews, men endnu ingen verificerede seamless-kanter eller
biome-overgange. Vand er et visuelt placeholder-terræn, ikke en svømmemekanik.

DNA gemmes i den lokale browsers lager. Det følger ikke automatisk med ZIP-filen
til en anden computer; privat browsing eller lagerbegrænsninger kan forhindre
persistens. Demoen fungerer stadig, men gemt DNA kan så gå tabt ved lukning.

## Bevar din egen arbejdskopi

Opret GDevelop-projektet i en mappe ved siden af pakken. Gem lokalt, og kopiér
assets ind i projektets mappe før import. Lav versionskopier, fx primal-run-01,
primal-run-02, efter hver milepæl. Din fremgang kræver ikke adgang til denne chat.
