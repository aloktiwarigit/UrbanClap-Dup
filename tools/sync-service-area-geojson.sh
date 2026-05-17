#!/usr/bin/env bash
# Syncs service-area-ayodhya.geojson from api/ (source of truth, ADR-0020)
# to customer-app/assets/ so the two files never drift.
# Called from pre-codex-smoke.sh — failure blocks Codex review.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$REPO_ROOT/api/src/data/service-area-ayodhya.geojson"
DST="$REPO_ROOT/customer-app/app/src/main/assets/service-area-ayodhya.geojson"

if [ ! -f "$SRC" ]; then
  echo "ERROR: source $SRC not found" >&2
  exit 1
fi

cp "$SRC" "$DST"

SRC_HASH=$(sha256sum "$SRC" | awk '{print $1}')
DST_HASH=$(sha256sum "$DST" | awk '{print $1}')

if [ "$SRC_HASH" != "$DST_HASH" ]; then
  echo "ERROR: checksum mismatch after copy — disk issue?" >&2
  exit 1
fi

echo "sync-service-area-geojson: OK (sha256=$SRC_HASH)"
