#!/usr/bin/env python3
"""
check-token-drift.py

Verifies figma/variables.json mirrors Kotlin design-system token constants.
Source of truth: design-system/src/main/kotlin/.../theme/*.kt
Mirror: figma/variables.json (W3C DTCG format)

Exit 0  → all checked tokens match.
Exit 1  → one or more mismatches, or a Kotlin token is absent from JSON.

Usage (project defaults):
  python tools/check-token-drift.py

Usage (override paths, for tests):
  python tools/check-token-drift.py \\
    --variables-json <path> \\
    --theme-dir <path>

Checked categories: color (brand/semantic/neutral), spacing, elevation, radius,
motion durations.
Skipped: color/extended (aliases of checked tokens), color/m3container (M3
slot assignments, not raw primitives), motion easing (cubic-bezier
normalization deferred to Phase 2 token pipeline).
"""
import argparse
import json
import re
import sys
from pathlib import Path
from typing import Optional

# ─────────────────────────────────────────────────────────────────────────────
# Default paths (relative to repo root, resolved at runtime)
# ─────────────────────────────────────────────────────────────────────────────

_SCRIPT_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _SCRIPT_DIR.parent

DEFAULT_VARIABLES_JSON = _REPO_ROOT / "figma" / "variables.json"
DEFAULT_THEME_DIR = (
    _REPO_ROOT
    / "design-system"
    / "src"
    / "main"
    / "kotlin"
    / "com"
    / "homeservices"
    / "designsystem"
    / "theme"
)

# ─────────────────────────────────────────────────────────────────────────────
# Mapping table
#
# Each entry: (json_path_tuple, kotlin_regex, display_name)
#
# json_path_tuple — list of string keys to navigate to a DTCG leaf node; the
#   checker reads the "$value" field of that node.
#
# kotlin_regex — pattern searched across all *.kt files in --theme-dir; MUST
#   have exactly one capture group returning the raw value string (hex digits
#   for colors, integer string for dimension/duration tokens).
#
# display_name — used in error messages.
# ─────────────────────────────────────────────────────────────────────────────

