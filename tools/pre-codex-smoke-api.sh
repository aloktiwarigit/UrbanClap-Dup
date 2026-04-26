#!/usr/bin/env bash
# Pre-Codex smoke gate for the Node/TypeScript API sub-project.
# Run BEFORE /codex-review-gate. Non-zero exit = fix before Codex.
# Usage: bash tools/pre-codex-smoke-api.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT/api"

# Call binaries directly so pnpm's cmd.exe subprocess spawning on Windows
# (which doesn't inherit the bash PATH) doesn't block the git hook.
BIN="$PWD/node_modules/.bin"

echo "=== Pre-Codex Smoke Gate: api ==="

echo "[1/3] typecheck — catches missing types, broken imports, type errors..."
"$BIN/tsc" --noEmit -p tsconfig.tests.json 2>&1 | tail -20

echo "[2/3] lint — ESLint 0 warnings..."
"$BIN/eslint" . --max-warnings 0 2>&1 | tail -20

echo "[3/3] vitest run — all unit tests must be green..."
"$BIN/vitest" run 2>&1 | tail -30

echo ""
echo "=== API smoke gate PASSED — safe to invoke /codex-review-gate ==="
