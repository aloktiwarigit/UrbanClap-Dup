# homeservices-mvp — Project-Level CLAUDE.md

**Placeholder name:** `homeservices-mvp` (will be renamed once brand-name is locked in Phase 2)
**Owner:** Alok Tiwari
**Stack:** multi-repo monorepo — Kotlin+Compose (2 Android apps) + Next.js (admin) + Node (API)
**Build constraint:** ₹0/month operational infra at pilot scale (Firebase + Azure free tiers; FCM as universal messaging spine)

## Repository shape

```
/
├── customer-app/       # Android (Kotlin + Compose) — customer-facing
├── technician-app/     # Android (Kotlin + Compose) — vendor/partner-facing
├── admin-web/          # Next.js 15 + TypeScript — owner dashboard
├── api/                # Node 22 + TypeScript (Fastify/Hono) — backend
├── docs/               # Project-level BMAD artifacts (PRD, architecture, ADRs, stories, threat-model, runbook, ux-design, brainstorm)
├── tools/              # Cross-cutting scripts (md→docx converter, etc.)
├── _bmad/              # BMAD method config + skills scaffolding
└── _bmad-output/       # BMAD intermediate outputs (planning-artifacts/, implementation-artifacts/)
```

Each sub-project has its own `CLAUDE.md` with stack-specific rules. **This root file governs cross-cutting concerns only.**

## Phase gate (enforced across all sub-projects)

**No `src/` or `app/src/` edits in any sub-project** until ALL of the following exist and are committed:

- `docs/prd.md` (BMAD Phase 2)
- `docs/ux-design.md` (BMAD Phase 3)
- `docs/architecture.md` (BMAD Phase 4)
- `docs/adr/0001-*.md` + subsequent ADRs (initial stack decisions)
- `docs/stories/` — at least one story file per sub-project
- `docs/threat-model.md` (STRIDE, Phase 4.5)
- `docs/runbook.md` (Phase 4.5)
- `.bmad-readiness-passed` marker

Per-sub-project hooks in `.claude/settings.json` enforce this. Root also enforces it.

## Model routing (within Claude Max)

**Mandatory self-selection rules live in `~/.claude/CLAUDE.md` → "Model routing … MANDATORY self-selection".** Every session announces its tier on turn 1 and offers a downgrade prompt when the task fits Sonnet/Haiku. Do not silently stay on Opus.

Project-specific trigger map (overrides the generic tiers only where noted):

- **Opus 4.7 (1M ctx)** — BMAD Phase 2 (PRD), Phase 4 (architecture + cross-cutting ADRs), Phase 4.5 adversarial review, Codex review synthesis, plans for high-blast-radius stories (auth, payments, dispatch, Cosmos schema changes)
- **Sonnet 4.6 (default)** — per-story implementation, TDD cycles, BMAD Phase 3 (UX), 4.5 stub-filling, Phase 5 (epics/stories — parallel per epic), routine debugging
- **Haiku 4.5** — codemod fanouts: renames, mechanical refactors, lint-fix passes, doc-index updates, Paparazzi golden re-records driven by a mechanical rule

Dispatch subagents in parallel whenever tasks are independent (e.g. 3 epics being decomposed into stories simultaneously). Subagents inherit the parent's model unless the dispatch explicitly picks a cheaper tier — prefer `model: "sonnet"` or `"haiku"` on the Agent call when the subtask is mechanical.

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

- **libs.versions.toml sync:** libs.versions.toml drift is enforced by CI (`app-catalog byte-identity drift check` step in `technician-ship.yml`). No manual copy needed at story start.
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

## Zero-cost infra (the binding architectural constraint)

Every architectural decision across all sub-projects must preserve ₹0/month operational cost at pilot scale (≤5,000 bookings/mo). See `docs/architecture.md` for the service-by-service free-tier budget.

Summary of the ₹0 stack:

