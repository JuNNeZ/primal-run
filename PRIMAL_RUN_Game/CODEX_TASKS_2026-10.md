# Codex-opgave: sprites + nye mekanikker (oktober 2026)

> Denne fil **erstatter** den tidligere sprite-prompt. Rettelser i forhold til den står i
> afsnit 0 – læs dem først.

## 0. Rettelser til den tidligere prompt

1. **Basis-branch:** Oktober-overhaulen er nu LIVE (gh-pages er bygget fra `claude/overhaul`).
   Lav din branch `codex/sprites-and-mechanics` ud fra `codex/primal-run-playable`, hvis PR #2
   er merget – ellers ud fra `claude/overhaul`. Tjek med `git log` at `PATCH_NOTES.html` og
   `src/i18n.js` findes, før du begynder.
2. **"Må ikke ændre balance/AI" gælder ikke længere generelt.** Del B nedenfor kræver
   ændringer i AI og bosser. Reglen er nu: ændr kun det, opgaven beder om, og dokumentér
   enhver balanceændring med en simulering (se afsnit 3) før og efter.
3. **Patch notes er obligatoriske.** Hver pakke tilføjer en ny sektion øverst i
   `PRIMAL_RUN_Game/PATCH_NOTES.html` (dansk, kort, spillersprog, + én engelsk linje).
   Brug den eksisterende stil i filen.
4. **Al ny tekst skal oversættes.** Dansk er kildesproget. Tilføj rækker i
   `tools/i18n/tr_ui.py` (UI) eller `tools/i18n/tr_core.py` (spiltekst) med
   da/en/de/sv/no/ja/zh, kør `npm run build:lang`, og brug `tr(...)`/`I18N.tf(...)` i
   app.js. Tal skrives som `#`, tastnavne som `@`.
5. **CI:** Workflowet `.github/workflows/overhaul-review.yml` kører kun på `claude/**`.
   Udvid `on.push.branches` til også `codex/**`. Resultater (testlog + screenshots)
   havner på branchen `ci-results/<din-branch>`.
6. **Live-siden:** Rør stadig ikke `gh-pages`. Jonas udgiver selv, eller beder om det.
   Den tidligere live-version ligger i `backup/live-2026-10-09`.
7. **Kendte skrøbelige tests:** Områdefund (+1 DNA) tæller også som `run.exploration`,
   og dyrenavne tegnes kun inden for 230 px af spilleren. Skriv nye browsertests, så de
   ikke afhænger af tilfældig placering (sæt `g.random`, flyt dyr tæt på, mål relative
   ændringer).

## Fælles regler

- Læs `AGENTS.md`, `PRIMAL_RUN_Game/OVERHAUL_2026-10.md`, `MISSING_SPRITES.md`,
  `IDEABANK.md` og alle `SPRITE_RULES*.md` først.
- Én pakke = én eller flere commits, der hver især består alle tests. Push efter hver pakke.
- Efter hver ændring i `src/`: `python tools/build_game.py` (gendan derefter
  `PRIMAL_RUN_Game/Source_Generated/README.md` med `git checkout`), `npm test`,
  `npm run validate:game-sprites`, `npm run validate:enemy-sprites`.
- Nye mekanikker skal have enhedstests i `tests/` (core.js er deterministisk; brug seed)
  og mindst én browsertest, der viser at mekanikken faktisk sker i spillet.
- Hold mobil i tankerne: 390 px bred skærm, ingen nye tekstvægge.
- Albino/skins (`SKINS` i core.js) skal virke på alle nye sprites, også ådsel og skelet.

---

## DEL A – Sprites (prioriteret)

Følg sprite-reglerne nøjagtigt: native pixels, fast palet (`palette.json`), samme skala,
forankring og skygge som eksisterende sprites, S/N/E/W. Lever manifest + valideringsfil +
review-side (som `enemy_full_review.html`) pr. pakke. Slet aldrig gamle sprites – de er
fallback.

**A1. Angreb pr. art** (S/N/E/W, 6 frames, samme timing som `attack`):
Triceratops hornstød, Ankylosaurus halesving, Pachycephalosaurus hovedstød, Gallimimus
næbhak, Parasaurolophus spark. Spiller- og fjendeversion. I app.js bruges `ATTACK_STYLE` +
`attackFX()` (ca. linje 426) i dag – brug den nye animation, når den findes, og behold
`attackFX` som lille supplement (støv, slagbue).

**A2. Idle-variationer** for planteædere og store rovdyr: græsse, drikke, kradse sig, sove.
Kobl til `ecologyAI`-tilstandene (graze/drink/rest) i core.js. `MODE_ICON` (app.js ca.
linje 439) vises kun, når der ikke er en animation, eller dyret er langt væk.

**A3. Halten** – walk-cyklus under 30 % HP, alle arter.

**A4. Vand-overgange** – autotile-sæt (16- eller 47-tile) mellem jord/sand, lavt vand og
dybt vand + vadesteder og damme. Erstat stregerne i `drawRiver()`/`drawPond()` (app.js ca.
linje 370–400); behold animeret skum/glimt ovenpå. Dybt vand skal stadig tydeligt adskille
sig (kan ikke krydses af ikke-svømmere, se `isDeepWater`/`map.fords`).

**A5. Velociraptor og Utahraptor som fjender** – ådsel + skelet (S/N/E/W, 2 poser) efter
`SPRITE_RULES_CORPSES.md`.

**A6. (hvis tid)** lava/aske-kanttiles, pixel-ikoner til HUD-chips (mad, DNA, zone),
nat-varianter (se B2) som palet-skift frem for nye tegninger.

