#!/usr/bin/env bash
# Pre-push lint: fails if docs/runbook.md (or any file under docs/) contains git merge-conflict markers.
# Per project CLAUDE.md (lean review stack), this is enforced LOCALLY pre-push, not in CI.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if grep -rEn '^(<<<<<<<|=======|>>>>>>>)' docs/ 2>/dev/null; then
  echo "::error::Unresolved git merge-conflict markers in docs/. Resolve before pushing."
  exit 1
fi
echo "no conflict markers found in docs/"
exit 0
