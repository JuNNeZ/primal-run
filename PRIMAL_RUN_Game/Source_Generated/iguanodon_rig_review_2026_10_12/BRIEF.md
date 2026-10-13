# PRIMAL RUN — IGUANODON RIG ANIMATION & SPECIES FIDELITY

## Opgave

Animér **Iguanodon** ud fra rig-guiden, og få alle frames godkendt af validatoren.

**ABSOLUTTE KRAV:** Dinosauren skal være tydeligt identificerbar som en *Iguanodon*, og samtlige sprites skal følge **præcis samme visuelle stil som de øvrige godkendte dinosaur-sprites i Primal Run**.

Dette gælder både anatomi, silhuet, proportioner, farver, pixel-art-teknik, perspektiv, kameravinkel, lys, skygger og animationskvalitet.

Det er ikke tilstrækkeligt at skabe en generisk dinosaur, som blot har fået navnet Iguanodon.

## Baggrund

Tidligere forsøg holdt ikke samme kameravinkel i alle retninger og glemte at animere benene.

Claude har lavet to værktøjer:

- `tools/rig_animate.py` genererer guide-frames med plantede fødder og ensartet kamera og lys i S/N/E/W.
- `tools/validate_rig_frames.py` afviser frames med stillestående ben, forkert benfase eller skift i vinkel, skala eller anker mellem retningerne.

Disse værktøjer er obligatoriske og må ikke omgås.

## 1. Opsætning

Kør:

```bash
git fetch origin claude/project-thread-9luicd
```

Opret derefter branchen:

`codex/iguanodon-rig-anim-2026-10-12`

med udgangspunkt i:

`origin/claude/project-thread-9luicd`

**Branch-regler:**

- Push aldrig til `claude/*`-branches.
- Ret ikke i `tools/rig_animate.py`.
- Ret ikke i `tools/validate_rig_frames.py`.
- Ændr aldrig validatorens tolerancer eller grænseværdier.
- Hvis et værktøj opfører sig forkert, dokumentér problemet i rapporten.

Læs først:

- `tools/RIG_ANIMATOR.md`
- `PRIMAL_RUN_Game/NEW_SPECIES_ART.md`
- Din primal-assets-skill

Undersøg desuden de eksisterende, godkendte sprites i projektet for at fastslå spillets etablerede visuelle stil.

## 2. Species Fidelity — Iguanodon

**HØJESTE PRIORITET SAMMEN MED RIG-PRÆCISION.**

Hver sprite skal forestille den samme genkendelige Iguanodon, ikke blot en generisk planteædende dinosaur.

Bevar artens karakteristiske anatomiske træk:

- Tydelig, karakteristisk tommelfingerpig på forlemmerne.
- Korrekte proportioner mellem hoved, hals, torso, hofter og hale.
- Kraftige bagben og mindre, men robuste forlemmer.
- Karakteristisk lang og afbalancerende hale.
- Genkendelig Iguanodon-hovedform med næb.
- Artsrelevant kropsbygning og fodstruktur.
- Sammenhængende anatomi i alle fire retninger.

Tommelfingerpiggen og andre karakteristiske træk skal være synlige, når perspektivet naturligt tillader det. De må ikke placeres anatomisk forkert blot for at gøre dem synlige.

**Genkendelighedstest:**

En person skal kunne identificere dinosauren som Iguanodon ud fra den samlede silhuet og de karakteristiske træk uden at læse filnavnet.

Test både i sprite-opløsning (1:1) og forstørret med nearest-neighbor.

Undgå:

- Generiske hadrosaur-lignende designs.
- Utahraptor- eller theropod-proportioner.
- Forkert antal eller placering af ekstremiteter.
- Anatomiske detaljer, der skifter mellem frames.
- At pigge, tæer, hovedform eller hale ændrer størrelse eller forsvinder uden perspektivmæssig begrundelse.

Anvend følgende som primær visuel artsreference:

`assets/new_species/iguanodon_<retning>.png`

