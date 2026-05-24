# E21-S01 — Cash-Pilot Commission Model: API Foundation

**Epic:** E21 — Cash-Pilot Commission Model (new; reworks the E06-S04 / E08-S02 / E09-S04 prepaid-era finance model for the cash-only pilot).
**Tier:** Foundation (money + Cosmos schema + change-feed trigger; security-sensitive).
**Depends on:** nothing. **Blocks:** E21-S02 (admin-web), E21-S03 (technician-app) — both generate types from this story's OpenAPI contract, so the contract must be frozen + merged before they start.

## Context / why

The pilot is cash-only (Razorpay hidden, commit `13fa7280`). The technician collects the **full cash from the customer at the door**; the platform never touches the money. But the settlement engine was built for the prepaid/escrow model and **pays the technician out** on completion — the money arrow is inverted for cash:

- `trigger-booking-completed.ts:130-150` transfers `techAmount` to the tech via Razorpay Routes (INSTANT) or holds a payout (WEEKLY/NEXT_DAY).
- `admin/finance/approve-payouts.ts` "Approve All" sends money to techs.
- Finance "Payout Queue" shows `netPayable` = what the platform owes the tech.

Owner decisions: **(1) tech-remits-commission** — tech keeps the cash, owes the platform the commission; platform tracks "commission due" per tech; tech remits (UPI/cash deposit); an admin marks it received (audit-logged). **(2) commission config = cascade** — global default %, overridable per-category, overridable per-service; settlement resolves service → category → global.

Three verified breakages this story fixes:
1. `commission.service.ts:11` hardcodes `completedJobCount >= 50 ? 2500 : 2200` and never reads `Service.commissionBps` — the admin's commission editor is dead config.
2. `cashCollectionStatus` is set to `'PENDING'` at creation and never updated; `'COLLECTED'` exists only in the enum. No admin visibility into collection.
3. `finance-repository.ts:62,86` read `booking.commissionBps`, a field never written onto bookings — P&L silently falls back to 2200.

## Work streams

### WS-A — schema + Zod types (TDD; do first, commit) — orchestrator-owned
- CREATE `api/src/schemas/commission-config.ts` — `CommissionConfigDocSchema { id:'commission-config', defaultCommissionBps: int[1500..3500], updatedBy, updatedAt }`; resolver I/O types.
- CREATE `api/src/schemas/commission-receivable.ts` — model in "Data model" below.
- MODIFY `api/src/schemas/service-category.ts` — add `commissionBps: z.number().int().min(1500).max(3500).optional()` (override). It flows into the admin create/update bodies and the OpenAPI `AdminServiceCategory`.
- MODIFY `api/src/schemas/service.ts` — make `commissionBps` `.optional()` (a service may defer to category/global); allow omission in create body.
- MODIFY `api/src/schemas/booking.ts` — add `cashCollectedAt: z.string().optional()`, `cashCollectedAmount: z.number().int().nonnegative().optional()`. No new status value.
- Tests first: `api/tests/schemas/commission-config.test.ts`, `api/tests/schemas/commission-receivable.test.ts` (valid/invalid, range bounds, round-trip).

