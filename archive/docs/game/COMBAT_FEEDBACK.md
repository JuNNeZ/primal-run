# Mathias’ playtest: kamp og læsbarhed · 9. oktober 2026

## Implementeret

- Primært angreb: Compy 0,40 sek., Utahraptor 0,60 sek., Carnotaurus 0,80 sek., Ankylosaurus 0,90 sek. Mutationer kan reducere cooldown.
- Evner koster henholdsvis 28, 38, 45 og 45 stamina. Regeneration er 12/sek. i ro og 8/sek. under kamp, stopper under evner og i 1,25 sek. efter brug. Skade stopper regeneration i 1 sek. Fremdrift refunderer højst 12 pr. stormløb; minimumsprisen efter mutationer er 16.
- HUD og bjælker ved spilleren viser begge cooldowns. Evnen viser pris og advarer ved for lidt stamina. Spisning har sin egen bjælke.
- Bossens minimap-symbol er nu en gul diamant ◆, også uden for udforsket område.
- Almindelige T. rex, Triceratops og Deinosuchus varsler nærangreb i 0,85 sek. Alle varsler tegnes over dyr/planter med kontrastkant og nedtælling. De senere bosser og deres dobbeltangreb giver længere varsling.
- Spilbar Ankylosaurus spiser urter ved at stå stille og holde F. Planter giver samme progression som rovdyrs kød; der er føde i alle fire biomer og plantebelønninger ved reder. Den samler fortsat DNA. Triceratops er endnu kun NPC/boss; alle planteædende NPC'er kan græsse.
- Jorden har stærkere tekstur og detaljer af sten, rødder og plantedele. Detaljer er deterministiske, følger verdenskortet og caches kun i begrænset antal synlige kortfelter.
- Parasaurolophus’ sydvendte gang bruger en ny kilde med kun to synlige fødder. T. rex har nye nordvendte gang-/løbframes med større hoved og bækken. Parasaurolophus’ andre retninger samt ens kropsvolumen mellem idle, angreb og bevægelse kræver fortsat en bedre tegnet kilde; de afviste forsøg er ikke lagt i spillet. Art forbliver en prototype, ikke produktionsgodkendt animation.

## Fem legendariske mutationer

Alle har guldfarvet kort, maks. én rang og vægt 0,12 mod almindelig 6. Chancen afhænger af de tilbageværende mutationer; den stiger når almindelige mutationer er fuldt opgraderet.

| Art | Mutation | Effekt |
| --- | --- | --- |
| Alle | Ur-genom | +25 maksimalt liv og +20 % angrebsskade |
| Compy | Lille torden | 35 % kortere angrebscooldown i 3 sek. efter undvigelse |
| Utahraptor | Skyggespring | +18 spring-kontaktskade og beskyttelse til 1 sek. efter landing |
| Carnotaurus | Knogleknuser | +20 stormløbsskade og 0,65 sek. stagger |
| Ankylosaurus | Ur-fæstning | 20 skjold i 4 sek. og dobbelt skade på næste haleslag inden for 4 sek. |

## Forslag til næste forbedringer

1. **Anatomisk spritepass:** ens kropsvolumen på tværs af retninger; ret især T. rex mod nord og Parasaurolophus mod øst/vest/nord. Sammenlign loops i native størrelse før integration.
2. **Spilbar Triceratops:** planteføde, defensiv hornblokering og kort stormløb; retningsbestemt panser, men sårbar bagfra.
3. **Pachycephalosaurus:** hovedstød opbygger stagger; stærk mod små dyr, risikabel mod pansrede fjender.
4. **Gallimimus:** hurtig omnivor med lav skade; føde fra urter/insekter, undvigelse og lokkemekanik.
5. **Baryonyx:** fiskeri og vandjagt som særskilt progression; fiskestimer bliver valgfrie højrisiko-fødesteder.
6. **Flokmekanik:** kald, koordineret omringning og flokledere. Begræns hvor mange dyr der kan angribe samtidigt.
7. **Vejr og døgn:** regn ændrer mudder/vand og sigtbarhed; natdyr opdager anderledes. Bevar tydelige varsler i mørke.
8. **Mutationer med tradeoffs:** eksempelvis længere rækkevidde mod langsommere bid, eller større skade mod dyrere evner. Vis samlet effekt før valg.
9. **Bestiarium:** kost, habitat, størrelse og tidsperiode; spillets blanding af arter er en fantasiverden, ikke en påstand om at alle levede sammen.
10. **Mere varierede bossarenaer:** flere sikre passager, dækning og terrain-risici; undgå fastlåst spawn og angreb gennem klipper.

Balancen er verificeret med deterministiske tests, ikke menneskelige winrates. Næste playtest bør måle tid til første boss, stamina ved undvigelser, dødsårsager og hvilke mutationer der vælges.
