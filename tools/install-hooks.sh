#!/usr/bin/env bash
# One-time setup: point git at the committed hooks directory.
# Run once after cloning: bash tools/install-hooks.sh
set -euo pipefail
git config core.hooksPath .githooks
chmod +x .githooks/pre-push
echo "Git hooks installed. pre-push smoke gate is now active."
