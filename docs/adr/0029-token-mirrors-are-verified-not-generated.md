# ADR-0029: Token mirrors are verified, not generated

- **Status:** accepted
- **Date:** 2026-07-27
- **Deciders:** Alok Tiwari (owner), implementing session (S-11 / S-12 / S-20)
- **Supersedes:** nothing. **Extends:** ADR-0010 (Kotlin is the canonical token source).

## Context

D1 (`docs/design/design-language.md`) commits the product to *one token core with three surface
expressions*. S-10 landed that core in Kotlin
(`design-system/src/main/kotlin/com/homeservices/designsystem/theme/`). Two other artefacts carry
the same values:

| Artefact | Consumer | Format |
|---|---|---|
| `design-system/.../theme/*.kt` | customer-app, technician-app | Compose `Color`/`Dp` constants |
| `figma/variables.json` | designers, via Token Studio | W3C DTCG JSON |
| `admin-web/app/globals.css` | admin-web | CSS custom properties + Tailwind v4 `@theme` |

The four-way fracture the 2026 audit found — forest/teal/marigold accents, three radius scales, a
web-only serif — is the failure mode of hand-copied values with nothing checking them. If S-12
hand-copies hex from `Color.kt` into `globals.css`, the exact same failure is rebuilt with a fresh
start date.

**Prior art that was nearly missed.** ADR-0010 already made this decision once, for the Figma
mirror: Kotlin is authoritative, `figma/variables.json` mirrors it, and
`tools/check-token-drift.py` fails CI when they diverge (`design-system-ship.yml`). The question
S-12 raises is not "generate or verify" from a standing start — it is "does the third mirror get
its own mechanism, or reuse the one that exists".

**Evidence the existing mechanism works, gathered while writing this ADR.** PR #297 (S-10) is red.
Its single failing check is `check-token-drift.py`, reporting 18 mismatches: S-10 renamed
`BrandPrimaryLight` → `BrandAccent`, `Neutral0Light` → `CanvasLight` and rewrote the values, and did
not update `figma/variables.json`. The drift checker caught a real, silent divergence on the first
PR that introduced one, in under a second of CI time. That is not a hypothetical argument for
verification; it is a demonstration.

## Decision

**Kotlin remains the single source of truth. Every other token artefact is a mirror, and every
mirror is verified by a CI check that fails the build on divergence. Nothing is generated.**

Concretely:

1. `tools/check-token-drift.py` is extended from two arguments to three. It now verifies the
   **nine D1 core colour roles** (accent, canvas, surface, surface-raised, text-strong, text-muted,
   text-faint, border, border-strong — light and dark, 18 values) across all three artefacts:
   Kotlin ↔ Figma JSON ↔ `admin-web/app/globals.css`.
2. The CSS side is parsed from the **role-primitive block** in `globals.css` (`--d1-*` custom
   properties introduced by S-12). admin-web's editorial names (`--ink-*`, `--fog-*`, `--paper-*`)
   become aliases of those primitives, so the expression is preserved while the values stop being
   independent.
3. The checker's `CHECKS` table is re-derived to the D1 constant names, and `TOKEN-SYNC.md` is
   rewritten to match. Both were still describing the pre-D1 teal/coral palette.
4. `admin-ship.yml` and `design-system-ship.yml` both gain the other's token paths in their
   `paths:` filters, so a change to either side runs the check regardless of which app the PR
   touches. A checker that only runs when the *derived* file changes cannot catch a change to the
   *source*.

### What is deliberately NOT covered

- **Radius, spacing and motion are not cross-checked against CSS.** They are *expression*-level, not
  core-level: D1 §Shape assigns admin 2/4/6 against customer 8/12/20 by design, so a checker
  asserting equality would be asserting a violation of D1. The colour core is the only layer D1
  requires to be byte-identical across surfaces, and it is the layer that actually fractured.
- **Typography is not cross-checked.** Font *families* are, indirectly, by the "no serif" rule in
  the admin-web unit test; the size ramp is expressed in `sp` on Android and `rem` on web with a
  different base, so equality is the wrong assertion. ADR-0010 already carved this out.

## Consequences

- **Positive:** one mechanism, one mental model, one place to add the fourth mirror if one appears.
  Zero build steps added; ₹0 cost; runs in under a second. Divergence is reported with the exact
  role name and both values, which is a better failure message than a generator's diff.
- **Positive:** the mirrors stay human-editable. A designer can hand-tune `globals.css` and find out
  in CI whether they broke the core, rather than having their edit silently overwritten by the next
  generator run.
- **Negative:** changing a core colour is a three-file commit (Kotlin + JSON + CSS) instead of one.
  This is the cost that buys the guarantee; `TOKEN-SYNC.md` documents the sequence.
- **Negative:** the checker verifies the values it is told about. A *new* core role added to Kotlin
  and not added to `CHECKS` is unverified. Mitigated by a test that asserts every `internal val
  …Light/Dark` colour constant in `Color.kt` appears in `CHECKS` — the checker fails when it falls
  behind its own source.
- **Neutral:** the CSS parse is regex-based, not a real CSS parser. It is pinned to a single
  `:root` block with a documented, machine-readable shape; a `pytest` case covers the parse.

## Alternatives considered

- **Option A — generate `Color.kt` and `globals.css` from a `tokens.json` source.** Rejected.
  It buys structural impossibility of drift, which is strictly stronger than verification, but the
  cost here is disproportionate: the repo has **no root Gradle build** — `customer-app`,
  `technician-app`, `design-system` and `core-nav` are four separate builds stitched with
  `includeBuild`, and `admin-web` is a pnpm/Next project. A generator would need wiring into five
  build graphs plus a generated-file-is-stale check (which is itself a verification step — you do
  not escape verification, you add a build step *and* keep it). It would also make Figma the second
  generated artefact while ADR-0010 has it verified, giving one problem two mechanisms. Revisit if
  the token set grows past roughly 100 values or a second web surface appears.
- **Option C — accept drift, document it.** Rejected. Drift is the defect being fixed. The audit's
  four-way fracture cost more to diagnose than the checker costs to maintain, and every per-surface
  story in Phases 3–4 assumes the core is stable.
- **A Kotlin unit test reading `globals.css` instead of extending the Python checker.** Rejected:
  it would run only in the Android gate, and the drift the audit found came from the *web* side. The
  Python checker already runs in CI and both `paths:` filters can be widened to cover either side.

## References

- ADR-0010 — Kotlin design-system is the canonical token source
- `docs/design/design-language.md` §Palette, §Shape (D1)
- `docs/design/uiux-implementation-plan.md` S-10 / S-11 / S-12 / S-20
- `TOKEN-SYNC.md` — the update sequence this ADR enforces
- PR #297 CI run 30324795248 — the drift checker catching S-10's rename
