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
9. The OpenAPI contract (`api/openapi.json`, admin-web's generated client) documents the final
   endpoint set below and `openapi:lint` passes; `setup-cosmos.ts` and
   `backfill-commission-holds.ts` are safe to run against a production environment carrying live
   E21-S01 data (see `docs/runbook.md` → "Commission ledger v2 (E21-S02)" → Rollout order); the
   cross-container-allocator rejection and the single-partition-batch design are recorded in
   `docs/adr/0031-single-partition-commission-ledger.md`.

## Final endpoint set (Task 13)

| Method | Path | Notes |
|---|---|---|
| `POST` | `/v1/admin/finance/commission-remittances` | New (Task 10). Idempotent multi-booking remittance + credit. |
| `GET` | `/v1/admin/finance/commission-receivables` | Changed. Hold-based dashboard (was DUE-count dashboard), `continuationToken` pagination. |
| `POST` | `/v1/admin/finance/commission-receivables/recompute` | New (Task 10). Enqueues a full hold-repair sweep. |
| `GET` | `/v1/admin/finance/commission-receivables/{technicianId}` | Changed. Full ledger detail (receivables + remittances + credits), was DUE-entries-only. |
| `POST` | `/v1/admin/finance/commission-receivables/settle` | Changed. WAIVE-only; `action: "REMIT"` returns `410`. |
| `POST` / `DELETE` | `/v1/admin/finance/commission-hold/{technicianId}/override` | New (Task 10). Manual hold override. |
| `GET` / `PUT` | `/v1/admin/catalogue/commission-config` | Changed. Effective config now includes warn/block thresholds + enforcement flags. |
| `GET` | `/v1/technicians/me/commission-due` | Changed (v2). Net totals, ledger, week summary; v1 field names preserved for old APKs. |
| `GET` | `/v1/config/technician` | New. Technician-app feature flags + thresholds + incentive dark-launch config. |

## Links

- Plan: `plans/E21-S02-commission-ledger-v2.md`
- Spec: `C:/Users/alokt/.claude/plans/validated-frolicking-mochi.md`
- ADR: `docs/adr/0031-single-partition-commission-ledger.md`
