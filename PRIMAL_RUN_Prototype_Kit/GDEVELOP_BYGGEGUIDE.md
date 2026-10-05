# GDevelop — byg den første kerne

Dette er en manuel byggeguide, ikke et automatisk importérbart projekt.
Knapnavne kan være oversat i din GDevelop-installation. De engelske søgeord er
med, så du kan finde funktionerne. Følg én milepæl ad gangen og Preview hver gang.

## 1. Projekt og scene

Create a project → Empty game. Slå Optimize for pixel art til. Navngiv scenen Game.
Brug 960×640 som første spilstørrelse. Hold kameraet fast og lav ét lille område.
Gem projektet lokalt i en mappe med en kopi af assets/.

Tilføj et Tiled Sprite med assets/environment/grass.png. Stræk objektets område
til 960×640; ændr objektets størrelse, ikke hver tiles billedskalering.
Brug scene-baggrunden eller en fast baggrund på laveste Z-order.

## 2. Player

Add a new object → Sprite → Player. Lav følgende animationer med præcis navn:
Idle_S, Walk_S, Idle_N, Walk_N, Idle_E, Walk_E, Idle_W, Walk_W.

Idle bruger én PNG. Walk importerer _000 til _005 i nummerorden fra assets/player.
Alle billeder er 128×128. Walk: 0.125 sekunder mellem billeder, Loop til.
Idle: ét billede; ingen særskilt idle-animation er lavet endnu.

Indstil origin på ALLE billeder i hver retning:

| Retning | Origin X | Origin Y |
| --- | --- | --- |
| S / ned | 64 | 72 |
| N / op | 64 | 56 |
| E / højre | 68 | 64 |
| W / venstre | 60 | 64 |

Brug animation_manifest.json som facit. Positionen er en fast gameplay-pivot;
halens omrids må ikke styre kollision. Lav en lille ens torso-hitbox centreret
om origin i alle otte animationer. Bevar samme verdensareal ved retningsskift.
Brug ikke automatisk collision fra hele dinosaurens silhouette.

Tilføj Top-down movement i Behaviors. Max speed 160. Start med acceleration
og deceleration 1000 for en hurtig respons. Slå Rotate object fra; vi vælger
tegnede retninger. Slå Default controls fra og brug egne WASD-events.
Placér Player cirka X=480, Y=320.

## 3. Bevægelse og retninger

Lav scenevariablerne fra EVENT_OPSKRIFTER.md. Første scene-start sætter Playing=1,
Facing="S", Health=100, Stamina=100 og de øvrige startværdier.

Lav fire events med betingelsen Playing=1 plus tast holdt:
W → simulate Up control, S → Down, A → Left, D → Right i Top-down movement.
Tilføj eventuelt piletaster som alternative betingelser. De præcise action-navne
findes under Player → Top-down movement → controls.

Gem Player-position i PrevX/PrevY ved slutningen af hvert frame. Efter movement
sammenlignes den faktiske nye position med de gemte værdier. Hvis positionen
ændres, vælg Walk_ + Facing. Ellers Idle_ + Facing. Behold Facing ved stop.
Opdatér Facing fra retningen; ved diagonal input vinder lodret input i denne demo.
Skift kun animation, når navnet faktisk ændres, så den ikke genstartes hvert frame.

Ordnen for behavior-opdatering og dine events skal kontrolleres i Preview: en
blokeret Player skal vise idle. Brug eventuelt behaviorens moving-condition
sammen med kontrollen af faktisk position efter obstacle-separation.

Test: fire retninger, diagonaler uden højere hastighed, stop, væg/sten, restart.

## 4. Compy og jagt

Lav Sprite Compy med assets/enemy/compy_idle_S_000.png fra den eksisterende demo.
Den bruger origin 32,54. Den nye alternative Compy i assets/enemies bruger en
anden tegning og origin 32,48; bland ikke disse origins.

Giv Compy objektvariabler HP=1, TouchCooldown=0, BleedRemaining=0, BleedTick=0.
Lav en Enemy-gruppe, så senere arter kan deles om combat-events.
Placér én Compy. Brug en instant force mod Player med hastighed 44 som første
AI-placeholder. På den unge Parasaurolophus kan kraften i stedet pege væk fra
Player, når spilleren er tæt på. Brug fast collision; stød ikke halen mod alt.

Spawn først efter 3.2 sekunder og højst otte fjender. Brug en scenevariabel
SpawnClock += TimeDelta() kun mens Playing=1. Ved spawn nulstilles den. Dette
pauser spawn sikkert under level-up uden at lade en real-time timer løbe videre.
Start med fire faste kantpunkter, fx (106,220), (852,272), (580,110), (378,554).

