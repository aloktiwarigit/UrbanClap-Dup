# Project constraints — phase gate, free-tier budget, enterprise floor

Moved verbatim from root `CLAUDE.md` (lines 34-48, 168-192, 193-205 at commit
01107fb8) by the 2026-09-14 context-engineering pass. Content is unchanged; only its
location moved. The binding guardrail sentence of each section is ALSO kept inline in
root `CLAUDE.md`; this file holds the detail those guardrails refer to.

---

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
| Web admin hosting | Azure Container Apps (Consumption) + GHCR | Keep min replicas 0 / max replicas 1 for pilot cost control |
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

