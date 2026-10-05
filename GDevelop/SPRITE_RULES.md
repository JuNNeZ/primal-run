# PRIMAL RUN — prototype-kit sprite-regel

Følg de medfølgende v1/v2-referencefiler. Bevar alle tidligere pakker.
Dette kit udvider den faste palette fra 24 til 32 farver med otte fælles
UI/VFX-accenter. De oprindelige farver ændres ikke. Ingen asset må bruge farver
uden for palette.json.

PNG: native RGBA, lossless, alpha 0/255, transparent RGB=0. Fritstående objekter
har mindst to pixels luft. Terræn er 32×32 og opaque. Nearest-neighbor ved
eksport/skalering; heltalsplacering; ingen smoothed rotation.

Manifestet fastlægger størrelse, source-crop, origin og prototype-status.
Animationer/pose-studier har faste canvasser. Gamle walk-origins bevares:
S64,72; N64,56; E68,64; W60,64. Collision må ikke følge haler/animationsomrids.

Walk: seks frames, 8fps. North er den aftalte prototype-drejning af South,
inklusive drejet lys. Denne undtagelse skal løses før produktionsgodkendelse.
Nye fjender eksporteres kun som South-stillbilleder med overhead-perspektiv.
Sideprofiler og forkert vendte celler fra enemy-kildearket er fravalgt.

Action-tegninger er pose-studier. Der er variation i kropsdetaljer, skala og
anatomisk registrering mod walk. De er ikke godkendte animationer. Brug eventuelt
en enkelt bite/hurt/corpse-pose, indtil serien er gennemgået i spillet.
VFX er fire non-looping prototypeframes ved 10fps; tjek effektens størrelse i spillet.
UI-ikoner er 32×32; barernes fill og tekst bygges som separate funktionelle objekter.

Kildeark bevares. Manuelt gennemgåede cropgrænser og udskillelse af nabofragmenter
bruges ved eksport. Stillbilleder kan beskæres omkring deres isolerede omrids,
men walk/action-frames må ikke automatisk recentreres efter bounding box.

Vurdér farver, anatomi, skala, silhuet, fixed pivot, frame-overgange og repeat-tiles
på lys og mørk baggrund. Tekniske kontroller er ikke en visuel godkendelse.
Browser-tests dækker kun browserdemoen; GDevelop-runtime er IKKE testet.
Alle assets forbliver prototype_static / production_approved=false.

For denne native GDevelop-leverance er faktisk export/runtime testet; se STATUS.md og reports/runtime-tests.json. Det ophæver ikke nogen visuel gate eller production_approved=false. Den oprindelige kit-status ovenfor er bevaret som reference.
