# Idébank

Ideer til senere. Ikke godkendt til implementering endnu.

## Større eller procedurale baner (tilføjet 9. okt. 2026)

**Status:** første version er bygget i overhaulen – banerne er 1,4× større, procedurelt delt i
navngivne områder med egne dyr og skjulte belønninger. Næste skridt kunne være helt
procedurale banerækkefølger og sjældne arter, der kun findes i afsides områder.

- Undersøg om banerne skal være markant større, med 2–3 under-biomer pr. bane
  under ét grundtema (fx flodbred, tæt skov og lysning i samme bane).
- Alternativt procedurale kort, så man ikke møder alle dinosaurer alle steder.
- Arter knyttes til bestemte under-biomer; sjældne arter og skjulte reder i
  afsides områder, så udforskning belønnes.
- Skal måles med `tools/playstyle_sim.cjs` (tid pr. bane, `stuckSeconds`) og på
  mobil-performance (antal dyr, tegnede objekter).

## Udklækning og opvækst (tilføjet 9. okt. 2026)

- Run starter med en animation, hvor spillerens dino klækker fra sit æg.
- Dinoen vokser fra baby til voksen i flere trin (fx baby → ung → halvvoksen → voksen).
- Uafklaret:
  - Hvad udløser et trin (kød, level, boss)? Ændrer trinet størrelse, HP, evner og hitbox?
  - Hvordan påvirker det balancen (tidlige baner sværere, sene lettere)?
  - Starter man altid som baby, eller er "baby-start" en sværhedsgrad,
    der giver mere XP eller flere mutationer gennem et run?
- Kræver nye sprites for hvert trin pr. art; kunne starte med én art som prøve.

## Deinosuchus som spiller

**Bygget:** separat pakke på `codex/sprites-and-mechanics`: eksisterende levende, ådsel- og skeletsprites genbruges. Endelig teststatus fremgår af `SPRITES_AND_MECHANICS_STATUS.md`.

## Bygget i opfølgningspakken 10. oktober

- Deinonychus gratis starter og finte med fem egne mutationstier; gamle valg/DNA bevares.
- Idempotente specialdrab, én episk pr. albino/elite, diætfiltre også ved valg.
- Compy-indkaldelse/gruppekrav, territoriale reder og drabsgatet fødecache.
- Varieret planteføde, giftige svampe med advarsel og rolig effekt.
- Førstegangssprogvalg, pauset build-visning og afstand mellem faste fund.
- Separate HUD-hoveder og fem artsangreb er **integrerede prototyper**; visuel slutpolering er åben.

## Del A — bygget og browser-testet som prototype

- Fem artsangreb / 120 frames: Ankylosaurus’ 24 oprindelige halesving genbruges;
  Parasaurolophus’ 24 revision2-spark er aktive.
- 288 ecology-frames for ni arter: 276 aktive tegnede poses og 12 native fallbacks.
- 312 sårede gangframes for 13 arter: 88 nye keyposes, 224 originale frames.
  De 16 afviste keyposes beholdes som dokumenterede fallbacks.
- 48 jord-/sand-/vanddybde-tiles og 32 nye raptor-ådsler/skeletter.
- 632 tidligere behavior-studieframes bevares runtime-deaktiveret.

Dette er unapproved prototypes, ikke færdig produktionsgrafik. Den samlede browser-suite består;
GDJS-test og visuel produktionsgodkendelse er særskilte opgaver; A6 forbliver valgfri og åben.

## Næste grafiske forbedringer

- Størrelsestro Compy-skåneben; de nuværende tegninger blev afvist.
- De sidste fem Deinonychus-keyposes og enkelte Baryonyx/Carno/Trice-poses.
- Ens body-markeringer og shading på tværs af alle state-skift.
- Visuel vandkant-/tile-seam-polering på større kort og små skærme.
- Valgfrie lava/aske-tiles, pixel-HUD-chips og afstemte natpaletter.

B-mekanikker flyttes ikke til bygget før implementering og relevante tests.
Udklækning/opvækst forbliver en fremtidig idé med uafklaret balance.
- **Bygget:** Ankylosaurus gamle 24 halesving genbruges byte-identisk; ingen ny kropsform.
- **Bygget prototype:** under 30 % HP viser alle arter en asymmetrisk gang-/løberytme. Ingen ændring af skade, fart eller angrebstiming.
- **Review-only:** Parasaurolophus-spark revision2; eksisterende sources bruges som reference, men de nye frames er endnu ikke aktiveret.

## Nye arter og dyr (tilføjet 10. okt. 2026, Jonas' ønske)

