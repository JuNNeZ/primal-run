# Den store overhaul (oktober 2026)

Godkendt af Jonas: M2, M4, M5, G1–G11, A1–A6, B1–B5, P1–P5, L1–L5 + procedurale baner.
Alt ligger på branchen `claude/overhaul`. Hver fase er sin egen commit.

## Del A — genbrug af Ankylosaurus, 10. oktober

Den nye halesvingsgeneration skiftede kropsbredde, rygplader og haleproportioner og er forkastet. De 24 bevarede player_full-angrebsframes kopieres nu byte-identisk til artsangrebsoverlaget for både spiller og NPC. Oprindelige PNGs og rå kilder er uændrede; manifests validerer lighed og hashes. En manglende hit-flash på artsangreb er også rettet.

A3 fortsætter med en timing-baseret halteprototype under 30 % liv i alle walk/run-serier. Den ændrer kun dwell-tid for eksisterende poses; særskilte tegninger med skånet ben, A2 ecology-poses, A4 vandtiles og A5 raptorådsler er stadig åbne. Parasaurolophus revision2 er et native review-udkast med tydeligere spark, ikke et aktivt runtime-overlag. Se part_a_review.html og SPRITE_RULES_LIMP.md.

GitHub API-afvisningen kan ikke sidestilles med et bekræftet udløbet token: api.github.com mangler i det observerede netværksallowlist. Miljøkladden har nu api.github.com og det eksisterende cdn.playwright.dev. Den skal gemmes/publiceres, og API-operationen genprøves; Git-push påvirkes ikke.

## Rettelser
- Låsning ved start/næste bane: tegne-loopet overlever fejl, klik venter ikke på lyd,
  billeder hentes med timeout og genforsøg, manglende terrænbilleder kaster ikke fejl.
- Albino-/elite-ådsler beholder farven. Planteædere ser ikke "SPIS" ved kød.
- Episk genom gives straks, på egen skærm, for at nedlægge en albino, elite eller rival.

## Kamp og balance
- Kun kritiske træf stagger (8 % basis). Nye mutationer: Skarpe kløer, Rovdyrinstinkt, Knoglebrud.
- Bosser: kritiske træf fylder et brud-meter (1,2 sek. "BRUDT"), sigtet drejer i starten af
  opladningen, fase 2-stormløb styrer lidt efter dig, og et "SVING" straffer, hvis du står bag den.
  Bonus fra den åbne flanke er sænket fra +50 % til +25 %.
- Stamina: langsommere genopfyldning (9/s, 5/s i kamp), 1,5 sek. pause efter en evne, "forpustet"
  under 8 stamina. Dyrere evner for de store arter.
- Én valgfri rival (miniboss) pr. bane langt fra start, markeret med ☠.
- Første bane kræver 18 føde (før 12), så der er tid til at lære styringen.

## Dyrenes adfærd
- Sult: mætte dyr hviler/græsser, sultne tager chancer, rovdyr går efter ådsler og jager bytte.
- Byttedyr løber, til de ikke kan se dig, og er på vagt i 20–30 sek. Flokken flygter samlet.
- Sårede compys/carnoer/baryonyx/pachyer trækker sig, heler og vender tilbage.
- Compys stjæler mad tæt på dig og løber; de angriber kun i flok og sultne.
- Som planteæder bliver andre planteædere neutrale (advarsel, ikke angreb).
- Naturlige jagtscener; byttet giver et ådsel, men ingen DNA til dig.

## Baner
- Kortene er 1,4× større og delt i 5–6 navngivne områder pr. bane (fx Lysningen, Bregnekrattet,
  Urskoven, Mosesumpen). Hvert område har egne dyr, egen tæthed af planter/klipper/mudder og
  en skjult belønning. Første besøg i et nyt område giver 1 DNA.
- Dybt vand i floden kan kun krydses ved vadesteder (svømmere og store arter undtaget).
  Lavasprækker brænder. Aske gør dig langsommere. I kløften kan du ikke gemme dig.

## Progression
- DNA-arter: Utahraptor 60, Pachycephalosaurus 80, Carnotaurus 140, Ankylosaurus 170.
- Arter via bedrifter: Compy, Gallimimus, Baryonyx, Triceratops og T. rex.
- 16 bedrifter (achievements) og tre farvedragter. Gamle gemte spil beholder deres arter.

## Grafik og menu
- HUD-kort med portræt, level-ring, segmenteret liv og et mærke for evnens pris.
- Varsler fyldes op under opladningen og har et symbol pr. angrebstype.
- Skygger, skyskygger, lys pr. bane, pollen/støv/aske/regn, vignet (slås fra ved reduceret bevægelse).
- Angrebseffekter pr. art (kløer, horn, skalle, næb, hale, bid). Gule kritiske tal. "UNDVIGET".
- Hovedmenu: den rigtige verden kører bag en vippet 3D-visning. Intro med tre billedkort.

## Sprog
Dansk, engelsk, tysk, svensk, norsk, japansk og kinesisk. Klingon og sindarin er "for sjov"
og delvise (resten vises på engelsk). Tabellerne ligger i `tools/i18n/`; kør
`python tools/i18n/build_lang.py` og derefter `npm run build:game`.

## Kendte begrænsninger
- Nye tegnede sprites (fx rigtige hornstød-animationer, flere idle-animationer, babyer) er
  ikke lavet; effekterne er kode-tegnede. Se `MISSING_SPRITES.md`.
- Simulator-bots er ikke mennesker. Brug `tools/playstyle_sim.cjs` til at sammenligne.

## Fortsættelse: sprites og mekanikker

Branch `codex/sprites-and-mechanics`, baseret på denne overhaul. Deinosuchus tilføjes som spiller; A1–A6 og B1–B8 spores separat i `SPRITES_AND_MECHANICS_STATUS.md`. Tidligere ufærdige Deinonychus- og terrænændringer er bevaret på `codex/preserved-feathered-starter` og ikke automatisk flettet ind. Live-siden ændres ikke.

## Opfølgning 10. oktober: Deinonychus og del A-prototyper

Deinonychus er gratis fjerklædt startart med finte, egne fem rariteter og bevarede saves; Deinosuchus låses stadig op via Doris. Albino/elite-drab giver én episk belønning hver, og både valg og tilbud bruger samme arts-/diætfilter. Compys kalder eksisterende venner og venter på fire; reder forsvares og belønnes først efter vogterens død. Planteføde er varieret og har otte egne props med giftadvarsel/reduceret bevægelse.

Førstegangssprogvalg har de syv fuldt oversatte sprog i egne navne. Pause → Dit build viser mutationer/rang/raritet og fryser simulationen. Separate 240 HUD-hovedposes dækker alle12spillere; fire A1-arter har96angrebsframes med egne våben og gamle fallbacks. Verdens-idle holdes stabilt, og gang/sprint deler benfase.

Grafikken er prototype, ikke produktionsgodkendt. Parasaurolophus-spark mangler; A2 ecology-idles, A3 tegnede haltecyklusser, A4 vand-autotiles og A5 raptor-ådsler/skeletter er fortsat åbne. Ingen B-pakke eller udklækning erklæres bygget. Se SPRITES_AND_MECHANICS_STATUS.md og de separate regler/review.
