# PRIMAL RUN — klar til 6. oktober 2026

1. Pak **hele ZIP-filen** ud. Bevar `assets/` og `sounds/` ved siden af `project.json`.
2. Start **GDevelop 5.6.283** (eller nyere). Vælg **Åbn projekt / Open a project → Åbn fra din computer** og vælg `project.json` i `PRIMAL_RUN_GDevelop/`.
3. Åbn scenen **Game** og tryk **Preview**. Du skal ikke bygge events eller importere PNG'er enkeltvis.

| Tast | Handling |
| --- | --- |
| WASD eller piletaster | Bevæg Utahraptor |
| Space | Bid; kan holdes nede |
| Shift | Kort spring, koster stamina |
| 1 / 2 / 3 | Vælg én mutation, når spillet pauser |
| R | Nyt run |

Compy giver 4 XP. Første level kræver 8 XP. Under mutationsvalg fryser bevægelse,
fjender, skade, spawns, mad, bleed, stamina og animation. Ben, tænder og fjer kan
stackes. Mad heler 14 HP. Parasaurolophus kan spawne efter 10 sekunder;
Carnotaurus efter 20. Alle tal kommer fra den medfølgende `balance.json`.

Der er en lille arena, som fortsætter til death. R nulstiller run og mutationer;
DNA fra afsluttede runs gemmes lokalt i denne browsers lager. Der er ingen
unlock-menu, kontosynkronisering eller 60-sekunders sejr i dette GDevelop-projekt.

**Verificeret:** reel GDevelop 5.6.283 JSON-indlæsning, serializer, HTML5-export og
Chromium-runtime i cloud. Screenshots og testbevis ligger i `reports/`.
Desktop-editorens brugerflade er ikke kørt; lav også den korte manuelle test i
`MANUEL_TEST.md`, første gang du åbner projektet på din computer.

**Art er stadig prototype.** North har drejet lys, walk har variation, og action-
poser er uændrede studier. Spillet bruger idle/walk samt separat bite-effekt.
De otte WAV-placeholderlyde er importeret, men endnu ikke koblet til gameplay.

Vil du kun prøve den færdige HTML5-export, kan `export/` serveres lokalt, fx med
`python -m http.server 8000` fra denne mappe og åbnes på
`http://localhost:8000/export/`. Dobbeltklik på export/index.html er ikke den
anbefalede start; brug GDevelop Preview.

Gem din egen projektkopi før redigering. Events ligger i Game og kan redigeres i
GDevelop. `src/` og `tools/build_project.py` er til reproducerbare udvikler-builds;
scriptet overskriver ændringer i project.json, så kør det ikke på din redigerede kopi.