Kun idéer, ikke godkendt. Alle kræver ny grafik fra ChatGPT (S/N/E/W, idle/walk/run/attack/hurt/death,
plus ådsel og skelet for dyr, der giver kød) og en art-QA før Codex integrerer dem.
"Bane" henviser til de nuværende biomer: skov (0), flod (1), plateau (2) og aske (3).

### Mulige nye spilbare dinosaurer

| Art | Rolle | Idé til evne / særpræg | Passer i |
|---|---|---|---|
| **Spinosaurus** | tung vandjæger | Kan svømme i dybt vand. Shift: "Sejlstød" skræmmer fisk op, så den fanger 2 ad gangen. Langsom på land. | flod |
| **Allosaurus** | mellemtung rovdyr | "Økseslag": overkæben hugger, og bid på blødende dyr giver ekstra skade. Står mellem Carnotaurus og T. rex. | skov, plateau |
| **Stegosaurus** | planteæder med pigge | Space er et halesving bagud med "thagomizer"-pigge. Flanker straffes, og den er svag forfra. | plateau |
| **Parasaurolophus** (spillet) | flokplanteæder | Shift: "Trompetkald" kalder 2 artsfæller, som løber med i 8 s. Hurtig og skrøbelig. | skov, flod |
| **Therizinosaurus** | mærkelig planteæder | Kæmpekløer: langsomme, men meget brede sving. Kan "rive" frugt ned fra høje træer (ny fødetype). | skov |
| **Pteranodon** (ikke en dinosaur, men en flyveøgle) | luftspejder | Hopper/glider over lava og dybt vand i 2 s. Kan ikke bære bytte, kun ådsler. En sjov "hemmelig" art. | alle |
| **Microraptor** | lille fjerjæger | Glid fra højt terræn, flimrende fjer forvirrer (kort usynlighed). Meget lav HP. | skov |
| **Pachyrhinosaurus** | flok-hornbærer | Panserknude i stedet for horn, og stød skubber dyr tilbage. Får bonus, når flokfæller er tæt på. | plateau, aske |
| **Oviraptor** | æggetyv | Kan tage æg fra reder (ny ressource). Hurtig flugt, svage bid. | skov, plateau |

### NPC'er til stemning og mad

**A. Byttedyr, der flygter (giver kød)**
- *Dryosaurus*: lille, hurtig planteæder i flokke på 3–6. Løber i zigzag og angriber aldrig. God tidlig føde.
- *Hypsilophodon*: hopper over sten, flygter mod tæt vegetation og gemmer sig i buske.
- *Leaellynasaura*: om natten (B2), store øjne der lyser svagt. Kun aktiv i mørke.
- *Protoceratops*: flygter først, men forsvarer sine unger ved reder (se B).

**B. Dyr der kun forsvarer sig (angriber ikke først, giver kød)**
- *Iguanodon*: rolig græsser. Bliver den angrebet, stikker den med tommelpiggen (kort telegraph) og går så sin vej.
- *Psittacosaurus*: lille flok, bider kun når man står helt tæt. Ellers ignorerer den spilleren.
- *Edmontosaurus*: stor flok ved floden, stamper i ring om ungerne. Rammer kun, hvis man går ind i ringen.
- *Archelon* (kæmpeskildpadde): langsom ved vandkanten, trækker sig ind i skjoldet (næsten usårlig), giver meget kød, hvis man er tålmodig.

**C. Ren stemning (giver intet kød, kan ikke angribes, som billerne i dag)**
- *Sommerfugle- og guldsmedesværme* over blomster og vand, der letter, når man løber igennem.
- *Små pattedyr* (Repenomamus-agtige) der piler ned i huller, når man nærmer sig.
- *Fiskestimer* der springer i floden (rent visuelt, adskilt fra de fiskbare stimer).
- *Flyveøgle-silhuetter* (Quetzalcoatlus) højt oppe, som en skygge der glider over kortet.
- *Kæmpe-tusindben* (Arthropleura-inspireret, fantasy) der kravler over stammer i skoven.
- *Frøer* der kvækker ved damme og hopper i vandet, og som forstummer under tørke (B4).
- *Askefugle/gnister* i askebiomet: små gløder, der hvirvler op, når store dyr går forbi.
- *Ildfluer* om natten (B2), der lyser svagt og samler sig ved vand.

**Designnoter**
- Stemnings-NPC'er skal være billige: ingen AI ud over "flygt fra spilleren" eller en fast bane, ingen kollision og højst ca. 20 synlige ad gangen (LOD som B3).
- Dyr, der kun forsvarer sig, bruger den eksisterende `herbivorousNPC`/`provoke`-logik: de bliver kun `alert`, når de selv bliver ramt.
- Nye byttedyr kræver ådsel- og skeletsprites ligesom de nuværende (`SPRITE_RULES_CORPSES.md`).
