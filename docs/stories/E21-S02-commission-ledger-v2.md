# E21-S02: Commission ledger v2

**Goal:** Extend the `commission_receivables` container (pk `/technicianId`) so remittances,
credits and (later) incentive awards live in the same partition under a `docType`
discriminator, with every derived money figure recomputed from source arrays rather than
incremented — enabling partial/overpayment remittance, technician commission holds, and
configurable warn/block thresholds without breaking any E21-S01 stored doc.

## Acceptance (story-level)

1. Legacy receivable docs (no `docType`, no `allocations`) parse, appear in earnings,
   dashboards, and technician view unchanged.
2. Partial remittance (₹200 vs ₹220 due) leaves status DUE with correct outstanding; replaying
   the same idempotency key is a no-op; overpayment creates a `CREDIT` doc that later
   remittances/dues consume automatically.
3. Concurrent remittances against the same rows resolve via ETag retry with exact totals.
4. A duplicate change-feed delivery leaves one receivable and still recomputes the hold.
5. `PUT commission-config` accepts partial patches; rejects `warnThresholdPaise >= blockThresholdPaise`.
6. `GET /v1/technicians/me/commission-due` returns net totals; `GET /v1/config/technician`
   returns all features `false` on a fresh system.
7. Every technicians writer preserves `commissionHold` under concurrent hold patches.
8. Semgrep rules enforce absolute recomputation and `runLedgerBatch`-only writes.

## Links

- Plan: `plans/E21-S02-commission-ledger-v2.md`
- Spec: `C:/Users/alokt/.claude/plans/validated-frolicking-mochi.md`
