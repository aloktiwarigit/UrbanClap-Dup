# E10-S04 — Launch Readiness Gate

**Epic:** E10 — Compliance & Launch Hardening
**Story ID:** E10-S04
**Ceremony tier:** Foundation
**Status:** Implemented (2026-04-29)
**Branch:** `feature/E10-S04-launch-gate`

---

## User Story

As the platform owner,
I want a soft-launch gate that limits bookings to 100 F&F users, a marketing-pause
toggle, and a tested rollback procedure,
so that I can launch confidently, catch issues early, and reverse course without
data loss if something goes wrong.

---

## Acceptance Criteria

| AC | Description | Status |
|---|---|---|
| AC-1 | GrowthBook `soft_launch_enabled` flag gates `createBooking`; fail-open on SDK error | ✅ |
| AC-2 | `marketing_pause_enabled` flag for owner-controlled booking pause (checked after AC-1) | ✅ |
| AC-3 | Emergency rollback playbook in `docs/runbook.md` + automated test for flag=false → 503 | ✅ |
| AC-4 | DR drill documentation in `docs/runbook.md` (Cosmos, Functions, Firebase, FCM, Razorpay) | ✅ |
| AC-5 | `docs/launch-checklist.md` with env-var checklist, pre-launch smoke, go-live, and rollback triggers | ✅ |
| AC-6 | `api-ship.yml` warning step if `GROWTHBOOK_CLIENT_KEY` secret is missing | ✅ |

---

## Files Created

| File | Purpose |
|---|---|
| `api/src/services/featureFlags.service.ts` | GrowthBook wrapper: `isSoftLaunchEnabled`, `isMarketingPaused` |
| `api/tests/unit/launch-gate.test.ts` | 8 unit tests (TDD-first, all green) |
| `docs/launch-checklist.md` | Full pre-launch checklist for go-live day |
| `docs/stories/E10-S04-launch-readiness-gate.md` | This file |

## Files Modified

| File | Change |
|---|---|
| `api/src/functions/bookings.ts` | Added flag checks at top of `createHandler` |
| `api/local.settings.example.json` | Added `GROWTHBOOK_API_HOST` + `GROWTHBOOK_CLIENT_KEY` placeholders |
| `docs/runbook.md` | Added § Emergency Rollback + § Launch Checklist + § Disaster Recovery Drill |
| `.github/workflows/api-ship.yml` | Added env-var warning step (AC-6) |

---

## Key Design Decisions

### Fail-open contract

`isSoftLaunchEnabled()` returns `true` (allow booking) on:
- GrowthBook SDK timeout or throw
- Empty `GROWTHBOOK_CLIENT_KEY` (local dev)

This means a broken flags SDK never blocks the platform.

### marketing_pause checked AFTER soft_launch

Order matters: `soft_launch_enabled = false` takes precedence with a "coming soon" message. `marketing_pause_enabled = true` overrides an open soft launch with a "pausing briefly" message. The owner can always close the gate harder (via soft_launch) or softer (via marketing_pause).

### DI pattern for testability

`isSoftLaunchEnabled(client?)` and `isMarketingPaused(client?)` accept an optional `FeatureFlagClient` for dependency injection in tests, defaulting to the module singleton. No `vi.mock` of `@growthbook/growthbook` required — tests pass a mock client directly.

### local.settings.json is gitignored

`api/local.settings.json` is in `.gitignore` (Azure Functions convention). The new env vars are documented in `api/local.settings.example.json`. Local dev with empty `GROWTHBOOK_CLIENT_KEY` automatically fails open (never calls GrowthBook, never blocks bookings).

---

## TDD Summary

Tests written first (`launch-gate.test.ts`) → service implemented → all 8 tests green → bookings.ts wired → full suite re-run.

```
✓ isSoftLaunchEnabled > returns false when soft_launch_enabled = false
✓ isSoftLaunchEnabled > returns true when soft_launch_enabled = true
✓ isSoftLaunchEnabled > fails open when GrowthBook SDK throws
✓ isSoftLaunchEnabled > returns true when GROWTHBOOK_CLIENT_KEY is empty
✓ isMarketingPaused > returns true when marketing_pause_enabled = true
✓ isMarketingPaused > returns false when marketing_pause_enabled = false
✓ isMarketingPaused > fails open (returns false) when GrowthBook SDK throws
✓ isMarketingPaused > returns false when GROWTHBOOK_CLIENT_KEY is empty
```
