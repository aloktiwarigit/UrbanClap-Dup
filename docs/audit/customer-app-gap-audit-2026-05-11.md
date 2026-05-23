# Customer-app Gap Audit — 2026-05-11

**Status:** Stub. Original 6-slice audit pass executed in a prior session was not persisted to the repository. This file is a deliberate pointer to the authoritative source for the gap-closure work.

**Authoritative source:** [`docs/superpowers/plans/2026-05-12-customer-app-gap-closure-roadmap.md`](../superpowers/plans/2026-05-12-customer-app-gap-closure-roadmap.md)

**Why this exists:** The plan references this path; subagents executing Week 1+ streams may follow the link. Rather than fabricate an audit narrative after the fact, this stub preserves the gap counts and the cross-cutting themes that the plan's `Context` section summarizes, and points readers to the plan for per-epic acceptance criteria, file path maps, dependency graph, and rollout strategy.

---

## Gap counts (summary from 2026-05-12 plan)

- **22 P0** gaps (must-ship for soft-launch)
- **41 P1** gaps (must-ship for public-launch)
- Total: **63 prioritised gaps** consolidated into 8 epics, 39 stories.

## Cross-cutting themes (from plan `Context` §)

The original audit identified five themes that explain why so many gaps cluster:

- **(A) Half-done i18n** — Hindi pivot ~70% English literals on high-stakes screens (auth, tracking, complaint, rating, booking summary).
- **(B) Dead components** — `TrustDossierCard` and `BiometricGateUseCase` fully built with zero production callers.
- **(C) Broken FCM background story** — no `NotificationChannel` registration, so backgrounded users miss every FCM type; `NO_SHOW_CREDIT_ISSUED` silently dropped.
- **(D) Invisible platform artifacts** — no wallet UI to surface the ₹500 guarantee; map sits frozen between stage transitions; no in-app PDF viewer.
- **(E) Missing entry points** — no DPDP delete-account flow (Google Play policy risk); no rating/complaint CTAs on bookings list.

## Critical alignment findings (from plan §`Context`)

- `docs/superpowers/specs/2026-05-01-e11-durable-screen-hooks-design.md` already designs ~40% of cross-cutting infrastructure (FCM tray notifications, `homeservices://action/*` deep-link URIs, Room `pending_actions` table, NotificationRouter, cold-start tier-ladder, SOS device-token routing). 12 E11 stories scoped but not yet executed.
- `docs/adr/0012-dpdp-rights-endpoints.md` API endpoints exist server-side; only customer-app UI is missing.
- API endpoints for confidence-score-with-GPS, rating reveal, and no-show FCM are complete — gaps are purely customer-app rendering.

## Where to find the actual work

| You want to know... | Look in the plan at... |
|---|---|
| Per-epic acceptance criteria | §`Per-epic acceptance criteria` |
| Files to modify per story | §`Critical files to modify (path map)` |
| Story dependency graph | §`Dependency graph` |
| Sprint-by-sprint sequencing | §`Sequencing (6-week sprint plan)` |
| ADRs that must land | §`Cross-cutting infrastructure → New ADRs` |
| Threat-model rows to add | §`Cross-cutting infrastructure → Threat-model rows` |
| Feature flags to register | §`Cross-cutting infrastructure → Feature flags (GrowthBook)` |
| Risk register | §`Risk register` |
| Verification plan | §`Verification plan (end-to-end)` |

## Provenance

If the original 6-slice audit text surfaces (in a backup, an old session, or an exported chat), it can replace this stub. Until then, the plan is the authoritative source and this stub is the only thing at the path the plan references.