### WS-B — repos + services + endpoints (TDD; fan out to Sonnet subagents after WS-A commit)
Each subagent owns one impl file + its test, test written first.
- CREATE `api/src/services/commission-config.service.ts` — pure `resolveCommissionBps({serviceBps, categoryBps, globalBps})` (precedence below) + cached `getGlobalCommissionBps()` mirroring the `truecaller.service.ts` cache (incl. `_resetCacheForTest()`).
- CREATE `api/src/cosmos/commission-config-repository.ts` — get/upsert doc id `commission-config` in `getSystemContainer()`.
- CREATE `api/src/cosmos/commission-receivable-repository.ts` — `getByBookingId`, `createDueEntry` (409-safe, mirror `walletLedgerRepo.createPendingEntry`), `markRemitted`, `markWaived`, `getOutstandingByTechnician` (single-partition), `getAllTechnicianOutstandingSummaries` (cross-partition aggregate).
- MODIFY `api/src/services/commission.service.ts` — new signature `calculateCommission(bookingAmountPaise, commissionBps) => { commissionBps, commissionAmount, techAmount }`; drop the tenure tiers. Update `api/tests/unit/commission.service.test.ts`.
- CREATE `api/src/functions/admin/finance/commission-receivables.ts` — GET per-tech outstanding dashboard + per-tech detail. `requireAdmin(['super-admin','ops-manager','finance'])` (read).
- CREATE `api/src/functions/admin/finance/mark-commission-received.ts` — POST mark REMITTED/WAIVED; `requireAdmin(['super-admin','finance'])`; audit-logged; idempotent re-mark.
- CREATE `api/src/functions/admin/catalogue/commission-config.ts` — GET/PUT global default; `requireAdmin(['super-admin'])` (write).
- CREATE `api/src/functions/technicians/commission-due.ts` — GET `/v1/technicians/me/commission-due` (tech-facing owed/outstanding).
- MODIFY `api/src/cosmos/booking-repository.ts` — add `markCashCollected(bookingId, amount)` (ETag-guarded, idempotent; mirror existing `markSosActivated`/`markPaid`).
- MODIFY `api/src/functions/active-job.ts` — on `COMPLETED` transition, accept optional `cashCollected`/`collectedAmount` in body → flip `cashCollectionStatus`. Audit/visibility only; does NOT gate the receivable.

### WS-B-risk — settlement trigger rewrite — orchestrator-owned (Opus)
MODIFY `api/src/functions/trigger-booking-completed.ts` (`settleBooking`):
1. Parse; return unless `status === 'COMPLETED'`; return if no `technicianId`. *(unchanged)*
2. Idempotency: `commissionReceivableRepo.getByBookingId(bookingId, technicianId)` → skip if exists.
3. `bookingAmount = finalAmount ?? amount`.
4. Resolve rate: fetch service (`commissionBps`), category (`commissionBps`), `getGlobalCommissionBps()`; `bps = resolveCommissionBps(...)`; `commissionDue = round(bookingAmount * bps / 10000)`.
5. `method = booking.paymentMethod ?? 'CASH_ON_SERVICE'`.
6. **CASH branch (pilot):** `commissionReceivableRepo.createDueEntry({... remittanceStatus:'DUE', commissionBps, commissionResolvedFrom})` (409-safe → skip on false); audit `COMMISSION_DUE_RECORDED`; best-effort `incrementCompletedJobCount` + `sendTechEarningsUpdate`. **No Razorpay, no techAmount transfer, no cadence/fee logic.**
7. **RAZORPAY branch (guarded; dead in pilot):** keep the old transfer path behind `if (method === 'RAZORPAY' && hasRazorpayCredentials())`.
Rewrite `api/tests/unit/trigger-booking-completed.test.ts`: CASH creates DUE receivable with resolved bps; does NOT instantiate `RazorpayRouteService`; idempotent (existing → skip, 409 → skip); skip no-tech/non-COMPLETED; cascade precedence; RAZORPAY guarded branch still transfers.

### WS-C — Semgrep
- `api/.semgrep.yml` — rule flagging any `new RazorpayRouteService()` not lexically guarded by a `paymentMethod === 'RAZORPAY'` check (prevents reintroducing the cash-transfer bug).

### WS-D — OpenAPI registry (freeze contract)
- `api/src/openapi/registry.ts` — register updated `AdminServiceCategory` (+`commissionBps`), commission-config GET/PUT, commission-receivables GET, mark-received POST, tech commission-due GET.

### WS-E — smoke gate + review
- `bash tools/pre-codex-smoke-api.sh` → green.
- `codex review --base main` (+ `/security-review` — money/auth) → `.codex-review-passed`.

