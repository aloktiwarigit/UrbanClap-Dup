# Per-story execution — full rules

Moved verbatim from root `CLAUDE.md` (lines 61-167 at commit 01107fb8) by the
2026-09-14 context-engineering pass. Content is unchanged; only its location moved.
Root `CLAUDE.md` points here. Read this before planning or executing any story.

---

## Per-story execution (mandatory flow)

### Story ceremony tiers — scale effort to blast radius

Before invoking any planning skill, classify the story into one of three tiers.

| Tier | When | Ceremony | Target wall-clock |
|---|---|---|---|
| **Foundation** | E01-* stories, migrations, architectural refactors, new module introductions, auth/security-sensitive work | Brainstorm → plan (4-6 work streams, parallel agent dispatch) → execute → smoke gate → Codex + /security-review (parallel) + CI | 3.5–4.5h |
| **Feature** | E02+ user-facing stories, new screens, endpoints built on existing foundation | Plan (brainstorm embedded, ≤800 lines) → execute (same session, default) → smoke gate → Codex + CI | 1.5–2.5h |
| **Codemod / mechanical** | Renames, lint sweeps, doc-index updates, libs sync | No brainstorm, no plan doc. One-shot Haiku execution. | 30–45min |

**TDD + smoke gate + Codex + CI are non-negotiable across ALL tiers.**

### Work-stream structure (Foundation + Feature plans)

Plans use work streams instead of micro-tasks. Streams run in dependency order; independent streams dispatch as parallel agents.

```
WS-A: Domain models + data layer
      [customer-app or technician-app: sealed classes, SessionManager, Room/Prefs, ProGuard rules]
      Runs first. WS-B depends on WS-A types.

WS-B: Use cases + orchestrator  (parallel per use case — each is independent)
      [TruecallerUseCase, FirebaseOtpUseCase, BiometricGateUseCase, etc. — fan out to subagents]
      TDD: test file first, then implementation. Runs after WS-A models are committed.

WS-C: Hilt DI module + security gates  (parallel with WS-D after WS-B)
      [AuthModule, @Binds/@Provides, ProGuard keep rules, AndroidManifest entries]
      Runs parallel with WS-D.

WS-D: Compose UI + ViewModel + Navigation + Paparazzi  (parallel with WS-C)
      [ViewModel → Screen → AppNavigation → MainActivity integration → Paparazzi test stubs]
      Runs parallel with WS-C. Paparazzi goldens recorded on CI only (see docs/patterns/paparazzi-cross-os-goldens.md).

WS-E: Pre-Codex smoke gate → review
      bash tools/pre-codex-smoke.sh <customer-app|technician-app>
      Runs after WS-B/C/D complete. Non-zero exit = stop and fix before Codex.
      Then: codex review --base main AND /security-review (auth/payment/dispatch stories) simultaneously.
```

For API (`api/`) stories: WS-A = Cosmos schema + Zod types, WS-B = repo + service + controller, WS-C = Semgrep rules + auth middleware, WS-D = (skip), WS-E = `bash tools/pre-codex-smoke-api.sh`.
For web (`admin-web/`) stories: WS-A = API types, WS-B = Next.js API routes, WS-C = auth guards, WS-D = React components + Storybook, WS-E = `bash tools/pre-codex-smoke-web.sh`.

### Story size gate (mandatory at plan-write time)

After drafting a plan, check its line count before committing:

```bash
wc -l plans/E##-S##*.md
# Feature tier: >500 lines → warning; >800 lines → split required
# Foundation tier: >1200 lines → warning; >1500 lines → split required
```

**Split rule:** If any 3 of the following are true, split by layer:
- New files > 20
- All 4 Android layers touched (domain + data + UI + nav)
- ≥2 external SDK integrations
- ≥10 test files required

**Split pattern:** Story A = WS-A + WS-B (domain + data); Story B = WS-C + WS-D (DI + UI), depends on A.

### Foundation-tier flow

For each foundation-tier story in `docs/stories/`:

1. Fresh session → `/superpowers:brainstorming` (explore design before code)
2. `/superpowers:writing-plans` → commit `plans/<story-id>.md` using work-stream structure above. Auth/RLS/money/crypto: fresh session for context quarantine; all other Foundation stories: same session permitted.
3. `/superpowers:executing-plans` → dispatch parallel agents per work stream using `superpowers:dispatching-parallel-agents`. Fan out WS-B use cases to separate Sonnet subagents (each owns one use case + its test file).
4. TDD per work stream: test file committed before implementation file. Work-stream TDD completion IS verification — no separate verify step.
5. **Pre-Codex smoke gate (mandatory):**
   ```bash
   bash tools/pre-codex-smoke.sh <customer-app|technician-app>
   # Non-zero exit = stop and fix before invoking /codex-review-gate
   ```
6. **Review gate — local only (no CI ceremony):**
   - `codex review --base main` → `.codex-review-passed` (local, before push)
   - `/security-review` (auth/payment/dispatch/PII trigger) — local, parallel with Codex
   - Drop `/code-review`, `/bmad-code-review`, `/superpowers:requesting-code-review` — echo-chamber
7. `git push` → PR auto-merges on CI green (no approval gate — solo project).
   **CI is lint + tests + Semgrep only.** BMAD gate and Codex marker check removed from CI — enforced locally.

### Feature-tier flow (lean)

1. `/superpowers:writing-plans` (brainstorm embedded; plan ≤800 lines; reference `docs/patterns/` for known gotchas)
2. `/superpowers:executing-plans` in same session. Fan out independent use cases as subagents if ≥3.
3. Pre-Codex smoke gate (same script as Foundation).
4. Codex review → CI. `/security-review` only on auth/payment trigger.

### Android story invariants (all tiers)

- **libs.versions.toml sync:** First task of every `technician-app` story = copy `customer-app/gradle/libs.versions.toml` to `technician-app/gradle/libs.versions.toml`. Prevents post-Codex drift.
- **Paparazzi goldens:** Never record on Windows. Delete before push; trigger `paparazzi-record.yml` workflow_dispatch on CI. See `docs/patterns/paparazzi-cross-os-goldens.md`.
- **Known gotchas:** Every Android plan's opening section cites the relevant `docs/patterns/` files for Firebase, Hilt, Paparazzi, and explicit-API traps.

### Pattern library

`docs/patterns/` contains hard-won solutions from previous stories. Read before writing any plan that touches these areas:

| Pattern file | Read before... |
|---|---|
| `paparazzi-cross-os-goldens.md` | Any story adding or changing Compose screens |
| `firebase-callbackflow-lifecycle.md` | Any story with Firebase Auth, FCM, or async SDK callbacks |
| `firebase-errorcode-mapping.md` | Any story handling Firebase or payment error codes |
| `hilt-module-android-test-scope.md` | Any story introducing new Hilt-injected classes |
| `kotlin-explicit-api-public-modifier.md` | Any story adding new public Kotlin files |

