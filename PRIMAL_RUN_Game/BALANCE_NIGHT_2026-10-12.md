# PRIMAL RUN: nattens kørsler og forslag (12. oktober 2026)

I nat kørte jeg ca. 4.400 hele runs og 3.500 bossdueller på PR #7's pakke. Der er tre nye bot-profiler, så der nu er otte: optimerer, gennemsnitlig, casual, ny spiller og slagsbror, plus de nye **hit-and-run** (slår og trækker sig tilbage), **forsigtig** (trækker sig tidligt, spiser meget) og **speedrunner** (haster frem, tager chancer). Hvert eksperiment er 12 arter × 8 profiler × 3 seeds = 288 runs à 900 sekunder, og det samme seed giver præcis det samme run.

> Bots er ikke mennesker. Brug tallene til at sammenligne ændringer, ikke som præcise sværhedsgrader. Med 288 runs er støjen ca. ±0,1 bane samlet og ca. ±0,3 bane pr. art.

## Det skal du tage stilling til

1. **Bosskurven: stigende, med Palle × 1,0** (anbefalet, slået til i PR'en). Bosserne bliver sværere for hver bane, og muren hos Carl er væk. Palle er en læreboss. Kurven erstatter gårsdagens "Carl × 0,75". Alternativt Palle × 1,2, hvis bane 1 skal være en rigtig prøve (se afsnit 1).
2. **DNA-lab +4 % pr. rang** (slået til). Fuldt lab giver nu +0,9 bane mod +0,34 før (afsnit 2).
3. **Ankylosaurus' vinkel** står stadig åben fra i går. Jeg anbefaler fortsat 270° + rækkevidde 90; beskrivelsen skal derefter oversættes til 24 sprog. I nattens runs ligger den i toppen uden lab (3,17) og midt i feltet med fuldt lab (3,63), men det er kun 24 runs pr. art; gårsdagens måling med 100 runs pr. vinkel er mere præcis.
4. **Hvilke nye systemer skal bygges først?** Mit forslag, i rækkefølge:
   - **Artsinstinkt + omvalg + 5 artsmutationer til alle arter.** Det giver mere variation og artsidentitet uden at ændre sværhedsgraden (afsnit 3 og 9).
   - **"Andet pust" som nyt lab-spor** (+0,2 bane, afsnit 8).
   - **Gallimimus "Støvsky" som første nye evne** (2,29 → 2,63, afsnit 6).

Alt det nye fra i nat ligger bag flag, der er slået fra. I forhold til i går aftes er Palle × 1,0 den eneste ændring i selve spillet.

## 1. Ny pakke mod det gamle spil

Pakken er alt i PR'en: Ankylosaurus 270° + rækkevidde 90, Gallimimus 100 liv/7 skade, stigende bosskurve og DNA-lab +4 % pr. rang. Uden upgrades:

| | Gammelt spil | Ny pakke |
|---|---:|---:|
| Bane (gns.) | 2,53 | **2,65** |
| Når bane 3 | 38 % | **46 %** |
| Når bane 5 | 9 % | 11 % |
| Dør på bane 1 | 42 | **62** |
| Dør på bane 2 (Carl) | **127** | 83 |
| Dør på bane 3 | 50 | 64 |
| Dør på bane 4 | 30 | 31 |

**Muren på bane 2 er væk.** Før døde 44 % af alle runs på bane 2, de fleste hos Carl. Nu er dødsfaldene fordelt over bane 1-3.

Pr. bot-profil (gns. bane):

| Profil | Gammelt | Pakke | Pakke + fuldt lab |
|---|---:|---:|---:|
| Optimerer | 3,67 | 4,44 | 5,25 |
| Slagsbror | 3,17 | 3,31 | 4,50 |
| Hit-and-run *(ny)* | 2,81 | 3,17 | 4,14 |
| Forsigtig *(ny)* | 2,19 | 2,44 | 3,25 |
| Gennemsnitlig | 2,08 | 2,19 | 3,11 |
| Speedrunner *(ny)* | 2,50 | **2,00** | 3,17 |
| Casual | 2,06 | **1,86** | 2,50 |
| Ny spiller | 1,78 | 1,81 | 2,44 |

**Palle skal ikke gøres sværere.** Med Palle × 1,2 steg andelen, der dør allerede på bane 1, for gennemsnitlig fra 14 til 25 %, casual fra 28 til 39 % og speedrunner fra 14 til 42 %. Jeg testede derfor Palle × 1,0 med resten af kurven uændret:

| | Gammelt spil | Palle × 1,2 | **Palle × 1,0** |
|---|---:|---:|---:|
| Bane (gns.) | 2,53 | 2,65 | **2,81** |
| Når bane 3 | 38 % | 46 % | **53 %** |
| Dør på bane 1 / 2 / 3 | 42 / 127 / 50 | 62 / 83 / 64 | **29 / 95 / 89** |
| Dør på bane 1: gennemsnitlig / casual / ny / speedrunner | 14 / 28 / 42 / 14 % | 25 / 39 / 47 / 42 % | **6 / 19 / 33 / 11 %** |

Med Palle × 1,0 er bane 1 en læreboss, og der er stadig ingen enkelt mur: dødsfaldene fordeler sig på bane 2 og 3. **Det er nu slået til i PR'en.** Tabellerne nedenfor er målt med Palle × 1,2, men forskellene mellem varianterne gælder stadig.

## 2. DNA-lab +4 % pr. rang virker nu

| | Uden upgrades | Fuldt lab (alle 5 spor på rang 5) |
|---|---:|---:|
| Bane (gns.) | 2,65 | **3,55** |
| Når bane 3 | 46 % | **77 %** |
| Når bane 5 | 11 % | **26 %** |
| Mutationer pr. run | 4,8 | 6,3 |
| DNA pr. run | 57 | 83 |

Fuldt lab giver nu +0,9 bane. Med de gamle +2 % var det +0,34. Muren flytter sig med upgrades: uden lab dør flest på bane 2, med fuldt lab på bane 3 (101 af 288), og 1 run vandt hele spillet. Det er den "man kommer lidt længere hver gang"-følelse, du bad om.

Alle 25 rangtrin koster tilsammen 1.240 DNA. Med 57-83 DNA pr. run tager det ca. 15-22 runs at maxe labbet.

## 3. Mutationer: hvad ændrer sværhedsgraden?

| Variant | Bane (gns.) | Mutationer pr. run | Egne artsmutationer pr. run | Omvalg brugt |
|---|---:|---:|---:|---:|
| Pakke (i dag) | 2,65 | 4,8 | 0,49 | – |
| Omvalg (1 pr. boss) | 2,68 | 4,8 | 0,50 | 0,10 |
| Artsinstinkt | 2,61 | 4,8 | **0,77** | – |
| XP-trin 2 i stedet for 3 | 2,72 | **5,5** | 0,65 | – |
| Alle tre | 2,59 | 5,3 | 0,79 | 0,02 |

- **Ingen af dem ændrer sværhedsgraden mærkbart** (forskellene er under ±0,1 bane, inden for støjen). De kan altså bygges for variationens skyld uden at rokke ved balancen.
- **Omvalg bliver næsten ikke brugt,** fordi man kun får dem efter en boss, og de fleste runs slutter efter 1-2 bosser. Skal omvalg mærkes, skal man have 1 fra start eller også få dem for elite-/albinodyr.
- **Artsinstinkt giver 57 % flere artsmutationer, men ikke flere sejre.** Det tyder på, at mange artsmutationer ikke er bedre end de generelle (Pachycephalosaurus faldt fra 2,54 til 1,96 med instinkt, men det er kun 24 runs). Artsmutationerne bør styrkes, hvis de skal være værd at vælge.
- **Flere mutationer betyder lidt,** fordi de fleste runs slutter tidligt. XP-trin 2 giver 0,7 mutationer mere pr. run og +0,07 bane.

## 4. Arter: mere liv eller mere skade?

Alle 12 arter fik samme ændring på én gang:

| Variant | Bane (gns.) | Når bane 3 | Skade taget | Run-længde |
|---|---:|---:|---:|---:|
| Pakke (i dag) | 2,65 | 46 % | 226 | 322 s |
| **+20 % liv** | **3,04** | 56 % | 288 | 363 s |
| **+20 % skade** | **3,01** | 59 % | 249 | 336 s |
| +20 % liv, −10 % skade | 2,68 | 51 % | 270 | 335 s |

- **+20 % liv og +20 % skade er lige meget værd** (ca. +0,37 bane hver).
- **"Mere liv, mindre skade" er neutralt:** +20 % liv og −10 % skade ender på samme niveau som i dag, men kampene bliver længere. Det hjælper de sjuskede profiler (speedrunner 2,00 → 2,64) og koster de dygtige (optimerer 4,44 → 4,06). Det er altså et godt værktøj, hvis en art skal *føles* sejere uden at blive stærkere.
- Pr. art (24 runs pr. art, støj ca. ±0,3): Velociraptor, Deinonychus og Baryonyx får næsten intet ud af ekstra liv; Carnotaurus, Utahraptor og Gallimimus får mest.

## 5. Evner og angrebstempo

| Variant (alle arter) | Bane (gns.) | Når bane 3 |
|---|---:|---:|
| Pakke (i dag) | 2,65 | 46 % |
| **15 % hurtigere angreb** | **3,07** | 61 % |
| Evner 25 % billigere og 25 % kortere cooldown | 2,66 | 53 % |

- **Angrebstempo er et stærkt håndtag:** 15 % hurtigere angreb er lige så meget værd som +20 % liv eller skade.
- **Billigere evner gør næsten ingen forskel** samlet set. Kun Triceratops (+0,6) og Carnotaurus (+0,3) får noget ud af det. Evnerne bliver altså ikke bedre af at være billigere; skal de betyde mere, skal de *gøre* noget andet. Det er derfor, jeg har testet tre nye evner (afsnit 6).

## 6. Tre nye evner (prototyper, kun i simulatoren)

Lagt ind bag `ALT_ABILITIES` (slået fra), uden grafik. 8 profiler × 3 seeds = 24 runs pr. art, så støjen er ca. ±0,3 bane.

| Art og ny evne | I dag | Ny evne |
|---|---:|---:|
| **Gallimimus "Støvsky"**: sprinten får dyr inden for 150 px til at stå stille i 0,8 sek. og miste sporet; bosser får +35 på brud-måleren | 2,29 | **2,63** |
| **Velociraptor "Fastholdelse"**: kløspringet holder dyret fast i 0,9 sek.; bosser får +30 på brud-måleren | 2,67 | 2,79 |
| **Pachycephalosaurus "Kædestød"**: rammer stødet, får man halv stamina tilbage og kan støde igen efter 0,35 sek. | 2,54 | **2,08** |

- **Støvsky virker** og passer til Gallimimus som flugtløber. Den er mit bedste bud på en ny evne.
- **Fastholdelse** er en lille forbedring og gør Velociraptor mere til sig selv. Den kan godt være lidt stærkere.
- **Kædestød gjorde det værre** for botterne, sandsynligvis fordi det andet stød bærer én forbi målet og ind i andre dyr. Hvis du kan lide idéen, skal det andet stød være et kort hop tilbage i stedet for et nyt stormløb.

## 7. Bosskurven i 1v1 (endelig version)

Hver art mod hver boss alene, med det antal mutationer man typisk har ved banens start. Sejr i %:

| Boss | Gammel kurve | **Ny kurve** | Ny kurve + fuldt lab |
|---|---:|---:|---:|
| 1 Palle | 93 | **ca. 93** (× 1,0) | 98+ |
| 2 Carl | 66 | **81** | 93 |
| 3 Benny | 77 | **76** | 88 |
| 4 Doris | 49 | **69** | 83 |
| 5 Asta | 58 | **61** | 78 |
| 6 Tina | 22 | **47** | 65 |
| 7 Karl | 48 | **42** | 59 |
| 8 Ragnar | 59 | **36** | 58 |

Kurven falder nu jævnt fra første til sidste boss: hver boss er sværere end den forrige, og slutbossen Ragnar er den sværeste. Fuldt lab løfter hver boss med 10-22 procentpoint. (Palle er målt med × 1,2 til 88 %; med × 1,0 er han som i det gamle spil, ca. 93 %.)

## 8. Nye lab-idéer målt

4 profiler (optimerer, gennemsnitlig, casual, ny spiller) × 12 arter × 3 seeds = 144 runs pr. linje:

| Lab-idé | Bane (gns.) | Dødsrate |
|---|---:|---:|
| Pakke (i dag) | 2,58 | 90 % |
| **Andet pust** (overlev ét dødeligt slag med 1 liv) | **2,78** | 87 % |
| Bredere genpulje (4 kort i stedet for 3) | 2,40 | 96 % |
| Medfødt mutation (start med 1 valg) | 2,67 | 92 % |

- **Andet pust** er et godt lab-spor: +0,2 bane, og det redder runs, der ellers slutter på ét uheld.
- **Medfødt mutation** giver kun +0,1 bane. Den er bedre som en måde at give runnet en retning fra start end som et styrkekøb.
- **4 kort gør ikke botterne stærkere** (lidt svagere, tæt på støjen). Mere valg er godt for et menneske, der bygger mod noget bestemt, men det er ikke et styrkekøb. Det passer bedst som en lille bekvemmelighed sent i labbet.

## 9. Forslag: mutationer, DNA-lab og evner

### Hvad er problemet i dag?

- **Man ser sjældent sin egen arts mutationer.** Der er 60 mutationer, men kun 2-5 pr. art. Chancen for at et tilbud (3 kort) indeholder mindst én fra egen art:

| Art | Egne mutationer | Chance pr. tilbud | Ingen egen i de første 4 tilbud |
|---|---:|---:|---:|
| Velociraptor | 2 | **11 %** | **63 %** |
| Tyrannosaurus | 3 | 26 % | 30 % |
| Utahraptor, Gallimimus, Baryonyx, Triceratops, Pachy | 3-4 | 33-37 % | 16-20 % |
| Compy, Carnotaurus, Ankylosaurus | 3-4 | 44-49 % | 7-10 % |
| Deinonychus, Deinosuchus | 5 | 46 % | 8 % |

  (4 tilbud er ca. det man når før bane 4.) Velociraptor-spilleren ser altså næsten aldrig sin egen art, og det gør det svært at give arterne hver deres identitet gennem mutationer.
- **Få valg pr. run.** Man når i snit ca. 5 mutationer pr. run (bots).
- **Labbet er flade procenter.** Alle fem spor er "+x % af noget". Der er intet, der ændrer måden man spiller på.
- **Lab-prisen:** alle 25 rangtrin koster 1.240 DNA, ca. 15-22 runs (afsnit 2).

### Mutationer: forslag

1. **Omvalg (rerolls).** 1 ved start, +1 for hver boss og hver elite/albino ("miniboss"), højst 3 på lager. Knap på mutationsskærmen: "NYE VALG · R". Afsnit 3 viser, at omvalg kun for bosser næsten aldrig bliver brugt, derfor 1 fra start og også for elitedyr. *Prototype findes (`FEATURES.mutationRerolls`).*
2. **Artsinstinkt.** Indtil man har taget én mutation fra sin egen art, har hvert tilbud mindst ét kort fra egen art. Det løser Velociraptor-problemet og ændrer ikke sværhedsgraden (afsnit 3). *Prototype findes (`FEATURES.speciesMutationBias`).*
3. **Flere mutationer.** XP-kravet stiger med 2 pr. niveau i stedet for 3. Giver 0,7 mutationer mere pr. run uden at gøre spillet nemmere (afsnit 3).
4. **Udeluk.** 1 gang pr. run kan man fjerne et kort permanent fra puljen. Gør det lettere at bygge mod noget bestemt.
5. **Sjældenheds-garanti.** Har tre tilbud i træk ingen "sjælden" eller bedre, har det næste mindst én.
6. **Mærker og sæt-bonus.** Hver mutation får et mærke (Angreb, Forsvar, Fart, Evne, Føde, Krit), vist som ikon på kortet. Tre med samme mærke giver en lille bonus, fx Forsvar ×3: 10 skjold efter hvert bossdrab; Krit ×3: kritiske træf heler 2 liv. Så bliver valget at bygge noget, ikke kun at tage det største tal.
7. **Evolutioner.** En mutation på max-rang plus en bestemt partner udvikler sig til en stærkere udgave, fx Kraftigt angreb 3 + Blødende sår = "Savtakkede kæber" (blødning stables). Én art-evolution pr. art giver et mål for hvert run.
8. **Bosstrofæer.** Efter hver boss vælger man 1 af 2 trofæer, der passer til bossen: Palle "Tyk pande" (kortere stagger), Carl "Stormløbsben" (+stormløbsskade, bedre undvigelse af stormløb), Benny "Fiskekrog" (fisk heler mere), Doris "Panserhud" (-skade fra bid), Asta, Tina og Karl tilsvarende. Det kobler fremskridt til bosserne og giver noget at se frem til.
9. **Fyld hullerne i artsmutationerne.** Alle arter bør have 5 egne: almindelig, usædvanlig, sjælden, episk og legendarisk, som Deinonychus og Deinosuchus allerede har. Velociraptor mangler 3, de fleste andre mangler 1-2. Eksempler: Velociraptor "Flokjæger" (+skade når en flokfælle er tæt på), Compy "Myldre" (+fart efter undvigelse), Pachy "Stålpande" (hovedstødet fylder bossens brud-måler), Gallimimus "Støvsky" som legendarisk mutation, der ændrer sprinten (se evner), T. rex "Ådselkonge" (ådsler heler mere).
10. **Styrk artsmutationerne.** Afsnit 3 viser, at botterne ikke bliver stærkere af at tage flere artsmutationer. De skal være mindst lige så gode som de generelle, ellers er Artsinstinkt en straf.
11. **Flere byttehandler.** Glaskanonen og Tunge muskler giver et valg med en pris. Flere af dem: "Blodtørst" (+30 % skade, men intet liv fra føde), "Tyk hud, tung krop" (tag 20 % mindre skade, men −10 % fart).

### DNA-lab: forslag

1. **+4 % pr. rang** i stedet for +2 % (er i PR'en).
2. **Nye spor, der ændrer runnet,** låses op i rækkefølge, så de første runs stadig er enkle:
   - *Medfødt mutation*: start med 1 mutationsvalg (afsnit 8).
   - *Andet pust*: overlev ét dødeligt slag pr. run med 1 liv. Det bedste af de målte spor (+0,2 bane, afsnit 8).
   - *Bredere genpulje*: 4 kort i hvert tilbud i stedet for 3. Bekvemmelighed, ikke styrke (afsnit 8).
   - *Genetisk hukommelse*: +1 omvalg ved start pr. rang (højst 2).
   - *Artsinstinkt* kan også ligge her som et køb i stedet for altid at være slået til.
3. **Lås nye mutationer op i labbet.** Nye mutationer kommer først i puljen, når de er købt (som tegninger i Dead Cells). Puljen vokser med ens fremskridt, og de første runs bliver mere overskuelige.
4. **Artsmestring.** Hver art får sin egen fremskridtsbjælke (bosser dræbt med arten). Trin 1-3 giver kosmetik og fx "start med en almindelig mutation fra egen art". Det giver en grund til at spille de svære arter, som du gerne vil have.

### Evner: forslag

- **Gallimimus "Støvsky"**: anbefales (2,29 → 2,63, afsnit 6).
- **Pachycephalosaurus "Kædestød"**: ikke i den nuværende form (2,54 → 2,08). Prøv i stedet et kort hop tilbage efter et træf.
- **Velociraptor "Fastholdelse"**: lille forbedring (2,67 → 2,79). Kan skrues lidt op, fx 1,2 sek.
- **Compy "Flokkald"**: kalder 2-3 vilde compyer, der kæmper med i 8 sek. Kan genbruge raptor-flokkens ally-system og de små compy-flokke, der allerede findes. Ikke målt (kræver ally-kode).
- **Legendariske artsmutationer kan ændre evnen** i stedet for kun at give tal. Det er billigere end et helt nyt evnesystem og gør den legendariske mutation til et "nu spiller jeg anderledes"-øjeblik.

### Sammen med idébanken

- **Udklækning og opvækst** passer som mutationernes ramme: hver boss man slår, er et vækststadie (lidt mere liv og størrelse). Så vokser man i takt med bosserne. "Baby-start" kan være en sværere tilstand med flere mutationer.
- **Æg som valuta for omvalg.** Oviraptor-idéen og de skjulte reder i afsides områder kan give æg, der bruges til omvalg. Det belønner udforskning.
- **Ally-systemet** (raptor-flokken) kan bruges til både Compy "Flokkald" og Parasaurolophus' "Trompetkald" fra listen over nye arter.
- **Stegosaurus** med thagomizer bagud passer til Ankylosaurus' nye 270°-bue: begge er stærke bagud og svage forfra.
- **Dyr der kun forsvarer sig** (Iguanodon, Edmontosaurus, Archelon) giver de svage, små arter sikrere føde og XP i starten.

## Data og værktøjer

Rådata ligger i projektmappen `balance/data/nat_2026-10-12`: én mappe pr. eksperiment med `REPORT.md` og `summary_compact.json`, og bossduellerne som JSON. Navnene:

- `n_old_u0` gammelt spil, `n_pkg_u0` pakke, `n_pkg_u5` pakke med fuldt lab, `p_palle1` pakke med Palle × 1,0
- `n_mut_*` mutationsvarianter, `n_sp_*` artsvarianter, `p_alt` nye evner, `p_choices4`, `p_secondwind`, `p_startpick1` lab-idéer
- `final_duel_u0.json` og `final_duel_u5.json` bosskurven i 1v1

Nyt i simulatoren: `--start-mutations N` (mutationsvalg før start), tre nye bot-profiler og flag til prototyperne: `MUTATION_CHOICES`, `ALT_ABILITIES` og `FEATURES.secondWind`, alle slået fra.
