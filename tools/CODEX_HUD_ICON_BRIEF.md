# HUD-ikoner: brief til Codex (2026-10-21)

Tegn de ikoner, spillet mangler. I dag er mange HUD-ting tekst-glyffer (★ ◆ ⚡ ◐ ⬡ …), og 190 mutationer deler
10 ikoner. Det nye loot-system (relikvier, sæt, held) har ingen ikoner endnu. Du tegner kun billeder. Claude
kobler dem på i koden bagefter, så du skal ikke ændre `src/*.js`.

## Regler (gælder alle ikoner)

- **Palet:** kun Primal Earth 32 fra `PRIMAL_RUN_Game/palette.json`. Ingen andre farver, ingen anti-aliasing, ingen
  halvgennemsigtige pixels (alfa er 0 eller 255).
- **Stil:** samme som `assets/ui/armor.png` og `assets/a6_hud/reroll.png`. Top-down/front-ikon, 1 px kontur i
  `#151b19`, lyskilde oppe til venstre, tydelig silhuet der kan læses i 1x på mørk og lys baggrund.
- **Størrelser:** `32` = kort-/listeikon (som `assets/ui/*.png`), `24` = HUD-ikon (som `assets/a6_hud/*.png`),
  `16` = lille chip (som `assets/run_extras/affix_*.png`). Tegnes i native størrelse, aldrig nedskaleret.
- **Rarity-farver** (rammer/glød, hvor det står): Almindelig `#e8ece1`, Usædvanlig `#799447`, Sjælden `#69a4a0`,
  Episk `#bb80d9`, Legendarisk `#dfbc52`.
- **Filer:** `PRIMAL_RUN_Game/assets/hud_icons/<gruppe>/<id>.png` (gruppe = bogstav-navnet nedenfor, fx `relics`).
- **Manifest:** `PRIMAL_RUN_Game/hud_icons_manifest.json` med én post pr. fil: `file`, `size`, `group`, `id`,
  `palette: "Primal Earth 32"`, `status: "prototype_static"`, `source` (hvordan den er lavet).
- **Review-ark:** `PRIMAL_RUN_Game/previews/hud_icons_review.png` med alle ikoner i 1x og 4x på mørk (`#101713`) og lys
  (`#e8ece1`) baggrund, med id under hvert.
- **Status:** alt er `prototype_static`. Intet bliver godkendt, før Jonas har set review-arket.
- **Gren:** `codex/hud-icons` fra `origin/integration/next`, draft PR tilbage til `integration/next`. Kør
  `python tools/rebuild_generated.py` og `npm run validate:game-sprites`, og læg testoutput i PR'en.

## Rækkefølge

Tegn i denne rækkefølge, og lav en PR pr. to-tre grupper, så Jonas kan se dem undervejs. A–D bruges af loot-systemet
med det samme. E–H erstatter gamle tekst-glyffer. I er nye ting, som ikke bruges endnu.

### A. Relikvier (`relics`) – 10 stk., 32 + 16

Hver i 32×32 (kort) og 16×16 (HUD-chip, fil `<id>_16.png`). Lille rarity-farvet ramme eller glød i 32-versionen.

| id | Navn | Rarity | Motiv |
|---|---|---|---|
| osteoderm_plates | Osteodermplader | Sjælden | tre overlappende knogleplader med knopper |
| horn_shield | Hornskjold | Sjælden | buet hornplade som et skjold |
| club_knob | Køllehaleknude | Episk | ankylosaurus' halekølle set fra siden |
| feathered_arms | Fjerarme | Sjælden | lille fjerklædt raptorarm med klo |
| keen_eye | Skarpt øje | Sjælden | gult krybdyrøje med lodret pupil |
| sickle_claw | Seglklo | Episk | stor buet raptor-fodklo |
| gizzard_stones | Kråsesten | Sjælden | tre glatte mavesten i en lille bunke |
| fat_hump | Fedtpukkel | Sjælden | rund pukkel/fedtdepot med lyst skær |
| display_crest | Visningskam | Episk | farvestrålende hovedkam (parasaurolophus-agtig) |
| meteor_shard | Meteorsplint | Legendarisk | sort-glødende meteorsten med guldrevner |

### B. Sæt-emblemer (`sets`) – 4 stk., 24