Brug eksisterende godkendt Iguanodon-design som facit for farver, mønstre, anatomi og proportioner. Opfind ikke et nyt design.

## 3. Visual Style Fidelity — Primal Run

**Alle nye sprites skal se ud, som om de er produceret sammen med de eksisterende godkendte Primal Run-sprites.**

Brug spillets eksisterende sprites som direkte stilreference.

Match:

- Pixelstørrelse og pixeltæthed.
- Perspektiv og kameravinkel.
- Silhuetbehandling.
- Outline-tykkelse og kanter.
- Farvepalette og farvekontrast.
- Lysretning, skygger og shading.
- Detaljeringsgrad.
- Visuel læsbarhed ved spillets faktiske zoomniveau.
- Transparens og eksportstandard.

**Tekniske krav:**

- Fixed32 lossless-pipeline.
- Binær alpha.
- Ingen anti-aliasing.
- Ingen interpolation eller smoothing.
- Ingen utilsigtede semi-transparente kanter.
- Ens pixelstruktur på tværs af samtlige frames.

Undgå stilbrud såsom:

- Højere detaljeringsgrad end de øvrige arter.
- Mere realistisk eller malerisk shading.
- Nye outlines eller skyggetyper, der ikke findes i spillets etablerede stil.
- Ændret lysretning mellem animationer.
- Tilfældig variation i farver, mønstre eller kropsform.

**Prioritetsregel:**

Rig-guiden bestemmer pose, kameravinkel, fodkontakt og placering. Den godkendte Iguanodon-reference bestemmer identitet og udseende. De eksisterende Primal Run-sprites bestemmer den overordnede grafiske stil.

Hvis disse krav er svære at forene, skal problemet dokumenteres og ikke skjules med en stilændring.

## 4. Generér rig-guiden

Kør:

```bash
python tools/rig_animate.py --species iguanodon --sheet PRIMAL_RUN_Rig/iguanodon_sheet.png --gif PRIMAL_RUN_Rig/gif
```

Undersøg rig-guiden grundigt, inden de endelige sprites genereres.

## 5. Walk — første animationsserie

Start med `walk` i alle fire retninger.

**24 frames i alt.**

Brug for hver frame den tilsvarende rig-frame med samme navn som reference for pose og kamera.

Brug:

`assets/new_species/iguanodon_<retning>.png`

som reference for artens udseende.

**Rig-krav:**

- Fødderne skal placeres som defineret af `joints` og `foot_contact` i `PRIMAL_RUN_Rig/iguanodon/iguanodon_rig.json`.
- Silhuetten må højst afvige 2 px fra rig-framen.
- Ankeret skal være præcis `(72,72)` og må ikke glide.
- Samme kamera og projektion i S/N/E/W.
- W skal tegnes som sin egen retning og må ikke blot spejles fra E.
- Benene skal reelt bevæge sig med korrekte gangfaser.
- Fødderne skal have troværdig kontakt med underlaget.
- Torso og hale skal bevare deres volumen og proportioner.
- Anatomiske særtræk skal forblive konsistente fra frame til frame.

Ingen statiske ben forklædt som ganganimation gennem kropsbevægelse alene.

## 6. Eksport og review

Eksportér gennem projektets lossless-pipeline.

Gem de nye frames i en dedikeret review-mappe under:

`Source_Generated/`

**Skriv ikke til `assets/` endnu.**

Brug følgende navngivning:

`iguanodon_<tilstand>_<S|N|E|W>_<NNN>.png`

Bevar identisk canvas, anker, skalering, stil og transparens.

## 7. Automatisk validering

Kør:

```bash
python tools/validate_rig_frames.py --species iguanodon --frames <review-mappe> --rig PRIMAL_RUN_Rig/iguanodon --states walk --sheet <review-mappe>/overlay.png --report <review-mappe>/report.json
```

Validatoren skal afslutte med **exit-kode 0**.

Overlayet viser:

- Rød: rig-silhuet.
- Cyan: benområde.
- Rød ramme: fejlende frames.

Ret alle fejl og validér igen.

