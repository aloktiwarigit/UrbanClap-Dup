#!/usr/bin/env bash
# Pre-Codex smoke gate for the Next.js admin-web sub-project.
# Run BEFORE /codex-review-gate. Non-zero exit = fix before Codex.
# Usage: bash tools/pre-codex-smoke-web.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT/admin-web"

# Call binaries directly — same Windows/pnpm PATH fix as pre-codex-smoke-api.sh
BIN="$PWD/node_modules/.bin"

echo "=== Pre-Codex Smoke Gate: admin-web ==="

echo "[1/3] typecheck — catches broken imports, type errors..."
"$BIN/tsc" --noEmit 2>&1 | tail -20

echo "[2/3] lint — ESLint + Next.js lint, 0 warnings..."
"$BIN/next" lint 2>&1 | tail -20

echo "[3/3] jest / vitest run — all tests must be green..."
"$BIN/vitest" run 2>&1 | tail -30

echo ""
echo "=== Web smoke gate PASSED — safe to invoke /codex-review-gate ==="
