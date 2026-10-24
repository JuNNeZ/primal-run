# PRIMAL RUN — udviklingsplan

## Spillets mål

En hurtig Utahraptor jager gennem fire biomer. Spilleren må vælge mellem at
tage risici for kød og DNA eller holde afstand og overleve. Mutationer skaber
forskellige builds under hvert run. Permanente DNA-upgrades giver små fordele,
men skal ikke være nødvendige for at vinde. Målet er runs på cirka 15–25 minutter;
den nuværende balance er et første udgangspunkt og er ikke tidsvalideret.

## Første milepæl — implementeret og automatiseret testet

- Én fælles simulation til browser og GDevelop JavaScript-events.
- Komplet loop: menu → jagt → kød/levels → boss → næste biome → sejr eller død
  → DNA-shop → nyt run.
- Fire baner, syv fjendetyper, ti mutationer, fire bosser og fire DNA-upgrades.
- Navn, lokale highscores, lydindstillinger, proceduremusik og effektlyde.
- Selvstændigt GDevelop-projekt og manuel GitHub Pages-workflow.

## Næste milepæl — kamp og balance

Playerens første animationsforbedring er integreret: 24 nye bid-PNGs i fire
retninger, optakt/gab/kontakt/recoil og én skadeudløsning på kontaktframe3.
Sprite- og runtime-kontroller består i browser og GDevelop. Visuel kvalitet
beholder prototype-status. Næste art-prioritet er at matche walk/idle til
angrebsserien, efterfulgt af pounce, hurt/death og fjendernes retningsanimationer.

Spiltest hele runs uden testhjælp. Registrér dødsårsager, varighed, kødtakt,
bossvarighed, foretrukne mutationer og indtjent DNA. Justér tabellerne i core.js.
Ingen mutation må være obligatorisk. Første level-up bør kunne nås hurtigt;
første boss skal lære varsling og recovery uden at blive en lang livsbjælke.

Forbedr fjendeadskillelse og bevægelse ved klipper. Tilføj tydelige kropsskygger
og læsbare animationer efter sprite-reglerne. Kontrollér, at ramt/ikke ramt
føles korrekt i alle retninger og ved forskellige skærmstørrelser.

## Biomer og bosser

1. Bregneskov: Carnotaurus lærer spilleren at undvige et låst stormløb.
2. Flodslette: tilføj vandkanter og Deinosuchus-baghold; i første version er
   floden endnu ikke en særskilt terrænmekanik.
3. Klippeland: Triceratops lærer flankering; udvid klippernes placeringer.
4. Vulkansk dal: T. rex kombinerer angreb; tilføj varslede miljøfarer.

Farlige angreb skal have tydelig optakt og en reel mulighed for modsvar.
Hold fjendehastigheder under et loft; øg sværhed med mønstre og kombinationer.

## Præsentation og udgivelse

Gennemgå sprites ved native pixels og integer-skalering på lys/mørk baggrund.
Godkend ikke animationer ud fra tekniske tests alene. Arbejd videre på bite,
hurt, death og enemy-retninger uden at ændre historiske pakker.

Udvid proceduremusikken til længere biome- og bosstemaer med sømløse loops.
Udskift effekt-placeholders med originale eller korrekt licenserede lyde.
Test mute, pauser og lydstart i flere browsere.

Test desktop og mobil, GDevelop Preview, GDevelop HTML5-eksport og Pages under
repositoryets URL-prefix. Før offentlig udgivelse skal spillet gennemspilles,
balanceres og kontrolleres for lagringsfejl og tilgængelighed. Online-highscores
og synkroniseret DNA er en separat backend-milepæl.