---

## DEL B – Nye mekanikker

Byg i denne rækkefølge. Hver mekanik skal kunne slås fra med et flag i core.js (fx
`FEATURES.scent = true`), så den kan rulles tilbage uden at fjerne koden.

**B1. Boss-mekanikker pr. boss** (højeste prioritet – Jonas synes bosserne er for nemme at
undvige). Udvid `bossCommon`/boss-AI'erne, så hver boss har én signatur-mekanik med tydelig
telegraph (brug `telegraphShape`/`drawTelegraphs`):
- **Benny (Baryonyx):** dykker i floden, forsvinder (kun bobler synlige), dukker op ved
  spilleren efter 1,2 s windup.
- **Ragnar (T. rex):** brøl, der får småvildt til at flygte *mod* spilleren og giver
  spilleren kort "rystet"-debuff (lavere stamina-regen), ikke stun.
- **Carl og Karl (Carnotaurus, bane 2 og 7):** dobbelt-charge i fase 2 med kort pause imellem; Karl på askebanen kan desuden skjule sig i askeskyer. Carl er i dag den boss, der dræber flest bots – gør ham ikke sværere, kun mere varieret.
- Øvrige bosser: én passende mekanik hver, du foreslår i PR'en.
Ingen af dem må være umulige at undvige for et menneske: min. 0,45 s fra synlig telegraph
til skade.

**B2. Dag og nat.** Cyklus pr. bane (fx 4 min dag / 2 min nat). Nat: mørkere lys via
`LEVEL_LIGHT`/`screenAmbience`, kortere synsvidde for dyr *og* mindre synligt kort omkring
spilleren, compys mere aggressive/flere, planteædere samles og sover i flok. Mindst én
nataktiv art. HUD viser sol/måne i lille ikon.

**B3. Spor og lugt.** Sårede dyr efterlader blodspor (prikker, der falmer over ~40 s).
Rovdyr-spillere ser sporet tydeligere (mutation kan forstærke det). Fjende-rovdyr følger
også spor efter sårede dyr – også en såret spiller. Regn (eksisterende vejr) visker spor
hurtigere ud. Skal være billigt: maks. ~200 sporpunkter, LOD som resten af AI'en.

**B4. Tørke og vandhuller.** På baner med vand: efter ~60 % af banens tid skrumper damme
(ikke floden) gradvist; dyr søger mod de sidste vandkilder (`drink`-adfærd i `ecologyAI`),
så der opstår travle, farlige vandhuller. Visuelt: lysere kant/tørret mudder.

**B5. Flokjagt for raptorer.** Som Velociraptor/Utahraptor: fodr en vild raptor (hold F ved
kød, mens den ser på) → den følger dig som allieret i resten af banen (maks. 2). Allierede
angriber spillerens mål, flygter ved lavt liv, tæller ikke som kills for dig. Kræver ikke
nye sprites (brug eksisterende fjende-raptor med lille markering).

**B6. Risiko-modifikatorer ("Udfordringer").** Før et run kan man slå op til 3 til:
fx *Ingen helbredelse fra planter*, *Bosser +30 % HP*, *Kun 1 mutation pr. levelup-valg*,
*Natten varer dobbelt*. Hver giver +X % DNA ved run-slut. Vises på intro-skærmen (kort og
mobilvenligt) og i highscore-listen. Gemmes i `save.settings`.

**B7. Dagens seed.** Knap "Dagens jagt" i menuen: seed = dato (YYYYMMDD → tal), samme
art for alle den dag (rotér gennem *ulåste* arter, falder tilbage til Velociraptor).
Egen lokal highscore-liste pr. dato. Ingen server.

**B8. Lille rettelse – Baryonyx-fiskeri.** Kun Baryonyx kan fange fisk (det er korrekt), og
arten låses op ved at besejre Benny (det kan alle arter). Tilføj en bedrift "Fiskekonge":
*Fang 30 fisk i alt med Baryonyx* → belønning: et Baryonyx-skin (ikke en art). Gør
lås-op-teksten på arts-skærmen tydelig: "Besejr Benny på bane 3".

**B9. Idébanken.** Flyt alle ovenstående fra "ideer" til "bygget" i `IDEABANK.md`, når de er
færdige. Udklækning/opvækst forbliver i idébanken (ikke en del af denne opgave).

---

## 3. Balance og simulering

- Kør `npm run simulate:quick` før du starter (baseline) og efter hver B-pakke. Gem
  `summary_compact.json` i `PRIMAL_RUN_Game/balance_runs/<dato>-<pakke>.json`.
- Udvid `tools/playstyle_sim.cjs`, så bots forstår de nye mekanikker (undviger dyk/brøl,
  bruger vandhuller, tager allierede med) – ellers er tallene værdiløse.
- Mål pr. pakke: dødsårsager pr. boss, tid pr. bane, staggers/min, andel runs der når
  bane 3/5/8. Mål for bosserne: ingen enkelt boss står for > 35 % af alle dødsfald, og en
  "optimizer"-bot taber til hver boss mindst 1 af 10 gange.

## 4. Aflevering

- Opdater `PATCH_NOTES.html`, `IDEABANK.md`, `MISSING_SPRITES.md` og
  `OVERHAUL_2026-10.md` (ny sektion).
- Åbn én PR pr. del (A og B) mod den branch du startede fra, med dansk beskrivelse,
  screenshots fra `ci-results/<branch>` og simuleringstal før/efter.
- Udgiv ikke til gh-pages.
