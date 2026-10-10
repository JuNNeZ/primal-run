# Fjendeanimationer — prototype-supplement

Følg de fælles sprite-regler, palette.json og de bevarede v1/v2-referencer.
Originale assets og kilder ændres ikke. Dette supplement udvider kit-reglens
South-only stillbilleder med separat genererede poses i S/E/N/W.

## Frameplan og størrelse

Alle nye fjende-PNGs bruger fast 128×128 canvas/origin64,64, så hele dyret kan
vende mod øst/vest uden at ændre canvas eller collision. Compy fylder færre
pixels end de andre. De gamle 64×96 og96×128 stillbilleder bevares byte-for-byte.
Fire tegninger pr. retning: klar, venstre gangtrin, højre gangtrin, action.
Walk looper klar/venstre/klar/højre ved8fps; planted-frames er bevidst genbrug.
Action er klar/action/klar; timing drives af den faktiske windup/strike/recovery.
Parasaurolophus bruger action som hurtig flugt, ikke som angreb.
Dette er en dokumenteret prototype-frameplan, ikke de fulde produktionsserier.

## Kilder og eksport

1254×1254 genererede 4×4 ark bevares. Der samples én pixel pr.3×3kildefelt,
uden smoothing/interpolation. Alpha>=192 bliver255, transparent RGB bliver0,
farver mappes til den eksisterende32palette. Kropspunkter registreres manuelt
med heltals-offsets i tools/export_enemy_animations.py og manifestet.
Gennemgåede udvidede crops bevarer haler, som overskrider nominelle celler.
Isolerede nabofragmenter fjernes gennem foreground-komponenter; bounding boxes
bruges til masken, aldrig til automatisk centrering af kroppen.

Carnotaurus South-klar fra række0 har afklippet hale og bruges ikke; en hel
walk-pose genbruges bevidst. Compy East/West-gab var for laterale; de fravælges
som kontaktposer, og et helt gangtrin bruges som en kort lungepose i stedet.
To fravalgte Compy-kilder er bevaret som rejected-filer, ikke game-assets.
Alle fire retninger er genereret; runtime roterer eller spejler ikke disse assets.

## Status

Alle nye billeder forbliver prototype_static, production_approved=false og
animation_ready=false. Små forskelle i markeringer, kropsform og registrering
består i de genererede poses. Komplet anatomi, lys og temporal godkendelse
mangler. enemy_review.html viser alle frames og loops ved1×/4× på begge
baggrunde. Tekniske checks og browser/GDevelop-resultater registreres separat.
Medfølg kildehistorik, manifest, animationer, palette og valideringsrapport.

North-Carnotaurus action fra række3 vendte forkert og er fravalgt. En hel
North-gangpose genbruges som bracet charge-pose. De største registreringsspring
for North-Compy/Parasaurolophus og Ankylosaurus er korrigeret med manuelt
gennemgåede hip-offsets, ikke interpolation eller ændret collision.
