---
name: primal-mechanics
description: Implement gameplay, persistence, AI, statistics and UI without breaking existing rules.
---

# primal-mechanics

Read src/core.js for authoritative species/mutations/prices and the focused tests. Avoid rereading old conversation or historical packs.
Logic belongs in core.js, presentation in app.js/style.css, sound in audio.js. Rebuild generated project.json with npm run build:game.
Mutation/level/result screens pause the simulation. Space is combat input and must never confirm modal rewards or advance a stage. Require fresh explicit confirm input.
Every damaging enemy attack gets a visible windup and a committed/recovering phase. Stamina costs, regen delay and cooldowns are real gameplay constraints.
NPCs obey their biome/diet, territory, group roles and attack grace period. Wounded ordinary animals slow and leave bounded temporary trails; bosses retain reliable timings.
Plants feed herbivores; omnivores have both options, Baryonyx can fish. Corpses lose food separately from their later skeleton visuals.
Do not add corpse scent until an explicit territorial/interspecies conflict system makes it meaningful.
Rare albino rewards are queued epic choices, capped by species/rank, pause normally and fall back to DNA when no choice remains. Never switch phases halfway through an enemy removal loop.
Record statistics from real actions/damage; distinguish attempted attacks, landed attacks, avoided hits and estimated steps. Random DNA percentage excludes guaranteed rewards.
Save migrations filter known species/IDs and bounded fields. Decorative NPC sex/palette randomness must not consume loot RNG or alter combat stats.
Add focused regression tests for meaningful mechanics, run the full existing suite in a temporary copy to preserve historical evidence. Update mechanics docs and state limitations.

Use currentLevel()/campaign/levelIndex for progression; stage remains the biome index for terrain/audio. Repeated biomes require distinct level seeds. NPC baseline skills share PLAYER_SPECIES costs/timing, skip bosses and never inherit player mutations. Telegraph geometry must use the actual active speed/duration/contact radius. Secret seed1993 is a one-level route. Compy pack-break fear expires; do not refresh it forever.

Reward invariant: one special reward per unique killed NPC. kill() is idempotent, enemy cleanup precedes mutation UI, mixed elite+albino is one epic and each queued source label is preserved. Both mutation pools and choose() share diet/species/rank eligibility. Pack recruitment uses real existing NPCs, one caller and a nearby group threshold; never suppress wounded retreat. Nest loot is gated on actual guardian death. Poison and head/gait clocks must freeze in all pause/build/choice screens.
