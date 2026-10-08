# Bevarede fjendekilder og prompt-historik

Billedværktøjet genererede fire separate4×4atlasser. Hver art brugte sin gamle
South-stillpose som reference; Utahraptor-East og det nye Parasaurolophus-ark
var perspektivreferencer. Kolonner S/E/N/W, rækker klar/venstretrin/højretrin/
action. Prompts krævede strict dorsal overhead, upper-left light, transparent
background, fixed hip center, same anatomy/markings and no labels/grid.
Compy: olive/brown speckles, slender tail, tiny arms and lateral mandibles.
Parasaurolophus: brown/orange stripes, head crest, fleeing instead of biting.
Carnotaurus: red/brick scales, two horns, lowered braced head for charge.
Ankylosaurus: brown/gray armor rows, four short legs, tail club swept to the side.

compy_rejected_side.png var første forsøg; E/W var sideprofiler.
compy_rejected_gape.png var en perspektivkorrektion; sidegab bestod.
compy_sheet.png er sidste overhead-korrektion. E/W action-gab fra denne kilde
er stadig fravalgt i eksporten til fordel for dens hele lunge-/walkpose.
Carnotaurus række0/S er fravalgt pga. haleclipping. Ingen manglende dele er
tegnet ind i eksporteren. tools/export_enemy_animations.py fastlægger de
manuelt gennemgåede crops, anatomiske registrationer og dokumenteret genbrug.
Kilde-SHA256 gemmes pr.frame. Ingen kilder eller historiske pakker ændres.

North-Carnotaurus action fra række3 vendte forkert og er fravalgt. En hel
North-gangpose genbruges som bracet charge-pose. De største registreringsspring
for North-Compy/Parasaurolophus og Ankylosaurus er korrigeret med manuelt
gennemgåede hip-offsets, ikke interpolation eller ændret collision.
