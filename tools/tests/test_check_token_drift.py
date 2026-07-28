import json
import os
import subprocess
import sys
import textwrap

SCRIPT = os.path.join(os.path.dirname(__file__), "..", "check-token-drift.py")
REPO_ROOT = os.path.join(os.path.dirname(__file__), "..", "..")


def run_script(*extra_args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, SCRIPT, *extra_args],
        capture_output=True,
        text=True,
    )


def minimal_variables_json(accent: str = "E2A04A") -> dict:
    def leaf(value: str) -> dict:
        return {"$value": f"#{value}", "$type": "color"}

    return {
        "color": {
            "core": {
                "accent": {"light": leaf(accent), "dark": leaf(accent)},
                "canvas": {"light": leaf("FBF6E9"), "dark": leaf("0E0B08")},
                "surface": {"light": leaf("F4EDDF"), "dark": leaf("1A1610")},
                "surfaceRaised": {"light": leaf("E9DFC6"), "dark": leaf("221C15")},
                "textStrong": {"light": leaf("1A140F"), "dark": leaf("F1E9D8")},
                "textMuted": {"light": leaf("4A4135"), "dark": leaf("9A9082")},
                "textFaint": {"light": leaf("6E665B"), "dark": leaf("877A6D")},
                "border": {"light": leaf("D4C9AB"), "dark": leaf("2E2719")},
                "borderStrong": {"light": leaf("B0A382"), "dark": leaf("3E3528")},
            }
        }
    }


def color_kt() -> str:
    return textwrap.dedent(
        """
        package com.homeservices.designsystem.theme
        import androidx.compose.ui.graphics.Color
        internal val BrandAccent = Color(0xFFE2A04A)
        internal val CanvasLight = Color(0xFFFBF6E9)
        internal val SurfaceLight = Color(0xFFF4EDDF)
        internal val SurfaceRaisedLight = Color(0xFFE9DFC6)
        internal val TextStrongLight = Color(0xFF1A140F)
        internal val TextMutedLight = Color(0xFF4A4135)
        internal val TextFaintLight = Color(0xFF6E665B)
        internal val BorderLight = Color(0xFFD4C9AB)
        internal val BorderStrongLight = Color(0xFFB0A382)
        internal val CanvasDark = Color(0xFF0E0B08)
        internal val SurfaceDark = Color(0xFF1A1610)
        internal val SurfaceRaisedDark = Color(0xFF221C15)
        internal val TextStrongDark = Color(0xFFF1E9D8)
        internal val TextMutedDark = Color(0xFF9A9082)
        internal val TextFaintDark = Color(0xFF877A6D)
        internal val BorderDark = Color(0xFF2E2719)
        internal val BorderStrongDark = Color(0xFF3E3528)
        """
    )


def css(accent: str = "E2A04A") -> str:
    return textwrap.dedent(
        f"""
        :root {{
          --d1-accent-light: #{accent};
          --d1-accent-dark: #{accent};
          --d1-canvas-light: #FBF6E9;
          --d1-canvas-dark: #0E0B08;
          --d1-surface-light: #F4EDDF;
          --d1-surface-dark: #1A1610;
          --d1-surface-raised-light: #E9DFC6;
          --d1-surface-raised-dark: #221C15;
          --d1-text-strong-light: #1A140F;
          --d1-text-strong-dark: #F1E9D8;
          --d1-text-muted-light: #4A4135;
          --d1-text-muted-dark: #9A9082;
          --d1-text-faint-light: #6E665B;
          --d1-text-faint-dark: #877A6D;
          --d1-border-light: #D4C9AB;
          --d1-border-dark: #2E2719;
          --d1-border-strong-light: #B0A382;
          --d1-border-strong-dark: #3E3528;
        }}
        """
    )


def write_fixtures(tmp_path, json_accent: str = "E2A04A", css_accent: str = "E2A04A") -> tuple[str, str, str]:
    variables_path = tmp_path / "variables.json"
    variables_path.write_text(json.dumps(minimal_variables_json(json_accent)), encoding="utf-8")
    theme_dir = tmp_path / "theme"
    theme_dir.mkdir()
    (theme_dir / "Color.kt").write_text(color_kt(), encoding="utf-8")
    css_path = tmp_path / "globals.css"
    css_path.write_text(css(css_accent), encoding="utf-8")
    return str(variables_path), str(theme_dir), str(css_path)


def test_matching_core_colors_pass(tmp_path):
    variables, theme, admin_css = write_fixtures(tmp_path)
    result = run_script("--variables-json", variables, "--theme-dir", theme, "--admin-css", admin_css)
    assert result.returncode == 0, result.stderr


def test_json_mismatch_fails(tmp_path):
    variables, theme, admin_css = write_fixtures(tmp_path, json_accent="AABBCC")
    result = run_script("--variables-json", variables, "--theme-dir", theme, "--admin-css", admin_css)
    assert result.returncode != 0
    assert "accent.light" in result.stderr


def test_css_mismatch_fails(tmp_path):
    variables, theme, admin_css = write_fixtures(tmp_path, css_accent="AABBCC")
    result = run_script("--variables-json", variables, "--theme-dir", theme, "--admin-css", admin_css)
    assert result.returncode != 0
    assert "accent.light" in result.stderr


def test_missing_css_role_fails(tmp_path):
    variables, theme, admin_css = write_fixtures(tmp_path)
    with open(admin_css, "w", encoding="utf-8") as handle:
        handle.write(":root { --d1-accent-light: #E2A04A; }")
    result = run_script("--variables-json", variables, "--theme-dir", theme, "--admin-css", admin_css)
    assert result.returncode != 0
    assert "MISSING FROM ADMIN CSS" in result.stderr


def test_project_files_consistent():
    variables_json = os.path.join(REPO_ROOT, "figma", "variables.json")
    theme_dir = os.path.join(
        REPO_ROOT,
        "design-system",
        "src",
        "main",
        "kotlin",
        "com",
        "homeservices",
        "designsystem",
        "theme",
    )
    admin_css = os.path.join(REPO_ROOT, "admin-web", "app", "globals.css")
    result = run_script("--variables-json", variables_json, "--theme-dir", theme_dir, "--admin-css", admin_css)
    assert result.returncode == 0, f"stdout:\n{result.stdout}\nstderr:\n{result.stderr}"
