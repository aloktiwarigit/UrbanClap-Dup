# ADR-0007: Zero paid SaaS dependencies (binding architectural constraint)

- **Status:** accepted
- **Date:** 2026-04-17
- **Deciders:** Alok Tiwari, Winston

## Context

homeservices-mvp's economic thesis rests on operational cost discipline (Innovation I-1): a solo-founder-built UC-parity marketplace running on ₹0 recurring infra. Every paid dependency erodes the margin advantage that lets us charge 22-25% commission (vs UC's 28%) AND still be more profitable than UC per booking. The user directive is explicit across multiple sessions: *"0 cost is the key"*, *"always 0 cost is the key"*.

Without a binding constraint, incremental dependencies creep in during per-story execution (*"just this one paid service, it's only ₹500/mo"*). Those add up to thousands of rupees per month and invalidate the economic thesis.

## Decision

**Zero paid SaaS dependencies at MVP and any phase without explicit owner ADR + approval.**

**Scope:**
- Applies to any third-party service with a recurring monthly cost > ₹0 at our usage volume (pilot: 5k bookings/mo; full: 50k bookings/mo).
- Free tiers with clear overflow behaviour (Google Maps $200/mo credit, FCM unlimited, Cosmos 25 GB, Form Recognizer 500 pages/mo, Firebase Storage 5 GB, PostHog 1M events/mo, Sentry 5k errors/mo, GitHub Actions 2000 min/mo) are acceptable.
- Transaction-based fees that come from GMV, not our pocket (Razorpay 2% of txn), are not "paid SaaS" — they're part of unit economics.
- One-time costs (domain registration ₹1k/yr, Google Play Developer $25 one-time) are not ongoing SaaS and are allowed.

**Override process:**
- To add a paid dependency, create a new ADR explaining:
  1. What free alternative was evaluated and why it's insufficient
  2. Projected monthly cost at pilot scale and at 50k bookings scale
  3. Impact on NFR-M-1 / NFR-M-2 (must still fit ≤₹50k/mo ceiling at full scale)
  4. Migration path off the paid service if costs change
- ADR requires explicit owner sign-off in the Deciders line
- If approved, the paid service is added to NFR-M-3's exception list

**Enforcement:**
- CI gate in `ship.yml`: lint rule scanning `package.json`, `settings.gradle.kts`, config files, and imports for known paid-SaaS SDKs (LaunchDarkly, Segment, Datadog, New Relic, CodeRabbit Pro, Figma paid API, etc.). PR fails if any are added without a corresponding ADR.
- Code review (Codex authoritative gate per CLAUDE.md) flags any config change or import that introduces a paid endpoint/SDK.
- Monthly cost review by owner: checks Azure + Firebase + all integrations for unexpected charges.

## Consequences

**Positive:**
- Economic thesis preserved. Per-booking infra cost < ₹2 through 50k bookings/mo.
- Strategic wedge vs UC (Innovation I-1) maintained.
- Forces boring, battle-tested architecture (ADR-0001 through ADR-0006 all pass the free-tier bar).
- Team discipline: every dependency is a considered decision, not a passive drift.
- Owner ROI: ~90-95% contribution margin per booking at pilot; this is impossible for UC or any funded competitor.

**Negative:**
- Some developer-productivity tools users love (CodeRabbit Pro, Sentry paid tiers with longer retention, Linear paid tiers) are off-limits. Accept: free-tier alternatives are sufficient for a 1-person + AI team.
- When free tiers change (provider policy shifts), we must react quickly. Mitigation: monitor quarterly, document migration playbooks per service.
- Some features that would be easy with paid SaaS (e.g., full WhatsApp Business API via Wati) require extra architectural effort or are deferred.

**Neutral:**
- We accept the discipline as a strategic moat. The constraint makes the architecture better, not worse.

## Known free-tier dependencies (approved at ADR-0001 through ADR-0006)

| Service | Free tier | Paid trigger |
|---|---|---|
| Azure Cosmos DB Serverless | 25 GB + 1000 RU/s free forever | >50k bookings/mo |
| Azure Functions Consumption | 1M execs + 400k GB-sec/mo | >10× pilot scale |
| Azure Static Web Apps | 100 GB bandwidth/mo | never at our scale |
| Azure Communication Services Email | 100 emails/day | low usage; tight but fine |
| Azure Form Recognizer | 500 pages/mo | 10× tech onboarding rate |
| Azure App Insights | 5 GB logs/mo | medium-term monitoring |
| Azure Translator | 2M chars/mo | Phase 2 language rollout |
| Azure Anomaly Detector | 20k txn/mo | Phase 2 fraud detection |
| Azure ML compute | 8 hrs/mo | Phase 4 ML dispatch |
| FCM | unlimited forever | never |
| Firebase Phone Auth | ~₹0.40/SMS — near-zero at steady state (Truecaller-first) | 20× fallback rate |
| Firebase Storage | 5 GB + 1 GB/day download | several years at pilot rate |
| Google Maps Platform | $200/mo recurring credit | ~25k bookings/mo |
| Razorpay | ₹0 fixed, 2% from txn (not pocket) | N/A |
| DigiLocker | free | N/A |
| Truecaller SDK | free for business | N/A |
| PostHog Cloud | 1M events/mo | ~10× pilot scale |
| Sentry | 5k errors/mo | ~5× pilot scale |
| GitHub Actions | 2000 mins/mo | sufficient |
| Cloudflare (optional CDN, Phase 2) | free tier | sufficient |

### Amendment — 2026-04-18 (story E01-S06)

Added OSS build- and test-time dev dependencies for the OpenAPI codegen pipeline. All are MIT/Apache-2.0 licensed, installed from the public npm registry, and carry zero recurring cost. See ADR-0009 for the toolchain decision.

| Dependency | License | Role | Paid trigger |
|---|---|---|---|
| `@asteasolutions/zod-to-openapi` | MIT | api/ dev — emits OpenAPI 3.1 from Zod registry | never (self-hosted codegen) |
| `@apidevtools/swagger-parser` | MIT | api/ dev — in-test OpenAPI parse validation | never |
| `@stoplight/spectral-cli` | Apache-2.0 | api/ dev — OpenAPI quality lint (local + CI) | never |
| `openapi-typescript` | MIT | admin-web/ dev — generates schema.d.ts from committed spec | never |
| `openapi-fetch` | MIT | admin-web/ runtime — ~2 KB typed fetch wrapper | never |
| `msw` | MIT | admin-web/ dev — HTTP mocking for ApiClient tests | never |

## Alternatives considered

- **Soft constraint (recommend, don't enforce)** — rejected because without enforcement, drift is inevitable over a 12-month build. Past 3-month drift destroys the economic thesis.
- **₹5,000/mo budget allowance** — rejected because it encourages *reaching* the budget vs optimising below it. Discipline at ₹0 naturally produces ₹0.
- **Exception for monitoring/observability tools only** — rejected; Sentry free + PostHog free + App Insights free are genuinely sufficient at this scale.

## References

- `docs/prd.md` NFR-M-1, NFR-M-2, NFR-M-3
- `docs/brainstorm.md` Decision D2, Innovation I-1
- User directive (sessions 2026-04-16 and 2026-04-17): *"0 cost is the key", "no rush, one shot right", "everything else should be FCM"*
- User's global CLAUDE.md: *"Paid external SaaS is off-limits (`feedback_paid_tools.md`)"*
- `~/.claude/projects/.../memory/project_homeservices_zero_cost.md`