`set_armor` (Panser: skjoldplade), `set_hunter` (Jæger: klo + øje), `set_survivor` (Overlever: hjerte i knogle),
`set_joker` (Meteorsplint-stjerne, bruges når den tæller i et sæt). Samme ramme for alle fire, så de ligner et sæt.

### C. Held og loot (`loot`) – 6 stk.

| id | Str. | Motiv / brug |
|---|---|---|
| luck | 24 | held-stat i HUD: firkløverblad lavet af tre bregneblade + lille stjerne |
| luck_card | 32 | mutationen "Heldig" og lab-sporet "Heldig stamme" (samme motiv, større) |
| armor_points | 24 | panser-point i HUD (skjoldplade med tal-plads til højre) |
| nest_cache | 32 | rede-kiste: rede af grene med æg og glimt |
| relic_drop | 24 | relikvie på jorden (lille glødende sten), farves af koden |
| reel_frame | 24 | 9-slice ramme til den rullende afsløring: 8 px hjørner, 8 px kanter, midten transparent |

### D. Rarity-ædelsten (`rarity`) – 7 stk., 16

Erstatter • ◆ ✦ ★ ♛ ❂ ♜ på kortene: `common`, `uncommon`, `rare`, `epic`, `legendary`, `evolution` (`#dfbc52`, spiral),
`trophy` (`#de954a`, lille tårn). Samme facetform, stigende antal facetter fra common til legendary.

### E. Mutations-tags (`tags`) – 6 stk., 16

Erstatter ⚔ ⛨ » ✧ ● ✸: `attack` (tand), `defense` (skjold), `speed` (fodspor med fartstreg), `ability` (gnist),
`food` (kødstykke), `crit` (kløspids med glimt).

### F. Flere mutationsikoner (`mutations`) – 14 stk., 32

Nu deler 190 mutationer 10 ikoner. Tegn disse temaer, så Claude kan fordele dem:
`bleed` (bloddråbe + tandmærker), `crit_claw` (tre kløstriber), `tail` (halesving), `horn` (næsehorn), `frill`
(nakkeskjold), `fish_hook` (fiskekrog af knogle), `plant` (bregneblad), `iron_stomach` (mave med jernbånd),
`pack_call` (to raptorhoveder), `roar` (åben kæbe med lydbuer), `pounce` (spring-bue), `stealth` (halvt lukket øje),
`carrion` (ribben), `ability_spark` (stamina-lyn i cirkel).

### G. HUD- og menu-glyffer (`ui`) – 13 stk., 24

`sneak` (◐), `ability_stamina` (⚡), `dna_lab` (⬡), `species_book` (❧), `title_book` (❦), `records` (♛),
`challenges` (⚔), `settings` (⚙), `achievement` (🏆), `rival` (☠, lille dinokranie), `toxic` (⚠, svamp med
advarsel), `ash` (☄, meteor), `locked` (🔒, hængelås af knogle).

### H. Sværhedsgrad (`difficulty`) – 2 stk., 24

`normal` (grønt blad) og `extinction` (meteor over en skyline af vulkaner). Ekstinktion giver mere held, så det må
gerne se farligt men lokkende ud.

### I. Nye ikoner, som ikke bruges endnu (`future`) – 8 stk., 24

Til de idéer, Jonas vil have bygget senere: `amber_chip` (rav-valuta), `fossil_chip` (fossil-valuta), `iridium_chip`
(iridium-valuta, mørk metal-glans), `tar_totem` (tjæregrav-totem), `rotten_meat` (råddent kød med grønne fluer),
`bounty_target` (sigtekorn over fodspor), `daily_hunt` (kalender med klo-mærke), `extinction_pressure` (termometer
med meteor).

## I alt

A 20 filer (10 × 32 + 10 × 16), B 4, C 6, D 7, E 6, F 14, G 13, H 2, I 8 = **80 PNG-filer**.

## Når du er færdig

Skriv i PR'en hvilke grupper der er med, læg review-arket ved, og sig hvilke ikoner du selv er mindst tilfreds med.
Claude kobler dem på bag de eksisterende flag (`FEATURES.relics`, `lootTables`, `lootReveal`), og indtil da bruger
spillet de nuværende glyffer.
