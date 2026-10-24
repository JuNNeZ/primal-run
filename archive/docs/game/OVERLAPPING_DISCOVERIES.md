# Fem løsninger på overlappende fund

1. **Afstand ved kortgenerering (implementeret):** reder, fossiler og planteføde forsøges placeret mindst 84 pixels fra hinanden. Deterministiske kandidater flytter det senere fund til tør, fri jord; seedet giver samme placering. Ressourcer slettes ikke, og efter 32 forsøg beholdes placeringen, så tætte områder kan kræve løsning 2.
2. **Samlet interaktionsvælger:** én markør med antal fund; E åbner en pauset liste med rede/fossil/føde og afstand. Anbefalet næste trin for dynamiske ådsler og loot, der ikke kan adskilles på forhånd.
3. **Forskudte etiketter med forbindelsesstreger:** objekterne bliver på deres steder, mens teksten placeres uden overlap. Mindre indgreb, men løser ikke selve valg af objekt.
4. **Lokal fremhævning:** ved nærhed eller en holdt undersøgelsestast dæmpes planter omkring fundet, og alle ressourcer får forskellige konturer. Godt i tæt bevoksning; skal fungere uden farvesyn.
5. **Kortfiltre:** særskilte symboler for rede, fossil, føde og ådsel med valg af kategori på minimap. Hjælper navigation på store kort, men skal supplere én af ovenstående ved interaktion.

Nuværende redebelønning er den eksisterende artsbestemte fødecache (8 + 2 × biome fødeværdi); den kan først hentes efter vogterens død. DNA fra elitevogteren gemmes straks og gives kun én gang. Ingen belønning gives ved blot at provokere reden.
