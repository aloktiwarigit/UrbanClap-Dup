#!/usr/bin/env bash
# Pre-Codex smoke gate for the Node/TypeScript API sub-project.
# Run BEFORE /codex-review-gate. Non-zero exit = fix before Codex.
# Usage: bash tools/pre-codex-smoke-api.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT/api"

# Ensure local node_modules/.bin is on PATH (needed when running from git hooks
# on Windows where the hook environment may not inherit the user's shell PATH).
export PATH="$PWD/node_modules/.bin:$PATH"

echo "=== Pre-Codex Smoke Gate: api ==="

echo "[1/3] typecheck — catches missing types, broken imports, type errors..."
pnpm typecheck 2>&1 | tail -20

echo "[2/3] lint — ESLint 0 warnings..."
pnpm lint 2>&1 | tail -20

echo "[3/3] vitest run — all unit tests must be green..."
pnpm test 2>&1 | tail -30

echo ""
echo "=== API smoke gate PASSED — safe to invoke /codex-review-gate ==="
