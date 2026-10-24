# Arkiv

Ryddet ud af den aktive kode 2026-10-16. Intet her bygges, testes eller udgives,
og intet i spillet eller i `tools/` læser fra mappen. Filerne er bevaret som historik;
flyt en fil tilbage, hvis den bliver aktiv igen. Scripts her bruger stier relativt
til deres oprindelige placering og kører ikke uændret fra arkivet.

| Sti | Hvad | Hvorfor arkiveret |
| --- | --- | --- |
| `demos/PRIMAL_RUN_Demo_v2` – `v5` | Tidlige browserdemoer (statiske poses, syd-gang, rettet gang, fire retninger) med egne sprite-regler | Erstattet af `PRIMAL_RUN_Game`; Prototype Kit indeholder allerede V5-assets |
| `legacy_scripts/build_*`, `package_*`, `prepare_walk_demo.py`, `extend_kit_demo.py`, `finalize_prototype_kit.py`, `export_sprites.py`, `validate_walk_assets.py` | Generatorer for demoerne, Prototype Kit og `PRIMAL_RUN_Sprites` | Engangs-byggescripts; pakkerne er færdige og versioneret |
| `legacy_scripts/check_demo.cjs`, `check_walk_demo.cjs`, `check_corrected_walk.cjs`, `check_direction_demo.cjs`, `check_cardinal_states.cjs` | Browsertjek af V2–V5 | Ikke i `npm test` eller CI |
| `legacy_scripts/prepare_repository.py` | Engangsmigrering fra Windows-stier | Allerede kørt 2026-10-05 |
| `legacy_scripts/a6-part-c-compat.cjs` + rapport | Kompatibilitetstjek af A6 + Part C før de blev slået sammen | Part C er integreret; dækkes af `a6-browser` og `part-c` |
| `Source_Original/concept.png` | Oprindeligt konceptark | Kun brugt af `export_sprites.py` |
| `docs/game/BALANCE_*`, `FOLLOWUP_BALANCE.md`, `RECORDS_STATUS.md` | Daterede balance- og statusnoter | Afløst; tallene i spillet er nyere |
| `docs/game/TESTING_first_version.md` | Testrapport for første spilbare version | Historisk; aktuelle kommandoer står i rodens README |
| `docs/CLOUD_HANDOFF_log_2026-10.md` | Dato-log fra `CLOUD_HANDOFF.md` | Historik flyttet ud, så overdragelsen er kort |
| `docs/PART_A_*`, `docs/GITHUB_API_ACCESS.md`, `docs/validation/` | PR-udkast, QA og logs fra Part A/A6/animation-polish (2026-10-10–12) | Afsluttet arbejde; refereres fra feature-dokumenterne |
| `docs/game/` (2026-10-24): `DEVELOPMENT_PLAN`, `NEXT_IMPROVEMENTS`, `PRIORITIES_*`, `CODE_AUDIT`, `PART_B_*`, `UNFINISHED_EXPANSION` m.fl. + `*_test_run.txt`; `legacy_scripts/crowd_test.cjs`, `prepare_iguanodon_rig_batches.py` | Plan-, status- og featurenoter fra 8.–12. okt. og to engangsscripts | Afløst af koden, patch notes og PR'erne; intet læser dem |

Stadig aktive, selvom de ser gamle ud: `PRIMAL_RUN_Prototype_Kit/` (kopieres af
`npm run build:game` og testes af `npm run test:kit`), `PRIMAL_RUN_Sprites/` +
`validate_sprites.py` (projektets sprite-regel, kører i CI), `PRIMAL_RUN_Art_Handoff/`
(kildekunst for præsentation/ground-reuse, valideres i CI) og eksportørerne i `tools/`,
som genskaber godkendt kunst.
