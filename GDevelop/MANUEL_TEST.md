# Første test i GDevelop-editoren (5–10 minutter)

Åbn project.json i GDevelop 5.6.283. Kontroller at Game-scenen og alle 11 objekter
vises i objektlisten. Preview skal vise dinosaur, græs, fire sten og HUD uden
manglende ressourcer.

1. Hold hver af W/S/A/D og piletasterne nede, og slip. Walk skal skifte retning;
   ved stop bliver sidste retning stående som idle. Prøv også diagonaler.
2. Gå mod en sten og hver arenakant. Når du er helt blokeret, skal walk blive idle.
   Halen skal ikke blokere: collision er en fast 28×28 torso, uafhængigt af frame.
3. Hold Space nær en Compy. Den skal dø én gang, give 4 XP og efterlade én mad.
   Mad heler 14 HP, dog aldrig over 100. Hold Space uden fjender; cooldown er 0,55 s.
4. Efter to Compy-kills skal level 2 give ét valg blandt tre. Hold bevægelse, Space
   og Shift, og vent mindst fem sekunder: alle fjender, HP, stamina, tid, spawn,
   mad, bleed og player/bite-animation skal stå stille. Hud må vise valget.
5. Tryk 2 og hold tasten et øjeblik: kun én ben-stack. Vælg ben igen ved næste
   level: to stacks giver +30% fart. 1 giver bleed, +0,5 skade pr. tick pr. stack;
   3 giver +20% stamina-regeneration pr. stack. Shift koster 30 stamina.
6. Efter 10 s kan en Parasaurolophus komme: den flygter og skader ikke. Efter 20 s
   kan Carnotaurus komme: 3 HP, 65 fart, 18 kontaktskade og 8 XP. Tænder-bleed er
   især synlig på disse mål med flere HP.
7. Lad HP nå 0. Gameplay fryser, death-tekst vises, og DNA tildeles én gang.
   Vent og hold Space: ingen ny XP/DNA. R starter med 100 HP, level 1, 0 XP,
   0 stacks, én Compy og to mad; gamle objekter må ikke blive hængende.
8. Gentag R både under mutation og efter death. DNA bevares ved restart og ved
   reload i samme browserprofil. Nyt/privat browserlager kan starte på 0.

Grafisk editor-Preview på din maskine og subjektiv walk/anatomi er fortsat
manuelle kontroller. Cloud-tests certificerer ikke produktionsanimationer.