CHECKS: list[tuple[tuple[str, ...], str, str]] = [
    # ── Brand colors (Color.kt) ───────────────────────────────────────────────
    (("color", "brand", "primary",      "light"), r"\bBrandPrimaryLight\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",      "BrandPrimaryLight"),
    (("color", "brand", "primary",      "dark"),  r"\bBrandPrimaryDark\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",       "BrandPrimaryDark"),
    (("color", "brand", "primaryHover", "light"), r"\bBrandPrimaryHoverLight\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)", "BrandPrimaryHoverLight"),
    (("color", "brand", "primaryHover", "dark"),  r"\bBrandPrimaryHoverDark\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",  "BrandPrimaryHoverDark"),
    (("color", "brand", "accent",       "light"), r"\bBrandAccentLight\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",       "BrandAccentLight"),
    (("color", "brand", "accent",       "dark"),  r"\bBrandAccentDark\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",        "BrandAccentDark"),
    # ── Semantic colors (Color.kt) ────────────────────────────────────────────
    (("color", "semantic", "success", "light"), r"\bSemanticSuccessLight\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)", "SemanticSuccessLight"),
    (("color", "semantic", "success", "dark"),  r"\bSemanticSuccessDark\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",  "SemanticSuccessDark"),
    (("color", "semantic", "warning", "light"), r"\bSemanticWarningLight\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)", "SemanticWarningLight"),
    (("color", "semantic", "warning", "dark"),  r"\bSemanticWarningDark\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",  "SemanticWarningDark"),
    (("color", "semantic", "danger",  "light"), r"\bSemanticDangerLight\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",  "SemanticDangerLight"),
    (("color", "semantic", "danger",  "dark"),  r"\bSemanticDangerDark\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",   "SemanticDangerDark"),
    (("color", "semantic", "info",    "light"), r"\bSemanticInfoLight\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",    "SemanticInfoLight"),
    (("color", "semantic", "info",    "dark"),  r"\bSemanticInfoDark\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",     "SemanticInfoDark"),
    # ── Neutral colors (Color.kt) ─────────────────────────────────────────────
    (("color", "neutral", "0",   "light"), r"\bNeutral0Light\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",   "Neutral0Light"),
    (("color", "neutral", "0",   "dark"),  r"\bNeutral0Dark\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",    "Neutral0Dark"),
    (("color", "neutral", "50",  "light"), r"\bNeutral50Light\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",  "Neutral50Light"),
    (("color", "neutral", "50",  "dark"),  r"\bNeutral50Dark\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",   "Neutral50Dark"),
    (("color", "neutral", "100", "light"), r"\bNeutral100Light\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)", "Neutral100Light"),
    (("color", "neutral", "100", "dark"),  r"\bNeutral100Dark\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",  "Neutral100Dark"),
    (("color", "neutral", "200", "light"), r"\bNeutral200Light\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)", "Neutral200Light"),
    (("color", "neutral", "200", "dark"),  r"\bNeutral200Dark\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",  "Neutral200Dark"),
    (("color", "neutral", "500", "light"), r"\bNeutral500Light\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)", "Neutral500Light"),
    (("color", "neutral", "500", "dark"),  r"\bNeutral500Dark\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",  "Neutral500Dark"),
    (("color", "neutral", "900", "light"), r"\bNeutral900Light\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)", "Neutral900Light"),
    (("color", "neutral", "900", "dark"),  r"\bNeutral900Dark\b[^=\n]*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)",  "Neutral900Dark"),
    # ── Spacing (Spacing.kt) ──────────────────────────────────────────────────
    (("spacing", "space0"),  r"\bspace0\b[^=\n]*=\s*(\d+)\.dp",  "HomeservicesSpacing.space0"),
    (("spacing", "space1"),  r"\bspace1\b[^=\n]*=\s*(\d+)\.dp",  "HomeservicesSpacing.space1"),
    (("spacing", "space2"),  r"\bspace2\b[^=\n]*=\s*(\d+)\.dp",  "HomeservicesSpacing.space2"),
    (("spacing", "space3"),  r"\bspace3\b[^=\n]*=\s*(\d+)\.dp",  "HomeservicesSpacing.space3"),
    (("spacing", "space4"),  r"\bspace4\b[^=\n]*=\s*(\d+)\.dp",  "HomeservicesSpacing.space4"),
    (("spacing", "space6"),  r"\bspace6\b[^=\n]*=\s*(\d+)\.dp",  "HomeservicesSpacing.space6"),
    (("spacing", "space8"),  r"\bspace8\b[^=\n]*=\s*(\d+)\.dp",  "HomeservicesSpacing.space8"),
    (("spacing", "space12"), r"\bspace12\b[^=\n]*=\s*(\d+)\.dp", "HomeservicesSpacing.space12"),
    (("spacing", "space16"), r"\bspace16\b[^=\n]*=\s*(\d+)\.dp", "HomeservicesSpacing.space16"),
    (("spacing", "space24"), r"\bspace24\b[^=\n]*=\s*(\d+)\.dp", "HomeservicesSpacing.space24"),
    # ── Elevation Dp values (Elevation.kt) ───────────────────────────────────
    (("elevation", "elev0"), r"\belev0\b[^=\n]*=\s*(\d+)\.dp", "HomeservicesElevation.elev0"),
    (("elevation", "elev1"), r"\belev1\b[^=\n]*=\s*(\d+)\.dp", "HomeservicesElevation.elev1"),
    (("elevation", "elev2"), r"\belev2\b[^=\n]*=\s*(\d+)\.dp", "HomeservicesElevation.elev2"),
    (("elevation", "elev3"), r"\belev3\b[^=\n]*=\s*(\d+)\.dp", "HomeservicesElevation.elev3"),
    (("elevation", "elev4"), r"\belev4\b[^=\n]*=\s*(\d+)\.dp", "HomeservicesElevation.elev4"),
    # ── Radius (Radius.kt) — HomeservicesRadius scoping avoids sm/md/lg clashes
    (("radius", "sm"),   r"\bHomeservicesRadius\b[\s\S]*?\bsm\b[^=\n]*=\s*(\d+)\.dp",   "HomeservicesRadius.sm"),
    (("radius", "md"),   r"\bHomeservicesRadius\b[\s\S]*?\bmd\b[^=\n]*=\s*(\d+)\.dp",   "HomeservicesRadius.md"),
    (("radius", "lg"),   r"\bHomeservicesRadius\b[\s\S]*?\blg\b[^=\n]*=\s*(\d+)\.dp",   "HomeservicesRadius.lg"),
    (("radius", "xl"),   r"\bHomeservicesRadius\b[\s\S]*?\bxl\b[^=\n]*=\s*(\d+)\.dp",   "HomeservicesRadius.xl"),
    (("radius", "full"), r"\bHomeservicesRadius\b[\s\S]*?\bfull\b[^=\n]*=\s*(\d+)\.dp", "HomeservicesRadius.full"),
    # ── Motion durations (Motion.kt) ─────────────────────────────────────────
    (("motion", "duration", "fast"),   r"\bfast\b[^=\n]*=\s*(\d+)\.milliseconds",   "HomeservicesMotion.fast"),
    (("motion", "duration", "base"),   r"\bbase\b[^=\n]*=\s*(\d+)\.milliseconds",   "HomeservicesMotion.base"),
    (("motion", "duration", "medium"), r"\bmedium\b[^=\n]*=\s*(\d+)\.milliseconds", "HomeservicesMotion.medium"),
    (("motion", "duration", "slow"),   r"\bslow\b[^=\n]*=\s*(\d+)\.milliseconds",   "HomeservicesMotion.slow"),
]


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_json_value(data: dict, path: tuple[str, ...]) -> Optional[object]:
    """Navigate nested dicts; return the '$value' leaf or None if path missing."""
    node = data
    for key in path:
        if not isinstance(node, dict) or key not in node:
            return None
        node = node[key]
    if isinstance(node, dict) and "$value" in node:
        return node["$value"]
    return None


