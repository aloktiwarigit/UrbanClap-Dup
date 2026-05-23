# ADR-0017 — Customer Wallet Ledger: Credit Projection, Apply-Credit Idempotency, and ₹ Safety Design

**Status:** Accepted  
**Date:** 2026-05-12  
**Deciders:** Alok Tiwari (owner), Claude Sonnet 4.6 (architect)  
**Story:** E13-S01  
**Cross-references:** ADR-0003 (Cosmos DB), Threat-model S-W1, docs/stories/E13-S01-wallet-endpoints-api.md

---

## Context

The ₹500 no-show guarantee (committed in the product brief) issues a credit to the customer when a technician no-shows. The timer (`trigger-no-show-detector.ts`) already writes a `CustomerCreditDoc` to the `customer_credits` Cosmos container. However:

1. There is no API for the customer to see their balance or ledger.
2. `POST /v1/bookings` cannot apply that credit — every booking is charged in full.
3. There is no idempotency protection against a customer replaying `applyCredit` requests to double-spend credits.
4. Concurrent booking-creation requests from the same customer (two tabs, retry storm) could double-spend the same credit balance.

This ADR documents the design decisions for E13-S01.

---

## Decision

### 1. No new Cosmos container — reuse `customer_credits`

The existing `customer_credits` container (partitioned by `/customerId`) stores `CustomerCreditDoc` records for issued credits. We add new `CustomerCreditLedgerDoc` records alongside them with:
- `type: 'CREDIT_ISSUED' | 'CREDIT_APPLIED' | 'REFUND'`
- `amountInPaise`
- `bookingId` (optional — present on CREDIT_APPLIED + source booking of CREDIT_ISSUED)
- `reason`
- `createdAt`

The original `CustomerCreditDoc` records (issued by the no-show timer) remain as `CREDIT_ISSUED` entries. A migration of existing records is deferred — E13-S01 only writes new entries going forward.

**Why no new container?** Cosmos Serverless charges per RU and per GB of storage. Adding a second container for customer credit data would double storage and require cross-container reads for balance. The ₹0 constraint is binding.

### 2. Balance-recompute-on-read pattern

There is no stored mutable balance field. Every call to `getBalance(customerId)` recomputes:

```
balance = Σ(CREDIT_ISSUED + REFUND) − Σ(CREDIT_APPLIED)
```

over all entries in the partition. This eliminates the two-phase-commit problem (update balance AND append ledger entry). A mutable balance field would require a Cosmos transaction or optimistic concurrency on the balance document, which is more complex and introduces drift risk.

**Trade-off:** At low volume (≤5,000 bookings/mo pilot), a full-partition scan for balance is cheap. If volume grows, a balance-checkpoint pattern (snapshot + incremental scan) can be layered on without changing the API surface.

**Belt-and-suspenders:** `Math.max(0, balance)` at the repo layer prevents a buggy or malicious ledger entry from yielding a negative balance.

### 3. Credit issuance projection from no-show events

The no-show timer (`trigger-no-show-detector.ts`) currently calls `customerCreditRepo.createCreditIfAbsent()` which writes a `CustomerCreditDoc`. For E13-S01, the `getBalance` projection interprets these existing docs. A future migration (E13-S05, unscoped) can back-fill `type: 'CREDIT_ISSUED'` on existing docs.

Until that migration runs, `getBalance` counts only `CustomerCreditLedgerDoc` entries with an explicit `type` field. Old `CustomerCreditDoc` entries (no `type` field) are not counted as balance — this is intentional: it avoids double-counting once the migration runs.

### 4. Apply-credit idempotency via separate container + 24h TTL

`POST /v1/bookings` with `applyCredit: true` requires an `Idempotency-Key: <uuid>` header. If the same UUID is replayed within 24h, the endpoint returns the original `appliedCreditAmount` without writing a new ledger entry.

**Implementation:**
- A separate `applied_credit_idempotency` container (partitioned by `/customerId`) stores one doc per idempotency key.
- The doc has a Cosmos TTL of 86400 seconds (24h). Cosmos auto-deletes it after TTL expires.
- On replay: `item(idempotencyKey, customerId).read()` returns the existing doc → return its `appliedAmountInPaise` directly.

