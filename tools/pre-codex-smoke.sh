#!/usr/bin/env bash
# Pre-Codex smoke gate for Android sub-projects (customer-app / technician-app).
# Run this BEFORE /codex-review-gate. A non-zero exit means do NOT invoke Codex — fix the issue first.
# Usage: bash tools/pre-codex-smoke.sh <customer-app|technician-app>
set -euo pipefail

APP_DIR="${1:?Usage: pre-codex-smoke.sh <customer-app|technician-app>}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPO_ROOT/$APP_DIR"

echo "=== Pre-Codex Smoke Gate: $APP_DIR ==="

echo "[1/4] assembleDebug — catches missing deps, broken imports, unresolved references..."
./gradlew assembleDebug --quiet 2>&1 | tail -30

echo "[2/4] ktlintCheck — formatting must be clean before Codex sees it..."
./gradlew ktlintCheck --quiet 2>&1 | tail -20

echo "[3/4] testDebugUnitTest — TDD invariant: all unit tests must be green..."
./gradlew testDebugUnitTest --quiet 2>&1 | tail -30

echo "[4/4] koverVerify — coverage must meet >=80% threshold..."
./gradlew koverVerify --quiet 2>&1 | tail -10

echo ""
echo "=== Smoke gate PASSED — safe to invoke /codex-review-gate ==="
