#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python -m pip install -r requirements.txt
npm ci
npx playwright install --with-deps chromium
python PRIMAL_RUN_Prototype_Kit/tools/validate_kit.py
npm test
