#!/usr/bin/env python3
"""Verify D1 core color roles across Kotlin, Figma JSON and admin CSS."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
DEFAULT_VARIABLES_JSON = REPO_ROOT / "figma" / "variables.json"
DEFAULT_THEME_DIR = REPO_ROOT / "design-system" / "src" / "main" / "kotlin" / "com" / "homeservices" / "designsystem" / "theme"
DEFAULT_ADMIN_CSS = REPO_ROOT / "admin-web" / "app" / "globals.css"

CORE_COLOR_CHECKS: list[tuple[str, str, tuple[str, ...], str]] = [
    ("accent", "light", ("color", "core", "accent", "light"), "BrandAccent"),
    ("accent", "dark", ("color", "core", "accent", "dark"), "BrandAccent"),
    ("canvas", "light", ("color", "core", "canvas", "light"), "CanvasLight"),
    ("canvas", "dark", ("color", "core", "canvas", "dark"), "CanvasDark"),
    ("surface", "light", ("color", "core", "surface", "light"), "SurfaceLight"),
    ("surface", "dark", ("color", "core", "surface", "dark"), "SurfaceDark"),
    ("surface-raised", "light", ("color", "core", "surfaceRaised", "light"), "SurfaceRaisedLight"),
    ("surface-raised", "dark", ("color", "core", "surfaceRaised", "dark"), "SurfaceRaisedDark"),
    ("text-strong", "light", ("color", "core", "textStrong", "light"), "TextStrongLight"),
    ("text-strong", "dark", ("color", "core", "textStrong", "dark"), "TextStrongDark"),
    ("text-muted", "light", ("color", "core", "textMuted", "light"), "TextMutedLight"),
    ("text-muted", "dark", ("color", "core", "textMuted", "dark"), "TextMutedDark"),
    ("text-faint", "light", ("color", "core", "textFaint", "light"), "TextFaintLight"),
    ("text-faint", "dark", ("color", "core", "textFaint", "dark"), "TextFaintDark"),
    ("border", "light", ("color", "core", "border", "light"), "BorderLight"),
    ("border", "dark", ("color", "core", "border", "dark"), "BorderDark"),
    ("border-strong", "light", ("color", "core", "borderStrong", "light"), "BorderStrongLight"),
    ("border-strong", "dark", ("color", "core", "borderStrong", "dark"), "BorderStrongDark"),
]


def normalize_color(value: object) -> str:
    return str(value).strip().lstrip("#").upper()


def json_value(data: dict, path: tuple[str, ...]) -> object | None:
    node: object = data
    for key in path:
        if not isinstance(node, dict) or key not in node:
            return None
        node = node[key]
    if isinstance(node, dict):
        return node.get("$value")
    return None


def parse_kotlin_colors(theme_dir: Path) -> dict[str, str]:
    color_file = theme_dir / "Color.kt"
    text = color_file.read_text(encoding="utf-8")
    pairs = re.findall(r"\binternal\s+val\s+(\w+)\s*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)", text)
    return {name: hex_value.upper() for name, hex_value in pairs}


def parse_css_roles(admin_css: Path) -> dict[tuple[str, str], str]:
    text = admin_css.read_text(encoding="utf-8")
    pairs = re.findall(r"--d1-([a-z-]+)-(light|dark):\s*(#[0-9A-Fa-f]{6})\s*;", text)
    return {(role, mode): normalize_color(value) for role, mode, value in pairs}


def load_json_roles(variables_json: Path) -> dict[tuple[str, str], str]:
    data = json.loads(variables_json.read_text(encoding="utf-8"))
    roles: dict[tuple[str, str], str] = {}
    for role, mode, path, _kotlin_name in CORE_COLOR_CHECKS:
        value = json_value(data, path)
        if value is not None:
            roles[(role, mode)] = normalize_color(value)
    return roles


def run_checks(variables_json: Path, theme_dir: Path, admin_css: Path) -> list[str]:
    kotlin = parse_kotlin_colors(theme_dir)
    figma = load_json_roles(variables_json)
    css = parse_css_roles(admin_css)

    errors: list[str] = []
    for role, mode, _json_path, kotlin_name in CORE_COLOR_CHECKS:
        key = (role, mode)
        kt_value = kotlin.get(kotlin_name)
        figma_value = figma.get(key)
        css_value = css.get(key)
        label = f"{role}.{mode}"

        if kt_value is None:
            errors.append(f"MISSING FROM KOTLIN: {label} ({kotlin_name})")
            continue
        if figma_value is None:
            errors.append(f"MISSING FROM FIGMA JSON: {label}")
            continue
        if css_value is None:
            errors.append(f"MISSING FROM ADMIN CSS: --d1-{role}-{mode}")
            continue
        if len({kt_value, figma_value, css_value}) != 1:
            errors.append(
                f"COLOR MISMATCH: {label} Kotlin=#{kt_value}, Figma=#{figma_value}, CSS=#{css_value}"
            )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify D1 core colors across token mirrors.")
    parser.add_argument("--variables-json", type=Path, default=DEFAULT_VARIABLES_JSON)
    parser.add_argument("--theme-dir", type=Path, default=DEFAULT_THEME_DIR)
    parser.add_argument("--admin-css", type=Path, default=DEFAULT_ADMIN_CSS)
    args = parser.parse_args()

    for path in (args.variables_json, args.admin_css):
        if not path.is_file():
            print(f"ERROR: file not found: {path}", file=sys.stderr)
            return 1
    if not args.theme_dir.is_dir():
        print(f"ERROR: theme dir not found: {args.theme_dir}", file=sys.stderr)
        return 1

    errors = run_checks(args.variables_json, args.theme_dir, args.admin_css)
    if errors:
        print(f"Token drift detected - {len(errors)} issue(s):", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        print("Fix: update Kotlin, figma/variables.json and admin-web/app/globals.css together.", file=sys.stderr)
        return 1

    print(f"OK: {len(CORE_COLOR_CHECKS)} D1 core color checks passed across Kotlin, Figma JSON and admin CSS.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
