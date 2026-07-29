#!/usr/bin/env python3
"""Fail Android builds when new token debt appears outside the design system."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
BASELINE_PATH = REPO_ROOT / "tools" / "android-design-token-baseline.json"
APPS = ("customer-app", "technician-app")

SPACING_VALUES = {0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96}
RADIUS_VALUES = {
    "customer-app": {8, 12, 20, 9999},
    "technician-app": {4, 8, 12, 9999},
}
ALLOWED_XML_COLORS = {
    "#00000000",
    "#FFFFFF",
    "#0E0B08",
    "#E2A04A",
    "#F1B86A",
}

DP_PATTERN = re.compile(r"(?<![\w.])(\d+(?:\.\d+)?)\.dp\b")
COLOR_PATTERN = re.compile(r"Color\(0x[0-9A-Fa-f]{8}\)")
XML_COLOR_PATTERN = re.compile(r"#[0-9A-Fa-f]{6,8}")
RADIUS_CONTEXT_PATTERN = re.compile(r"(RoundedCornerShape|CutCornerShape|cornerRadius|CornerSize)\s*\(")
SPACING_CONTEXT_PATTERN = re.compile(
    r"(\.padding\s*\(|PaddingValues\s*\(|spacedBy\s*\(|Spacer\s*\(|\.offset\s*\(|"
    r"\.width\s*\(|\.height\s*\(|\.size\s*\(|\.requiredWidth\s*\(|\.requiredHeight\s*\(|"
    r"\.requiredSize\s*\(|\.defaultMinSize\s*\()"
)
BORDER_CONTEXT_PATTERN = re.compile(r"(BorderStroke\s*\(|\.border\s*\(|Divider\s*\(|HorizontalDivider\s*\(|VerticalDivider\s*\()")


def source_roots(app: str) -> list[Path]:
    src = REPO_ROOT / app / "app" / "src"
    return sorted(path for path in src.iterdir() if path.is_dir())


def kt_files(app: str) -> list[Path]:
    files: list[Path] = []
    for root in source_roots(app):
        for directory_name in ("kotlin", "java"):
            directory = root / directory_name
            if directory.is_dir():
                files.extend(directory.rglob("*.kt"))
    return sorted(files)


def xml_files(app: str) -> list[Path]:
    files: list[Path] = []
    for root in source_roots(app):
        directory = root / "res"
        if directory.is_dir():
            files.extend(directory.rglob("*.xml"))
    return sorted(files)


def is_allowed_dp(raw_value: str, allowed: set[int]) -> bool:
    value = float(raw_value)
    return value.is_integer() and int(value) in allowed


def finding(category: str, app: str, path: Path, value: str, line: str) -> str:
    relative = path.relative_to(REPO_ROOT / app).as_posix()
    normalized_line = " ".join(line.strip().split())
    return f"{category}|{relative}|{value}|{normalized_line}"


def kt_findings(app: str) -> list[str]:
    results: list[str] = []
    allowed_radius = RADIUS_VALUES[app]
    for path in kt_files(app):
        for line in path.read_text(encoding="utf-8").splitlines():
            for match in COLOR_PATTERN.finditer(line):
                results.append(finding("raw_color", app, path, match.group(0), line))

            values = [match.group(1) for match in DP_PATTERN.finditer(line)]
            if not values or BORDER_CONTEXT_PATTERN.search(line):
                continue
            if RADIUS_CONTEXT_PATTERN.search(line):
                for value in values:
                    if not is_allowed_dp(value, allowed_radius):
                        results.append(finding("radius", app, path, value, line))
            elif SPACING_CONTEXT_PATTERN.search(line):
                for value in values:
                    if not is_allowed_dp(value, SPACING_VALUES):
                        results.append(finding("spacing", app, path, value, line))
    return results


def xml_findings(app: str) -> list[str]:
    results: list[str] = []
    for path in xml_files(app):
        for line in path.read_text(encoding="utf-8").splitlines():
            for match in XML_COLOR_PATTERN.finditer(line):
                value = match.group(0).upper()
                if value not in ALLOWED_XML_COLORS:
                    results.append(finding("xml_color", app, path, value, line))
    return results


def collect_findings(app: str) -> list[str]:
    return sorted(kt_findings(app) + xml_findings(app))


def load_baseline() -> dict[str, list[str]]:
    return json.loads(BASELINE_PATH.read_text(encoding="utf-8"))


def write_baseline() -> None:
    data = {app: collect_findings(app) for app in APPS}
    BASELINE_PATH.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def check_app(app: str, baseline: dict[str, list[str]]) -> list[str]:
    expected = set(baseline.get(app, []))
    actual = set(collect_findings(app))
    return sorted(actual - expected)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("app", choices=APPS)
    parser.add_argument("--update-baseline", action="store_true")
    args = parser.parse_args()

    if args.update_baseline:
        write_baseline()
        print(f"Updated {BASELINE_PATH.relative_to(REPO_ROOT)}")
        return 0

    baseline = load_baseline()
    new_findings = check_app(args.app, baseline)
    if new_findings:
        print(f"Design-token enforcement failed for {args.app}; new debt found:", file=sys.stderr)
        for item in new_findings[:50]:
            print(f"  - {item}", file=sys.stderr)
        if len(new_findings) > 50:
            print(f"  ... {len(new_findings) - 50} more", file=sys.stderr)
        return 1

    total = len(collect_findings(args.app))
    print(f"OK: {args.app} has no new token debt ({total} baseline findings remain).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
