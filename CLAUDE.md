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

Per `~/.claude/CLAUDE.md` directive:

- **Opus 4.7 (1M ctx)** — planning, architecture, adversarial review (~15% of work): BMAD Phase 2 (PRD), Phase 4 (architecture), Phase 4.5 adversarial review, Codex review synthesis
- **Sonnet 4.6** — bulk execution, parallel subagents (~70% of work): BMAD Phase 3 (UX), 4.5 stub-filling (threat model, runbook), Phase 5 (epics/stories — parallel per epic), per-story implementation
- **Haiku 4.5** — codemod fanouts (~15% of work): renames, mechanical refactors, lint-fix passes

Dispatch subagents in parallel whenever tasks are independent (e.g. 3 epics being decomposed into stories simultaneously).

## Per-story execution (mandatory flow)

For each story in `docs/stories/`:

1. **Fresh session** → `/superpowers:brainstorming` (explore design before code)
2. `/superpowers:writing-plans` → commit `plans/<story-id>.md`
3. **Fresh session** (context quarantine) → `/superpowers:executing-plans`
4. TDD: tests first in `tests/` before implementation in `src/` / `app/src/`
5. `/superpowers:verification-before-completion` before claiming done
6. **5-layer review gate before push:**
   1. `/code-review` (cheap lint)
   2. `/security-review`
   3. `/codex-review-gate` — **OpenAI Codex CLI is the authoritative cross-model review gate** (writes `.codex-review-passed`); never merge without this marker
   4. `/bmad-code-review` (Blind Hunter + Edge Case Hunter + Acceptance Auditor)
   5. `/superpowers:requesting-code-review`
7. Only then `git push`. **CI is the real gate — local hooks are fast feedback only.**

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
- Claude-only review layers (`/code-review`, `/bmad-code-review`) are supplementary; Codex is the gating check.

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
