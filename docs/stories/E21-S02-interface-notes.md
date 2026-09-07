# E21-S02 — Commission ledger v2: interface notes and rulings

Extracted from the E21-S02 SDD decision ledger
(`wt-e21-s02/.superpowers/sdd/E21-S02-commission-ledger-v2/progress.md`, git-ignored) so that
E21-S03, E21-S04 and E21-S05 have a durable, in-repo copy of the contracts they build against.

Source of truth for the design itself: `docs/adr/0031-single-partition-commission-ledger.md`
and `docs/runbook.md` → "Commission ledger v2 (E21-S02)". This file records the per-task
interface surface and the decisions taken during review, which live nowhere else.

Related: `docs/reviews/codex-e21-s02-20260906.summary.md`.

---

## Interface notes (what later stories call)

- Task 4: interface note for later tasks — commissionReceivableRepo.readLedgerDoc<T>(technicianId, id) exists; ApplyCreditInput.anchor = { id, build(plan), matches?(existing) }; applyCredit throws code IDEMPOTENCY_MISMATCH (→ HTTP 409 in Task 10) and PRECONDITION (→ HTTP 409 LEDGER_BUSY)
- Task 5: interface note — api/src/cosmos/retry-utils.ts exports definedOnly, isPreconditionFailure, MAX_ETAG_ATTEMPTS; systemDocsRepo.{getTechnicianClientConfig, patchTechnicianClientConfig, enqueueHoldRepair, drainHoldRepair}; service getCommissionConfig() (cached) vs repo getCommissionConfig() (raw); service test lives in tests/unit/commission-config.service.test.ts
- Task 6: interface note — recomputeCommissionHold(id) → { hold, status }; computeCommissionHold(id) (reads only); sweepAllHolds({ dryRun?, log?, scope?: 'FULL'|'EXPIRED_OVERRIDES' }); repo: readCommissionHold, patchCommissionHold, listTechniciansWithHold (paged, dashboard), listAllTechniciansWithHold (drain), listTechniciansWithExpiredOverride(nowIso), patchPaymentProfile; commissionReceivableRepo.sumDueGroupedByTechnician() now drains and returns groups[] (no token). CARRY TO E21-S04: reconciler runs scope EXPIRED_OVERRIDES every 15 min.
- Task 7: interface note — repo patchFcmToken(technicianId, token); private readModifyWrite helper is the only upsert path on technicians
- Task 8: interface note — commission-settlement.service.ts: recordCommissionDue(booking) → { created, commissionDue, commissionBps, commissionResolvedFrom } | { created:false, skipped }; finalizeLedgerForTechnician(id) never throws; trigger handler exported as handleBookingCompletedBatch and rethrows settlement failures; BookingDocSchema has optional collectionMethod
- Task 10: interface note — routes: POST /v1/admin/finance/commission-remittances; GET /v1/admin/finance/commission-receivables (+?continuationToken); POST …/commission-receivables/recompute; GET …/commission-receivables/{technicianId}; POST/DELETE /v1/admin/finance/commission-hold/{technicianId}/override; settle REMIT → 410. Error codes: IDEMPOTENCY_MISMATCH 409, LEDGER_BUSY 409, TECHNICIAN_NOT_FOUND 404. Audit actions used: COMMISSION_REMITTANCE_RECORDED, COMMISSION_HOLD_RECOMPUTE_REQUESTED, COMMISSION_HOLD_OVERRIDDEN, COMMISSION_HOLD_OVERRIDE_CLEARED, COMMISSION_WAIVED
- Task 11: interface note — lib/ist-time.ts (IST_OFFSET_MS, istDateStr, istWeekStart); TechnicianCommissionDueV2Schema; buildCommissionDueResponse; GET /v1/config/technician (systemDocsRepo.getIncentiveConfig added; _resetTechnicianConfigCacheForTest)

---

## Corrections found after merge

- **Ruling B was incomplete.** The `hasMoreResults()` drain loop it introduced for
  `sumDueGroupedByTechnician` destructured `page.resources` unguarded. Real Cosmos returns
  `resources: undefined` on the pages of an aggregate `GROUP BY` query, so the call threw
  `TypeError: page.resources is not iterable` in production — breaking the admin commission
  dashboard and `sweepAllHolds({ scope: 'FULL' })`. Fixed in `fix/cosmos-aggregate-page-resources`
  along with five sibling sites. The unit tests missed it because they mocked the iterator as
  always returning an array.

---

## Rulings taken during review

