import importlib.util
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "verify-android-design-tokens.py"
spec = importlib.util.spec_from_file_location("verify_android_design_tokens", SCRIPT)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)


def test_fractional_dp_is_not_allowed_by_integer_scales():
    assert module.is_allowed_dp("4", {4, 8})
    assert not module.is_allowed_dp("4.5", {4, 8})
    assert not module.is_allowed_dp("8.9", {4, 8})


def test_finding_fingerprint_includes_path_value_and_line_content():
    path = module.REPO_ROOT / "customer-app" / "app" / "src" / "main" / "Example.kt"
    first = module.finding("radius", "customer-app", path, "14", "shape = RoundedCornerShape(14.dp)")
    second = module.finding("radius", "customer-app", path, "14", "shape = RoundedCornerShape(16.dp)")

    assert first != second
    assert "radius|app/src/main/Example.kt|14|" in first


def test_check_app_reports_actual_findings_missing_from_baseline(monkeypatch):
    monkeypatch.setattr(module, "collect_findings", lambda app: ["new", "old"])

    assert module.check_app("customer-app", {"customer-app": ["old"]}) == ["new"]


def test_write_baseline_collects_every_app(tmp_path, monkeypatch):
    baseline_path = tmp_path / "android-design-token-baseline.json"
    monkeypatch.setattr(module, "BASELINE_PATH", baseline_path)
    monkeypatch.setattr(module, "APPS", ("customer-app", "technician-app"))
    monkeypatch.setattr(module, "collect_findings", lambda app: [f"{app}-finding"])

    module.write_baseline()

    assert baseline_path.read_text(encoding="utf-8") == (
        "{\n"
        '  "customer-app": [\n'
        '    "customer-app-finding"\n'
        "  ],\n"
        '  "technician-app": [\n'
        '    "technician-app-finding"\n'
        "  ]\n"
        "}\n"
    )