En frame er dog **ikke automatisk visuelt godkendt**, bare fordi validatoren accepterer den.

Udfør derfor også manuel kvalitetskontrol af:

1. Artsgenkendelighed.
2. Overensstemmelse med Iguanodon-referencen.
3. Konsistens med de øvrige Primal Run-sprites.
4. Anatomisk kontinuitet mellem frames.
5. Visuel læsbarhed i faktisk sprite-størrelse.
6. Flydende og troværdig animation.

Hvis en frame består validatoren, men fejler et af de visuelle kvalitetskrav, skal den stadig rettes.

## 8. Øvrige animationer

Når `walk` er fuldt valideret, fortsættes med:

- `run`
- `idle`
- `attack`
- `hurt`
- `death`

**Mål: 120 individuelle frames i alt**, fordelt efter rig-guidens specifikationer.

Alle animationsserier skal anvende det samme karakterdesign.

Det er især vigtigt, at Iguanodon ikke skifter proportioner, hovedform, farver eller anatomiske særtræk mellem `walk`, `run`, `attack`, `hurt` og `death`.

Kør til sidst validatoren uden `--states`.

Alle frames skal bestå både den automatiske validering og den visuelle kvalitetskontrol.

## 9. Fejlhåndtering

Hvis imagegen ikke kan holde benenes positioner stabile, eller hvis anatomien, kameravinklen eller stilen ændrer sig mellem frames:

- Stop med at betragte de berørte frames som godkendte.
- Dokumentér det præcise problem.
- Vis det relevante overlay.
- Oplys hvilke frames der fejler og hvorfor.
- Forsøg at rette dem uden at ændre rig eller valideringskrav.

**Du må aldrig:**

- Sænke validatorens krav.
- Ændre rig-genereringsværktøjerne for at få fejlagtige frames godkendt.
- Bruge rig-guideframes direkte som færdig spilgrafik.
- Erstatte Iguanodon med en anatomisk ukorrekt eller generisk dinosaur.
- Skifte grafisk stil for at gøre animationen lettere.

Hvis teknologien ikke kan opfylde kravene, skal det fremgå ærligt af rapporten.

## 10. Levering

Commit følgende på din egen branch:

- Review-mappen med alle genererede frames.
- `overlay.png`.
- `report.json`.
- GIF-preview af animationerne.
- En kvalitetsrapport med resultatet af den automatiske validering og den visuelle kontrol.

Rapporten skal tydeligt angive:

- Antal genererede frames.
- Antal rettede frames.
- Antal frames, der består validatoren.
- Hvilke frames der stadig fejler.
- Om Iguanodon er anatomisk genkendelig i alle retninger.
- Om alle sprites matcher Primal Runs eksisterende grafikstil.
- Eventuelle kendte begrænsninger.

Dokumentér også, hvilke eksisterende sprites der blev anvendt som stilreferencer.

## 11. Integrationsstop — afvent kvalitetsgodkendelse

**Integrér intet i spillet endnu.**

- Intet `animated:true`.
- Ingen ændringer i manifester.
- Ingen ændringer i `assets/`.
- Ingen merge.
- Ingen gh-pages.
- Ingen publicering.

Alle resultater skal forblive på review-branchen.

**Jonas skal kunne gennemgå og kvalitetsgodkende resultatet, før der gives tilladelse til integration.**

### Definition of Done

Opgaven er først klar til Jonas' endelige review, når:

- Alle 120 frames er genereret.
- Validatoren afslutter med exit-kode 0.
- Alle animationer anvender det samme Iguanodon-design.
- Arten er tydeligt genkendelig fra sine anatomiske karakteristika.
- Grafikstilen matcher de eksisterende godkendte Primal Run-sprites.
- Ingen synlig glidning, perspektivskift eller uforklarlige anatomiske ændringer forekommer.
- Review-materiale, GIF-previews og rapport er committet på den korrekte branch.

**Automatisk validering er ikke det samme som endelig godkendelse. Jonas har sidste ord.**
