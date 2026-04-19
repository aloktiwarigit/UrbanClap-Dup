"""
TDD tests for tools/check-token-drift.py

Tests are written BEFORE the implementation (Red phase). They verify:
1. Matching tokens between figma/variables.json and Kotlin files → exit 0
2. Color hex mismatch → exit non-zero, error message names the token
3. Spacing value mismatch → exit non-zero, error message names the token
4. Token present in Kotlin but absent from JSON → exit non-zero
5. The actual project figma/variables.json is consistent with the committed Kotlin files

Run:  python -m pytest tools/tests/test_check_token_drift.py -v
"""
import json
import os
import subprocess
import sys
import tempfile
import textwrap

SCRIPT = os.path.join(os.path.dirname(__file__), "..", "check-token-drift.py")
REPO_ROOT = os.path.join(os.path.dirname(__file__), "..", "..")


def run_script(*extra_args: str, env_overrides: dict | None = None) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    if env_overrides:
        env.update(env_overrides)
    return subprocess.run(
        [sys.executable, SCRIPT, *extra_args],
        capture_output=True,
        text=True,
        env=env,
    )


def _write_tmp(directory: str, filename: str, content: str) -> str:
    path = os.path.join(directory, filename)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)
    return path


# ─────────────────────────────────────────────────────────────────────────────
# Helpers that write minimal fixture files
# ─────────────────────────────────────────────────────────────────────────────

def _minimal_variables_json(color_hex: str = "0E4F47", spacing_val: int = 4) -> dict:
    """Minimal DTCG JSON with one color and one spacing token."""
    return {
        "color": {
            "brand": {
                "primary": {
                    "light": {"$value": f"#{color_hex}", "$type": "color"}
                }
            }
        },
        "spacing": {
            "space1": {"$value": spacing_val, "$type": "spacing"}
        },
    }


def _minimal_color_kt(hex_value: str = "0E4F47") -> str:
    return textwrap.dedent(f"""\
        package com.homeservices.designsystem.theme
        import androidx.compose.ui.graphics.Color
        internal val BrandPrimaryLight = Color(0xFF{hex_value})
    """)


def _minimal_spacing_kt(space1_val: int = 4) -> str:
    return textwrap.dedent(f"""\
        package com.homeservices.designsystem.theme
        import androidx.compose.ui.unit.dp
        public object HomeservicesSpacing {{
            public val space1 = {space1_val}.dp
        }}
    """)


# ─────────────────────────────────────────────────────────────────────────────
# Test 1 — matching tokens → exit 0
# ─────────────────────────────────────────────────────────────────────────────

def test_matching_tokens_passes(tmp_path):
    variables_path = tmp_path / "variables.json"
    variables_path.write_text(json.dumps(_minimal_variables_json("0E4F47", 4)))

    theme_dir = tmp_path / "theme"
    theme_dir.mkdir()
    (theme_dir / "Color.kt").write_text(_minimal_color_kt("0E4F47"))
    (theme_dir / "Spacing.kt").write_text(_minimal_spacing_kt(4))

    result = run_script(
        "--variables-json", str(variables_path),
        "--theme-dir", str(theme_dir),
    )
    assert result.returncode == 0, f"Expected exit 0; stderr: {result.stderr}"


# ─────────────────────────────────────────────────────────────────────────────
# Test 2 — color hex mismatch → exit ≠ 0, token path named in output
# ─────────────────────────────────────────────────────────────────────────────

def test_color_hex_mismatch_fails(tmp_path):
    variables_path = tmp_path / "variables.json"
    variables_path.write_text(json.dumps(_minimal_variables_json("AABBCC", 4)))  # wrong hex

    theme_dir = tmp_path / "theme"
    theme_dir.mkdir()
    (theme_dir / "Color.kt").write_text(_minimal_color_kt("0E4F47"))  # correct hex
    (theme_dir / "Spacing.kt").write_text(_minimal_spacing_kt(4))

    result = run_script(
        "--variables-json", str(variables_path),
        "--theme-dir", str(theme_dir),
    )
    assert result.returncode != 0, "Expected non-zero exit on color mismatch"
    combined = (result.stdout + result.stderr).upper()
    assert "BRANDPRIMARYLIGHT" in combined or "COLOR" in combined, (
        f"Expected token name in output; got: {result.stdout}{result.stderr}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Test 3 — spacing value mismatch → exit ≠ 0, token path named in output
# ─────────────────────────────────────────────────────────────────────────────

def test_spacing_mismatch_fails(tmp_path):
    variables_path = tmp_path / "variables.json"
    variables_path.write_text(json.dumps(_minimal_variables_json("0E4F47", 99)))  # wrong spacing

    theme_dir = tmp_path / "theme"
    theme_dir.mkdir()
    (theme_dir / "Color.kt").write_text(_minimal_color_kt("0E4F47"))
    (theme_dir / "Spacing.kt").write_text(_minimal_spacing_kt(4))  # correct spacing

    result = run_script(
        "--variables-json", str(variables_path),
        "--theme-dir", str(theme_dir),
    )
    assert result.returncode != 0, "Expected non-zero exit on spacing mismatch"
    combined = (result.stdout + result.stderr).upper()
    assert "SPACE" in combined or "SPACING" in combined, (
        f"Expected spacing token name in output; got: {result.stdout}{result.stderr}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Test 4 — token in Kotlin but missing from JSON → exit ≠ 0
# ─────────────────────────────────────────────────────────────────────────────

def test_missing_token_in_json_fails(tmp_path):
    # JSON has no spacing entry
    incomplete = {"color": {"brand": {"primary": {"light": {"$value": "#0E4F47", "$type": "color"}}}}}
    variables_path = tmp_path / "variables.json"
    variables_path.write_text(json.dumps(incomplete))

    theme_dir = tmp_path / "theme"
    theme_dir.mkdir()
    (theme_dir / "Color.kt").write_text(_minimal_color_kt("0E4F47"))
    (theme_dir / "Spacing.kt").write_text(_minimal_spacing_kt(4))  # spacing present in Kotlin

    result = run_script(
        "--variables-json", str(variables_path),
        "--theme-dir", str(theme_dir),
    )
    assert result.returncode != 0, "Expected non-zero exit when JSON missing a token"


# ─────────────────────────────────────────────────────────────────────────────
# Test 5 — integration: real project files are consistent
# ─────────────────────────────────────────────────────────────────────────────

def test_project_files_consistent():
    """
    Run the drift checker against the actual committed files.
    Fails if someone edits a Kotlin constant without updating variables.json,
    or vice-versa.
    """
    variables_json = os.path.join(REPO_ROOT, "figma", "variables.json")
    theme_dir = os.path.join(
        REPO_ROOT,
        "design-system", "src", "main", "kotlin",
        "com", "homeservices", "designsystem", "theme",
    )

    assert os.path.isfile(variables_json), f"Missing {variables_json}"
    assert os.path.isdir(theme_dir), f"Missing {theme_dir}"

    result = run_script("--variables-json", variables_json, "--theme-dir", theme_dir)
    assert result.returncode == 0, (
        "Token drift detected between figma/variables.json and Kotlin design-system.\n"
        f"stdout:\n{result.stdout}\nstderr:\n{result.stderr}"
    )
