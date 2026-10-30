# PRIMAL RUN notes for performance-optimization

`SKILL.md`, `references/` are copied unchanged from
gamedev-skills/awesome-gamedev-agent-skills @ 19d93f97 (Apache-2.0, see `LICENSE`, `NOTICE`).
This file is ours and wins where they differ. Engine sections (Godot/Unity/Unreal) and named
sibling skills don't apply.

- Browser canvas 2D game, no engine profiler. Measure with Chromium DevTools Performance panel
  (or Playwright tracing against `npm run preview`), and in Firefox (Jonas plays there with a pad).
- "Draw calls" here = `drawImage`/path calls per frame in `src/app.js`; "allocation" = new
  arrays/objects/closures per frame in `Game.step` and the render loop (GC stutter).
- Mobile layout is a target: test a throttled CPU (4x) as well as desktop.
- Keep the sim deterministic: optimizations in core.js must give identical seeded
  `tools/playstyle_sim.cjs` results; put risky changes behind a `FEATURES` flag.
- Site size matters too (`npm run build:web` ships only game files).
