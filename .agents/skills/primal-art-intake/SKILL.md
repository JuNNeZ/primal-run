---
name: primal-art-intake
description: Safely stage a new ChatGPT PNG/ZIP pack under candidate paths without overwriting game production assets.
---

# Safe ChatGPT asset intake
For each ZIP and manifest, inspect for path traversal, invalid names, duplicate file paths, unsupported content and unexpected scripts. Preserve archive hash and source/asset SHA-256. Use separate branch and staging path PRIMAL_RUN_Art/candidates/<pack-id>/; never write directly to assets/tiles, Source_Generated or active A1–A6 without explicit approval. Compare requested uses with existing masters, especially old meteor at codex/preserved-feathered-starter. Run $primal-art-gates and record exact integration mapping and rejection history. All files stay prototype/candidate until style, in-game tests and Jonas approval. No gh-pages, PR merge or existing-asset overwrite.
