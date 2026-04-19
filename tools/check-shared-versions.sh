#!/usr/bin/env bash
# tools/check-shared-versions.sh — gate shared Kotlin/AGP/Compose/Paparazzi/Kover/Detekt/ktlint
# version parity across the three libs.versions.toml files (customer-app, technician-app,
# design-system). Invoked by all three Android ship.yml workflows. api-ship is exempt (Node stack).
set -euo pipefail

KEYS=("kotlin" "agp" "composeBom" "paparazzi" "kover" "detekt" "ktlint")
FILES=(
    "customer-app/gradle/libs.versions.toml"
    "technician-app/gradle/libs.versions.toml"
    "design-system/gradle/libs.versions.toml"
)

status=0
for key in "${KEYS[@]}"; do
    values=()
    for file in "${FILES[@]}"; do
        val=$(grep -E "^${key} = \"" "$file" | sed -E 's/^[^=]+= "([^"]+)".*/\1/' || true)
        values+=("${val:-MISSING}")
    done
    uniq=$(printf "%s\n" "${values[@]}" | sort -u | wc -l)
    if [ "$uniq" -ne 1 ]; then
        echo "::error::Shared toolchain version drift on key '${key}':"
        for i in "${!FILES[@]}"; do
            echo "  ${FILES[$i]}: ${values[$i]}"
        done
        status=1
    fi
done

if [ "$status" -eq 0 ]; then
    echo "shared-versions check OK (all 7 toolchain keys match across 3 catalogs)"
fi
exit $status
