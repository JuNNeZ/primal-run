# Utahraptor-angreb — supplement til de fælles sprite-regler

Følg også SPRITE_RULES.md og de medfølgende v1/v2-regler. Originale kit-assets,
historiske pakker og kildeark ændres ikke. Nye angreb ligger i player_combat/.

## Frameplan

Bid bruger seks frames ved 14 fps i stedet for den oprindelige 4-frame/10fps-plan:
klar, optakt, åbent gab, kontakt, recoil, klar. Det er et non-looping angreb.
Frame 3 udløser skaden én gang; frame 5 genbruger bevidst frame 0 som returpose.
Quick Jaws skalerer animationens varighed og kontaktøjeblik med samme faktor.

Fire retninger, hver med separat genereret kilde. De nye North-angreb er ikke
roterede South-frames; den gamle North-walk beholder sin kendte lysbegrænsning.

## Eksport og registrering

Alle game-PNGs er 128×128, lossless RGBA, binær alpha og nul transparent RGB.
Den eksisterende faste 32-farvepalette bruges. Ingen smoothing eller roterede
angrebsframes. Origins er S64,72 / N64,56 / E68,64 / W60,64; kropshitboxen
er den samme radius16 uanset animation. Spritepositioner tegnes ved hele pixels.

Genererede kilder er 4× atlasser. Eksporten bruger nearest-neighbor sampling,
en dokumenteret alpha-grænse og mapping til paletten. Det er eksport-normalisering,
ikke nye tegnede eller interpolerede poses. Kilderne bevares byte-for-byte.
Hoftepunkterne registreres med eksplicitte heltals-offsets; silhuetens bounding
box bruges ikke til at recentrere hver pose. Source crop og offset findes i
player_combat_manifest.json. Østkontaktens snude overskrider den nominelle
arkcelle; et gennemgået udvidet crop bevarer den og udelukker den fra naboframen.

## Kvalitet og status

De oprindelige øst/vest-forsøg havde en overdrevet sideprofil i åbent-gab-framen.
De blev fravalgt og rettet med billedværktøjet. De fravalgte kildeark ligger som
candidate-filer og er ikke game-assets. Eksporten indeholder kun de rettede ark.

player_review.html viser alle frames ved 1× samt animationer ved 4× på mørk og
lys baggrund. Her sammenlignes også med den tidligere idle-pose. Retning, gab,
padding og registrering er gennemgået, men kropsform/striber har stadig mindre
variation mellem genererede poses, og overgangen til den gamle walk-serie kræver
videre forfining. Fuld anatomisk, temporal og stilistisk brugerreview mangler.

Alle nye billeder forbliver prototype_static, animation_ready=false og
production_approved=false. Runtime-test gør dem ikke produktionsgodkendte.
Ved levering medfølger palette, begge manifests, source/prompthistorik,
player_sprite_validation.json og player_animation_runtime_report.json.
