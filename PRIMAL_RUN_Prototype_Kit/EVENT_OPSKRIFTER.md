# Event-opskrifter — logik at bygge manuelt

Navnene nedenfor er vores projektkonventioner. Formlerne er pseudokode; vælg
GDevelops variable-actions og expression editor. Kopiér ikke hele tabellen ind
som et JavaScript-event eller project.json.

## Scenevariabler ved run-start

| Navn | Startværdi | Formål |
| --- | --- | --- |
| Playing | 1 | Alle gameplay-events kræver 1 |
| RunEnded | 0 | Død/vundet |
| Awarded | 0 | DNA må kun gives én gang |
| Health / MaxHealth | 100 / 100 | Liv |
| Stamina / MaxStamina | 100 / 100 | Pounce |
| XP / NextXP / Level | 0 / 8 / 1 | Level-system |
| Hunts | 0 | Antal dræbte fjender |
| RunTime / SpawnClock | 0 / 0 | Pausérbare ure |
| BiteCooldown | 0 | Tid indtil næste bite |
| PounceCooldown / PounceRemaining | 0 / 0 | Burst |
| TeethStacks / LegsStacks / FeatherStacks | 0 / 0 / 0 | Mutationer |
| Facing | S | Sidste retning som tekst |
| PrevX / PrevY | Player-position | Faktisk bevægelse |
| LevelUpOpen | 0 | Skeln level-up fra death-pause |

Global DNA starter på 0 og kan senere læses fra Storage. Fjenders objektvariabler
er HP, TouchCooldown, BleedRemaining, BleedTick og XPReward.

## Event-rækkefølge og actions

1. Scene-start: sæt startværdier, skjul GameOver/LevelUp UI, placér Player.
2. Playing=1: regn gameplay-ure og cooldowns med TimeDelta(). Nul-gulv for cooldowns.
3. Playing=1: WASD-controls, facing, pounce og movement; håndtér obstacle-kollision.
4. Playing=1: spawn og fjende-AI; fjendernes levende status skal kontrolleres.
5. Playing=1 + Space + BiteCooldown<=0: cooldown=0.55, HP-=1 for fjender i radius.
6. Bite med TeethStacks>0: BleedRemaining=2; BleedTick=0 på ramte fjender.
7. For each levende blødende Enemy under Playing=1: tick +=dt, remaining -=dt;
   hver 0.5 sekund HP -=0.5×TeethStacks. Reducér tick med 0.5 ved udløsning.
8. For each Enemy med HP<=0: Hunts+=1; XP+=XPReward; spawn Meat; slet Enemy.
9. For each levende Enemy der overlapper Player og TouchCooldown<=0:
   Health -= TouchDamage; cooldown=1.2. Parasaurolophus giver ikke touch-damage.
10. Player overlapper Meat: heal maks 100; slet Meat. Spisning må ikke oprette mad.
11. Health<=0 og RunEnded=0: afslut, stop movement, tildel DNA én gang.
12. Health>0 + XP>=NextXP + Playing=1: XP-=NextXP; Level+=1; NextXP+=4;
    Playing=0; LevelUpOpen=1; stop behaviors/kræfter; vis overlay.
13. LevelUpOpen=1 + klik/tastvalg: øg netop én stack; luk UI; Playing=1.
14. RunEnded=1 + R eller restart-knap: genstart Game-scenen; bevar global DNA.
15. Opdatér HUD og gem PrevX/PrevY. Vis kun passende idle/walk state.

GDevelop evaluerer events løbende. Brug state-vagter og/eller Trigger once, hvor
en engangshændelse ellers kan gentages. Sletning af en død Enemy i samme event
forhindrer gentaget XP. Awarded forhindrer gentaget DNA. Genstart ikke walk hver frame.

## Mutationer

- Serrated Teeth: hvert bite sætter to sekunders bleed. Hver halve sekund giver
  bleed 0.5×TeethStacks skade. Ny bite fornyer varigheden.
- Powerful Legs: speed =160×(1+0.15×LegsStacks). To stacks er +30%, ikke +32.25%.
- Insulating Feathers: regen =18×(1+0.2×FeatherStacks) stamina/sekund.
- Pounce: speed×2.3 i 0.25 sekunder, pris 30 stamina, cooldown to sekunder.

Faste tre valg bruges i prototypen. En senere mutationspulje skal vælge tre
forskellige tilgængelige mutationer, inden UI vises, ikke randomisere hvert frame.

## Lokalt DNA og rewards

RunDNA = floor(Hunts/2)+floor(RunTime/15). Ved sejr lægges 10 til.
DNA += RunDNA én gang. I browserdemoen er sejr efter 60 sekunder, og lageret er
localStorage. I GDevelop bruger du global DNA plus Storage, ikke browser-JS fra demoen.
DNA er kun en tæller her. Unlocks skal bygges separat og må ikke forveksles med
stacks, der nulstilles ved hvert run.

## Senere events — konkrete simple prototyper

- Carcass: placér Meat ved en fossil-prop. Når spilleren nærmer sig, spawn to
  Carnotaurus efter tre gameplay-sekunder. Eventet markeres Used=1.
- Nest: brug nest_eggs. Ved interaktion og Used=0: tildel bonus-XP eller et ekstra
  mutationvalg; skift til nest_empty. Forbrug eventet én gang.
- Stampede: brug tre Parasaurolophus-stillbilleder, der bevæger sig mod samme
  kantpunkt. De er midlertidige hazards, ikke færdige løbeanimationer.
- Meteor Shower: tegn en advarselscirkel først. Vent ét gameplay-sekund, opret
  meteor_impact, lav én damage-check og slet advarslen. Warning og impact er adskilt.
- Alpha: spawn én Carnotaurus med øget HP og et synligt UI-navn; ikke tilfældig
  ukommunikeret ekstra skade.
- Boss: brug Deinosuchus eller T. rex-stillbillede som størrelse-/HP-placeholder.
  Start med én tydelig telegraphed charge eller bite, før flere angreb bygges.
- Escape: escape-ikon markerer en zone. Ved extinction sættes en nedtælling;
  overlap med zonen før nul giver sejr. Ingen af disse event/boss-systemer er koblet
  på browserdemoen endnu.

## Tjekliste før du går videre

- Samme diagonal og lige hastighed; ingen ekstra rotation af tegnede sprites.
- Facing bliver stående på stop; blokeret movement viser idle.
- Ét bite kan ramme flere fjender, men hver død giver kun én belønning.
- Cooldowns, AI, bleed, spawn og stamina stopper under level-up.
- Valg med 1/2/3 gælder kun under overlay; én handling giver én mutation.
- Restart nulstiller run-statistik/stacks og lukker UI; DNA bevares.
- Health stopper ved max, stamina stopper ved max, cooldowns stopper ved nul.
- Observer alle action-poser og tiles i rigtig spilstørrelse før de bruges bredt.