## 5. Bite, health og mad

Space holdt/trykket plus Playing=1 plus BiteCooldown<=0 giver ét bite.
Sæt BiteCooldown=0.55. For each Enemy inden for 74 pixels fra Player: HP -= 1.
Dette er en cirkulær demo-hitbox. Retningsbestemt bite kan komme senere.
Opret BiteSlash på Player-position; afspil de fire VFX-frames ved 0.1 sekunder
og slet objektet, når animationen er færdig. VFX er separat fra damage.

Når Enemy.HP<=0: giv XP, opret Meat på fjendens position, og slet Enemy i samme
event. Brug For each Enemy, så hver død tælles én gang. Kollision med Meat:
Health = min(100, Health+14), slet Meat. Hold kode/events for XP og mad adskilt,
så mad ikke utilsigtet giver XP flere gange.

Ved overlap med en levende fjende og dens TouchCooldown<=0: Health -= 12,
TouchCooldown=1.2. Regn cooldown ned med TimeDelta() kun under Playing=1.

## 6. XP og tre mutationer

Compy giver 4 XP. Første NextXP er 8. Når XP>=NextXP og Playing=1 og Health>0:
XP -= NextXP, Level += 1, NextXP += 4, Playing=0, vis tre knapper og overlay.

UI lægges på eget lag. Brug Text til navne og forklaring, Sprite til de tre ikoner
assets/ui/serrated_teeth.png, powerful_legs.png, insulating_feathers.png.
Paneler, knapper og barer kan laves som enkle farvede rektangler; ingen store
panelillustrationer behøves for at teste gameplay.

Knappen/tast 1 øger TeethStacks; 2 øger LegsStacks; 3 øger FeatherStacks.
Hvert valg skjuler overlay og sætter Playing=1. Gennemfør kun valget, når
Playing=0 og level-up er åben, så et holdt input ikke vælger flere gange.
Hvis opsparet XP stadig er over næste tærskel, åbn næste level-up bagefter.

Mutationernes tal står i balance.json og EVENT_OPSKRIFTER.md. Lad AL gameplay
have Playing=1 som overordnet betingelse: bevægelse, AI, spawn, cooldowns,
bleed, stamina, event-klokker og damage. UI-input skal fungere under pausen.
Sæt bevægelseshastighed/kraft til nul eller deaktivér bevægelsesbehavior under
pausen, så tidligere kræfter og acceleration ikke fortsætter af sig selv.

## 7. Death, restart og DNA

Health<=0 sætter Playing=0 og RunEnded=1. Vis Run ended og en restart-knap.
Gem/tilføj DNA én gang med Awarded=1 som vagt. Reset alle run-variabler ved R
eller ved genstart af scenen, men bevar global DNA.

Start med DNA som global tæller. Tilføj lokal Storage-læsning ved spilstart og
Storage-skrivning ved run-slut bagefter. En global variabel alene gemmer ikke
mellem lukninger. Test lagring ved at lukke og åbne spillet igen.

## 8. Pounce og UI

Shift + Playing=1 + Stamina>=30 + PounceCooldown<=0: Stamina -=30,
PounceRemaining=0.25, PounceCooldown=2. I de 0.25 sekunder er bevægelseshastigheden
2.3 gange normal hastighed. Regeneration: 18×(1+0.2×FeatherStacks) per sekund,
med maksimum 100. Dette er en hastighedsburst; ingen hop-fysik er implementeret.

Health-/XP-/staminabarer er separate baggrundsrektangler og farvede fill-objekter.
Sæt fill-bredde fra den aktuelle værdi, fx 190×Health/100. Lad UI-laget følge
skærmen. Brug native pixels og heltalsplacering; undgå jævnt zoom som slører art.

## Officielle referencer, hvis internet er tilgængeligt

- Top-down basics: https://wiki.gdevelop.io/gdevelop5/tutorials/topdown-shooter/
- Egen control/rotation: https://wiki.gdevelop.io/gdevelop5/tutorials/roadrider/
- Sprite animationer: https://wiki.gdevelop.io/gdevelop5/tutorials/endless-runner/
- Spawn-ur: https://wiki.gdevelop.io/gdevelop5/tutorials/geometry-monster/9-adding-bombs/

Guiden bruger egne spiltal og event-opskrifter; linksene understøtter de relevante
GDevelop-funktioner. Browserdemoens testresultat er ikke en GDevelop-runtime-test.
