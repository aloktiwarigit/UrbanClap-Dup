#!/usr/bin/env bash
# Pre-Codex smoke gate for Android sub-projects (customer-app / technician-app).
# Run this BEFORE /codex-review-gate. A non-zero exit means do NOT invoke Codex — fix the issue first.
# Usage: bash tools/pre-codex-smoke.sh <customer-app|technician-app>
#
# Steps 3+4 (detekt + lintDebug) were added in the Week 2 (2026-05-13) retrospective.
# Both were missing from the original gate and caused 6+ CI fix-rounds per PR.
set -euo pipefail

APP_DIR="${1:?Usage: pre-codex-smoke.sh <customer-app|technician-app>}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPO_ROOT/$APP_DIR"

echo "=== Pre-Codex Smoke Gate: $APP_DIR ==="

echo "[1/6] assembleDebug — catches missing deps, broken imports, unresolved references..."
./gradlew assembleDebug --quiet 2>&1 | tail -30

echo "[2/6] ktlintCheck — formatting must be clean before Codex sees it..."
./gradlew ktlintCheck --quiet 2>&1 | tail -20

echo "[3/6] detekt — static analysis (LongMethod, MagicNumber, ReturnCount, NestedBlockDepth)..."
./gradlew detekt --quiet 2>&1 | tail -20

echo "[4/6] lintDebug — Android Lint (UnusedResources, MissingTranslation, ObsoleteSdkInt, Compose rules)..."
./gradlew lintDebug --quiet 2>&1 | tail -20

echo "[5/6] testDebugUnitTest — TDD invariant: all unit tests must be green..."
# -PexcludePaparazzi: Paparazzi snapshot tests require Linux font rendering; run on CI via paparazzi-record.yml
./gradlew testDebugUnitTest --quiet -PexcludePaparazzi 2>&1 | tail -30

echo "[6/6] koverVerify — coverage must meet >=80% threshold..."
./gradlew koverVerify --quiet 2>&1 | tail -10

echo ""
echo "=== Smoke gate PASSED — safe to invoke /codex-review-gate ==="
