# Audit af den aktive kode · 9. oktober 2026

Scope: PRIMAL_RUN_Game/src, genereret GDevelop-projekt, aktivt assetkatalog,
artsvalg, UI-preview og referencer til de gamle animationspakker. Historiske
prototypepakker er bevidst bevaret; dette er ikke en garanti for nul fejl.

## Fund og rettelser

1. Artsvælgerens imageTag læste farvecachen uden at klargøre den. En art, der
   endnu ikke havde været tegnet på canvas, fik originalfarven. Billeder indlæses
   nu ved behov og bruger samme prepareImage/SPECIES_COLORS som gameplay.
2. Dødsskærmens preview brugte den rå PNG. Den bruger nu samme farvefunktion.
   De genererede preview-URL'er caches og frigives sammen med artens billedcache.
3. Spillerrenderingen havde en gammel Utahraptor-walk/bite-fallback og endnu
   ældre NPC-animationsfallback for andre spillere. Det komplette player_full
   katalog er nu den entydige kilde for alle fire klasser og alle seks states.
4. Baggrundsdyret på skærme uden aktiv jagt var hardcoded Utahraptor. Det følger
   nu valgt art med dens komplette idle-sprite.
5. Introens angrebstekst beskrev alle arter som en dinosaur, der bider foran sig.
   Ankylosaurus får korrekt forklaring af haleslag omkring sig. Målet beskrives
   som føde, så planteæderen ikke bliver bedt om at spise kød.

## Bevidst bevaret

- Gamle PNG-pakker, kilder og review-sider: referencer, ikke aktiv spilleranimation.
- BITE_ANIMATION i det offentlige core-export: kompatibilitet og ældre tests.
- Interne meat-felter: fælles fødeprogression og eksisterende tests; brugerfladen
  skelner mellem kød og planteføde. En navneændring ville være en større refaktor.
- Data og kode for DNA, mutationer og saves: ingen reset eller prisændringer.

Den nye regressionstest sammenligner alle fire portrætters RGB-pixels med den
forventede artsmapping og kontrollerer, at alpha bevares. Den starter med Compy,
så Utahraptoren også testes uden at have været tegnet/indlæst før artsvælgeren.
Ingen kildesprites eller eksporterede PNG'er ændres af denne rettelse.

## Verifikation

- 72 spilleregeltests, 13 aktive browserforløb og 3 referencepakke-forløb: bestået.
- Officiel GDevelop-eksport: artsfarver, fuldt spilforløb og 480 komplette
  spillerframes/state-overgange: bestået. Ingen mock-runtime.
- Kit-PNG-validering: bestået. Kildesprites og eksporterede PNG'er er uændrede.
- Den offentlige Pages-side er ikke HTTP-verificeret fra cloudmiljøet.