- Rulings: none required pre-flight.
- Ruling: mismatch check — the allocator is generic (anchor may be a remittance now, an award in E23); on CONFLICT read the existing anchor and compare `amountPaise` when present, else defer to an optional `anchor.matches(existing)` predicate; mismatch → throw code IDEMPOTENCY_MISMATCH (HTTP 409 at the handler in Task 10). Cost if wrong: an over-strict check refuses a legitimate replay — visible, not money-losing.
- Ruling: default replay validation is fail-closed — without an `anchor.matches` predicate, `existing.amountPaise` must be a number equal to `input.paise`, else IDEMPOTENCY_MISMATCH. Supersedes the earlier "when present" ruling. E23 award anchors must pass `matches`. Cost if wrong: an anchor type without amountPaise and without a predicate is refused loudly — never money-losing.
- Ruling: GET uses the raw repo read (brief text; admin screen needs read-your-write; cache exists for the settlement hot path). Shared helpers → api/src/cosmos/retry-utils.ts. Cost if wrong: none material.
- Ruling A: STALE is retried ×2 with fresh reads inside recomputeCommissionHold; recompute returns { hold, status }. Cost if wrong: two extra cheap reads.
- Ruling B: sumDueGroupedByTechnician drains the iterator fully (hasMoreResults loop) and returns groups[] — aggregate rows are one per technician, bounded; the continuation-token parameter is removed (Task 3 signature superseded). Cost if wrong: RU spike on a very large fleet — not the pilot.
- Ruling C: keep paged listTechniciansWithHold for the admin dashboard (Task 10) but add listAllTechniciansWithHold() (full drain) for the sweep; add listTechniciansWithExpiredOverride(nowIso) so E21-S04's 15-min reconciler can recompute lapsed overrides; sweepAllHolds gains scope 'FULL' | 'EXPIRED_OVERRIDES'. Carry to E21-S04 dispatch: reconciler must call the EXPIRED_OVERRIDES scope every run. Cost if wrong: a lapsed override stays CLEAR ≤15 min once E21-S04 ships.
- Ruling: settlement failures inside settleBooking (anything after the parse/skip guards, before or during createDueEntry) are rethrown from the change-feed handler after Sentry capture so the lease is not checkpointed and Azure retries; finalize failures stay swallowed (self-healing via reconciler). Cost if wrong: a poison booking doc stalls that lease partition until fixed — loud in Sentry — versus silently lost commission. Chosen: loud.
- Ruling: idempotency fingerprint = { technicianId, amountPaise, method, ref } compared on BOTH the fast-path replay and anchor.matches; mismatch → 409 IDEMPOTENCY_MISMATCH; idempotencyKey documented as per-technician scoped (client sends a UUID). Cost if wrong: an over-strict compare refuses a legitimate replay — loud, not money-losing.
- Ruling: technician existence (readCommissionHold(...).exists) checked before applyCredit; absent → 404, no writes, no audit.
- Ruling: override requires APPLIED; STALE retried ×3 with fresh reads then 409 LEDGER_BUSY; MISSING → 404; no audit unless applied.
- Ruling: also type the `action` param of the three direct appendAuditEntry wrappers (trigger-booking-completed systemAuditEntry, trigger-reconcile-payouts systemAuditEntry, catalogueAudit.service catalogueAuditEntry) as AuditAction so the enum is closed for real; static test keeps the implementer's broader field set AND adds the brief's `+\s*1\b.*remittedAmount` alternative. Cost if wrong: none material.
- Ruling: fix wave also takes two residual-risk hardenings — runLedgerBatch catches thrown SDK errors and maps code/message 409→CONFLICT, 412→PRECONDITION (else rethrow); remittance handler calls consumePendingCredits when creditCreatedPaise>0. Cost if wrong: none material.
- Ruling: staleAfter = evaluatedAt + 6h (the full-sweep cadence) as an ISO string per row; ordering fixed by paging in memory over the drained hold list (one query). Carry to E21-S04 as already ruled: hold-reconciliation-summary must carry top-N ordering.
- Ruling: side effects belong to whoever creates the row — move audit + incrementCompletedJobCount + sendTechEarningsUpdate into the settlement service (new settleCashCompletion(booking) wrapping recordCommissionDue); both callers use it; recordCommissionDue skips RAZORPAY with skipped:'NOT_CASH'. Cost if wrong: none material (idempotent on created:true).
- Ruling: both fixed now (money-display accuracy on the owner's console), no third Codex round per the one-round rule. Marker records the SHA Codex reviewed (6d018dfd) with the follow-up noted.

---

## Parked items and carry-forwards

- Task 10: parked — dashboard drains all holds + DUE aggregate per request (Codex P2) — Ruling: acceptable at pilot scale (≤ hundreds of technicians); CARRY TO E21-S04: reconciler writes system/hold-reconciliation-summary { unreconciledTechnicianCount, computedAt } each run and the dashboard reads it instead of draining. Cost if wrong: RU/latency growth on the admin dashboard as the fleet grows — visible, not money-losing.
- Task 6 (see interface notes above): CARRY TO E21-S04 — the reconciler must run `sweepAllHolds({ scope: 'EXPIRED_OVERRIDES' })` every 15 min.
- Task 12: parked — report arithmetic (says 68, actual AuditAction members = 63) — Ruling: scratch-report inaccuracy, code verified correct by the re-reviewer; not worth a round. Cost if wrong: none.
