---
name: primal-safe-integration
description: Safely integrate Claude records code and ChatGPT reviewed art with Codex Part A on a fresh integration branch.
---

# Cross-agent integration
Before work inspect git status/head and branches codex/sprites-and-mechanics, claude/records-design, claude/records-implementation if present, and chatgpt candidate art branches. main is historical. Keep a new branch based on the current playable Codex head. Fetch selected small changes or cherry-pick scoped commits; do not blindly merge old base branches. Make overlap matrix for core.js, app.js, style.css, save schema, i18n, manifests, generated project.json. Integrate R-DIST -> R-TRACK -> R-RECORDS -> R-REPORT, preserving achievements, legacy saves, maps, animation changes. Run $primal-art-intake and $primal-art-gates for incoming art; never replace master imagery without sign-off. Rebuild generated project.json using the build script, full tests, browser 390px and balance on mechanic changes. Report exact conflicts, before/after SHA and residual checks. No force push, active-branch overwrite, auto-merge or gh-pages.
