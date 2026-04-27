# Story E01-S05: Figma library + design-system token sync (W3C DTCG + drift checker)

Status: shipped (PR #7, merged 2026-04-19, commit `cf8e54a`) — **retroactive docs**

> **Epic:** E01 — Foundations, CI & Design System (`docs/stories/README.md` §E01)
> **Sprint:** S1 (wk 1–2) · **Estimated:** ≤ 1 dev-day · **Priority:** P1
> **Sub-project:** root (`figma/`, `tools/`, `.github/workflows/design-system-ship.yml`)
> **Ceremony tier:** Feature (lean — embedded brainstorm; no source-code edits to Android/web/api)
> **Prerequisite:** E01-S04 (design-system module with Kotlin tokens — merged before this story)
> **Retroactive note:** This story file is being written *after* the implementation merged. PR #7 shipped without `docs/stories/E01-S05-*.md` ever landing in main. Acceptance criteria below are reverse-engineered from the merged code (`figma/variables.json`, `tools/check-token-drift.py`, `TOKEN-SYNC.md`, `.github/workflows/design-system-ship.yml`) and the original `plans/E01-S05.md` that did land in main.

---

## Story

As the **solo founder-operator** maintaining the homeservices design system on Claude Max + free-tier infrastructure (ADR-0007),
I want a Figma-importable library file that mirrors the Kotlin design tokens, plus a CI drift checker that fails any PR where the JSON and Kotlin diverge,
so that **future UI work can use Figma as a visual reference + design handoff surface without paying for Figma Variables write API or Dev Mode (Professional+ plan), and so the design-system module remains the single source of truth — code drives the JSON, not the other way around**.

The story is deliberately scoped to free-tier tooling: W3C DTCG JSON (Token Studio free Figma plugin imports it natively), a Python stdlib drift checker (no `pytest`, no extra deps — runs on the GitHub-hosted ubuntu runner with built-in `python3`), and `.figma.kts` Code Connect stubs that document the workflow when the team eventually upgrades.

---

## Acceptance Criteria

### AC-1 · Figma free-tier cost check passes (no new paid SaaS)
- **Given** the implementation under ADR-0007 ("zero paid SaaS")
- **Then** every artefact added in this story uses only free-tier services or OSS tools
- **And** Figma Variables REST API (write) and Figma Dev Mode are explicitly **not** used (both require Professional+ at $15/editor/mo)
- **And** the fallback path is documented in `plans/E01-S05.md` §"Figma free-tier cost check"

### AC-2 · `figma/variables.json` mirrors all 6 token categories in W3C DTCG format
- **Given** the Kotlin tokens defined in `design-system/src/main/kotlin/com/homeservices/designsystem/theme/`
- **Then** `figma/variables.json` contains a W3C DTCG (`$value` / `$type`) tree covering:
  - `color/brand` — primary, primaryHover, accent (light + dark)
  - `color/semantic` — success, warning, danger, info (light + dark)
  - `color/neutral` — 0, 50, 100, 200, 500, 900 (light + dark)
  - `color/extended` — verified, neighbourhood (light + dark)
  - `color/m3container` — Material 3 surface containers (light + dark)
  - `typography` — `display.xl/lg`, `title.lg/md/sm`, `body.lg/md/sm`, `label.lg/sm`
  - `spacing` — `space.0..space.24` (4pt grid)
  - `motion` — `duration.fast/base/medium/slow`, `easing.standard/emphasizedDecelerate`
  - `elevation` — `elev.0..elev.4` (Dp values)
  - `radius` — `sm`, `md`, `lg`, `xl`, `full`
- **And** the JSON is syntactically valid and importable via the free Token Studio Figma plugin

### AC-3 · `figma/README.md` documents the Token Studio import workflow
- **Given** a future contributor wanting to use the Figma library
- **Then** `figma/README.md` provides:
  - Part 1: Token Studio plugin import flow (free tier)
  - Part 2: figma-code-connect activation workflow (for when Dev Mode is later activated)
  - Part 3: Sync flow — Kotlin → JSON → Figma (one-way, code is source of truth)

### AC-4 · `figma/code-connect/HomeservicesTheme.figma.kts` provides Code Connect stubs
- **Given** the OSS `@figma/code-connect` CLI (free; Dev Mode publishing is paid)
- **Then** `figma/code-connect/HomeservicesTheme.figma.kts` contains `figma("URL", "ComponentName") {}` stubs for `HomeservicesTheme` and key reference components
- **And** the file documents (via inline comments) that `figma connect publish` requires Dev Mode and is not yet active

### AC-5 · `tools/check-token-drift.py` enforces Kotlin↔JSON parity in CI
- **Given** PR-level changes to `figma/variables.json` or `design-system/`
- **When** `tools/check-token-drift.py` runs in CI
- **Then** it parses `figma/variables.json` into a flat `token_path → value` dict
- **And** it parses the Kotlin token files (`Color.kt`, `Spacing.kt`, etc.) via regex into the same shape
- **And** it exits 0 when every token matches; exits 1 with stderr listing every mismatch when any diverges
- **And** it runs on the standard GitHub `ubuntu-latest` image without installing pytest or other Python deps (uses stdlib only)

### AC-6 · TDD coverage for the drift checker
- **Given** `tools/tests/test_check_token_drift.py`
- **Then** the following tests pass:
  - `test_matching_tokens_passes` — fixtures with identical values → exit 0
  - `test_color_hex_mismatch_fails` — JSON hex differs from Kotlin hex → exit 1; stderr names the offending token
  - `test_spacing_mismatch_fails` — JSON spacing dp differs from Kotlin dp → exit 1; stderr names the offending token
  - `test_missing_token_in_json_fails` — JSON missing a token present in Kotlin → exit 1
  - `test_constant_removed_from_kotlin_collected_as_error` — silent `continue` is replaced with `errors.append()` so a removed Kotlin constant is detected (Codex P2 finding)

### AC-7 · `TOKEN-SYNC.md` at repo root documents the cross-check rule
- **Given** future contributors editing tokens
- **Then** `TOKEN-SYNC.md` contains:
  - Source-of-truth table (Kotlin ↔ JSON ↔ Figma)
  - Cross-check rule: "modify Kotlin → update `figma/variables.json` in same PR"
  - CI enforcement note pointing at `design-system-ship.yml`
  - figma-code-connect workflow (manual, until Dev Mode activated)

### AC-8 · `design-system-ship.yml` runs the drift checker
- **Given** a PR touching `figma/**`, `tools/check-token-drift.py`, `tools/tests/**`, or `TOKEN-SYNC.md`
- **When** `.github/workflows/design-system-ship.yml` runs
- **Then** the new step "token drift check (Kotlin ↔ Figma Variables JSON)" executes `python3 tools/check-token-drift.py`
- **And** the step is a hard-fail (not a warning)
- **And** path triggers in the workflow include the new files

---

## Tasks / Subtasks (as actually shipped — see `plans/E01-S05.md` for the original TDD breakdown)

> Implementation merged via PR #7 across 4 commits.

- [x] **T1 — Branch + plan commit**
  - [x] `git checkout -b E01-S05-figma-library`
  - [x] Write `plans/E01-S05.md` (feature-tier ceremony, embedded brainstorm, Figma free-tier cost check)
  - [x] Commit: `chore(E01-S05): add lean plan + figma free-tier cost check`

- [x] **T2 — Figma Variables JSON + setup guide + Code Connect stubs**
  - [x] `figma/variables.json` (200 lines) — W3C DTCG nested structure for all 6 token categories
  - [x] `figma/README.md` (121 lines) — Part 1 Token Studio import, Part 2 code-connect activation, Part 3 sync flow
  - [x] `figma/code-connect/HomeservicesTheme.figma.kts` (121 lines) — stubs for HomeservicesTheme + color/typography/spacing reference components
  - [x] Commit: `feat(E01-S05): figma variables JSON + library setup guide + code-connect stubs`

- [x] **T3 — Token drift checker + TDD tests + TOKEN-SYNC doc**
  - [x] RED: `tools/tests/test_check_token_drift.py` — 5 tests covering matching tokens, color mismatch, spacing mismatch, missing token, constant removal
  - [x] GREEN: `tools/check-token-drift.py` (289 lines) — stdlib-only Python; flattens JSON + regex-parses Kotlin; reports all mismatches
  - [x] `TOKEN-SYNC.md` (112 lines) at repo root — source-of-truth table + cross-check rule + CI enforcement note + code-connect workflow
  - [x] Commit: `feat(E01-S05): token drift checker + TDD tests + TOKEN-SYNC doc`

- [x] **T4 — CI integration + Codex review**
  - [x] `.github/workflows/design-system-ship.yml` — add path triggers (`figma/**`, `tools/check-token-drift.py`, `tools/tests/**`, `TOKEN-SYNC.md`); add `token drift check` step running `python3 tools/check-token-drift.py`
  - [x] Codex review (round 1 + round 2) — applied two findings:
    - P1: replace `pytest` test runner with stdlib `unittest` (ubuntu-latest doesn't have pytest pre-installed)
    - P2: replace silent `continue` with `errors.append()` so a removed Kotlin constant is detected
  - [x] `.codex-review-passed` marker updated; PR opened
  - [x] Commit: `chore: codex review passed (E01-S05)`

---

## Dev Notes

### What was actually shipped (per PR #7 file list)

```
.codex-review-passed                            updated
.github/workflows/design-system-ship.yml        +22 lines
TOKEN-SYNC.md                                   +112 lines
figma/README.md                                 +121 lines
figma/code-connect/HomeservicesTheme.figma.kts  +121 lines
figma/variables.json                            +200 lines
plans/E01-S05.md                                +144 lines
tools/check-token-drift.py                      +289 lines
tools/tests/test_check_token_drift.py           +195 lines
```

9 files changed, 1,203 insertions. Zero source-code edits to Android, web, or API.

### Why this story is being written retroactively

During the 2026-04-26 audit (`docs/audit/story-completeness-2026-04-26.md`), the BMAD trail was re-validated. PR #7 had landed `plans/E01-S05.md` but the corresponding `docs/stories/E01-S05-*.md` was never created — the original story spec lived only in `docs/stories/README.md` §E01 row for E01-S05. This file closes that gap.

### Why the free-tier path was chosen

| Item | Cost | Used? |
|---|---|---|
| Figma free plan file creation | $0 | yes |
| Token Studio Figma plugin (free) | $0 | yes (import path) |
| `@figma/code-connect` CLI annotations | $0 | yes (stubs only) |
| W3C DTCG JSON + Python stdlib | $0 | yes (drift check) |
| Figma Variables REST API (write) | Professional+ at $15/editor/mo | **no** |
| Figma Dev Mode | Professional+ at $15/editor/mo | **no** |

ADR-0007 explicitly forbids Figma paid API. The fallback path matches that constraint at zero recurring cost.

### Source of truth direction

Kotlin ⟶ JSON ⟶ Figma. Modify a Kotlin token file → update `figma/variables.json` in the same PR. The CI drift check enforces this direction. Bidirectional sync requires Figma Variables write API (paid), so we don't attempt it.

### Patterns referenced

- ADR-0007 (zero-paid-SaaS) — binding constraint
- ADR-0010 (design-system module — Kotlin tokens are source of truth)
- `feedback_paid_tools.md` — only Claude Max + free/OSS

---

## Definition of Done

- [x] `figma/variables.json` mirrors all 6 token categories (200 lines)
- [x] `figma/README.md` documents Token Studio import + code-connect workflow (121 lines)
- [x] `TOKEN-SYNC.md` at repo root with cross-check rule (112 lines)
- [x] `tools/check-token-drift.py` passes 5 stdlib `unittest` tests
- [x] `design-system-ship.yml` runs drift check on PRs touching `figma/**` or `design-system/**`
- [x] `.codex-review-passed` marker valid (Codex review done; 2 findings resolved)
- [x] PR #7 merged 2026-04-19 (commit `cf8e54a`)
- [x] Zero new paid SaaS dependencies (ADR-0007 verified)

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6 (per PR #7 commit attribution)

### Completion Notes
PR #7 merged 2026-04-19. Codex review identified 2 findings (P1: pytest dependency on ubuntu-latest runner; P2: silent `continue` masking removed Kotlin constants); both resolved before merge. Free-tier fallback path was selected because Figma Variables write API and Dev Mode both require paid Professional+ plans, both of which are forbidden by ADR-0007.

### File List
See PR #7: 9 files changed (3 in `figma/`, 1 root markdown, 2 in `tools/`, 1 plan, 1 workflow, 1 codex marker).
