---
status: in_progress
epic: E13
story: S01
tier: Foundation
security: true
dependencies: ["E16-S01"]
---

# E13-S01 — API: Wallet Endpoints + applyCredit on POST /v1/bookings

## Context

The ₹500 no-show guarantee is issued as `CustomerCreditDoc` records in the `customer_credits` Cosmos container. But there is no customer-facing API to check the balance or see the ledger, and `POST /v1/bookings` cannot apply that credit. This story adds the missing API surface.

## Scope

- `GET /v1/wallet/balance` → balance for the auth'd customer
- `GET /v1/wallet/ledger?page=&limit=` → paginated ledger entries
- `POST /v1/bookings` extension: optional `applyCredit: boolean`, idempotency-key dedup via `Idempotency-Key` header

## Acceptance Criteria

**AC-1** `GET /v1/wallet/balance` returns correct balance for the auth'd customer; cross-user request returns 403.

**AC-2** `GET /v1/wallet/ledger?page=1&limit=20` returns paginated entries newest-first; total count matches all entries.

**AC-3** `POST /v1/bookings` with `applyCredit: true` and sufficient balance → response includes `appliedCreditAmount` > 0 and a `CREDIT_APPLIED` ledger entry appears.

**AC-4** `POST /v1/bookings` with `applyCredit: true` and zero balance → `appliedCreditAmount: 0`, no ledger entry written, booking proceeds at full amount.

**AC-5** `POST /v1/bookings` with `applyCredit: true` replayed within 24h with same `Idempotency-Key` → returns the original response; ledger is NOT double-written.

**AC-6** Concurrent `applyCredit` requests for the same customer (race) → only one succeeds; the other gets a retry signal via 412 → 200 with `appliedCreditAmount: 0` (no double-spend).

**AC-7** ADR-0017 (`docs/adr/0017-customer-wallet-ledger.md`) committed in same PR.

**AC-8** Threat-model row S-W1 appended to `docs/threat-model.md`.

**AC-9** ≥80% coverage (Vitest + supertest).

## Files Created / Modified

### New Files
- `api/src/schemas/wallet.ts` — Zod schemas for wallet responses + ledger entry + apply-credit request
- `api/src/cosmos/customer-credit-ledger-repository.ts` — `getBalance`, `getLedgerPage`, `applyCredit` with `_etag` concurrency
- `api/src/functions/wallet.ts` — HTTP handlers for balance + ledger endpoints
- `api/tests/functions/wallet.test.ts` — TDD tests (committed before impl)
- `api/tests/bookings/create-apply-credit.test.ts` — TDD tests for applyCredit on POST /v1/bookings
- `docs/adr/0017-customer-wallet-ledger.md` — ADR

### Modified Files
- `api/src/schemas/booking.ts` — add `applyCredit?: boolean` to `CreateBookingRequestSchema`
- `api/src/functions/bookings.ts` — integrate `applyCredit` logic with idempotency-key dedup
- `api/src/services/featureFlags.service.ts` — add `isWalletCreditEnabled` flag
- `api/src/cosmos/client.ts` — add `getCustomerCreditLedgerContainer` (if needed as separate container) + `getAppliedCreditIdempotencyContainer`
- `docs/threat-model.md` — append S-W1 row

## Work Streams

- **WS-A**: Zod schemas (`api/src/schemas/wallet.ts`) + extend `booking.ts` schema
- **WS-B**: Repository layer (`customer-credit-ledger-repository.ts`) — TDD first
- **WS-C**: Feature flag + wallet HTTP handlers (`wallet.ts`) — TDD first
- **WS-D**: `bookings.ts` applyCredit integration + idempotency — TDD first
- **WS-E**: Docs (ADR-0017 + threat-model) + pre-Codex smoke gate
