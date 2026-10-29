# Naturlig økologi · 2026-10-11

`FEATURES.naturalEcology` (core.js, blok "Naturlig økologi"). Konstanter i `NATURE`.

- **Jagt mellem NPC'er:** sultne rovdyr (sult > 0,65) jager det, de kan vinde over. Det kan være ubevæbnede
  planteædere, eller bevæbnede når de er sårede eller alene og tydeligt svagere (×1,4). Panserdyr jages kun af
  T. rex eller når de er sårede. Højst 4 samtidige jagter. Aldrig over dybt vand/lava, aldrig albinoer, bosser
  eller redevogtere. Jagten bruger windup → bid → restitution med de eksisterende angrebsframes.
  Spillerens fare-telegraf vises ikke ved NPC-kampe.
- **Forsvar:** et bidt dyr husker angriberen. Bevæbnede dyr slår igen, så længe de har ≥ 35 % liv, og
  bevæbnede flokfæller inden for 260 px hjælper. Ubevæbnede flygter, og flokken spredes.
- **Ådsler:** lugten rækker 500 + 700 × sult px (op til +30 % for store lig). Rovdyr traver i 65 % fart og
  springer mad over, som rådner, før de når frem.
- **Store kødædere** æder kun, når hverken spilleren (ikke skjult) eller en højere rangeret kødæder er inden
  for 300 px af liget. Ellers venter de og holder øje fra 400 px. Er de tydeligt stærkere (×1,4), jager de
  de andre væk ("!"). Compys stjæler som før.
- **Kamp til døden:** kun når det lig, et rovdyr ventede på, er *rådnet* (ikke spist), og det ventende dyr er
  udsultet (sult ≥ 0,9). Ellers trækker det sig. Forsvareren flygter ved 35 %, medmindre den også er udsultet.
- **Spilleren først:** et dyr du rammer, som jager dig, eller som ser dig inden for 120 px, dropper sin egen
  kamp. Dyr i kamp er altså distraherede. En NPC-kamp inden for 700 px udløser ét brøl.
- **Baryonyx fisker** ved at vade hen til stimen (55 % fart), vente med hovedet nede (drink-pose) og snappe
  stående (angrebsframes). Fisk udløser ikke længere artsangrebet, så den skøjter ikke rundt.
- **Ydelse:** et 256 px-grid bygges én gang pr. step til nabosøgning. Byttesøgning sker hver 0,5 s pr. dyr.

## Måling (`node tools/ecology_sim.cjs [--off]`, 4 seeds × 240 s pr. bane)

En usårlig, vandrende spiller med rigtig `step()`.

| Bane | Naturlige drab/min før → efter | Dyr inden for 900 px (gns.) før → efter |
|---|---|---|
| 1 Flod | 0,56 → 1,63 | 22,3 → 23,8 |
| 2 Plateau | 0 → 2,19 | 19,2 → 18,0 |
| 3 Aske | 0,5 → 0,81 | 17,7 → 17,8 |

- Spawneren fylder op omkring spilleren, så bestanden falder ikke. Banerne behøver derfor ikke blive større.
- Én kamp til døden på 16 simulerede minutter: sjælden, som tiltænkt.
- CPU-tid pr. simuleret sekund steg 5–9 %.
- Bane 0 (åbningen) har ingen Carnotaurus i målingen, fordi simulatoren aldrig samler kød.

Tests: `tests/natural-ecology.test.cjs` (11) og `tests/natural-ecology-browser.cjs`.
Al grafik er genbrugte prototype_static-frames. Ingen nye sprites. GDevelop-runtime er IKKE kørt.
