# PRIMAL RUN notes for game-feel

`SKILL.md`, `references/` are copied unchanged from
gamedev-skills/awesome-gamedev-agent-skills @ 19d93f97 (Apache-2.0, see `LICENSE`, `NOTICE`).
This file is ours and wins where they differ. Skills it names (`camera-systems`,
`godot-animation`, ...) are not installed; ignore those pointers.

- No engine: plain canvas JS. Simulation in `PRIMAL_RUN_Game/src/core.js` (`Game.step`),
  drawing in `src/app.js`, sound in `src/audio.js` (reacts to `this.emit(...)` events).
- Existing juice channels in core.js: `r.hitStop` (seconds, consumed at the top of the step),
  `r.shake` (camera only, set with `Math.max`), `this.burst(x,y,'blood'|'dust'|'ash'|'bubble',n,seed)`,
  floating text in `r.effects`, `r.hurt`/`r.invulnerable` flashes, `this.emit(...)` for audio/rumble.
- Current values: bite hit hitStop .033 (.05 strong/multi), shake .055 (.1 strong); player hurt shake .18.
- Respect `save.settings.shake`, `save.settings.reducedMotion` (+ `prefers-reduced-motion`) and `rumble`.
- New juice goes behind a `FEATURES.<flag>` so sims and before/after comparisons still work.
  Juice must never change `Game.step` outcomes except hitStop time; check with a seeded sim.
- Visual change = Jonas judges it in play (`npm run preview`); file checks don't approve feel.
