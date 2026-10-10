# Primal Run – oversættelsesregler (alle sprog)

Dansk er kildesproget. Hver nøgle er den præcise danske tekst, og engelsk vises som reference.
Oversæt til det sprog, som spillere faktisk bruger i spil på det sprog. Brug ikke ordbogsoversættelser.

## Spilsprog, ikke ordbog
- Brug de udtryk, som oversatte spil og spillere bruger på sproget. Kendte lånord er i orden, hvor de er normen, fx "boss", "level-up", "XP", "DNA", "stamina", "seed", "HUD", "run" i roguelite-forstand og "crit".
- Brug oftest **imperativ og korte ord** i knapper og HUD ("START JAGTEN" → kort, kraftfuldt kald til handling, ikke en forklarende sætning).
- Brug sprogets normale UI-ord til menuer og indstillinger (Indstillinger/Settings, Lyd, Musik, Sprog, Pause, Fortsæt, Afslut, Hovedmenu, Tilbage). Brug dem, som spillere kender fra konsol-, pc- og mobilspil på sproget.
- Fortæl tingene, som et spil fortæller dem. Mutationer, bedrifter og titler skal lyde som perks, achievements og titler, ikke som en lærebog. Ordspil, der ikke kan oversættes, erstattes af et tilsvarende på målsproget.
- Bevar tonen: lidt vild, legende, dinosaurer på jagt. Titler i Hall of Shame må være sjove og drilske.

## Det må ikke ændres
- Pladsholdere: `#` (tal), `@` (tastnavn) og `{0}`/`{1}` skal stå i oversættelsen lige så mange gange som i kilden. `{0}`/`{1}` må gerne flyttes, så rækkefølgen passer til sproget. `#` udfyldes i rækkefølge, så `#` skal stå i samme rækkefølge som i kilden.
- Separatoren ` · ` (mellemrum, midterprik, mellemrum) skal bevares. Spillet oversætter tekst stykke for stykke ved ` · `.
- Symboler og ikoner (◆ ♛ ☀ ☾ ⚔ ⬡ ★ ❧ → ← ↻ ≋ ◎ ▼ » ✺ ◌), kortnavne som "SPACE", "SHIFT", "ESC", "WASD", "F", "E" og tal/enheder (m, km, %, s).
- STORE BOGSTAVER, hvor kilden er versaler (HUD-varsler, knapper). Brug almindelig skrift på sprog uden store bogstaver.
- Artsnavne er videnskabelige slægtsnavne: Compy/Compsognathus, Velociraptor, Utahraptor, Deinonychus, Carnotaurus, Ankylosaurus, Triceratops, Pachycephalosaurus, Gallimimus, Baryonyx, Deinosuchus, Tyrannosaurus rex og Parasaurolophus. Brug den gængse skrivemåde på målsproget (translitteration på ikke-latinske skrifter, fx ヴェロキラプトル og 迅猛龙).
- Bossernes fornavne (Palle, Carl, Benny, Doris, Asta, Tina, Karl, Ragnar, Mathias) beholdes, mens tilnavnet oversættes ("Carl - Skovens Vogter" → "Carl – Guardian of the Forest").
- Teknisk tekst som "Primal Earth 32", filnavne og URL'er.

## Længde og layout
- HUD og knapper skal være omtrent lige så lange som den engelske tekst. Mobillayoutet er 390 px bredt.
- Højre-til-venstre-sprog (arabisk, urdu) skrives naturligt RTL. Spillet sætter selv `dir="rtl"` på menuerne.

## Leveringsformat
- JSON-objekt: `{ "<dansk nøgle>": "<oversættelse>", ... }`, med alle nøgler fra kildefilen og UTF-8 uden escapes.
- En lille `GLOSSARY.md` pr. sprog med de 15–25 faste spilord, du har valgt (boss, level, mutation, DNA, stamina, run, achievement, skin osv.), så alle filer bruger samme ord.