| Concern | Service | Free tier ceiling |
|---|---|---|
| Backend compute | Azure Functions (Consumption) | 1M execs + 400k GB-sec/mo |
| Database | Azure Cosmos DB (Serverless) | 1000 RU/s + 25 GB forever |
| Messaging / real-time | FCM (Firebase Cloud Messaging) | Unlimited forever |
| Auth | Firebase Phone Auth + Truecaller SDK + Google Sign-In | <100 SMS/mo at steady state |
| Photo storage | Firebase Storage | 5 GB + 1 GB/day download |
| Web admin hosting | Azure Static Web Apps | 100 GB bandwidth/mo |
| Maps | Google Maps Platform | $200/mo recurring credit |
| Payments | Razorpay | ₹0 onboarding (2% of GMV txn fee) |
| KYC | DigiLocker (Govt of India) | Free Aadhaar consent |
| Email | Azure Communication Services | 100 emails/day |
| Analytics | PostHog Cloud | 1M events/mo |
| Errors | Sentry | 5k errors/mo |
| ML | Azure ML | 8 hrs/mo compute |
| CI | GitHub Actions | 2000 mins/mo |

**Any PR that introduces a paid SaaS dependency must create an ADR and get explicit user approval.**

## Enterprise floor (ships with every template)

Every sub-project's template includes:

- `.github/workflows/ship.yml` — type-check, lint, tests ≥80% coverage, Semgrep, axe-core (web), Lighthouse CI (web), Codex review marker check, BMAD artifact gate
- Sentry + OpenTelemetry instrumentation
- GrowthBook OSS feature flags
- Storybook (web) / Paparazzi (Android) screenshot tests
- PostHog event tracking
- TypeScript `strict: true` / Kotlin `-Werror` + explicit API mode

**Do not remove any of these without an ADR.**

## Code review policy

- **Codex CLI is authoritative.** Claude Code writes code, OpenAI Codex reviews it. Deliberate model diversity for adversarial review (per `~/.claude/memory/feedback_cross_model_review.md`).
- Claude-only review layers (`/code-review`, `/security-review`, `/bmad-code-review`, `/superpowers:requesting-code-review`) are OPTIONAL and skipped by default (see Per-story execution §6). Codex + CI are the only mandatory gates.

## Forbidden

- Paid external SaaS (CodeRabbit Pro, paid Figma, v0 Pro, Subframe, Kiro, Cursor, LaunchDarkly, etc.). See `~/.claude/memory/feedback_paid_tools.md`.
- Skipping phases of BMAD. The readiness gate exists for a reason.
- `--no-verify` on commits unless `CLAUDE_OVERRIDE_REASON` is set (logged to `~/.claude/override-log.jsonl`).
- Amending published commits.
- Direct push to `main` (must go through PR + CI).

## Cross-cutting ADR scope

ADRs that span multiple sub-projects (e.g. "use FCM for all dispatch", "Cosmos DB schema conventions", "auth token format") live in **root `docs/adr/`**. Stack-specific ADRs (e.g. "use Hilt for DI in customer-app") live in the sub-project's own `docs/adr/` once that folder is populated.

## Emergency override

For genuine emergencies only:
```bash
CLAUDE_OVERRIDE_REASON="<detailed reason>" git commit --no-verify
```
Every override is logged to `~/.claude/override-log.jsonl`. No silent bypass.

## Next BMAD step

Phase 0 (this scaffold) complete → Phase 1 (brainstorming → `docs/brainstorm.md`) → Phase 2 (PRD) → Phase 3 (UX) → Phase 4 (architecture + ADRs) → Phase 4.5 (threat-model + runbook) → Phase 5 (epics + stories) → Phase 5.5 (readiness gate) → **unlocks per-story execution**.

Existing inputs: `_bmad-output/planning-artifacts/product-brief.md` (comprehensive 50 KB brief with full UC-parity scope, ₹0 constraint, and design strategy) feeds directly into Phase 1 → 2 → 3 → 4.