## Commission-cascade resolver
Global doc in `system` container: `{ id:'commission-config', defaultCommissionBps:2200, updatedBy, updatedAt }`.
```
resolveCommissionBps({serviceBps, categoryBps, globalBps}):
  valid(x) := Number.isInteger(x) && 1500 <= x <= 3500
  if valid(serviceBps)  -> { bps: serviceBps,  from: 'SERVICE' }
  if valid(categoryBps) -> { bps: categoryBps, from: 'CATEGORY' }
  if valid(globalBps)   -> { bps: globalBps,   from: 'GLOBAL' }
  else throw ConfigError   // global must always be valid; surfaced, never silent-clamped
```
Snapshot the resolved `commissionBps` + `commissionResolvedFrom` onto the receivable at settlement time (immutability — later config edits must not retroactively re-rate recorded receivables).

## Data model — new container `commission_receivables` (pk `/technicianId`)
`id` = bookingId (idempotency anchor; point read on (bookingId, technicianId)).
Fields: `bookingId`, `technicianId`, `partitionKey`(=technicianId), `serviceId`, `categoryId`, `bookingAmount` (cash tech holds = finalAmount ?? amount), `cashCollectedAmount?`, `commissionBps` (resolved+snapshotted), `commissionDue`, `commissionResolvedFrom` (`SERVICE|CATEGORY|GLOBAL`), `remittanceStatus` (`DUE|REMITTED|WAIVED`), `remittedAmount?`, `remittedAt?`, `remittanceRef?` (UPI txn/deposit slip), `remittanceMethod?` (`UPI|CASH_DEPOSIT|ADJUSTMENT`), `markedByAdminId?`, `waivedReason?`, `createdAt`, `updatedAt?`.

**Commission becomes DUE on `COMPLETED`** (not gated on the cash-confirm tap) so no completed job escapes the ledger. The tech "confirm cash collected" action sets `cashCollectionStatus=COLLECTED`/`cashCollectedAmount` on the booking for audit/visibility only.

## Migration
1. Add `{ id:'commission_receivables', partitionKey:'/technicianId' }` to `api/scripts/setup-cosmos.ts` (no lease container — it's a target, not a change-feed source). `system` already provisioned.
2. Seed `{ id:'commission-config', defaultCommissionBps:2200 }` into `system` (matches the historical `finance-repository` default so P&L doesn't jump).
3. Repoint `getDailyPnL`/`getPayoutQueue` off the non-existent `booking.commissionBps` to recorded commission (read `commission_receivables`).
4. **OWNER DECISION (surface before finalizing seed):** seeded categories get `commissionBps` UNSET (fall through to global). Existing per-service `commissionBps` overrides will now actually take effect — keep them, or null them for a clean global-2200 start?
5. No destructive `wallet_ledger` migration; no retroactive backfill — start clean from a documented cutover timestamp.
6. Provision container + seed config **before** deploying the new trigger.

## Verification
- Unit (Vitest): resolver precedence + out-of-range + `commissionResolvedFrom`; `calculateCommission` arithmetic + `commission+tech===amount`; settlement rewrite (CASH→DUE, no Razorpay instantiation, idempotent, skip cases, RAZORPAY guarded transfer); receivable repo create/mark/aggregate (409 idempotency); admin endpoint auth (401/403/200 + audit + idempotent re-mark); config write super-admin-only; `active-job` COMPLETED flips `cashCollectionStatus`; catalogue category persists `commissionBps`.
- Gate: `tools/pre-codex-smoke-api.sh` → `/codex-review-gate` + `/security-review` → CI.
- End-to-end (manual, post-deploy): cash booking → complete → DUE receivable appears with cascade-resolved rate → admin sees per-tech outstanding → marks received → outstanding clears + audit written → tech `commission-due` reflects it.

## Riskiest
1. `trigger-booking-completed.ts` — change-feed; a bug double-charges/drops commission for every completed job. Preserve `bookingId` idempotency; test concurrent (409) + double fire.
2. Turning `Service.commissionBps` live changes effective commission (was dead). Owner sign-off (migration #4).
3. P&L on a missing field — repoint or the dashboard stays wrong.
4. OpenAPI contract is the cross-repo dependency — freeze before E21-S02/S03.
5. Dual meaning of `PAID` (cash booking is PAID at creation = dispatch-ready, not money received) — never treat PAID as settled; use `cashCollectionStatus`.
6. Zero-cost infra — UPI remittance is a manual link + admin "mark received"; no payment-collection PSP.
