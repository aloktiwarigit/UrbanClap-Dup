# Client UAT Handoff Plan — HomeHeroo (Ayodhya / UP rural pilot)

Status: **blocked on S-40 merge** (see below). This is a handoff-prep doc, not a new feature —
scope is getting *existing, already-built* functionality in front of the client for testing.
Owner decision (2026-08-09): wait for S-40 to finish, distribute via the existing Play Store
internal testing track, client tests **COD only** — no real or sandbox payment flow in scope.

## Blocked on

`feat/s40-catalogue` (worktree `homeservices-s40-catalogue`) — catalogue + service-detail visual
work, 8 of 14 tasks committed as of this writing. Do not cut the handoff build until this merges;
the customer catalogue screen is only partially wired and would be the client's first impression.

## What ships in this build vs. the last artifact on disk

The only build artifacts currently in `artifacts/` (`customer-app-0.1.7-vc11-release.aab`,
`technician-app-0.1.11-vc12-release.aab`) are dated **2026-05-24** — everything below has merged
to `main` since and is NOT in those builds:

- S-30 typography, S-31/S-31b money formatter unification, S-32 colour-literal sweep
- S-33 states (sheet i18n, pending-action countdown fix)
- S-34/S-35 admin-web i18n + sign-out
- Shield-report + Rating-appeal wiring (technician-app) — two previously-unreachable safety/fairness
  features are now live: a "Report customer" trigger on the active-job screen, and a per-rating
  "Appeal" action on My Ratings
- S-40 catalogue + service-detail craft pass (once merged) — accent-contrast fix, retry on
  load failure, animated skeletons, deduped category styling, dead-code removal

Both `versionCode`/`versionName` in `customer-app/app/build.gradle.kts` and
`technician-app/app/build.gradle.kts` are still at the May values (11/0.1.7, 12/0.1.11) — **must be
bumped** before the next release build, or the Play Console upload will be rejected as a duplicate
version.

## Release checklist (run once S-40 merges)

1. Bump `versionCode`/`versionName` in both `customer-app/app/build.gradle.kts` and
   `technician-app/app/build.gradle.kts`.
2. `bash tools/pre-codex-smoke.sh customer-app` and `technician-app` — full 6-step gate green on
   `main` post-merge.
3. Build signed release AABs (per `technician-app/CLAUDE.md`'s pre-release checklist — currently
   all 7 items unchecked; at minimum confirm the signed build + ProGuard shrinkage step for this
   handoff, the rest — Data Safety form, privacy policy URL, baseline profile — are Play Store
   *public listing* requirements, not blockers for an internal-testing-track handoff to an existing
   tester list).
4. Upload both AABs to the existing Play Store internal testing track.
5. Confirm admin-web production (`https://aca-admin-homeservices-prod.icybush-b2e9c876.centralindia.azurecontainerapps.io`)
   is serving the same `main` commit — check the deployed image tag against
   `ghcr.io/aloktiwarigit/urbanclap-dup-admin-web:<latest main SHA>` per `admin-web/CLAUDE.md`.
   **Do not use `docs/runbook.md` §5.1 for this** — it documents the legacy Azure Static Web Apps
   setup; ACA is canonical per root `CLAUDE.md`. (Flagged separately, not fixed here — out of scope
   for this handoff.)

## Test scope for the client — COD only

In scope (all shipped, code-complete, no new functionality needed):
- Customer: browse catalogue → book a service (slot picker, address, COD) → track technician →
  service completion → rate + optional complaint
- Technician: receive job offer → accept/decline → active-job workflow (photos, status updates) →
  Shield-report on an active job → view earnings → respond to a low rating via Appeal
- Admin: Live Ops dashboard, Orders table + overrides (reassign/refund/waive-fee/escalate),
  Complaints kanban, audit log

Explicitly **out of scope for this round**: Razorpay online payment (COD only per this handoff),
GST e-invoicing (not built), the `marketing.public-launch` gate (not built — this is a controlled
internal-tester handoff, not a public launch).

## Known rough edges to tell the client up front

Phase 4 visual-uplift work is still in progress beyond the catalogue screen:
- Booking funnel, technician earnings screen, admin tables, and technician-app accessibility
  (TalkBack) have not had their visual-craft pass yet — functional, but not final polish.
- Set expectations that these will visibly improve in a follow-up build, so the client doesn't
  read them as bugs.

## Bug reporting

**TODO — needs an owner decision:** how should the client report issues found during UAT? (GitHub
issues on a client-visible repo view, a shared tracker, email triage, etc.) Not decided as of this
doc's writing.

## Test accounts / seed data

No test-phone / OTP-bypass mechanism exists in the codebase (checked: no `TEST_PHONE` or
OTP-whitelist pattern in `api/`, `customer-app/`, `technician-app/`) — client testers sign in with
real phone numbers via Firebase Phone Auth, Truecaller, or Google Sign-In, same as production
users. **Open question:** does the pilot Cosmos DB have enough seeded categories/services and at
least one active technician account in the Ayodhya service radius for the client to complete a
full booking end-to-end? Not verified as part of this doc — check before handoff, since a booking
flow with zero available technicians will look broken even though it isn't.
