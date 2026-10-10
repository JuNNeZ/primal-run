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
- Separate HUD-hoveder og fire artsangreb er **integrerede prototyper**; visuel slutpolering er åben.

A3 har nu en timing-prototype med eksisterende poses, men tegnede skåneben-poses er åbne. A2, A4, A5 og endelig Parasaurolophus-sparkmatching forbliver åbne. De øvrige ideer og B-mekanikker flyttes ikke til bygget før de er implementeret/testet. Udklækning/opvækst forbliver en fremtidig idé.

## Del A — konsistensrettelse

- **Bygget:** Ankylosaurus gamle 24 halesving genbruges byte-identisk; ingen ny kropsform.
- **Bygget prototype:** under 30 % HP viser alle arter en asymmetrisk gang-/løberytme. Ingen ændring af skade, fart eller angrebstiming.
- **Review-only:** Parasaurolophus-spark revision2; eksisterende sources bruges som reference, men de nye frames er endnu ikke aktiveret.
