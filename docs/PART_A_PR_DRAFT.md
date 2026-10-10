# Del A: genbrug af Ankylosaurus og sammenhængende animationsrytme

Ankylosaurus’ nye halesving ændrede kropsbredde, rygplader og haleproportioner. De 24 eksisterende native player_full-angrebsframes genbruges nu byte-identisk på spiller og NPC, med oprindelige kilder, anchors og SHA-256 i manifestet. Afviste kilder er bevaret. Angrebstiming og gameplay-stats er uændrede.

Under 30%HP bruger alle arter en asymmetrisk gang-/løberytme med de eksisterende poses. Skåneben-tegninger er stadig åbne. Artsangreb får nu også den manglende hit-flash. Parasaurolophus-kick revision2 er et native review-udkast, ikke et aktivt runtime-overlag.

Validation: 138 unit tests, 21 browser suites, 3 kit checks; sprite validators PASS. Actual desktop/mobile rendering, all24 reused player/NPC tail swings,192 player health/direction/gait cases,80 low-health NPC cases and pause freeze verified. GDevelop engine not rerun. Existing balance data remains preserved; this package changes presentation only and claims no new balance conclusions.

Screenshots: PRIMAL_RUN_Game/previews/part_a/ankylosaurus-reused-runtime.png, ankylosaurus-mobile.png, ankylosaurus-body-comparison.png. Interactive comparison: PRIMAL_RUN_Game/part_a_review.html. CI-results target: ci-results/codex/sprites-and-mechanics (link only once the matching commit results exist).

Draft scope: A2, anatomical A3, A4, A5 and final Paras/cross-state consistency remain open. No gh-pages changes. Target branch: claude/overhaul. PR creation is pending GitHub API network activation/auth verification, documented in docs/GITHUB_API_ACCESS.md.
