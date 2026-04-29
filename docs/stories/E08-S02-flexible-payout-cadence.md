# E08-S02 · Flexible Payout Cadence

**Epic:** E08 — Earnings & Payouts  
**Story:** S02 — Flexible Payout Cadence  
**Tier:** Foundation (payment flow, Codex + /security-review mandatory)  
**Branch:** `feature/E08-S02-payout-cadence`

## Story

As a technician on Home Heroo, I want to choose when I get paid — weekly (free), next-day (₹15), or instantly (₹25) — so that I can manage my cash flow the way I need.

## Acceptance Criteria

| AC | Description | Status |
|---|---|---|
| AC-1 | `payoutCadence` + `payoutCadenceUpdatedAt` added to `TechnicianProfileSchema` | ✅ |
| AC-2 | `PATCH /v1/technicians/me/payout-cadence` — auth, Zod validation, ETag update, nextPayoutAt | ✅ |
| AC-3 | Conditional settlement in `trigger-booking-completed.ts` — INSTANT/NEXT_DAY/WEEKLY branches | ✅ |
| AC-4 | `payoutCadence`, `payoutFeeAmount`, `heldForCadence` added to `WalletLedgerEntrySchema` | ✅ |
| AC-5 | `trigger-next-day-payout.ts` — Azure timer at 04:30 UTC (10 AM IST) | ✅ |
| AC-6 | `approve-payouts.ts` WEEKLY-only filter — skip INSTANT/NEXT_DAY technicians | ✅ |
| AC-7 | `GET /v1/technicians/me/earnings` returns `pendingHeld` sum | ✅ |
| AC-8 | `PayoutCadenceScreen` — 3 radio options, biometric gate, Hindi labels | ✅ |
| AC-9 | `libs.versions.toml` synced (already identical) | ✅ |

## Files Created

### API
- `api/src/functions/payout-cadence.ts` — PATCH endpoint
- `api/src/functions/trigger-next-day-payout.ts` — daily 10 AM IST cron
- `api/tests/unit/payout-cadence.test.ts`
- `api/tests/unit/trigger-next-day-payout.test.ts`

### Android
- `domain/payout/PayoutRepository.kt`
- `domain/payout/PayoutCadenceResult.kt`
- `domain/payout/UpdatePayoutCadenceUseCase.kt`
- `data/payout/remote/dto/PayoutDtos.kt`
- `data/payout/remote/PayoutApiService.kt`
- `data/payout/PayoutRepositoryImpl.kt`
- `data/payout/di/PayoutModule.kt`
- `ui/payoutsettings/PayoutCadenceUiState.kt`
- `ui/payoutsettings/PayoutCadenceViewModel.kt`
- `ui/payoutsettings/PayoutCadenceScreen.kt`
- Test files for all of the above

## Files Modified

### API
- `api/src/schemas/wallet-ledger.ts` — payoutCadence, payoutFeeAmount, heldForCadence, pendingHeld
- `api/src/schemas/technician.ts` — payoutCadence, payoutCadenceUpdatedAt
- `api/src/cosmos/technician-repository.ts` — TechnicianSettlementInfo.payoutCadence, updatePayoutCadence(), getTechnicianPayoutCadence()
- `api/src/cosmos/wallet-ledger-repository.ts` — createPendingEntry (cadence fields), markPaid (heldForCadence=false), getPendingHeldByTechnicianId(), getNextDayPendingBefore()
- `api/src/functions/trigger-booking-completed.ts` — conditional settlement (AC-3)
- `api/src/functions/earnings.ts` — pendingHeld field (AC-7)
- `api/src/functions/admin/finance/approve-payouts.ts` — WEEKLY-only filter (AC-6)
- `api/tests/unit/trigger-booking-completed.test.ts` — cadence test cases
- `api/tests/unit/earnings.test.ts` — pendingHeld tests

### Android
- `navigation/HomeGraph.kt` — payout_settings route
- `ui/earnings/EarningsScreen.kt` — onPayoutSettings callback, pendingHeld card
- `domain/earnings/model/EarningsSummary.kt` — pendingHeldPaise field
- `data/earnings/remote/dto/EarningsDtos.kt` — pendingHeld in EarningsResponseDto
- `data/earnings/EarningsRepositoryImpl.kt` — map pendingHeld

## Critical Guardrails Implemented

- **Cadence check is additive** — INSTANT path = existing immediate transfer path + fee deduction
- **Minimum guard** — INSTANT: techAmount ≤ 2500 → degrade to WEEKLY; NEXT_DAY: ≤ 1500 → degrade to WEEKLY
- **Legacy compatibility** — undefined payoutCadence treated as WEEKLY silently
- **Idempotency on next-day cron** — `heldForCadence === false` check before transferring
- **Biometric is best-effort** — if hardware absent, proceed without prompt
- **Audit every money movement** — ROUTE_TRANSFER_INSTANT, ROUTE_TRANSFER_NEXT_DAY, SETTLEMENT_HELD_WEEKLY, SETTLEMENT_HELD_NEXT_DAY

## IST boundary logic

- Next-day cron cutoff: `todayIstMidnightUtc()` = IST today's date at 00:00 IST expressed as UTC (subtract 5.5h offset from nominal UTC midnight of that IST date)
- Example: cron fires at 04:30 UTC (10:00 IST) on 2026-04-29 → cutoff = 2026-04-28T18:30:00Z
- Entries created before IST midnight (i.e., before 2026-04-29T00:00 IST) are eligible

## Review Gates

```bash
bash tools/pre-codex-smoke-api.sh          # exit 0
bash tools/pre-codex-smoke.sh technician-app  # exit 0
pnpm -C api test                            # all pass
# Then: codex review --base main
# Then: /security-review (payment flow)
```
