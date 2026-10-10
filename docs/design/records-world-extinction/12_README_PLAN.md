# README improvement plan

The root `README.md` (105 lines) and `PRIMAL_RUN_Game/README.md` (418 lines) grew as running changelogs.

## Problems found

- History and status are mixed into the introduction ("Alle ti fjendearter…", "Otte separate spillerarter…").
- Numbers are glued to words in several places ("i fire retninger:1200", "har960 frames", "ved50/25/10%liv"),
  which reads as typos.
- Some statements are out of date: "fire bosskampe" for music vs eight named level bosses; the overhaul
  (October 2026), languages, achievements and the live build from `claude/overhaul` are not mentioned.
- Publishing steps describe both a manual workflow and a `gh-pages` branch without saying which is current.
- No single map of the docs; dozens of reports are linked inline.
- Branch roles (`main` is an old prototype kit; the game lives on feature branches) are not explained.

## Proposed structure (root README, Danish, ~80 lines)

1. **Primal Run** – one paragraph + "Spil nu" link + one screenshot.
2. **Sådan spiller du** – controls table (from the in-game help), 4 lines on the loop.
3. **Status** – small table: playable species, levels, languages, current live build (commit + date),
   link to `PATCH_NOTES.html`.
4. **Kom i gang (udvikling)** – `npm ci`, `npm run preview`, `npm test`, `npm run build:lang`,
   `python tools/build_game.py` (+ restore `Source_Generated/README.md`), GDevelop note.
5. **Branches** – table: `main` (old kit), `codex/primal-run-playable` (earlier playable), `claude/overhaul`
   (October overhaul, live), `codex/sprites-and-mechanics` (active), `gh-pages` (published),
   `backup/live-2026-10-09` (rollback), `ci-results/*` (CI evidence).
6. **CI og beviser** – what `Overhaul review` produces and how to read `ci-results/<branch>`.
7. **Simulering** – `npm run simulate:styles`, `SIMULER_BALANCE.bat`, where reports land.
8. **Regler for bidrag** – sprite rules, i18n rule (Danish source), patch notes rule, never edit `gh-pages`
   by hand, tests before push.
9. **Dokumentation** – one linked index (`docs/README.md`) grouping: design phases, sprite rules, reports,
   task briefs, idea bank.

Move the long feature narrative to `docs/history/CHANGELOG_2026.md` (verbatim, with the number spacing fixed).
`PRIMAL_RUN_Game/README.md` keeps the technical game guide but gets the same spacing fix and a short
"Arkitektur" section (core.js deterministic sim / app.js rendering / i18n / assets / GDevelop export).

## Acceptance

- Root README ≤ 120 lines, no number glued to a word (regex check `[a-zæøå][0-9]|[0-9][a-zæøå]{3,}` reviewed).
- Every relative link resolves (CI link check script).
- The "current live build" line is updated by the publish step, not by hand.