def _find_in_kt_files(theme_dir: Path, pattern: str) -> Optional[str]:
    """Search all *.kt files; return the first capture group of the first match."""
    compiled = re.compile(pattern, re.DOTALL)
    for kt_file in sorted(theme_dir.glob("*.kt")):
        m = compiled.search(kt_file.read_text(encoding="utf-8"))
        if m:
            return m.group(1)
    return None


def _normalize_color(value: object) -> str:
    """Strip '#' and uppercase; e.g. '#0E4F47' → '0E4F47'."""
    return str(value).lstrip("#").upper()


def _normalize_int(value: object) -> int:
    """Cast to int; e.g. '4' or 4 → 4."""
    return int(value)


# ─────────────────────────────────────────────────────────────────────────────
# Core check
# ─────────────────────────────────────────────────────────────────────────────

def run_checks(variables_json: Path, theme_dir: Path) -> list[str]:
    """
    Return a list of error strings. Empty list means all checks passed.
    """
    with open(variables_json, encoding="utf-8") as fh:
        json_data = json.load(fh)

    errors: list[str] = []

    for json_path, kt_regex, display_name in CHECKS:
        json_raw = _get_json_value(json_data, json_path)
        kt_raw = _find_in_kt_files(theme_dir, kt_regex)

        if json_raw is None and kt_raw is None:
            # Neither source has this token — e.g. minimal test fixture.
            continue

        if json_raw is None and kt_raw is not None:
            errors.append(
                f"MISSING FROM JSON: {display_name} = {kt_raw!r} "
                f"(path: {'.'.join(json_path)})"
            )
            continue

        if json_raw is not None and kt_raw is None:
            errors.append(
                f"MISSING FROM KOTLIN: {display_name} exists in JSON "
                f"(path: {'.'.join(json_path)}, value: {json_raw!r}) "
                f"but was not found in Kotlin theme files — remove it from JSON or restore the constant"
            )
            continue

        # Both present — compare normalised values.
        # Determine type from the JSON node's $type field.
        node = json_data
        for key in json_path:
            node = node[key]
        token_type = node.get("$type", "") if isinstance(node, dict) else ""

        if token_type == "color":
            json_norm = _normalize_color(json_raw)
            kt_norm = _normalize_color(kt_raw)
            if json_norm != kt_norm:
                errors.append(
                    f"COLOR MISMATCH: {display_name} — "
                    f"JSON=#{json_norm}, Kotlin=#{kt_norm}"
                )
        else:
            # Dimension / duration / etc. — compare as integers.
            try:
                json_int = _normalize_int(json_raw)
                kt_int = _normalize_int(kt_raw)
                if json_int != kt_int:
                    errors.append(
                        f"VALUE MISMATCH: {display_name} — "
                        f"JSON={json_int}, Kotlin={kt_int}"
                    )
            except (ValueError, TypeError) as exc:
                errors.append(
                    f"PARSE ERROR: {display_name} — {exc} "
                    f"(json_raw={json_raw!r}, kt_raw={kt_raw!r})"
                )

    return errors


# ─────────────────────────────────────────────────────────────────────────────
# CLI entry point
# ─────────────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Verify figma/variables.json mirrors Kotlin design-system tokens."
    )
    parser.add_argument(
        "--variables-json",
        type=Path,
        default=DEFAULT_VARIABLES_JSON,
        help="Path to the W3C DTCG variables.json file.",
    )
    parser.add_argument(
        "--theme-dir",
        type=Path,
        default=DEFAULT_THEME_DIR,
        help="Path to the directory containing *.kt theme files.",
    )
    args = parser.parse_args()

    if not args.variables_json.is_file():
        print(f"ERROR: variables JSON not found: {args.variables_json}", file=sys.stderr)
        return 1
    if not args.theme_dir.is_dir():
        print(f"ERROR: theme dir not found: {args.theme_dir}", file=sys.stderr)
        return 1

    errors = run_checks(args.variables_json, args.theme_dir)

    if errors:
        print(
            f"Token drift detected — {len(errors)} issue(s) between "
            f"{args.variables_json} and {args.theme_dir}:",
            file=sys.stderr,
        )
        for err in errors:
            print(f"  • {err}", file=sys.stderr)
        print(
            "\nFix: update figma/variables.json to match the Kotlin constants, "
            "then re-run this script.",
            file=sys.stderr,
        )
        return 1

    print(
        f"OK: {len(CHECKS)} token checks passed — "
        f"figma/variables.json is consistent with Kotlin design-system."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