**Why a separate container?** We want TTL at the container level, not per-document (Cosmos supports per-doc TTL but requires the container to have TTL configured). A dedicated container isolates the idempotency concern from the ledger.

### 5. Concurrency safety: 412 race → zero-credit fallback

Two concurrent `POST /v1/bookings` requests from the same customer could:
1. Both read the same balance.
2. Both call `applyCredit`.
3. Both write a `CREDIT_APPLIED` ledger entry, double-spending the credit.

**Defence layers:**
1. **Idempotency-key dedup:** If both requests use the same `Idempotency-Key`, the second write to `applied_credit_idempotency` gets a 409 (Cosmos creates are idempotent by doc id). The winning write captures the result; the losing write still returns the cached result from the dedup doc.
2. **_etag optimistic concurrency (future hardening):** For true concurrent requests with *different* idempotency keys (two separate booking attempts at the same time), the current implementation treats a 412 response from Cosmos as a non-fatal signal and falls back to `appliedCreditAmount: 0`. The booking still succeeds — credit is just not applied. This is safe (no double-spend), just occasionally conservative.
3. **Balance-recompute-on-read:** Even if two CREDIT_APPLIED entries are written (in a race between two different idempotency keys), the next `getBalance` call correctly subtracts both. The balance can temporarily read as 0 or negative during the race window, but the `Math.max(0, balance)` guard prevents serving a negative balance.

**Design choice:** Full `_etag` locking on the balance-checkpoint doc is deferred to E13-S03 (when credit-apply volume is expected to grow). The belt-and-suspenders of idempotency-key dedup + 412-fallback-to-zero is sufficient for the pilot.

### 6. API surface

```
GET /v1/wallet/balance
  Auth: customer (Firebase ID token)
  Response: { balanceInPaise: number, lastUpdatedAt: string }

GET /v1/wallet/ledger?page=1&limit=20
  Auth: customer
  Query: page (int ≥1, default 1), limit (int 1–100, default 20)
  Response: { entries: LedgerEntry[], total: number, page: number, limit: number }
  LedgerEntry: { id, type, amountInPaise, bookingId?, reason, createdAt }

POST /v1/bookings (extended)
  Body: { ..., applyCredit?: boolean }
  Header: Idempotency-Key: <uuid>  (required when applyCredit=true and feature flag is on)
  Response: { ..., appliedCreditAmount: number }
```

### 7. Feature flag: `customer.wallet-credit.enabled`

Credit application is gated behind a GrowthBook feature flag. Default is `false` (fail-closed — never silently spend customer money). The flag will be flipped to `true` after E13-S02 (WalletScreen) ships and the balance is visible to the customer in the app.

### 8. Monetary values in paise

All amounts are stored and returned in paise (integer, 1 INR = 100 paise) to avoid floating-point arithmetic. This is consistent with Razorpay's API convention.

---

## Consequences

### Positive
- No new Cosmos container; no operational cost increase.
- Balance-recompute-on-read eliminates two-phase-commit.
- Idempotency-key dedup prevents replay attacks.
- 412-race-fallback prevents double-spend without blocking the booking.
- Feature flag prevents premature credit spend before UI is live.

### Negative / Trade-offs
- Full-partition scan for balance is O(N entries). Acceptable at pilot scale; needs checkpoint pattern at production scale.
- Old `CustomerCreditDoc` records (no `type` field) are not counted in balance until a migration runs. This means customers who received a credit before E13-S01 ships will not see it in their balance — acceptable for the pilot (≤10 such cases expected).
- The `applied_credit_idempotency` container requires pre-provisioning before the function app starts (same pattern as lease containers — see `api/CLAUDE.md`).

---

## Compliance / Threat model

See threat-model.md row S-W1 for the mitigations against:
- Credit replay (same idempotency key within 24h)
- Negative balance exploit
- Concurrent double-spend race
- Feature-flag bypass

Karnataka invariant (ADR-0006/0011): Not affected. Wallet credit does not touch dispatcher ranking.
