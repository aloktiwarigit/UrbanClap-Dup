2026-09-07T10:43:14.726365Z ERROR codex_models_manager::manager: failed to load models cache: missing field `supports_parallel_tool_calls` at line 132 column 5
OpenAI Codex v0.147.0
--------
workdir: C:\Alok\Business Projects\wt-fix-cosmos-pages
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: high
reasoning summaries: none
session id: 01a07b77-0e59-76e3-b3ed-6cdb8dd89eca
--------
user
changes against 'main'
  → Load repository instructions
  • Inspect diff versus merge base
  • Analyze changed code for bugs
  • Produce JSON findings
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force | Select-Object Name,Mode,Length' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 7204ms:

Name                   Mode   Length
----                   ----   ------
.claire                d-----       
.firebase              d-----       
.githooks              d-----       
.github                d-----       
.serena                d-----       
.superpowers           d-----       
admin-web              d-----       
api                    d-----       
artifacts              d-----       
commonMain             d-----       
core-nav               d-----       
customer-app           d-----       
design-system          d-----       
docs                   d-----       
figma                  d-----       
firebase               d-----       
infra                  d-----       
moto-g-snapshots       d-----       
plans                  d-----       
play-store-assets      d-----       
technician-app         d-----       
tools                  d-----       
_bmad                  d-----       
_bmad-output           d-----       
.bmad-readiness-passed -a---- 26    
.codex-review-passed   -a---- 477   
.firebaserc            -a---- 63    
.git                   -a-h-- 83    
.gitattributes         -a---- 659   
.gitignore             -a---- 3617  
.semgrepignore         -a---- 694   
CLAUDE.md              -a---- 14551 
firebase.json          -a---- 252   
TOKEN-SYNC.md          -a---- 1346  



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Recurse -Force -Filter AGENTS*.md | Select-Object FullName' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 1249ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Recurse -Force -Include AGENTS.md,AGENTS.override.md,.agents.md,CODEX.md | Select-Object FullName' in C:\Alok\Business Projects\wt-fix-cosmos-pages
2026-09-07T10:43:46.953173Z ERROR codex_core::tools::router: error=Exit code: 124
Wall time: 10.3 seconds
Output:
command timed out after 10317 milliseconds

 exited 124 in 10317ms:
  ✓ Load repository instructions
  → Inspect diff versus merge base
  • Analyze changed code for bugs
  • Produce JSON findings
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --stat c25e50aa9e5d28562aad7f6151782018ecfa3bb9' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 501ms:
 api/src/cosmos/audit-log-repository.ts             |  2 +-
 api/src/cosmos/commission-receivable-repository.ts |  6 +-
 api/src/cosmos/erasure-request-repository.ts       |  2 +-
 api/src/cosmos/technician-repository.ts            |  6 +-
 .../commission-receivable-repository.test.ts       | 35 ++++++++++++
 api/tests/cosmos/technician-repository.test.ts     | 45 +++++++++++++++
 docs/stories/E21-S02-interface-notes.md            | 64 ++++++++++++++++++++++
 7 files changed, 154 insertions(+), 6 deletions(-)
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff c25e50aa9e5d28562aad7f6151782018ecfa3bb9 -- api/src/cosmos/audit-log-repository.ts api/src/cosmos/commission-receivable-repository.ts api/src/cosmos/erasure-request-repository.ts api/src/cosmos/technician-repository.ts api/tests/cosmos/commission-receivable-repository.test.ts api/tests/cosmos/technician-repository.test.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 459ms:
diff --git a/api/src/cosmos/audit-log-repository.ts b/api/src/cosmos/audit-log-repository.ts
index d5751b17..8fa5d7af 100644
--- a/api/src/cosmos/audit-log-repository.ts
+++ b/api/src/cosmos/audit-log-repository.ts
@@ -59,7 +59,7 @@ export async function queryAuditLog(
     );
 
   const page = await iterator.fetchNext();
-  const entries = page.resources.map((r) => AuditLogEntrySchema.parse(r));
+  const entries = (page.resources ?? []).map((r) => AuditLogEntrySchema.parse(r));
   const result: { entries: AuditLogEntry[]; continuationToken?: string } = { entries };
   if (page.continuationToken !== undefined) {
     result.continuationToken = page.continuationToken;
diff --git a/api/src/cosmos/commission-receivable-repository.ts b/api/src/cosmos/commission-receivable-repository.ts
index 1736af6a..5741edc6 100644
--- a/api/src/cosmos/commission-receivable-repository.ts
+++ b/api/src/cosmos/commission-receivable-repository.ts
@@ -230,9 +230,13 @@ export const commissionReceivableRepo = {
       dueCount: number;
       oldestDueAt: string;
     }> = [];
+    // `page.resources` is undefined — not [] — on the pages of an aggregate GROUP BY query,
+    // while hasMoreResults() stays true. Spreading it unguarded threw
+    // "TypeError: page.resources is not iterable" against the real container, which took out
+    // the admin commission dashboard and sweepAllHolds({ scope: 'FULL' }). Guard every page.
     while (iterator.hasMoreResults()) {
       const page = await iterator.fetchNext();
-      groups.push(...page.resources);
+      groups.push(...(page.resources ?? []));
     }
     return groups;
   },
diff --git a/api/src/cosmos/erasure-request-repository.ts b/api/src/cosmos/erasure-request-repository.ts
index f021cd50..8e5e5c52 100644
--- a/api/src/cosmos/erasure-request-repository.ts
+++ b/api/src/cosmos/erasure-request-repository.ts
@@ -118,5 +118,5 @@ export async function listErasureRequests(
     maxItemCount: pageSize,
   });
   const page = await iterator.fetchNext();
-  return page.resources.map((r) => ErasureRequestDocSchema.parse(r));
+  return (page.resources ?? []).map((r) => ErasureRequestDocSchema.parse(r));
 }
diff --git a/api/src/cosmos/technician-repository.ts b/api/src/cosmos/technician-repository.ts
index 55a6628c..c56da48f 100644
--- a/api/src/cosmos/technician-repository.ts
+++ b/api/src/cosmos/technician-repository.ts
@@ -588,7 +588,7 @@ export async function listTechniciansWithHold(continuationToken?: string): Promi
     { maxItemCount: 50, ...(continuationToken ? { continuationToken } : {}) },
   );
   const page = await iterator.fetchNext();
-  const items = page.resources.map(toHoldItem).sort((a, b) => b.commissionHold.outstandingPaise - a.commissionHold.outstandingPaise);
+  const items = (page.resources ?? []).map(toHoldItem).sort((a, b) => b.commissionHold.outstandingPaise - a.commissionHold.outstandingPaise);
   return { items, ...(page.continuationToken ? { continuationToken: page.continuationToken } : {}) };
 }
 
@@ -606,7 +606,7 @@ export async function listAllTechniciansWithHold(): Promise<
   const items: Array<{ id: string; name?: string; commissionHold: CommissionHold }> = [];
   while (iterator.hasMoreResults()) {
     const page = await iterator.fetchNext();
-    items.push(...page.resources.map(toHoldItem));
+    items.push(...(page.resources ?? []).map(toHoldItem));
   }
   return items;
 }
@@ -630,7 +630,7 @@ export async function listTechniciansWithExpiredOverride(nowIso: string): Promis
   const ids: string[] = [];
   while (iterator.hasMoreResults()) {
     const page = await iterator.fetchNext();
-    ids.push(...page.resources.map((r) => r.id));
+    ids.push(...(page.resources ?? []).map((r) => r.id));
   }
   return ids;
 }
diff --git a/api/tests/cosmos/commission-receivable-repository.test.ts b/api/tests/cosmos/commission-receivable-repository.test.ts
index f8042c08..53800cc9 100644
--- a/api/tests/cosmos/commission-receivable-repository.test.ts
+++ b/api/tests/cosmos/commission-receivable-repository.test.ts
@@ -291,6 +291,41 @@ describe('sumDueGroupedByTechnician', () => {
     expect(result).toEqual([]);
     expect(mockFetchNext).not.toHaveBeenCalled();
   });
+
+  // Regression (prod, 2026-09-07): the mocks above model an idealised SDK. Real Cosmos returns
+  // `resources: undefined` on the pages of an aggregate GROUP BY query — `hasMoreResults()` stays
+  // true and `fetchNext()` yields a page with no `resources` array at all. Spreading that threw
+  // `TypeError: page.resources is not iterable`, taking down the admin commission dashboard and
+  // `sweepAllHolds({ scope: 'FULL' })` in production. Verified against the live prod container.
+  it('tolerates the undefined resources Cosmos returns on aggregate GROUP BY pages', async () => {
+    mockHasMoreResults
+      .mockReturnValueOnce(true)
+      .mockReturnValueOnce(true)
+      .mockReturnValueOnce(false);
+    mockFetchNext
+      .mockResolvedValueOnce({ resources: undefined })
+      .mockResolvedValueOnce({ resources: undefined });
+
+    const result = await commissionReceivableRepo.sumDueGroupedByTechnician();
+
+    expect(result).toEqual([]);
+    expect(mockFetchNext).toHaveBeenCalledTimes(2);
+  });
+
+  it('keeps rows from populated pages when an earlier page has undefined resources', async () => {
+    const rows = [{ technicianId: 'tech-1', outstandingPaise: 5000, dueCount: 2, oldestDueAt: '2026-05-01T00:00:00.000Z' }];
+    mockHasMoreResults
+      .mockReturnValueOnce(true)
+      .mockReturnValueOnce(true)
+      .mockReturnValueOnce(false);
+    mockFetchNext
+      .mockResolvedValueOnce({ resources: undefined })
+      .mockResolvedValueOnce({ resources: rows });
+
+    const result = await commissionReceivableRepo.sumDueGroupedByTechnician();
+
+    expect(result).toEqual(rows);
+  });
 });
 
 describe('getOpenCredits', () => {
diff --git a/api/tests/cosmos/technician-repository.test.ts b/api/tests/cosmos/technician-repository.test.ts
index 96bbb3d5..f6184cde 100644
--- a/api/tests/cosmos/technician-repository.test.ts
+++ b/api/tests/cosmos/technician-repository.test.ts
@@ -618,3 +618,48 @@ describe('patchPaymentProfile', () => {
     await expect(patchPaymentProfile('t1', { upiVpa: 'x@upi', upiUpdatedAt: 'x' })).rejects.toMatchObject({ code: 500 });
   });
 });
+
+describe('undefined page.resources (real Cosmos aggregate/empty-page behaviour)', () => {
+  // Regression (prod, 2026-09-07): Cosmos can hand back a page whose `resources` is undefined
+  // rather than an empty array. Every hold query below feeds the admin commission dashboard or
+  // the E21-S04 reconciler, so an unguarded `.map`/spread turns into a 500 on the owner's console.
+  const withPages = (pages: unknown[]) => {
+    const mockHasMoreResults = vi.fn();
+    pages.forEach(() => mockHasMoreResults.mockReturnValueOnce(true));
+    mockHasMoreResults.mockReturnValue(false);
+    const mockFetchNext = vi.fn();
+    pages.forEach((pg) => mockFetchNext.mockResolvedValueOnce(pg));
+    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext, hasMoreResults: mockHasMoreResults });
+    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
+      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
+    });
+    return { mockFetchNext };
+  };
+
+  it('listTechniciansWithHold returns no items when the page has undefined resources', async () => {
+    withPages([{ resources: undefined, continuationToken: undefined }]);
+
+    const result = await listTechniciansWithHold();
+
+    expect(result.items).toEqual([]);
+  });
+
+  it('listAllTechniciansWithHold skips undefined pages and keeps populated ones', async () => {
+    withPages([
+      { resources: undefined },
+      { resources: [{ id: 't1', displayName: 'A', commissionHold: { outstandingPaise: 100, dueCount: 1, state: 'WARN', evaluatedAt: 'x' } }] },
+    ]);
+
+    const result = await listAllTechniciansWithHold();
+
+    expect(result.map((r) => r.id)).toEqual(['t1']);
+  });
+
+  it('listTechniciansWithExpiredOverride skips undefined pages and keeps populated ones', async () => {
+    withPages([{ resources: undefined }, { resources: [{ id: 't2' }] }]);
+
+    const result = await listTechniciansWithExpiredOverride('2026-09-05T00:00:00.000Z');
+
+    expect(result).toEqual(['t2']);
+  });
+});
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff c25e50aa9e5d28562aad7f6151782018ecfa3bb9 -- docs/stories/E21-S02-interface-notes.md' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 479ms:
diff --git a/docs/stories/E21-S02-interface-notes.md b/docs/stories/E21-S02-interface-notes.md
new file mode 100644
index 00000000..94d02fa2
--- /dev/null
+++ b/docs/stories/E21-S02-interface-notes.md
@@ -0,0 +1,64 @@
+# E21-S02 — Commission ledger v2: interface notes and rulings
+
+Extracted from the E21-S02 SDD decision ledger
+(`wt-e21-s02/.superpowers/sdd/E21-S02-commission-ledger-v2/progress.md`, git-ignored) so that
+E21-S03, E21-S04 and E21-S05 have a durable, in-repo copy of the contracts they build against.
+
+Source of truth for the design itself: `docs/adr/0031-single-partition-commission-ledger.md`
+and `docs/runbook.md` → "Commission ledger v2 (E21-S02)". This file records the per-task
+interface surface and the decisions taken during review, which live nowhere else.
+
+Related: `docs/reviews/codex-e21-s02-20260906.summary.md`.
+
+---
+
+## Interface notes (what later stories call)
+
+- Task 4: interface note for later tasks — commissionReceivableRepo.readLedgerDoc<T>(technicianId, id) exists; ApplyCreditInput.anchor = { id, build(plan), matches?(existing) }; applyCredit throws code IDEMPOTENCY_MISMATCH (→ HTTP 409 in Task 10) and PRECONDITION (→ HTTP 409 LEDGER_BUSY)
+- Task 5: interface note — api/src/cosmos/retry-utils.ts exports definedOnly, isPreconditionFailure, MAX_ETAG_ATTEMPTS; systemDocsRepo.{getTechnicianClientConfig, patchTechnicianClientConfig, enqueueHoldRepair, drainHoldRepair}; service getCommissionConfig() (cached) vs repo getCommissionConfig() (raw); service test lives in tests/unit/commission-config.service.test.ts
+- Task 6: interface note — recomputeCommissionHold(id) → { hold, status }; computeCommissionHold(id) (reads only); sweepAllHolds({ dryRun?, log?, scope?: 'FULL'|'EXPIRED_OVERRIDES' }); repo: readCommissionHold, patchCommissionHold, listTechniciansWithHold (paged, dashboard), listAllTechniciansWithHold (drain), listTechniciansWithExpiredOverride(nowIso), patchPaymentProfile; commissionReceivableRepo.sumDueGroupedByTechnician() now drains and returns groups[] (no token). CARRY TO E21-S04: reconciler runs scope EXPIRED_OVERRIDES every 15 min.
+- Task 7: interface note — repo patchFcmToken(technicianId, token); private readModifyWrite helper is the only upsert path on technicians
+- Task 8: interface note — commission-settlement.service.ts: recordCommissionDue(booking) → { created, commissionDue, commissionBps, commissionResolvedFrom } | { created:false, skipped }; finalizeLedgerForTechnician(id) never throws; trigger handler exported as handleBookingCompletedBatch and rethrows settlement failures; BookingDocSchema has optional collectionMethod
+- Task 10: interface note — routes: POST /v1/admin/finance/commission-remittances; GET /v1/admin/finance/commission-receivables (+?continuationToken); POST …/commission-receivables/recompute; GET …/commission-receivables/{technicianId}; POST/DELETE /v1/admin/finance/commission-hold/{technicianId}/override; settle REMIT → 410. Error codes: IDEMPOTENCY_MISMATCH 409, LEDGER_BUSY 409, TECHNICIAN_NOT_FOUND 404. Audit actions used: COMMISSION_REMITTANCE_RECORDED, COMMISSION_HOLD_RECOMPUTE_REQUESTED, COMMISSION_HOLD_OVERRIDDEN, COMMISSION_HOLD_OVERRIDE_CLEARED, COMMISSION_WAIVED
+- Task 11: interface note — lib/ist-time.ts (IST_OFFSET_MS, istDateStr, istWeekStart); TechnicianCommissionDueV2Schema; buildCommissionDueResponse; GET /v1/config/technician (systemDocsRepo.getIncentiveConfig added; _resetTechnicianConfigCacheForTest)
+
+---
+
+## Corrections found after merge
+
+- **Ruling B was incomplete.** The `hasMoreResults()` drain loop it introduced for
+  `sumDueGroupedByTechnician` destructured `page.resources` unguarded. Real Cosmos returns
+  `resources: undefined` on the pages of an aggregate `GROUP BY` query, so the call threw
+  `TypeError: page.resources is not iterable` in production — breaking the admin commission
+  dashboard and `sweepAllHolds({ scope: 'FULL' })`. Fixed in `fix/cosmos-aggregate-page-resources`
+  along with five sibling sites. The unit tests missed it because they mocked the iterator as
+  always returning an array.
+
+---
+
+## Rulings taken during review
+
+- Rulings: none required pre-flight.
+- Ruling: mismatch check — the allocator is generic (anchor may be a remittance now, an award in E23); on CONFLICT read the existing anchor and compare `amountPaise` when present, else defer to an optional `anchor.matches(existing)` predicate; mismatch → throw code IDEMPOTENCY_MISMATCH (HTTP 409 at the handler in Task 10). Cost if wrong: an over-strict check refuses a legitimate replay — visible, not money-losing.
+- Ruling: default replay validation is fail-closed — without an `anchor.matches` predicate, `existing.amountPaise` must be a number equal to `input.paise`, else IDEMPOTENCY_MISMATCH. Supersedes the earlier "when present" ruling. E23 award anchors must pass `matches`. Cost if wrong: an anchor type without amountPaise and without a predicate is refused loudly — never money-losing.
+- Ruling: GET uses the raw repo read (brief text; admin screen needs read-your-write; cache exists for the settlement hot path). Shared helpers → api/src/cosmos/retry-utils.ts. Cost if wrong: none material.
+- Ruling A: STALE is retried ×2 with fresh reads inside recomputeCommissionHold; recompute returns { hold, status }. Cost if wrong: two extra cheap reads.
+- Ruling B: sumDueGroupedByTechnician drains the iterator fully (hasMoreResults loop) and returns groups[] — aggregate rows are one per technician, bounded; the continuation-token parameter is removed (Task 3 signature superseded). Cost if wrong: RU spike on a very large fleet — not the pilot.
+- Ruling C: keep paged listTechniciansWithHold for the admin dashboard (Task 10) but add listAllTechniciansWithHold() (full drain) for the sweep; add listTechniciansWithExpiredOverride(nowIso) so E21-S04's 15-min reconciler can recompute lapsed overrides; sweepAllHolds gains scope 'FULL' | 'EXPIRED_OVERRIDES'. Carry to E21-S04 dispatch: reconciler must call the EXPIRED_OVERRIDES scope every run. Cost if wrong: a lapsed override stays CLEAR ≤15 min once E21-S04 ships.
+- Ruling: settlement failures inside settleBooking (anything after the parse/skip guards, before or during createDueEntry) are rethrown from the change-feed handler after Sentry capture so the lease is not checkpointed and Azure retries; finalize failures stay swallowed (self-healing via reconciler). Cost if wrong: a poison booking doc stalls that lease partition until fixed — loud in Sentry — versus silently lost commission. Chosen: loud.
+- Ruling: idempotency fingerprint = { technicianId, amountPaise, method, ref } compared on BOTH the fast-path replay and anchor.matches; mismatch → 409 IDEMPOTENCY_MISMATCH; idempotencyKey documented as per-technician scoped (client sends a UUID). Cost if wrong: an over-strict compare refuses a legitimate replay — loud, not money-losing.
+- Ruling: technician existence (readCommissionHold(...).exists) checked before applyCredit; absent → 404, no writes, no audit.
+- Ruling: override requires APPLIED; STALE retried ×3 with fresh reads then 409 LEDGER_BUSY; MISSING → 404; no audit unless applied.
+- Ruling: also type the `action` param of the three direct appendAuditEntry wrappers (trigger-booking-completed systemAuditEntry, trigger-reconcile-payouts systemAuditEntry, catalogueAudit.service catalogueAuditEntry) as AuditAction so the enum is closed for real; static test keeps the implementer's broader field set AND adds the brief's `+\s*1\b.*remittedAmount` alternative. Cost if wrong: none material.
+- Ruling: fix wave also takes two residual-risk hardenings — runLedgerBatch catches thrown SDK errors and maps code/message 409→CONFLICT, 412→PRECONDITION (else rethrow); remittance handler calls consumePendingCredits when creditCreatedPaise>0. Cost if wrong: none material.
+- Ruling: staleAfter = evaluatedAt + 6h (the full-sweep cadence) as an ISO string per row; ordering fixed by paging in memory over the drained hold list (one query). Carry to E21-S04 as already ruled: hold-reconciliation-summary must carry top-N ordering.
+- Ruling: side effects belong to whoever creates the row — move audit + incrementCompletedJobCount + sendTechEarningsUpdate into the settlement service (new settleCashCompletion(booking) wrapping recordCommissionDue); both callers use it; recordCommissionDue skips RAZORPAY with skipped:'NOT_CASH'. Cost if wrong: none material (idempotent on created:true).
+- Ruling: both fixed now (money-display accuracy on the owner's console), no third Codex round per the one-round rule. Marker records the SHA Codex reviewed (6d018dfd) with the follow-up noted.
+
+---
+
+## Parked items and carry-forwards
+
+- Task 10: parked — dashboard drains all holds + DUE aggregate per request (Codex P2) — Ruling: acceptable at pilot scale (≤ hundreds of technicians); CARRY TO E21-S04: reconciler writes system/hold-reconciliation-summary { unreconciledTechnicianCount, computedAt } each run and the dashboard reads it instead of draining. Cost if wrong: RU/latency growth on the admin dashboard as the fleet grows — visible, not money-losing.
+- Task 6 (see interface notes above): CARRY TO E21-S04 — the reconciler must run `sweepAllHolds({ scope: 'EXPIRED_OVERRIDES' })` every 15 min.
+- Task 12: parked — report arithmetic (says 68, actual AuditAction members = 63) — Ruling: scratch-report inaccuracy, code verified correct by the re-reviewer; not worth a round. Cost if wrong: none.
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/cosmos/commission-receivable-repository.ts | Select-Object -First 360' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 512ms:
import type { OperationInput } from '@azure/cosmos';
import { getCommissionReceivablesContainer } from './client.js';
import {
  outstandingOf,
  type CommissionReceivableEntry,
  type CommissionReceivableCreateInput,
} from '../schemas/commission-receivable.js';
import type { RemittanceDoc, CreditDoc } from '../schemas/commission-ledger.js';
import { mergeAllocation, type OutstandingRow } from '../services/commission-allocator.service.js';

const RECEIVABLE_FILTER = `(NOT IS_DEFINED(c.docType) OR c.docType = 'RECEIVABLE')`;

export type LedgerBatchResult = { ok: true } | { ok: false; reason: 'CONFLICT' | 'PRECONDITION' };

export const commissionReceivableRepo = {
  async getByBookingId(
    bookingId: string,
    technicianId: string,
  ): Promise<CommissionReceivableEntry | null> {
    const { resource } = await getCommissionReceivablesContainer()
      .item(bookingId, technicianId)
      .read<CommissionReceivableEntry>();
    return resource ?? null;
  },

  async createDueEntry(input: CommissionReceivableCreateInput): Promise<boolean> {
    try {
      await getCommissionReceivablesContainer().items.create<CommissionReceivableEntry>({
        id: input.bookingId,
        bookingId: input.bookingId,
        technicianId: input.technicianId,
        partitionKey: input.technicianId,
        serviceId: input.serviceId,
        categoryId: input.categoryId,
        bookingAmount: input.bookingAmount,
        commissionBps: input.commissionBps,
        commissionDue: input.commissionDue,
        commissionResolvedFrom: input.commissionResolvedFrom,
        remittanceStatus: 'DUE',
        createdAt: new Date().toISOString(),
        ...(input.cashCollectedAmount !== undefined
          ? { cashCollectedAmount: input.cashCollectedAmount }
          : {}),
        ...(input.serviceName !== undefined ? { serviceName: input.serviceName } : {}),
        ...(input.slotDate !== undefined ? { slotDate: input.slotDate } : {}),
        ...(input.collectionMethod !== undefined
          ? { collectionMethod: input.collectionMethod }
          : {}),
      });
      return true;
    } catch (err: unknown) {
      // 409 Conflict = concurrent invocation already created this entry
      if ((err as { code?: number }).code === 409) return false;
      throw err;
    }
  },

  /**
   * Batch primitive: every money-moving write on this container goes through this
   * single-partition `items.batch()` call. A failed batch does NOT throw â€” the failing
   * op carries 409/412 and the others 424; batch-level errors (400/429) DO throw.
   */
  async runLedgerBatch(technicianId: string, ops: OperationInput[]): Promise<LedgerBatchResult> {
    let res: { result?: ReadonlyArray<{ statusCode: number }> };
    try {
      res = await getCommissionReceivablesContainer().items.batch(ops, technicianId);
    } catch (err: unknown) {
      // Defensive mapping: the SDK is documented to resolve `items.batch()` with a per-op status
      // array on a partial failure (the path handled below), but some SDK versions/transports
      // throw instead â€” a bare `code` (Cosmos-style) or a message embedding the HTTP status. Map
      // those the same way as the resolve-path 409/412 so a thrown conflict/precondition still
      // becomes a retryable result instead of an unhandled rejection; anything else rethrows.
      const code = (err as { code?: number }).code;
      const message = err instanceof Error ? err.message : String(err);
      if (code === 409 || /\b409\b|Conflict/i.test(message)) return { ok: false, reason: 'CONFLICT' };
      if (code === 412 || /\b412\b|Precondition/i.test(message)) return { ok: false, reason: 'PRECONDITION' };
      throw err;
    }
    const codes = (res.result ?? []).map((r) => r.statusCode);
    if (codes.every((c) => c >= 200 && c < 300)) return { ok: true };
    if (codes.includes(409)) return { ok: false, reason: 'CONFLICT' };
    if (codes.includes(412)) return { ok: false, reason: 'PRECONDITION' };
    throw new Error(`ledger batch failed: [${codes.join(',')}]`);
  },

  async getOutstandingByTechnician(technicianId: string): Promise<OutstandingRow[]> {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<CommissionReceivableEntry & { _etag: string }>(
        { query: `SELECT * FROM c WHERE ${RECEIVABLE_FILTER} AND c.remittanceStatus = 'DUE'` },
        { partitionKey: technicianId },
      )
      .fetchAll();
    return resources.map(({ _etag, ...entry }) => ({
      entry,
      etag: _etag,
      outstandingPaise: outstandingOf(entry),
    }));
  },

  /**
   * P0-1: every RECEIVABLE for a technician, regardless of remittance status.
   * Single-partition (pk = /technicianId), so this is cheap and safe to call per
   * request. Earnings need ALL of them, not just DUE: a job whose commission was
   * later remitted or waived was still a job the technician did and got paid for.
   */
  async getAllByTechnician(technicianId: string): Promise<CommissionReceivableEntry[]> {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<CommissionReceivableEntry>(
        { query: `SELECT * FROM c WHERE ${RECEIVABLE_FILTER}` },
        { partitionKey: technicianId },
      )
      .fetchAll();
    return resources;
  },

  async listLedger(technicianId: string): Promise<{
    receivables: CommissionReceivableEntry[];
    remittances: RemittanceDoc[];
    credits: CreditDoc[];
  }> {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<Record<string, unknown>>(
        { query: 'SELECT * FROM c' },
        { partitionKey: technicianId },
      )
      .fetchAll();
    const receivables: CommissionReceivableEntry[] = [];
    const remittances: RemittanceDoc[] = [];
    const credits: CreditDoc[] = [];
    for (const d of resources) {
      const t = (d['docType'] as string | undefined) ?? 'RECEIVABLE';
      if (t === 'RECEIVABLE') receivables.push(d as unknown as CommissionReceivableEntry);
      else if (t === 'REMITTANCE') remittances.push(d as unknown as RemittanceDoc);
      else if (t === 'CREDIT') credits.push(d as unknown as CreditDoc);
    }
    return { receivables, remittances, credits };
  },

  async getRemittance(technicianId: string, id: string): Promise<RemittanceDoc | null> {
    const { resource } = await getCommissionReceivablesContainer()
      .item(id, technicianId)
      .read<RemittanceDoc>();
    return resource ?? null;
  },

  /**
   * Point read of any doc in this container (anchor, credit, receivable, ...) by id, scoped to
   * the technician partition. Used to validate a replayed anchor: a 409 on `runLedgerBatch`'s
   * Create op tells us *something* collided, not *what* â€” this confirms it was the anchor itself
   * (vs., e.g., the credit doc racing) before trusting the replay as idempotent.
   */
  async readLedgerDoc<T = Record<string, unknown>>(
    technicianId: string,
    id: string,
  ): Promise<T | null> {
    // Not passed as .read<T>()'s type param: T here is a caller-side cast (e.g. Record<string,
    // unknown>), not necessarily an ItemDefinition, so we take the SDK's untyped default instead.
    const { resource } = (await getCommissionReceivablesContainer().item(id, technicianId).read()) as { resource?: unknown };
    return (resource as T | undefined) ?? null;
  },

  async getOpenCredits(technicianId: string): Promise<Array<{ doc: CreditDoc; etag: string }>> {
    const { resources } = await getCommissionReceivablesContainer()
      .items.query<CreditDoc & { _etag: string }>(
        { query: `SELECT * FROM c WHERE c.docType = 'CREDIT' AND c.remainingPaise > 0` },
        { partitionKey: technicianId },
      )
      .fetchAll();
    return resources.map(({ _etag, ...doc }) => ({ doc, etag: _etag }));
  },

  async markWaived(
    bookingId: string,
    technicianId: string,
    opts: { waivedReason: string; markedByAdminId: string },
  ): Promise<{ entry: CommissionReceivableEntry; wasApplied: boolean } | null> {
    const { resource, etag } = await getCommissionReceivablesContainer()
      .item(bookingId, technicianId)
      .read<CommissionReceivableEntry>();
    if (!resource) return null;
    if (resource.remittanceStatus !== 'DUE') return { entry: resource, wasApplied: false };
    const now = new Date().toISOString();
    const entry = mergeAllocation(
      { ...resource, waivedReason: opts.waivedReason },
      {
        id: `waive:${bookingId}`,
        source: 'WAIVER',
        refId: opts.waivedReason,
        paise: outstandingOf(resource) || 1,
        appliedAt: now,
        byId: opts.markedByAdminId,
      },
    );
    const r = await this.runLedgerBatch(technicianId, [
      { operationType: 'Replace', id: bookingId, ifMatch: etag ?? '', resourceBody: entry as never },
    ]);
    if (!r.ok) throw Object.assign(new Error(r.reason), { code: r.reason });
    return { entry, wasApplied: true };
  },

  /**
   * Cosmos cannot page a cross-partition GROUP BY aggregate with continuation tokens the way a
   * plain SELECT can (the aggregate is recomputed per page, not carried across pages), so this
   * drains the iterator fully via `hasMoreResults()` rather than exposing a `continuationToken`
   * to the caller. Safe at pilot scale (bounded number of technicians); revisit if the technician
   * roster grows large enough that a full drain becomes expensive.
   */
  async sumDueGroupedByTechnician(): Promise<
    Array<{
      technicianId: string;
      outstandingPaise: number;
      dueCount: number;
      oldestDueAt: string;
    }>
  > {
    const iterator = getCommissionReceivablesContainer().items.query<{
      technicianId: string;
      outstandingPaise: number;
      dueCount: number;
      oldestDueAt: string;
    }>(
      {
        query: `SELECT c.technicianId, SUM(c.commissionDue - (IS_DEFINED(c.remittedAmount) ? c.remittedAmount : 0)) AS outstandingPaise, COUNT(1) AS dueCount, MIN(c.createdAt) AS oldestDueAt FROM c WHERE ${RECEIVABLE_FILTER} AND c.remittanceStatus = 'DUE' GROUP BY c.technicianId`,
      },
      { maxItemCount: 100 },
    );
    const groups: Array<{
      technicianId: string;
      outstandingPaise: number;
      dueCount: number;
      oldestDueAt: string;
    }> = [];
    // `page.resources` is undefined â€” not [] â€” on the pages of an aggregate GROUP BY query,
    // while hasMoreResults() stays true. Spreading it unguarded threw
    // "TypeError: page.resources is not iterable" against the real container, which took out
    // the admin commission dashboard and sweepAllHolds({ scope: 'FULL' }). Guard every page.
    while (iterator.hasMoreResults()) {
      const page = await iterator.fetchNext();
      groups.push(...(page.resources ?? []));
    }
    return groups;
  },
};

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/package.json' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 484ms:
{
  "name": "homeservices-api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.15.4",
  "main": "dist/functions/**/*.js",
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "dev": "pnpm build && func start",
    "dev:direct": "pnpm build && func start",
    "dev:watch": "tsc --watch",
    "build": "tsc",
    "start": "func start",
    "typecheck": "tsc --noEmit -p tsconfig.tests.json",
    "lint": "eslint . --max-warnings 0",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "openapi:build": "tsx src/openapi/build.ts",
    "openapi:lint": "spectral lint openapi.json --fail-severity error",
    "seed:admin": "tsx scripts/seed-admin.ts",
    "invite:admin": "tsx scripts/invite-admin.ts",
    "seed:technicians": "npx tsx scripts/seed-technicians.ts",
    "seed:catalogue": "tsx src/cosmos/seeds/catalogue.ts",
    "seed:complaints": "tsx src/cosmos/seeds/complaints.ts",
    "provision:indexes": "tsx scripts/provision-cosmos-indexes.ts",
    "semgrep:scan": "semgrep --config .semgrep.yml src/",
    "backfill:pan-mask": "tsx scripts/backfill-pan-mask.ts"
  },
  "dependencies": {
    "@azure/ai-form-recognizer": "^5.1.0",
    "@azure/communication-email": "^1.1.0",
    "@azure/cosmos": "^4.9.2",
    "@azure/functions": "^4.5.0",
    "@azure/monitor-opentelemetry-exporter": "1.0.0-beta.32",
    "@growthbook/growthbook": "^1",
    "@opentelemetry/resources": "^1",
    "@opentelemetry/sdk-node": "^0.57",
    "@sentry/node": "^8",
    "@turf/boolean-point-in-polygon": "^7.3.5",
    "@turf/helpers": "^7.3.5",
    "fastify": "^5",
    "firebase-admin": "^13.8.0",
    "jose": "^6.2.2",
    "otplib": "^13.4.0",
    "pdfkit": "^0.18.0",
    "posthog-node": "^4",
    "qrcode": "^1.5.4",
    "razorpay": "^2.9.6",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@apidevtools/swagger-parser": "^10.1.0",
    "@asteasolutions/zod-to-openapi": "^7.3.0",
    "@stoplight/spectral-cli": "^6.11.0",
    "@types/geojson": "^7946.0.16",
    "@types/node": "^22",
    "@types/pdfkit": "^0.17.6",
    "@types/qrcode": "^1.5.6",
    "@vitest/coverage-v8": "^2",
    "eslint": "^9",
    "eslint-plugin-import": "^2",
    "prettier": "^3",
    "supertest": "^7",
    "testcontainers": "^10",
    "tsx": "^4",
    "typescript": "^5.6.0",
    "typescript-eslint": "^8",
    "vitest": "^2"
  }
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/cosmos/audit-log-repository.ts; Get-Content api/src/cosmos/erasure-request-repository.ts; Get-Content api/src/cosmos/technician-repository.ts | Select-Object -Skip 540 -First 120' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 549ms:
import { getCosmosClient, DB_NAME } from './client.js';
import { AuditLogEntrySchema } from '../schemas/audit-log.js';
import type { AuditLogDoc, AuditLogEntry, AuditLogQuery } from '../schemas/audit-log.js';
import type { SqlParameter } from '@azure/cosmos';

const CONTAINER = 'audit_log';

export async function appendAuditEntry(entry: AuditLogDoc): Promise<void> {
  await getCosmosClient().database(DB_NAME).container(CONTAINER).items.create(entry);
}

// SEMGREP-JUSTIFIED: cross-partition fan-out; caller MUST enforce requireAdmin(['super-admin'])
// middleware. Called only from adminAuditLogListHandler which gates on requireAdmin(['super-admin']).
export async function queryAuditLog(
  params: AuditLogQuery,
): Promise<{ entries: AuditLogEntry[]; continuationToken?: string }> {
  const conditions: string[] = [];
  const parameters: SqlParameter[] = [];

  if (params.adminId !== undefined) {
    conditions.push('c.adminId = @adminId');
    parameters.push({ name: '@adminId', value: params.adminId });
  }
  if (params.action !== undefined) {
    conditions.push('c.action = @action');
    parameters.push({ name: '@action', value: params.action });
  }
  if (params.resourceType !== undefined) {
    conditions.push('c.resourceType = @resourceType');
    parameters.push({ name: '@resourceType', value: params.resourceType });
  }
  if (params.resourceId !== undefined) {
    conditions.push('c.resourceId = @resourceId');
    parameters.push({ name: '@resourceId', value: params.resourceId });
  }
  if (params.dateFrom !== undefined) {
    conditions.push('c.timestamp >= @dateFrom');
    parameters.push({ name: '@dateFrom', value: params.dateFrom });
  }
  if (params.dateTo !== undefined) {
    conditions.push('c.timestamp <= @dateTo');
    parameters.push({ name: '@dateTo', value: params.dateTo });
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `SELECT c.id, c.adminId, c.role, c.action, c.resourceType, c.resourceId, c.payload, c.ip, c.userAgent, c.timestamp FROM c ${where} ORDER BY c.timestamp DESC`;

  const iterator = getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .items.query<Record<string, unknown>>(
      { query, parameters },
      {
        maxItemCount: params.pageSize,
        ...(params.continuationToken !== undefined && {
          continuationToken: params.continuationToken,
        }),
      },
    );

  const page = await iterator.fetchNext();
  const entries = (page.resources ?? []).map((r) => AuditLogEntrySchema.parse(r));
  const result: { entries: AuditLogEntry[]; continuationToken?: string } = { entries };
  if (page.continuationToken !== undefined) {
    result.continuationToken = page.continuationToken;
  }
  return result;
}
import { getCosmosClient, DB_NAME } from './client.js';
import { ErasureRequestDocSchema } from '../schemas/erasure-request.js';
import type { ErasureRequestDoc } from '../schemas/erasure-request.js';
import type { SqlQuerySpec, SqlParameter } from '@azure/cosmos';

const CONTAINER = 'erasure_requests';

function container() {
  return getCosmosClient().database(DB_NAME).container(CONTAINER);
}

export class DuplicatePendingError extends Error {
  constructor() { super('ERASURE_REQUEST_PENDING'); }
}

function isCosmosConflict(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'statusCode' in err &&
    (err as { statusCode: number }).statusCode === 409
  );
}

/**
 * Creates an erasure request. The caller MUST set doc.id = "pending:{userId}"
 * so Cosmos enforces one-at-a-time atomically. Throws DuplicatePendingError
 * on 409 Conflict (concurrent submit or active document already exists).
 */
export async function createErasureRequest(doc: ErasureRequestDoc): Promise<void> {
  try {
    await container().items.create(doc);
  } catch (err) {
    if (isCosmosConflict(err)) throw new DuplicatePendingError();
    throw err;
  }
}

export async function getErasureRequestById(
  id: string,
): Promise<{ doc: ErasureRequestDoc; etag: string } | null> {
  const response = await container().item(id, id).read<Record<string, unknown>>();
  if (response.resource === undefined) return null;
  return {
    doc: ErasureRequestDocSchema.parse(response.resource),
    etag: response.etag ?? '',
  };
}

/**
 * Returns the user's active erasure document (any status) with its etag.
 * Uses the deterministic "pending:{userId}" id for a single-partition point read.
 */
export async function getActiveErasureRequestForUser(
  userId: string,
): Promise<{ doc: ErasureRequestDoc; etag: string } | null> {
  return getErasureRequestById(`pending:${userId}`);
}

/** @deprecated use getActiveErasureRequestForUser */
export async function getPendingErasureRequestForUser(
  userId: string,
): Promise<ErasureRequestDoc | null> {
  const result = await getActiveErasureRequestForUser(userId);
  return result !== null && result.doc.status === 'PENDING' ? result.doc : null;
}

/** Used by cron timer: PENDING with scheduledDeletionAt <= now. */
export async function listOverduePendingErasureRequests(
  nowIso: string,
): Promise<ErasureRequestDoc[]> {
  const query: SqlQuerySpec = {
    query:
      'SELECT * FROM c WHERE c.status = @pending AND c.scheduledDeletionAt <= @now',
    parameters: [
      { name: '@pending', value: 'PENDING' },
      { name: '@now', value: nowIso },
    ],
  };
  const { resources } = await container().items
    .query<Record<string, unknown>>(query)
    .fetchAll();
  return resources.map((r) => ErasureRequestDocSchema.parse(r));
}

/** Replace with optimistic concurrency. Caller passes etag from getErasureRequestById. */
export async function replaceErasureRequest(
  doc: ErasureRequestDoc,
  etag?: string,
): Promise<void> {
  const options = etag
    ? { accessCondition: { type: 'IfMatch' as const, condition: etag } }
    : {};
  await container().item(doc.id, doc.id).replace(doc, options);
}

export interface ErasureRequestListFilter {
  status?: ErasureRequestDoc['status'];
  pageSize?: number;
}

export async function listErasureRequests(
  filter: ErasureRequestListFilter = {},
): Promise<ErasureRequestDoc[]> {
  const conditions: string[] = [];
  const parameters: SqlParameter[] = [];
  if (filter.status !== undefined) {
    conditions.push('c.status = @status');
    parameters.push({ name: '@status', value: filter.status });
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query: SqlQuerySpec = {
    query: `SELECT * FROM c ${where} ORDER BY c.requestedAt DESC`,
    parameters,
  };
  const pageSize = filter.pageSize ?? 50;
  const iterator = container().items.query<Record<string, unknown>>(query, {
    maxItemCount: pageSize,
  });
  const page = await iterator.fetchNext();
  return (page.resources ?? []).map((r) => ErasureRequestDocSchema.parse(r));
}
    'FROM c WHERE NOT IS_DEFINED(c.commissionHold) OR NOT IS_DEFINED(c.commissionHold.evaluatedAt) OR c.commissionHold.evaluatedAt < "' +
    readStartedAt +
    '"';
  try {
    await container.item(technicianId, technicianId).patch({
      operations: [{ op: 'set', path: '/commissionHold', value: hold }],
      condition,
    });
    return 'APPLIED';
  } catch (err: unknown) {
    const code = (err as { code?: number }).code;
    if (code === 412) return 'STALE';
    if (code === 404) return 'MISSING';
    throw err;
  }
}

const LIST_WITH_HOLD_QUERY = 'SELECT c.id, c.displayName, c.name, c.commissionHold FROM c WHERE IS_DEFINED(c.commissionHold)';

interface TechnicianWithHoldRow {
  id: string;
  displayName?: string;
  name?: string;
  commissionHold: CommissionHold;
}

function toHoldItem(r: TechnicianWithHoldRow): { id: string; name?: string; commissionHold: CommissionHold } {
  return {
    id: r.id,
    ...(r.displayName ?? r.name ? { name: (r.displayName ?? r.name) as string } : {}),
    commissionHold: r.commissionHold,
  };
}

/**
 * Pages through every technician doc that currently carries a commissionHold, one page at a
 * time. Used by the admin dashboard (Task 10), which needs a stable page size rather than the
 * whole roster at once. Sorted by outstandingPaise desc within the page only â€” no composite
 * index required; ordering across pages is not guaranteed.
 */
export async function listTechniciansWithHold(continuationToken?: string): Promise<{
  items: Array<{ id: string; name?: string; commissionHold: CommissionHold }>;
  continuationToken?: string;
}> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const iterator = container.items.query<TechnicianWithHoldRow>(
    { query: LIST_WITH_HOLD_QUERY },
    { maxItemCount: 50, ...(continuationToken ? { continuationToken } : {}) },
  );
  const page = await iterator.fetchNext();
  const items = (page.resources ?? []).map(toHoldItem).sort((a, b) => b.commissionHold.outstandingPaise - a.commissionHold.outstandingPaise);
  return { items, ...(page.continuationToken ? { continuationToken: page.continuationToken } : {}) };
}

/**
 * Drains every technician doc that currently carries a commissionHold in one call. Used by
 * `sweepAllHolds`, which needs the full set (unioned with the DUE-side aggregate) rather than a
 * single page â€” a technician whose balance just dropped to zero must still be found here so it
 * can be recomputed down to CLEAR/0.
 */
export async function listAllTechniciansWithHold(): Promise<
  Array<{ id: string; name?: string; commissionHold: CommissionHold }>
> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const iterator = container.items.query<TechnicianWithHoldRow>({ query: LIST_WITH_HOLD_QUERY }, { maxItemCount: 50 });
  const items: Array<{ id: string; name?: string; commissionHold: CommissionHold }> = [];
  while (iterator.hasMoreResults()) {
    const page = await iterator.fetchNext();
    items.push(...(page.resources ?? []).map(toHoldItem));
  }
  return items;
}

/**
 * Ids of technicians whose commissionHold.override has expired as of `nowIso` (inclusive: `<=`
 * matches an override that expires at exactly `nowIso`). Drives the E21-S04 reconciler's
 * EXPIRED_OVERRIDES sweep scope â€” an expired override otherwise sits inert until *something else*
 * touches that technician's receivables and triggers a recompute, silently under-enforcing a hold
 * that should have resumed.
 */
export async function listTechniciansWithExpiredOverride(nowIso: string): Promise<string[]> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const iterator = container.items.query<{ id: string }>(
    {
      query: 'SELECT c.id FROM c WHERE IS_DEFINED(c.commissionHold.override) AND c.commissionHold.override.until <= @now',
      parameters: [{ name: '@now', value: nowIso }],
    },
    { maxItemCount: 100 },
  );
  const ids: string[] = [];
  while (iterator.hasMoreResults()) {
    const page = await iterator.fetchNext();
    ids.push(...(page.resources ?? []).map((r) => r.id));
  }
  return ids;
}

/** Writes /paymentProfile via PATCH. Throws TECHNICIAN_NOT_FOUND (code) when the doc is absent. */
export async function patchPaymentProfile(technicianId: string, profile: PaymentProfile): Promise<void> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  try {
    await container.item(technicianId, technicianId).patch({
      operations: [{ op: 'set', path: '/paymentProfile', value: profile }],
    });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 404) {
      throw Object.assign(new Error('TECHNICIAN_NOT_FOUND'), { code: 'TECHNICIAN_NOT_FOUND' });
    }
    throw err;
  }
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --name-only c25e50aa9e5d28562aad7f6151782018ecfa3bb9' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 498ms:
api/src/cosmos/audit-log-repository.ts
api/src/cosmos/commission-receivable-repository.ts
api/src/cosmos/erasure-request-repository.ts
api/src/cosmos/technician-repository.ts
api/tests/cosmos/commission-receivable-repository.test.ts
api/tests/cosmos/technician-repository.test.ts
docs/stories/E21-S02-interface-notes.md
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/tests/cosmos/technician-repository.test.ts | Select-Object -First 700' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 566ms:
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import { getCosmosClient } from '../../src/cosmos/client.js';
import {
  getKycByTechnicianId,
  getTechnicianServiceProfile,
  listAllTechniciansWithHold,
  listTechniciansWithExpiredOverride,
  listTechniciansWithHold,
  patchCommissionHold,
  patchFcmToken,
  patchPaymentProfile,
  patchTechnicianAdminFields,
  patchTechnicianAvailability,
  patchTechnicianServiceProfile,
  readCommissionHold,
  upsertKycStatus,
} from '../../src/cosmos/technician-repository.js';
import type { CommissionHold, PaymentProfile } from '../../src/schemas/technician.js';

describe('upsertKycStatus', () => {
  it('replaces with merged kyc fields using the read ETag', async () => {
    const mockReplace = vi.fn().mockResolvedValue({});
    const mockRead = vi.fn().mockResolvedValue({ resource: { id: 'tech_1' }, etag: '"3"' });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: mockRead, replace: mockReplace }),
        items: { create: vi.fn() },
      }) }),
    });

    await upsertKycStatus('tech_1', { kycStatus: 'AADHAAR_DONE', aadhaarVerified: true, aadhaarMaskedNumber: 'XXXX-XXXX-1234' });
    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        kyc: expect.objectContaining({ kycStatus: 'AADHAAR_DONE', aadhaarVerified: true }),
      }),
      { accessCondition: { type: 'IfMatch', condition: '"3"' } },
    );
  });

  it('creates new document via items.create when technician does not exist', async () => {
    const mockCreate = vi.fn().mockResolvedValue({});
    const mockRead = vi.fn().mockResolvedValue({ resource: undefined, etag: undefined });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: mockRead, replace: vi.fn() }),
        items: { create: mockCreate },
      }) }),
    });

    await upsertKycStatus('tech_new', { kycStatus: 'PENDING' });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      id: 'tech_new',
      kyc: expect.objectContaining({ kycStatus: 'PENDING' }),
    }));
  });

  it('[E19-S01] writes panMaskedNumber + panHash when provided, zeroes raw panNumber', async () => {
    const mockReplace = vi.fn().mockResolvedValue({});
    const mockRead = vi.fn().mockResolvedValue({ resource: { id: 'tech_1' }, etag: '"3"' });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: mockRead, replace: mockReplace }),
        items: { create: vi.fn() },
      }) }),
    });

    const fakeHash = 'a'.repeat(64);
    await upsertKycStatus('tech_1', {
      kycStatus: 'PAN_DONE',
      panMaskedNumber: 'XXXXX1234F',
      panHash: fakeHash,
      panNumber: null,
    });

    const call = mockReplace.mock.calls[0];
    const kyc = (call?.[0] as Record<string, unknown>)['kyc'] as Record<string, unknown>;
    expect(kyc['panMaskedNumber']).toBe('XXXXX1234F');
    expect(kyc['panHash']).toBe(fakeHash);
    expect(kyc['panNumber']).toBeNull();
  });

  it('[E19-S01] initializes panMaskedNumber and panHash to null for new docs', async () => {
    const mockCreate = vi.fn().mockResolvedValue({});
    const mockRead = vi.fn().mockResolvedValue({ resource: undefined, etag: undefined });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: mockRead, replace: vi.fn() }),
        items: { create: mockCreate },
      }) }),
    });

    await upsertKycStatus('tech_fresh', { kycStatus: 'PENDING' });

    const call = mockCreate.mock.calls[0];
    const kyc = (call?.[0] as Record<string, unknown>)['kyc'] as Record<string, unknown>;
    expect(kyc['panMaskedNumber']).toBeNull();
    expect(kyc['panHash']).toBeNull();
  });
});

describe('getKycByTechnicianId', () => {
  it('returns kyc subdocument when present', async () => {
    const mockKyc = { aadhaarVerified: true, aadhaarMaskedNumber: 'XXXX-XXXX-1234', panNumber: null, panImagePath: null, kycStatus: 'AADHAAR_DONE', updatedAt: '2026-01-01T00:00:00.000Z' };
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: vi.fn().mockResolvedValue({ resource: { id: 'tech_1', kyc: mockKyc } }) }),
      }) }),
    });
    const result = await getKycByTechnicianId('tech_1');
    expect(result?.kycStatus).toBe('AADHAAR_DONE');
  });

  it('returns null when technician has no kyc', async () => {
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: vi.fn().mockResolvedValue({ resource: { id: 'tech_1' } }) }),
      }) }),
    });
    const result = await getKycByTechnicianId('tech_1');
    expect(result).toBeNull();
  });

  it('returns null when technician document does not exist', async () => {
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: vi.fn().mockResolvedValue({ resource: undefined }) }),
      }) }),
    });
    const result = await getKycByTechnicianId('tech_missing');
    expect(result).toBeNull();
  });
});

describe('technician service profile helpers', () => {
  it('returns empty skills and null location when document is missing', async () => {
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: vi.fn().mockRejectedValue({ code: 404 }) }),
      }) }),
    });

    const result = await getTechnicianServiceProfile('tech_missing');

    expect(result).toEqual({ skills: [], location: null });
  });

  it('maps GeoJSON coordinates to lat/lng on read', async () => {
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({
          read: vi.fn().mockResolvedValue({
            resource: {
              id: 'tech_1',
              skills: ['svc-plumbing'],
              location: { type: 'Point', coordinates: [77.5946, 12.9716] },
            },
          }),
        }),
      }) }),
    });

    const result = await getTechnicianServiceProfile('tech_1');

    expect(result).toEqual({
      skills: ['svc-plumbing'],
      location: { lat: 12.9716, lng: 77.5946 },
    });
  });

  it('patches skills and location while initializing non-dispatchable defaults', async () => {
    const mockCreate = vi.fn().mockResolvedValue({});
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: vi.fn().mockResolvedValue({ resource: undefined, etag: undefined }), replace: vi.fn() }),
        items: { create: mockCreate },
      }) }),
    });

    const result = await patchTechnicianServiceProfile('tech_new', {
      skills: ['svc-plumbing'],
      location: { lat: 12.9716, lng: 77.5946 },
    });

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      id: 'tech_new',
      technicianId: 'tech_new',
      skills: ['svc-plumbing'],
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      availabilityWindows: [],
      isOnline: false,
      isAvailable: false,
      kycStatus: 'PENDING',
    }));
    expect(result).toEqual({
      skills: ['svc-plumbing'],
      location: { lat: 12.9716, lng: 77.5946 },
    });
  });

  it('preserves existing dispatch and KYC fields when patching skills only', async () => {
    const mockReplace = vi.fn().mockResolvedValue({});
    const existing = {
      id: 'tech_1',
      technicianId: 'tech_1',
      displayName: 'Existing Tech',
      skills: ['svc-old'],
      location: { type: 'Point', coordinates: [77.5, 12.9] },
      availabilityWindows: [{ dayOfWeek: 1, startHour: 8, endHour: 12 }],
      isOnline: true,
      isAvailable: true,
      kycStatus: 'APPROVED',
    };
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: vi.fn().mockResolvedValue({ resource: existing, etag: '"9"' }), replace: mockReplace }),
        items: { create: vi.fn() },
      }) }),
    });

    await patchTechnicianServiceProfile('tech_1', { skills: ['svc-plumbing'] });

    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Existing Tech',
        skills: ['svc-plumbing'],
        location: { type: 'Point', coordinates: [77.5, 12.9] },
        availabilityWindows: [{ dayOfWeek: 1, startHour: 8, endHour: 12 }],
        isOnline: true,
        isAvailable: true,
        kycStatus: 'APPROVED',
      }),
      { accessCondition: { type: 'IfMatch', condition: '"9"' } },
    );
  });
});

// â”€â”€ ETag-guarded read-modify-write (E21-S02 Task 7) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('readModifyWrite ETag guard â€” all five technician writers + patchFcmToken', () => {
  const commissionHold: CommissionHold = {
    outstandingPaise: 500000,
    dueCount: 2,
    state: 'WARN',
    evaluatedAt: '2026-09-01T00:00:00.000Z',
  };
  const paymentProfile: PaymentProfile = { upiVpa: 'tech@upi', upiUpdatedAt: '2026-09-01T00:00:00.000Z' };

  const existingDoc: Record<string, unknown> = {
    id: 'tech_etag',
    technicianId: 'tech_etag',
    commissionHold,
    paymentProfile,
    kyc: { kycStatus: 'APPROVED' },
    skills: ['svc-old'],
    availabilityWindows: [],
    isOnline: false,
    isAvailable: false,
    suspended: false,
    fcmToken: 'old-token',
  };

  interface WriterCase {
    name: string;
    invoke: (technicianId: string) => Promise<unknown>;
  }

  const writers: WriterCase[] = [
    { name: 'upsertKycStatus', invoke: (id) => upsertKycStatus(id, { kycStatus: 'PENDING' }) },
    { name: 'patchTechnicianAvailability', invoke: (id) => patchTechnicianAvailability(id, { isOnline: true }) },
    { name: 'patchTechnicianServiceProfile', invoke: (id) => patchTechnicianServiceProfile(id, { skills: ['svc-plumbing'] }) },
    { name: 'patchTechnicianAdminFields', invoke: (id) => patchTechnicianAdminFields(id, { suspended: true }) },
    { name: 'patchFcmToken', invoke: (id) => patchFcmToken(id, 'fcm-tok-new') },
  ];

  describe.each(writers)('$name', ({ invoke }) => {
    it('replaces with IfMatch using the read ETag and preserves commissionHold + paymentProfile', async () => {
      const mockRead = vi.fn().mockResolvedValue({ resource: existingDoc, etag: '"7"' });
      const mockReplace = vi.fn().mockResolvedValue({});
      const mockCreate = vi.fn();
      (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
        database: () => ({ container: () => ({
          item: () => ({ read: mockRead, replace: mockReplace }),
          items: { create: mockCreate },
        }) }),
      });

      await invoke('tech_etag');

      expect(mockReplace).toHaveBeenCalledTimes(1);
      const [body, options] = mockReplace.mock.calls[0] as [Record<string, unknown>, unknown];
      expect(options).toEqual({ accessCondition: { type: 'IfMatch', condition: '"7"' } });
      expect(body['commissionHold']).toEqual(commissionHold);
      expect(body['paymentProfile']).toEqual(paymentProfile);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('re-reads and retries once after a 412, then succeeds', async () => {
      const mockRead = vi.fn()
        .mockResolvedValueOnce({ resource: existingDoc, etag: '"7"' })
        .mockResolvedValueOnce({ resource: existingDoc, etag: '"8"' });
      const mockReplace = vi.fn()
        .mockRejectedValueOnce({ code: 412 })
        .mockResolvedValueOnce({});
      (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
        database: () => ({ container: () => ({
          item: () => ({ read: mockRead, replace: mockReplace }),
          items: { create: vi.fn() },
        }) }),
      });

      await invoke('tech_etag');

      expect(mockRead).toHaveBeenCalledTimes(2);
      expect(mockReplace).toHaveBeenCalledTimes(2);
      expect(mockReplace.mock.calls[1]?.[1]).toEqual({ accessCondition: { type: 'IfMatch', condition: '"8"' } });
    });

    it('throws after three consecutive 412s', async () => {
      const mockRead = vi.fn().mockResolvedValue({ resource: existingDoc, etag: '"7"' });
      const mockReplace = vi.fn().mockRejectedValue({ code: 412 });
      (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
        database: () => ({ container: () => ({
          item: () => ({ read: mockRead, replace: mockReplace }),
          items: { create: vi.fn() },
        }) }),
      });

      await expect(invoke('tech_etag')).rejects.toMatchObject({ code: 412 });
      expect(mockReplace).toHaveBeenCalledTimes(3);
    });

    it('creates the doc via items.create when the technician doc is absent', async () => {
      const mockRead = vi.fn().mockResolvedValue({ resource: undefined, etag: undefined });
      const mockReplace = vi.fn();
      const mockCreate = vi.fn().mockResolvedValue({});
      (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
        database: () => ({ container: () => ({
          item: () => ({ read: mockRead, replace: mockReplace }),
          items: { create: mockCreate },
        }) }),
      });

      await invoke('tech_new');

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockReplace).not.toHaveBeenCalled();
      const body = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(body['id']).toBe('tech_new');
    });
  });

  it('also retries on a 409 conflict (isPreconditionFailure covers both codes)', async () => {
    const mockRead = vi.fn()
      .mockResolvedValueOnce({ resource: existingDoc, etag: '"7"' })
      .mockResolvedValueOnce({ resource: existingDoc, etag: '"8"' });
    const mockReplace = vi.fn()
      .mockRejectedValueOnce({ code: 409 })
      .mockResolvedValueOnce({});
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: mockRead, replace: mockReplace }),
        items: { create: vi.fn() },
      }) }),
    });

    await upsertKycStatus('tech_etag', { kycStatus: 'PENDING' });

    expect(mockReplace).toHaveBeenCalledTimes(2);
  });
});

describe('readCommissionHold', () => {
  it('returns exists:true and the commissionHold when the technician doc has one', async () => {
    const hold: CommissionHold = { outstandingPaise: 300000, dueCount: 1, state: 'WARN', evaluatedAt: '2026-09-01T00:00:00.000Z' };
    const mockRead = vi.fn().mockResolvedValue({ resource: { id: 't1', commissionHold: hold } });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ read: mockRead }) }) }),
    });

    expect(await readCommissionHold('t1')).toEqual({ exists: true, hold });
  });

  it('returns exists:true, hold:null when the doc exists but has no commissionHold field', async () => {
    const mockRead = vi.fn().mockResolvedValue({ resource: { id: 't1' } });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ read: mockRead }) }) }),
    });

    expect(await readCommissionHold('t1')).toEqual({ exists: true, hold: null });
  });

  it('returns exists:false, hold:null when the technician doc is absent', async () => {
    const mockRead = vi.fn().mockResolvedValue({ resource: undefined });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ read: mockRead }) }) }),
    });

    expect(await readCommissionHold('ghost')).toEqual({ exists: false, hold: null });
  });
});

describe('patchCommissionHold', () => {
  const hold: CommissionHold = { outstandingPaise: 300000, dueCount: 1, state: 'WARN', evaluatedAt: '2026-09-01T00:00:00.000Z' };
  const readStartedAt = '2026-09-01T00:00:00.000Z';

  it('patches /commissionHold with a condition string containing readStartedAt and returns APPLIED', async () => {
    const mockPatch = vi.fn().mockResolvedValue({});
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ patch: mockPatch }) }) }),
    });

    const result = await patchCommissionHold('t1', hold, readStartedAt);

    expect(result).toBe('APPLIED');
    expect(mockPatch).toHaveBeenCalledTimes(1);
    const call = mockPatch.mock.calls[0]![0] as { operations: Array<{ op: string; path: string; value: unknown }>; condition: string };
    expect(call.operations).toEqual([{ op: 'set', path: '/commissionHold', value: hold }]);
    expect(call.condition).toBe(
      `FROM c WHERE NOT IS_DEFINED(c.commissionHold) OR NOT IS_DEFINED(c.commissionHold.evaluatedAt) OR c.commissionHold.evaluatedAt < "${readStartedAt}"`,
    );
  });

  it('maps a 412 precondition failure to STALE', async () => {
    const mockPatch = vi.fn().mockRejectedValue({ code: 412 });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ patch: mockPatch }) }) }),
    });

    expect(await patchCommissionHold('t1', hold, readStartedAt)).toBe('STALE');
  });

  it('maps a 404 not-found to MISSING', async () => {
    const mockPatch = vi.fn().mockRejectedValue({ code: 404 });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ patch: mockPatch }) }) }),
    });

    expect(await patchCommissionHold('t1', hold, readStartedAt)).toBe('MISSING');
  });

  it('rethrows any other error code', async () => {
    const mockPatch = vi.fn().mockRejectedValue({ code: 429 });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ patch: mockPatch }) }) }),
    });

    await expect(patchCommissionHold('t1', hold, readStartedAt)).rejects.toMatchObject({ code: 429 });
  });
});

describe('listTechniciansWithHold', () => {
  it('queries IS_DEFINED(c.commissionHold), maxItemCount 50, and sorts the page by outstandingPaise desc', async () => {
    const page = {
      resources: [
        { id: 't1', displayName: 'Low', commissionHold: { outstandingPaise: 100, dueCount: 1, state: 'WARN', evaluatedAt: 'x' } },
        { id: 't2', displayName: 'High', commissionHold: { outstandingPaise: 900000, dueCount: 3, state: 'BLOCKED', evaluatedAt: 'x' } },
      ],
      continuationToken: undefined,
    };
    const mockFetchNext = vi.fn().mockResolvedValue(page);
    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
    });

    const result = await listTechniciansWithHold();

    expect(mockQuery).toHaveBeenCalledWith(
      { query: 'SELECT c.id, c.displayName, c.name, c.commissionHold FROM c WHERE IS_DEFINED(c.commissionHold)' },
      { maxItemCount: 50 },
    );
    expect(result.items.map((i) => i.id)).toEqual(['t2', 't1']);
    expect(result.continuationToken).toBeUndefined();
  });

  it('passes continuationToken through to the query options and back out', async () => {
    const mockFetchNext = vi.fn().mockResolvedValue({ resources: [], continuationToken: 'next-token' });
    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
    });

    const result = await listTechniciansWithHold('prev-token');

    expect(mockQuery).toHaveBeenCalledWith(
      { query: 'SELECT c.id, c.displayName, c.name, c.commissionHold FROM c WHERE IS_DEFINED(c.commissionHold)' },
      { maxItemCount: 50, continuationToken: 'prev-token' },
    );
    expect(result.continuationToken).toBe('next-token');
  });

  it('falls back to c.name when displayName is absent, and omits name when neither is set', async () => {
    const mockFetchNext = vi.fn().mockResolvedValue({
      resources: [
        { id: 't1', name: 'Legacy Name', commissionHold: { outstandingPaise: 100, dueCount: 1, state: 'WARN', evaluatedAt: 'x' } },
        { id: 't2', commissionHold: { outstandingPaise: 50, dueCount: 1, state: 'WARN', evaluatedAt: 'x' } },
      ],
    });
    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
    });

    const result = await listTechniciansWithHold();

    expect(result.items[0]).toMatchObject({ id: 't1', name: 'Legacy Name' });
    expect(result.items[1]).not.toHaveProperty('name');
  });
});

describe('listAllTechniciansWithHold', () => {
  it('drains every page via hasMoreResults() and maps rows the same as the paged variant', async () => {
    const mockHasMoreResults = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(false);
    const mockFetchNext = vi.fn()
      .mockResolvedValueOnce({ resources: [{ id: 't1', displayName: 'Low', commissionHold: { outstandingPaise: 100, dueCount: 1, state: 'WARN', evaluatedAt: 'x' } }] })
      .mockResolvedValueOnce({ resources: [{ id: 't2', commissionHold: { outstandingPaise: 900000, dueCount: 3, state: 'BLOCKED', evaluatedAt: 'x' } }] });
    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext, hasMoreResults: mockHasMoreResults });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
    });

    const result = await listAllTechniciansWithHold();

    expect(mockQuery).toHaveBeenCalledWith(
      { query: 'SELECT c.id, c.displayName, c.name, c.commissionHold FROM c WHERE IS_DEFINED(c.commissionHold)' },
      { maxItemCount: 50 },
    );
    expect(mockFetchNext).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      { id: 't1', name: 'Low', commissionHold: { outstandingPaise: 100, dueCount: 1, state: 'WARN', evaluatedAt: 'x' } },
      { id: 't2', commissionHold: { outstandingPaise: 900000, dueCount: 3, state: 'BLOCKED', evaluatedAt: 'x' } },
    ]);
  });

  it('returns an empty array when no technician has a commissionHold', async () => {
    const mockHasMoreResults = vi.fn().mockReturnValue(false);
    const mockFetchNext = vi.fn();
    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext, hasMoreResults: mockHasMoreResults });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
    });

    expect(await listAllTechniciansWithHold()).toEqual([]);
    expect(mockFetchNext).not.toHaveBeenCalled();
  });
});

describe('listTechniciansWithExpiredOverride', () => {
  it('queries with a parameterised @now and drains every page', async () => {
    const mockHasMoreResults = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
    const mockFetchNext = vi.fn().mockResolvedValueOnce({ resources: [{ id: 't1' }, { id: 't2' }] });
    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext, hasMoreResults: mockHasMoreResults });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
    });
    const nowIso = '2026-09-05T00:00:00.000Z';

    const result = await listTechniciansWithExpiredOverride(nowIso);

    expect(mockQuery).toHaveBeenCalledWith(
      {
        query: 'SELECT c.id FROM c WHERE IS_DEFINED(c.commissionHold.override) AND c.commissionHold.override.until <= @now',
        parameters: [{ name: '@now', value: nowIso }],
      },
      { maxItemCount: 100 },
    );
    expect(result).toEqual(['t1', 't2']);
  });

  it('returns an empty array when no technician has an expired override', async () => {
    const mockHasMoreResults = vi.fn().mockReturnValue(false);
    const mockFetchNext = vi.fn();
    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext, hasMoreResults: mockHasMoreResults });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
    });

    expect(await listTechniciansWithExpiredOverride('2026-09-05T00:00:00.000Z')).toEqual([]);
    expect(mockFetchNext).not.toHaveBeenCalled();
  });
});

describe('patchPaymentProfile', () => {
  it('patches /paymentProfile', async () => {
    const mockPatch = vi.fn().mockResolvedValue({});
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ patch: mockPatch }) }) }),
    });
    const profile = { upiVpa: 'tech@upi', upiUpdatedAt: '2026-09-01T00:00:00.000Z' };

    await patchPaymentProfile('t1', profile);

    expect(mockPatch).toHaveBeenCalledWith({ operations: [{ op: 'set', path: '/paymentProfile', value: profile }] });
  });

  it('maps a 404 to a TECHNICIAN_NOT_FOUND error', async () => {
    const mockPatch = vi.fn().mockRejectedValue({ code: 404 });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ patch: mockPatch }) }) }),
    });

    await expect(patchPaymentProfile('ghost', { upiVpa: 'x@upi', upiUpdatedAt: 'x' }))
      .rejects.toMatchObject({ code: 'TECHNICIAN_NOT_FOUND' });
  });

  it('rethrows any other error code', async () => {
    const mockPatch = vi.fn().mockRejectedValue({ code: 500 });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ patch: mockPatch }) }) }),
    });

    await expect(patchPaymentProfile('t1', { upiVpa: 'x@upi', upiUpdatedAt: 'x' })).rejects.toMatchObject({ code: 500 });
  });
});

describe('undefined page.resources (real Cosmos aggregate/empty-page behaviour)', () => {
  // Regression (prod, 2026-09-07): Cosmos can hand back a page whose `resources` is undefined
  // rather than an empty array. Every hold query below feeds the admin commission dashboard or
  // the E21-S04 reconciler, so an unguarded `.map`/spread turns into a 500 on the owner's console.
  const withPages = (pages: unknown[]) => {
    const mockHasMoreResults = vi.fn();
    pages.forEach(() => mockHasMoreResults.mockReturnValueOnce(true));
    mockHasMoreResults.mockReturnValue(false);
    const mockFetchNext = vi.fn();
    pages.forEach((pg) => mockFetchNext.mockResolvedValueOnce(pg));
    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext, hasMoreResults: mockHasMoreResults });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
    });
    return { mockFetchNext };
  };

  it('listTechniciansWithHold returns no items when the page has undefined resources', async () => {
    withPages([{ resources: undefined, continuationToken: undefined }]);

    const result = await listTechniciansWithHold();

    expect(result.items).toEqual([]);
  });

  it('listAllTechniciansWithHold skips undefined pages and keeps populated ones', async () => {
    withPages([
      { resources: undefined },
      { resources: [{ id: 't1', displayName: 'A', commissionHold: { outstandingPaise: 100, dueCount: 1, state: 'WARN', evaluatedAt: 'x' } }] },
    ]);

    const result = await listAllTechniciansWithHold();

    expect(result.map((r) => r.id)).toEqual(['t1']);
  });

  it('listTechniciansWithExpiredOverride skips undefined pages and keeps populated ones', async () => {
    withPages([{ resources: undefined }, { resources: [{ id: 't2' }] }]);

    const result = await listTechniciansWithExpiredOverride('2026-09-05T00:00:00.000Z');

    expect(result).toEqual(['t2']);
  });
});

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm --dir api typecheck' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 5424ms:

> homeservices-api@0.1.0 typecheck C:\Alok\Business Projects\wt-fix-cosmos-pages\api
> tsc --noEmit -p tsconfig.tests.json


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm --dir api test -- --runInBand' in C:\Alok\Business Projects\wt-fix-cosmos-pages
2026-09-07T10:44:42.476239Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.8 seconds
Output:
 ERROR  Unknown option: 'runInBand'
For help, run: pnpm help test

 exited 1 in 793ms:
 ERROR  Unknown option: 'runInBand'
For help, run: pnpm help test

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm --dir api vitest run tests/cosmos/commission-receivable-repository.test.ts tests/cosmos/technician-repository.test.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
2026-09-07T10:44:47.733112Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.8 seconds
Output:
undefined
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "api" not found
'api' is not recognized as an internal or external command,
operable program or batch file.

 exited 1 in 843ms:
undefined
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "api" not found
'api' is not recognized as an internal or external command,
operable program or batch file.

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm --dir api exec vitest run tests/cosmos/commission-receivable-repository.test.ts tests/cosmos/technician-repository.test.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 1652ms:

[1m[7m[36m RUN [39m[27m[22m [36mv2.1.9 [39m[90mC:/Alok/Business Projects/wt-fix-cosmos-pages/api[39m

 [32m✓[39m tests/cosmos/technician-repository.test.ts [2m([22m[2m52 tests[22m[2m)[22m[90m 16[2mms[22m[39m
 [32m✓[39m tests/cosmos/commission-receivable-repository.test.ts [2m([22m[2m27 tests[22m[2m)[22m[90m 8[2mms[22m[39m

[2m Test Files [22m [1m[32m2 passed[39m[22m[90m (2)[39m
[2m      Tests [22m [1m[32m79 passed[39m[22m[90m (79)[39m
[2m   Start at [22m 06:44:52
[2m   Duration [22m 378ms[2m (transform 177ms, setup 0ms, collect 242ms, tests 25ms, environment 0ms, prepare 161ms)[22m


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem api/node_modules/@azure/cosmos/dist -Recurse -Filter QueryIterator* | Select-Object -First 20 FullName' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 526ms:

FullName                                                                                                             
--------                                                                                                             
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\browser\queryIterator.d.ts         
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\browser\queryIterator.d.ts.map     
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\browser\queryIterator.js           
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\browser\queryIterator.js.map       
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\commonjs\queryIterator.d.ts        
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\commonjs\queryIterator.d.ts.map    
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\commonjs\queryIterator.js          
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\commonjs\queryIterator.js.map      
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryIterator.d.ts             
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryIterator.d.ts.map         
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryIterator.js               
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryIterator.js.map           
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\react-native\queryIterator.d.ts    
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\react-native\queryIterator.d.ts.map
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\react-native\queryIterator.js      
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\react-native\queryIterator.js.map  



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path api/node_modules/@azure/cosmos/dist/esm/queryIterator.js -Pattern "fetchNext|resources" -Context 3,5 | Select-Object -First 80' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 528ms:

  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:20:    fetchFunctions;
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:21:    resourceLink;
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:22:    resourceType;
> api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:23:    fetchAllTempResources; // TODO
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:24:    fetchAllLastResHeaders;
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:25:    queryExecutionContext;
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:26:    queryPlanPromise;
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:27:    isInitialized;
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:28:    correlatedActivityId;
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:69:     * const key = "<database account masterkey>";
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:70:     * const client = new CosmosClient({ endpoint, key 
});
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:71:     *
> api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:72:     * for await (const { resources: db } of 
client.databases.readAll().getAsyncIterator()) {
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:73:     *   console.log(`Got ${db} from AsyncIterator`);
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:74:     * }
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:75:     * ```
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:76:     */
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:77:    async *getAsyncIterator() {
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:111:        }
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:112:    }
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:113:    /**
> api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:114:     * Determine if there are still remaining resources 
to process based on the value of the continuation token or the
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:115:     * elements remaining on the current batch in the 
QueryIterator.
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:116:     * @returns true if there is other elements to 
process in the QueryIterator.
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:117:     */
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:118:    hasMoreResults() {
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:119:        return 
this.queryExecutionContext.hasMoreResults();
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:132:     *
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:133:     * const { container } = await 
database.containers.createIfNotExists({ id: "Test Container" });
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:134:     *
> api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:135:     * const { resources } = await container.items
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:136:     *   .query("SELECT * from c WHERE c.isCapitol = 
true")
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:137:     *   .fetchAll();
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:138:     * ```
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:139:     */
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:140:    async fetchAll() {
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:184:     * };
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:185:     * const queryIterator = 
container.items.query(querySpec, queryOptions);
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:186:     * while (queryIterator.hasMoreResults()) {
> api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:187:     *   const { resources: result } = await 
queryIterator.fetchNext();
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:188:     *   // process results
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:189:     * }
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:190:     * ```
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:191:     */
> api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:192:    async fetchNext() {
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:193:        return withDiagnostics(async (diagnosticNode) 
=> {
> api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:194:            return 
this.fetchNextInternal(diagnosticNode);
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:195:        }, this.clientContext);
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:196:    }
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:197:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:198:     * @internal
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:199:     */
> api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:200:    async fetchNextInternal(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:201:        this.queryPlanPromise = 
withMetadataDiagnostics(async (metadataNode) => {
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:202:            return this.fetchQueryPlan(metadataNode);
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:203:        }, diagnosticNode, 
MetadataLookUpType.QueryPlanLookUp);
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:204:        if (!this.isInitialized) {
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:205:            await this.init(diagnosticNode);
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:225:        return new FeedResponse(response.result, 
response.headers, this.queryExecutionContext.hasMoreResults(), getEmptyCosmosDiagnostics());
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:226:    }
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:227:    /**
> api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:228:     * Reset the QueryIterator to the beginning and 
clear all the resources inside it
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:229:     * @example
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:230:     * ```ts snippet:QueryIteratorReset
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:231:     * import { CosmosClient } from "@azure/cosmos";
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:232:     *
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:233:     * const endpoint = 
"https://your-account.documents.azure.com";
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:241:     * };
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:242:     * const queryIterator = 
container.items.query(querySpec);
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:243:     * while (queryIterator.hasMoreResults()) {
> api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:244:     *   const { resources: result } = await 
queryIterator.fetchNext();
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:245:     *   // process results
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:246:     * }
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:247:     * queryIterator.reset();
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:248:     * ```
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:249:     *
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:252:        this.correlatedActivityId = randomUUID();
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:253:        this.queryPlanPromise = undefined;
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:254:        this.fetchAllLastResHeaders = 
getInitialHeader();
> api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:255:        this.fetchAllTempResources = [];
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:256:        this.queryExecutionContext = new 
DefaultQueryExecutionContext(this.options, this.fetchFunctions, this.correlatedActivityId);
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:257:    }
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:258:    async toArrayImplementation(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:259:        this.queryPlanPromise = 
withMetadataDiagnostics(async (metadataNode) => {
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:260:            return this.fetchQueryPlan(metadataNode);
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:281:            // concatenate the results and fetch more
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:282:            mergeHeaders(this.fetchAllLastResHeaders, 
headers);
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:283:            if (result) {
> api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:284:                
this.fetchAllTempResources.push(...result);
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:285:            }
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:286:        }
> api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:287:        return new 
FeedResponse(this.fetchAllTempResources, this.fetchAllLastResHeaders, this.queryExecutionContext.hasMoreResults(), 
getEmptyCosmosDiagnostics());
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:288:    }
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:289:    async createExecutionContext(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:290:        const queryPlanResponse = await 
this.queryPlanPromise;
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:291:        // We always coerce queryPlanPromise to 
resolved. So if it errored, we need to manually inspect the resolved value
  api\node_modules\@azure\cosmos\dist\esm\queryIterator.js:292:        if (queryPlanResponse instanceof Error) {



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/node_modules/@azure/cosmos/dist/esm/queryIterator.js | Select-Object -Skip 190 -First 100' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 496ms:
     */
    async fetchNext() {
        return withDiagnostics(async (diagnosticNode) => {
            return this.fetchNextInternal(diagnosticNode);
        }, this.clientContext);
    }
    /**
     * @internal
     */
    async fetchNextInternal(diagnosticNode) {
        this.queryPlanPromise = withMetadataDiagnostics(async (metadataNode) => {
            return this.fetchQueryPlan(metadataNode);
        }, diagnosticNode, MetadataLookUpType.QueryPlanLookUp);
        if (!this.isInitialized) {
            await this.init(diagnosticNode);
        }
        let response;
        try {
            response = await this.queryExecutionContext.fetchMore(diagnosticNode);
        }
        catch (error) {
            if (this.needsQueryPlan(error)) {
                await this.createExecutionContext(diagnosticNode);
                try {
                    response = await this.queryExecutionContext.fetchMore(diagnosticNode);
                }
                catch (queryError) {
                    this.handleSplitError(queryError);
                }
            }
            else {
                throw error;
            }
        }
        return new FeedResponse(response.result, response.headers, this.queryExecutionContext.hasMoreResults(), getEmptyCosmosDiagnostics());
    }
    /**
     * Reset the QueryIterator to the beginning and clear all the resources inside it
     * @example
     * ```ts snippet:QueryIteratorReset
     * import { CosmosClient } from "@azure/cosmos";
     *
     * const endpoint = "https://your-account.documents.azure.com";
     * const key = "<database account masterkey>";
     * const client = new CosmosClient({ endpoint, key });
     * const { database } = await client.databases.createIfNotExists({ id: "Test Database" });
     * const { container } = await database.containers.createIfNotExists({ id: "Test Container" });
     *
     * const querySpec = {
     *   query: "SELECT c.status, COUNT(c.id) AS count FROM c GROUP BY c.status",
     * };
     * const queryIterator = container.items.query(querySpec);
     * while (queryIterator.hasMoreResults()) {
     *   const { resources: result } = await queryIterator.fetchNext();
     *   // process results
     * }
     * queryIterator.reset();
     * ```
     *
     */
    reset() {
        this.correlatedActivityId = randomUUID();
        this.queryPlanPromise = undefined;
        this.fetchAllLastResHeaders = getInitialHeader();
        this.fetchAllTempResources = [];
        this.queryExecutionContext = new DefaultQueryExecutionContext(this.options, this.fetchFunctions, this.correlatedActivityId);
    }
    async toArrayImplementation(diagnosticNode) {
        this.queryPlanPromise = withMetadataDiagnostics(async (metadataNode) => {
            return this.fetchQueryPlan(metadataNode);
        }, diagnosticNode, MetadataLookUpType.QueryPlanLookUp);
        // this.queryPlanPromise = this.fetchQueryPlan(diagnosticNode);
        if (!this.isInitialized) {
            await this.init(diagnosticNode);
        }
        while (this.queryExecutionContext.hasMoreResults()) {
            let response;
            try {
                response = await this.queryExecutionContext.fetchMore(diagnosticNode);
            }
            catch (error) {
                if (this.needsQueryPlan(error)) {
                    await this.createExecutionContext(diagnosticNode);
                    response = await this.queryExecutionContext.fetchMore(diagnosticNode);
                }
                else {
                    throw error;
                }
            }
            const { result, headers } = response;
            // concatenate the results and fetch more
            mergeHeaders(this.fetchAllLastResHeaders, headers);
            if (result) {
                this.fetchAllTempResources.push(...result);
            }
        }
        return new FeedResponse(this.fetchAllTempResources, this.fetchAllLastResHeaders, this.queryExecutionContext.hasMoreResults(), getEmptyCosmosDiagnostics());
    }
    async createExecutionContext(diagnosticNode) {
        const queryPlanResponse = await this.queryPlanPromise;

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path api/node_modules/@azure/cosmos/dist/esm/* -Pattern "class FeedResponse" -Recurse -Context 0,30' in C:\Alok\Business Projects\wt-fix-cosmos-pages
2026-09-07T10:45:08.815651Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.6 seconds
Output:
Select-String : A parameter cannot be found that matches parameter name 'Recurse'.
At line:2 char:93
+ ... zure/cosmos/dist/esm/* -Pattern "class FeedResponse" -Recurse -Contex ...
+                                                          ~~~~~~~~
    + CategoryInfo          : InvalidArgument: (:) [Select-String], ParameterBindingException
    + FullyQualifiedErrorId : NamedParameterNotFound,Microsoft.PowerShell.Commands.SelectStringCommand
 

 exited 1 in 608ms:
Select-String : A parameter cannot be found that matches parameter name 'Recurse'.
At line:2 char:93
+ ... zure/cosmos/dist/esm/* -Pattern "class FeedResponse" -Recurse -Contex ...
+                                                          ~~~~~~~~
    + CategoryInfo          : InvalidArgument: (:) [Select-String], ParameterBindingException
    + FullyQualifiedErrorId : NamedParameterNotFound,Microsoft.PowerShell.Commands.SelectStringCommand
 

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem api/node_modules/@azure/cosmos/dist/esm -Recurse -File | Select-String -Pattern "class FeedResponse" -Context 0,30 | Select-Object -First 60' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 794ms:

> api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.d.ts:3:export declare class FeedResponse<TResource> {
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.d.ts:4:    readonly resources: TResource[];
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.d.ts:5:    private readonly headers;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.d.ts:6:    readonly hasMoreResults: boolean;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.d.ts:7:    readonly diagnostics: CosmosDiagnostics;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.d.ts:8:    constructor(resources: TResource[], headers: 
CosmosHeaders, hasMoreResults: boolean, diagnostics: CosmosDiagnostics);
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.d.ts:9:    get continuation(): string;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.d.ts:10:    get continuationToken(): string;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.d.ts:11:    get queryMetrics(): string;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.d.ts:12:    get requestCharge(): number;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.d.ts:13:    get activityId(): string;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.d.ts:14:    get correlatedActivityId(): string;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.d.ts:15:    get indexMetrics(): string;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.d.ts:16:}
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.d.ts:17://# sourceMappingURL=FeedResponse.d.ts.map
> api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:5:export class FeedResponse {
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:6:    resources;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:7:    headers;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:8:    hasMoreResults;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:9:    diagnostics;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:10:    constructor(resources, headers, 
hasMoreResults, diagnostics) {
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:11:        this.resources = resources;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:12:        this.headers = headers;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:13:        this.hasMoreResults = hasMoreResults;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:14:        this.diagnostics = diagnostics;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:15:    }
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:16:    get continuation() {
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:17:        return this.continuationToken;
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:18:    }
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:19:    get continuationToken() {
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:20:        return 
this.headers[Constants.HttpHeaders.Continuation];
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:21:    }
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:22:    get queryMetrics() {
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:23:        return 
this.headers[Constants.HttpHeaders.QueryMetrics];
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:24:    }
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:25:    get requestCharge() {
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:26:        return 
getRequestChargeIfAny(this.headers);
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:27:    }
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:28:    get activityId() {
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:29:        return 
this.headers[Constants.HttpHeaders.ActivityId];
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:30:    }
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:31:    get correlatedActivityId() {
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:32:        return 
this.headers[Constants.HttpHeaders.CorrelatedActivityId];
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:33:    }
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:34:    get indexMetrics() {
  api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js:35:        return 
decodeAndParseJSONString(this.headers[Constants.HttpHeaders.IndexUtilization]);
> api\node_modules\@azure\cosmos\dist\esm\request\FeedResponse.js.map:1:{"version":3,"file":"FeedResponse.js","sourceRo
ot":"","sources":["../../../src/request/FeedResponse.ts"],"names":[],"mappings":"AAAA,uCAAuC;AACvC,kCAAkC;AAClC,OAAO,EA
AE,SAAS,EAAE,MAAM,oBAAoB,CAAC;AAE/C,OAAO,EACL,wBAAwB,EACxB,qBAAqB,GACtB,MAAM,yCAAyC,CAAC;AAGjD,MAAM,OAAO,YAAY;IAEL;IACC
;IACD;IACA;IAJlB,YACkB,SAAsB,EACrB,OAAsB,EACvB,cAAuB,EACvB,WAA8B;QAH9B,cAAS,GAAT,SAAS,CAAa;QACrB,YAAO,GAAP,OAAO,CAAe;QA
CvB,mBAAc,GAAd,cAAc,CAAS;QACvB,gBAAW,GAAX,WAAW,CAAmB;IAC7C,CAAC;IAEJ,IAAW,YAAY;QACrB,OAAO,IAAI,CAAC,iBAAiB,CAAC;IAChC,C
AAC;IACD,IAAW,iBAAiB;QAC1B,OAAO,IAAI,CAAC,OAAO,CAAC,SAAS,CAAC,WAAW,CAAC,YAAY,CAAC,CAAC;IAC1D,CAAC;IACD,IAAW,YAAY;QACrB,
OAAO,IAAI,CAAC,OAAO,CAAC,SAAS,CAAC,WAAW,CAAC,YAAY,CAAC,CAAC;IAC1D,CAAC;IACD,IAAW,aAAa;QACtB,OAAO,qBAAqB,CAAC,IAAI,CAAC,
OAAO,CAAC,CAAC;IAC7C,CAAC;IACD,IAAW,UAAU;QACnB,OAAO,IAAI,CAAC,OAAO,CAAC,SAAS,CAAC,WAAW,CAAC,UAAU,CAAC,CAAC;IACxD,CAAC;I
ACD,IAAW,oBAAoB;QAC7B,OAAO,IAAI,CAAC,OAAO,CAAC,SAAS,CAAC,WAAW,CAAC,oBAAoB,CAAC,CAAC;IAClE,CAAC;IACD,IAAW,YAAY;QACrB,OAA
O,wBAAwB,CAAC,IAAI,CAAC,OAAO,CAAC,SAAS,CAAC,WAAW,CAAC,gBAAgB,CAAC,CAAC,CAAC;IACxF,CAAC;CACF","sourcesContent":["// 
Copyright (c) Microsoft Corporation.\n// Licensed under the MIT License.\nimport { Constants } from 
\"../common/index.js\";\nimport type { CosmosHeaders } from \"../queryExecutionContext/headerUtils.js\";\nimport {\n  
decodeAndParseJSONString,\n  getRequestChargeIfAny,\n} from \"../queryExecutionContext/headerUtils.js\";\nimport type 
{ CosmosDiagnostics } from \"../CosmosDiagnostics.js\";\n\nexport class FeedResponse<TResource> {\n  constructor(\n    
public readonly resources: TResource[],\n    private readonly headers: CosmosHeaders,\n    public readonly 
hasMoreResults: boolean,\n    public readonly diagnostics: CosmosDiagnostics,\n  ) {}\n\n  public get continuation(): 
string {\n    return this.continuationToken;\n  }\n  public get continuationToken(): string {\n    return 
this.headers[Constants.HttpHeaders.Continuation];\n  }\n  public get queryMetrics(): string {\n    return 
this.headers[Constants.HttpHeaders.QueryMetrics];\n  }\n  public get requestCharge(): number {\n    return 
getRequestChargeIfAny(this.headers);\n  }\n  public get activityId(): string {\n    return 
this.headers[Constants.HttpHeaders.ActivityId];\n  }\n  public get correlatedActivityId(): string {\n    return 
this.headers[Constants.HttpHeaders.CorrelatedActivityId];\n  }\n  public get indexMetrics(): string {\n    return 
decodeAndParseJSONString(this.headers[Constants.HttpHeaders.IndexUtilization]);\n  }\n}\n"]}



2026-09-07T10:45:13.481593Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem api/src -Recurse -Filter *.ts | Select-String -Pattern \"page\\.resources|\\.resources\\.map|resources \\?\\?\" | Select-Object Path,LineNumber,Line | Format-Table -AutoSize" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 556ms:

Path                                                                                             LineNumber Line       
----                                                                                             ---------- ----       
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\audit-log-repository.ts                     62   const ...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-receivable-repository.ts        233     // `...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-receivable-repository.ts        235     // "...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-receivable-repository.ts        239       gr...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\complaints-repository.ts                   107   const ...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\erasure-request-repository.ts              121   return...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts                       62     for ...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts                       66     for ...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts                      123   return...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\technician-repository.ts                   591   const ...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\technician-repository.ts                   609     item...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\technician-repository.ts                   633     ids....
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\dashboard\feed.ts                  82     cons...



2026-09-07T10:45:19.864679Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/tests/cosmos/commission-receivable-repository.test.ts | Select-Object -First 360' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 515ms:
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommissionReceivableEntry } from '../../src/schemas/commission-receivable.js';

// --- Mocks ---
const mockCreate = vi.fn();
const mockRead = vi.fn();
const mockBatch = vi.fn();
const mockItem = vi.fn(() => ({ read: mockRead }));
const mockFetchAll = vi.fn();
const mockFetchNext = vi.fn();
const mockHasMoreResults = vi.fn(() => false);
const mockQuery = vi.fn(() => ({ fetchAll: mockFetchAll, fetchNext: mockFetchNext, hasMoreResults: mockHasMoreResults }));

vi.mock('../../src/cosmos/client.js', () => ({
  getCommissionReceivablesContainer: () => ({
    items: { create: mockCreate, query: mockQuery, batch: mockBatch },
    item: mockItem,
  }),
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';

const baseDueEntry: CommissionReceivableEntry = {
  id: 'bk-001',
  bookingId: 'bk-001',
  technicianId: 'tech-1',
  partitionKey: 'tech-1',
  serviceId: 'svc-ac',
  categoryId: 'cat-hvac',
  bookingAmount: 59900,
  commissionBps: 2000,
  commissionDue: 11980,
  commissionResolvedFrom: 'SERVICE',
  remittanceStatus: 'DUE',
  createdAt: '2026-05-01T08:00:00.000Z',
};

describe('commissionReceivableRepo.createDueEntry', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true on successful create', async () => {
    mockCreate.mockResolvedValue({});
    const result = await commissionReceivableRepo.createDueEntry({
      bookingId: 'bk-001',
      technicianId: 'tech-1',
      serviceId: 'svc-ac',
      categoryId: 'cat-hvac',
      bookingAmount: 59900,
      commissionBps: 2000,
      commissionDue: 11980,
      commissionResolvedFrom: 'SERVICE',
    });
    expect(result).toBe(true);
    expect(mockCreate).toHaveBeenCalledOnce();
    const doc = (mockCreate.mock.calls as unknown[][])[0]![0] as CommissionReceivableEntry;
    expect(doc.id).toBe('bk-001');
    expect(doc.remittanceStatus).toBe('DUE');
    expect(doc.partitionKey).toBe('tech-1');
    expect(doc.cashCollectedAmount).toBeUndefined();
  });

  it('includes cashCollectedAmount when provided', async () => {
    mockCreate.mockResolvedValue({});
    await commissionReceivableRepo.createDueEntry({
      bookingId: 'bk-002',
      technicianId: 'tech-1',
      serviceId: 'svc-ac',
      categoryId: 'cat-hvac',
      bookingAmount: 59900,
      commissionBps: 2000,
      commissionDue: 11980,
      commissionResolvedFrom: 'SERVICE',
      cashCollectedAmount: 59900,
    });
    const doc = (mockCreate.mock.calls as unknown[][])[0]![0] as CommissionReceivableEntry;
    expect(doc.cashCollectedAmount).toBe(59900);
  });

  it('includes serviceName, slotDate, collectionMethod when provided', async () => {
    mockCreate.mockResolvedValue({});
    await commissionReceivableRepo.createDueEntry({
      bookingId: 'bk-003',
      technicianId: 'tech-1',
      serviceId: 'svc-ac',
      categoryId: 'cat-hvac',
      bookingAmount: 59900,
      commissionBps: 2000,
      commissionDue: 11980,
      commissionResolvedFrom: 'SERVICE',
      serviceName: 'AC Repair',
      slotDate: '2026-05-01',
      collectionMethod: 'CASH',
    });
    const doc = (mockCreate.mock.calls as unknown[][])[0]![0] as CommissionReceivableEntry;
    expect(doc.serviceName).toBe('AC Repair');
    expect(doc.slotDate).toBe('2026-05-01');
    expect(doc.collectionMethod).toBe('CASH');
  });

  it('returns false on 409 conflict (duplicate create)', async () => {
    mockCreate.mockRejectedValue({ code: 409 });
    const result = await commissionReceivableRepo.createDueEntry({
      bookingId: 'bk-001',
      technicianId: 'tech-1',
      serviceId: 'svc-ac',
      categoryId: 'cat-hvac',
      bookingAmount: 59900,
      commissionBps: 2000,
      commissionDue: 11980,
      commissionResolvedFrom: 'SERVICE',
    });
    expect(result).toBe(false);
  });

  it('rethrows non-409 errors', async () => {
    mockCreate.mockRejectedValue({ code: 500, message: 'Server error' });
    await expect(
      commissionReceivableRepo.createDueEntry({
        bookingId: 'bk-err',
        technicianId: 'tech-1',
        serviceId: 'svc-ac',
        categoryId: 'cat-hvac',
        bookingAmount: 59900,
        commissionBps: 2000,
        commissionDue: 11980,
        commissionResolvedFrom: 'SERVICE',
      }),
    ).rejects.toMatchObject({ code: 500 });
  });
});

describe('commissionReceivableRepo.getByBookingId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when entry not found', async () => {
    mockRead.mockResolvedValue({ resource: undefined });
    const result = await commissionReceivableRepo.getByBookingId('bk-none', 'tech-1');
    expect(result).toBeNull();
    expect(mockItem).toHaveBeenCalledWith('bk-none', 'tech-1');
  });

  it('returns the entry when found', async () => {
    mockRead.mockResolvedValue({ resource: baseDueEntry });
    const result = await commissionReceivableRepo.getByBookingId('bk-001', 'tech-1');
    expect(result).toEqual(baseDueEntry);
  });
});

describe('runLedgerBatch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns ok when every op succeeded', async () => {
    mockBatch.mockResolvedValue({ result: [{ statusCode: 201 }, { statusCode: 200 }] });
    expect(await commissionReceivableRepo.runLedgerBatch('tech-1', [])).toEqual({ ok: true });
  });

  it('maps 409 to CONFLICT and 412 to PRECONDITION (others 424)', async () => {
    mockBatch.mockResolvedValue({ result: [{ statusCode: 409 }, { statusCode: 424 }] });
    expect(await commissionReceivableRepo.runLedgerBatch('tech-1', [])).toEqual({ ok: false, reason: 'CONFLICT' });
    mockBatch.mockResolvedValue({ result: [{ statusCode: 424 }, { statusCode: 412 }] });
    expect(await commissionReceivableRepo.runLedgerBatch('tech-1', [])).toEqual({ ok: false, reason: 'PRECONDITION' });
  });

  it('rethrows batch-level errors', async () => {
    mockBatch.mockRejectedValue(new Error('Batch request error: 429'));
    await expect(commissionReceivableRepo.runLedgerBatch('tech-1', [])).rejects.toThrow(/429/);
  });

  it('maps a thrown { code: 412 } to PRECONDITION instead of rethrowing', async () => {
    mockBatch.mockRejectedValue({ code: 412 });
    expect(await commissionReceivableRepo.runLedgerBatch('tech-1', [])).toEqual({ ok: false, reason: 'PRECONDITION' });
  });

  it('maps a thrown 409/Conflict error message to CONFLICT instead of rethrowing', async () => {
    mockBatch.mockRejectedValue(new Error('Batch request error: 409 Conflict'));
    expect(await commissionReceivableRepo.runLedgerBatch('tech-1', [])).toEqual({ ok: false, reason: 'CONFLICT' });
  });
});

describe('readLedgerDoc', () => {
  beforeEach(() => vi.clearAllMocks());

  it('point-reads by id scoped to the technician partition', async () => {
    mockRead.mockResolvedValue({ resource: { id: 'rem:k1', docType: 'REMITTANCE', amountPaise: 500 } });
    const doc = await commissionReceivableRepo.readLedgerDoc('tech-1', 'rem:k1');
    expect(mockItem).toHaveBeenCalledWith('rem:k1', 'tech-1');
    expect(doc).toEqual({ id: 'rem:k1', docType: 'REMITTANCE', amountPaise: 500 });
  });

  it('returns null when the doc does not exist', async () => {
    mockRead.mockResolvedValue({ resource: undefined });
    const doc = await commissionReceivableRepo.readLedgerDoc('tech-1', 'rem:missing');
    expect(doc).toBeNull();
  });
});

describe('docType-aware reads', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getOutstandingByTechnician filters RECEIVABLE+DUE and returns etag + outstanding', async () => {
    mockFetchAll.mockResolvedValue({ resources: [{ ...baseDueEntry, _etag: '"e1"', remittedAmount: 1000 }] });
    const rows = await commissionReceivableRepo.getOutstandingByTechnician('tech-1');
    const q = (mockQuery.mock.calls as unknown[][])[0]![0] as { query: string };
    expect(q.query).toMatch(/docType/);
    expect(rows[0]).toMatchObject({ etag: '"e1"', outstandingPaise: 10980 });
  });

  it('getAllByTechnician excludes non-receivable docs in the query', async () => {
    mockFetchAll.mockResolvedValue({ resources: [] });
    await commissionReceivableRepo.getAllByTechnician('tech-1');
    expect(((mockQuery.mock.calls as unknown[][])[0]![0] as { query: string }).query).toMatch(/NOT IS_DEFINED\(c\.docType\) OR c\.docType = 'RECEIVABLE'/);
  });
});

describe('markWaived (batch)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('replaces the row with a WAIVER allocation under ifMatch', async () => {
    mockRead.mockResolvedValue({ resource: baseDueEntry, etag: '"e1"' });
    mockBatch.mockResolvedValue({ result: [{ statusCode: 200 }] });
    const r = await commissionReceivableRepo.markWaived('bk-001', 'tech-1', { waivedReason: 'dispute', markedByAdminId: 'a1' });
    expect(r?.wasApplied).toBe(true);
    const ops = (mockBatch.mock.calls as unknown[][])[0]![0] as Array<{ operationType: string; ifMatch?: string; resourceBody: { remittanceStatus: string } }>;
    expect(ops[0]).toMatchObject({ operationType: 'Replace', ifMatch: '"e1"' });
    expect(ops[0]!.resourceBody.remittanceStatus).toBe('WAIVED');
  });

  it('is a no-op when already settled', async () => {
    mockRead.mockResolvedValue({ resource: { ...baseDueEntry, remittanceStatus: 'REMITTED' }, etag: '"e1"' });
    const r = await commissionReceivableRepo.markWaived('bk-001', 'tech-1', { waivedReason: 'x', markedByAdminId: 'a1' });
    expect(r?.wasApplied).toBe(false);
    expect(mockBatch).not.toHaveBeenCalled();
  });

  it('returns null when entry is missing', async () => {
    mockRead.mockResolvedValue({ resource: undefined });
    const r = await commissionReceivableRepo.markWaived('bk-none', 'tech-1', { waivedReason: 'n/a', markedByAdminId: 'a1' });
    expect(r).toBeNull();
    expect(mockBatch).not.toHaveBeenCalled();
  });
});

describe('sumDueGroupedByTechnician', () => {
  beforeEach(() => vi.clearAllMocks());

  it('groups DUE receivables by technician with the RECEIVABLE filter and correct query options', async () => {
    const groups = [
      { technicianId: 'tech-1', outstandingPaise: 5000, dueCount: 2, oldestDueAt: '2026-05-01T00:00:00.000Z' },
    ];
    mockHasMoreResults.mockReturnValueOnce(true).mockReturnValueOnce(false);
    mockFetchNext.mockResolvedValueOnce({ resources: groups });

    const result = await commissionReceivableRepo.sumDueGroupedByTechnician();

    const [spec, options] = (mockQuery.mock.calls as unknown[][])[0] as [
      { query: string },
      { maxItemCount: number },
    ];
    expect(spec.query).toMatch(/NOT IS_DEFINED\(c\.docType\) OR c\.docType = 'RECEIVABLE'/);
    expect(spec.query).toMatch(/c\.remittanceStatus = 'DUE'/);
    expect(spec.query).toMatch(/GROUP BY c\.technicianId/);
    expect(options.maxItemCount).toBe(100);
    expect('continuationToken' in options).toBe(false);
    expect(result).toEqual(groups);
  });

  it('drains every page via hasMoreResults() â€” Cosmos cannot page a cross-partition GROUP BY with a continuation token', async () => {
    const page1 = [{ technicianId: 'tech-1', outstandingPaise: 5000, dueCount: 2, oldestDueAt: '2026-05-01T00:00:00.000Z' }];
    const page2 = [{ technicianId: 'tech-2', outstandingPaise: 1000, dueCount: 1, oldestDueAt: '2026-05-02T00:00:00.000Z' }];
    mockHasMoreResults
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    mockFetchNext
      .mockResolvedValueOnce({ resources: page1 })
      .mockResolvedValueOnce({ resources: page2 });

    const result = await commissionReceivableRepo.sumDueGroupedByTechnician();

    expect(mockFetchNext).toHaveBeenCalledTimes(2);
    expect(result).toEqual([...page1, ...page2]);
  });

  it('returns an empty array when there are no DUE receivables', async () => {
    mockHasMoreResults.mockReturnValueOnce(false);

    const result = await commissionReceivableRepo.sumDueGroupedByTechnician();

    expect(result).toEqual([]);
    expect(mockFetchNext).not.toHaveBeenCalled();
  });

  // Regression (prod, 2026-09-07): the mocks above model an idealised SDK. Real Cosmos returns
  // `resources: undefined` on the pages of an aggregate GROUP BY query â€” `hasMoreResults()` stays
  // true and `fetchNext()` yields a page with no `resources` array at all. Spreading that threw
  // `TypeError: page.resources is not iterable`, taking down the admin commission dashboard and
  // `sweepAllHolds({ scope: 'FULL' })` in production. Verified against the live prod container.
  it('tolerates the undefined resources Cosmos returns on aggregate GROUP BY pages', async () => {
    mockHasMoreResults
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    mockFetchNext
      .mockResolvedValueOnce({ resources: undefined })
      .mockResolvedValueOnce({ resources: undefined });

    const result = await commissionReceivableRepo.sumDueGroupedByTechnician();

    expect(result).toEqual([]);
    expect(mockFetchNext).toHaveBeenCalledTimes(2);
  });

  it('keeps rows from populated pages when an earlier page has undefined resources', async () => {
    const rows = [{ technicianId: 'tech-1', outstandingPaise: 5000, dueCount: 2, oldestDueAt: '2026-05-01T00:00:00.000Z' }];
    mockHasMoreResults
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    mockFetchNext
      .mockResolvedValueOnce({ resources: undefined })
      .mockResolvedValueOnce({ resources: rows });

    const result = await commissionReceivableRepo.sumDueGroupedByTechnician();

    expect(result).toEqual(rows);
  });
});

describe('getOpenCredits', () => {
  beforeEach(() => vi.clearAllMocks());

  it('queries CREDIT docs with remainingPaise > 0 and maps _etag to etag, stripped from doc', async () => {
    const creditDoc = {
      id: 'cr:ref-1',
      docType: 'CREDIT' as const,
      technicianId: 'tech-1',
      partitionKey: 'tech-1',
      source: 'OVERPAYMENT' as const,
      refId: 'ref-1',
      originalPaise: 5000,
      remainingPaise: 3000,
      consumedBy: [],
      createdAt: '2026-05-01T00:00:00.000Z',
      _etag: '"e9"',
    };
    mockFetchAll.mockResolvedValue({ resources: [creditDoc] });

    const rows = await commissionReceivableRepo.getOpenCredits('tech-1');

    const q = (mockQuery.mock.calls as unknown[][])[0]![0] as { query: string };
    expect(q.query).toMatch(/c\.docType = 'CREDIT'/);
    expect(q.query).toMatch(/c\.remainingPaise > 0/);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.etag).toBe('"e9"');
    expect(rows[0]!.doc).not.toHaveProperty('_etag');
    expect(rows[0]!.doc.remainingPaise).toBe(3000);
  });


2026-09-07T10:45:26.318049Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm --dir api test' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 14467ms:

> homeservices-api@0.1.0 test C:\Alok\Business Projects\wt-fix-cosmos-pages\api
> vitest run


[1m[7m[36m RUN [39m[27m[22m [36mv2.1.9 [39m[90mC:/Alok/Business Projects/wt-fix-cosmos-pages/api[39m

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mskips when booking status is not PAID
[22m[39mDISPATCH_SKIP bookingId=bk-1 status=SEARCHING

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mskips when booking not found
[22m[39mDISPATCH_SKIP bookingId=bk-1 status=NOT_FOUND

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mupsertAction[2m > [22m[2mcreates a new action when it does not exist
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":0,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"create","ts":"2026-09-07T10:45:31.709Z"}

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mmarks booking UNFULFILLED when 0 technicians found
[22m[39mDISPATCH_NO_TECHS bookingId=bk-1

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mupsertAction[2m > [22m[2mis idempotent: duplicate change-feed event does NOT bump version
[22m[39m{"event":"pending_action_stale_drop","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","existing_version":3,"incoming_version":3,"ts":"2026-09-07T10:45:31.710Z"}

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mkeeps a future paid booking retryable when 0 technicians are currently found
[22m[39mDISPATCH_WAITING_FOR_TECHS bookingId=bk-1

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mupsertAction[2m > [22m[2mbumps version when payload changes (real mutation)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T10:45:31.711Z"}

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mcreates dispatch attempt and sends FCM to all found techs (1 tech)
[22m[39mDISPATCH_SENT bookingId=bk-1 technicianIds=t1

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mdispatches only to the nearest ranked technician per attempt
[22m[39mDISPATCH_SENT bookingId=bk-1 technicianIds=t1

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2msets expiresAt to sentAt + 90 seconds
[22m[39mDISPATCH_SENT bookingId=bk-1 technicianIds=t1

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mskips FCM for techs without fcmToken
[22m[39mDISPATCH_SENT bookingId=bk-1 technicianIds=t1

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mqueries technicians using booking lat/lng and serviceId
[22m[39mDISPATCH_NO_TECHS bookingId=bk-1

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mfilters out bounding-box corner techs beyond the actual radius
[22m[39mDISPATCH_NO_TECHS bookingId=bk-1

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mtransitions booking to SEARCHING after successful dispatch
[22m[39mDISPATCH_SENT bookingId=bk-1 technicianIds=t1

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mretries paid bookings that are awaiting dispatch
[22m[39mDISPATCH_SENT bookingId=bk-1 technicianIds=t1

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mdoes not re-offer the same awaiting-dispatch booking to an already attempted technician
[22m[39mDISPATCH_WAITING_FOR_TECHS bookingId=bk-1

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mretries awaiting-dispatch bookings only for technicians not previously attempted
[22m[39mDISPATCH_SENT bookingId=bk-1 technicianIds=t2

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mretries future unfulfilled bookings that were waiting for an online technician
[22m[39mDISPATCH_SENT bookingId=bk-1 technicianIds=t1

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.redispatch[2m > [22m[2mdispatches when booking is in NO_SHOW_REDISPATCH status and returns true
[22m[39mDISPATCH_SENT bookingId=bk-1 technicianIds=t1

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.redispatch[2m > [22m[2mmarks booking UNFULFILLED and returns false when no techs found in expanded radius
[22m[39mDISPATCH_NO_TECHS bookingId=bk-1

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.redispatch[2m > [22m[2mexcludes the original no-show technician from the redispatch candidate set (via booking doc)
[22m[39mDISPATCH_SENT bookingId=bk-1 technicianIds=t-replacement

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.redispatch[2m > [22m[2mexcludes the no-show tech passed explicitly via excludeTechnicianId (survives cleared booking doc)
[22m[39mDISPATCH_SENT bookingId=bk-1 technicianIds=t-replacement

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.redispatch[2m > [22m[2mmarks UNFULFILLED when only the no-show tech is in range (no replacement available)
[22m[39mDISPATCH_NO_TECHS bookingId=bk-1

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.redispatch[2m > [22m[2muses the radiusKm parameter passed in, not the default 10km
[22m[39mDISPATCH_SENT bookingId=bk-1 technicianIds=t1

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.continueDispatchAfterOfferOutcome[2m > [22m[2mcontinues SEARCHING booking by excluding all previously attempted technicians
[22m[39mDISPATCH_SENT bookingId=bk-1 technicianIds=t2

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.continueDispatchAfterOfferOutcome[2m > [22m[2mmarks UNFULFILLED when all eligible technicians were already attempted
[22m[39mDISPATCH_NO_TECHS bookingId=bk-1

 [32m✓[39m tests/unit/dispatcher.service.test.ts [2m([22m[2m29 tests[22m[2m)[22m[90m 15[2mms[22m[39m
 [32m✓[39m tests/cosmos/technician-repository.test.ts [2m([22m[2m52 tests[22m[2m)[22m[90m 20[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/customer-credit-ledger-repository.test.ts [2m([22m[2m18 tests[22m[2m)[22m[90m 72[2mms[22m[39m
[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mupsertAction[2m > [22m[2mretries on 412 ETag conflict (max 3 attempts)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":3,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T10:45:31.886Z"}

 [32m✓[39m tests/cosmos/commission-receivable-repository.test.ts [2m([22m[2m27 tests[22m[2m)[22m[90m 9[2mms[22m[39m
[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mresolveAction[2m > [22m[2msets status=RESOLVED and bumps version
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":3,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"transition_to_resolved","ts":"2026-09-07T10:45:32.080Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mexpireAction[2m > [22m[2msets status=EXPIRED and bumps version
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"transition_to_expired","ts":"2026-09-07T10:45:32.083Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mstale-state cleanup[2m > [22m[2mresolves ADDON_APPROVAL_REQUESTED when booking transitions to PAID
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:customer-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"transition_to_resolved","ts":"2026-09-07T10:45:32.084Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mFCM strict ordering[2m > [22m[2memitFcmForAction succeeds and resolves without throwing
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T10:45:32.084Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":1,"ts":"2026-09-07T10:45:32.085Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mFCM strict ordering[2m > [22m[2memitFcmForAction with technician role also resolves
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T10:45:32.086Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T10:45:32.086Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mFCM strict ordering[2m > [22m[2memitFcmForAction swallows Error thrown by FCM send (err instanceof Error branch)
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T10:45:32.086Z"}
{"event":"fcm_send_failure","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","error_code":"FCM_QUOTA_EXCEEDED","ts":"2026-09-07T10:45:32.086Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mFCM strict ordering[2m > [22m[2memitFcmForAction swallows non-Error thrown by FCM send (String(err) branch)
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T10:45:32.086Z"}
{"event":"fcm_send_failure","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","error_code":"network-timeout","ts":"2026-09-07T10:45:32.086Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mFCM strict ordering[2m > [22m[2memitFcmForAction omits payload key in FCM data when doc.payload is undefined
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T10:45:32.087Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T10:45:32.087Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2misSemanticNoOp — early-exit branches[2m > [22m[2mis NOT a no-op when existing status is RESOLVED (status !== ACTIVE branch)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T10:45:32.087Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2misSemanticNoOp — early-exit branches[2m > [22m[2mis NOT a no-op when type changes (type !== input.type branch)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":3,"action_type":"RATING_PROMPT_CUSTOMER","projector_source":"update","ts":"2026-09-07T10:45:32.088Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2misSemanticNoOp — early-exit branches[2m > [22m[2mis NOT a no-op when expiresAt changes (expiresAt !== input.expiresAt branch)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T10:45:32.088Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2misSemanticNoOp — early-exit branches[2m > [22m[2mis NOT a no-op when priority changes (priority !== input.priority branch)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T10:45:32.088Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2misSemanticNoOp — early-exit branches[2m > [22m[2mtreats missing payload on both sides as equal (payload ?? {} branch)
[22m[39m{"event":"pending_action_stale_drop","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","existing_version":2,"incoming_version":2,"ts":"2026-09-07T10:45:32.088Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP2-5: upsertAction reactivates RESOLVED/EXPIRED actions[2m > [22m[2msets status=ACTIVE when upserting into an existing RESOLVED action
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":4,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T10:45:32.088Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP2-5: upsertAction reactivates RESOLVED/EXPIRED actions[2m > [22m[2msets status=ACTIVE when upserting into an existing EXPIRED action
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":3,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T10:45:32.089Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP1-3: emitFcmForAction includes legacy-client compat fields[2m > [22m[2mincludes bookingId top-level for ADDON_APPROVAL_REQUESTED
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T10:45:32.089Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T10:45:32.089Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP1-3: emitFcmForAction includes legacy-client compat fields[2m > [22m[2mincludes bookingId top-level for RATING_PROMPT_CUSTOMER
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T10:45:32.089Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T10:45:32.089Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP1-3: emitFcmForAction includes legacy-client compat fields[2m > [22m[2mincludes overall top-level (as string) for RATING_RECEIVED
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T10:45:32.089Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T10:45:32.089Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP1-3: emitFcmForAction includes legacy-client compat fields[2m > [22m[2mdoes NOT add bookingId for action types that do not need it
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T10:45:32.089Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T10:45:32.089Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP1-3: emitFcmForAction includes legacy-client compat fields[2m > [22m[2msame change-feed event delivered twice → no version bump
[22m[39m{"event":"pending_action_stale_drop","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","existing_version":1,"incoming_version":1,"ts":"2026-09-07T10:45:32.090Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2m_transitionStatus — ETag fallback and retry exhaustion[2m > [22m[2mfalls back to empty etag string when _etag is undefined on resolveAction
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"transition_to_resolved","ts":"2026-09-07T10:45:32.090Z"}

 [32m✓[39m tests/services/commission-allocator.apply.test.ts [2m([22m[2m17 tests[22m[2m)[22m[90m 14[2mms[22m[39m
 [32m✓[39m tests/webhooks/razorpay-webhook.test.ts [2m([22m[2m16 tests[22m[2m)[22m[90m 20[2mms[22m[39m
 [32m✓[39m tests/functions/active-job.test.ts [2m([22m[2m20 tests[22m[2m)[22m[33m 627[2mms[22m[39m
 [32m✓[39m tests/services/commission-settlement.service.test.ts [2m([22m[2m28 tests[22m[2m)[22m[90m 14[2mms[22m[39m
 [32m✓[39m tests/services/commission-view.service.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 11[2mms[22m[39m
[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings with applyCredit=true — partial credit Razorpay (AC-3 / P1-6)[2m > [22m[2mP1-6: does NOT call applyCredit at booking-creation time for partial Razorpay credit
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings with applyCredit=true — partial credit Razorpay (AC-3 / P1-6)[2m > [22m[2mwhen balance > basePrice the full-credit (P1-5) path fires: requiresPayment=false, applyCredit called
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings with applyCredit=true — full credit covers price (P1-5)[2m > [22m[2mP1-5: skips Razorpay order creation when credit covers full price
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

 [32m✓[39m tests/unit/pending-action-projector.test.ts [2m([22m[2m30 tests[22m[2m)[22m[33m 733[2mms[22m[39m
[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings with applyCredit=true — full credit covers price (P1-5)[2m > [22m[2mP1-5: dispatches booking immediately after full-credit PAID (no payment event needed)
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings with applyCredit=true — zero balance (AC-4)[2m > [22m[2mreturns 201 with appliedCreditAmount=0 and does not write ledger entry
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings with applyCredit absent / false[2m > [22m[2mdoes not query balance when applyCredit is absent
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings with applyCredit absent / false[2m > [22m[2mdoes not query balance when applyCredit=false
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — idempotency-key (AC-5)[2m > [22m[2mproceeds with partial credit deferred when key is present
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — concurrent applyCredit race for full-credit path (AC-6 / P1-1 / P1-5)[2m > [22m[2mP1-1: returns 409 CREDIT_RACE when applyCredit throws 412 (etag conflict — full-credit path)
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — wallet credit feature flag off[2m > [22m[2mignores applyCredit=true when feature flag is off
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — service-area gating (E16-S01 regression guard)[2m > [22m[2mreturns 400 when location is out of service area and gating is enabled
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m28.6[39m,
  lng: [33m77.2[39m,
  inside: [33mfalse[39m,
  mode: [32m'fail'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — P1-1 verify-before-PAID (full-credit path)[2m > [22m[2mP1-1a: marks PAID and dispatches when applied amount equals expected credit
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — P1-1 verify-before-PAID (full-credit path)[2m > [22m[2mP1-1b: returns 409 CREDIT_RACE when applyCredit returns 0 (all retries exhausted)
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — P1-1 verify-before-PAID (full-credit path)[2m > [22m[2mP1-1c: returns 409 CREDIT_RACE when applyCredit returns partial amount (balance shifted)
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — P1-2 reserve-before-Razorpay (partial credit path)[2m > [22m[2mP1-2a: calls reserveCredit BEFORE creating the Razorpay order
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — P1-2 reserve-before-Razorpay (partial credit path)[2m > [22m[2mP1-2b: reserveCredit called with correct customerId, bookingId, and amount
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — P1-2 reserve-before-Razorpay (partial credit path)[2m > [22m[2mP1-2c: idempotent replay (already_reserved) still proceeds to create Razorpay order
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}
[createBooking] credit reservation already exists — idempotent replay {
  customerId: [32m'cust-1'[39m,
  bookingId: [32m'f5952ada-7667-4bef-a54c-09b5210c60ae'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — P1-2 reserve-before-Razorpay (partial credit path)[2m > [22m[2mP1-2d: reserveCredit NOT called when pendingCreditAmount is 0
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

 [32m✓[39m tests/bookings/create-apply-credit.test.ts [2m([22m[2m19 tests[22m[2m)[22m[90m 21[2mms[22m[39m
 [32m✓[39m tests/functions/active-job-location.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 128[2mms[22m[39m
 [32m✓[39m tests/functions/admin/complaints/patch.test.ts [2m([22m[2m17 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/services/commission-hold.service.test.ts [2m([22m[2m27 tests[22m[2m)[22m[90m 12[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/commission-remittances.test.ts [2m([22m[2m17 tests[22m[2m)[22m[90m 17[2mms[22m[39m
 [32m✓[39m tests/kyc/submit-pan-ocr.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 184[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-no-show-detector.test.ts [2m([22m[2m19 tests[22m[2m)[22m[90m 28[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-projectors.test.ts [2m([22m[2m38 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/cosmos/device-token-repository.test.ts [2m([22m[2m19 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/commission-receivables.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/cosmos/audit-log-immutability.test.ts [2m([22m[2m40 tests[22m[2m)[22m[90m 30[2mms[22m[39m
 [32m✓[39m tests/catalogue-admin.test.ts [2m([22m[2m21 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/functions/admin/compliance/ssc-levy.test.ts [2m([22m[2m20 tests[22m[2m)[22m[90m 22[2mms[22m[39m
 [32m✓[39m tests/functions/devices.test.ts [2m([22m[2m17 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-etag.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 8[2mms[22m[39m
[90mstdout[2m | tests/functions/admin/orders/overrides.test.ts[2m > [22m[2mrefundOrderHandler[2m > [22m[2mreturns 202 with REFUND_INITIATED on happy path (stub)
[22m[39mREFUND_INITIATED { orderId: [32m'ord_1'[39m, reason: [32m'Customer unhappy with service'[39m }

 [32m✓[39m tests/functions/admin/orders/overrides.test.ts [2m([22m[2m18 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/cosmos/finance-repository.test.ts [2m([22m[2m14 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/cosmos/orders-repository.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/functions/admin/complaints/sla-timer.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-booking-completed.test.ts [2m([22m[2m19 tests[22m[2m)[22m[90m 16[2mms[22m[39m
 [32m✓[39m tests/unit/ratings.test.ts [2m([22m[2m16 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/bookings/accept-decline.test.ts [2m([22m[2m7 tests[22m[2m)[22m[33m 411[2mms[22m[39m
   [33m[2m✓[22m[39m PATCH /v1/technicians/job-offers/:bookingId/accept[2m > [22mreturns 200 ASSIGNED on first caller [33m375[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/commission-hold-override.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 16[2mms[22m[39m
 [32m✓[39m tests/kyc/kyc-status.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 223[2mms[22m[39m
 [32m✓[39m tests/unit/technician-dashboard.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/cosmos/cross-partition-tenant-filter.test.ts [2m([22m[2m21 tests[22m[2m)[22m[90m 50[2mms[22m[39m
 [32m✓[39m tests/schemas/catalogue-bilingual.test.ts [2m([22m[2m30 tests[22m[2m)[22m[90m 12[2mms[22m[39m
 [32m✓[39m tests/functions/admin/users/patch.test.ts [2m([22m[2m18 tests[22m[2m)[22m[90m 18[2mms[22m[39m
 [32m✓[39m tests/unit/earnings-cash.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/functions/complaints/partner-create.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/integration/auth.integration.test.ts [2m([22m[2m14 tests[22m[2m)[22m[90m 68[2mms[22m[39m
 [32m✓[39m tests/unit/commission-config.service.test.ts [2m([22m[2m20 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/webhooks/razorpay-webhook-credit.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 17[2mms[22m[39m
 [32m✓[39m tests/functions/job-offers-expire-stale.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/unit/users-erasure-request.test.ts [2m([22m[2m10 tests[22m[2m)[22m[33m 1501[2mms[22m[39m
   [33m[2m✓[22m[39m POST /v1/users/me/erasure-request[2m > [22mreturns 401 without Authorization [33m1389[2mms[22m[39m
 [32m✓[39m tests/unit/pending-actions-read-api.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 3[2mms[22m[39m
[90mstdout[2m | tests/unit/functions/bookings-slot-gate.test.ts[2m > [22m[2mE16-S02: slot-hold gate in POST /v1/bookings[2m > [22m[2mproceeds normally when createHold returns a hold doc
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/unit/functions/bookings-slot-gate.test.ts[2m > [22m[2mE16-S02: slot-hold gate in POST /v1/bookings[2m > [22m[2mreturns 409 SLOT_UNAVAILABLE when createHold returns CONFLICT
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/unit/functions/bookings-slot-gate.test.ts[2m > [22m[2mE16-S02: slot-hold gate in POST /v1/bookings[2m > [22m[2mreturns 422 INVALID_SLOT_WINDOW when slotWindow is not in generated slots
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

 [32m✓[39m tests/unit/dataExport-service.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 86[2mms[22m[39m
[90mstdout[2m | tests/unit/functions/bookings-slot-gate.test.ts[2m > [22m[2mE16-S02: slot-hold gate in POST /v1/bookings[2m > [22m[2mreturns 201 and captures Sentry error when commitHold rejects (non-fatal)
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/unit/functions/bookings-slot-gate.test.ts[2m > [22m[2mE16-S02: slot-hold gate in POST /v1/bookings[2m > [22m[2mreturns 409 SLOT_UNAVAILABLE when an existing booking already occupies the window
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/unit/functions/bookings-slot-gate.test.ts[2m > [22m[2mE16-S02: slot-hold gate in POST /v1/bookings[2m > [22m[2mcalls commitHold with holdId and bookingId after successful booking
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

 [32m✓[39m tests/unit/functions/bookings-slot-gate.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 33[2mms[22m[39m
 [32m✓[39m tests/unit/admin-erasure-execute.test.ts [2m([22m[2m7 tests[22m[2m)[22m[33m 1295[2mms[22m[39m
   [33m[2m✓[22m[39m PATCH /v1/admin/erasure-requests/:id (EXECUTE)[2m > [22mreturns 404 when erasure request does not exist [33m1244[2mms[22m[39m
 [32m✓[39m tests/cosmos/finance-pnl-truth.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/services/fcm.service.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 6[2mms[22m[39m
[90mstdout[2m | tests/bookings/create-service-area.test.ts[2m > [22m[2mPOST /v1/bookings — service-area gating (E16-S01)[2m > [22m[2mAC-1: inside-polygon address proceeds normally (Razorpay path)
[22m[39mservice_area_check {
  customerId: [32m'cust-area-1'[39m,
  lat: [33m26.7958[39m,
  lng: [33m82.1947[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create-service-area.test.ts[2m > [22m[2mPOST /v1/bookings — service-area gating (E16-S01)[2m > [22m[2mAC-2: outside-polygon + flag ON → 400 SERVICE_NOT_AVAILABLE_AT_LOCATION
[22m[39mservice_area_check {
  customerId: [32m'cust-area-1'[39m,
  lat: [33m28.6315[39m,
  lng: [33m77.2167[39m,
  inside: [33mfalse[39m,
  mode: [32m'fail'[39m
}

[90mstdout[2m | tests/bookings/create-service-area.test.ts[2m > [22m[2mPOST /v1/bookings — service-area gating (E16-S01)[2m > [22m[2minside-polygon + flag ON → 201 (flag only applies to out-of-area)
[22m[39mservice_area_check {
  customerId: [32m'cust-area-1'[39m,
  lat: [33m26.7958[39m,
  lng: [33m82.1947[39m,
  inside: [33mtrue[39m,
  mode: [32m'fail'[39m
}

 [32m✓[39m tests/bookings/create-service-area.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 10[2mms[22m[39m
[90mstdout[2m | tests/bookings/create.test.ts[2m > [22m[2mPOST /v1/bookings[2m > [22m[2mreturns 201 with bookingId, razorpayOrderId, amount
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m12[39m,
  lng: [33m77[39m,
  inside: [33mfalse[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create.test.ts[2m > [22m[2mPOST /v1/bookings[2m > [22m[2mcreates a cash-on-service booking without creating a Razorpay order
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m12[39m,
  lng: [33m77[39m,
  inside: [33mfalse[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create.test.ts[2m > [22m[2mPOST /v1/bookings[2m > [22m[2mcreates a manual-payment booking when Razorpay is not configured
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m12[39m,
  lng: [33m77[39m,
  inside: [33mfalse[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create.test.ts[2m > [22m[2mPOST /v1/bookings[2m > [22m[2mcreates a manual-payment booking when Razorpay uses deployed placeholder values
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m12[39m,
  lng: [33m77[39m,
  inside: [33mfalse[39m,
  mode: [32m'warn-only'[39m
}

[90mstdout[2m | tests/bookings/create.test.ts[2m > [22m[2mPOST /v1/bookings[2m > [22m[2mreturns a structured payment error when Razorpay order creation fails
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m12[39m,
  lng: [33m77[39m,
  inside: [33mfalse[39m,
  mode: [32m'warn-only'[39m
}

 [32m✓[39m tests/bookings/create.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 20[2mms[22m[39m
[90mstdout[2m | tests/bookings/create.test.ts[2m > [22m[2mPOST /v1/bookings[2m > [22m[2mreturns 404 when service not found
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m0[39m,
  lng: [33m0[39m,
  inside: [33mfalse[39m,
  mode: [32m'warn-only'[39m
}

 [32m✓[39m tests/cosmos/rate-limit-repository.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/functions/technician-bookings.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 65[2mms[22m[39m
 [32m✓[39m tests/functions/wallet.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/catalogue-public.test.ts [2m([22m[2m12 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/catalogue-patch-semantics.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/unit/earnings.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/functions/rating-escalate.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/unit/technicians.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/bookings/price-approval.test.ts [2m([22m[2m13 tests[22m[2m)[22m[90m 16[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/mark-commission-received.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/middleware/requireIntegrity.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 26[2mms[22m[39m
 [32m✓[39m tests/waitlist.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/integration/admin-routes-unauth.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 30[2mms[22m[39m
 [32m✓[39m tests/unit/users-data-export.test.ts [2m([22m[2m5 tests[22m[2m)[22m[33m 1317[2mms[22m[39m
   [33m[2m✓[22m[39m GET /v1/users/me/data-export[2m > [22mreturns 401 when Authorization header is missing [33m1241[2mms[22m[39m
 [32m✓[39m tests/unit/earnings.service.test.ts [2m([22m[2m17 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/functions/services-availability.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/functions/webhook-fast-path.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/unit/withRateLimit.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m tests/unit/sos.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/functions/admin/catalogue/commission-config.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 15[2mms[22m[39m
 [32m✓[39m tests/webhooks/razorpay-webhook-branch-coverage.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/services/formRecognizer.service.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 37[2mms[22m[39m
 [32m✓[39m tests/cosmos/system-docs-repository.test.ts [2m([22m[2m12 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/functions/admin/auth/login.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 14[2mms[22m[39m
 [32m✓[39m tests/unit/payouts-kill-switch.test.ts [2m([22m[2m18 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/unit/admin-erasure-deny.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 98[2mms[22m[39m
 [32m✓[39m tests/bookings/bookings-get-photos.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-applyAddOnDecisions.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/functions/auth/truecaller-verify.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 101[2mms[22m[39m
 [32m✓[39m tests/services/admin-session-rotate.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-addPhoto.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/kyc/submit-aadhaar.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 114[2mms[22m[39m
 [32m✓[39m tests/technicians/active-job-photos.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-reconcile-payouts.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/unit/tech-ratings.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 9[2mms[22m[39m
[90mstdout[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2mfinds zero overdue → no-op
[22m[39mprocessOverdueErasures: 0 overdue PENDING request(s) at 2026-09-07T10:45:37.935Z
processOverdueErasures done: processed=0 executed=0 failed=0 skipped=0

[90mstdout[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2mprocesses overdue PENDING requests, runs cascade, marks EXECUTED
[22m[39mprocessOverdueErasures: 2 overdue PENDING request(s) at 2026-09-07T10:45:37.946Z
processOverdueErasures done: processed=2 executed=2 failed=0 skipped=0

[90mstdout[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2misolates per-request failures: one cascade error does not abort the batch
[22m[39mprocessOverdueErasures: 3 overdue PENDING request(s) at 2026-09-07T10:45:37.955Z
processOverdueErasures done: processed=3 executed=2 failed=1 skipped=0

[90mstdout[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2mskips entries that no longer exist or have changed status (race-free)
[22m[39mprocessOverdueErasures: 1 overdue PENDING request(s) at 2026-09-07T10:45:37.966Z
processOverdueErasures done: processed=1 executed=0 failed=0 skipped=1

 [32m✓[39m tests/integration/erasure-cron.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1476[2mms[22m[39m
   [33m[2m✓[22m[39m trigger-erasure-deadline (Azure timer trigger)[2m > [22mfinds zero overdue → no-op [33m1446[2mms[22m[39m
 [32m✓[39m tests/unit/rating-appeal.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/slot-holds-repository.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/functions/config/technician.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/integration/handlers.integration.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 25[2mms[22m[39m
 [32m✓[39m tests/middleware/withRateLimit.keyExtractor.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/cosmos/commission-config-repository.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/approve-payouts.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-requestAddOn.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/bookings/branch-coverage.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/functions/technicians/commission-due.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-next-day-payout.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m tests/unit/shield-report.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/functions/admin/sos/playback-token.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/unit/adminUser.service.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/functions/complaints/partner-get.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/services/truecaller.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/integration/dpdp-data-inventory.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 19[2mms[22m[39m
 [32m✓[39m tests/services/service-area.service.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/services/fcm-technician.service.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/schemas/finance.test.ts [2m([22m[2m18 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/catalogue-seed.test.ts [2m([22m[2m53 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/functions/admin/dashboard/summary.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 41[2mms[22m[39m
 [32m✓[39m tests/unit/launch-gate.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/technicians/confidence-score.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-markPaid.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/report-data.service.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/integration/dispatcher-up-ranking.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/functions/admin/auth/setup-totp.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/functions/technician-availability.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 418[2mms[22m[39m
   [33m[2m✓[22m[39m technician availability handlers[2m > [22mreturns current technician availability [33m413[2mms[22m[39m
 [32m✓[39m tests/kyc/submit-aadhaar-idor.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 46[2mms[22m[39m
 [32m✓[39m tests/functions/sos-key.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/cosmos/client-retry.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 12[2mms[22m[39m
 [32m✓[39m tests/unit/requireAdmin.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 43[2mms[22m[39m
 [32m✓[39m tests/middleware/withCorrelationId.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/observability/sentry-before-send.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/functions/admin/dashboard/feed.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/unit/payout-cadence.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/functions/admin/audit-log/list.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 21[2mms[22m[39m
 [32m✓[39m tests/integration/dispatcher-data-isolation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-service-report.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/static/ledger-batch-only.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 85[2mms[22m[39m
 [32m✓[39m tests/services/piiCrypto.service.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-updateBookingFields.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/catalogue-repository.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/schemas/commission-receivable.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/functions/admin/dashboard/tech-locations.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/functions/admin/complaints/create.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/unit/rating-repository.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/cosmos/live-location-repository.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-confirmPayment.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/functions/users-erasure-request.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/cosmos/audit-log-repository.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/unit/acs-email.service.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/services/commission-allocator.pure.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/technician-geospatial.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/unit/adminSession.service.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/booking-repository.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/bookings/confirm.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/schemas/audit-log.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/integration/rbac.integration.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 43[2mms[22m[39m
 [32m✓[39m tests/unit/auditLog.service.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/openapi/registry-e21-s02.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 29[2mms[22m[39m
 [32m✓[39m tests/unit/verifyTechnicianToken.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/schemas/webhook.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/bookings/list.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 546[2mms[22m[39m
   [33m[2m✓[22m[39m GET /v1/bookings[2m > [22mreturns current customer bookings with service names and final amount [33m545[2mms[22m[39m
 [32m✓[39m tests/services/pan.utils.test.ts [2m([22m[2m16 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/schemas/order.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/unit/shared/slot-utils.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/jwt.service.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 17[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/commission-routes-rbac.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/scripts/seed-technicians.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/cosmos/dispatch-attempt-repository.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-getByPaymentOrderId.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/services/razorpayRoute.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/schemas/booking.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/services/dispatcher.service.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/scripts/backfill-commission-holds.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/unit/schemas/technician.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/schemas/commission-config.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/geo.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-getStaleSearching.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/schemas/commission-ledger.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/functions/admin/complaints/list.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/schemas/live-location.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/schemas/service-category.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/schemas/kyc.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/summary.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/lib/ist-time.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/unit/schemas/slot-hold.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 12[2mms[22m[39m
 [32m✓[39m tests/schemas/service.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/integration/audit-log-coverage-invariant.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/functions/integrity/nonce.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 1202[2mms[22m[39m
   [33m[2m✓[22m[39m GET /v1/integrity/nonce[2m > [22mreturns 200 with a nonce field that is a valid UUID v4 [33m1181[2mms[22m[39m
 [32m✓[39m tests/unit/totp.service.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/unit/commission.service.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/functions/admin/orders/candidates.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/shared/timing-safe.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/functions/admin/complaints/repeat-offenders.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-rating-prompt.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 32[2mms[22m[39m
 [32m✓[39m tests/unit/semgrep-fcm-ordering.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 467[2mms[22m[39m
   [33m[2m✓[22m[39m Semgrep FCM ordering invariant[2m > [22mpending-action-projector exports both upsertAction and emitFcmForAction [33m466[2mms[22m[39m
 [32m✓[39m tests/schemas/commission-config-v2.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/requireCustomer.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/cosmos/retry-utils.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/customer-credit-repository.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/functions/admin/orders/list.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/functions/admin/orders/detail.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/cosmos/seed-merge.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/unit/pdf-generator.service.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 57[2mms[22m[39m
 [32m✓[39m tests/unit/razorpay.service.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 2[2mms[22m[39m
 [32m✓[39m tests/services/auditLog.service.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-hasActiveBookingForTechnician.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 2[2mms[22m[39m
 [32m✓[39m tests/observability.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/zod-pattern.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/functions/admin/users/list.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/version.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 2[2mms[22m[39m
 [32m✓[39m tests/unit/cookies.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/shared/address-text.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 1[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/payout-queue.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/functions/timers/prune-device-tokens.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/health.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/weekly-aggregate.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/openapi-build.test.ts [2m([22m[2m6 tests[22m[2m)[22m[33m 2936[2mms[22m[39m
   [33m[2m✓[22m[39m openapi:build[2m > [22mis byte-deterministic across two runs [33m708[2mms[22m[39m

[2m Test Files [22m [1m[32m210 passed[39m[22m[90m (210)[39m
[2m      Tests [22m [1m[32m1947 passed[39m[22m[90m (1947)[39m
[2m   Start at [22m 06:45:31
[2m   Duration [22m 13.19s[2m (transform 16.37s, setup 0ms, collect 97.76s, tests 15.97s, environment 31ms, prepare 20.29s)[22m

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mGET /v1/technicians/active-job/:bookingId[2m > [22m[2mreturns 200 with enriched booking for assigned technician
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mGET /v1/technicians/active-job/:bookingId[2m > [22m[2mreturns 403 if booking.technicianId !== caller uid
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mGET /v1/technicians/active-job/:bookingId[2m > [22m[2mreturns 404 when booking not found
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mreturns 200 when ASSIGNED → EN_ROUTE (legal one-step forward)
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mreturns 409 when ASSIGNED → IN_PROGRESS (skips a step)
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mreturns 403 when caller is not the assigned technician
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mappends STATUS_TRANSITION BookingEvent with from/to metadata
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2msends LOCATION_UPDATE when transition includes technician GPS
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mreturns 200 and fires Sentry warning when attestation.isMock is true
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mdoes NOT fire Sentry warning when attestation.isMock is false
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mdoes NOT fire Sentry warning when attestation is absent
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mE21-S01: cash collection on COMPLETED transition[2m > [22m[2msets cashCollectionStatus=COLLECTED when cashCollected=true
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mE21-S01: cash collection on COMPLETED transition[2m > [22m[2mdoes NOT set cashCollectionStatus when cashCollected is absent
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mE21-S02: synchronous settlement + collectionMethod + cash audit[2m > [22m[2mpatches all four cash fields, calls settleCashCompletion with the updated booking, and writes CASH_COLLECTION_RECORDED audit
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/webhooks/razorpay-webhook.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "razorpayWebhook" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "reconcileStaleBookings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mE21-S02: synchronous settlement + collectionMethod + cash audit[2m > [22m[2mstill returns 200 and captures the error in Sentry when settleCashCompletion rejects
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mE21-S02: synchronous settlement + collectionMethod + cash audit[2m > [22m[2mdoes not write an audit entry when cashCollected is absent, but still calls settlement
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mE21-S02: synchronous settlement + collectionMethod + cash audit[2m > [22m[2mdoes not call the settlement service for non-COMPLETED transitions
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mE21-S02: synchronous settlement + collectionMethod + cash audit[2m > [22m[2mcalls settleCashCompletion with the updated booking even when paymentMethod is RAZORPAY (the guard against recording a cash receivable and recomputing the hold lives inside settleCashCompletion — see commission-settlement.service.test.ts)
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mE21-S02: synchronous settlement + collectionMethod + cash audit[2m > [22m[2mdefaults collectionMethod to CASH when cashCollected=true and no collectionMethod is given
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mE21-S02: synchronous settlement + collectionMethod + cash audit[2m > [22m[2mreturns 400 for an invalid collectionMethod
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/create-apply-credit.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "createBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "confirmBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyBookings" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "requestAddon" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveFinalPrice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "cancelBooking" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — concurrent applyCredit race for full-credit path (AC-6 / P1-1 / P1-5)[2m > [22m[2mP1-1: returns 409 CREDIT_RACE when applyCredit throws 412 (etag conflict — full-credit path)
[22m[39m[createBooking] applyCredit 412 conflict — proceeding without credit { customerId: [32m'cust-1'[39m, bookingId: [32m'bk-100'[39m }
[createBooking] full-credit path: applied amount < expected; rejecting with 409 {
  customerId: [32m'cust-1'[39m,
  bookingId: [32m'bk-100'[39m,
  expected: [33m59900[39m,
  applied: [33m0[39m
}

[90mstderr[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — P1-1 verify-before-PAID (full-credit path)[2m > [22m[2mP1-1b: returns 409 CREDIT_RACE when applyCredit returns 0 (all retries exhausted)
[22m[39m[createBooking] full-credit path: applied amount < expected; rejecting with 409 {
  customerId: [32m'cust-1'[39m,
  bookingId: [32m'bk-100'[39m,
  expected: [33m59900[39m,
  applied: [33m0[39m
}

[90mstderr[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — P1-1 verify-before-PAID (full-credit path)[2m > [22m[2mP1-1c: returns 409 CREDIT_RACE when applyCredit returns partial amount (balance shifted)
[22m[39m[createBooking] full-credit path: applied amount < expected; rejecting with 409 {
  customerId: [32m'cust-1'[39m,
  bookingId: [32m'bk-100'[39m,
  expected: [33m59900[39m,
  applied: [33m40000[39m
}

[90mstderr[2m | tests/functions/active-job-location.test.ts[2m > [22m[2mPOST /v1/technicians/active-job/:bookingId/location[2m > [22m[2mreturns 401 for missing/invalid JWT
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "activeJobLocation" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job-location.test.ts[2m > [22m[2mPOST /v1/technicians/active-job/:bookingId/location[2m > [22m[2mreturns 404 when booking not found
[22m[39mWARNING: Skipping call to register function "activeJobLocation" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job-location.test.ts[2m > [22m[2mPOST /v1/technicians/active-job/:bookingId/location[2m > [22m[2mreturns 403 when booking.technicianId !== caller uid
[22m[39mWARNING: Skipping call to register function "activeJobLocation" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job-location.test.ts[2m > [22m[2mPOST /v1/technicians/active-job/:bookingId/location[2m > [22m[2mreturns 409 BOOKING_NOT_ACTIVE for booking in ASSIGNED status
[22m[39mWARNING: Skipping call to register function "activeJobLocation" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job-location.test.ts[2m > [22m[2mPOST /v1/technicians/active-job/:bookingId/location[2m > [22m[2mreturns 409 BOOKING_NOT_ACTIVE for booking in COMPLETED status
[22m[39mWARNING: Skipping call to register function "activeJobLocation" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job-location.test.ts[2m > [22m[2mPOST /v1/technicians/active-job/:bookingId/location[2m > [22m[2mreturns 400 VALIDATION_ERROR for lat=91
[22m[39mWARNING: Skipping call to register function "activeJobLocation" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job-location.test.ts[2m > [22m[2mPOST /v1/technicians/active-job/:bookingId/location[2m > [22m[2mreturns 400 STALE_FIX for capturedAt older than 90s
[22m[39mWARNING: Skipping call to register function "activeJobLocation" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job-location.test.ts[2m > [22m[2mPOST /v1/technicians/active-job/:bookingId/location[2m > [22m[2mreturns 429 when rate limit exceeded (keyed by uid+bookingId after auth)
[22m[39mWARNING: Skipping call to register function "activeJobLocation" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job-location.test.ts[2m > [22m[2mPOST /v1/technicians/active-job/:bookingId/location[2m > [22m[2mreturns 204, upserts to Cosmos, and calls sendPeriodicLocationPush when flag=on
[22m[39mWARNING: Skipping call to register function "activeJobLocation" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job-location.test.ts[2m > [22m[2mPOST /v1/technicians/active-job/:bookingId/location[2m > [22m[2mreturns 204 and upserts Cosmos but skips FCM when flag=off
[22m[39mWARNING: Skipping call to register function "activeJobLocation" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job-location.test.ts[2m > [22m[2mPOST /v1/technicians/active-job/:bookingId/location[2m > [22m[2mreturns 204 even when FCM publish throws (logged, not propagated)
[22m[39mWARNING: Skipping call to register function "activeJobLocation" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/complaints/patch.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminPatchComplaint" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-pan-ocr.test.ts[2m > [22m[2mPOST /v1/kyc/pan-ocr[2m > [22m[2mreturns 200 with panMaskedNumber on OCR success (cleartext PAN never in response)
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "submitPanOcr" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-pan-ocr.test.ts[2m > [22m[2mPOST /v1/kyc/pan-ocr[2m > [22m[2mreturns 200 with MANUAL_REVIEW on OCR failure
[22m[39mWARNING: Skipping call to register function "submitPanOcr" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-projectors.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerProjectorBookings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-pan-ocr.test.ts[2m > [22m[2mPOST /v1/kyc/pan-ocr[2m > [22m[2m[E19-S01-P2B] MANUAL_REVIEW clears stale panMaskedNumber + panHash from previous successful scan
[22m[39mWARNING: Skipping call to register function "submitPanOcr" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/finance/commission-remittances.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "recordCommissionRemittance" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-pan-ocr.test.ts[2m > [22m[2mPOST /v1/kyc/pan-ocr[2m > [22m[2memits KYC_PAN_VERIFIED audit entry on OCR success
[22m[39mWARNING: Skipping call to register function "submitPanOcr" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-pan-ocr.test.ts[2m > [22m[2mPOST /v1/kyc/pan-ocr[2m > [22m[2memits KYC_PAN_REJECTED audit entry on OCR failure
[22m[39mWARNING: Skipping call to register function "submitPanOcr" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-pan-ocr.test.ts[2m > [22m[2mPOST /v1/kyc/pan-ocr[2m > [22m[2mreturns 401 when token invalid
[22m[39mWARNING: Skipping call to register function "submitPanOcr" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-pan-ocr.test.ts[2m > [22m[2mPOST /v1/kyc/pan-ocr[2m > [22m[2mreturns 422 when request body fails Zod validation
[22m[39mWARNING: Skipping call to register function "submitPanOcr" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-pan-ocr.test.ts[2m > [22m[2mPOST /v1/kyc/pan-ocr[2m > [22m[2m[E19-S01-T1] successful submit stores panMaskedNumber + panHash, clears panNumber + panNumberEncrypted
[22m[39mWARNING: Skipping call to register function "submitPanOcr" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-pan-ocr.test.ts[2m > [22m[2mPOST /v1/kyc/pan-ocr[2m > [22m[2m[E19-S01-T2] patch written to Cosmos must not contain cleartext PAN
[22m[39mWARNING: Skipping call to register function "submitPanOcr" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-pan-ocr.test.ts[2m > [22m[2mPOST /v1/kyc/pan-ocr[2m > [22m[2m[P1-C] returns 403 when token uid does not match requested technicianId (IDOR guard)
[22m[39mWARNING: Skipping call to register function "submitPanOcr" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-projectors.test.ts
[22m[39mWARNING: Skipping call to register function "triggerProjectorRatings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-no-show-detector.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerNoShowDetector" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-projectors.test.ts
[22m[39mWARNING: Skipping call to register function "triggerProjectorKyc" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-projectors.test.ts
[22m[39mWARNING: Skipping call to register function "triggerProjectorDispatchAttempts" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-projectors.test.ts
[22m[39mWARNING: Skipping call to register function "triggerProjectorComplaints" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/finance/commission-receivables.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminCommissionReceivablesDashboard" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminCommissionReceivablesPerTech" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminCommissionReceivablesRecompute" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/catalogue-admin.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminListCategories" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminGetCategory" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminCreateCategory" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminUpdateCategory" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminToggleCategory" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminListServices" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminGetService" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminCreateService" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminUpdateService" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminToggleService" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/compliance/ssc-levy.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "sscLevyQuarterly" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "listSscLevies" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveSscLevy" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/devices.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "customerRegisterDevice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "customerUnregisterDeviceMe" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "customerUnregisterDevice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "technicianRegisterDevice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "technicianUnregisterDevice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminRegisterDevice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminUnregisterDevice" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/orders/overrides.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminReassignOrder" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminCompleteOrder" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminRefundOrder" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminWaiveFeeOrder" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminEscalateOrder" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminNoteOrder" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/complaints/sla-timer.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "slaBreachTimer" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/accept-decline.test.ts[2m > [22m[2mPATCH /v1/technicians/job-offers/:bookingId/accept[2m > [22m[2mreturns 200 ASSIGNED on first caller
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "acceptJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "declineJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "expireStaleOffers" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-booking-completed.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerBookingCompleted" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/ratings.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "submitRating" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getRating" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/accept-decline.test.ts[2m > [22m[2mPATCH /v1/technicians/job-offers/:bookingId/accept[2m > [22m[2mreturns 409 when _etag race lost (acceptAttempt returns null)
[22m[39mWARNING: Skipping call to register function "acceptJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "declineJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "expireStaleOffers" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/accept-decline.test.ts[2m > [22m[2mPATCH /v1/technicians/job-offers/:bookingId/accept[2m > [22m[2mreturns 410 when offer expiresAt has already passed
[22m[39mWARNING: Skipping call to register function "acceptJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "declineJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "expireStaleOffers" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/accept-decline.test.ts[2m > [22m[2mPATCH /v1/technicians/job-offers/:bookingId/accept[2m > [22m[2mreturns 403 when technicianId not in attempt.technicianIds
[22m[39mWARNING: Skipping call to register function "acceptJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "declineJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "expireStaleOffers" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/accept-decline.test.ts[2m > [22m[2mPATCH /v1/technicians/job-offers/:bookingId/accept[2m > [22m[2mreturns 410 when attempt status is not PENDING
[22m[39mWARNING: Skipping call to register function "acceptJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "declineJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "expireStaleOffers" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/accept-decline.test.ts[2m > [22m[2mPATCH /v1/technicians/job-offers/:bookingId/decline[2m > [22m[2mreturns 200 DECLINED, records attempt decline, and continues dispatch
[22m[39mWARNING: Skipping call to register function "acceptJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "declineJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "expireStaleOffers" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/accept-decline.test.ts[2m > [22m[2mPATCH /v1/technicians/job-offers/:bookingId/decline[2m > [22m[2mappends TECH_DECLINED event with no ranking field
[22m[39mWARNING: Skipping call to register function "acceptJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "declineJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "expireStaleOffers" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/kyc-status.test.ts[2m > [22m[2mGET /v1/kyc/status[2m > [22m[2mreturns 200 with KYC status for authenticated technician
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getKycStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/kyc-status.test.ts[2m > [22m[2mGET /v1/kyc/status[2m > [22m[2mreturns 404 when no KYC record found
[22m[39mWARNING: Skipping call to register function "getKycStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/finance/commission-hold-override.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "setCommissionHoldOverride" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "clearCommissionHoldOverride" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/kyc-status.test.ts[2m > [22m[2mGET /v1/kyc/status[2m > [22m[2mreturns 401 on invalid token
[22m[39mWARNING: Skipping call to register function "getKycStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/kyc-status.test.ts[2m > [22m[2mGET /v1/kyc/status[2m > [22m[2m[P1-B] returns 403 when token uid does not match requested technicianId (IDOR guard)
[22m[39mWARNING: Skipping call to register function "getKycStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/kyc-status.test.ts[2m > [22m[2mGET /v1/kyc/status[2m > [22m[2m[T10] response does NOT expose panNumberEncrypted (encrypted blob stays server-side)
[22m[39mWARNING: Skipping call to register function "getKycStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/kyc-status.test.ts[2m > [22m[2mGET /v1/kyc/status[2m > [22m[2m[E19-S01 / S-001] non-canonical panNumber (already-masked #### format) escalates to MANUAL_REVIEW — never returns raw value
[22m[39mWARNING: Skipping call to register function "getKycStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/kyc-status.test.ts[2m > [22m[2mGET /v1/kyc/status[2m > [22m[2m[S-001-Codex] non-canonical panMaskedNumber (#### legacy format) escalates to MANUAL_REVIEW
[22m[39mWARNING: Skipping call to register function "getKycStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/kyc-status.test.ts[2m > [22m[2mGET /v1/kyc/status[2m > [22m[2m[S-001] OCR-noise panNumber (interior space) returns null — never exposes raw PAN
[22m[39mWARNING: Skipping call to register function "getKycStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/kyc-status.test.ts[2m > [22m[2mGET /v1/kyc/status[2m > [22m[2m[E19-S01-P2A] applies maskPan to raw canonical panNumber in legacy docs to avoid raw PAN exposure
[22m[39mWARNING: Skipping call to register function "getKycStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/technician-dashboard.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "technicianDashboard" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/auth.integration.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminLogin" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/users/patch.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminPatchUser" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/earnings-cash.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getEarnings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/auth.integration.test.ts
[22m[39m[SECURITY] ADMIN_SETUP_SECRET is not set — TOTP setup endpoint is open to any caller. Set this env var before production deploy.
WARNING: Skipping call to register function "adminSetupTotpGet" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminSetupTotpPost" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/complaints/partner-create.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "partnerCreateComplaint" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/webhooks/razorpay-webhook-credit.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "razorpayWebhook" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "reconcileStaleBookings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/webhooks/razorpay-webhook-credit.test.ts[2m > [22m[2mrazorpayWebhook — deferred wallet credit application (P1-6)[2m > [22m[2mP1-6d: credit application error is non-fatal — booking stays PAID and Sentry is notified
[22m[39m[razorpayWebhook] deferred credit application failed {
  bookingId: [32m'bk-credit-fail'[39m,
  pendingCreditAmountInPaise: [33m50000[39m,
  idempotencyKey: [32m'idem-key-fail'[39m,
  err: Error: Cosmos apply credit failed
      at [90mC:\Alok\Business Projects\wt-fix-cosmos-pages\api\[39mtests\webhooks\razorpay-webhook-credit.test.ts:191:43
      at [90mfile:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:146:14
      at [90mfile:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:533:11
      at runWithTimeout [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:39:7[90m)[39m
      at runTest [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1056:17[90m)[39m
  [90m    at processTicksAndRejections (node:internal/process/task_queues:103:5)[39m
      at runSuite [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1205:15[90m)[39m
      at runSuite [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1205:15[90m)[39m
      at runFiles [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1262:5[90m)[39m
      at startTests [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1271:3[90m)[39m
}

[90mstderr[2m | tests/unit/users-erasure-request.test.ts[2m > [22m[2mPOST /v1/users/me/erasure-request[2m > [22m[2mreturns 401 without Authorization
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "usersErasureRequestSubmit" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "usersErasureRequestRevoke" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-erasure-request.test.ts[2m > [22m[2mPOST /v1/users/me/erasure-request[2m > [22m[2mreturns 400 when confirmationPhrase is missing
[22m[39mWARNING: Skipping call to register function "usersErasureRequestSubmit" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "usersErasureRequestRevoke" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-erasure-request.test.ts[2m > [22m[2mPOST /v1/users/me/erasure-request[2m > [22m[2mreturns 400 when confirmationPhrase is wrong (defends against accidental deletion)
[22m[39mWARNING: Skipping call to register function "usersErasureRequestSubmit" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "usersErasureRequestRevoke" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-erasure-request.test.ts[2m > [22m[2mPOST /v1/users/me/erasure-request[2m > [22m[2mreturns 400 when confirmationPhrase is "DELETE" alone
[22m[39mWARNING: Skipping call to register function "usersErasureRequestSubmit" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "usersErasureRequestRevoke" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-erasure-request.test.ts[2m > [22m[2mPOST /v1/users/me/erasure-request[2m > [22m[2mreturns 409 when a PENDING erasure request already exists for the user
[22m[39mWARNING: Skipping call to register function "usersErasureRequestSubmit" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "usersErasureRequestRevoke" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-erasure-request.test.ts[2m > [22m[2mPOST /v1/users/me/erasure-request[2m > [22m[2mreturns 201 with erasureId "pending:{uid}" and scheduledDeletionAt 7 days out
[22m[39mWARNING: Skipping call to register function "usersErasureRequestSubmit" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "usersErasureRequestRevoke" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-erasure-request.test.ts[2m > [22m[2mPOST /v1/users/me/erasure-request[2m > [22m[2mwrites ERASURE_REQUESTED audit log entry
[22m[39mWARNING: Skipping call to register function "usersErasureRequestSubmit" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "usersErasureRequestRevoke" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-erasure-request.test.ts[2m > [22m[2mDELETE /v1/users/me/erasure-request[2m > [22m[2mreturns 401 without Authorization
[22m[39mWARNING: Skipping call to register function "usersErasureRequestSubmit" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "usersErasureRequestRevoke" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-erasure-request.test.ts[2m > [22m[2mDELETE /v1/users/me/erasure-request[2m > [22m[2mreturns 404 when no PENDING request exists
[22m[39mWARNING: Skipping call to register function "usersErasureRequestSubmit" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "usersErasureRequestRevoke" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-erasure-request.test.ts[2m > [22m[2mDELETE /v1/users/me/erasure-request[2m > [22m[2mreturns 204 and marks request REVOKED with etag-guarded replace + audit entry
[22m[39mWARNING: Skipping call to register function "usersErasureRequestSubmit" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "usersErasureRequestRevoke" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/functions/bookings-slot-gate.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "createBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "confirmBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyBookings" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "requestAddon" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveFinalPrice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "cancelBooking" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/functions/bookings-slot-gate.test.ts[2m > [22m[2mE16-S02: slot-hold gate in POST /v1/bookings[2m > [22m[2mreturns 201 and captures Sentry error when commitHold rejects (non-fatal)
[22m[39m[createBooking] commitHold failed (non-fatal) {
  holdId: [32m'svc-ac|2026-05-20|10:00-11:00'[39m,
  bookingId: [32m'bk-1'[39m,
  err: Error: Cosmos timeout
      at [90mC:\Alok\Business Projects\wt-fix-cosmos-pages\api\[39mtests\unit\functions\bookings-slot-gate.test.ts:211:38
      at [90mfile:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:146:14
      at [90mfile:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:533:11
      at runWithTimeout [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:39:7[90m)[39m
      at runTest [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1056:17[90m)[39m
  [90m    at processTicksAndRejections (node:internal/process/task_queues:103:5)[39m
      at runSuite [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1205:15[90m)[39m
      at runSuite [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1205:15[90m)[39m
      at runFiles [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1262:5[90m)[39m
      at startTests [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1271:3[90m)[39m
}

[90mstderr[2m | tests/services/fcm.service.test.ts[2m > [22m[2msendOwnerSosAlert[2m > [22m[2msendOwnerSosAlert_does_not_leak_address_in_fcm_payload
[22m[39m[FCM] no admin device tokens, falling back to owner_alerts topic

[90mstderr[2m | tests/services/fcm.service.test.ts[2m > [22m[2msendAbusiveShieldAlert[2m > [22m[2mdoes not include customerId in the FCM payload
[22m[39m[FCM] no admin device tokens, falling back to owner_alerts topic

[90mstderr[2m | tests/services/fcm.service.test.ts[2m > [22m[2msendBookingStatusUpdatePush — device-token send[2m > [22m[2mfans out to customer device tokens
[22m[39m[FCM] stale single token for user cust-20, skipping send

[90mstderr[2m | tests/bookings/create-service-area.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "createBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "confirmBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyBookings" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "requestAddon" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveFinalPrice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "cancelBooking" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/create.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "createBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "confirmBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyBookings" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "requestAddon" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveFinalPrice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "cancelBooking" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/create.test.ts[2m > [22m[2mPOST /v1/bookings[2m > [22m[2mreturns a structured payment error when Razorpay order creation fails
[22m[39m[createBooking] Razorpay order creation failed {
  customerId: [32m'cust-1'[39m,
  serviceId: [32m'svc-1'[39m,
  err: {
    statusCode: [33m401[39m,
    error: { code: [32m'BAD_REQUEST_ERROR'[39m, description: [32m'Authentication failed'[39m }
  }
}

[90mstderr[2m | tests/functions/technician-bookings.test.ts[2m > [22m[2mGET /v1/technicians/me/bookings[2m > [22m[2mreturns 401 when technician auth fails
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getMyTechnicianBookings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/wallet.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getWalletBalance" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getWalletLedger" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/catalogue-public.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getCategories" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getServiceById" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/earnings.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getEarnings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/rating-escalate.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "escalateRating" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/technicians.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "patchTechnicianFcmToken" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyTechnicianAvailability" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "patchMyTechnicianAvailability" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyTechnicianServiceProfile" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "patchMyTechnicianServiceProfile" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getTechnicianProfile" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getConfidenceScore" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/price-approval.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "createBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "confirmBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyBookings" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "requestAddon" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveFinalPrice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "cancelBooking" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/price-approval.test.ts[2m > [22m[2mPOST /v1/bookings/{id}/approve-final-price[2m > [22m[2mreturns 200 even when technician push throws (best-effort)
[22m[39m[approveFinalPrice] FCM technician push failed {
  bookingId: [32m'bk-3'[39m,
  err: Error: FCM 500
      at [90mC:\Alok\Business Projects\wt-fix-cosmos-pages\api\[39mtests\bookings\price-approval.test.ts:176:77
  [90m    at processTicksAndRejections (node:internal/process/task_queues:103:5)[39m
      at [90mfile:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:533:5
      at runTest [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1056:11[90m)[39m
      at runSuite [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1205:15[90m)[39m
      at runSuite [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1205:15[90m)[39m
      at runFiles [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1262:5[90m)[39m
      at startTests [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1271:3[90m)[39m
      at [90mfile:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/vitest@2.1.9_@types+node@22.19.17/node_modules/[4mvitest[24m/dist/chunks/runBaseTests.3qpJUEJM.js:126:11
      at withEnv [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/vitest@2.1.9_@types+node@22.19.17/node_modules/[4mvitest[24m/dist/chunks/runBaseTests.3qpJUEJM.js:90:5[90m)[39m
}

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminAuditLogList" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Skipping call to register function "adminPatchUser" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/finance/mark-commission-received.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "markCommissionReceived" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Skipping call to register function "adminDashboardSummary" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Skipping call to register function "adminListOrders" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/waitlist.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "waitlist" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Skipping call to register function "adminGetOrder" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Skipping call to register function "adminSosPlaybackToken" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Skipping call to register function "adminGetSosIncident" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts[2m > [22m[2mAdmin login route — no requireAdmin wrapping (public endpoint)[2m > [22m[2mPOST /v1/admin/auth/login returns non-401 for missing body (validation error, not auth error)
[22m[39mWARNING: Skipping call to register function "adminLogin" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-data-export.test.ts[2m > [22m[2mGET /v1/users/me/data-export[2m > [22m[2mreturns 401 when Authorization header is missing
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "usersDataExport" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-data-export.test.ts[2m > [22m[2mGET /v1/users/me/data-export[2m > [22m[2mreturns 401 when token verification fails
[22m[39mWARNING: Skipping call to register function "usersDataExport" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-data-export.test.ts[2m > [22m[2mGET /v1/users/me/data-export[2m > [22m[2mreturns 200 with assembled export for an authenticated customer
[22m[39mWARNING: Skipping call to register function "usersDataExport" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-data-export.test.ts[2m > [22m[2mGET /v1/users/me/data-export[2m > [22m[2mreturns 200 with technician export including KYC + wallet ledger
[22m[39mWARNING: Skipping call to register function "usersDataExport" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-data-export.test.ts[2m > [22m[2mGET /v1/users/me/data-export[2m > [22m[2mdoes NOT leak unmasked Aadhaar or full PAN
[22m[39mWARNING: Skipping call to register function "usersDataExport" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/functions/services-availability.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "servicesAvailability" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/webhook-fast-path.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "razorpayWebhook" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "reconcileStaleBookings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/sos.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "sos" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/catalogue/commission-config.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getAdminCommissionConfig" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "putAdminCommissionConfig" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/webhooks/razorpay-webhook-branch-coverage.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "razorpayWebhook" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "reconcileStaleBookings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/payouts-kill-switch.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerNextDayPayout" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/payouts-kill-switch.test.ts
[22m[39mWARNING: Skipping call to register function "triggerReconcilePayouts" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/auth/login.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminLogin" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/payouts-kill-switch.test.ts
[22m[39mWARNING: Skipping call to register function "adminApprovePayouts" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/auth/truecaller-verify.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "truecallerVerify" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/bookings-get-photos.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "createBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "confirmBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyBookings" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "requestAddon" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveFinalPrice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "cancelBooking" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/bookings-get-photos.test.ts[2m > [22m[2mGET /v1/bookings/{id} — photos + reportSignedUrl projection[2m > [22m[2mT3 — sign failure for one photo: filter, do not fail request
[22m[39m[getBooking] photo sign failed { stage: [32m'EN_ROUTE'[39m, path: [32m'p2'[39m, signedUrl: [32m'[redacted-signed-url]'[39m }

[90mstderr[2m | tests/kyc/submit-aadhaar.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar[2m > [22m[2mreturns 200 with masked number on successful DigiLocker exchange
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-aadhaar.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar[2m > [22m[2mreturns 200 with PENDING_MANUAL when DigiLocker returns null
[22m[39mWARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-aadhaar.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar[2m > [22m[2memits KYC_AADHAAR_VERIFIED audit entry on successful DigiLocker exchange
[22m[39mWARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-aadhaar.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar[2m > [22m[2memits KYC_AADHAAR_REJECTED audit entry when DigiLocker returns null
[22m[39mWARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-aadhaar.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar[2m > [22m[2mreturns 401 on invalid token
[22m[39mWARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/technicians/active-job-photos.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "activeJobPhotos" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-reconcile-payouts.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerReconcilePayouts" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/tech-ratings.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getTechRatings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2mfinds zero overdue → no-op
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerErasureDeadline" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2mprocesses overdue PENDING requests, runs cascade, marks EXECUTED
[22m[39mWARNING: Skipping call to register function "triggerErasureDeadline" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2misolates per-request failures: one cascade error does not abort the batch
[22m[39mWARNING: Skipping call to register function "triggerErasureDeadline" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2mskips entries that no longer exist or have changed status (race-free)
[22m[39mWARNING: Skipping call to register function "triggerErasureDeadline" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/rating-appeal.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "ratingAppeal" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/handlers.integration.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminRefresh" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/cosmos/slot-holds-repository.test.ts[2m > [22m[2mslotHoldsRepo.commitHold[2m > [22m[2msilently returns when hold has already expired (Cosmos 404)
[22m[39m[slotHoldsRepo] commitHold: hold already expired (non-fatal) { holdId: [32m'svc-ac|2026-05-20|10:00-11:00'[39m, bookingId: [32m'bk-1'[39m }

[90mstderr[2m | tests/integration/handlers.integration.test.ts
[22m[39mWARNING: Skipping call to register function "adminLogout" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/config/technician.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "technicianConfig" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/handlers.integration.test.ts
[22m[39mWARNING: Skipping call to register function "adminMe" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/finance/approve-payouts.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminApprovePayouts" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/branch-coverage.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "createBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "confirmBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyBookings" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "requestAddon" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveFinalPrice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "cancelBooking" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/branch-coverage.test.ts[2m > [22m[2mrequestAddonHandler — 200 when sendPriceApprovalPush throws (non-fatal FCM)[2m > [22m[2mreturns 200 even if FCM push throws
[22m[39m[requestAddon] FCM push failed — booking is AWAITING_PRICE_APPROVAL but customer was not notified {
  bookingId: [32m'bk-1'[39m,
  err: Error: FCM unavailable
      at [90mC:\Alok\Business Projects\wt-fix-cosmos-pages\api\[39mtests\bookings\branch-coverage.test.ts:111:61
      at [90mfile:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:146:14
      at [90mfile:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:533:11
      at runWithTimeout [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:39:7[90m)[39m
      at runTest [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1056:17[90m)[39m
  [90m    at processTicksAndRejections (node:internal/process/task_queues:103:5)[39m
      at runSuite [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1205:15[90m)[39m
      at runSuite [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1205:15[90m)[39m
      at runFiles [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1262:5[90m)[39m
      at startTests [90m(file:///C:/Alok/Business%20Projects/wt-fix-cosmos-pages/api/[39mnode_modules/[4m.pnpm[24m/@vitest+runner@2.1.9/node_modules/[4m@vitest/runner[24m/dist/index.js:1271:3[90m)[39m
}

[90mstderr[2m | tests/functions/technicians/commission-due.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "techCommissionDue" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-next-day-payout.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerNextDayPayout" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/shield-report.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "shieldReport" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/sos/playback-token.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminSosPlaybackToken" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/complaints/partner-get.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "partnerGetComplaints" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/dashboard/summary.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminDashboardSummary" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/technicians/confidence-score.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "patchTechnicianFcmToken" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyTechnicianAvailability" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "patchMyTechnicianAvailability" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyTechnicianServiceProfile" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "patchMyTechnicianServiceProfile" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getTechnicianProfile" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getConfidenceScore" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/auth/setup-totp.test.ts
[22m[39m[SECURITY] ADMIN_SETUP_SECRET is not set — TOTP setup endpoint is open to any caller. Set this env var before production deploy.
WARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminSetupTotpGet" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminSetupTotpPost" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/technician-availability.test.ts[2m > [22m[2mtechnician availability handlers[2m > [22m[2mreturns current technician availability
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "patchTechnicianFcmToken" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyTechnicianAvailability" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "patchMyTechnicianAvailability" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyTechnicianServiceProfile" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "patchMyTechnicianServiceProfile" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getTechnicianProfile" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getConfidenceScore" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-aadhaar-idor.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar — IDOR guard[2m > [22m[2mreturns 403 when authenticated uid (tech-A) differs from body technicianId (tech-B)
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-aadhaar-idor.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar — IDOR guard[2m > [22m[2mproceeds normally when authenticated uid matches body technicianId
[22m[39mWARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-aadhaar-idor.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar — IDOR guard[2m > [22m[2mupsertKycStatus is never called for the forbidden (tech-B) case
[22m[39mWARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/sos-key.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "sosKey" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/dashboard/feed.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminDashboardFeed" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/audit-log/list.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminAuditLogList" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/payout-cadence.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "updatePayoutCadence" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-service-report.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerServiceReport" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/dashboard/tech-locations.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminDashboardTechLocations" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/complaints/create.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminCreateComplaint" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/users-erasure-request.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "usersErasureRequestSubmit" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "usersErasureRequestRevoke" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/confirm.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "createBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "confirmBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyBookings" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "requestAddon" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveFinalPrice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "cancelBooking" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/list.test.ts[2m > [22m[2mGET /v1/bookings[2m > [22m[2mreturns current customer bookings with service names and final amount
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "createBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "confirmBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyBookings" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "requestAddon" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveFinalPrice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "cancelBooking" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/complaints/list.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminListComplaints" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/finance/summary.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminFinanceSummary" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/integrity/nonce.test.ts[2m > [22m[2mGET /v1/integrity/nonce[2m > [22m[2mreturns 200 with a nonce field that is a valid UUID v4
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "integrityNonce" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/integrity/nonce.test.ts[2m > [22m[2mGET /v1/integrity/nonce[2m > [22m[2mreturns a different nonce on every call
[22m[39mWARNING: Skipping call to register function "integrityNonce" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/integrity/nonce.test.ts[2m > [22m[2mGET /v1/integrity/nonce[2m > [22m[2mis wrapped with rate limiting (20 req/min/ip bucket)
[22m[39mWARNING: Skipping call to register function "integrityNonce" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/orders/candidates.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminGetOrderTechnicianCandidates" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/complaints/repeat-offenders.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminRepeatOffenders" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-rating-prompt.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerRatingPrompt" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/orders/list.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminListOrders" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/orders/detail.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminGetOrder" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/users/list.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminListUsers" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/finance/payout-queue.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminPayoutQueue" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/timers/prune-device-tokens.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerPruneDeviceTokens" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/health.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "health" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/finance/weekly-aggregate.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "weeklyPayoutAggregate" because the "@azure/functions" package is in test mode.


2026-09-07T10:45:44.407076Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem api/node_modules/@azure/cosmos/dist/esm/queryExecutionContext -Recurse -File | Select-String -Pattern \"class DefaultQueryExecutionContext|hasMoreResults\\(\\)\" -Context 0,40 | Select-Object -First 120" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 3632ms:

> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:7:export declare 
class DefaultQueryExecutionContext implements ExecutionContext {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:8:    private static 
readonly STATES;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:9:    private 
resources;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:10:    private 
currentIndex;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:11:    private 
currentPartitionIndex;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:12:    private 
fetchFunctions;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:13:    private 
options;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:14:    
continuationToken: string | undefined;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:15:    get 
continuation(): string | undefined;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:16:    private state;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:17:    private 
nextFetchFunction;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:18:    private 
correlatedActivityId;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:19:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:20:     * Provides 
the basic Query Execution Context.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:21:     * This wraps 
the internal logic query execution using provided fetch functions
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:22:     *
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:23:     * @param 
clientContext  - Is used to read the partitionKeyRanges for split proofing
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:24:     * @param 
query          - A SQL query.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:25:     * @param 
options        - Represents the feed options.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:26:     * @param 
fetchFunctions - A function to retrieve each page of data.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:27:     *            
              An array of functions may be used to query more than one partition.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:28:     * @hidden
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:29:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:30:    
constructor(options: FeedOptions, fetchFunctions: FetchFunctionCallback | FetchFunctionCallback[], 
correlatedActivityId: string);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:31:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:32:     * Execute a 
provided callback on the next element in the execution context.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:33:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:34:    
nextItem(diagnosticNode: DiagnosticNodeInternal): Promise<Response<any>>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:35:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:36:     * Retrieve 
the current element on the execution context.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:37:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:38:    
current(diagnosticNode: DiagnosticNodeInternal): Promise<Response<any>>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:39:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:40:     * Determine 
if there are still remaining resources to processs based on
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:41:     * the value 
of the continuation token or the elements remaining on the current batch in the execution context.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:42:     *
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:43:     * @returns 
true if there is other elements to process in the DefaultQueryExecutionContext.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:44:     */
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:45:    
hasMoreResults(): boolean;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:46:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:47:     * Fetches 
the next batch of the feed and pass them as an array to a callback
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:48:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:49:    
fetchMore(diagnosticNode: DiagnosticNodeInternal): Promise<Response<any>>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:50:    private 
_canFetchMore;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:51:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.d.ts:52://# 
sourceMappingURL=defaultQueryExecutionContext.d.ts.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:17:export class 
DefaultQueryExecutionContext {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:18:    static STATES = 
STATES;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:19:    resources; // 
TODO: any resources
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:20:    currentIndex;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:21:    
currentPartitionIndex;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:22:    fetchFunctions;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:23:    options; // 
TODO: any options
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:24:    
continuationToken; // TODO: any continuation
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:25:    get 
continuation() {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:26:        return 
this.continuationToken;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:27:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:28:    state;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:29:    
nextFetchFunction;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:30:    
correlatedActivityId;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:31:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:32:     * Provides the 
basic Query Execution Context.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:33:     * This wraps 
the internal logic query execution using provided fetch functions
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:34:     *
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:35:     * @param 
clientContext  - Is used to read the partitionKeyRanges for split proofing
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:36:     * @param query 
         - A SQL query.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:37:     * @param 
options        - Represents the feed options.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:38:     * @param 
fetchFunctions - A function to retrieve each page of data.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:39:     *              
            An array of functions may be used to query more than one partition.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:40:     * @hidden
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:41:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:42:    
constructor(options, fetchFunctions, correlatedActivityId) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:43:        
this.resources = [];
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:44:        
this.currentIndex = 0;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:45:        
this.currentPartitionIndex = 0;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:46:        
this.fetchFunctions = Array.isArray(fetchFunctions) ? fetchFunctions : [fetchFunctions];
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:47:        
this.options = options || {};
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:48:        
this.continuationToken =
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:49:            
this.options.continuationToken || this.options.continuation || undefined;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:50:        this.state 
= DefaultQueryExecutionContext.STATES.start;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:51:        
this.correlatedActivityId = correlatedActivityId;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:52:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:53:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:54:     * Execute a 
provided callback on the next element in the execution context.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:55:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:56:    async 
nextItem(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:57:        
++this.currentIndex;
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:99:    
hasMoreResults() {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:100:        return 
(this.state === DefaultQueryExecutionContext.STATES.start ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:101:            
this.continuationToken !== undefined ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:102:            
this.currentIndex < this.resources.length - 1 ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:103:            
this.currentPartitionIndex < this.fetchFunctions.length);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:104:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:105:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:106:     * Fetches the 
next batch of the feed and pass them as an array to a callback
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:107:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:108:    async 
fetchMore(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:109:        return 
addDiagnosticChild(async (childDiagnosticNode) => {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:110:            if 
(this.currentPartitionIndex >= this.fetchFunctions.length) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:111:                
return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:112:                   
 headers: getInitialHeader(),
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:113:                   
 result: undefined,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:114:                };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:115:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:116:            // 
Keep to the original continuation and to restore the value after fetchFunction call
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:117:            const 
originalContinuation = this.options.continuationToken || this.options.continuation;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:118:            
this.options.continuationToken = this.continuationToken;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:119:            // 
Return undefined if there is no more results
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:120:            if 
(this.currentPartitionIndex >= this.fetchFunctions.length) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:121:                
return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:122:                   
 headers: getInitialHeader(),
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:123:                   
 result: undefined,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:124:                };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:125:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:126:            let 
resources;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:127:            let 
responseHeaders;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:128:            try {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:129:                
let p;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:130:                if 
(this.nextFetchFunction !== undefined) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:131:                   
 logger.verbose("using prefetch");
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:132:                   
 p = this.nextFetchFunction;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:133:                   
 this.nextFetchFunction = undefined;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:134:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:135:                
else {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:136:                   
 logger.verbose("using fresh fetch");
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:137:                   
 p = this.fetchFunctions[this.currentPartitionIndex](childDiagnosticNode, this.options, this.correlatedActivityId);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:138:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js:139:                
const response = await p;
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\defaultQueryExecutionContext.js.map:1:{"version":3,"fil
e":"defaultQueryExecutionContext.js","sourceRoot":"","sources":["../../../src/queryExecutionContext/defaultQueryExecuti
onContext.ts"],"names":[],"mappings":"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","sourcesContent":["// Copyright (c) Microsoft Corporation.\n// Licensed 
under the MIT License.\nimport type { AzureLogger } from \"@azure/logger\";\nimport { createClientLogger } from 
\"@azure/logger\";\nimport { Constants } from \"../common/index.js\";\nimport { ClientSideMetrics, QueryMetrics } from 
\"../queryMetrics/index.js\";\nimport type { FeedOptions, Response } from \"../request/index.js\";\nimport { 
getInitialHeader } from \"./headerUtils.js\";\nimport type { ExecutionContext } from \"./index.js\";\nimport type { 
DiagnosticNodeInternal } from \"../diagnostics/DiagnosticNodeInternal.js\";\nimport { DiagnosticNodeType } from 
\"../diagnostics/DiagnosticNodeInternal.js\";\nimport { addDiagnosticChild } from \"../utils/diagnostics.js\";\nimport 
{ CosmosDbDiagnosticLevel } from \"../diagnostics/CosmosDbDiagnosticLevel.js\";\n\nconst logger: AzureLogger = 
createClientLogger(\"ClientContext\");\n/** @hidden */\nexport type FetchFunctionCallback = (\n  diagnosticNode: 
DiagnosticNodeInternal,\n  options: FeedOptions,\n  correlatedActivityId: string,\n) => Promise<Response<any>>;\n\n/** 
@hidden */\nenum STATES {\n  start = \"start\",\n  inProgress = \"inProgress\",\n  ended = \"ended\",\n}\n\n/** 
@hidden */\nexport class DefaultQueryExecutionContext implements ExecutionContext {\n  private static readonly STATES 
= STATES;\n  private resources: any[]; // TODO: any resources\n  private currentIndex: number;\n  private 
currentPartitionIndex: number;\n  private fetchFunctions: FetchFunctionCallback[];\n  private options: FeedOptions; // 
TODO: any options\n  public continuationToken: string | undefined; // TODO: any continuation\n  public get 
continuation(): string | undefined {\n    return this.continuationToken;\n  }\n  private state: STATES;\n  private 
nextFetchFunction: Promise<Response<any>>;\n  private correlatedActivityId: string;\n  /**\n   * Provides the basic 
Query Execution Context.\n   * This wraps the internal logic query execution using provided fetch functions\n   *\n   
* @param clientContext  - Is used to read the partitionKeyRanges for split proofing\n   * @param query          - A 
SQL query.\n   * @param options        - Represents the feed options.\n   * @param fetchFunctions - A function to 
retrieve each page of data.\n   *                          An array of functions may be used to query more than one 
partition.\n   * @hidden\n   */\n  constructor(\n    options: FeedOptions,\n    fetchFunctions: FetchFunctionCallback 
| FetchFunctionCallback[],\n    correlatedActivityId: string,\n  ) {\n    this.resources = [];\n    this.currentIndex 
= 0;\n    this.currentPartitionIndex = 0;\n    this.fetchFunctions = Array.isArray(fetchFunctions) ? fetchFunctions : 
[fetchFunctions];\n    this.options = options || {};\n    this.continuationToken =\n      
this.options.continuationToken || this.options.continuation || undefined;\n    this.state = 
DefaultQueryExecutionContext.STATES.start;\n    this.correlatedActivityId = correlatedActivityId;\n  }\n\n  /**\n   * 
Execute a provided callback on the next element in the execution context.\n   */\n  public async 
nextItem(diagnosticNode: DiagnosticNodeInternal): Promise<Response<any>> {\n    ++this.currentIndex;\n    const 
response = await this.current(diagnosticNode);\n    return response;\n  }\n\n  /**\n   * Retrieve the current element 
on the execution context.\n   */\n  public async current(diagnosticNode: DiagnosticNodeInternal): 
Promise<Response<any>> {\n    if (this.currentIndex < this.resources.length) {\n      return {\n        result: 
this.resources[this.currentIndex],\n        headers: getInitialHeader(),\n      };\n    }\n\n    if 
(this._canFetchMore()) {\n      const { result: resources, headers } = await this.fetchMore(diagnosticNode);\n      
this.resources = resources;\n      if (this.resources.length === 0) {\n        if (!this.continuationToken && 
this.currentPartitionIndex >= this.fetchFunctions.length) {\n          this.state = 
DefaultQueryExecutionContext.STATES.ended;\n          return { result: undefined, headers };\n        } else {\n       
   return this.current(diagnosticNode);\n        }\n      }\n      return { result: this.resources[this.currentIndex], 
headers };\n    } else {\n      this.state = DefaultQueryExecutionContext.STATES.ended;\n      return {\n        
result: undefined,\n        headers: getInitialHeader(),\n      };\n    }\n  }\n\n  /**\n   * Determine if there are 
still remaining resources to processs based on\n   * the value of the continuation token or the elements remaining on 
the current batch in the execution context.\n   *\n   * @returns true if there is other elements to process in the 
DefaultQueryExecutionContext.\n   */\n  public hasMoreResults(): boolean {\n    return (\n      this.state === 
DefaultQueryExecutionContext.STATES.start ||\n      this.continuationToken !== undefined ||\n      this.currentIndex < 
this.resources.length - 1 ||\n      this.currentPartitionIndex < this.fetchFunctions.length\n    );\n  }\n\n  /**\n   
* Fetches the next batch of the feed and pass them as an array to a callback\n   */\n  public async 
fetchMore(diagnosticNode: DiagnosticNodeInternal): Promise<Response<any>> {\n    return addDiagnosticChild(\n      
async (childDiagnosticNode: DiagnosticNodeInternal) => {\n        if (this.currentPartitionIndex >= 
this.fetchFunctions.length) {\n          return {\n            headers: getInitialHeader(),\n            result: 
undefined,\n          };\n        }\n\n        // Keep to the original continuation and to restore the value after 
fetchFunction call\n        const originalContinuation = this.options.continuationToken || 
this.options.continuation;\n        this.options.continuationToken = this.continuationToken;\n\n        // Return 
undefined if there is no more results\n        if (this.currentPartitionIndex >= this.fetchFunctions.length) {\n       
   return {\n            headers: getInitialHeader(),\n            result: undefined,\n          };\n        }\n\n     
   let resources;\n        let responseHeaders;\n        try {\n          let p: Promise<Response<any>>;\n          if 
(this.nextFetchFunction !== undefined) {\n            logger.verbose(\"using prefetch\");\n            p = 
this.nextFetchFunction;\n            this.nextFetchFunction = undefined;\n          } else {\n            
logger.verbose(\"using fresh fetch\");\n            p = this.fetchFunctions[this.currentPartitionIndex](\n             
 childDiagnosticNode,\n              this.options,\n              this.correlatedActivityId,\n            );\n         
 }\n          const response = await p;\n          resources = response.result;\n          
childDiagnosticNode.recordQueryResult(resources, CosmosDbDiagnosticLevel.debugUnsafe);\n          responseHeaders = 
response.headers;\n          this.continuationToken = responseHeaders[Constants.HttpHeaders.Continuation];\n          
if (!this.continuationToken) {\n            ++this.currentPartitionIndex;\n          }\n\n          if (this.options 
&& this.options.bufferItems === true) {\n            const fetchFunction = 
this.fetchFunctions[this.currentPartitionIndex];\n            this.nextFetchFunction = fetchFunction\n              ? 
fetchFunction(\n                  childDiagnosticNode,\n                  {\n                    ...this.options,\n    
                continuationToken: this.continuationToken,\n                  },\n                  
this.correlatedActivityId,\n                )\n              : undefined;\n          }\n        } catch (err: any) {\n 
         this.state = DefaultQueryExecutionContext.STATES.ended;\n          // return callback(err, undefined, 
responseHeaders);\n          // TODO: Error and data being returned is an antipattern, this might broken\n          
throw err;\n        }\n\n        this.state = DefaultQueryExecutionContext.STATES.inProgress;\n        
this.currentIndex = 0;\n        this.options.continuationToken = originalContinuation;\n        
this.options.continuation = originalContinuation;\n\n        // deserializing query metrics so that we aren't working 
with delimited strings in the rest of the code base\n        if (Constants.HttpHeaders.QueryMetrics in 
responseHeaders) {\n          const delimitedString = responseHeaders[Constants.HttpHeaders.QueryMetrics];\n          
let queryMetrics = QueryMetrics.createFromDelimitedString(delimitedString);\n\n          // Add the request charge to 
the query metrics so that we can have per partition request charge.\n          if (Constants.HttpHeaders.RequestCharge 
in responseHeaders) {\n            const requestCharge = Number(responseHeaders[Constants.HttpHeaders.RequestCharge]) 
|| 0;\n            queryMetrics = new QueryMetrics(\n              queryMetrics.retrievedDocumentCount,\n              
queryMetrics.retrievedDocumentSize,\n              queryMetrics.outputDocumentCount,\n              
queryMetrics.outputDocumentSize,\n              queryMetrics.indexHitDocumentCount,\n              
queryMetrics.totalQueryExecutionTime,\n              queryMetrics.queryPreparationTimes,\n              
queryMetrics.indexLookupTime,\n              queryMetrics.documentLoadTime,\n              
queryMetrics.vmExecutionTime,\n              queryMetrics.runtimeExecutionTimes,\n              
queryMetrics.documentWriteTime,\n              new ClientSideMetrics(requestCharge),\n            );\n          }\n\n  
        // Wraping query metrics in a object where the key is '0' just so single partition\n          // and partition 
queries have the same response schema\n          responseHeaders[Constants.HttpHeaders.QueryMetrics] = {};\n          
responseHeaders[Constants.HttpHeaders.QueryMetrics][\"0\"] = queryMetrics;\n        }\n\n        return { result: 
resources, headers: responseHeaders };\n      },\n      diagnosticNode,\n      
DiagnosticNodeType.DEFAULT_QUERY_NODE,\n      {\n        queryMethodIdentifier: \"fetchMore\",\n      },\n    );\n  
}\n\n  private _canFetchMore(): boolean {\n    const res =\n      this.state === 
DefaultQueryExecutionContext.STATES.start ||\n      (this.continuationToken && this.state === 
DefaultQueryExecutionContext.STATES.inProgress) ||\n      (this.currentPartitionIndex < this.fetchFunctions.length 
&&\n        this.state === DefaultQueryExecutionContext.STATES.inProgress);\n    return res;\n  }\n}\n"]}
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:39:    hasMoreResults(): boolean;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:40:    gotSplit(): boolean;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:41:    private _updateStates;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:42:    private static 
_needPartitionKeyRangeCacheRefresh;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:43:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:44:     * Fetches and bufferes 
the next page of results in internal buffer
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:45:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:46:    
bufferMore(diagnosticNode: DiagnosticNodeInternal): Promise<CosmosHeaders>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:47:    
getTargetPartitionKeyRange(): PartitionKeyRange;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:48:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:49:     * Peak the next item in 
the buffer
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:50:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:51:    peakNextItem(): any;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:52:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:53:     * Returns the first item 
in the buffered results if any, or [] otherwise.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:54:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:55:    fetchNextItem(): 
Promise<Response<any>>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:56:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:57:     * Fetches all the 
buffered results
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:58:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:59:    fetchBufferedItems(): 
Promise<Response<any[]>>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:60:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:61:     * Retrieve the current 
element on the DocumentProducer.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:62:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:63:    private current;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:64:    getQueryExecutionInfo(): {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:65:        reverseRidEnabled: 
boolean;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:66:        reverseIndexScan: 
boolean;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:67:    } | undefined;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:68:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.d.ts:69://# 
sourceMappingURL=documentProducer.d.ts.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:86:    hasMoreResults() {
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:87:        return 
this.internalExecutionContext.hasMoreResults() || this.fetchResults.length !== 0;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:88:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:89:    gotSplit() {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:90:        if 
(this.fetchResults.length !== 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:91:            const fetchResult = 
this.fetchResults[0];
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:92:            if 
(fetchResult.fetchResultType === FetchResultType.Exception) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:93:                if 
(DocumentProducer._needPartitionKeyRangeCacheRefresh(fetchResult.error)) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:94:                    return true;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:95:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:96:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:97:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:98:        return false;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:99:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:100:    _updateStates(err, 
allFetched) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:101:        if (err) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:102:            this.err = err;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:103:            return;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:104:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:105:        if (allFetched) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:106:            this.allFetched = 
true;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:107:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:108:        if 
(this.internalExecutionContext.continuationToken === this.continuationToken) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:109:            // nothing changed
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:110:            return;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:111:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:112:        
this.previousContinuationToken = this.continuationToken;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:113:        this.continuationToken 
= this.internalExecutionContext.continuationToken;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:114:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:115:    static 
_needPartitionKeyRangeCacheRefresh(error) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:116:        // TODO: error
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:117:        return (error.code === 
StatusCodes.Gone &&
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:118:            "substatus" in 
error &&
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:119:            error["substatus"] 
=== SubStatusCodes.PartitionKeyRangeGone);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:120:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:121:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:122:     * Fetches and bufferes 
the next page of results in internal buffer
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:123:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:124:    async 
bufferMore(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:125:        if (this.err) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:126:            throw this.err;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js:127:        }
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\documentProducer.js.map:1:{"version":3,"file":"document
Producer.js","sourceRoot":"","sources":["../../../src/queryExecutionContext/documentProducer.ts"],"names":[],"mappings"
:"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","sourcesContent":["// Copyright (c) Microsoft 
Corporation.\n// Licensed under the MIT License.\nimport type { PartitionKeyRange, Resource } from 
\"../client/index.js\";\nimport type { ClientContext } from \"../ClientContext.js\";\nimport {\n  Constants,\n  
getIdFromLink,\n  getPathFromLink,\n  ResourceType,\n  StatusCodes,\n  SubStatusCodes,\n} from 
\"../common/index.js\";\nimport type { DiagnosticNodeInternal } from 
\"../diagnostics/DiagnosticNodeInternal.js\";\nimport type { FeedOptions } from \"../request/index.js\";\nimport type 
{ Response } from \"../request/index.js\";\nimport { DefaultQueryExecutionContext } from 
\"./defaultQueryExecutionContext.js\";\nimport type { FetchFunctionCallback } from 
\"./defaultQueryExecutionContext.js\";\nimport { FetchResult, FetchResultType } from \"./FetchResult.js\";\nimport { 
getInitialHeader } from \"./headerUtils.js\";\nimport type { CosmosHeaders } from \"./headerUtils.js\";\nimport type { 
SqlQuerySpec, FilterStrategy } from \"./index.js\";\n\n/** @hidden */\nexport class DocumentProducer {\n  private 
collectionLink: string;\n  private query: string | SqlQuerySpec;\n  public targetPartitionKeyRange: 
PartitionKeyRange;\n  public fetchResults: FetchResult[];\n  public allFetched: boolean;\n  private err: Error;\n  
public previousContinuationToken: string;\n  public continuationToken: string;\n  public generation: number = 0;\n  
private internalExecutionContext: DefaultQueryExecutionContext;\n  public startEpk: string;\n  public endEpk: 
string;\n  public populateEpkRangeHeaders: boolean;\n  private filter?: FilterStrategy;\n  private 
queryExecutionInfo?: { reverseRidEnabled: boolean; reverseIndexScan: boolean };\n\n  /**\n   * Provides the Target 
Partition Range Query Execution Context.\n   * @param clientContext  - The service endpoint to use to create the 
client.\n   * @param collectionLink - Represents collection link\n   * @param query          - A SQL query.\n   * 
@param targetPartitionKeyRange - Query Target Partition key Range\n   * @hidden\n   */\n  constructor(\n    private 
clientContext: ClientContext,\n    collectionLink: string,\n    query: SqlQuerySpec,\n    targetPartitionKeyRange: 
PartitionKeyRange,\n    options: FeedOptions,\n    correlatedActivityId: string,\n    startEpk?: string,\n    endEpk?: 
string,\n    populateEpkRangeHeaders: boolean = false,\n    filter?: FilterStrategy,\n  ) {\n    // TODO: any 
options\n    this.collectionLink = collectionLink;\n    this.query = query;\n    this.targetPartitionKeyRange = 
targetPartitionKeyRange;\n    this.fetchResults = [];\n\n    this.allFetched = false;\n    this.err = undefined;\n\n   
 this.previousContinuationToken = undefined;\n    this.continuationToken = undefined;\n\n    
this.internalExecutionContext = new DefaultQueryExecutionContext(\n      options,\n      this.fetchFunction,\n      
correlatedActivityId,\n    );\n    this.startEpk = startEpk;\n    this.endEpk = endEpk;\n    
this.populateEpkRangeHeaders = populateEpkRangeHeaders;\n    this.filter = filter;\n  }\n  public peekBufferedItems(): 
any[] {\n    const bufferedResults = [];\n    for (let i = 0, done = false; i < this.fetchResults.length && !done; 
i++) {\n      const fetchResult = this.fetchResults[i];\n      switch (fetchResult.fetchResultType) {\n        case 
FetchResultType.Done:\n          done = true;\n          break;\n        case FetchResultType.Exception:\n          
done = true;\n          break;\n        case FetchResultType.Result:\n          
bufferedResults.push(fetchResult.feedResponse);\n          break;\n      }\n    }\n    return bufferedResults;\n  
}\n\n  public fetchFunction: FetchFunctionCallback = async (\n    diagnosticNode: DiagnosticNodeInternal,\n    
options: FeedOptions,\n    correlatedActivityId: string,\n  ): Promise<Response<Resource>> => {\n    const path = 
getPathFromLink(this.collectionLink, ResourceType.item);\n    diagnosticNode.addData({ partitionKeyRangeId: 
this.targetPartitionKeyRange.id });\n    const id = getIdFromLink(this.collectionLink);\n    const startEpk = 
this.populateEpkRangeHeaders ? this.startEpk : undefined;\n    const endEpk = this.populateEpkRangeHeaders ? 
this.endEpk : undefined;\n\n    return this.clientContext.queryFeed({\n      path,\n      resourceType: 
ResourceType.item,\n      resourceId: id,\n      resultFn: (result: any) => result.Documents,\n      query: 
this.query,\n      options,\n      diagnosticNode,\n      partitionKeyRangeId: this.targetPartitionKeyRange[\"id\"],\n 
     correlatedActivityId: correlatedActivityId,\n      startEpk: startEpk,\n      endEpk: endEpk,\n    });\n  };\n\n  
public hasMoreResults(): boolean {\n    return this.internalExecutionContext.hasMoreResults() || 
this.fetchResults.length !== 0;\n  }\n\n  public gotSplit(): boolean {\n    if (this.fetchResults.length !== 0) {\n    
  const fetchResult = this.fetchResults[0];\n      if (fetchResult.fetchResultType === FetchResultType.Exception) {\n  
      if (DocumentProducer._needPartitionKeyRangeCacheRefresh(fetchResult.error)) {\n          return true;\n        
}\n      }\n    }\n    return false;\n  }\n\n  private _updateStates(err: any, allFetched: boolean): void {\n    if 
(err) {\n      this.err = err;\n      return;\n    }\n    if (allFetched) {\n      this.allFetched = true;\n    }\n    
if (this.internalExecutionContext.continuationToken === this.continuationToken) {\n      // nothing changed\n      
return;\n    }\n    this.previousContinuationToken = this.continuationToken;\n    this.continuationToken = 
this.internalExecutionContext.continuationToken;\n  }\n\n  private static _needPartitionKeyRangeCacheRefresh(error: 
any): boolean {\n    // TODO: error\n    return (\n      error.code === StatusCodes.Gone &&\n      \"substatus\" in 
error &&\n      error[\"substatus\"] === SubStatusCodes.PartitionKeyRangeGone\n    );\n  }\n\n  /**\n   * Fetches and 
bufferes the next page of results in internal buffer\n   */\n  public async bufferMore(diagnosticNode: 
DiagnosticNodeInternal): Promise<CosmosHeaders> {\n    if (this.err) {\n      throw this.err;\n    }\n\n    try {\n    
  const { result: resourcesResult, headers: headerResponse } =\n        await 
this.internalExecutionContext.fetchMore(diagnosticNode);\n      let resources = resourcesResult;\n      
++this.generation;\n      this._updateStates(undefined, resources === undefined);\n      if (headerResponse && 
headerResponse[\"x-ms-cosmos-query-execution-info\"]) {\n        this.queryExecutionInfo = 
JSON.parse(headerResponse[\"x-ms-cosmos-query-execution-info\"]);\n      }\n\n      if (this.filter && resources) {\n  
      resources = this.filter.applyFilter(resources);\n      }\n\n      if (resources !== undefined) {\n        // add 
fetched header to the 1st element in the buffer\n        let addHeaderToFetchResult = true;\n        
resources.forEach((element: any) => {\n          this.fetchResults.push(\n            new FetchResult(\n              
element,\n              undefined,\n              addHeaderToFetchResult ? headerResponse : getInitialHeader(),\n      
      ),\n          );\n          addHeaderToFetchResult = false;\n        });\n      }\n\n      // need to modify the 
header response so that the query metrics are per partition\n      if (headerResponse != null && 
Constants.HttpHeaders.QueryMetrics in headerResponse) {\n        // \"0\" is the default partition before one is 
actually assigned.\n        const queryMetrics = headerResponse[Constants.HttpHeaders.QueryMetrics][\"0\"];\n\n        
// Wraping query metrics in a object where the keys are the partition key range.\n        
headerResponse[Constants.HttpHeaders.QueryMetrics] = {};\n        
headerResponse[Constants.HttpHeaders.QueryMetrics][this.targetPartitionKeyRange.id] =\n          queryMetrics;\n      
}\n      return headerResponse;\n    } catch (err: any) {\n      if 
(DocumentProducer._needPartitionKeyRangeCacheRefresh(err)) {\n        // Split just happend\n        // Buffer the 
error so the execution context can still get the feedResponses in the itemBuffer\n        const bufferedError = new 
FetchResult(undefined, err);\n        this.fetchResults.push(bufferedError);\n        return err.headers;\n      } 
else {\n        this._updateStates(err, err.resources === undefined);\n        throw err;\n      }\n    }\n  }\n\n  
public getTargetPartitionKeyRange(): PartitionKeyRange {\n    return this.targetPartitionKeyRange;\n  }\n  /**\n   * 
Peak the next item in the buffer\n   */\n  public peakNextItem(): any {\n    if (this.err) {\n      throw this.err;\n  
  }\n    if (this.allFetched || this.fetchResults.length === 0) {\n      return undefined;\n    }\n    const 
fetchResult = this.fetchResults[0];\n\n    switch (fetchResult.fetchResultType) {\n      case FetchResultType.Done:\n  
      return undefined;\n\n      case FetchResultType.Exception: // do not throw this error\n        return 
undefined;\n\n      case FetchResultType.Result:\n        return fetchResult.feedResponse;\n    }\n  }\n\n  /**\n   * 
Returns the first item in the buffered results if any, or [] otherwise.\n   */\n  public async fetchNextItem(): 
Promise<Response<any>> {\n    if (this.err) {\n      this._updateStates(this.err, undefined);\n      throw this.err;\n 
   }\n    if (this.allFetched) {\n      return { result: undefined, headers: getInitialHeader() };\n    }\n    try {\n 
     const { result, headers } = this.current();\n      this._updateStates(undefined, result === undefined);\n      if 
(result === undefined || result.length === 0) {\n        return { result: undefined, headers };\n      }\n      return 
{ result, headers };\n    } catch (err: any) {\n      this._updateStates(err, err.item === undefined);\n      throw 
err;\n    }\n  }\n  /**\n   * Fetches all the buffered results\n   */\n  public async fetchBufferedItems(): 
Promise<Response<any[]>> {\n    if (this.err) {\n      this._updateStates(this.err, undefined);\n      throw 
this.err;\n    }\n    if (this.allFetched) {\n      return { result: undefined, headers: getInitialHeader() };\n    
}\n    const resources: any[] = [];\n    try {\n      while (this.fetchResults.length > 0) {\n        const { result } 
= this.current();\n        this._updateStates(undefined, result === undefined);\n        if (result === undefined) {\n 
         return {\n            result: resources.length > 0 ? resources : undefined,\n            headers: 
getInitialHeader(),\n          };\n        } else {\n          resources.push(result);\n        }\n      }\n      
return { result: resources, headers: getInitialHeader() };\n    } catch (err: any) {\n      this._updateStates(err, 
err.item === undefined);\n      throw err;\n    }\n  }\n\n  /**\n   * Retrieve the current element on the 
DocumentProducer.\n   */\n  private current(): Response<any> {\n    // If something is buffered just give that\n    if 
(this.fetchResults.length > 0) {\n      const fetchResult = this.fetchResults.shift();\n      // Need to unwrap fetch 
results\n      switch (fetchResult.fetchResultType) {\n        case FetchResultType.Done:\n          return {\n        
    result: undefined,\n            headers: getInitialHeader(),\n          };\n        case 
FetchResultType.Exception:\n          fetchResult.error.headers = getInitialHeader();\n          throw 
fetchResult.error;\n        case FetchResultType.Result:\n          return {\n            result: 
fetchResult.feedResponse,\n            headers: getInitialHeader(),\n          };\n      }\n    }\n\n    // If there 
isn't anymore items left to fetch then let the user know.\n    if (this.allFetched) {\n      return {\n        result: 
undefined,\n        headers: getInitialHeader(),\n      };\n    }\n\n    // If the internal buffer is empty, return 
empty result\n    return { result: [], headers: getInitialHeader() };\n  }\n\n  public getQueryExecutionInfo():\n    | 
{ reverseRidEnabled: boolean; reverseIndexScan: boolean }\n    | undefined {\n    return this.queryExecutionInfo;\n  
}\n}\n"]}
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:39:    
hasMoreResults(): boolean;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:40:    
fetchMore(diagnosticNode?: DiagnosticNodeInternal): Promise<Response<any>>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:41:    private 
fetchMoreInternal;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:42:    private 
initialize;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:43:    private 
executeComponentQueries;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:44:    private 
processUniqueItems;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:45:    private 
applySkipAndTakeToBuffer;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:46:    private drain;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:47:    private 
drainOne;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:48:    private done;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:49:    private 
sortHybridSearchResultByRRFScore;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:50:    private 
drainSingleComponent;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:51:    private 
createComponentExecutionContexts;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:52:    private 
processComponentQueries;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:53:    private 
replacePlaceholdersWorkaroud;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:54:    private 
computeRRFScore;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:55:    private 
extractComponentWeights;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:56:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:57:export interface 
ComponentWeight {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:58:    weight: number;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:59:    comparator: 
(x: number, y: number) => number;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:60:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.d.ts:61://# 
sourceMappingURL=hybridQueryExecutionContext.d.ts.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:99:    hasMoreResults() 
{
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:100:        switch 
(this.state) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:101:            case 
HybridQueryExecutionContextBaseStates.uninitialized:
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:102:                
return true;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:103:            case 
HybridQueryExecutionContextBaseStates.initialized:
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:104:                
return true;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:105:            case 
HybridQueryExecutionContextBaseStates.draining:
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:106:                
return this.buffer.length > 0;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:107:            case 
HybridQueryExecutionContextBaseStates.done:
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:108:                
return false;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:109:            default:
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:110:                
return false;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:111:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:112:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:113:    async 
fetchMore(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:114:        const 
fetchMoreRespHeaders = getInitialHeader();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:115:        return 
this.fetchMoreInternal(diagnosticNode, fetchMoreRespHeaders);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:116:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:117:    async 
fetchMoreInternal(diagnosticNode, headers) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:118:        switch 
(this.state) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:119:            case 
HybridQueryExecutionContextBaseStates.uninitialized:
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:120:                
await this.initialize(diagnosticNode, headers);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:121:                
return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:122:                    
result: [],
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:123:                    
headers: headers,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:124:                };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:125:            case 
HybridQueryExecutionContextBaseStates.initialized:
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:126:                
await this.executeComponentQueries(diagnosticNode, headers);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:127:                
return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:128:                    
result: [],
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:129:                    
headers: headers,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:130:                };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:131:            case 
HybridQueryExecutionContextBaseStates.draining:
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:132:                
return this.drain(headers);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:133:            case 
HybridQueryExecutionContextBaseStates.done:
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:134:                
return this.done(headers);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:135:            default:
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:136:                
throw new Error(`Invalid state: ${this.state}`);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:137:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:138:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:139:    async 
initialize(diagnosticNode, fetchMoreRespHeaders) {
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:141:            while 
(this.globalStatisticsExecutionContext.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:142:                
const result = await this.globalStatisticsExecutionContext.fetchMore(diagnosticNode);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:143:                
mergeHeaders(fetchMoreRespHeaders, result.headers);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:144:                if 
(result && result.result) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:145:                    
const resultData = result.result.buffer;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:146:                    
for (const item of resultData) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:147:                    
    const globalStatistics = item;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:148:                    
    if (globalStatistics) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:149:                    
        // iterate over the components update placeholders from globalStatistics
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:150:                    
        this.globalStatisticsAggregator.aggregate(globalStatistics);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:151:                    
    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:152:                    
}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:153:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:154:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:155:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:156:        catch 
(error) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:157:            
this.state = HybridQueryExecutionContextBaseStates.done;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:158:            throw 
error;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:159:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:160:        // create 
component execution contexts for each component query
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:161:        
this.createComponentExecutionContexts();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:162:        this.state 
= HybridQueryExecutionContextBaseStates.initialized;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:163:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:164:    async 
executeComponentQueries(diagnosticNode, fetchMoreRespHeaders) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:165:        if 
(this.isSingleComponent) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:166:            await 
this.drainSingleComponent(diagnosticNode, fetchMoreRespHeaders);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:167:            return;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:168:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:169:        try {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:170:            if 
(this.options.enableQueryControl) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:171:                // 
track componentExecutionContexts with remaining results and call them in LIFO order
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:172:                if 
(this.componentsExecutionContext.length > 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:173:                    
const componentExecutionContext = this.componentsExecutionContext.pop();
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:174:                    
if (componentExecutionContext.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:175:                    
    const result = await componentExecutionContext.fetchMore(diagnosticNode);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:176:                    
    mergeHeaders(fetchMoreRespHeaders, result.headers);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:177:                    
    const resultData = result.result;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:178:                    
    if (result && resultData) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:179:                    
        resultData.forEach((item) => {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:180:                    
            const hybridItem = HybridSearchQueryResult.create(item);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:181:                    
            if (!this.uniqueItems.has(hybridItem.rid)) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:182:                    
                this.uniqueItems.set(hybridItem.rid, hybridItem);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:183:                    
            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:184:                    
        });
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:185:                    
    }
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:186:                    
    if (componentExecutionContext.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:187:                    
        this.componentsExecutionContext.push(componentExecutionContext);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:188:                    
    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:189:                    
}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:190:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:191:                if 
(this.componentsExecutionContext.length === 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:192:                    
this.processUniqueItems();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:193:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:194:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:195:            else {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:196:                for 
(const componentExecutionContext of this.componentsExecutionContext) {
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:197:                    
while (componentExecutionContext.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:198:                    
    const result = await componentExecutionContext.fetchMore(diagnosticNode);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:199:                    
    mergeHeaders(fetchMoreRespHeaders, result.headers);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:200:                    
    const resultData = result.result;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:201:                    
    if (result && resultData) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:202:                    
        resultData.forEach((item) => {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:203:                    
            const hybridItem = HybridSearchQueryResult.create(item);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:204:                    
            if (!this.uniqueItems.has(hybridItem.rid)) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:205:                    
                this.uniqueItems.set(hybridItem.rid, hybridItem);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:206:                    
            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:207:                    
        });
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:208:                    
    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:209:                    
}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:210:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:211:                
this.processUniqueItems();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:212:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:213:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:214:        catch 
(error) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:215:            
this.state = HybridQueryExecutionContextBaseStates.done;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:216:            throw 
error;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:217:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:218:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:219:    
processUniqueItems() {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:220:        
this.uniqueItems.forEach((item) => this.hybridSearchResult.push(item));
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:221:        if 
(this.hybridSearchResult.length === 0 || this.hybridSearchResult.length === 1) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:222:            // 
return the result as no or one element is present
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:223:            
this.hybridSearchResult.forEach((item) => this.buffer.push(item.data));
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:224:            
this.state = HybridQueryExecutionContextBaseStates.draining;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:225:            return;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:226:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:227:        // 
Initialize an array to hold ranks for each document
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:228:        const 
componentWeights = this.extractComponentWeights();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:229:        const 
sortedHybridSearchResult = this.sortHybridSearchResultByRRFScore(this.hybridSearchResult, componentWeights);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:230:        // store 
the result to buffer
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:231:        // add only 
data from the sortedHybridSearchResult in the buffer
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:232:        
sortedHybridSearchResult.forEach((item) => this.buffer.push(item.data));
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:233:        
this.applySkipAndTakeToBuffer();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:234:        this.state 
= HybridQueryExecutionContextBaseStates.draining;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:235:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:236:    
applySkipAndTakeToBuffer() {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:237:        const { 
skip, take } = this.partitionedQueryExecutionInfo.hybridSearchQueryInfo;
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:334:                if 
(componentExecutionContext.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:335:                    
const result = await componentExecutionContext.fetchMore(diagNode);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:336:                    
mergeHeaders(fetchMoreRespHeaders, result.headers);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:337:                    
const resultData = result.result;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:338:                    
if (result && resultData) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:339:                    
    resultData.forEach((item) => {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:340:                    
        this.hybridSearchResult.push(HybridSearchQueryResult.create(item));
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:341:                    
    });
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:342:                    
}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:343:                }
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:344:                if 
(!componentExecutionContext.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:345:                    
this.state = HybridQueryExecutionContextBaseStates.draining;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:346:                    
this.hybridSearchResult.forEach((item) => this.buffer.push(item.data));
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:347:                    
this.applySkipAndTakeToBuffer();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:348:                    
this.state = HybridQueryExecutionContextBaseStates.draining;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:349:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:350:                
return;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:351:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:352:            else {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:353:                
const componentExecutionContext = this.componentsExecutionContext[0];
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:354:                
const hybridSearchResult = [];
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:355:                // 
add check for enable query control
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:356:                
while (componentExecutionContext.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:357:                    
const result = await componentExecutionContext.fetchMore(diagNode);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:358:                    
mergeHeaders(fetchMoreRespHeaders, result.headers);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:359:                    
const resultData = result.result;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:360:                    
if (result && resultData) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:361:                    
    resultData.forEach((item) => {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:362:                    
        hybridSearchResult.push(HybridSearchQueryResult.create(item));
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:363:                    
    });
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:364:                    
}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:365:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:366:                
hybridSearchResult.forEach((item) => this.buffer.push(item.data));
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:367:                
this.applySkipAndTakeToBuffer();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:368:                
this.state = HybridQueryExecutionContextBaseStates.draining;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:369:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:370:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:371:        catch 
(error) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:372:            
this.state = HybridQueryExecutionContextBaseStates.done;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:373:            throw 
error;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:374:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:375:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:376:    
createComponentExecutionContexts() {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:377:        // rewrite 
queries based on global statistics
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:378:        let 
queryInfos = this.partitionedQueryExecutionInfo.hybridSearchQueryInfo.componentQueryInfos;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:379:        if 
(this.partitionedQueryExecutionInfo.hybridSearchQueryInfo.requiresGlobalStatistics) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:380:            
queryInfos = 
this.processComponentQueries(this.partitionedQueryExecutionInfo.hybridSearchQueryInfo.componentQueryInfos, 
this.globalStatisticsAggregator.getResult());
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:381:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:382:        // create 
component execution contexts
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:383:        for (const 
componentQueryInfo of queryInfos) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:384:            const 
componentPartitionExecutionInfo = {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:385:                
partitionedQueryExecutionInfoVersion: 1,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:386:                
queryInfo: componentQueryInfo,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:387:                
queryRanges: this.partitionedQueryExecutionInfo.queryRanges,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:388:            };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:389:            const 
rewrittenSqlQuerySpec = typeof this.query === "string"
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:390:                ? 
componentQueryInfo.rewrittenQuery
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:391:                : {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:392:                    
query: componentQueryInfo.rewrittenQuery,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:393:                    
parameters: this.query?.parameters ?? [],
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:394:                };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:395:            const 
executionContext = new PipelinedQueryExecutionContext(this.clientContext, this.collectionLink, rewrittenSqlQuerySpec, 
this.options, componentPartitionExecutionInfo, this.correlatedActivityId, this.emitRawOrderByPayload, 
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js:396:            /* 
supportsContinuationTokens */ false);
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQueryExecutionContext.js.map:1:{"version":3,"file
":"hybridQueryExecutionContext.js","sourceRoot":"","sources":["../../../src/queryExecutionContext/hybridQueryExecutionC
ontext.ts"],"names":[],"mappings":"AAAA,uCAAuC;AACvC,kCAAkC;AAGlC,OAAO,EAAE,kBAAkB,EAAE,MAAM,eAAe,CAAC;AAWnD,OAAO,EAAE,
uBAAuB,EAAE,MAAM,uCAAuC,CAAC;AAChF,OAAO,EAAE,0BAA0B,EAAE,MAAM,6CAA6C,CAAC;AAGzF,OAAO,EAAE,gBAAgB,EAAE,YAAY,EAAE,MAAM,kB
AAkB,CAAC;AAClE,OAAO,EAAE,6BAA6B,EAAE,MAAM,oCAAoC,CAAC;AACnF,OAAO,EAAE,8BAA8B,EAAE,MAAM,qCAAqC,CAAC;AAGrF,OAAO,EACL,4CA
A4C,EAC5C,UAAU,GACX,MAAM,4BAA4B,CAAC;AAEpC,cAAc;AACd,MAAM,CAAN,IAAY,qCAKX;AALD,WAAY,qCAAqC;IAC/C,wEAA+B,CAAA;IAC/B,oEAA
2B,CAAA;IAC3B,8DAAqB,CAAA;IACrB,sDAAa,CAAA;AACf,CAAC,EALW,qCAAqC,KAArC,qCAAqC,QAKhD;AACD,MAAM,OAAO,2BAA2B;IAoB5B;IACA;I
ACA;IACA;IACA;IACA;IACA;IAzBF,gCAAgC,CAAmB;IACnD,0BAA0B,GAAuB,EAAE,CAAC;IACpD,QAAQ,CAAS;IACjB,KAAK,CAAwC;IAC7C,0BAA0B,C
AA6B;IACvD,qBAAqB,GAAY,IAAI,CAAC;IACtC,MAAM,GAA8B,EAAE,CAAC;IACvC,iBAAiB,GAAG,EAAE,CAAC;IACvB,4BAA4B,GAAG,wDAAwD,CAAC;I
ACxF,4BAA4B,GAAG,wDAAwD,CAAC;IACxF,gCAAgC,GACtC,4DAA4D,CAAC;IACvD,YAAY,GAAG,EAAE,CAAC,CAAC,qCAAqC;IACxD,MAAM,GAAgB,kBAA
kB,CAAC,6BAA6B,CAAC,CAAC;IACxE,kBAAkB,GAA8B,EAAE,CAAC;IACnD,WAAW,GAAG,IAAI,GAAG,EAAmC,CAAC;IACzD,iBAAiB,GAAY,KAAK,CAAC;
IAE3C,YACU,aAA4B,EAC5B,cAAsB,EACtB,KAA4B,EAC5B,OAAoB,EACpB,6BAA4D,EAC5D,oBAA4B,EAC5B,mBAAiC;QANjC,kBAAa,GAAb,aAAa,CAAe;
QAC5B,mBAAc,GAAd,cAAc,CAAQ;QACtB,UAAK,GAAL,KAAK,CAAuB;QAC5B,YAAO,GAAP,OAAO,CAAa;QACpB,kCAA6B,GAA7B,6BAA6B,CAA+B;QAC5D,y
BAAoB,GAApB,oBAAoB,CAAQ;QAC5B,wBAAmB,GAAnB,mBAAmB,CAAc;QAEzC,4CAA4C,CAAC,IAAI,CAAC,OAAO,CAAC,iBAAiB,EAAE;YAC3E,UAAU,CAA
C,YAAY,CAAC,IAAI,CAAC;SAC9B,CAAC,CAAC;QAEH,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,aAAa,CAAC;QACjE,IAAI,CAAC,QAAQ,GAAG,IAAI,CAA
C,OAAO,CAAC,YAAY,CAAC;QAC1C,IAAI,IAAI,CAAC,QAAQ,KAAK,SAAS,EAAE,CAAC;YAChC,IAAI,CAAC,QAAQ,GAAG,IAAI,CAAC,iBAAiB,CAAC;QAC
zC,CAAC;QACD,IAAI,6BAA6B,CAAC,qBAAqB,CAAC,wBAAwB,EAAE,CAAC;YACjF,MAAM,yBAAyB,GAAgB,EAAE,YAAY,EAAE,IAAI,CAAC,QAAQ,EAAE,C
AAC;YAC/E,IAAI,CAAC,0BAA0B,GAAG,IAAI,0BAA0B,EAAE,CAAC;YAEnE,MAAM,qBAAqB,GACzB,OAAO,IAAI,CAAC,KAAK,KAAK,QAAQ;gBAC5B,CAAC
,CAAC,IAAI,CAAC,6BAA6B,CAAC,qBAAqB,CAAC,qBAAqB;gBAChF,CAAC,CAAC;oBACE,KAAK,EAAE,IAAI,CAAC,6BAA6B,CAAC,qBAAqB,CAAC,qBAAq
B;oBACrF,UAAU,EAAE,IAAI,CAAC,KAAK,EAAE,UAAU,IAAI,EAAE;iBACzC,CAAC;YACR,MAAM,kCAAkC,GAAkC;gBACxE,oCAAoC,EAAE,CAAC;gBACvC
,SAAS,EAAE;oBACT,YAAY,EAAE,MAAM;oBACpB,cAAc,EAAE,KAAK;oBACrB,2BAA2B,EAAE,EAAE;oBAC/B,cAAc,EAAE,qBAAqB;oBACrC,sBAAsB,EAA
E,KAAK;iBAC9B;gBACD,WAAW,EAAE,IAAI,CAAC,mBAAmB;aACtC,CAAC;YAEF,IAAI,CAAC,gCAAgC,GAAG,IAAI,6BAA6B,CACvE,IAAI,CAAC,aAAa,E
AClB,IAAI,CAAC,cAAc,EACnB,qBAAqB,EACrB,yBAAyB,EACzB,kCAAkC,EAClC,IAAI,CAAC,oBAAoB,CAC1B,CAAC;QACJ,CAAC;aAAM,CAAC;YACN,I
AAI,CAAC,gCAAgC,EAAE,CAAC;YACxC,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,WAAW,CAAC;QACjE,CAAC;IACH,CAAC;IACM,KAAK,CAAC,QAAQ,CAAC
,cAAsC;QAC1D,MAAM,mBAAmB,GAAG,gBAAgB,EAAE,CAAC;QAC/C,OACE,CAAC,IAAI,CAAC,KAAK,KAAK,qCAAqC,CAAC,aAAa;YACjE,IAAI,CAAC,KAA
K,KAAK,qCAAqC,CAAC,WAAW,CAAC;YACnE,IAAI,CAAC,MAAM,CAAC,MAAM,KAAK,CAAC,EACxB,CAAC;YACD,MAAM,IAAI,CAAC,iBAAiB,CAAC,cAAc,E
AAE,mBAAmB,CAAC,CAAC;QACpE,CAAC;QAED,IAAI,IAAI,CAAC,KAAK,KAAK,qCAAqC,CAAC,QAAQ,IAAI,IAAI,CAAC,MAAM,CAAC,MAAM,GAAG,CAAC,
EAAE,CAAC;YAC5F,OAAO,IAAI,CAAC,QAAQ,CAAC,mBAAmB,CAAC,CAAC;QAC5C,CAAC;aAAM,CAAC;YACN,OAAO,IAAI,CAAC,IAAI,CAAC,mBAAmB,CAA
C,CAAC;QACxC,CAAC;IACH,CAAC;IAEM,cAAc;QACnB,QAAQ,IAAI,CAAC,KAAK,EAAE,CAAC;YACnB,KAAK,qCAAqC,CAAC,aAAa;gBACtD,OAAO,IAAI,
CAAC;YACd,KAAK,qCAAqC,CAAC,WAAW;gBACpD,OAAO,IAAI,CAAC;YACd,KAAK,qCAAqC,CAAC,QAAQ;gBACjD,OAAO,IAAI,CAAC,MAAM,CAAC,MAAM,G
AAG,CAAC,CAAC;YAChC,KAAK,qCAAqC,CAAC,IAAI;gBAC7C,OAAO,KAAK,CAAC;YACf;gBACE,OAAO,KAAK,CAAC;QACjB,CAAC;IACH,CAAC;IAEM,KAA
K,CAAC,SAAS,CAAC,cAAuC;QAC5D,MAAM,oBAAoB,GAAG,gBAAgB,EAAE,CAAC;QAChD,OAAO,IAAI,CAAC,iBAAiB,CAAC,cAAc,EAAE,oBAAoB,CAAC,C
AAC;IACtE,CAAC;IAEO,KAAK,CAAC,iBAAiB,CAC7B,cAAsC,EACtC,OAAsB;QAEtB,QAAQ,IAAI,CAAC,KAAK,EAAE,CAAC;YACnB,KAAK,qCAAqC,CAAC
,aAAa;gBACtD,MAAM,IAAI,CAAC,UAAU,CAAC,cAAc,EAAE,OAAO,CAAC,CAAC;gBAC/C,OAAO;oBACL,MAAM,EAAE,EAAE;oBACV,OAAO,EAAE,OAAO;iB
ACjB,CAAC;YAEJ,KAAK,qCAAqC,CAAC,WAAW;gBACpD,MAAM,IAAI,CAAC,uBAAuB,CAAC,cAAc,EAAE,OAAO,CAAC,CAAC;gBAC5D,OAAO;oBACL,MAAM,
EAAE,EAAE;oBACV,OAAO,EAAE,OAAO;iBACjB,CAAC;YACJ,KAAK,qCAAqC,CAAC,QAAQ;gBACjD,OAAO,IAAI,CAAC,KAAK,CAAC,OAAO,CAAC,CAAC;YA
C7B,KAAK,qCAAqC,CAAC,IAAI;gBAC7C,OAAO,IAAI,CAAC,IAAI,CAAC,OAAO,CAAC,CAAC;YAC5B;gBACE,MAAM,IAAI,KAAK,CAAC,kBAAkB,IAAI,CA
AC,KAAK,EAAE,CAAC,CAAC;QACpD,CAAC;IACH,CAAC;IAEO,KAAK,CAAC,UAAU,CACtB,cAAsC,EACtC,oBAAmC;QAEnC,IAAI,CAAC;YACH,OAAO,IAAI
,CAAC,gCAAgC,CAAC,cAAc,EAAE,EAAE,CAAC;gBAC9D,MAAM,MAAM,GAAG,MAAM,IAAI,CAAC,gCAAgC,CAAC,SAAS,CAAC,cAAc,CAAC,CAAC;gBACrF,
YAAY,CAAC,oBAAoB,EAAE,MAAM,CAAC,OAAO,CAAC,CAAC;gBACnD,IAAI,MAAM,IAAI,MAAM,CAAC,MAAM,EAAE,CAAC;oBAC5B,MAAM,UAAU,GAAI,MAA
M,CAAC,MAA8B,CAAC,MAAM,CAAC;oBACjE,KAAK,MAAM,IAAI,IAAI,UAAU,EAAE,CAAC;wBAC9B,MAAM,gBAAgB,GAAqB,IAAI,CAAC;wBAChD,IAAI,gB
AAgB,EAAE,CAAC;4BACrB,wEAAwE;4BACxE,IAAI,CAAC,0BAA0B,CAAC,SAAS,CAAC,gBAAgB,CAAC,CAAC;wBAC9D,CAAC;oBACH,CAAC;gBACH,CAAC;
YACH,CAAC;QACH,CAAC;QAAC,OAAO,KAAK,EAAE,CAAC;YACf,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,IAAI,CAAC;YACxD,MAAM,KAAK,CAAC;QACd,C
AAC;QAED,+DAA+D;QAC/D,IAAI,CAAC,gCAAgC,EAAE,CAAC;QACxC,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,WAAW,CAAC;IACjE,CAAC;IAEO,KAAK,C
AAC,uBAAuB,CACnC,cAAsC,EACtC,oBAAmC;QAEnC,IAAI,IAAI,CAAC,iBAAiB,EAAE,CAAC;YAC3B,MAAM,IAAI,CAAC,oBAAoB,CAAC,cAAc,EAAE,oB
AAoB,CAAC,CAAC;YACtE,OAAO;QACT,CAAC;QACD,IAAI,CAAC;YACH,IAAI,IAAI,CAAC,OAAO,CAAC,kBAAkB,EAAE,CAAC;gBACpC,sFAAsF;gBACtF,
IAAI,IAAI,CAAC,0BAA0B,CAAC,MAAM,GAAG,CAAC,EAAE,CAAC;oBAC/C,MAAM,yBAAyB,GAAG,IAAI,CAAC,0BAA0B,CAAC,GAAG,EAAE,CAAC;oBACxE
,IAAI,yBAAyB,CAAC,cAAc,EAAE,EAAE,CAAC;wBAC/C,MAAM,MAAM,GAAG,MAAM,yBAAyB,CAAC,SAAS,CAAC,cAAc,CAAC,CAAC;wBACzE,YAAY,CAAC,
oBAAoB,EAAE,MAAM,CAAC,OAAO,CAAC,CAAC;wBAEnD,MAAM,UAAU,GAAG,MAAM,CAAC,MAAM,CAAC;wBACjC,IAAI,MAAM,IAAI,UAAU,EAAE,CAAC;4BA
CzB,UAAU,CAAC,OAAO,CAAC,CAAC,IAAS,EAAE,EAAE;gCAC/B,MAAM,UAAU,GAAG,uBAAuB,CAAC,MAAM,CAAC,IAAI,CAAC,CAAC;gCACxD,IAAI,CAAC
,IAAI,CAAC,WAAW,CAAC,GAAG,CAAC,UAAU,CAAC,GAAG,CAAC,EAAE,CAAC;oCAC1C,IAAI,CAAC,WAAW,CAAC,GAAG,CAAC,UAAU,CAAC,GAAG,EAAE,U
AAU,CAAC,CAAC;gCACnD,CAAC;4BACH,CAAC,CAAC,CAAC;wBACL,CAAC;wBACD,IAAI,yBAAyB,CAAC,cAAc,EAAE,EAAE,CAAC;4BAC/C,IAAI,CAAC,0
BAA0B,CAAC,IAAI,CAAC,yBAAyB,CAAC,CAAC;wBAClE,CAAC;oBACH,CAAC;gBACH,CAAC;gBACD,IAAI,IAAI,CAAC,0BAA0B,CAAC,MAAM,KAAK,CAAC
,EAAE,CAAC;oBACjD,IAAI,CAAC,kBAAkB,EAAE,CAAC;gBAC5B,CAAC;YACH,CAAC;iBAAM,CAAC;gBACN,KAAK,MAAM,yBAAyB,IAAI,IAAI,CAAC,0BA
A0B,EAAE,CAAC;oBACxE,OAAO,yBAAyB,CAAC,cAAc,EAAE,EAAE,CAAC;wBAClD,MAAM,MAAM,GAAG,MAAM,yBAAyB,CAAC,SAAS,CAAC,cAAc,CAAC,CA
AC;wBACzE,YAAY,CAAC,oBAAoB,EAAE,MAAM,CAAC,OAAO,CAAC,CAAC;wBAEnD,MAAM,UAAU,GAAG,MAAM,CAAC,MAAM,CAAC;wBACjC,IAAI,MAAM,IAA
I,UAAU,EAAE,CAAC;4BACzB,UAAU,CAAC,OAAO,CAAC,CAAC,IAAS,EAAE,EAAE;gCAC/B,MAAM,UAAU,GAAG,uBAAuB,CAAC,MAAM,CAAC,IAAI,CAAC,C
AAC;gCACxD,IAAI,CAAC,IAAI,CAAC,WAAW,CAAC,GAAG,CAAC,UAAU,CAAC,GAAG,CAAC,EAAE,CAAC;oCAC1C,IAAI,CAAC,WAAW,CAAC,GAAG,CAAC,U
AAU,CAAC,GAAG,EAAE,UAAU,CAAC,CAAC;gCACnD,CAAC;4BACH,CAAC,CAAC,CAAC;wBACL,CAAC;oBACH,CAAC;gBACH,CAAC;gBACD,IAAI,CAAC,kBA
AkB,EAAE,CAAC;YAC5B,CAAC;QACH,CAAC;QAAC,OAAO,KAAK,EAAE,CAAC;YACf,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,IAAI,CAAC;YACxD,MAAM,K
AAK,CAAC;QACd,CAAC;IACH,CAAC;IAEO,kBAAkB;QACxB,IAAI,CAAC,WAAW,CAAC,OAAO,CAAC,CAAC,IAAI,EAAE,EAAE,CAAC,IAAI,CAAC,kBAAkB,
CAAC,IAAI,CAAC,IAAI,CAAC,CAAC,CAAC;QACvE,IAAI,IAAI,CAAC,kBAAkB,CAAC,MAAM,KAAK,CAAC,IAAI,IAAI,CAAC,kBAAkB,CAAC,MAAM,KAAK
,CAAC,EAAE,CAAC;YACjF,oDAAoD;YACpD,IAAI,CAAC,kBAAkB,CAAC,OAAO,CAAC,CAAC,IAAI,EAAE,EAAE,CAAC,IAAI,CAAC,MAAM,CAAC,IAAI,CA
AC,IAAI,CAAC,IAAI,CAAC,CAAC,CAAC;YACvE,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,QAAQ,CAAC;YAC5D,OAAO;QACT,CAAC;QAED,sDAAsD;QACtD
,MAAM,gBAAgB,GAAG,IAAI,CAAC,uBAAuB,EAAE,CAAC;QACxD,MAAM,wBAAwB,GAAG,IAAI,CAAC,gCAAgC,CACpE,IAAI,CAAC,kBAAkB,EACvB,gBAAg
B,CACjB,CAAC;QACF,6BAA6B;QAC7B,gEAAgE;QAChE,wBAAwB,CAAC,OAAO,CAAC,CAAC,IAAI,EAAE,EAAE,CAAC,IAAI,CAAC,MAAM,CAAC,IAAI,CAA
C,IAAI,CAAC,IAAI,CAAC,CAAC,CAAC;QACxE,IAAI,CAAC,wBAAwB,EAAE,CAAC;QAChC,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,QAAQ,CAAC;IAC9D,
CAAC;IAEO,wBAAwB;QAC9B,MAAM,EAAE,IAAI,EAAE,IAAI,EAAE,GAAG,IAAI,CAAC,6BAA6B,CAAC,qBAAqB,CAAC;QAChF,IAAI,IAAI,EAAE,CAAC;Y
ACT,IAAI,CAAC,MAAM,GAAG,IAAI,IAAI,IAAI,CAAC,MAAM,CAAC,MAAM,CAAC,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC,IAAI,CAAC,MAAM,CAAC,KAAK,
CAAC,IAAI,CAAC,CAAC;QAC1E,CAAC;QACD,IAAI,IAAI,EAAE,CAAC;YACT,IAAI,CAAC,MAAM,GAAG,IAAI,IAAI,CAAC,CAAC,CAAC,CAAC,EAAE,CAA
C,CAAC,CAAC,IAAI,CAAC,MAAM,CAAC,KAAK,CAAC,CAAC,EAAE,IAAI,CAAC,CAAC;QAC5D,CAAC;IACH,CAAC;IAEO,KAAK,CAAC,KAAK,CAAC,oBAAmC
;QACrD,IAAI,CAAC;YACH,IAAI,IAAI,CAAC,MAAM,CAAC,MAAM,KAAK,CAAC,EAAE,CAAC;gBAC7B,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,IAAI,CAA
C;gBACxD,OAAO,IAAI,CAAC,IAAI,CAAC,oBAAoB,CAAC,CAAC;YACzC,CAAC;YACD,MAAM,MAAM,GAAG,IAAI,CAAC,MAAM,CAAC,KAAK,CAAC,CAAC,EA
AE,IAAI,CAAC,QAAQ,CAAC,CAAC;YACnD,IAAI,CAAC,MAAM,GAAG,IAAI,CAAC,MAAM,CAAC,KAAK,CAAC,IAAI,CAAC,QAAQ,CAAC,CAAC;YAC/C,IAAI
,IAAI,CAAC,MAAM,CAAC,MAAM,KAAK,CAAC,EAAE,CAAC;gBAC7B,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,IAAI,CAAC;YAC1D,CAAC;YACD,OAAO;gBA
CL,MAAM,EAAE,MAAM;gBACd,OAAO,EAAE,oBAAoB;aAC9B,CAAC;QACJ,CAAC;QAAC,OAAO,KAAK,EAAE,CAAC;YACf,IAAI,CAAC,KAAK,GAAG,qCAAqC,
CAAC,IAAI,CAAC;YACxD,MAAM,KAAK,CAAC;QACd,CAAC;IACH,CAAC;IAEO,KAAK,CAAC,QAAQ,CAAC,mBAAkC;QACvD,IAAI,CAAC;YACH,IAAI,IAAI,
CAAC,MAAM,CAAC,MAAM,KAAK,CAAC,EAAE,CAAC;gBAC7B,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,IAAI,CAAC;gBACxD,OAAO,IAAI,CAAC,IAAI,CAA
C,mBAAmB,CAAC,CAAC;YACxC,CAAC;YACD,MAAM,MAAM,GAAG,IAAI,CAAC,MAAM,CAAC,KAAK,EAAE,CAAC;YACnC,IAAI,IAAI,CAAC,MAAM,CAAC,MAA
M,KAAK,CAAC,EAAE,CAAC;gBAC7B,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,IAAI,CAAC;YAC1D,CAAC;YACD,OAAO;gBACL,MAAM,EAAE,MAAM;gBACd,
OAAO,EAAE,mBAAmB;aAC7B,CAAC;QACJ,CAAC;QAAC,OAAO,KAAK,EAAE,CAAC;YACf,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,IAAI,CAAC;YACxD,MAA
M,KAAK,CAAC;QACd,CAAC;IACH,CAAC;IAEO,IAAI,CAAC,oBAAmC;QAC9C,OAAO;YACL,MAAM,EAAE,SAAS;YACjB,OAAO,EAAE,oBAAoB;SAC9B,CAAC;
IACJ,CAAC;IAEO,gCAAgC,CACtC,kBAA6C,EAC7C,gBAAmC;QAEnC,IAAI,kBAAkB,CAAC,MAAM,KAAK,CAAC,EAAE,CAAC;YACpC,OAAO,EAAE,CAAC;QA
CZ,CAAC;QACD,MAAM,UAAU,GAAuC,kBAAkB,CAAC,GAAG,CAAC,CAAC,IAAI,EAAE,EAAE,CAAC,CAAC;YACvF,GAAG,EAAE,IAAI,CAAC,GAAG;YACb,KA
AK,EAAE,IAAI,KAAK,CAAC,IAAI,CAAC,eAAe,CAAC,MAAM,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC;SACtD,CAAC,CAAC,CAAC;QACJ,yCAAyC;QACzC,KA
AK,IAAI,CAAC,GAAG,CAAC,EAAE,CAAC,GAAG,kBAAkB,CAAC,CAAC,CAAC,CAAC,eAAe,CAAC,MAAM,EAAE,CAAC,EAAE,EAAE,CAAC;YACtE,yCAAyC;Y
ACzC,kBAAkB,CAAC,IAAI,CAAC,CAAC,CAAC,EAAE,CAAC,EAAE,EAAE,CAC/B,gBAAgB,CAAC,CAAC,CAAC,CAAC,UAAU,CAAC,CAAC,CAAC,eAAe,CAAC
,CAAC,CAAC,EAAE,CAAC,CAAC,eAAe,CAAC,CAAC,CAAC,CAAC,CAC3E,CAAC;YAEF,eAAe;YACf,IAAI,IAAI,GAAG,CAAC,CAAC;YACb,KAAK,IAAI,CA
AC,GAAG,CAAC,EAAE,CAAC,GAAG,kBAAkB,CAAC,MAAM,EAAE,CAAC,EAAE,EAAE,CAAC;gBACnD,IACE,CAAC,GAAG,CAAC;oBACL,kBAAkB,CAAC,CAAC
,CAAC,CAAC,eAAe,CAAC,CAAC,CAAC,KAAK,kBAAkB,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,eAAe,CAAC,CAAC,CAAC,EACzF,CAAC;oBACD,EAAE,IAAI
,CAAC;gBACT,CAAC;gBACD,MAAM,SAAS,GAAG,UAAU,CAAC,SAAS,CACpC,CAAC,QAAQ,EAAE,EAAE,CAAC,QAAQ,CAAC,GAAG,KAAK,kBAAkB,CAAC,CAA
C,CAAC,CAAC,GAAG,CACzD,CAAC;gBACF,UAAU,CAAC,SAAS,CAAC,CAAC,KAAK,CAAC,CAAC,CAAC,GAAG,IAAI,CAAC,CAAC,eAAe;YACxD,CAAC;QACH
,CAAC;QAED,4CAA4C;QAC5C,MAAM,SAAS,GAAG,UAAU,CAAC,GAAG,CAAC,CAAC,IAAI,EAAE,EAAE,CAAC,CAAC;YAC1C,GAAG,EAAE,IAAI,CAAC,GAAG
;YACb,QAAQ,EAAE,IAAI,CAAC,eAAe,CAAC,IAAI,CAAC,KAAK,EAAE,IAAI,CAAC,YAAY,EAAE,gBAAgB,CAAC;SAChF,CAAC,CAAC,CAAC;QAEJ,2BAA2
B;QAC3B,SAAS,CAAC,IAAI,CAAC,CAAC,CAAC,EAAE,CAAC,EAAE,EAAE,CAAC,CAAC,CAAC,QAAQ,GAAG,CAAC,CAAC,QAAQ,CAAC,CAAC;QAClD,mDAAm
D;QACnD,MAAM,wBAAwB,GAAG,SAAS,CAAC,GAAG,CAAC,CAAC,SAAS,EAAE,EAAE,CAC3D,kBAAkB,CAAC,IAAI,CAAC,CAAC,IAAI,EAAE,EAAE,CAAC,I
AAI,CAAC,GAAG,KAAK,SAAS,CAAC,GAAG,CAAC,CAC9D,CAAC;QACF,OAAO,wBAAwB,CAAC;IAClC,CAAC;IAEO,KAAK,CAAC,oBAAoB,CAChC,QAAgC,EA
ChC,oBAAmC;QAEnC,IAAI,IAAI,CAAC,0BAA0B,IAAI,IAAI,CAAC,0BAA0B,CAAC,MAAM,KAAK,CAAC,EAAE,CAAC;YACpF,IAAI,CAAC,MAAM,CAAC,KA
AK,CAAC,oDAAoD,CAAC,CAAC;YACxE,OAAO;QACT,CAAC;QACD,IAAI,CAAC;YACH,IAAI,IAAI,CAAC,OAAO,CAAC,kBAAkB,EAAE,CAAC;gBACpC,MAAM
,yBAAyB,GAAG,IAAI,CAAC,0BAA0B,CAAC,CAAC,CAAC,CAAC;gBACrE,IAAI,yBAAyB,CAAC,cAAc,EAAE,EAAE,CAAC;oBAC/C,MAAM,MAAM,GAAG,MAA
M,yBAAyB,CAAC,SAAS,CAAC,QAAQ,CAAC,CAAC;oBACnE,YAAY,CAAC,oBAAoB,EAAE,MAAM,CAAC,OAAO,CAAC,CAAC;oBAEnD,MAAM,UAAU,GAAG,MAAM
,CAAC,MAAM,CAAC;oBAEjC,IAAI,MAAM,IAAI,UAAU,EAAE,CAAC;wBACzB,UAAU,CAAC,OAAO,CAAC,CAAC,IAAS,EAAE,EAAE;4BAC/B,IAAI,CAAC,kB
AAkB,CAAC,IAAI,CAAC,uBAAuB,CAAC,MAAM,CAAC,IAAI,CAAC,CAAC,CAAC;wBACrE,CAAC,CAAC,CAAC;oBACL,CAAC;gBACH,CAAC;gBACD,IAAI,CA
AC,yBAAyB,CAAC,cAAc,EAAE,EAAE,CAAC;oBAChD,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,QAAQ,CAAC;oBAC5D,IAAI,CAAC,kBAAkB,CAAC,OAAO,C
AAC,CAAC,IAAI,EAAE,EAAE,CAAC,IAAI,CAAC,MAAM,CAAC,IAAI,CAAC,IAAI,CAAC,IAAI,CAAC,CAAC,CAAC;oBACvE,IAAI,CAAC,wBAAwB,EAAE,C
AAC;oBAChC,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,QAAQ,CAAC;gBAC9D,CAAC;gBACD,OAAO;YACT,CAAC;iBAAM,CAAC;gBACN,MAAM,yBAAyB,GAAG
,IAAI,CAAC,0BAA0B,CAAC,CAAC,CAAC,CAAC;gBACrE,MAAM,kBAAkB,GAA8B,EAAE,CAAC;gBACzD,qCAAqC;gBACrC,OAAO,yBAAyB,CAAC,cAAc,EAA
E,EAAE,CAAC;oBAClD,MAAM,MAAM,GAAG,MAAM,yBAAyB,CAAC,SAAS,CAAC,QAAQ,CAAC,CAAC;oBACnE,YAAY,CAAC,oBAAoB,EAAE,MAAM,CAAC,OAAO
,CAAC,CAAC;oBAEnD,MAAM,UAAU,GAAG,MAAM,CAAC,MAAM,CAAC;oBACjC,IAAI,MAAM,IAAI,UAAU,EAAE,CAAC;wBACzB,UAAU,CAAC,OAAO,CAAC,CA
AC,IAAS,EAAE,EAAE;4BAC/B,kBAAkB,CAAC,IAAI,CAAC,uBAAuB,CAAC,MAAM,CAAC,IAAI,CAAC,CAAC,CAAC;wBAChE,CAAC,CAAC,CAAC;oBACL,CA
AC;gBACH,CAAC;gBACD,kBAAkB,CAAC,OAAO,CAAC,CAAC,IAAI,EAAE,EAAE,CAAC,IAAI,CAAC,MAAM,CAAC,IAAI,CAAC,IAAI,CAAC,IAAI,CAAC,CA
AC,CAAC;gBAClE,IAAI,CAAC,wBAAwB,EAAE,CAAC;gBAChC,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,QAAQ,CAAC;YAC9D,CAAC;QACH,CAAC;QAAC,OA
AO,KAAK,EAAE,CAAC;YACf,IAAI,CAAC,KAAK,GAAG,qCAAqC,CAAC,IAAI,CAAC;YACxD,MAAM,KAAK,CAAC;QACd,CAAC;IACH,CAAC;IAEO,gCAAgC;Q
ACtC,6CAA6C;QAC7C,IAAI,UAAU,GACZ,IAAI,CAAC,6BAA6B,CAAC,qBAAqB,CAAC,mBAAmB,CAAC;QAC/E,IAAI,IAAI,CAAC,6BAA6B,CAAC,qBAAqB,
CAAC,wBAAwB,EAAE,CAAC;YACtF,UAAU,GAAG,IAAI,CAAC,uBAAuB,CACvC,IAAI,CAAC,6BAA6B,CAAC,qBAAqB,CAAC,mBAAmB,EAC5E,IAAI,CAAC,0
BAA0B,CAAC,SAAS,EAAE,CAC5C,CAAC;QACJ,CAAC;QACD,sCAAsC;QACtC,KAAK,MAAM,kBAAkB,IAAI,UAAU,EAAE,CAAC;YAC5C,MAAM,+BAA+B,GAAk
C;gBACrE,oCAAoC,EAAE,CAAC;gBACvC,SAAS,EAAE,kBAAkB;gBAC7B,WAAW,EAAE,IAAI,CAAC,6BAA6B,CAAC,WAAW;aAC5D,CAAC;YACF,MAAM,qBAA
qB,GACzB,OAAO,IAAI,CAAC,KAAK,KAAK,QAAQ;gBAC5B,CAAC,CAAC,kBAAkB,CAAC,cAAc;gBACnC,CAAC,CAAC;oBACE,KAAK,EAAE,kBAAkB,CAAC,c
AAc;oBACxC,UAAU,EAAE,IAAI,CAAC,KAAK,EAAE,UAAU,IAAI,EAAE;iBACzC,CAAC;YACR,MAAM,gBAAgB,GAAG,IAAI,8BAA8B,CACzD,IAAI,CAAC,a
AAa,EAClB,IAAI,CAAC,cAAc,EACnB,qBAAqB,EACrB,IAAI,CAAC,OAAO,EACZ,+BAA+B,EAC/B,IAAI,CAAC,oBAAoB,EACzB,IAAI,CAAC,qBAAqB;YA
C1B,gCAAgC,CAAC,KAAK,CACvC,CAAC;YACF,IAAI,CAAC,0BAA0B,CAAC,IAAI,CAAC,gBAAgB,CAAC,CAAC;QACzD,CAAC;QACD,IAAI,CAAC,iBAAiB,
GAAG,IAAI,CAAC,0BAA0B,CAAC,MAAM,KAAK,CAAC,CAAC;IACxE,CAAC;IACO,uBAAuB,CAC7B,mBAAgC,EAChC,WAA6B;QAE7B,OAAO,mBAAmB,CAAC,G
AAG,CAAC,CAAC,SAAS,EAAE,EAAE;YAC3C,IAAI,2BAA2B,GAAG,SAAS,CAAC,kBAAkB,CAAC;YAC/D,IAAI,SAAS,CAAC,OAAO,IAAI,SAAS,CAAC,OAAO
,CAAC,MAAM,GAAG,CAAC,EAAE,CAAC;gBACtD,IAAI,CAAC,SAAS,CAAC,sBAAsB,EAAE,CAAC;oBACtC,MAAM,IAAI,KAAK,CAAC,gEAAgE,CAAC,CAAC;
gBACpF,CAAC;gBACD,2BAA2B,GAAG,SAAS,CAAC,kBAAkB,CAAC,GAAG,CAAC,CAAC,IAAI,EAAE,EAAE,CACtE,IAAI,CAAC,4BAA4B,CAAC,IAAI,EAAE
,WAAW,EAAE,mBAAmB,CAAC,MAAM,CAAC,CACjF,CAAC;YACJ,CAAC;YACD,OAAO;gBACL,GAAG,SAAS;gBACZ,cAAc,EAAE,IAAI,CAAC,4BAA4B,CAC/C,
SAAS,CAAC,cAAc,EACxB,WAAW,EACX,mBAAmB,CAAC,MAAM,CAC3B;gBACD,kBAAkB,EAAE,2BAA2B;aAChD,CAAC;QACJ,CAAC,CAAC,CAAC;IACL,CAAC
;IACD,4EAA4E;IAC5E,4EAA4E;IAC5E,sFAAsF;IACtF,oCAAoC;IACpC,2BAA2B;IAC3B,qEAAqE;IACrE,4CAA4C;IAC5C,OAAO;IAEP,wEAAwE;IACxE
,+DAA+D;IAC/D,mCAAmC;IACnC,6BAA6B;IAC7B,4EAA4E;IAC5E,yCAAyC;IACzC,SAAS;IACT,4BAA4B;IAC5B,6BAA6B;IAC7B,4EAA4E;IAC5E,0CAA
0C;IAC1C,SAAS;IACT,QAAQ;IAER,kBAAkB;IAClB,IAAI;IAEI,4BAA4B,CAClC,KAAa,EACb,WAA6B,EAC7B,cAAsB;QAEtB,IACE,CAAC,WAAW;YACZ,
CAAC,WAAW,CAAC,aAAa;YAC1B,CAAC,KAAK,CAAC,OAAO,CAAC,WAAW,CAAC,kBAAkB,CAAC,EAC9C,CAAC;YACD,MAAM,IAAI,KAAK,CAAC,+BAA+B,CAA
C,CAAC;QACnD,CAAC;QACD,+BAA+B;QAC/B,KAAK,GAAG,KAAK,CAAC,OAAO,CACnB,IAAI,MAAM,CAAC,IAAI,IAAI,CAAC,gCAAgC,GAAG,EAAE,GAAG,
CAAC,EAC7D,WAAW,CAAC,aAAa,CAAC,QAAQ,EAAE,CACrC,CAAC;QACF,IAAI,eAAe,GAAW,CAAC,CAAC;QAChC,KAAK,IAAI,CAAC,GAAG,CAAC,EAAE,C
AAC,GAAG,cAAc,EAAE,CAAC,EAAE,EAAE,CAAC;YACxC,mEAAmE;YACnE,MAAM,oBAAoB,GAAG,IAAI,IAAI,CAAC,4BAA4B,IAAI,CAAC,GAAG,CAAC;YA
C3E,MAAM,mBAAmB,GAAG,IAAI,IAAI,CAAC,4BAA4B,IAAI,CAAC,GAAG,CAAC;YAC1E,IAAI,CAAC,KAAK,CAAC,QAAQ,CAAC,oBAAoB,CAAC,EAAE,CAA
C;gBAC1C,SAAS;YACX,CAAC;YACD,MAAM,KAAK,GAAG,WAAW,CAAC,kBAAkB,CAAC,eAAe,CAAC,CAAC;YAC9D,4BAA4B;YAC5B,KAAK,GAAG,KAAK,CAAC
,OAAO,CAAC,IAAI,MAAM,CAAC,oBAAoB,EAAE,GAAG,CAAC,EAAE,KAAK,CAAC,cAAc,CAAC,QAAQ,EAAE,CAAC,CAAC;YAC9F,qBAAqB;YACrB,KAAK,GA
AG,KAAK,CAAC,OAAO,CAAC,IAAI,MAAM,CAAC,mBAAmB,EAAE,GAAG,CAAC,EAAE,IAAI,KAAK,CAAC,SAAS,CAAC,IAAI,CAAC,GAAG,CAAC,GAAG,CAAC
,CAAC;YAC9F,eAAe,EAAE,CAAC;QACpB,CAAC;QACD,OAAO,KAAK,CAAC;IACf,CAAC;IAEO,eAAe,GAAG,CACxB,KAAe,EACf,CAAS,EACT,gBAAmC,EAC
3B,EAAE;QACV,IAAI,KAAK,CAAC,MAAM,KAAK,gBAAgB,CAAC,MAAM,EAAE,CAAC;YAC7C,MAAM,IAAI,KAAK,CAAC,6CAA6C,CAAC,CAAC;QACjE,CAAC;
QACD,IAAI,QAAQ,GAAG,CAAC,CAAC;QACjB,KAAK,IAAI,CAAC,GAAG,CAAC,EAAE,CAAC,GAAG,KAAK,CAAC,MAAM,EAAE,CAAC,EAAE,EAAE,CAAC;YAC
tC,MAAM,IAAI,GAAG,KAAK,CAAC,CAAC,CAAC,CAAC;YACtB,MAAM,MAAM,GAAG,gBAAgB,CAAC,CAAC,CAAC,CAAC,MAAM,CAAC;YAC1C,QAAQ,IAAI,MA
AM,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,IAAI,CAAC,CAAC,CAAC;QACxC,CAAC;QACD,OAAO,QAAQ,CAAC;IAClB,CAAC,CAAC;IAEM,uBAAuB;QA
C7B,MAAM,qBAAqB,GAAG,IAAI,CAAC,6BAA6B,CAAC,qBAAqB,CAAC;QACvF,MAAM,yBAAyB,GAC7B,CAAC,qBAAqB,CAAC,gBAAgB;YACvC,qBAAqB,CAA
C,gBAAgB,CAAC,MAAM,KAAK,CAAC,CAAC;QAEtD,MAAM,MAAM,GAGN,EAAE,CAAC;QAET,KAAK,IAAI,KAAK,GAAG,CAAC,EAAE,KAAK,GAAG,qBAAqB,CA
AC,mBAAmB,CAAC,MAAM,EAAE,EAAE,KAAK,EAAE,CAAC;YACtF,MAAM,SAAS,GAAG,qBAAqB,CAAC,mBAAmB,CAAC,KAAK,CAAC,CAAC;YAEnE,IAAI,SAA
S,CAAC,OAAO,IAAI,SAAS,CAAC,OAAO,CAAC,MAAM,GAAG,CAAC,EAAE,CAAC;gBACtD,IAAI,CAAC,SAAS,CAAC,sBAAsB,EAAE,CAAC;oBACtC,MAAM,I
AAI,KAAK,CAAC,0DAA0D,CAAC,CAAC;gBAC9E,CAAC;gBAED,IAAI,CAAC,SAAS,CAAC,kBAAkB,IAAI,SAAS,CAAC,kBAAkB,CAAC,MAAM,KAAK,CAAC,E
AAE,CAAC;oBAC/E,MAAM,IAAI,KAAK,CAAC,iEAAiE,CAAC,CAAC;gBACrF,CAAC;YACH,CAAC;YACD,MAAM,eAAe,GAAG,yBAAyB;gBAC/C,CAAC,CAAC,
CAAC;gBACH,CAAC,CAAC,qBAAqB,CAAC,gBAAgB,CAAC,KAAK,CAAC,CAAC;YAClD,MAAM,UAAU,GAAG,SAAS,CAAC,OAAO,IAAI,SAAS,CAAC,OAAO,CAA
C,MAAM,GAAG,CAAC,CAAC;YACrE,MAAM,SAAS,GAAG,UAAU,IAAI,SAAS,CAAC,OAAO,CAAC,CAAC,CAAC,CAAC,QAAQ,CAAC,WAAW,CAAC,CAAC,CAAC,C
AAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;YACpF,MAAM,CAAC,IAAI,CAAC;gBACV,MAAM,EAAE,eAAe;gBACvB,UAAU,EAAE,CAAC,CAAS,EAAE,C
AAS,EAAE,EAAE,CAAC,SAAS,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC;aAC1D,CAAC,CAAC;QACL,CAAC;QACD,OAAO,MAAM,CAAC;IAChB,CAAC;CACF","s
ourcesContent":["// Copyright (c) Microsoft Corporation.\n// Licensed under the MIT License.\n\nimport type { 
AzureLogger } from \"@azure/logger\";\nimport { createClientLogger } from \"@azure/logger\";\nimport type { 
ClientContext } from \"../ClientContext.js\";\nimport type { DiagnosticNodeInternal } from 
\"../diagnostics/DiagnosticNodeInternal.js\";\nimport type {\n  FeedOptions,\n  GlobalStatistics,\n  
PartitionedQueryExecutionInfo,\n  QueryInfo,\n  QueryRange,\n  Response,\n} from \"../request/index.js\";\nimport { 
HybridSearchQueryResult } from \"../request/hybridSearchQueryResult.js\";\nimport { GlobalStatisticsAggregator } from 
\"./Aggregators/GlobalStatisticsAggregator.js\";\nimport type { CosmosHeaders } from \"./CosmosHeaders.js\";\nimport 
type { ExecutionContext } from \"./ExecutionContext.js\";\nimport { getInitialHeader, mergeHeaders } from 
\"./headerUtils.js\";\nimport { ParallelQueryExecutionContext } from \"./parallelQueryExecutionContext.js\";\nimport { 
PipelinedQueryExecutionContext } from \"./pipelinedQueryExecutionContext.js\";\nimport type { SqlQuerySpec } from 
\"./SqlQuerySpec.js\";\nimport { type ParallelQueryResult } from \"./parallelQueryResult.js\";\nimport {\n  
rejectContinuationTokenForUnsupportedQueries,\n  QueryTypes,\n} from \"./QueryValidationHelper.js\";\n\n/** @hidden 
*/\nexport enum HybridQueryExecutionContextBaseStates {\n  uninitialized = \"uninitialized\",\n  initialized = 
\"initialized\",\n  draining = \"draining\",\n  done = \"done\",\n}\nexport class HybridQueryExecutionContext 
implements ExecutionContext {\n  private globalStatisticsExecutionContext: ExecutionContext;\n  private 
componentsExecutionContext: ExecutionContext[] = [];\n  private pageSize: number;\n  private state: 
HybridQueryExecutionContextBaseStates;\n  private globalStatisticsAggregator: GlobalStatisticsAggregator;\n  private 
emitRawOrderByPayload: boolean = true;\n  private buffer: HybridSearchQueryResult[] = [];\n  private DEFAULT_PAGE_SIZE 
= 10;\n  private TOTAL_WORD_COUNT_PLACEHOLDER = \"documentdb-formattablehybridsearchquery-totalwordcount\";\n  private 
HIT_COUNTS_ARRAY_PLACEHOLDER = \"documentdb-formattablehybridsearchquery-hitcountsarray\";\n  private 
TOTAL_DOCUMENT_COUNT_PLACEHOLDER =\n    \"documentdb-formattablehybridsearchquery-totaldocumentcount\";\n  private 
RRF_CONSTANT = 60; // Constant for RRF score calculation\n  private logger: AzureLogger = 
createClientLogger(\"HybridQueryExecutionContext\");\n  private hybridSearchResult: HybridSearchQueryResult[] = [];\n  
private uniqueItems = new Map<string, HybridSearchQueryResult>();\n  private isSingleComponent: boolean = false;\n\n  
constructor(\n    private clientContext: ClientContext,\n    private collectionLink: string,\n    private query: 
string | SqlQuerySpec,\n    private options: FeedOptions,\n    private partitionedQueryExecutionInfo: 
PartitionedQueryExecutionInfo,\n    private correlatedActivityId: string,\n    private allPartitionsRanges: 
QueryRange[],\n  ) {\n    rejectContinuationTokenForUnsupportedQueries(this.options.continuationToken, [\n      
QueryTypes.hybridSearch(true),\n    ]);\n\n    this.state = HybridQueryExecutionContextBaseStates.uninitialized;\n    
this.pageSize = this.options.maxItemCount;\n    if (this.pageSize === undefined) {\n      this.pageSize = 
this.DEFAULT_PAGE_SIZE;\n    }\n    if (partitionedQueryExecutionInfo.hybridSearchQueryInfo.requiresGlobalStatistics) 
{\n      const globalStaticsQueryOptions: FeedOptions = { maxItemCount: this.pageSize };\n      
this.globalStatisticsAggregator = new GlobalStatisticsAggregator();\n\n      const globalStatisticsQuery: string | 
SqlQuerySpec =\n        typeof this.query === \"string\"\n          ? 
this.partitionedQueryExecutionInfo.hybridSearchQueryInfo.globalStatisticsQuery\n          : {\n              query: 
this.partitionedQueryExecutionInfo.hybridSearchQueryInfo.globalStatisticsQuery,\n              parameters: 
this.query?.parameters ?? [],\n            };\n      const globalStatisticsQueryExecutionInfo: 
PartitionedQueryExecutionInfo = {\n        partitionedQueryExecutionInfoVersion: 1,\n        queryInfo: {\n          
distinctType: \"None\",\n          hasSelectValue: false,\n          groupByAliasToAggregateType: {},\n          
rewrittenQuery: globalStatisticsQuery,\n          hasNonStreamingOrderBy: false,\n        },\n        queryRanges: 
this.allPartitionsRanges,\n      };\n\n      this.globalStatisticsExecutionContext = new 
ParallelQueryExecutionContext(\n        this.clientContext,\n        this.collectionLink,\n        
globalStatisticsQuery,\n        globalStaticsQueryOptions,\n        globalStatisticsQueryExecutionInfo,\n        
this.correlatedActivityId,\n      );\n    } else {\n      this.createComponentExecutionContexts();\n      this.state = 
HybridQueryExecutionContextBaseStates.initialized;\n    }\n  }\n  public async nextItem(diagnosticNode: 
DiagnosticNodeInternal): Promise<Response<any>> {\n    const nextItemRespHeaders = getInitialHeader();\n    while (\n  
    (this.state === HybridQueryExecutionContextBaseStates.uninitialized ||\n        this.state === 
HybridQueryExecutionContextBaseStates.initialized) &&\n      this.buffer.length === 0\n    ) {\n      await 
this.fetchMoreInternal(diagnosticNode, nextItemRespHeaders);\n    }\n\n    if (this.state === 
HybridQueryExecutionContextBaseStates.draining && this.buffer.length > 0) {\n      return 
this.drainOne(nextItemRespHeaders);\n    } else {\n      return this.done(nextItemRespHeaders);\n    }\n  }\n\n  
public hasMoreResults(): boolean {\n    switch (this.state) {\n      case 
HybridQueryExecutionContextBaseStates.uninitialized:\n        return true;\n      case 
HybridQueryExecutionContextBaseStates.initialized:\n        return true;\n      case 
HybridQueryExecutionContextBaseStates.draining:\n        return this.buffer.length > 0;\n      case 
HybridQueryExecutionContextBaseStates.done:\n        return false;\n      default:\n        return false;\n    }\n  
}\n\n  public async fetchMore(diagnosticNode?: DiagnosticNodeInternal): Promise<Response<any>> {\n    const 
fetchMoreRespHeaders = getInitialHeader();\n    return this.fetchMoreInternal(diagnosticNode, fetchMoreRespHeaders);\n 
 }\n\n  private async fetchMoreInternal(\n    diagnosticNode: DiagnosticNodeInternal,\n    headers: CosmosHeaders,\n  
): Promise<Response<any>> {\n    switch (this.state) {\n      case 
HybridQueryExecutionContextBaseStates.uninitialized:\n        await this.initialize(diagnosticNode, headers);\n        
return {\n          result: [],\n          headers: headers,\n        };\n\n      case 
HybridQueryExecutionContextBaseStates.initialized:\n        await this.executeComponentQueries(diagnosticNode, 
headers);\n        return {\n          result: [],\n          headers: headers,\n        };\n      case 
HybridQueryExecutionContextBaseStates.draining:\n        return this.drain(headers);\n      case 
HybridQueryExecutionContextBaseStates.done:\n        return this.done(headers);\n      default:\n        throw new 
Error(`Invalid state: ${this.state}`);\n    }\n  }\n\n  private async initialize(\n    diagnosticNode: 
DiagnosticNodeInternal,\n    fetchMoreRespHeaders: CosmosHeaders,\n  ): Promise<void> {\n    try {\n      while 
(this.globalStatisticsExecutionContext.hasMoreResults()) {\n        const result = await 
this.globalStatisticsExecutionContext.fetchMore(diagnosticNode);\n        mergeHeaders(fetchMoreRespHeaders, 
result.headers);\n        if (result && result.result) {\n          const resultData = (result.result as 
ParallelQueryResult).buffer;\n          for (const item of resultData) {\n            const globalStatistics: 
GlobalStatistics = item;\n            if (globalStatistics) {\n              // iterate over the components update 
placeholders from globalStatistics\n              this.globalStatisticsAggregator.aggregate(globalStatistics);\n       
     }\n          }\n        }\n      }\n    } catch (error) {\n      this.state = 
HybridQueryExecutionContextBaseStates.done;\n      throw error;\n    }\n\n    // create component execution contexts 
for each component query\n    this.createComponentExecutionContexts();\n    this.state = 
HybridQueryExecutionContextBaseStates.initialized;\n  }\n\n  private async executeComponentQueries(\n    
diagnosticNode: DiagnosticNodeInternal,\n    fetchMoreRespHeaders: CosmosHeaders,\n  ): Promise<void> {\n    if 
(this.isSingleComponent) {\n      await this.drainSingleComponent(diagnosticNode, fetchMoreRespHeaders);\n      
return;\n    }\n    try {\n      if (this.options.enableQueryControl) {\n        // track componentExecutionContexts 
with remaining results and call them in LIFO order\n        if (this.componentsExecutionContext.length > 0) {\n        
  const componentExecutionContext = this.componentsExecutionContext.pop();\n          if 
(componentExecutionContext.hasMoreResults()) {\n            const result = await 
componentExecutionContext.fetchMore(diagnosticNode);\n            mergeHeaders(fetchMoreRespHeaders, 
result.headers);\n\n            const resultData = result.result;\n            if (result && resultData) {\n           
   resultData.forEach((item: any) => {\n                const hybridItem = HybridSearchQueryResult.create(item);\n     
           if (!this.uniqueItems.has(hybridItem.rid)) {\n                  this.uniqueItems.set(hybridItem.rid, 
hybridItem);\n                }\n              });\n            }\n            if 
(componentExecutionContext.hasMoreResults()) {\n              
this.componentsExecutionContext.push(componentExecutionContext);\n            }\n          }\n        }\n        if 
(this.componentsExecutionContext.length === 0) {\n          this.processUniqueItems();\n        }\n      } else {\n    
    for (const componentExecutionContext of this.componentsExecutionContext) {\n          while 
(componentExecutionContext.hasMoreResults()) {\n            const result = await 
componentExecutionContext.fetchMore(diagnosticNode);\n            mergeHeaders(fetchMoreRespHeaders, 
result.headers);\n\n            const resultData = result.result;\n            if (result && resultData) {\n           
   resultData.forEach((item: any) => {\n                const hybridItem = HybridSearchQueryResult.create(item);\n     
           if (!this.uniqueItems.has(hybridItem.rid)) {\n                  this.uniqueItems.set(hybridItem.rid, 
hybridItem);\n                }\n              });\n            }\n          }\n        }\n        
this.processUniqueItems();\n      }\n    } catch (error) {\n      this.state = 
HybridQueryExecutionContextBaseStates.done;\n      throw error;\n    }\n  }\n\n  private processUniqueItems(): void 
{\n    this.uniqueItems.forEach((item) => this.hybridSearchResult.push(item));\n    if (this.hybridSearchResult.length 
=== 0 || this.hybridSearchResult.length === 1) {\n      // return the result as no or one element is present\n      
this.hybridSearchResult.forEach((item) => this.buffer.push(item.data));\n      this.state = 
HybridQueryExecutionContextBaseStates.draining;\n      return;\n    }\n\n    // Initialize an array to hold ranks for 
each document\n    const componentWeights = this.extractComponentWeights();\n    const sortedHybridSearchResult = 
this.sortHybridSearchResultByRRFScore(\n      this.hybridSearchResult,\n      componentWeights,\n    );\n    // store 
the result to buffer\n    // add only data from the sortedHybridSearchResult in the buffer\n    
sortedHybridSearchResult.forEach((item) => this.buffer.push(item.data));\n    this.applySkipAndTakeToBuffer();\n    
this.state = HybridQueryExecutionContextBaseStates.draining;\n  }\n\n  private applySkipAndTakeToBuffer(): void {\n    
const { skip, take } = this.partitionedQueryExecutionInfo.hybridSearchQueryInfo;\n    if (skip) {\n      this.buffer = 
skip >= this.buffer.length ? [] : this.buffer.slice(skip);\n    }\n    if (take) {\n      this.buffer = take <= 0 ? [] 
: this.buffer.slice(0, take);\n    }\n  }\n\n  private async drain(fetchMoreRespHeaders: CosmosHeaders): 
Promise<Response<any>> {\n    try {\n      if (this.buffer.length === 0) {\n        this.state = 
HybridQueryExecutionContextBaseStates.done;\n        return this.done(fetchMoreRespHeaders);\n      }\n      const 
result = this.buffer.slice(0, this.pageSize);\n      this.buffer = this.buffer.slice(this.pageSize);\n      if 
(this.buffer.length === 0) {\n        this.state = HybridQueryExecutionContextBaseStates.done;\n      }\n      return 
{\n        result: result,\n        headers: fetchMoreRespHeaders,\n      };\n    } catch (error) {\n      this.state 
= HybridQueryExecutionContextBaseStates.done;\n      throw error;\n    }\n  }\n\n  private async 
drainOne(nextItemRespHeaders: CosmosHeaders): Promise<Response<any>> {\n    try {\n      if (this.buffer.length === 0) 
{\n        this.state = HybridQueryExecutionContextBaseStates.done;\n        return this.done(nextItemRespHeaders);\n  
    }\n      const result = this.buffer.shift();\n      if (this.buffer.length === 0) {\n        this.state = 
HybridQueryExecutionContextBaseStates.done;\n      }\n      return {\n        result: result,\n        headers: 
nextItemRespHeaders,\n      };\n    } catch (error) {\n      this.state = 
HybridQueryExecutionContextBaseStates.done;\n      throw error;\n    }\n  }\n\n  private done(fetchMoreRespHeaders: 
CosmosHeaders): Response<any> {\n    return {\n      result: undefined,\n      headers: fetchMoreRespHeaders,\n    
};\n  }\n\n  private sortHybridSearchResultByRRFScore(\n    hybridSearchResult: HybridSearchQueryResult[],\n    
componentWeights: ComponentWeight[],\n  ): HybridSearchQueryResult[] {\n    if (hybridSearchResult.length === 0) {\n   
   return [];\n    }\n    const ranksArray: { rid: string; ranks: number[] }[] = hybridSearchResult.map((item) => ({\n 
     rid: item.rid,\n      ranks: new Array(item.componentScores.length).fill(0),\n    }));\n    // Compute ranks for 
each component score\n    for (let i = 0; i < hybridSearchResult[0].componentScores.length; i++) {\n      // Sort 
based on the i-th component score\n      hybridSearchResult.sort((a, b) =>\n        
componentWeights[i].comparator(a.componentScores[i], b.componentScores[i]),\n      );\n\n      // Assign ranks\n      
let rank = 1;\n      for (let j = 0; j < hybridSearchResult.length; j++) {\n        if (\n          j > 0 &&\n         
 hybridSearchResult[j].componentScores[i] !== hybridSearchResult[j - 1].componentScores[i]\n        ) {\n          
++rank;\n        }\n        const rankIndex = ranksArray.findIndex(\n          (rankItem) => rankItem.rid === 
hybridSearchResult[j].rid,\n        );\n        ranksArray[rankIndex].ranks[i] = rank; // 1-based rank\n      }\n    
}\n\n    // Compute RRF scores and sort based on them\n    const rrfScores = ranksArray.map((item) => ({\n      rid: 
item.rid,\n      rrfScore: this.computeRRFScore(item.ranks, this.RRF_CONSTANT, componentWeights),\n    }));\n\n    // 
Sort based on RRF scores\n    rrfScores.sort((a, b) => b.rrfScore - a.rrfScore);\n    // Map sorted RRF scores back to 
hybridSearchResult\n    const sortedHybridSearchResult = rrfScores.map((scoreItem) =>\n      
hybridSearchResult.find((item) => item.rid === scoreItem.rid),\n    );\n    return sortedHybridSearchResult;\n  }\n\n  
private async drainSingleComponent(\n    diagNode: DiagnosticNodeInternal,\n    fetchMoreRespHeaders: CosmosHeaders,\n 
 ): Promise<void> {\n    if (this.componentsExecutionContext && this.componentsExecutionContext.length !== 1) {\n      
this.logger.error(\"drainSingleComponent called on multiple components\");\n      return;\n    }\n    try {\n      if 
(this.options.enableQueryControl) {\n        const componentExecutionContext = this.componentsExecutionContext[0];\n   
     if (componentExecutionContext.hasMoreResults()) {\n          const result = await 
componentExecutionContext.fetchMore(diagNode);\n          mergeHeaders(fetchMoreRespHeaders, result.headers);\n\n      
    const resultData = result.result;\n\n          if (result && resultData) {\n            resultData.forEach((item: 
any) => {\n              this.hybridSearchResult.push(HybridSearchQueryResult.create(item));\n            });\n        
  }\n        }\n        if (!componentExecutionContext.hasMoreResults()) {\n          this.state = 
HybridQueryExecutionContextBaseStates.draining;\n          this.hybridSearchResult.forEach((item) => 
this.buffer.push(item.data));\n          this.applySkipAndTakeToBuffer();\n          this.state = 
HybridQueryExecutionContextBaseStates.draining;\n        }\n        return;\n      } else {\n        const 
componentExecutionContext = this.componentsExecutionContext[0];\n        const hybridSearchResult: 
HybridSearchQueryResult[] = [];\n        // add check for enable query control\n        while 
(componentExecutionContext.hasMoreResults()) {\n          const result = await 
componentExecutionContext.fetchMore(diagNode);\n          mergeHeaders(fetchMoreRespHeaders, result.headers);\n\n      
    const resultData = result.result;\n          if (result && resultData) {\n            resultData.forEach((item: 
any) => {\n              hybridSearchResult.push(HybridSearchQueryResult.create(item));\n            });\n          
}\n        }\n        hybridSearchResult.forEach((item) => this.buffer.push(item.data));\n        
this.applySkipAndTakeToBuffer();\n        this.state = HybridQueryExecutionContextBaseStates.draining;\n      }\n    } 
catch (error) {\n      this.state = HybridQueryExecutionContextBaseStates.done;\n      throw error;\n    }\n  }\n\n  
private createComponentExecutionContexts(): void {\n    // rewrite queries based on global statistics\n    let 
queryInfos: QueryInfo[] =\n      this.partitionedQueryExecutionInfo.hybridSearchQueryInfo.componentQueryInfos;\n    if 
(this.partitionedQueryExecutionInfo.hybridSearchQueryInfo.requiresGlobalStatistics) {\n      queryInfos = 
this.processComponentQueries(\n        this.partitionedQueryExecutionInfo.hybridSearchQueryInfo.componentQueryInfos,\n 
       this.globalStatisticsAggregator.getResult(),\n      );\n    }\n    // create component execution contexts\n    
for (const componentQueryInfo of queryInfos) {\n      const componentPartitionExecutionInfo: 
PartitionedQueryExecutionInfo = {\n        partitionedQueryExecutionInfoVersion: 1,\n        queryInfo: 
componentQueryInfo,\n        queryRanges: this.partitionedQueryExecutionInfo.queryRanges,\n      };\n      const 
rewrittenSqlQuerySpec: string | SqlQuerySpec =\n        typeof this.query === \"string\"\n          ? 
componentQueryInfo.rewrittenQuery\n          : {\n              query: componentQueryInfo.rewrittenQuery,\n            
  parameters: this.query?.parameters ?? [],\n            };\n      const executionContext = new 
PipelinedQueryExecutionContext(\n        this.clientContext,\n        this.collectionLink,\n        
rewrittenSqlQuerySpec,\n        this.options,\n        componentPartitionExecutionInfo,\n        
this.correlatedActivityId,\n        this.emitRawOrderByPayload,\n        /* supportsContinuationTokens */ false,\n     
 );\n      this.componentsExecutionContext.push(executionContext);\n    }\n    this.isSingleComponent = 
this.componentsExecutionContext.length === 1;\n  }\n  private processComponentQueries(\n    componentQueryInfos: 
QueryInfo[],\n    globalStats: GlobalStatistics,\n  ): QueryInfo[] {\n    return componentQueryInfos.map((queryInfo) 
=> {\n      let rewrittenOrderByExpressions = queryInfo.orderByExpressions;\n      if (queryInfo.orderBy && 
queryInfo.orderBy.length > 0) {\n        if (!queryInfo.hasNonStreamingOrderBy) {\n          throw new Error(\"The 
component query must have a non-streaming order by clause.\");\n        }\n        rewrittenOrderByExpressions = 
queryInfo.orderByExpressions.map((expr) =>\n          this.replacePlaceholdersWorkaroud(expr, globalStats, 
componentQueryInfos.length),\n        );\n      }\n      return {\n        ...queryInfo,\n        rewrittenQuery: 
this.replacePlaceholdersWorkaroud(\n          queryInfo.rewrittenQuery,\n          globalStats,\n          
componentQueryInfos.length,\n        ),\n        orderByExpressions: rewrittenOrderByExpressions,\n      };\n    });\n 
 }\n  // This method is commented currently, but we will switch back to using this\n  // once the gateway has been 
redeployed with the fix for placeholder indexes\n  // private replacePlaceholders(query: string, globalStats: 
GlobalStatistics): string {\n  //   // Replace total document count\n  //   query = query.replace(\n  //     new 
RegExp(`{${this.TOTAL_DOCUMENT_COUNT_PLACEHOLDER}}`, \"g\"),\n  //     globalStats.documentCount.toString(),\n  //   
);\n\n  //   // Replace total word counts and hit counts from fullTextStatistics\n  //   
globalStats.fullTextStatistics.forEach((stats, index) => {\n  //     // Replace total word counts\n  //     query = 
query.replace(\n  //       new RegExp(`{${this.TOTAL_WORD_COUNT_PLACEHOLDER}-${index}}`, \"g\"),\n  //       
stats.totalWordCount.toString(),\n  //     );\n  //     // Replace hit counts\n  //     query = query.replace(\n  //   
    new RegExp(`{${this.HIT_COUNTS_ARRAY_PLACEHOLDER}-${index}}`, \"g\"),\n  //       
`[${stats.hitCounts.join(\",\")}]`,\n  //     );\n  //   });\n\n  //   return query;\n  // }\n\n  private 
replacePlaceholdersWorkaroud(\n    query: string,\n    globalStats: GlobalStatistics,\n    componentCount: number,\n  
): string {\n    if (\n      !globalStats ||\n      !globalStats.documentCount ||\n      
!Array.isArray(globalStats.fullTextStatistics)\n    ) {\n      throw new Error(\"GlobalStats validation failed\");\n   
 }\n    // Replace total document count\n    query = query.replace(\n      new 
RegExp(`{${this.TOTAL_DOCUMENT_COUNT_PLACEHOLDER}}`, \"g\"),\n      globalStats.documentCount.toString(),\n    );\n    
let statisticsIndex: number = 0;\n    for (let i = 0; i < componentCount; i++) {\n      // Replace total word counts 
and hit counts from fullTextStatistics\n      const wordCountPlaceholder = 
`{${this.TOTAL_WORD_COUNT_PLACEHOLDER}-${i}}`;\n      const hitCountPlaceholder = 
`{${this.HIT_COUNTS_ARRAY_PLACEHOLDER}-${i}}`;\n      if (!query.includes(wordCountPlaceholder)) {\n        
continue;\n      }\n      const stats = globalStats.fullTextStatistics[statisticsIndex];\n      // Replace total word 
counts\n      query = query.replace(new RegExp(wordCountPlaceholder, \"g\"), stats.totalWordCount.toString());\n      
// Replace hit counts\n      query = query.replace(new RegExp(hitCountPlaceholder, \"g\"), 
`[${stats.hitCounts.join(\",\")}]`);\n      statisticsIndex++;\n    }\n    return query;\n  }\n\n  private 
computeRRFScore = (\n    ranks: number[],\n    k: number,\n    componentWeights: ComponentWeight[],\n  ): number => 
{\n    if (ranks.length !== componentWeights.length) {\n      throw new Error(\"Ranks and component weights length 
mismatch\");\n    }\n    let rrfScore = 0;\n    for (let i = 0; i < ranks.length; i++) {\n      const rank = 
ranks[i];\n      const weight = componentWeights[i].weight;\n      rrfScore += weight * (1 / (k + rank));\n    }\n    
return rrfScore;\n  };\n\n  private extractComponentWeights(): ComponentWeight[] {\n    const hybridSearchQueryInfo = 
this.partitionedQueryExecutionInfo.hybridSearchQueryInfo;\n    const useDefaultComponentWeight =\n      
!hybridSearchQueryInfo.componentWeights ||\n      hybridSearchQueryInfo.componentWeights.length === 0;\n\n    const 
result: {\n      weight: number;\n      comparator: (x: number, y: number) => number;\n    }[] = [];\n\n    for (let 
index = 0; index < hybridSearchQueryInfo.componentQueryInfos.length; ++index) {\n      const queryInfo = 
hybridSearchQueryInfo.componentQueryInfos[index];\n\n      if (queryInfo.orderBy && queryInfo.orderBy.length > 0) {\n  
      if (!queryInfo.hasNonStreamingOrderBy) {\n          throw new Error(\"The component query should have a non 
streaming order by\");\n        }\n\n        if (!queryInfo.orderByExpressions || queryInfo.orderByExpressions.length 
!== 1) {\n          throw new Error(\"The component query should have exactly one order by expression\");\n        }\n 
     }\n      const componentWeight = useDefaultComponentWeight\n        ? 1\n        : 
hybridSearchQueryInfo.componentWeights[index];\n      const hasOrderBy = queryInfo.orderBy && queryInfo.orderBy.length 
> 0;\n      const sortOrder = hasOrderBy && queryInfo.orderBy[0].includes(\"Ascending\") ? 1 : -1;\n      
result.push({\n        weight: componentWeight,\n        comparator: (x: number, y: number) => sortOrder * (x - y),\n  
    });\n    }\n    return result;\n  }\n}\n\nexport interface ComponentWeight {\n  weight: number;\n  comparator: (x: 
number, y: number) => number;\n}\n"]}
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:20:            while 
(fetchBuffer.length < this.pageSize && this.endpoint.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:21:                const 
response = await this.endpoint.fetchMore(diagnosticNode);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:22:                
mergeHeaders(fetchMoreRespHeaders, response.headers);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:23:                if 
(!response ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:24:                    
!response.result ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:25:                    
!response.result.buffer ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:26:                    
response.result.buffer.length === 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:27:                    if 
(fetchBuffer.length > 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:28:                       
 const copiedFetchBuffer = [...fetchBuffer];
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:29:                       
 fetchBuffer.length = 0; // Clear array in place
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:30:                       
 return { result: copiedFetchBuffer, headers: fetchMoreRespHeaders };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:31:                    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:32:                    
else {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:33:                       
 return { result: undefined, headers: fetchMoreRespHeaders };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:34:                    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:35:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:36:                
fetchBuffer.push(...response.result.buffer);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:37:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:38:            // Return 
collected items up to pageSize
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:39:            if 
(fetchBuffer.length > 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:40:                const 
temp = fetchBuffer.slice(0, this.pageSize);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:41:                
fetchBuffer.splice(0, this.pageSize); // Remove items in place
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:42:                return 
{ result: temp, headers: fetchMoreRespHeaders };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:43:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:44:            else {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:45:                return 
{ result: undefined, headers: fetchMoreRespHeaders };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:46:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:47:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:48:        catch (err) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:49:            
mergeHeaders(fetchMoreRespHeaders, err.headers);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:50:            
err.headers = fetchMoreRespHeaders;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:51:            throw err;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:52:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:53:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:54:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js:55://# 
sourceMappingURL=LegacyFetchImplementation.js.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\LegacyFetchImplementation.js.map:1:{"version":3,"file":
"LegacyFetchImplementation.js","sourceRoot":"","sources":["../../../src/queryExecutionContext/LegacyFetchImplementation
.ts"],"names":[],"mappings":"AAAA,uCAAuC;AACvC,kCAAkC;AAIlC,OAAO,EAAE,YAAY,EAAE,gBAAgB,EAAE,MAAM,kBAAkB,CAAC;AAGlE;;;GA
GG;AACH,MAAM,OAAO,yBAAyB;IAE1B;IACA;IAFV,YACU,QAA0B,EAC1B,QAAgB;QADhB,aAAQ,GAAR,QAAQ,CAAkB;QAC1B,aAAQ,GAAR,QAAQ,CAAQ;IA
CvB,CAAC;IAEJ,KAAK,CAAC,SAAS,CACb,cAAsC,EACtC,WAAkB;QAElB,mDAAmD;QACnD,MAAM,oBAAoB,GAAG,gBAAgB,EAAE,CAAC;QAEhD,IAAI,CAA
C;YACH,8DAA8D;YAC9D,OAAO,WAAW,CAAC,MAAM,GAAG,IAAI,CAAC,QAAQ,IAAI,IAAI,CAAC,QAAQ,CAAC,cAAc,EAAE,EAAE,CAAC;gBAC5E,MAAM,QA
AQ,GAAG,MAAM,IAAI,CAAC,QAAQ,CAAC,SAAU,CAAC,cAAc,CAAC,CAAC;gBAChE,YAAY,CAAC,oBAAoB,EAAE,QAAQ,CAAC,OAAO,CAAC,CAAC;gBAErD,
IACE,CAAC,QAAQ;oBACT,CAAC,QAAQ,CAAC,MAAM;oBAChB,CAAC,QAAQ,CAAC,MAAM,CAAC,MAAM;oBACvB,QAAQ,CAAC,MAAM,CAAC,MAAM,CAAC,MAAM
,KAAK,CAAC,EACnC,CAAC;oBACD,IAAI,WAAW,CAAC,MAAM,GAAG,CAAC,EAAE,CAAC;wBAC3B,MAAM,iBAAiB,GAAG,CAAC,GAAG,WAAW,CAAC,CAAC;wB
AC3C,WAAW,CAAC,MAAM,GAAG,CAAC,CAAC,CAAC,uBAAuB;wBAC/C,OAAO,EAAE,MAAM,EAAE,iBAAiB,EAAE,OAAO,EAAE,oBAAoB,EAAE,CAAC;oBACtE
,CAAC;yBAAM,CAAC;wBACN,OAAO,EAAE,MAAM,EAAE,SAAS,EAAE,OAAO,EAAE,oBAAoB,EAAE,CAAC;oBAC9D,CAAC;gBACH,CAAC;gBACD,WAAW,CAAC,
IAAI,CAAC,GAAG,QAAQ,CAAC,MAAM,CAAC,MAAM,CAAC,CAAC;YAC9C,CAAC;YAED,wCAAwC;YACxC,IAAI,WAAW,CAAC,MAAM,GAAG,CAAC,EAAE,CAAC;
gBAC3B,MAAM,IAAI,GAAG,WAAW,CAAC,KAAK,CAAC,CAAC,EAAE,IAAI,CAAC,QAAQ,CAAC,CAAC;gBACjD,WAAW,CAAC,MAAM,CAAC,CAAC,EAAE,IAAI,
CAAC,QAAQ,CAAC,CAAC,CAAC,wBAAwB;gBAC9D,OAAO,EAAE,MAAM,EAAE,IAAI,EAAE,OAAO,EAAE,oBAAoB,EAAE,CAAC;YACzD,CAAC;iBAAM,CAAC;g
BACN,OAAO,EAAE,MAAM,EAAE,SAAS,EAAE,OAAO,EAAE,oBAAoB,EAAE,CAAC;YAC9D,CAAC;QACH,CAAC;QAAC,OAAO,GAAQ,EAAE,CAAC;YAClB,YAAY,
CAAC,oBAAoB,EAAE,GAAG,CAAC,OAAO,CAAC,CAAC;YAChD,GAAG,CAAC,OAAO,GAAG,oBAAoB,CAAC;YACnC,MAAM,GAAG,CAAC;QACZ,CAAC;IACH,CAA
C;CACF","sourcesContent":["// Copyright (c) Microsoft Corporation.\n// Licensed under the MIT License.\n\nimport type 
{ Response } from \"../request/index.js\";\nimport type { DiagnosticNodeInternal } from 
\"../diagnostics/DiagnosticNodeInternal.js\";\nimport { mergeHeaders, getInitialHeader } from 
\"./headerUtils.js\";\nimport type { ExecutionContext } from \"./ExecutionContext.js\";\n\n/**\n * Legacy fetch 
implementation for when enableQueryControl is false\n * @hidden\n */\nexport class LegacyFetchImplementation {\n  
constructor(\n    private endpoint: ExecutionContext,\n    private pageSize: number,\n  ) {}\n\n  async fetchMore(\n   
 diagnosticNode: DiagnosticNodeInternal,\n    fetchBuffer: any[],\n  ): Promise<Response<any>> {\n    // Initialize 
headers fresh for each fetchMore call\n    const fetchMoreRespHeaders = getInitialHeader();\n\n    try {\n      // 
Keep fetching until we have enough items or no more results\n      while (fetchBuffer.length < this.pageSize && 
this.endpoint.hasMoreResults()) {\n        const response = await this.endpoint.fetchMore!(diagnosticNode);\n        
mergeHeaders(fetchMoreRespHeaders, response.headers);\n\n        if (\n          !response ||\n          
!response.result ||\n          !response.result.buffer ||\n          response.result.buffer.length === 0\n        ) 
{\n          if (fetchBuffer.length > 0) {\n            const copiedFetchBuffer = [...fetchBuffer];\n            
fetchBuffer.length = 0; // Clear array in place\n            return { result: copiedFetchBuffer, headers: 
fetchMoreRespHeaders };\n          } else {\n            return { result: undefined, headers: fetchMoreRespHeaders 
};\n          }\n        }\n        fetchBuffer.push(...response.result.buffer);\n      }\n\n      // Return collected 
items up to pageSize\n      if (fetchBuffer.length > 0) {\n        const temp = fetchBuffer.slice(0, this.pageSize);\n 
       fetchBuffer.splice(0, this.pageSize); // Remove items in place\n        return { result: temp, headers: 
fetchMoreRespHeaders };\n      } else {\n        return { result: undefined, headers: fetchMoreRespHeaders };\n      
}\n    } catch (err: any) {\n      mergeHeaders(fetchMoreRespHeaders, err.headers);\n      err.headers = 
fetchMoreRespHeaders;\n      throw err;\n    }\n  }\n}\n"]}
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:60:    
hasMoreResults(): boolean;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:61:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:62:     * 
Fetches more results from the query execution context.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:63:     * 
@param diagnosticNode - Optional diagnostic node for tracing.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:64:     * 
@returns A promise that resolves to the fetched results.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:65:     * 
@hidden
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:66:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:67:    
fetchMore(diagnosticNode?: DiagnosticNodeInternal): Promise<Response<any>>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:68:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:69:     * 
Processes buffered document producers
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:70:     * 
@returns A promise that resolves when processing is complete.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:71:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:72:    private 
processBufferedDocumentProducers;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:73:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:74:     * 
Processes a single document producer using template method pattern.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:75:     * 
Common structure with query-specific processing delegated to subclasses.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:76:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:77:    private 
processDocumentProducer;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:78:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:79:     * 
Fetches data from a document producer - implemented by subclasses.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:80:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:81:    
protected abstract fetchFromProducer(producer: DocumentProducer): Promise<Response<any>>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:82:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:83:     * 
Handles partition mapping updates - implemented in base class using template method pattern.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:84:     * Child 
classes provide query-specific parameters through abstract methods.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:85:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:86:    private 
handlePartitionMapping;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:87:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:88:     * Gets 
the continuation token to use - implemented by subclasses.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:89:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:90:    private 
getContinuationToken;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:91:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:92:     * 
Determines if buffered producers should continue to be processed based on query-specific rules.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:93:     * 
@param isUnfilledQueueEmpty - Whether the unfilled queue is empty
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:94:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:95:    
protected abstract shouldProcessBufferedProducers(isUnfilledQueueEmpty: boolean): boolean;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:96:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:97:     * 
Updates partition mapping - creates new entry or merges with existing for ORDER BY queries.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:98:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:99:    private 
updatePartitionMapping;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.d.ts:100:    /**
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:106:    
hasMoreResults() {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:107:        
return (!this.err &&
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:108:            
(this.buffer.length > 0 || this.state !== ParallelQueryExecutionContextBase.STATES.ended));
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:109:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:110:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:111:     * 
Fetches more results from the query execution context.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:112:     * @param 
diagnosticNode - Optional diagnostic node for tracing.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:113:     * 
@returns A promise that resolves to the fetched results.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:114:     * @hidden
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:115:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:116:    async 
fetchMore(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:117:        await 
this.bufferDocumentProducers(diagnosticNode);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:118:        await 
this.fillBufferFromBufferQueue();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:119:        
return this.drainBufferedItems();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:120:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:121:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:122:     * 
Processes buffered document producers
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:123:     * 
@returns A promise that resolves when processing is complete.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:124:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:125:    async 
processBufferedDocumentProducers() {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:126:        while 
(this.hasBufferedProducers() &&
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:127:            
this.shouldProcessBufferedProducers(this.isUnfilledQueueEmpty())) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:128:            
const producer = this.getNextBufferedProducer();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:129:            
if (!producer)
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:130:              
  break;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:131:            
await this.processDocumentProducer(producer);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:132:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:133:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:134:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:135:     * 
Processes a single document producer using template method pattern.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:136:     * Common 
structure with query-specific processing delegated to subclasses.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:137:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:138:    async 
processDocumentProducer(producer) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:139:        const 
response = await this.fetchFromProducer(producer);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:140:        
this._mergeWithActiveResponseHeaders(response.headers);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:141:        if 
(response.result) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:142:            
this.addToBuffer(response.result);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:143:            
this.handlePartitionMapping(producer, response.result);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:144:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:145:        // 
Handle producer lifecycle
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:146:        if 
(producer.peakNextItem() !== undefined) {
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:149:        else 
if (producer.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:150:            
this.moveToUnfilledQueue(producer);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:151:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:152:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:153:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:154:     * 
Handles partition mapping updates - implemented in base class using template method pattern.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:155:     * Child 
classes provide query-specific parameters through abstract methods.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:156:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:157:    
handlePartitionMapping(producer, result) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:158:        const 
itemCount = result?.length || 0;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:159:        const 
continuationToken = this.getContinuationToken(producer);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:160:        const 
mapping = {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:161:            
itemCount,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:162:            
partitionKeyRange: producer.targetPartitionKeyRange,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:163:            
continuationToken,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:164:        };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:165:        
this.updatePartitionMapping(mapping);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:166:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:167:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:168:     * Gets 
the continuation token to use - implemented by subclasses.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:169:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:170:    
getContinuationToken(producer) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:171:        const 
hasMoreBufferedItems = producer.peakNextItem() !== undefined;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:172:        
return hasMoreBufferedItems ? producer.previousContinuationToken : producer.continuationToken;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:173:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:174:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:175:     * 
Updates partition mapping - creates new entry or merges with existing for ORDER BY queries.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:176:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:177:    
updatePartitionMapping(mapping) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:178:        const 
currentPatch = this.partitionDataPatchMap.get(this.patchCounter.toString());
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:179:        const 
isSamePartition = currentPatch?.partitionKeyRange?.id === mapping.partitionKeyRange.id;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:180:        if 
(isSamePartition && currentPatch) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:181:            
currentPatch.itemCount += mapping.itemCount;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:182:            
currentPatch.continuationToken = mapping.continuationToken;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:183:            
return;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:184:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:185:        // 
Create new partition mapping entry
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:186:        
this.partitionDataPatchMap.set((++this.patchCounter).toString(), mapping);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:187:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:188:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:189:     * Checks 
if the unfilled queue is empty (used by ORDER BY for processing control).
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:510:              
  if (replacementDocumentProducer.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:511:              
      this.unfilledDocumentProducersQueue.enq(replacementDocumentProducer);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:512:              
  }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:513:            
});
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:514:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:515:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:516:    
_updateContinuationTokenOnPartitionChange(originalDocumentProducer, replacementPartitionKeyRanges) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:517:        const 
rangeWithToken = this._createQueryRangeWithContinuationToken(originalDocumentProducer);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:518:        if 
(replacementPartitionKeyRanges.length === 1) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:519:            
this._handleContinuationTokenMerge(rangeWithToken, replacementPartitionKeyRanges[0]);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:520:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:521:        else {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:522:            
this._handleContinuationTokenSplit(rangeWithToken, replacementPartitionKeyRanges);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:523:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:524:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:525:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:526:     * 
Creates a QueryRangeWithContinuationToken object from a DocumentProducer.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:527:     * Uses 
the DocumentProducer's target partition key range and continuation token.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:528:     * @param 
documentProducer - The DocumentProducer to convert
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:529:     * 
@returns QueryRangeWithContinuationToken object for token operations
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:530:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:531:    
_createQueryRangeWithContinuationToken(documentProducer) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:532:        const 
partitionRange = documentProducer.targetPartitionKeyRange;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:533:        // 
Create a simplified QueryRange using the partition key range boundaries
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:534:        const 
simplifiedQueryRange = {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:535:            
min: documentProducer.startEpk || partitionRange.minInclusive,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:536:            
max: documentProducer.endEpk || partitionRange.maxExclusive,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:537:        };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:538:        
return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:539:            
queryRange: simplifiedQueryRange,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:540:            
continuationToken: documentProducer.continuationToken,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:541:        };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:542:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:543:    static 
_needPartitionKeyRangeCacheRefresh(error) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:544:        // 
TODO: any error
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:545:        
return (error.code === StatusCodes.Gone &&
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:546:            
"substatus" in error &&
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:547:            
error["substatus"] === SubStatusCodes.PartitionKeyRangeGone);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:548:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:549:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:550:     * 
Replaces the format placeholder in the rewritten query with the provided filter condition.
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:704:              
                  if (documentProducer.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:705:              
                      this.unfilledDocumentProducersQueue.enq(documentProducer);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:706:              
                  }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:707:              
              }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:708:              
          }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:709:              
          catch (err) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:710:              
              if (ParallelQueryExecutionContextBase._needPartitionKeyRangeCacheRefresh(err)) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:711:              
                  // We want the document producer enqueued
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:712:              
                  // So that later parts of the code can repair the execution context
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:713:              
                  // refresh the partition key ranges and ctreate new document producers and add it to the queue
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:714:              
                  await this._enqueueReplacementDocumentProducers(err, diagnosticNode, documentProducer);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:715:              
                  resolve();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:716:              
              }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:717:              
              else {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:718:              
                  this.err = err;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:719:              
                  this.err.headers = this._getAndResetActiveResponseHeaders();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:720:              
                  reject(err);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:721:              
              }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:722:              
          }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:723:              
      };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:724:              
      try {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:725:              
          await Promise.all(documentProducers.map((producer) => bufferDocumentProducer(producer)));
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:726:              
      }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:727:              
      catch (err) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:728:              
          this.err = err;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:729:              
          this.err.headers = this._getAndResetActiveResponseHeaders();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:730:              
          reject(err);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:731:              
          return;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:732:              
      }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:733:              
      resolve();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:734:              
  }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:735:              
  catch (err) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:736:              
      this.err = err;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:737:              
      this.err.headers = this._getAndResetActiveResponseHeaders();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:738:              
      reject(err);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:739:              
  }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:740:              
  finally {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:741:              
      this.sem.leave();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:742:              
  }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:743:            
});
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js:744:        });
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\parallelQueryExecutionContextBase.js.map:1:{"version":3
,"file":"parallelQueryExecutionContextBase.js","sourceRoot":"","sources":["../../../src/queryExecutionContext/parallelQ
ueryExecutionContextBase.ts"],"names":[],"mappings":"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","sourcesContent":["// Copyright (c) Microsoft Corporation.\n// 
Licensed under the MIT License.\nimport PriorityQueue from \"priorityqueuejs\";\nimport semaphore from 
\"semaphore\";\nimport { StatusCodes, SubStatusCodes } from \"../common/statusCodes.js\";\nimport type { FeedOptions, 
Response } from \"../request/index.js\";\nimport type { PartitionedQueryExecutionInfo } from 
\"../request/ErrorResponse.js\";\nimport { ErrorResponse } from \"../request/ErrorResponse.js\";\nimport { QueryRange 
} from \"../routing/QueryRange.js\";\nimport { SmartRoutingMapProvider } from 
\"../routing/smartRoutingMapProvider.js\";\nimport type { CosmosHeaders, PartitionKeyRange } from 
\"../index.js\";\nimport type { ExecutionContext } from \"./ExecutionContext.js\";\nimport type { SqlQuerySpec } from 
\"./SqlQuerySpec.js\";\nimport { DocumentProducer } from \"./documentProducer.js\";\nimport { getInitialHeader, 
mergeHeaders } from \"./headerUtils.js\";\nimport type { FilterContext, FilterStrategy } from 
\"./queryFilteringStrategy/FilterStrategy.js\";\nimport { RidSkipCountFilter } from 
\"./queryFilteringStrategy/RidSkipCountFilter.js\";\nimport type { TargetPartitionRangeManager } from 
\"./queryFilteringStrategy/TargetPartitionRangeManager.js\";\nimport type { QueryProcessingStrategy } from 
\"./queryProcessingStrategy/QueryProcessingStrategy.js\";\nimport {\n  DiagnosticNodeInternal,\n  
DiagnosticNodeType,\n} from \"../diagnostics/DiagnosticNodeInternal.js\";\nimport type { ClientContext } from 
\"../ClientContext.js\";\nimport type { QueryRangeMapping } from \"./queryRangeMapping.js\";\nimport type {\n  
QueryRangeWithContinuationToken,\n  RangeBoundary,\n  BaseContinuationToken,\n} from 
\"../documents/ContinuationToken/CompositeQueryContinuationToken.js\";\nimport { createParallelQueryResult } from 
\"./parallelQueryResult.js\";\nimport type {\n  PartitionRangeUpdate,\n  PartitionRangeUpdates,\n} from 
\"../documents/ContinuationToken/PartitionRangeUpdate.js\";\n\n/** @hidden */\nexport enum 
ParallelQueryExecutionContextBaseStates {\n  started = \"started\",\n  inProgress = \"inProgress\",\n  ended = 
\"ended\",\n}\n\n/** @hidden */\nexport abstract class ParallelQueryExecutionContextBase implements ExecutionContext 
{\n  private err: any;\n  private state: any;\n  private static readonly STATES = 
ParallelQueryExecutionContextBaseStates;\n  private routingProvider: SmartRoutingMapProvider;\n  private readonly 
requestContinuation: any;\n  private respHeaders: CosmosHeaders;\n  private readonly unfilledDocumentProducersQueue: 
PriorityQueue<DocumentProducer>;\n  private readonly bufferedDocumentProducersQueue: 
PriorityQueue<DocumentProducer>;\n  // TODO: update type of buffer from any --> generic can be used here\n  private 
buffer: any[];\n  private partitionDataPatchMap: Map<string, QueryRangeMapping> = new Map();\n  private patchCounter: 
number = 0;\n  private readonly updatedContinuationRanges: Map<string, PartitionRangeUpdate> = new Map();\n  private 
readonly sem: any;\n  private readonly diagnosticNodeWrapper: {\n    consumed: boolean;\n    diagnosticNode: 
DiagnosticNodeInternal;\n  };\n  /**\n   * Provides the ParallelQueryExecutionContextBase.\n   * This is the base 
class that ParallelQueryExecutionContext and OrderByQueryExecutionContext will derive from.\n   *\n   * When handling 
a parallelized query, it instantiates one instance of\n   * DocumentProcuder per target partition key range and 
aggregates the result of each.\n   *\n   * @param clientContext - The service endpoint to use to create the client.\n  
 * @param collectionLink - The Collection Link\n   * @param options - Represents the feed options.\n   * @param 
partitionedQueryExecutionInfo - PartitionedQueryExecutionInfo\n   * @hidden\n   */\n  constructor(\n    private 
readonly clientContext: ClientContext,\n    private readonly collectionLink: string,\n    private readonly query: 
string | SqlQuerySpec,\n    private readonly options: FeedOptions,\n    private readonly 
partitionedQueryExecutionInfo: PartitionedQueryExecutionInfo,\n    private readonly correlatedActivityId: string,\n    
private readonly rangeManager: TargetPartitionRangeManager,\n    private readonly queryProcessingStrategy: 
QueryProcessingStrategy,\n    private readonly documentProducerComparator: (\n      dp1: DocumentProducer,\n      dp2: 
DocumentProducer,\n    ) => number,\n  ) {\n    this.clientContext = clientContext;\n    this.collectionLink = 
collectionLink;\n    this.query = query;\n    this.options = options;\n    this.partitionedQueryExecutionInfo = 
partitionedQueryExecutionInfo;\n    this.correlatedActivityId = correlatedActivityId;\n    this.diagnosticNodeWrapper 
= {\n      consumed: false,\n      diagnosticNode: new DiagnosticNodeInternal(\n        
clientContext.diagnosticLevel,\n        DiagnosticNodeType.PARALLEL_QUERY_NODE,\n        null,\n      ),\n    };\n    
this.diagnosticNodeWrapper.diagnosticNode.addData({ stateful: true });\n    this.err = undefined;\n    this.state = 
ParallelQueryExecutionContextBase.STATES.started;\n    this.routingProvider = new 
SmartRoutingMapProvider(this.clientContext);\n    this.buffer = [];\n    this.requestContinuation = options\n      ? 
options.continuationToken || options.continuation\n      : undefined;\n\n    // Validate continuation token usage 
immediately\n    if (this.requestContinuation && !this.options.enableQueryControl) {\n      throw new Error(\n        
\"Continuation tokens are supported when enableQueryControl is set true in FeedOptions\",\n      );\n    }\n\n    // 
response headers of undergoing operation\n    this.respHeaders = getInitialHeader();\n    // Make priority queue for 
documentProducers\n    this.unfilledDocumentProducersQueue = new PriorityQueue<DocumentProducer>(\n      (a: 
DocumentProducer, b: DocumentProducer) => this.compareDocumentProducersByRange(a, b),\n    );\n    
this.bufferedDocumentProducersQueue = new PriorityQueue<DocumentProducer>(\n      (a: DocumentProducer, b: 
DocumentProducer) => this.documentProducerComparator(b, a),\n    );\n    // Creating the documentProducers\n    
this.sem = semaphore(1);\n    this.sem.take(() => this._initializeDocumentProducers());\n  }\n\n  /**\n   * Determine 
if there are still remaining resources to processs based on the value of the continuation\n   * token or the elements 
remaining on the current batch in the QueryIterator.\n   * @returns true if there is other elements to process in the 
ParallelQueryExecutionContextBase.\n   */\n  public hasMoreResults(): boolean {\n    return (\n      !this.err &&\n    
  (this.buffer.length > 0 || this.state !== ParallelQueryExecutionContextBase.STATES.ended)\n    );\n  }\n\n  /**\n   
* Fetches more results from the query execution context.\n   * @param diagnosticNode - Optional diagnostic node for 
tracing.\n   * @returns A promise that resolves to the fetched results.\n   * @hidden\n   */\n  public async 
fetchMore(diagnosticNode?: DiagnosticNodeInternal): Promise<Response<any>> {\n    await 
this.bufferDocumentProducers(diagnosticNode);\n    await this.fillBufferFromBufferQueue();\n    return 
this.drainBufferedItems();\n  }\n\n  /**\n   * Processes buffered document producers\n   * @returns A promise that 
resolves when processing is complete.\n   */\n  private async processBufferedDocumentProducers(): Promise<void> {\n    
while (\n      this.hasBufferedProducers() &&\n      
this.shouldProcessBufferedProducers(this.isUnfilledQueueEmpty())\n    ) {\n      const producer = 
this.getNextBufferedProducer();\n      if (!producer) break;\n\n      await this.processDocumentProducer(producer);\n  
  }\n  }\n\n  /**\n   * Processes a single document producer using template method pattern.\n   * Common structure 
with query-specific processing delegated to subclasses.\n   */\n  private async processDocumentProducer(producer: 
DocumentProducer): Promise<void> {\n    const response = await this.fetchFromProducer(producer);\n    
this._mergeWithActiveResponseHeaders(response.headers);\n\n    if (response.result) {\n      
this.addToBuffer(response.result);\n      this.handlePartitionMapping(producer, response.result);\n    }\n\n    // 
Handle producer lifecycle\n    if (producer.peakNextItem() !== undefined) {\n      this.requeueProducer(producer);\n   
 } else if (producer.hasMoreResults()) {\n      this.moveToUnfilledQueue(producer);\n    }\n  }\n\n  /**\n   * Fetches 
data from a document producer - implemented by subclasses.\n   */\n  protected abstract fetchFromProducer(producer: 
DocumentProducer): Promise<Response<any>>;\n\n  /**\n   * Handles partition mapping updates - implemented in base 
class using template method pattern.\n   * Child classes provide query-specific parameters through abstract methods.\n 
  */\n  private handlePartitionMapping(producer: DocumentProducer, result: any): void {\n    const itemCount = 
result?.length || 0;\n    const continuationToken = this.getContinuationToken(producer);\n    const mapping = {\n      
itemCount,\n      partitionKeyRange: producer.targetPartitionKeyRange,\n      continuationToken,\n    };\n\n    
this.updatePartitionMapping(mapping);\n  }\n\n  /**\n   * Gets the continuation token to use - implemented by 
subclasses.\n   */\n  private getContinuationToken(producer: DocumentProducer): string {\n    const 
hasMoreBufferedItems = producer.peakNextItem() !== undefined;\n    return hasMoreBufferedItems ? 
producer.previousContinuationToken : producer.continuationToken;\n  }\n  /**\n   * Determines if buffered producers 
should continue to be processed based on query-specific rules.\n   * @param isUnfilledQueueEmpty - Whether the 
unfilled queue is empty\n   */\n  protected abstract shouldProcessBufferedProducers(isUnfilledQueueEmpty: boolean): 
boolean;\n\n  /**\n   * Updates partition mapping - creates new entry or merges with existing for ORDER BY queries.\n  
 */\n  private updatePartitionMapping(mapping: QueryRangeMapping): void {\n    const currentPatch = 
this.partitionDataPatchMap.get(this.patchCounter.toString());\n    const isSamePartition = 
currentPatch?.partitionKeyRange?.id === mapping.partitionKeyRange.id;\n\n    if (isSamePartition && currentPatch) {\n  
    currentPatch.itemCount += mapping.itemCount;\n      currentPatch.continuationToken = mapping.continuationToken;\n  
    return;\n    }\n    // Create new partition mapping entry\n    
this.partitionDataPatchMap.set((++this.patchCounter).toString(), mapping);\n  }\n\n  /**\n   * Checks if the unfilled 
queue is empty (used by ORDER BY for processing control).\n   */\n  protected isUnfilledQueueEmpty(): boolean {\n    
return this.unfilledDocumentProducersQueue.size() === 0;\n  }\n\n  /**\n   * Initializes document producers and fills 
the priority queue.\n   * Handles both continuation token and fresh query scenarios.\n   */\n  private async 
_initializeDocumentProducers(): Promise<void> {\n    try {\n      const targetPartitionRanges = await 
this._onTargetPartitionRanges();\n      const documentProducers = this.requestContinuation\n        ? await 
this._createDocumentProducersFromContinuation(targetPartitionRanges)\n        : 
this._createDocumentProducersFromFresh(targetPartitionRanges);\n\n      // Fill up our priority queue with 
documentProducers\n      this._enqueueDocumentProducers(documentProducers);\n      this.sem.leave();\n    } catch 
(err: any) {\n      this.err = err;\n      this.sem.leave();\n    }\n  }\n\n  /**\n   * Creates document producers 
from continuation token scenario.\n   */\n  private async _createDocumentProducersFromContinuation(\n    
targetPartitionRanges: any[],\n  ): Promise<DocumentProducer[]> {\n    // Parse continuation token to get range 
mappings and check for split/merge scenarios\n    const parsedToken = 
this._parseContinuationToken(this.requestContinuation);\n    const continuationRanges = await 
this._handlePartitionRangeChanges(parsedToken);\n\n    // Use strategy to create additional query info from parsed 
token\n    const additionalQueryInfo = this.queryProcessingStrategy.createAdditionalQueryInfo(parsedToken);\n\n    
const filterResult = this.rangeManager.filterPartitionRanges(\n      targetPartitionRanges,\n      
continuationRanges,\n      additionalQueryInfo,\n    );\n\n    // Extract ranges and tokens from the combined result\n 
   const rangeTokenPairs = filterResult.rangeTokenPairs;\n\n    // Use strategy to create filter context for 
continuation token processing\n    const filterContext = 
this.queryProcessingStrategy.createFilterContext(parsedToken);\n\n    return rangeTokenPairs.map((rangeTokenPair) =>\n 
     this._createDocumentProducerFromRangeTokenPair(\n        rangeTokenPair,\n        continuationRanges,\n        
filterContext,\n      ),\n    );\n  }\n\n  /**\n   * Creates document producers from fresh query scenario (no 
continuation token).\n   */\n  private _createDocumentProducersFromFresh(targetPartitionRanges: any[]): 
DocumentProducer[] {\n    return targetPartitionRanges.map((partitionTargetRange: any) =>\n      
this._createTargetPartitionQueryExecutionContext(partitionTargetRange, undefined),\n    );\n  }\n\n  /**\n   * Creates 
a document producer from a range token pair (continuation token scenario).\n   */\n  private 
_createDocumentProducerFromRangeTokenPair(\n    rangeTokenPair: any,\n    continuationRanges: any[],\n    
filterContext: any,\n  ): DocumentProducer {\n    const partitionTargetRange = rangeTokenPair.range;\n    const 
continuationToken = rangeTokenPair.continuationToken;\n    const filterCondition = rangeTokenPair.filteringCondition 
|| undefined;\n\n    // Find EPK ranges for this partition range from processed continuation response\n    const 
matchingContinuationRange = continuationRanges.find(\n      (cr) => cr.range.id === partitionTargetRange.id,\n    );\n 
   const startEpk = matchingContinuationRange?.epkMin;\n    const endEpk = matchingContinuationRange?.epkMax;\n\n    
// Use strategy to determine partition-specific filter context\n    const targetPartitionId =\n      
continuationRanges.length > 0 && continuationRanges[continuationRanges.length - 1].range\n        ? 
continuationRanges[continuationRanges.length - 1].range.id\n        : undefined;\n    const partitionFilterContext = 
this.queryProcessingStrategy.getPartitionFilterContext(\n      filterContext,\n      targetPartitionId,\n      
partitionTargetRange.id,\n    );\n\n    return this._createTargetPartitionQueryExecutionContext(\n      
partitionTargetRange,\n      continuationToken,\n      startEpk,\n      endEpk,\n      !!(startEpk && endEpk), // 
populateEpkRangeHeaders - true if both EPK values are present\n      filterCondition,\n      partitionFilterContext,\n 
   );\n  }\n\n  /**\n   * Enqueues document producers into the unfilled queue.\n   */\n  private 
_enqueueDocumentProducers(documentProducers: DocumentProducer[]): void {\n    
documentProducers.forEach((documentProducer) => {\n      try {\n        
this.unfilledDocumentProducersQueue.enq(documentProducer);\n      } catch (e: any) {\n        this.err = e;\n      }\n 
   });\n  }\n\n  /**\n   * Checks if there are buffered document producers ready for processing.\n   * Encapsulates 
queue size checking.\n   */\n  private hasBufferedProducers(): boolean {\n    return 
this.bufferedDocumentProducersQueue.size() > 0;\n  }\n\n  /**\n   * Gets the next buffered document producer for 
processing.\n   * Encapsulates queue dequeuing logic.\n   */\n  private getNextBufferedProducer(): DocumentProducer | 
undefined {\n    if (this.bufferedDocumentProducersQueue.size() > 0) {\n      return 
this.bufferedDocumentProducersQueue.deq();\n    }\n    return undefined;\n  }\n\n  /**\n   * Adds items to the result 
buffer. Handles both single items and arrays.\n   */\n  private addToBuffer(items: any[] | any): void {\n    if 
(Array.isArray(items)) {\n      if (items.length > 0) {\n        this.buffer.push(...items);\n      }\n    } else if 
(items) {\n      this.buffer.push(items);\n    }\n  }\n\n  /**\n   * Moves a producer to the unfilled queue for later 
processing.\n   */\n  private moveToUnfilledQueue(producer: DocumentProducer): void {\n    
this.unfilledDocumentProducersQueue.enq(producer);\n  }\n\n  /**\n   * Re-queues a producer to the buffered queue for 
further processing.\n   */\n  private requeueProducer(producer: DocumentProducer): void {\n    
this.bufferedDocumentProducersQueue.enq(producer);\n  }\n\n  /**\n   * Compares two document producers based on their 
partition key ranges and EPK values.\n   * Primary comparison: minInclusive values for left-to-right range traversal\n 
  * Secondary comparison: EPK ranges when minInclusive values are identical\n   * @param a - First document producer\n 
  * @param b - Second document producer\n   * @returns Comparison result for priority queue ordering\n   * @hidden\n   
*/\n  private compareDocumentProducersByRange(a: DocumentProducer, b: DocumentProducer): number {\n    const 
aMinInclusive = a.targetPartitionKeyRange.minInclusive;\n    const bMinInclusive = 
b.targetPartitionKeyRange.minInclusive;\n    const minInclusiveComparison = 
bMinInclusive.localeCompare(aMinInclusive);\n\n    // If minInclusive values are the same, check minEPK ranges if they 
exist\n    if (minInclusiveComparison === 0) {\n      const aMinEpk = a.startEpk;\n      const bMinEpk = b.startEpk;\n 
     if (aMinEpk && bMinEpk) {\n        return bMinEpk.localeCompare(aMinEpk);\n      }\n    }\n\n    return 
minInclusiveComparison;\n  }\n\n  /**\n   * Detects partition splits/merges by analyzing parsed continuation token 
ranges and comparing with current topology\n   * @param parsed - The continuation token containing range mappings to 
analyze\n   * @returns Array of processed ranges with EPK info\n   */\n  private async _handlePartitionRangeChanges(\n 
   parsed: BaseContinuationToken,\n  ): Promise<{ range: any; continuationToken?: string; epkMin?: string; epkMax?: 
string }[]> {\n    const processedRanges: {\n      range: any;\n      continuationToken?: string;\n      epkMin?: 
string;\n      epkMax?: string;\n    }[] = [];\n\n    // Extract range mappings from the already parsed token\n    
const rangeMappings = parsed.rangeMappings;\n\n    if (!rangeMappings || rangeMappings.length === 0) {\n      return 
[];\n    }\n\n    // Check each range mapping for potential splits/merges\n    for (const rangeWithToken of 
rangeMappings) {\n      // Create a new QueryRange instance from the simplified range data\n      const range = 
rangeWithToken.queryRange;\n      const queryRange: QueryRange = new QueryRange(\n        range.min,\n        
range.max,\n        true, // isMinInclusive - assumption: always true\n        false, // isMaxInclusive - assumption: 
always false (max is exclusive)\n      );\n\n      const rangeMin = queryRange.min;\n      const rangeMax = 
queryRange.max;\n\n      // Get current overlapping ranges for this continuation token range\n      const 
overlappingRanges = await this.routingProvider.getOverlappingRanges(\n        this.collectionLink,\n        
[queryRange],\n        this.getDiagnosticNode(),\n      );\n\n      // Detect split/merge scenario based on the number 
of overlapping ranges\n      if (overlappingRanges.length === 0) {\n        continue;\n      } else if 
(overlappingRanges.length === 1) {\n        // Check if it's the same range (no change) or a merge scenario\n        
const currentRange = overlappingRanges[0];\n        if (currentRange.minInclusive !== rangeMin || 
currentRange.maxExclusive !== rangeMax) {\n          // Merge scenario - include EPK ranges from original continuation 
token range\n          await this._handleContinuationTokenMerge(rangeWithToken, currentRange);\n          
processedRanges.push({\n            range: currentRange,\n            continuationToken: 
rangeWithToken.continuationToken,\n            epkMin: rangeMin, // Original range min becomes EPK min\n            
epkMax: rangeMax, // Original range max becomes EPK max\n          });\n        } else {\n          // Same range - no 
merge, no EPK ranges needed\n          processedRanges.push({\n            range: currentRange,\n            
continuationToken: rangeWithToken.continuationToken,\n          });\n        }\n      } else {\n        // Split 
scenario - one range from continuation token now maps to multiple ranges\n        await 
this._handleContinuationTokenSplit(rangeWithToken, overlappingRanges);\n        // Add all overlapping ranges with the 
same continuation token to processed ranges\n        overlappingRanges.forEach((rangeValue) => {\n          
processedRanges.push({\n            range: rangeValue,\n            continuationToken: 
rangeWithToken.continuationToken,\n          });\n        });\n      }\n    }\n\n    return processedRanges;\n  }\n\n  
/**\n   * Parses the continuation token based on query type\n   * @param continuationToken - The continuation token 
string to parse\n   * @returns Parsed continuation token object (ORDER BY or Parallel query token)\n   * @throws 
ErrorResponse when continuation token is malformed or cannot be parsed\n   */\n  private 
_parseContinuationToken(continuationToken: string): BaseContinuationToken {\n    try {\n      return 
this.queryProcessingStrategy.parseContinuationToken(continuationToken);\n    } catch (e) {\n      throw new 
ErrorResponse(\n        `Invalid continuation token format. Expected token with rangeMappings property. ` +\n          
`Ensure the continuation token was generated by a compatible query and has not been modified.`,\n      );\n    }\n  
}\n\n  /**\n   * Handles partition merge scenario for continuation token ranges\n   */\n  private async 
_handleContinuationTokenMerge(\n    rangeWithToken: QueryRangeWithContinuationToken,\n    _newMergedRange: 
PartitionKeyRange,\n  ): Promise<void> {\n    const rangeKey = 
`${rangeWithToken.queryRange.min}-${rangeWithToken.queryRange.max}`;\n    this.updatedContinuationRanges.set(rangeKey, 
{\n      oldRange: {\n        min: rangeWithToken.queryRange.min,\n        max: rangeWithToken.queryRange.max,\n       
 isMinInclusive: true, // Assumption: min is always inclusive\n        isMaxInclusive: false, // Assumption: max is 
always exclusive\n      },\n      newRanges: [\n        {\n          min: rangeWithToken.queryRange.min,\n          
max: rangeWithToken.queryRange.max,\n          isMinInclusive: true, // Assumption: min is always inclusive\n          
isMaxInclusive: false, // Assumption: max is always exclusive\n        },\n      ],\n      continuationToken: 
rangeWithToken.continuationToken,\n    });\n  }\n\n  /**\n   * Handles partition split scenario for continuation token 
ranges\n   */\n  private async _handleContinuationTokenSplit(\n    rangeWithToken: QueryRangeWithContinuationToken,\n  
  overlappingRanges: any[],\n  ): Promise<void> {\n    const rangeKey = 
`${rangeWithToken.queryRange.min}-${rangeWithToken.queryRange.max}`;\n    this.updatedContinuationRanges.set(rangeKey, 
{\n      oldRange: {\n        min: rangeWithToken.queryRange.min,\n        max: rangeWithToken.queryRange.max,\n       
 isMinInclusive: true, // Assumption: min is always inclusive\n        isMaxInclusive: false, // Assumption: max is 
always exclusive\n      },\n      newRanges: overlappingRanges.map((range) => ({\n        min: range.minInclusive,\n   
     max: range.maxExclusive,\n        isMinInclusive: true,\n        isMaxInclusive: false,\n      })),\n      
continuationToken: rangeWithToken.continuationToken,\n    });\n  }\n\n  /**\n   * Handles partition merge scenario for 
continuation token ranges\n   */\n  private _mergeWithActiveResponseHeaders(headers: CosmosHeaders): void {\n    
mergeHeaders(this.respHeaders, headers);\n  }\n\n  private _getAndResetActiveResponseHeaders(): CosmosHeaders {\n    
const ret = this.respHeaders;\n    this.respHeaders = getInitialHeader();\n    return ret;\n  }\n\n  private 
getDiagnosticNode(): DiagnosticNodeInternal {\n    return this.diagnosticNodeWrapper.diagnosticNode;\n  }\n\n  private 
async _onTargetPartitionRanges(): Promise<any[]> {\n    // invokes the callback when the target partition ranges are 
ready\n    const parsedRanges = this.partitionedQueryExecutionInfo.queryRanges;\n    const queryRanges = 
parsedRanges.map((item) => QueryRange.parseFromDict(item));\n    return this.routingProvider.getOverlappingRanges(\n   
   this.collectionLink,\n      queryRanges,\n      this.getDiagnosticNode(),\n    );\n  }\n\n  /**\n   * Gets the 
replacement ranges for a partitionkeyrange that has been split\n   */\n  private async 
_getReplacementPartitionKeyRanges(\n    documentProducer: DocumentProducer,\n    diagnosticNode: 
DiagnosticNodeInternal,\n  ): Promise<any[]> {\n    const partitionKeyRange = 
documentProducer.targetPartitionKeyRange;\n    // Download the new routing map\n    this.routingProvider = new 
SmartRoutingMapProvider(this.clientContext);\n    // Get the queryRange that relates to this partitionKeyRange\n    
const queryRange = QueryRange.parsePartitionKeyRange(partitionKeyRange);\n    return 
this.routingProvider.getOverlappingRanges(\n      this.collectionLink,\n      [queryRange],\n      diagnosticNode,\n   
 );\n  }\n\n  private async _enqueueReplacementDocumentProducers(\n    error: any,\n    diagnosticNode: 
DiagnosticNodeInternal,\n    documentProducer: DocumentProducer,\n  ): Promise<void> {\n    // Get the replacement 
ranges\n    const replacementPartitionKeyRanges = await this._getReplacementPartitionKeyRanges(\n      
documentProducer,\n      diagnosticNode,\n    );\n\n    if (replacementPartitionKeyRanges.length === 0) {\n      throw 
error;\n    }\n\n    if (this.requestContinuation) {\n      // Update composite continuation token to handle partition 
split\n      this._updateContinuationTokenOnPartitionChange(\n        documentProducer,\n        
replacementPartitionKeyRanges,\n      );\n    }\n\n    if (replacementPartitionKeyRanges.length === 1) {\n      // 
Partition is gone due to Merge\n      // Create the replacement documentProducer with populateEpkRangeHeaders Flag set 
to true to set startEpk and endEpk headers\n      const replacementDocumentProducer = 
this._createTargetPartitionQueryExecutionContext(\n        replacementPartitionKeyRanges[0],\n        
documentProducer.continuationToken,\n        documentProducer.startEpk,\n        documentProducer.endEpk,\n        
true,\n      );\n\n      this.unfilledDocumentProducersQueue.enq(replacementDocumentProducer);\n    } else {\n      // 
Create the replacement documentProducers\n      const replacementDocumentProducers: DocumentProducer[] = [];\n      
replacementPartitionKeyRanges.forEach((partitionKeyRange) => {\n        const queryRange = 
QueryRange.parsePartitionKeyRange(partitionKeyRange);\n        // Create replacment document producers with the 
parent's continuationToken\n        const replacementDocumentProducer = 
this._createTargetPartitionQueryExecutionContext(\n          partitionKeyRange,\n          
documentProducer.continuationToken,\n          queryRange.min,\n          queryRange.max,\n          false,\n        
);\n        replacementDocumentProducers.push(replacementDocumentProducer);\n      });\n\n      // add document 
producers to the queue\n      replacementDocumentProducers.forEach((replacementDocumentProducer) => {\n        if 
(replacementDocumentProducer.hasMoreResults()) {\n          
this.unfilledDocumentProducersQueue.enq(replacementDocumentProducer);\n        }\n      });\n    }\n  }\n\n  private 
_updateContinuationTokenOnPartitionChange(\n    originalDocumentProducer: DocumentProducer,\n    
replacementPartitionKeyRanges: any[],\n  ): void {\n    const rangeWithToken = 
this._createQueryRangeWithContinuationToken(originalDocumentProducer);\n    if (replacementPartitionKeyRanges.length 
=== 1) {\n      this._handleContinuationTokenMerge(rangeWithToken, replacementPartitionKeyRanges[0]);\n    } else {\n  
    this._handleContinuationTokenSplit(rangeWithToken, replacementPartitionKeyRanges);\n    }\n  }\n\n  /**\n   * 
Creates a QueryRangeWithContinuationToken object from a DocumentProducer.\n   * Uses the DocumentProducer's target 
partition key range and continuation token.\n   * @param documentProducer - The DocumentProducer to convert\n   * 
@returns QueryRangeWithContinuationToken object for token operations\n   */\n  private 
_createQueryRangeWithContinuationToken(\n    documentProducer: DocumentProducer,\n  ): QueryRangeWithContinuationToken 
{\n    const partitionRange = documentProducer.targetPartitionKeyRange;\n\n    // Create a simplified QueryRange using 
the partition key range boundaries\n    const simplifiedQueryRange: RangeBoundary = {\n      min: 
documentProducer.startEpk || partitionRange.minInclusive,\n      max: documentProducer.endEpk || 
partitionRange.maxExclusive,\n    };\n\n    return {\n      queryRange: simplifiedQueryRange,\n      
continuationToken: documentProducer.continuationToken,\n    };\n  }\n\n  private static 
_needPartitionKeyRangeCacheRefresh(error: any): boolean {\n    // TODO: any error\n    return (\n      error.code === 
StatusCodes.Gone &&\n      \"substatus\" in error &&\n      error[\"substatus\"] === 
SubStatusCodes.PartitionKeyRangeGone\n    );\n  }\n\n  /**\n   * Replaces the format placeholder in the rewritten 
query with the provided filter condition.\n   * Handles both string queries and SqlQuerySpec objects.\n   */\n  
private _replaceFormatPlaceholder(\n    rewrittenQuery: string | SqlQuerySpec,\n    formatPlaceHolder: string,\n    
filterCondition?: string,\n  ): string {\n    const replacement = filterCondition ?? \"true\";\n\n    // If 
rewrittenQuery has a query property, it's a SqlQuerySpec object\n    if (typeof rewrittenQuery === \"object\" && 
rewrittenQuery !== null && rewrittenQuery.query) {\n      return rewrittenQuery.query.replace(formatPlaceHolder, 
replacement);\n    }\n\n    // Otherwise, it's a string\n    return (rewrittenQuery as 
string).replace(formatPlaceHolder, replacement);\n  }\n\n  /**\n   * Creates target partition range Query Execution 
Context\n   */\n  private _createTargetPartitionQueryExecutionContext(\n    partitionKeyTargetRange: any,\n    
continuationToken?: any,\n    startEpk?: string,\n    endEpk?: string,\n    populateEpkRangeHeaders?: boolean,\n    
filterCondition?: string,\n    filterContext?: FilterContext,\n  ): DocumentProducer {\n    const rewrittenQuery = 
this.partitionedQueryExecutionInfo.queryInfo?.rewrittenQuery;\n    let sqlQuerySpec: SqlQuerySpec;\n    const query = 
this.query;\n    if (typeof query === \"string\") {\n      sqlQuerySpec = { query };\n    } else {\n      sqlQuerySpec 
= query;\n    }\n\n    const formatPlaceHolder = \"{documentdb-formattableorderbyquery-filter}\";\n    if 
(rewrittenQuery) {\n      sqlQuerySpec = JSON.parse(JSON.stringify(sqlQuerySpec));\n      const replacedQuery = 
this._replaceFormatPlaceholder(\n        rewrittenQuery,\n        formatPlaceHolder,\n        filterCondition,\n      
);\n      sqlQuerySpec[\"query\"] = replacedQuery;\n    }\n\n    const options = { ...this.options };\n    
options.continuationToken = continuationToken;\n\n    let filter: FilterStrategy | undefined;\n    if (filterContext) 
{\n      filter = new RidSkipCountFilter(filterContext);\n    }\n\n    return new DocumentProducer(\n      
this.clientContext,\n      this.collectionLink,\n      sqlQuerySpec,\n      partitionKeyTargetRange,\n      options,\n 
     this.correlatedActivityId,\n      startEpk,\n      endEpk,\n      populateEpkRangeHeaders,\n      filter,\n    
);\n  }\n  private async drainBufferedItems(): Promise<Response<any>> {\n    return new 
Promise<Response<any>>((resolve, reject) => {\n      this.sem.take(() => {\n        if (this.err) {\n          // if 
there is a prior error return error\n          this.sem.leave();\n          this.err.headers = 
this._getAndResetActiveResponseHeaders();\n          reject(this.err);\n          return;\n        }\n\n        // 
return undefined if there is no more results\n        if (this.buffer.length === 0) {\n          this.sem.leave();\n   
       const partitionDataPatchMap = this.partitionDataPatchMap;\n          this.partitionDataPatchMap = new 
Map<string, QueryRangeMapping>();\n          this.patchCounter = 0;\n          // Get and reset updated continuation 
ranges\n          const updatedContinuationRanges: PartitionRangeUpdates = Object.fromEntries(\n            
this.updatedContinuationRanges,\n          );\n          this.updatedContinuationRanges.clear();\n          const 
result = createParallelQueryResult(\n            [],\n            partitionDataPatchMap,\n            
updatedContinuationRanges,\n            undefined,\n          );\n\n          return resolve({\n            result:\n  
            this.state === ParallelQueryExecutionContextBase.STATES.ended ? undefined : result,\n            headers: 
this._getAndResetActiveResponseHeaders(),\n          });\n        }\n        // draing the entire buffer object and 
return that in result of return object\n        const bufferedResults = this.buffer;\n        this.buffer = [];\n      
  // reset the patchToRangeMapping\n        const partitionDataPatchMap = this.partitionDataPatchMap;\n        
this.partitionDataPatchMap = new Map<string, QueryRangeMapping>();\n        this.patchCounter = 0;\n\n        // Get 
and reset updated continuation ranges\n        const updatedContinuationRanges: PartitionRangeUpdates = 
Object.fromEntries(\n          this.updatedContinuationRanges,\n        );\n        
this.updatedContinuationRanges.clear();\n\n        // release the lock before returning\n        this.sem.leave();\n\n 
       const result = createParallelQueryResult(\n          bufferedResults,\n          partitionDataPatchMap,\n       
   updatedContinuationRanges,\n          undefined,\n        );\n\n        return resolve({\n          result,\n       
   headers: this._getAndResetActiveResponseHeaders(),\n        });\n      });\n    });\n  }\n\n  /**\n   * Buffers 
document producers based on the maximum degree of parallelism.\n   * Moves document producers from the unfilled queue 
to the buffered queue.\n   * @param diagnosticNode - The diagnostic node for logging and tracing.\n   * @returns A 
promise that resolves when buffering is complete.\n   */\n  private async bufferDocumentProducers(diagnosticNode?: 
DiagnosticNodeInternal): Promise<void> {\n    return new Promise<void>((resolve, reject) => {\n      
this.sem.take(async () => {\n        if (this.err) {\n          this.sem.leave();\n          reject(this.err);\n       
   return;\n        }\n        this.updateStates(this.err);\n\n        if (this.state === 
ParallelQueryExecutionContextBase.STATES.ended) {\n          this.sem.leave();\n          resolve();\n          
return;\n        }\n\n        if (this.unfilledDocumentProducersQueue.size() === 0) {\n          this.sem.leave();\n   
       resolve();\n          return;\n        }\n\n        try {\n          const maxDegreeOfParallelism =\n           
 this.options.maxDegreeOfParallelism === undefined ||\n            this.options.maxDegreeOfParallelism < 1\n           
   ? this.unfilledDocumentProducersQueue.size() // number of partitions\n              : Math.min(\n                  
this.options.maxDegreeOfParallelism,\n                  this.unfilledDocumentProducersQueue.size(),\n                
);\n\n          const documentProducers: DocumentProducer[] = [];\n          while (\n            
documentProducers.length < maxDegreeOfParallelism &&\n            this.unfilledDocumentProducersQueue.size() > 0\n     
     ) {\n            let documentProducer: DocumentProducer;\n            try {\n              documentProducer = 
this.unfilledDocumentProducersQueue.deq();\n            } catch (e: any) {\n              this.err = e;\n              
this.err.headers = this._getAndResetActiveResponseHeaders();\n              reject(this.err);\n              return;\n 
           }\n            documentProducers.push(documentProducer);\n          }\n\n          const 
bufferDocumentProducer = async (\n            documentProducer: DocumentProducer,\n          ): Promise<void> => {\n   
         try {\n              const headers = await documentProducer.bufferMore(diagnosticNode);\n              
this._mergeWithActiveResponseHeaders(headers);\n\n              // Always track this document producer in 
patchToRangeMapping, even if it has no results\n              // This ensures we maintain a record of all partition 
ranges that were scanned\n              const nextItem = documentProducer.peakNextItem();\n              if (nextItem 
!== undefined) {\n                this.bufferedDocumentProducersQueue.enq(documentProducer);\n              } else {\n 
               // Track document producer with no results in patchToRangeMapping\n                // This represents a 
scanned partition that yielded no results\n                // IMPORTANT: Only include if continuation token is NOT 
null/exhausted\n                // Document producers with no data in buffer and no continuation token are exhausted 
and should not be added to partitionDataPatchMap to prevent infinite loops in order by queries\n                if (\n 
                 documentProducer.continuationToken &&\n                  documentProducer.continuationToken !== \"\" 
&&\n                  documentProducer.continuationToken.toLowerCase() !== \"null\"\n                ) {\n             
     const patchKey = 
`empty-${documentProducer.targetPartitionKeyRange.id}-${documentProducer.targetPartitionKeyRange.minInclusive}`;\n     
             this.partitionDataPatchMap.set(patchKey, {\n                    itemCount: 0, // 0 items for empty result 
set\n                    partitionKeyRange: documentProducer.targetPartitionKeyRange,\n                    
continuationToken: documentProducer.continuationToken,\n                  });\n                }\n                if 
(documentProducer.hasMoreResults()) {\n                  this.unfilledDocumentProducersQueue.enq(documentProducer);\n  
              }\n              }\n            } catch (err) {\n              if 
(ParallelQueryExecutionContextBase._needPartitionKeyRangeCacheRefresh(err)) {\n                // We want the document 
producer enqueued\n                // So that later parts of the code can repair the execution context\n               
 // refresh the partition key ranges and ctreate new document producers and add it to the queue\n                await 
this._enqueueReplacementDocumentProducers(\n                  err,\n                  diagnosticNode,\n                
  documentProducer,\n                );\n                resolve();\n              } else {\n                this.err 
= err;\n                this.err.headers = this._getAndResetActiveResponseHeaders();\n                reject(err);\n   
           }\n            }\n          };\n\n          try {\n            await Promise.all(\n              
documentProducers.map((producer) => bufferDocumentProducer(producer)),\n            );\n          } catch (err) {\n    
        this.err = err;\n            this.err.headers = this._getAndResetActiveResponseHeaders();\n            
reject(err);\n            return;\n          }\n          resolve();\n        } catch (err) {\n          this.err = 
err;\n          this.err.headers = this._getAndResetActiveResponseHeaders();\n          reject(err);\n        } 
finally {\n          this.sem.leave();\n        }\n      });\n    });\n  }\n  /**\n   * Drains the buffer of filled 
document producers and appends their items to the main buffer.\n   * Uses template method pattern - delegates actual 
processing to subclasses.\n   * @returns A promise that resolves when the buffer is filled.\n   */\n  private async 
fillBufferFromBufferQueue(): Promise<void> {\n    return new Promise<void>((resolve, reject) => {\n      
this.sem.take(async () => {\n        if (this.err) {\n          // if there is a prior error return error\n          
this.sem.leave();\n          this.err.headers = this._getAndResetActiveResponseHeaders();\n          
reject(this.err);\n          return;\n        }\n\n        if (\n          this.state === 
ParallelQueryExecutionContextBase.STATES.ended ||\n          this.bufferedDocumentProducersQueue.size() === 0\n        
) {\n          this.sem.leave();\n          resolve();\n          return;\n        }\n\n        try {\n          await 
this.processBufferedDocumentProducers();\n          this.updateStates(this.err);\n        } catch (err) {\n          
this.err = err;\n          this.err.headers = this._getAndResetActiveResponseHeaders();\n          reject(this.err);\n 
         return;\n        } finally {\n          // release the lock before returning\n          this.sem.leave();\n   
     }\n        resolve();\n        return;\n      });\n    });\n  }\n\n  private updateStates(error: any): void {\n   
 if (error) {\n      this.err = error;\n      this.state = ParallelQueryExecutionContextBase.STATES.ended;\n      
return;\n    }\n\n    if (this.state === ParallelQueryExecutionContextBase.STATES.started) {\n      this.state = 
ParallelQueryExecutionContextBase.STATES.inProgress;\n    }\n\n    const hasNoActiveProducers =\n      
this.unfilledDocumentProducersQueue.size() === 0 &&\n      this.bufferedDocumentProducersQueue.size() === 0;\n\n    if 
(hasNoActiveProducers) {\n      this.state = ParallelQueryExecutionContextBase.STATES.ended;\n    }\n  }\n}\n"]}
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:20:    
hasMoreResults(): boolean;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:21:    
fetchMore(diagnosticNode: DiagnosticNodeInternal): Promise<Response<any>>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:22:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:23:     * Creates 
a non-streaming endpoint for vector search and similar queries that require buffering
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:24:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:25:    private 
createNonStreamingEndpoint;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:26:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:27:     * Creates 
a streaming endpoint with proper pipeline components
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:28:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:29:    private 
createStreamingEndpoint;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:30:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:31:     * Creates 
the base execution context (OrderBy or Parallel)
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:32:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:33:    private 
createBaseExecutionContext;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:34:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:35:     * Wraps 
base context with appropriate non-streaming component
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:36:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:37:    private 
wrapWithNonStreamingComponent;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:38:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:39:     * Applies 
GROUP BY components to the pipeline if needed
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:40:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:41:    private 
applyGroupByComponents;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:42:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:43:     * Applies 
DISTINCT components to the pipeline if needed
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:44:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:45:    private 
applyDistinctComponents;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:46:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:47:     * Applies 
TOP and OFFSET+LIMIT components to the pipeline if needed
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:48:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:49:    private 
applyLimitComponents;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:50:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:51:     * 
Validates vector search buffer size constraints
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:52:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:53:    private 
validateVectorSearchBufferSize;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:54:    private 
calculateVectorSearchBufferSize;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:55:    private 
checkQueryConstraints;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:56:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:57:     * Analyzes 
query information and extracts key characteristics for query execution planning
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:58:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:59:    private 
analyzeQueryInfo;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.d.ts:60:}
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:76:    
hasMoreResults() {
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:77:        return 
this.fetchBuffer.length !== 0 || this.endpoint.hasMoreResults();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:78:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:79:    async 
fetchMore(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:80:        return 
this.fetchImplementation.fetchMore(diagnosticNode, this.fetchBuffer);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:81:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:82:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:83:     * Creates a 
non-streaming endpoint for vector search and similar queries that require buffering
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:84:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:85:    
createNonStreamingEndpoint(partitionedQueryExecutionInfo, sortOrders, correlatedActivityId, options) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:86:        const 
queryInfo = partitionedQueryExecutionInfo.queryInfo; // Safe to use ! after validation in constructor
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:87:        if 
(!options.allowUnboundedNonStreamingQueries) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:88:            
this.checkQueryConstraints(queryInfo);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:89:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:90:        const 
vectorSearchBufferSize = this.calculateVectorSearchBufferSize(queryInfo, options);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:91:        
this.validateVectorSearchBufferSize(vectorSearchBufferSize, options);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:92:        const 
baseContext = new ParallelQueryExecutionContext(this.clientContext, this.collectionLink, this.query, this.options, 
this.partitionedQueryExecutionInfo, correlatedActivityId);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:93:        return 
this.wrapWithNonStreamingComponent(baseContext, queryInfo, sortOrders, vectorSearchBufferSize);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:94:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:95:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:96:     * Creates a 
streaming endpoint with proper pipeline components
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:97:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:98:    
createStreamingEndpoint(partitionedQueryExecutionInfo, sortOrders, correlatedActivityId, isGroupByQuery, 
queryContinuationFields) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:99:        const 
queryInfo = partitionedQueryExecutionInfo.queryInfo; // Safe to use ! after validation in constructor
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:100:        // 
Create base execution context
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:101:        let 
endpoint = this.createBaseExecutionContext(partitionedQueryExecutionInfo, sortOrders, correlatedActivityId);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:102:        // Apply 
pipeline transformations
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:103:        endpoint 
= this.applyGroupByComponents(endpoint, queryInfo, isGroupByQuery);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:104:        endpoint 
= this.applyDistinctComponents(endpoint, queryInfo, queryContinuationFields);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:105:        endpoint 
= this.applyLimitComponents(endpoint, queryInfo, queryContinuationFields);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:106:        return 
endpoint;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:107:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:108:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:109:     * Creates 
the base execution context (OrderBy or Parallel)
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:110:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:111:    
createBaseExecutionContext(partitionedQueryExecutionInfo, sortOrders, correlatedActivityId) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:112:        if 
(Array.isArray(sortOrders) && sortOrders.length > 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:113:            // 
OrderBy queries need special wrapping for payload structure
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:114:            
return new OrderByEndpointComponent(new OrderByQueryExecutionContext(this.clientContext, this.collectionLink, 
this.query, this.options, partitionedQueryExecutionInfo, correlatedActivityId), this.emitRawOrderByPayload);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:115:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:116:        // 
Parallel queries
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js:117:        return 
new ParallelQueryExecutionContext(this.clientContext, this.collectionLink, this.query, this.options, 
partitionedQueryExecutionInfo, correlatedActivityId);
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipelinedQueryExecutionContext.js.map:1:{"version":3,"f
ile":"pipelinedQueryExecutionContext.js","sourceRoot":"","sources":["../../../src/queryExecutionContext/pipelinedQueryE
xecutionContext.ts"],"names":[],"mappings":"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","sourcesContent":["//
 Copyright (c) Microsoft Corporation.\n// Licensed under the MIT License.\nimport type { ClientContext } from 
\"../ClientContext.js\";\nimport type { Response, FeedOptions } from \"../request/index.js\";\nimport type { 
PartitionedQueryExecutionInfo, QueryInfo } from \"../request/ErrorResponse.js\";\nimport { ErrorResponse } from 
\"../request/ErrorResponse.js\";\nimport { OffsetLimitEndpointComponent } from 
\"./EndpointComponent/OffsetLimitEndpointComponent.js\";\nimport { OrderByEndpointComponent } from 
\"./EndpointComponent/OrderByEndpointComponent.js\";\nimport { OrderedDistinctEndpointComponent } from 
\"./EndpointComponent/OrderedDistinctEndpointComponent.js\";\nimport { UnorderedDistinctEndpointComponent } from 
\"./EndpointComponent/UnorderedDistinctEndpointComponent.js\";\nimport { GroupByEndpointComponent } from 
\"./EndpointComponent/GroupByEndpointComponent.js\";\nimport type { ExecutionContext } from 
\"./ExecutionContext.js\";\nimport { OrderByQueryExecutionContext } from 
\"./orderByQueryExecutionContext.js\";\nimport { ParallelQueryExecutionContext } from 
\"./parallelQueryExecutionContext.js\";\nimport { GroupByValueEndpointComponent } from 
\"./EndpointComponent/GroupByValueEndpointComponent.js\";\nimport type { SqlQuerySpec } from 
\"./SqlQuerySpec.js\";\nimport type { DiagnosticNodeInternal } from 
\"../diagnostics/DiagnosticNodeInternal.js\";\nimport { NonStreamingOrderByDistinctEndpointComponent } from 
\"./EndpointComponent/NonStreamingOrderByDistinctEndpointComponent.js\";\nimport { 
NonStreamingOrderByEndpointComponent } from \"./EndpointComponent/NonStreamingOrderByEndpointComponent.js\";\nimport 
{\n  rejectContinuationTokenForUnsupportedQueries,\n  QueryTypes,\n} from \"./QueryValidationHelper.js\";\nimport { 
parseContinuationTokenFields } from \"./ContinuationTokenParser.js\";\nimport { LegacyFetchImplementation } from 
\"./LegacyFetchImplementation.js\";\nimport { QueryControlFetchImplementation } from 
\"./QueryControlFetchImplementation.js\";\nimport { QueryExecution } from \"../common/constants.js\";\n\n/** @hidden 
*/\nexport class PipelinedQueryExecutionContext implements ExecutionContext {\n  private fetchBuffer: any[];\n  
private endpoint: ExecutionContext;\n  private readonly fetchImplementation: LegacyFetchImplementation | 
QueryControlFetchImplementation;\n\n  constructor(\n    private clientContext: ClientContext,\n    private 
collectionLink: string,\n    private query: string | SqlQuerySpec,\n    private options: FeedOptions,\n    private 
partitionedQueryExecutionInfo: PartitionedQueryExecutionInfo,\n    correlatedActivityId: string,\n    private 
emitRawOrderByPayload: boolean = false,\n    private supportsContinuationTokens: boolean = true,\n  ) {\n    // 
Validate that queryInfo is present in partitioned query execution info\n    if 
(!partitionedQueryExecutionInfo.queryInfo) {\n      throw new ErrorResponse(\n        \"Query execution requires valid 
query plan information. \" +\n          \"The partitioned query execution info is missing queryInfo. \" +\n          
\"This may indicate an invalid query or a problem with query planning.\",\n      );\n    }\n\n    if 
(!this.options.maxItemCount) {\n      this.options.maxItemCount = QueryExecution.DEFAULT_PAGE_SIZE;\n    }\n    const 
pageSize = this.options.maxItemCount;\n\n    // Extract query information and characteristics\n    const 
analyzedQueryInfo = this.analyzeQueryInfo(partitionedQueryExecutionInfo.queryInfo);\n    const {\n      sortOrders,\n  
    nonStreamingOrderBy,\n      isOrderByQuery,\n      isGroupByQuery,\n      isUnorderedDistinctQuery,\n      
querySupportsTokens,\n    } = analyzedQueryInfo;\n\n    // Reject continuation token usage for unsupported query 
types\n    if (!querySupportsTokens) {\n      
rejectContinuationTokenForUnsupportedQueries(this.options.continuationToken, [\n        
QueryTypes.nonStreamingOrderBy(nonStreamingOrderBy),\n        QueryTypes.groupBy(isGroupByQuery),\n        
QueryTypes.unorderedDistinct(isUnorderedDistinctQuery),\n      ]);\n    }\n\n    // Parse continuation token fields 
once for reuse in pipeline construction\n    const queryContinuationFields = this.options.continuationToken\n      ? 
parseContinuationTokenFields(this.options.continuationToken)\n      : undefined;\n\n    // Pick between non-streaming 
vs streaming execution context\n    this.endpoint = nonStreamingOrderBy\n      ? this.createNonStreamingEndpoint(\n    
      partitionedQueryExecutionInfo,\n          sortOrders,\n          correlatedActivityId,\n          options,\n     
   )\n      : this.createStreamingEndpoint(\n          partitionedQueryExecutionInfo,\n          sortOrders,\n         
 correlatedActivityId,\n          isGroupByQuery,\n          queryContinuationFields,\n        );\n    
this.fetchBuffer = [];\n    // Initialize the appropriate fetch implementation based on enableQueryControl\n    if 
(this.options.enableQueryControl) {\n      const querySupportsContinuationTokens =\n        
this.supportsContinuationTokens && querySupportsTokens;\n      this.fetchImplementation = new 
QueryControlFetchImplementation(\n        this.endpoint,\n        pageSize,\n        this.collectionLink,\n        
this.options.continuationToken,\n        isOrderByQuery,\n        querySupportsContinuationTokens,\n      );\n    } 
else {\n      this.fetchImplementation = new LegacyFetchImplementation(this.endpoint, pageSize);\n    }\n  }\n\n  
public hasMoreResults(): boolean {\n    return this.fetchBuffer.length !== 0 || this.endpoint.hasMoreResults();\n  
}\n\n  public async fetchMore(diagnosticNode: DiagnosticNodeInternal): Promise<Response<any>> {\n    return 
this.fetchImplementation.fetchMore(diagnosticNode, this.fetchBuffer);\n  }\n\n  /**\n   * Creates a non-streaming 
endpoint for vector search and similar queries that require buffering\n   */\n  private createNonStreamingEndpoint(\n  
  partitionedQueryExecutionInfo: PartitionedQueryExecutionInfo,\n    sortOrders: any[],\n    correlatedActivityId: 
string,\n    options: FeedOptions,\n  ): ExecutionContext {\n    const queryInfo = 
partitionedQueryExecutionInfo.queryInfo!; // Safe to use ! after validation in constructor\n\n    if 
(!options.allowUnboundedNonStreamingQueries) {\n      this.checkQueryConstraints(queryInfo);\n    }\n\n    const 
vectorSearchBufferSize = this.calculateVectorSearchBufferSize(queryInfo, options);\n\n    
this.validateVectorSearchBufferSize(vectorSearchBufferSize, options);\n\n    const baseContext = new 
ParallelQueryExecutionContext(\n      this.clientContext,\n      this.collectionLink,\n      this.query,\n      
this.options,\n      this.partitionedQueryExecutionInfo,\n      correlatedActivityId,\n    );\n\n    return 
this.wrapWithNonStreamingComponent(\n      baseContext,\n      queryInfo,\n      sortOrders,\n      
vectorSearchBufferSize,\n    );\n  }\n\n  /**\n   * Creates a streaming endpoint with proper pipeline components\n   
*/\n  private createStreamingEndpoint(\n    partitionedQueryExecutionInfo: PartitionedQueryExecutionInfo,\n    
sortOrders: any[],\n    correlatedActivityId: string,\n    isGroupByQuery: boolean,\n    queryContinuationFields: 
any,\n  ): ExecutionContext {\n    const queryInfo = partitionedQueryExecutionInfo.queryInfo!; // Safe to use ! after 
validation in constructor\n\n    // Create base execution context\n    let endpoint = 
this.createBaseExecutionContext(\n      partitionedQueryExecutionInfo,\n      sortOrders,\n      
correlatedActivityId,\n    );\n\n    // Apply pipeline transformations\n    endpoint = 
this.applyGroupByComponents(endpoint, queryInfo, isGroupByQuery);\n    endpoint = 
this.applyDistinctComponents(endpoint, queryInfo, queryContinuationFields);\n    endpoint = 
this.applyLimitComponents(endpoint, queryInfo, queryContinuationFields);\n\n    return endpoint;\n  }\n\n  /**\n   * 
Creates the base execution context (OrderBy or Parallel)\n   */\n  private createBaseExecutionContext(\n    
partitionedQueryExecutionInfo: PartitionedQueryExecutionInfo,\n    sortOrders: any[],\n    correlatedActivityId: 
string,\n  ): ExecutionContext {\n    if (Array.isArray(sortOrders) && sortOrders.length > 0) {\n      // OrderBy 
queries need special wrapping for payload structure\n      return new OrderByEndpointComponent(\n        new 
OrderByQueryExecutionContext(\n          this.clientContext,\n          this.collectionLink,\n          this.query,\n  
        this.options,\n          partitionedQueryExecutionInfo,\n          correlatedActivityId,\n        ),\n        
this.emitRawOrderByPayload,\n      );\n    }\n\n    // Parallel queries\n    return new 
ParallelQueryExecutionContext(\n      this.clientContext,\n      this.collectionLink,\n      this.query,\n      
this.options,\n      partitionedQueryExecutionInfo,\n      correlatedActivityId,\n    );\n  }\n\n  /**\n   * Wraps 
base context with appropriate non-streaming component\n   */\n  private wrapWithNonStreamingComponent(\n    
baseContext: ExecutionContext,\n    queryInfo: QueryInfo,\n    sortOrders: any[],\n    vectorSearchBufferSize: 
number,\n  ): ExecutionContext {\n    const distinctType = queryInfo.distinctType;\n\n    if (distinctType === 
\"None\") {\n      return new NonStreamingOrderByEndpointComponent(\n        baseContext,\n        sortOrders,\n       
 vectorSearchBufferSize,\n        queryInfo.offset,\n        this.emitRawOrderByPayload,\n      );\n    }\n\n    
return new NonStreamingOrderByDistinctEndpointComponent(\n      baseContext,\n      queryInfo,\n      
vectorSearchBufferSize,\n      this.emitRawOrderByPayload,\n    );\n  }\n\n  /**\n   * Applies GROUP BY components to 
the pipeline if needed\n   */\n  private applyGroupByComponents(\n    endpoint: ExecutionContext,\n    queryInfo: 
QueryInfo,\n    isGroupByQuery: boolean,\n  ): ExecutionContext {\n    if (!isGroupByQuery) {\n      return 
endpoint;\n    }\n\n    return queryInfo.hasSelectValue\n      ? new GroupByValueEndpointComponent(endpoint, 
queryInfo)\n      : new GroupByEndpointComponent(endpoint, queryInfo);\n  }\n\n  /**\n   * Applies DISTINCT components 
to the pipeline if needed\n   */\n  private applyDistinctComponents(\n    endpoint: ExecutionContext,\n    queryInfo: 
QueryInfo,\n    queryContinuationFields: any,\n  ): ExecutionContext {\n    const distinctType = 
queryInfo.distinctType;\n\n    if (distinctType === \"Ordered\") {\n      const lastHash = 
queryContinuationFields?.hashedLastResult;\n      return new OrderedDistinctEndpointComponent(endpoint, lastHash);\n   
 }\n\n    if (distinctType === \"Unordered\") {\n      return new UnorderedDistinctEndpointComponent(endpoint);\n    
}\n\n    return endpoint;\n  }\n\n  /**\n   * Applies TOP and OFFSET+LIMIT components to the pipeline if needed\n   
*/\n  private applyLimitComponents(\n    endpoint: ExecutionContext,\n    queryInfo: QueryInfo,\n    
queryContinuationFields: any,\n  ): ExecutionContext {\n    // Apply TOP component (TOP N is effectively OFFSET 0 
LIMIT N)\n    let top = queryInfo.top;\n    if (typeof top === \"number\") {\n      if (queryContinuationFields?.limit 
!== undefined) {\n        top = queryContinuationFields.limit;\n      }\n      endpoint = new 
OffsetLimitEndpointComponent(endpoint, 0, top);\n    }\n\n    // Apply OFFSET+LIMIT component\n    let limit = 
queryInfo.limit;\n    let offset = queryInfo.offset;\n\n    if (queryContinuationFields) {\n      if 
(queryContinuationFields.limit !== undefined) {\n        limit = queryContinuationFields.limit;\n      }\n      if 
(queryContinuationFields.offset !== undefined) {\n        offset = queryContinuationFields.offset;\n      }\n    }\n\n 
   if (typeof limit === \"number\" && typeof offset === \"number\") {\n      endpoint = new 
OffsetLimitEndpointComponent(endpoint, offset, limit);\n    }\n\n    return endpoint;\n  }\n\n  /**\n   * Validates 
vector search buffer size constraints\n   */\n  private validateVectorSearchBufferSize(\n    vectorSearchBufferSize: 
number,\n    options: FeedOptions,\n  ): void {\n    const maxBufferSize = options[\"vectorSearchBufferSize\"]\n      
? options[\"vectorSearchBufferSize\"]\n      : QueryExecution.DEFAULT_MAX_VECTOR_SEARCH_BUFFER_SIZE;\n\n    if 
(vectorSearchBufferSize > maxBufferSize) {\n      throw new ErrorResponse(\n        `Executing a vector search query 
with TOP or OFFSET + LIMIT value ${vectorSearchBufferSize} larger than the vectorSearchBufferSize ${maxBufferSize} ` 
+\n          `is not allowed`,\n      );\n    }\n  }\n\n  private calculateVectorSearchBufferSize(queryInfo: 
QueryInfo, options: FeedOptions): number {\n    if (queryInfo.top === 0 || queryInfo.limit === 0) return 0;\n    
return queryInfo.top\n      ? queryInfo.top\n      : queryInfo.limit\n        ? queryInfo.offset + queryInfo.limit\n   
     : options[\"vectorSearchBufferSize\"] && options[\"vectorSearchBufferSize\"] > 0\n          ? 
options[\"vectorSearchBufferSize\"]\n          : QueryExecution.DEFAULT_MAX_VECTOR_SEARCH_BUFFER_SIZE;\n  }\n\n  
private checkQueryConstraints(queryInfo: QueryInfo): void {\n    const hasTop = queryInfo.top || queryInfo.top === 
0;\n    const hasLimit = queryInfo.limit || queryInfo.limit === 0;\n    if (!hasTop && !hasLimit) {\n      throw new 
ErrorResponse(\n        \"Executing a non-streaming search query without TOP or LIMIT can consume a large number of 
RUs \" +\n          \"very fast and have long runtimes. Please ensure you are using one of the above two filters \" 
+\n          \"with your vector search query.\",\n      );\n    }\n    return;\n  }\n\n  /**\n   * Analyzes query 
information and extracts key characteristics for query execution planning\n   */\n  private 
analyzeQueryInfo(queryInfo: QueryInfo) {\n    const sortOrders = queryInfo.orderBy;\n    const nonStreamingOrderBy = 
queryInfo.hasNonStreamingOrderBy;\n    const isOrderByQuery = Array.isArray(sortOrders) && sortOrders.length > 0;\n\n  
  // Check if this is a GROUP BY query\n    const isGroupByQuery =\n      
Object.keys(queryInfo.groupByAliasToAggregateType || {}).length > 0 ||\n      (queryInfo.aggregates?.length || 0) > 0 
||\n      (queryInfo.groupByExpressions?.length || 0) > 0;\n\n    // Check if this is an unordered DISTINCT query\n    
const isUnorderedDistinctQuery = queryInfo.distinctType === \"Unordered\";\n\n    // Determine if this query type 
supports continuation tokens\n    const querySupportsTokens =\n      !isUnorderedDistinctQuery && !isGroupByQuery && 
!nonStreamingOrderBy;\n\n    return {\n      sortOrders,\n      nonStreamingOrderBy,\n      isOrderByQuery,\n      
isGroupByQuery,\n      isUnorderedDistinctQuery,\n      querySupportsTokens,\n    };\n  }\n}\n"]}
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.d.ts:13:    
hasMoreResults(): boolean;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.d.ts:14:    
fetchMore(diagnosticNode: DiagnosticNodeInternal): Promise<Response<any>>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.d.ts:15:    
private consolidateGroupResults;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.d.ts:16:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.d.ts:17://# 
sourceMappingURL=GroupByEndpointComponent.d.ts.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:17:    
hasMoreResults() {
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:18:      
  return this.executionContext.hasMoreResults();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:19:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:20:    
async fetchMore(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:21:      
  if (this.completed) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:22:      
      return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:23:      
          result: undefined,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:24:      
          headers: getInitialHeader(),
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:25:      
      };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:26:      
  }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:27:      
  const aggregateHeaders = getInitialHeader();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:28:      
  const response = await this.executionContext.fetchMore(diagnosticNode);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:29:      
  if (!response) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:30:      
      // If there are any groupings, consolidate and return them
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:31:      
      if (this.groupings.size > 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:32:      
          return this.consolidateGroupResults(aggregateHeaders);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:33:      
      }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:34:      
      return { result: undefined, headers: aggregateHeaders };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:35:      
  }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:36:      
  mergeHeaders(aggregateHeaders, response.headers);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:37:      
  if (response.result === undefined ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:38:      
      !Array.isArray(response.result.buffer) ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:39:      
      response.result.buffer.length === 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:40:      
      // If there are any groupings, consolidate and return them
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:41:      
      if (this.groupings.size > 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:42:      
          return this.consolidateGroupResults(aggregateHeaders);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:43:      
      }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:44:      
      return { result: undefined, headers: aggregateHeaders };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:45:      
  }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:46:      
  const parallelResult = response.result;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:47:      
  const dataToProcess = parallelResult.buffer;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:48:      
  // Process GROUP BY aggregation logic
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:49:      
  for (const item of dataToProcess) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:50:      
      // If it exists, process it via aggregators
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:51:      
      if (item) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:52:      
          const group = item.groupByItems ? await hashObject(item.groupByItems) : emptyGroup;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:53:      
          const aggregators = this.groupings.get(group);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:54:      
          const payload = item.payload;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:55:      
          if (aggregators) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:56:      
              // Iterator over all results in the payload
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:57:      
              for (const key of Object.keys(payload)) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:58:      
                  // in case the value of a group is null make sure we create a dummy payload with item2==null
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:87:      
  if (this.executionContext.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:88:      
      // Return empty buffer but preserve the structure and pass-through fields
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:89:      
      const result = createParallelQueryResult([], // empty buffer
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:90:      
      new Map());
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:91:      
      return { result, headers: aggregateHeaders };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:92:      
  }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:93:      
  else {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:94:      
      return this.consolidateGroupResults(aggregateHeaders);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:95:      
  }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:96:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:97:    
consolidateGroupResults(aggregateHeaders) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:98:      
  for (const grouping of this.groupings.values()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:99:      
      const groupResult = {};
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:100:     
       for (const [aggregateKey, aggregator] of grouping.entries()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:101:     
           groupResult[aggregateKey] = aggregator.getResult();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:102:     
       }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:103:     
       this.aggregateResultArray.push(groupResult);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:104:     
   }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:105:     
   this.completed = true;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:106:     
   // Return in the new structure format using the utility function
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:107:     
   const result = createParallelQueryResult(this.aggregateResultArray, new Map());
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:108:     
   return { result, headers: aggregateHeaders };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:109:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:110:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js:111://# 
sourceMappingURL=GroupByEndpointComponent.js.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByEndpointComponent.js.map:1:{"v
ersion":3,"file":"GroupByEndpointComponent.js","sourceRoot":"","sources":["../../../../src/queryExecutionContext/Endpoi
ntComponent/GroupByEndpointComponent.ts"],"names":[],"mappings":"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","sour
cesContent":["// Copyright (c) Microsoft Corporation.\n// Licensed under the MIT License.\nimport type { Response } 
from \"../../request/index.js\";\nimport type { ExecutionContext } from \"../ExecutionContext.js\";\nimport type { 
CosmosHeaders } from \"../CosmosHeaders.js\";\nimport type { QueryInfo } from 
\"../../request/ErrorResponse.js\";\nimport { hashObject } from \"../../utils/hashObject.js\";\nimport type { 
Aggregator } from \"../Aggregators/index.js\";\nimport { createAggregator } from \"../Aggregators/index.js\";\nimport 
{ getInitialHeader, mergeHeaders } from \"../headerUtils.js\";\nimport { emptyGroup, extractAggregateResult } from 
\"./emptyGroup.js\";\nimport type { DiagnosticNodeInternal } from 
\"../../diagnostics/DiagnosticNodeInternal.js\";\nimport type { ParallelQueryResult } from 
\"../parallelQueryResult.js\";\nimport { createParallelQueryResult } from \"../parallelQueryResult.js\";\n\ninterface 
GroupByResult {\n  groupByItems: any[];\n  payload: any;\n}\n\n/** @hidden */\nexport class GroupByEndpointComponent 
implements ExecutionContext {\n  constructor(\n    private executionContext: ExecutionContext,\n    private queryInfo: 
QueryInfo,\n  ) {}\n\n  private readonly groupings: Map<string, Map<string, Aggregator>> = new Map();\n  private 
readonly aggregateResultArray: any[] = [];\n  private completed: boolean = false;\n\n  public hasMoreResults(): 
boolean {\n    return this.executionContext.hasMoreResults();\n  }\n\n  public async fetchMore(diagnosticNode: 
DiagnosticNodeInternal): Promise<Response<any>> {\n    if (this.completed) {\n      return {\n        result: 
undefined,\n        headers: getInitialHeader(),\n      };\n    }\n    const aggregateHeaders = getInitialHeader();\n  
  const response = await this.executionContext.fetchMore(diagnosticNode);\n\n    if (!response) {\n      // If there 
are any groupings, consolidate and return them\n      if (this.groupings.size > 0) {\n        return 
this.consolidateGroupResults(aggregateHeaders);\n      }\n      return { result: undefined, headers: aggregateHeaders 
};\n    }\n\n    mergeHeaders(aggregateHeaders, response.headers);\n\n    if (\n      response.result === undefined 
||\n      !Array.isArray(response.result.buffer) ||\n      response.result.buffer.length === 0\n    ) {\n      // If 
there are any groupings, consolidate and return them\n      if (this.groupings.size > 0) {\n        return 
this.consolidateGroupResults(aggregateHeaders);\n      }\n      return { result: undefined, headers: aggregateHeaders 
};\n    }\n\n    const parallelResult = response.result as ParallelQueryResult;\n    const dataToProcess: 
GroupByResult[] = parallelResult.buffer as GroupByResult[];\n\n    // Process GROUP BY aggregation logic\n    for 
(const item of dataToProcess) {\n      // If it exists, process it via aggregators\n      if (item) {\n        const 
group = item.groupByItems ? await hashObject(item.groupByItems) : emptyGroup;\n        const aggregators = 
this.groupings.get(group);\n        const payload = item.payload;\n        if (aggregators) {\n          // Iterator 
over all results in the payload\n          for (const key of Object.keys(payload)) {\n            // in case the value 
of a group is null make sure we create a dummy payload with item2==null\n            const effectiveGroupByValue = 
payload[key]\n              ? payload[key]\n              : new Map().set(\"item2\", null);\n            const 
aggregateResult = extractAggregateResult(effectiveGroupByValue);\n            
aggregators.get(key).aggregate(aggregateResult);\n          }\n        } else {\n          // This is the first time 
we have seen a grouping. Setup the initial result without aggregate values\n          const grouping = new Map();\n    
      this.groupings.set(group, grouping);\n          // Iterator over all results in the payload\n          for 
(const key of Object.keys(payload)) {\n            const aggregateType = 
this.queryInfo.groupByAliasToAggregateType[key];\n            // Create a new aggregator for this specific aggregate 
field\n            const aggregator = createAggregator(aggregateType);\n            grouping.set(key, aggregator);\n   
         if (aggregateType) {\n              const aggregateResult = extractAggregateResult(payload[key]);\n           
   aggregator.aggregate(aggregateResult);\n            } else {\n              aggregator.aggregate(payload[key]);\n   
         }\n          }\n        }\n      }\n    }\n\n    if (this.executionContext.hasMoreResults()) {\n      // 
Return empty buffer but preserve the structure and pass-through fields\n      const result = 
createParallelQueryResult(\n        [], // empty buffer\n        new Map(),\n      );\n\n      return { result, 
headers: aggregateHeaders };\n    } else {\n      return this.consolidateGroupResults(aggregateHeaders);\n    }\n  
}\n\n  private consolidateGroupResults(aggregateHeaders: CosmosHeaders): Response<any> {\n    for (const grouping of 
this.groupings.values()) {\n      const groupResult: any = {};\n      for (const [aggregateKey, aggregator] of 
grouping.entries()) {\n        groupResult[aggregateKey] = aggregator.getResult();\n      }\n      
this.aggregateResultArray.push(groupResult);\n    }\n    this.completed = true;\n\n    // Return in the new structure 
format using the utility function\n    const result = createParallelQueryResult(this.aggregateResultArray, new 
Map());\n\n    return { result, headers: aggregateHeaders };\n  }\n}\n"]}
> 
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.d.ts:14: 
   hasMoreResults(): boolean;
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.d.ts:15: 
   fetchMore(diagnosticNode: DiagnosticNodeInternal): Promise<Response<any>>;
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.d.ts:16: 
   private generateAggregateResponse;
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.d.ts:17:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.d.ts:18
://# sourceMappingURL=GroupByValueEndpointComponent.d.ts.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:20: 
   hasMoreResults() {
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:21: 
       return this.executionContext.hasMoreResults();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:22: 
   }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:23: 
   async fetchMore(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:24: 
       if (this.completed) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:25: 
           return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:26: 
               result: undefined,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:27: 
               headers: getInitialHeader(),
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:28: 
           };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:29: 
       }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:30: 
       const aggregateHeaders = getInitialHeader();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:31: 
       const response = await this.executionContext.fetchMore(diagnosticNode);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:32: 
       if (!response) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:33: 
           if (this.aggregators.size > 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:34: 
               return this.generateAggregateResponse(aggregateHeaders);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:35: 
           }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:36: 
           return { result: undefined, headers: aggregateHeaders };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:37: 
       }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:38: 
       mergeHeaders(aggregateHeaders, response.headers);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:39: 
       if (response.result === undefined ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:40: 
           !Array.isArray(response.result.buffer) ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:41: 
           response.result.buffer.length === 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:42: 
           if (this.aggregators.size > 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:43: 
               return this.generateAggregateResponse(aggregateHeaders);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:44: 
           }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:45: 
           return { result: undefined, headers: aggregateHeaders };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:46: 
       }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:47: 
       const parallelResult = response.result;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:48: 
       const dataToProcess = parallelResult.buffer;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:49: 
       for (const item of dataToProcess) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:50: 
           if (item) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:51: 
               let grouping = emptyGroup;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:52: 
               let payload = item;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:53: 
               if (item.groupByItems) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:54: 
                   // If the query contains a GROUP BY clause, it will have a payload property and groupByItems
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:55: 
                   payload = item.payload;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:56: 
                   grouping = await hashObject(item.groupByItems);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:57: 
               }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:58: 
               const aggregator = this.aggregators.get(grouping);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:59: 
               if (!aggregator) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:60: 
                   // This is the first time we have seen a grouping so create a new aggregator
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:61: 
                   this.aggregators.set(grouping, createAggregator(this.aggregateType));
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:86: 
       if (this.executionContext.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:87: 
           // Return empty buffer but preserve the structure and pass-through fields
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:88: 
           const result = createParallelQueryResult([], // empty buffer
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:89: 
           new Map());
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:90: 
           return { result, headers: aggregateHeaders };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:91: 
       }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:92: 
       else {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:93: 
           // If no results are left in the underlying execution context, convert our aggregate results to an array
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:94: 
           return this.generateAggregateResponse(aggregateHeaders);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:95: 
       }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:96: 
   }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:97: 
   generateAggregateResponse(aggregateHeaders) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:98: 
       for (const aggregator of this.aggregators.values()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:99: 
           const result = aggregator.getResult();
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:100:  
          if (result !== undefined) {
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:101:  
              this.aggregateResultArray.push(result);
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:102:  
          }
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:103:  
      }
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:104:  
      this.completed = true;
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:105:  
      const result = createParallelQueryResult(this.aggregateResultArray, new Map());
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:106:  
      return {
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:107:  
          result,
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:108:  
          headers: aggregateHeaders,
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:109:  
      };
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:110:  
  }
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:111:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js:112:
//# sourceMappingURL=GroupByValueEndpointComponent.js.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\GroupByValueEndpointComponent.js.map:
1:{"version":3,"file":"GroupByValueEndpointComponent.js","sourceRoot":"","sources":["../../../../src/queryExecutionCont
ext/EndpointComponent/GroupByValueEndpointComponent.ts"],"names":[],"mappings":"AAMA,OAAO,EAAE,UAAU,EAAE,MAAM,2BAA2B,CA
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","sourcesContent":["// 
Copyright (c) Microsoft Corporation.\n// Licensed under the MIT License.\nimport type { Response } from 
\"../../request/index.js\";\nimport type { ExecutionContext } from \"../ExecutionContext.js\";\nimport type { 
CosmosHeaders } from \"../CosmosHeaders.js\";\nimport type { AggregateType, QueryInfo } from 
\"../../request/ErrorResponse.js\";\nimport { hashObject } from \"../../utils/hashObject.js\";\nimport type { 
Aggregator } from \"../Aggregators/index.js\";\nimport { createAggregator } from \"../Aggregators/index.js\";\nimport 
{ getInitialHeader, mergeHeaders } from \"../headerUtils.js\";\nimport { emptyGroup, extractAggregateResult } from 
\"./emptyGroup.js\";\nimport type { DiagnosticNodeInternal } from 
\"../../diagnostics/DiagnosticNodeInternal.js\";\nimport type { ParallelQueryResult } from 
\"../parallelQueryResult.js\";\nimport { createParallelQueryResult } from \"../parallelQueryResult.js\";\n\ninterface 
GroupByResult {\n  groupByItems: any[];\n  payload: any;\n}\n\n/** @hidden */\nexport class 
GroupByValueEndpointComponent implements ExecutionContext {\n  private readonly aggregators: Map<string, Aggregator> = 
new Map();\n  private readonly aggregateResultArray: any[] = [];\n  private aggregateType: AggregateType;\n  private 
completed: boolean = false;\n\n  constructor(\n    private executionContext: ExecutionContext,\n    private queryInfo: 
QueryInfo,\n  ) {\n    // VALUE queries will only every have a single grouping\n    this.aggregateType = 
this.queryInfo.aggregates[0];\n  }\n\n  public hasMoreResults(): boolean {\n    return 
this.executionContext.hasMoreResults();\n  }\n\n  public async fetchMore(diagnosticNode: DiagnosticNodeInternal): 
Promise<Response<any>> {\n    if (this.completed) {\n      return {\n        result: undefined,\n        headers: 
getInitialHeader(),\n      };\n    }\n    const aggregateHeaders = getInitialHeader();\n    const response = await 
this.executionContext.fetchMore(diagnosticNode);\n\n    if (!response) {\n      if (this.aggregators.size > 0) {\n     
   return this.generateAggregateResponse(aggregateHeaders);\n      }\n      return { result: undefined, headers: 
aggregateHeaders };\n    }\n\n    mergeHeaders(aggregateHeaders, response.headers);\n\n    if (\n      response.result 
=== undefined ||\n      !Array.isArray(response.result.buffer) ||\n      response.result.buffer.length === 0\n    ) 
{\n      if (this.aggregators.size > 0) {\n        return this.generateAggregateResponse(aggregateHeaders);\n      }\n 
     return { result: undefined, headers: aggregateHeaders };\n    }\n\n    const parallelResult = response.result as 
ParallelQueryResult;\n    const dataToProcess: GroupByResult[] = parallelResult.buffer as GroupByResult[];\n\n    for 
(const item of dataToProcess) {\n      if (item) {\n        let grouping: string = emptyGroup;\n        let payload: 
any = item;\n        if (item.groupByItems) {\n          // If the query contains a GROUP BY clause, it will have a 
payload property and groupByItems\n          payload = item.payload;\n          grouping = await 
hashObject(item.groupByItems);\n        }\n\n        const aggregator = this.aggregators.get(grouping);\n        if 
(!aggregator) {\n          // This is the first time we have seen a grouping so create a new aggregator\n          
this.aggregators.set(grouping, createAggregator(this.aggregateType));\n        }\n\n        if (this.aggregateType) 
{\n          const aggregateResult = extractAggregateResult(payload[0]);\n          // if aggregate result is null, we 
need to short circuit aggregation and return undefined\n          if (aggregateResult === null) {\n            
this.completed = true;\n          }\n          this.aggregators.get(grouping).aggregate(aggregateResult);\n        } 
else {\n          // Queries with no aggregates pass the payload directly to the aggregator\n          // Example: 
SELECT VALUE c.team FROM c GROUP BY c.team\n          this.aggregators.get(grouping).aggregate(payload);\n        }\n  
    }\n    }\n\n    // We bail early since we got an undefined result back `[{}]`\n    if (this.completed) {\n      
const result = createParallelQueryResult([], new Map());\n\n      return {\n        result,\n        headers: 
aggregateHeaders,\n      };\n    }\n\n    if (this.executionContext.hasMoreResults()) {\n      // Return empty buffer 
but preserve the structure and pass-through fields\n      const result = createParallelQueryResult(\n        [], // 
empty buffer\n        new Map(),\n      );\n\n      return { result, headers: aggregateHeaders };\n    } else {\n      
// If no results are left in the underlying execution context, convert our aggregate results to an array\n      return 
this.generateAggregateResponse(aggregateHeaders);\n    }\n  }\n\n  private generateAggregateResponse(aggregateHeaders: 
CosmosHeaders): Response<any> {\n    for (const aggregator of this.aggregators.values()) {\n      const result = 
aggregator.getResult();\n      if (result !== undefined) {\n        this.aggregateResultArray.push(result);\n      }\n 
   }\n    this.completed = true;\n\n    const result = createParallelQueryResult(this.aggregateResultArray, new 
Map());\n\n    return {\n      result,\n      headers: aggregateHeaders,\n    };\n  }\n}\n"]}
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.d.ts:35:    hasMoreResults(): boolean;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.d.ts:36:    fetchMore(diagnosticNode?: DiagnosticNodeInternal): Promise<Response<any>>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.d.ts:37:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.d.ts:38://# sourceMappingURL=NonStreamingOrderByDistinctEndpointComponent.d.ts.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:76:    hasMoreResults() {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:77:        if (this.priorityQueueBufferSize === 0)
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:78:            return false;
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:79:        return this.executionContext.hasMoreResults();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:80:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:81:    async fetchMore(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:82:        if (this.isCompleted) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:83:            return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:84:                result: undefined,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:85:                headers: getInitialHeader(),
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:86:            };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:87:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:88:        let resHeaders = getInitialHeader();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:89:        // if size is 0, just return undefined to signal to more results. Valid if query is TOP 0 or 
LIMIT 0
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:90:        if (this.priorityQueueBufferSize <= 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:91:            return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:92:                result: undefined,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:93:                headers: resHeaders,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:94:            };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:95:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:96:        // If there are more results in backend, keep filling map.
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:97:        if (this.executionContext.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:98:            // Grab the next result
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:99:            const response = await this.executionContext.fetchMore(diagnosticNode);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:100:            if (!response) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:101:                this.isCompleted = true;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:102:                if (this.aggregateMap.size() > 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:103:                    await this.buildFinalResultArray();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:104:                    const result = createParallelQueryResult(this.finalResultArray, new Map(), {}, 
undefined);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:105:                    return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:106:                        result,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:107:                        headers: resHeaders,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:108:                    };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:109:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:110:                return { result: undefined, headers: resHeaders };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:111:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:112:            if (response.result === undefined ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:113:                !Array.isArray(response.result.buffer) ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:114:                response.result.buffer.length === 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:115:                this.isCompleted = true;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:116:                if (this.aggregateMap.size() > 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:117:                    await this.buildFinalResultArray();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:118:                    const result = createParallelQueryResult(this.finalResultArray, new Map(), {}, 
undefined);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:119:                    return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:120:                        result,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:121:                        headers: response.headers,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:122:                    };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:123:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:124:                return { result: undefined, headers: response.headers };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:125:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:126:            resHeaders = response.headers;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:127:            const parallelResult = response.result;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:128:            const dataToProcess = parallelResult.buffer;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:129:            for (const item of dataToProcess) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:130:                if (item) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:131:                    const key = await hashObject(item?.payload);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:132:                    this.aggregateMap.set(key, item);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:133:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:134:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:135:            // return [] to signal that there are more results to fetch.
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:136:            if (this.executionContext.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:137:                const result = createParallelQueryResult([], // empty buffer
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:138:                new Map(), undefined, undefined);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:139:                return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:140:                    result,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:141:                    headers: resHeaders,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:142:                };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:143:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:144:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:145:        // If all results are fetched from backend, prepare final results
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:146:        if (!this.executionContext.hasMoreResults() && !this.isCompleted) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:147:            this.isCompleted = true;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:148:            await this.buildFinalResultArray();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:149:            const result = createParallelQueryResult(this.finalResultArray, new Map());
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:150:            return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:151:                result,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:152:                headers: resHeaders,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:153:            };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:154:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:155:        // Signal that there are no more results.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:156:        const result = createParallelQueryResult([], new Map());
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:157:        return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:158:            result,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:159:            headers: resHeaders,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:160:        };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:161:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:162:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js:163://# sourceMappingURL=NonStreamingOrderByDistinctEndpointComponent.js.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByDistinctEndpointCo
mponent.js.map:1:{"version":3,"file":"NonStreamingOrderByDistinctEndpointComponent.js","sourceRoot":"","sources":["../.
./../../src/queryExecutionContext/EndpointComponent/NonStreamingOrderByDistinctEndpointComponent.ts"],"names":[],"mappi
ngs":"AAIA,OAAO,EAAE,gBAAgB,EAAE,MAAM,mBAAmB,CAAC;AAErD,OAAO,EAAE,UAAU,EAAE,MAAM,2BAA2B,CAAC;AAEvD,OAAO,EAAE,sBAAsB,EAA
E,MAAM,uCAAuC,CAAC;AAC/E,OAAO,EAAE,sBAAsB,EAAE,MAAM,uCAAuC,CAAC;AAC/E,OAAO,EAAE,iBAAiB,EAAE,MAAM,yBAAyB,CAAC;AAE5D,OAAO
,EAAE,yBAAyB,EAAE,MAAM,2BAA2B,CAAC;AAEtE;;;GAGG;AACH,MAAM,OAAO,4CAA4C;IAqB7C;IACA;IACA;IACA;IAvBV;;OAEG;IACK,YAAY,CAAoD
;IACxE;;OAEG;IACK,qBAAqB,CAAoD;IACjF;;OAEG;IACK,gBAAgB,CAA8B;IAE9C,UAAU,CAAW;IAC7B;;OAEG;IACK,WAAW,GAAY,KAAK,CAAC;IAErC
,YACU,gBAAkC,EAClC,SAAoB,EACpB,uBAA+B,EAC/B,wBAAiC,KAAK;QAHtC,qBAAgB,GAAhB,gBAAgB,CAAkB;QAClC,cAAS,GAAT,SAAS,CAAW;QACpB
,4BAAuB,GAAvB,uBAAuB,CAAQ;QAC/B,0BAAqB,GAArB,qBAAqB,CAAiB;QAE9C,IAAI,CAAC,UAAU,GAAG,IAAI,CAAC,SAAS,CAAC,OAAO,CAAC;QACzC
,MAAM,UAAU,GAAG,IAAI,iBAAiB,CAAC,IAAI,CAAC,UAAU,CAAC,CAAC;QAC1D,IAAI,CAAC,YAAY,GAAG,IAAI,sBAAsB,CAC5C,CAAC,CAA4B,EAAE,C
AA4B,EAAE,EAAE;YAC7D,OAAO,UAAU,CAAC,YAAY,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC;QACvC,CAAC,CACF,CAAC;QACF,IAAI,CAAC,qBAAqB,GAAG,
IAAI,sBAAsB,CACrD,CAAC,CAA4B,EAAE,CAA4B,EAAE,EAAE;YAC7D,OAAO,UAAU,CAAC,YAAY,CAAC,CAAC,EAAE,CAAC,CAAC,CAAC;QACvC,CAAC,EA
CD,IAAI,CAAC,uBAAuB,CAC7B,CAAC;IACJ,CAAC;IAED;;OAEG;IACK,KAAK,CAAC,qBAAqB;QACjC,sEAAsE;QACtE,MAAM,SAAS,GAAG,IAAI,CAAC,Y
AAY,CAAC,oBAAoB,EAAE,CAAC;QAC3D,KAAK,MAAM,KAAK,IAAI,SAAS,EAAE,CAAC;YAC9B,IAAI,CAAC,qBAAqB,CAAC,OAAO,CAAC,KAAK,CAAC,CAAC
;QAC5C,CAAC;QAED,iEAAiE;QACjE,MAAM,MAAM,GAAG,IAAI,CAAC,SAAS,CAAC,MAAM,CAAC,CAAC,CAAC,IAAI,CAAC,SAAS,CAAC,MAAM,CAAC,CAAC
,CAAC,CAAC,CAAC;QACjE,MAAM,SAAS,GAAG,IAAI,CAAC,qBAAqB,CAAC,IAAI,EAAE,CAAC;QACpD,MAAM,cAAc,GAAG,SAAS,GAAG,MAAM,CAAC;QAE1
C,IAAI,cAAc,IAAI,CAAC,EAAE,CAAC;YACxB,IAAI,CAAC,gBAAgB,GAAG,EAAE,CAAC;QAC7B,CAAC;aAAM,CAAC;YACN,IAAI,CAAC,gBAAgB,GAAG,I
AAI,KAAK,CAAC,cAAc,CAAC,CAAC;YAClD,wGAAwG;YACxG,KAAK,IAAI,KAAK,GAAG,cAAc,GAAG,CAAC,EAAE,KAAK,IAAI,CAAC,EAAE,KAAK,EAAE,E
AAE,CAAC;gBACzD,IAAI,IAAI,CAAC,qBAAqB,EAAE,CAAC;oBAC/B,IAAI,CAAC,gBAAgB,CAAC,KAAK,CAAC,GAAG,IAAI,CAAC,qBAAqB,CAAC,OAAO,
EAAE,CAAC;gBACtE,CAAC;qBAAM,CAAC;oBACN,IAAI,CAAC,gBAAgB,CAAC,KAAK,CAAC,GAAG,IAAI,CAAC,qBAAqB,CAAC,OAAO,EAAE,EAAE,OAAO,C
AAC;gBAC/E,CAAC;YACH,CAAC;QACH,CAAC;IACH,CAAC;IAEM,cAAc;QACnB,IAAI,IAAI,CAAC,uBAAuB,KAAK,CAAC;YAAE,OAAO,KAAK,CAAC;QACrD
,OAAO,IAAI,CAAC,gBAAgB,CAAC,cAAc,EAAE,CAAC;IAChD,CAAC;IAEM,KAAK,CAAC,SAAS,CAAC,cAAuC;QAC5D,IAAI,IAAI,CAAC,WAAW,EAAE,CAA
C;YACrB,OAAO;gBACL,MAAM,EAAE,SAAS;gBACjB,OAAO,EAAE,gBAAgB,EAAE;aAC5B,CAAC;QACJ,CAAC;QACD,IAAI,UAAU,GAAG,gBAAgB,EAAE,CAA
C;QACpC,oGAAoG;QACpG,IAAI,IAAI,CAAC,uBAAuB,IAAI,CAAC,EAAE,CAAC;YACtC,OAAO;gBACL,MAAM,EAAE,SAAS;gBACjB,OAAO,EAAE,UAAU;aA
CpB,CAAC;QACJ,CAAC;QAED,0DAA0D;QAC1D,IAAI,IAAI,CAAC,gBAAgB,CAAC,cAAc,EAAE,EAAE,CAAC;YAC3C,uBAAuB;YACvB,MAAM,QAAQ,GAAG,M
AAM,IAAI,CAAC,gBAAgB,CAAC,SAAS,CAAC,cAAc,CAAC,CAAC;YAEvE,IAAI,CAAC,QAAQ,EAAE,CAAC;gBACd,IAAI,CAAC,WAAW,GAAG,IAAI,CAAC;g
BACxB,IAAI,IAAI,CAAC,YAAY,CAAC,IAAI,EAAE,GAAG,CAAC,EAAE,CAAC;oBACjC,MAAM,IAAI,CAAC,qBAAqB,EAAE,CAAC;oBACnC,MAAM,MAAM,GA
AG,yBAAyB,CAAC,IAAI,CAAC,gBAAgB,EAAE,IAAI,GAAG,EAAE,EAAE,EAAE,EAAE,SAAS,CAAC,CAAC;oBAE1F,OAAO;wBACL,MAAM;wBACN,OAAO,EAA
E,UAAU;qBACpB,CAAC;gBACJ,CAAC;gBACD,OAAO,EAAE,MAAM,EAAE,SAAS,EAAE,OAAO,EAAE,UAAU,EAAE,CAAC;YACpD,CAAC;YAED,IACE,QAAQ,CA
AC,MAAM,KAAK,SAAS;gBAC7B,CAAC,KAAK,CAAC,OAAO,CAAC,QAAQ,CAAC,MAAM,CAAC,MAAM,CAAC;gBACtC,QAAQ,CAAC,MAAM,CAAC,MAAM,CAAC,MA
AM,KAAK,CAAC,EACnC,CAAC;gBACD,IAAI,CAAC,WAAW,GAAG,IAAI,CAAC;gBACxB,IAAI,IAAI,CAAC,YAAY,CAAC,IAAI,EAAE,GAAG,CAAC,EAAE,CA
AC;oBACjC,MAAM,IAAI,CAAC,qBAAqB,EAAE,CAAC;oBACnC,MAAM,MAAM,GAAG,yBAAyB,CAAC,IAAI,CAAC,gBAAgB,EAAE,IAAI,GAAG,EAAE,EAAE,E
AAE,EAAE,SAAS,CAAC,CAAC;oBAE1F,OAAO;wBACL,MAAM;wBACN,OAAO,EAAE,QAAQ,CAAC,OAAO;qBAC1B,CAAC;gBACJ,CAAC;gBACD,OAAO,EAAE,MA
AM,EAAE,SAAS,EAAE,OAAO,EAAE,QAAQ,CAAC,OAAO,EAAE,CAAC;YAC1D,CAAC;YACD,UAAU,GAAG,QAAQ,CAAC,OAAO,CAAC;YAE9B,MAAM,cAAc,GAAG
,QAAQ,CAAC,MAA6B,CAAC;YAC9D,MAAM,aAAa,GACjB,cAAc,CAAC,MAAqC,CAAC;YAEvD,KAAK,MAAM,IAAI,IAAI,aAAa,EAAE,CAAC;gBACjC,IAAI,I
AAI,EAAE,CAAC;oBACT,MAAM,GAAG,GAAG,MAAM,UAAU,CAAC,IAAI,EAAE,OAAO,CAAC,CAAC;oBAC5C,IAAI,CAAC,YAAY,CAAC,GAAG,CAAC,GAAG,EA
AE,IAAI,CAAC,CAAC;gBACnC,CAAC;YACH,CAAC;YAED,4DAA4D;YAC5D,IAAI,IAAI,CAAC,gBAAgB,CAAC,cAAc,EAAE,EAAE,CAAC;gBAC3C,MAAM,MA
AM,GAAG,yBAAyB,CACtC,EAAE,EAAE,eAAe;gBACnB,IAAI,GAAG,EAAE,EACT,SAAS,EACT,SAAS,CACV,CAAC;gBAEF,OAAO;oBACL,MAAM;oBACN,OAA
O,EAAE,UAAU;iBACpB,CAAC;YACJ,CAAC;QACH,CAAC;QAED,iEAAiE;QACjE,IAAI,CAAC,IAAI,CAAC,gBAAgB,CAAC,cAAc,EAAE,IAAI,CAAC,IAAI,
CAAC,WAAW,EAAE,CAAC;YACjE,IAAI,CAAC,WAAW,GAAG,IAAI,CAAC;YACxB,MAAM,IAAI,CAAC,qBAAqB,EAAE,CAAC;YACnC,MAAM,MAAM,GAAG,yBAA
yB,CAAC,IAAI,CAAC,gBAAgB,EAAE,IAAI,GAAG,EAAE,CAAC,CAAC;YAE3E,OAAO;gBACL,MAAM;gBACN,OAAO,EAAE,UAAU;aACpB,CAAC;QACJ,CAAC;
QACD,yCAAyC;QACzC,MAAM,MAAM,GAAG,yBAAyB,CAAC,EAAE,EAAE,IAAI,GAAG,EAAE,CAAC,CAAC;QAExD,OAAO;YACL,MAAM;YACN,OAAO,EAAE,UAA
U;SACpB,CAAC;IACJ,CAAC;CACF","sourcesContent":["// Copyright (c) Microsoft Corporation.\n// Licensed under the MIT 
License.\nimport type { QueryInfo, Response } from \"../../request/index.js\";\nimport type { ExecutionContext } from 
\"../ExecutionContext.js\";\nimport { getInitialHeader } from \"../headerUtils.js\";\nimport type { 
DiagnosticNodeInternal } from \"../../diagnostics/DiagnosticNodeInternal.js\";\nimport { hashObject } from 
\"../../utils/hashObject.js\";\nimport type { NonStreamingOrderByResult } from 
\"../nonStreamingOrderByResult.js\";\nimport { FixedSizePriorityQueue } from 
\"../../utils/fixedSizePriorityQueue.js\";\nimport { NonStreamingOrderByMap } from 
\"../../utils/nonStreamingOrderByMap.js\";\nimport { OrderByComparator } from \"../orderByComparator.js\";\nimport 
type { ParallelQueryResult } from \"../parallelQueryResult.js\";\nimport { createParallelQueryResult } from 
\"../parallelQueryResult.js\";\n\n/**\n * @hidden\n * Represents an endpoint in handling an non-streaming order by 
distinct query.\n */\nexport class NonStreamingOrderByDistinctEndpointComponent implements ExecutionContext {\n  /**\n 
  * A Map that holds the distinct values of the items before storing in priority queue.\n   */\n  private 
aggregateMap: NonStreamingOrderByMap<NonStreamingOrderByResult>;\n  /**\n   * A priority queue to compute the final 
sorted results.\n   */\n  private nonStreamingOrderByPQ: FixedSizePriorityQueue<NonStreamingOrderByResult>;\n  /**\n   
* Array to store the final sorted results.\n   */\n  private finalResultArray: NonStreamingOrderByResult[];\n\n  
private sortOrders: string[];\n  /**\n   * Flag to determine if all results are fetched from backend and results can 
be returned.\n   */\n  private isCompleted: boolean = false;\n\n  constructor(\n    private executionContext: 
ExecutionContext,\n    private queryInfo: QueryInfo,\n    private priorityQueueBufferSize: number,\n    private 
emitRawOrderByPayload: boolean = false,\n  ) {\n    this.sortOrders = this.queryInfo.orderBy;\n    const comparator = 
new OrderByComparator(this.sortOrders);\n    this.aggregateMap = new 
NonStreamingOrderByMap<NonStreamingOrderByResult>(\n      (a: NonStreamingOrderByResult, b: NonStreamingOrderByResult) 
=> {\n        return comparator.compareItems(a, b);\n      },\n    );\n    this.nonStreamingOrderByPQ = new 
FixedSizePriorityQueue<NonStreamingOrderByResult>(\n      (a: NonStreamingOrderByResult, b: NonStreamingOrderByResult) 
=> {\n        return comparator.compareItems(b, a);\n      },\n      this.priorityQueueBufferSize,\n    );\n  }\n\n  
/**\n   * Build final sorted result array from which responses will be served.\n   */\n  private async 
buildFinalResultArray(): Promise<void> {\n    // Fetch all distinct values from the map and store in priority queue.\n 
   const allValues = this.aggregateMap.getAllValuesAndReset();\n    for (const value of allValues) {\n      
this.nonStreamingOrderByPQ.enqueue(value);\n    }\n\n    // Compute the final result array size based on offset and 
limit.\n    const offSet = this.queryInfo.offset ? this.queryInfo.offset : 0;\n    const queueSize = 
this.nonStreamingOrderByPQ.size();\n    const finalArraySize = queueSize - offSet;\n\n    if (finalArraySize <= 0) {\n 
     this.finalResultArray = [];\n    } else {\n      this.finalResultArray = new Array(finalArraySize);\n      // 
Only keep the final result array size number of items in the final result array and discard the rest.\n      for (let 
count = finalArraySize - 1; count >= 0; count--) {\n        if (this.emitRawOrderByPayload) {\n          
this.finalResultArray[count] = this.nonStreamingOrderByPQ.dequeue();\n        } else {\n          
this.finalResultArray[count] = this.nonStreamingOrderByPQ.dequeue()?.payload;\n        }\n      }\n    }\n  }\n\n  
public hasMoreResults(): boolean {\n    if (this.priorityQueueBufferSize === 0) return false;\n    return 
this.executionContext.hasMoreResults();\n  }\n\n  public async fetchMore(diagnosticNode?: DiagnosticNodeInternal): 
Promise<Response<any>> {\n    if (this.isCompleted) {\n      return {\n        result: undefined,\n        headers: 
getInitialHeader(),\n      };\n    }\n    let resHeaders = getInitialHeader();\n    // if size is 0, just return 
undefined to signal to more results. Valid if query is TOP 0 or LIMIT 0\n    if (this.priorityQueueBufferSize <= 0) 
{\n      return {\n        result: undefined,\n        headers: resHeaders,\n      };\n    }\n\n    // If there are 
more results in backend, keep filling map.\n    if (this.executionContext.hasMoreResults()) {\n      // Grab the next 
result\n      const response = await this.executionContext.fetchMore(diagnosticNode);\n\n      if (!response) {\n      
  this.isCompleted = true;\n        if (this.aggregateMap.size() > 0) {\n          await 
this.buildFinalResultArray();\n          const result = createParallelQueryResult(this.finalResultArray, new Map(), 
{}, undefined);\n\n          return {\n            result,\n            headers: resHeaders,\n          };\n        
}\n        return { result: undefined, headers: resHeaders };\n      }\n\n      if (\n        response.result === 
undefined ||\n        !Array.isArray(response.result.buffer) ||\n        response.result.buffer.length === 0\n      ) 
{\n        this.isCompleted = true;\n        if (this.aggregateMap.size() > 0) {\n          await 
this.buildFinalResultArray();\n          const result = createParallelQueryResult(this.finalResultArray, new Map(), 
{}, undefined);\n\n          return {\n            result,\n            headers: response.headers,\n          };\n     
   }\n        return { result: undefined, headers: response.headers };\n      }\n      resHeaders = 
response.headers;\n\n      const parallelResult = response.result as ParallelQueryResult;\n      const dataToProcess: 
NonStreamingOrderByResult[] =\n        parallelResult.buffer as NonStreamingOrderByResult[];\n\n      for (const item 
of dataToProcess) {\n        if (item) {\n          const key = await hashObject(item?.payload);\n          
this.aggregateMap.set(key, item);\n        }\n      }\n\n      // return [] to signal that there are more results to 
fetch.\n      if (this.executionContext.hasMoreResults()) {\n        const result = createParallelQueryResult(\n       
   [], // empty buffer\n          new Map(),\n          undefined,\n          undefined,\n        );\n\n        return 
{\n          result,\n          headers: resHeaders,\n        };\n      }\n    }\n\n    // If all results are fetched 
from backend, prepare final results\n    if (!this.executionContext.hasMoreResults() && !this.isCompleted) {\n      
this.isCompleted = true;\n      await this.buildFinalResultArray();\n      const result = 
createParallelQueryResult(this.finalResultArray, new Map());\n\n      return {\n        result,\n        headers: 
resHeaders,\n      };\n    }\n    // Signal that there are no more results.\n    const result = 
createParallelQueryResult([], new Map());\n\n    return {\n      result,\n      headers: resHeaders,\n    };\n  
}\n}\n"]}
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
d.ts:34:    hasMoreResults(): boolean;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
d.ts:35:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
d.ts:36:     * Fetches the next batch of the result from the target container.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
d.ts:37:     * @param diagnosticNode - The diagnostic information for the request.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
d.ts:38:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
d.ts:39:    fetchMore(diagnosticNode?: DiagnosticNodeInternal): Promise<Response<any>>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
d.ts:40:    private buildFinalResultArray;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
d.ts:41:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
d.ts:42://# sourceMappingURL=NonStreamingOrderByEndpointComponent.d.ts.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:45:    hasMoreResults() {
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:46:        return this.priorityQueueBufferSize > 0 && this.executionContext.hasMoreResults();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:47:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:48:    /**
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:49:     * Fetches the next batch of the result from the target container.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:50:     * @param diagnosticNode - The diagnostic information for the request.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:51:     */
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:52:    async fetchMore(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:53:        if (this.isCompleted) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:54:            return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:55:                result: undefined,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:56:                headers: getInitialHeader(),
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:57:            };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:58:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:59:        let resHeaders = getInitialHeader();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:60:        // if size is 0, just return undefined to signal to more results. Valid if query is TOP 0 or LIMIT 0
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:61:        if (this.priorityQueueBufferSize <= 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:62:            return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:63:                result: undefined,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:64:                headers: resHeaders,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:65:            };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:66:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:67:        // If there are more results in backend, keep filling pq.
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:68:        if (this.executionContext.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:69:            const response = await this.executionContext.fetchMore(diagnosticNode);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:70:            if (!response) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:71:                this.isCompleted = true;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:72:                if (!this.nonStreamingOrderByPQ.isEmpty()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:73:                    return this.buildFinalResultArray(resHeaders);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:74:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:75:                return { result: undefined, headers: resHeaders };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:76:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:77:            resHeaders = response.headers;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:78:            if (response.result === undefined ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:79:                !response.result.buffer ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:80:                response.result.buffer.length === 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:81:                this.isCompleted = true;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:82:                if (!this.nonStreamingOrderByPQ.isEmpty()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:83:                    return this.buildFinalResultArray(resHeaders);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:84:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:85:                return { result: undefined, headers: resHeaders };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:86:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:87:            const parallelResult = response.result;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:88:            const dataToProcess = parallelResult.buffer;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:89:            for (const item of dataToProcess) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:90:                if (item !== undefined) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:91:                    this.nonStreamingOrderByPQ.enqueue(item);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:92:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:93:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:94:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:95:        // If the backend has more results to fetch, return [] to signal that there are more results to fetch.
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:96:        if (this.executionContext.hasMoreResults()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:97:            const result = createParallelQueryResult([], // empty buffer
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:98:            new Map(), {});
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:99:            return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:100:                result,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:101:                headers: resHeaders,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:102:            };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:103:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:104:        // If all results are fetched from backend, prepare final results
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:105:        if (!this.executionContext.hasMoreResults() && !this.isCompleted) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:106:            this.isCompleted = true;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:107:            return this.buildFinalResultArray(resHeaders, new Map(), {});
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:108:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:109:        // If pq is empty, return undefined to signal that there are no more results.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:110:        const result = createParallelQueryResult([], new Map(), {});
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:111:        return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:112:            result,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:113:            headers: resHeaders,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:114:        };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:115:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:116:    async buildFinalResultArray(resHeaders, partitionKeyRangeMap, updatedContinuationRanges) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:117:        // Set isCompleted to true.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:118:        this.isCompleted = true;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:119:        // Reverse the priority queue to get the results in the correct order
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:120:        this.nonStreamingOrderByPQ = this.nonStreamingOrderByPQ.reverse();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:121:        // For offset limit case we set the size of priority queue to offset + limit
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:122:        // and we drain offset number of items from the priority queue
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:123:        while (this.offset < this.priorityQueueBufferSize &&
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:124:            this.offset > 0 &&
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:125:            !this.nonStreamingOrderByPQ.isEmpty()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:126:            this.nonStreamingOrderByPQ.dequeue();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:127:            this.offset--;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:128:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:129:        // If pq is not empty, return the result from pq.
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:130:        if (!this.nonStreamingOrderByPQ.isEmpty()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:131:            const buffer = [];
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:132:            if (this.emitRawOrderByPayload) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:133:                while (!this.nonStreamingOrderByPQ.isEmpty()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:134:                    buffer.push(this.nonStreamingOrderByPQ.dequeue());
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:135:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:136:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:137:            else {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:138:                while (!this.nonStreamingOrderByPQ.isEmpty()) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:139:                    buffer.push(this.nonStreamingOrderByPQ.dequeue()?.payload);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:140:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:141:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:142:            const result = createParallelQueryResult(buffer, partitionKeyRangeMap || new Map(), 
updatedContinuationRanges || {}, undefined);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:143:            return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:144:                result,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js:145:                headers: resHeaders,
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\NonStreamingOrderByEndpointComponent.
js.map:1:{"version":3,"file":"NonStreamingOrderByEndpointComponent.js","sourceRoot":"","sources":["../../../../src/quer
yExecutionContext/EndpointComponent/NonStreamingOrderByEndpointComponent.ts"],"names":[],"mappings":"AAKA,OAAO,EAAE,iBA
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
IACH,CAAC;CACF","sourcesContent":["// Copyright (c) Microsoft Corporation.\n// Licensed under the MIT License.\nimport 
type { DiagnosticNodeInternal } from \"../../diagnostics/DiagnosticNodeInternal.js\";\nimport type { Response } from 
\"../../request/index.js\";\nimport type { ExecutionContext } from \"../ExecutionContext.js\";\nimport { 
OrderByComparator } from \"../orderByComparator.js\";\nimport type { NonStreamingOrderByResult } from 
\"../nonStreamingOrderByResult.js\";\nimport { FixedSizePriorityQueue } from 
\"../../utils/fixedSizePriorityQueue.js\";\nimport type { CosmosHeaders } from \"../headerUtils.js\";\nimport { 
getInitialHeader } from \"../headerUtils.js\";\nimport type { QueryRangeMapping } from 
\"../queryRangeMapping.js\";\nimport type { ParallelQueryResult } from \"../parallelQueryResult.js\";\nimport { 
createParallelQueryResult } from \"../parallelQueryResult.js\";\n\n/**\n * @hidden\n * Represents an endpoint in 
handling an non-streaming order by query.\n */\nexport class NonStreamingOrderByEndpointComponent implements 
ExecutionContext {\n  /**\n   * A priority queue to store the final sorted results.\n   */\n  private 
nonStreamingOrderByPQ: FixedSizePriorityQueue<NonStreamingOrderByResult>;\n  /**\n   * Flag to determine if all 
results are fetched from backend and results can be returned from priority queue.\n   */\n  private isCompleted: 
boolean = false;\n  /**\n   * Represents an endpoint in handling an non-streaming order by query. For each processed 
orderby\n   * result it returns 'payload' item of the result\n   *\n   * @param executionContext - Underlying 
Execution Context\n   * @hidden\n   */\n  constructor(\n    private executionContext: ExecutionContext,\n    private 
sortOrders: any[],\n    private priorityQueueBufferSize: number,\n    private offset: number = 0,\n    private 
emitRawOrderByPayload: boolean = false,\n  ) {\n    const comparator = new OrderByComparator(this.sortOrders);\n    
this.nonStreamingOrderByPQ = new FixedSizePriorityQueue<NonStreamingOrderByResult>(\n      (a: 
NonStreamingOrderByResult, b: NonStreamingOrderByResult) => {\n        return comparator.compareItems(b, a);\n      
},\n      this.priorityQueueBufferSize,\n    );\n  }\n\n  /**\n   * Determine if there are still remaining resources 
to processs.\n   * @returns true if there is other elements to process in the NonStreamingOrderByEndpointComponent.\n  
 */\n  public hasMoreResults(): boolean {\n    return this.priorityQueueBufferSize > 0 && 
this.executionContext.hasMoreResults();\n  }\n\n  /**\n   * Fetches the next batch of the result from the target 
container.\n   * @param diagnosticNode - The diagnostic information for the request.\n   */\n  public async 
fetchMore(diagnosticNode?: DiagnosticNodeInternal): Promise<Response<any>> {\n    if (this.isCompleted) {\n      
return {\n        result: undefined,\n        headers: getInitialHeader(),\n      };\n    }\n    let resHeaders = 
getInitialHeader();\n\n    // if size is 0, just return undefined to signal to more results. Valid if query is TOP 0 
or LIMIT 0\n    if (this.priorityQueueBufferSize <= 0) {\n      return {\n        result: undefined,\n        headers: 
resHeaders,\n      };\n    }\n    // If there are more results in backend, keep filling pq.\n    if 
(this.executionContext.hasMoreResults()) {\n      const response = await 
this.executionContext.fetchMore(diagnosticNode);\n\n      if (!response) {\n        this.isCompleted = true;\n        
if (!this.nonStreamingOrderByPQ.isEmpty()) {\n          return this.buildFinalResultArray(resHeaders);\n        }\n    
    return { result: undefined, headers: resHeaders };\n      }\n\n      resHeaders = response.headers;\n      if (\n  
      response.result === undefined ||\n        !response.result.buffer ||\n        response.result.buffer.length === 
0\n      ) {\n        this.isCompleted = true;\n        if (!this.nonStreamingOrderByPQ.isEmpty()) {\n          return 
this.buildFinalResultArray(resHeaders);\n        }\n        return { result: undefined, headers: resHeaders };\n      
}\n\n      const parallelResult = response.result as ParallelQueryResult;\n      const dataToProcess: 
NonStreamingOrderByResult[] =\n        parallelResult.buffer as NonStreamingOrderByResult[];\n\n      for (const item 
of dataToProcess) {\n        if (item !== undefined) {\n          this.nonStreamingOrderByPQ.enqueue(item);\n        
}\n      }\n    }\n\n    // If the backend has more results to fetch, return [] to signal that there are more results 
to fetch.\n    if (this.executionContext.hasMoreResults()) {\n      const result = createParallelQueryResult(\n        
[], // empty buffer\n        new Map(),\n        {},\n      );\n\n      return {\n        result,\n        headers: 
resHeaders,\n      };\n    }\n\n    // If all results are fetched from backend, prepare final results\n    if 
(!this.executionContext.hasMoreResults() && !this.isCompleted) {\n      this.isCompleted = true;\n      return 
this.buildFinalResultArray(resHeaders, new Map(), {});\n    }\n\n    // If pq is empty, return undefined to signal 
that there are no more results.\n    const result = createParallelQueryResult([], new Map(), {});\n\n    return {\n    
  result,\n      headers: resHeaders,\n    };\n  }\n\n  private async buildFinalResultArray(\n    resHeaders: 
CosmosHeaders,\n    partitionKeyRangeMap?: Map<string, QueryRangeMapping>,\n    updatedContinuationRanges?: 
Record<string, any>,\n  ): Promise<Response<any>> {\n    // Set isCompleted to true.\n    this.isCompleted = true;\n   
 // Reverse the priority queue to get the results in the correct order\n    this.nonStreamingOrderByPQ = 
this.nonStreamingOrderByPQ.reverse();\n    // For offset limit case we set the size of priority queue to offset + 
limit\n    // and we drain offset number of items from the priority queue\n    while (\n      this.offset < 
this.priorityQueueBufferSize &&\n      this.offset > 0 &&\n      !this.nonStreamingOrderByPQ.isEmpty()\n    ) {\n      
this.nonStreamingOrderByPQ.dequeue();\n      this.offset--;\n    }\n\n    // If pq is not empty, return the result 
from pq.\n    if (!this.nonStreamingOrderByPQ.isEmpty()) {\n      const buffer: any[] = [];\n      if 
(this.emitRawOrderByPayload) {\n        while (!this.nonStreamingOrderByPQ.isEmpty()) {\n          
buffer.push(this.nonStreamingOrderByPQ.dequeue());\n        }\n      } else {\n        while 
(!this.nonStreamingOrderByPQ.isEmpty()) {\n          buffer.push(this.nonStreamingOrderByPQ.dequeue()?.payload);\n     
   }\n      }\n      const result = createParallelQueryResult(\n        buffer,\n        partitionKeyRangeMap || new 
Map(),\n        updatedContinuationRanges || {},\n        undefined,\n      );\n\n      return {\n        result,\n    
    headers: resHeaders,\n      };\n    }\n  }\n}\n"]}
> 
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.d.ts:10:  
  hasMoreResults(): boolean;
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.d.ts:11:  
  fetchMore(diagnosticNode?: DiagnosticNodeInternal): Promise<Response<any>>;
  
api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.d.ts:12:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.d.ts:13:
//# sourceMappingURL=OffsetLimitEndpointComponent.d.ts.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:14:  
  hasMoreResults() {
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:15:  
      return (this.offset > 0 || this.limit > 0) && this.executionContext.hasMoreResults();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:16:  
  }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:17:  
  async fetchMore(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:18:  
      const aggregateHeaders = getInitialHeader();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:19:  
      const buffer = [];
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:20:  
      const response = await this.executionContext.fetchMore(diagnosticNode);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:21:  
      if (!response) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:22:  
          return { result: undefined, headers: aggregateHeaders };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:23:  
      }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:24:  
      mergeHeaders(aggregateHeaders, response.headers);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:25:  
      if (response.result === undefined ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:26:  
          !Array.isArray(response.result.buffer) ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:27:  
          response.result.buffer.length === 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:28:  
          return { result: response.result, headers: response.headers };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:29:  
      }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:30:  
      const parallelResult = response.result;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:31:  
      const dataToProcess = parallelResult.buffer;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:32:  
      const partitionKeyRangeMap = parallelResult.partitionKeyRangeMap;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:33:  
      const updatedContinuationRanges = parallelResult.updatedContinuationRanges;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:34:  
      const orderByItems = parallelResult.orderByItems;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:35:  
      const initialOffset = this.offset;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:36:  
      const initialLimit = this.limit;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:37:  
      const filteredOrderByItems = [];
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:38:  
      let itemIndex = 0;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:39:  
      for (const item of dataToProcess) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:40:  
          if (this.offset > 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:41:  
              this.offset--;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:42:  
              // Skip this item AND its corresponding orderByItems entry
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:43:  
          }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:44:  
          else if (this.limit > 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:45:  
              buffer.push(item);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:46:  
              // Include the corresponding orderByItems entry
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:47:  
              if (orderByItems && itemIndex < orderByItems.length) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:48:  
                  filteredOrderByItems.push(orderByItems[itemIndex]);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:49:  
              }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:50:  
              this.limit--;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:51:  
          }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:52:  
          itemIndex++;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:53:  
      }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:54:  
      // Process offset/limit logic and update partition key range map
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js:55:  
      // Note: Pass initial offset/limit values (not current state) to calculateOffsetLimitForPartitionRanges
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OffsetLimitEndpointComponent.js.map:1
:{"version":3,"file":"OffsetLimitEndpointComponent.js","sourceRoot":"","sources":["../../../../src/queryExecutionContex
t/EndpointComponent/OffsetLimitEndpointComponent.ts"],"names":[],"mappings":"AAKA,OAAO,EAAE,gBAAgB,EAAE,YAAY,EAAE,MAAM,
mBAAmB,CAAC;AAEnE,OAAO,EAAE,yBAAyB,EAAE,MAAM,2BAA2B,CAAC;AACtE,OAAO,EAAE,sCAAsC,EAAE,MAAM,2BAA2B,CAAC;AAEnF,cAAc;AACd,M
AAM,OAAO,4BAA4B;IAE7B;IACA;IACA;IAHV,YACU,gBAAkC,EAClC,MAAc,EACd,KAAa;QAFb,qBAAgB,GAAhB,gBAAgB,CAAkB;QAClC,WAAM,GAAN,MA
AM,CAAQ;QACd,UAAK,GAAL,KAAK,CAAQ;IACpB,CAAC;IAEG,cAAc;QACnB,OAAO,CAAC,IAAI,CAAC,MAAM,GAAG,CAAC,IAAI,IAAI,CAAC,KAAK,GAAG
,CAAC,CAAC,IAAI,IAAI,CAAC,gBAAgB,CAAC,cAAc,EAAE,CAAC;IACvF,CAAC;IAEM,KAAK,CAAC,SAAS,CAAC,cAAuC;QAC5D,MAAM,gBAAgB,GAAG,g
BAAgB,EAAE,CAAC;QAC5C,MAAM,MAAM,GAAU,EAAE,CAAC;QACzB,MAAM,QAAQ,GAAG,MAAM,IAAI,CAAC,gBAAgB,CAAC,SAAS,CAAC,cAAc,CAAC,CAAC
;QACvE,IAAI,CAAC,QAAQ,EAAE,CAAC;YACd,OAAO,EAAE,MAAM,EAAE,SAAS,EAAE,OAAO,EAAE,gBAAgB,EAAE,CAAC;QAC1D,CAAC;QACD,YAAY,CAAC
,gBAAgB,EAAE,QAAQ,CAAC,OAAO,CAAC,CAAC;QACjD,IACE,QAAQ,CAAC,MAAM,KAAK,SAAS;YAC7B,CAAC,KAAK,CAAC,OAAO,CAAC,QAAQ,CAAC,MAAM
,CAAC,MAAM,CAAC;YACtC,QAAQ,CAAC,MAAM,CAAC,MAAM,CAAC,MAAM,KAAK,CAAC,EACnC,CAAC;YACD,OAAO,EAAE,MAAM,EAAE,QAAQ,CAAC,MAAM,E
AAE,OAAO,EAAE,QAAQ,CAAC,OAAO,EAAE,CAAC;QAChE,CAAC;QAED,MAAM,cAAc,GAAG,QAAQ,CAAC,MAA6B,CAAC;QAC9D,MAAM,aAAa,GAAU,cAAc,CA
AC,MAAM,CAAC;QACnD,MAAM,oBAAoB,GAAG,cAAc,CAAC,oBAAoB,CAAC;QACjE,MAAM,yBAAyB,GAAG,cAAc,CAAC,yBAAyB,CAAC;QAC3E,MAAM,YAAY,
GAAG,cAAc,CAAC,YAAY,CAAC;QAEjD,MAAM,aAAa,GAAG,IAAI,CAAC,MAAM,CAAC;QAClC,MAAM,YAAY,GAAG,IAAI,CAAC,KAAK,CAAC;QAEhC,MAAM,o
BAAoB,GAAU,EAAE,CAAC;QACvC,IAAI,SAAS,GAAG,CAAC,CAAC;QAElB,KAAK,MAAM,IAAI,IAAI,aAAa,EAAE,CAAC;YACjC,IAAI,IAAI,CAAC,MAAM,
GAAG,CAAC,EAAE,CAAC;gBACpB,IAAI,CAAC,MAAM,EAAE,CAAC;gBACd,0DAA0D;YAC5D,CAAC;iBAAM,IAAI,IAAI,CAAC,KAAK,GAAG,CAAC,EAAE,CA
AC;gBAC1B,MAAM,CAAC,IAAI,CAAC,IAAI,CAAC,CAAC;gBAClB,+CAA+C;gBAC/C,IAAI,YAAY,IAAI,SAAS,GAAG,YAAY,CAAC,MAAM,EAAE,CAAC;oBA
CpD,oBAAoB,CAAC,IAAI,CAAC,YAAY,CAAC,SAAS,CAAC,CAAC,CAAC;gBACrD,CAAC;gBACD,IAAI,CAAC,KAAK,EAAE,CAAC;YACf,CAAC;YACD,SAAS,
EAAE,CAAC;QACd,CAAC;QAED,gEAAgE;QAChE,uGAAuG;QACvG,4FAA4F;QAC5F,MAAM,2BAA2B,GAAG,sCAAsC,CACxE,oBAAoB,EACpB,aAAa,EACb,YA
AY,CACb,CAAC;QAEF,gEAAgE;QAChE,MAAM,MAAM,GAAG,yBAAyB,CACtC,MAAM,EACN,2BAA2B,EAC3B,yBAAyB,EACzB,oBAAoB,CAAC,MAAM,GAAG,CA
AC,CAAC,CAAC,CAAC,oBAAoB,CAAC,CAAC,CAAC,SAAS,CACnE,CAAC;QAEF,OAAO;YACL,MAAM;YACN,OAAO,EAAE,gBAAgB;SAC1B,CAAC;IACJ,CAAC;
CACF","sourcesContent":["// Copyright (c) Microsoft Corporation.\n// Licensed under the MIT License.\nimport type { 
DiagnosticNodeInternal } from \"../../diagnostics/DiagnosticNodeInternal.js\";\nimport type { Response } from 
\"../../request/index.js\";\nimport type { ExecutionContext } from \"../ExecutionContext.js\";\nimport { 
getInitialHeader, mergeHeaders } from \"../headerUtils.js\";\nimport type { ParallelQueryResult } from 
\"../parallelQueryResult.js\";\nimport { createParallelQueryResult } from \"../parallelQueryResult.js\";\nimport { 
calculateOffsetLimitForPartitionRanges } from \"../PartitionRangeUtils.js\";\n\n/** @hidden */\nexport class 
OffsetLimitEndpointComponent implements ExecutionContext {\n  constructor(\n    private executionContext: 
ExecutionContext,\n    private offset: number,\n    private limit: number,\n  ) {}\n\n  public hasMoreResults(): 
boolean {\n    return (this.offset > 0 || this.limit > 0) && this.executionContext.hasMoreResults();\n  }\n\n  public 
async fetchMore(diagnosticNode?: DiagnosticNodeInternal): Promise<Response<any>> {\n    const aggregateHeaders = 
getInitialHeader();\n    const buffer: any[] = [];\n    const response = await 
this.executionContext.fetchMore(diagnosticNode);\n    if (!response) {\n      return { result: undefined, headers: 
aggregateHeaders };\n    }\n    mergeHeaders(aggregateHeaders, response.headers);\n    if (\n      response.result === 
undefined ||\n      !Array.isArray(response.result.buffer) ||\n      response.result.buffer.length === 0\n    ) {\n    
  return { result: response.result, headers: response.headers };\n    }\n\n    const parallelResult = response.result 
as ParallelQueryResult;\n    const dataToProcess: any[] = parallelResult.buffer;\n    const partitionKeyRangeMap = 
parallelResult.partitionKeyRangeMap;\n    const updatedContinuationRanges = 
parallelResult.updatedContinuationRanges;\n    const orderByItems = parallelResult.orderByItems;\n\n    const 
initialOffset = this.offset;\n    const initialLimit = this.limit;\n\n    const filteredOrderByItems: any[] = [];\n    
let itemIndex = 0;\n\n    for (const item of dataToProcess) {\n      if (this.offset > 0) {\n        this.offset--;\n  
      // Skip this item AND its corresponding orderByItems entry\n      } else if (this.limit > 0) {\n        
buffer.push(item);\n        // Include the corresponding orderByItems entry\n        if (orderByItems && itemIndex < 
orderByItems.length) {\n          filteredOrderByItems.push(orderByItems[itemIndex]);\n        }\n        
this.limit--;\n      }\n      itemIndex++;\n    }\n\n    // Process offset/limit logic and update partition key range 
map\n    // Note: Pass initial offset/limit values (not current state) to calculateOffsetLimitForPartitionRanges\n    
// This function updates partition metadata while the loop above processes actual data items\n    const 
updatedPartitionKeyRangeMap = calculateOffsetLimitForPartitionRanges(\n      partitionKeyRangeMap,\n      
initialOffset,\n      initialLimit,\n    );\n\n    // Return in the new structure format using the utility function\n  
  const result = createParallelQueryResult(\n      buffer,\n      updatedPartitionKeyRangeMap,\n      
updatedContinuationRanges,\n      filteredOrderByItems.length > 0 ? filteredOrderByItems : undefined,\n    );\n\n    
return {\n      result,\n      headers: aggregateHeaders,\n    };\n  }\n}\n"]}
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.d.ts:21:    
hasMoreResults(): boolean;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.d.ts:22:    
fetchMore(diagnosticNode?: DiagnosticNodeInternal): Promise<Response<any>>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.d.ts:23:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.d.ts:24://# 
sourceMappingURL=OrderByEndpointComponent.d.ts.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:22:    
hasMoreResults() {
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:23:      
  return this.executionContext.hasMoreResults();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:24:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:25:    
async fetchMore(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:26:      
  const buffer = [];
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:27:      
  const orderByItemsArray = []; // Store order by items for each item
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:28:      
  const response = await this.executionContext.fetchMore(diagnosticNode);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:29:      
  if (!response ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:30:      
      !response.result ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:31:      
      !Array.isArray(response.result.buffer) ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:32:      
      response.result.buffer.length === 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:33:      
      // Preserve the partitionKeyRangeMap and updatedContinuationRanges from the original response
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:34:      
      // even when the buffer is empty, as they contain continuation token information
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:35:      
      const originalResult = response?.result;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:36:      
      const result = createParallelQueryResult([], originalResult?.partitionKeyRangeMap || new Map(), 
originalResult?.updatedContinuationRanges || {}, []);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:37:      
      return { result, headers: response?.headers };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:38:      
  }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:39:      
  const parallelResult = response.result;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:40:      
  const rawBuffer = parallelResult.buffer;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:41:      
  const partitionKeyRangeMap = parallelResult.partitionKeyRangeMap;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:42:      
  const updatedContinuationRanges = parallelResult.updatedContinuationRanges;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:43:      
  // Process buffer items and collect order by items for each item
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:44:      
  for (let i = 0; i < rawBuffer.length; i++) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:45:      
      const item = rawBuffer[i];
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:46:      
      if (this.emitRawOrderByPayload) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:47:      
          buffer.push(item);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:48:      
      }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:49:      
      else {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:50:      
          buffer.push(item.payload);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:51:      
      }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:52:      
      orderByItemsArray.push({ orderByItems: item.orderByItems, _rid: item._rid });
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:53:      
  }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:54:      
  const result = createParallelQueryResult(buffer, partitionKeyRangeMap, updatedContinuationRanges, orderByItemsArray);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:55:      
  return { result, headers: response.headers };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:56:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:57:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js:58://# 
sourceMappingURL=OrderByEndpointComponent.js.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderByEndpointComponent.js.map:1:{"v
ersion":3,"file":"OrderByEndpointComponent.js","sourceRoot":"","sources":["../../../../src/queryExecutionContext/Endpoi
ntComponent/OrderByEndpointComponent.ts"],"names":[],"mappings":"AAMA,OAAO,EAAE,yBAAyB,EAAE,MAAM,2BAA2B,CAAC;AAGtE,cAAc
;AACd,MAAM,OAAO,wBAAwB;IAUzB;IACA;IAVV;;;;;;;OAOG;IACH,YACU,gBAAkC,EAClC,wBAAiC,KAAK;QADtC,qBAAgB,GAAhB,gBAAgB,CAAkB;QA
ClC,0BAAqB,GAArB,qBAAqB,CAAiB;IAC7C,CAAC;IACJ;;;OAGG;IACI,cAAc;QACnB,OAAO,IAAI,CAAC,gBAAgB,CAAC,cAAc,EAAE,CAAC;IAChD,CA
AC;IAEM,KAAK,CAAC,SAAS,CAAC,cAAuC;QAC5D,MAAM,MAAM,GAAU,EAAE,CAAC;QACzB,MAAM,iBAAiB,GAAyB,EAAE,CAAC,CAAC,qCAAqC;QAEzF,MA
AM,QAAQ,GAAG,MAAM,IAAI,CAAC,gBAAgB,CAAC,SAAS,CAAC,cAAc,CAAC,CAAC;QACvE,IACE,CAAC,QAAQ;YACT,CAAC,QAAQ,CAAC,MAAM;YAChB,CA
AC,KAAK,CAAC,OAAO,CAAC,QAAQ,CAAC,MAAM,CAAC,MAAM,CAAC;YACtC,QAAQ,CAAC,MAAM,CAAC,MAAM,CAAC,MAAM,KAAK,CAAC,EACnC,CAAC;YACD
,6FAA6F;YAC7F,gFAAgF;YAChF,MAAM,cAAc,GAAG,QAAQ,EAAE,MAA6B,CAAC;YAC/D,MAAM,MAAM,GAAG,yBAAyB,CACtC,EAAE,EACF,cAAc,EAAE,oB
AAoB,IAAI,IAAI,GAAG,EAAE,EACjD,cAAc,EAAE,yBAAyB,IAAI,EAAE,EAC/C,EAAE,CACH,CAAC;YACF,OAAO,EAAE,MAAM,EAAE,OAAO,EAAE,QAAQ,
EAAE,OAAO,EAAE,CAAC;QAChD,CAAC;QAED,MAAM,cAAc,GAAG,QAAQ,CAAC,MAA6B,CAAC;QAC9D,MAAM,SAAS,GAAG,cAAc,CAAC,MAAM,CAAC;QACxC,
MAAM,oBAAoB,GAAG,cAAc,CAAC,oBAAoB,CAAC;QACjE,MAAM,yBAAyB,GAAG,cAAc,CAAC,yBAAyB,CAAC;QAE3E,gEAAgE;QAChE,KAAK,IAAI,CAAC,G
AAG,CAAC,EAAE,CAAC,GAAG,SAAS,CAAC,MAAM,EAAE,CAAC,EAAE,EAAE,CAAC;YAC1C,MAAM,IAAI,GAAG,SAAS,CAAC,CAAC,CAAC,CAAC;YAC1B,IAA
I,IAAI,CAAC,qBAAqB,EAAE,CAAC;gBAC/B,MAAM,CAAC,IAAI,CAAC,IAAI,CAAC,CAAC;YACpB,CAAC;iBAAM,CAAC;gBACN,MAAM,CAAC,IAAI,CAAC,
IAAI,CAAC,OAAO,CAAC,CAAC;YAC5B,CAAC;YACD,iBAAiB,CAAC,IAAI,CAAC,EAAE,YAAY,EAAE,IAAI,CAAC,YAAY,EAAE,IAAI,EAAE,IAAI,CAAC,I
AAI,EAAE,CAAC,CAAC;QAC/E,CAAC;QAED,MAAM,MAAM,GAAG,yBAAyB,CACtC,MAAM,EACN,oBAAoB,EACpB,yBAAyB,EACzB,iBAAiB,CAClB,CAAC;QA
EF,OAAO,EAAE,MAAM,EAAE,OAAO,EAAE,QAAQ,CAAC,OAAO,EAAE,CAAC;IAC/C,CAAC;CACF","sourcesContent":["// Copyright (c) 
Microsoft Corporation.\n// Licensed under the MIT License.\nimport type { DiagnosticNodeInternal } from 
\"../../diagnostics/DiagnosticNodeInternal.js\";\nimport type { Response } from \"../../request/index.js\";\nimport 
type { ExecutionContext } from \"../ExecutionContext.js\";\nimport type { ParallelQueryResult } from 
\"../parallelQueryResult.js\";\nimport { createParallelQueryResult } from \"../parallelQueryResult.js\";\nimport type 
{ OrderByItemWithRid } from \"../parallelQueryResult.js\";\n\n/** @hidden */\nexport class OrderByEndpointComponent 
implements ExecutionContext {\n  /**\n   * Represents an endpoint in handling an order by query. For each processed 
orderby\n   * result it returns 'payload' item of the result\n   *\n   * @param executionContext - Underlying 
Execution Context\n   * @param emitRawOrderByPayload - Whether to emit raw order by payload\n   * @hidden\n   */\n  
constructor(\n    private executionContext: ExecutionContext,\n    private emitRawOrderByPayload: boolean = false,\n  
) {}\n  /**\n   * Determine if there are still remaining resources to processs.\n   * @returns true if there is other 
elements to process in the OrderByEndpointComponent.\n   */\n  public hasMoreResults(): boolean {\n    return 
this.executionContext.hasMoreResults();\n  }\n\n  public async fetchMore(diagnosticNode?: DiagnosticNodeInternal): 
Promise<Response<any>> {\n    const buffer: any[] = [];\n    const orderByItemsArray: OrderByItemWithRid[] = []; // 
Store order by items for each item\n\n    const response = await this.executionContext.fetchMore(diagnosticNode);\n    
if (\n      !response ||\n      !response.result ||\n      !Array.isArray(response.result.buffer) ||\n      
response.result.buffer.length === 0\n    ) {\n      // Preserve the partitionKeyRangeMap and updatedContinuationRanges 
from the original response\n      // even when the buffer is empty, as they contain continuation token information\n   
   const originalResult = response?.result as ParallelQueryResult;\n      const result = createParallelQueryResult(\n  
      [],\n        originalResult?.partitionKeyRangeMap || new Map(),\n        
originalResult?.updatedContinuationRanges || {},\n        [],\n      );\n      return { result, headers: 
response?.headers };\n    }\n\n    const parallelResult = response.result as ParallelQueryResult;\n    const rawBuffer 
= parallelResult.buffer;\n    const partitionKeyRangeMap = parallelResult.partitionKeyRangeMap;\n    const 
updatedContinuationRanges = parallelResult.updatedContinuationRanges;\n\n    // Process buffer items and collect order 
by items for each item\n    for (let i = 0; i < rawBuffer.length; i++) {\n      const item = rawBuffer[i];\n      if 
(this.emitRawOrderByPayload) {\n        buffer.push(item);\n      } else {\n        buffer.push(item.payload);\n      
}\n      orderByItemsArray.push({ orderByItems: item.orderByItems, _rid: item._rid });\n    }\n\n    const result = 
createParallelQueryResult(\n      buffer,\n      partitionKeyRangeMap,\n      updatedContinuationRanges,\n      
orderByItemsArray,\n    );\n\n    return { result, headers: response.headers };\n  }\n}\n"]}
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.d.ts
:9:    hasMoreResults(): boolean;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.d.ts
:10:    fetchMore(diagnosticNode?: DiagnosticNodeInternal): Promise<Response<any>>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.d.ts
:11:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.d.ts
:12://# sourceMappingURL=OrderedDistinctEndpointComponent.d.ts.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:1
2:    hasMoreResults() {
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:1
3:        return this.executionContext.hasMoreResults();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:1
4:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:1
5:    async fetchMore(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:1
6:        const buffer = [];
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:1
7:        const response = await this.executionContext.fetchMore(diagnosticNode);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:1
8:        if (!response ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:1
9:            !response.result ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:2
0:            !Array.isArray(response.result.buffer) ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:2
1:            response.result.buffer.length === 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:2
2:            return { result: response.result, headers: response.headers };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:2
3:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:2
4:        const parallelResult = response.result;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:2
5:        const dataToProcess = parallelResult.buffer;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:2
6:        const partitionKeyRangeMap = parallelResult.partitionKeyRangeMap;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:2
7:        const updatedContinuationRanges = parallelResult.updatedContinuationRanges;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:2
8:        const orderByItems = parallelResult.orderByItems;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:2
9:        // Process each item and maintain hashedLastResult for distinct filtering
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:3
0:        for (const item of dataToProcess) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:3
1:            if (item) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:3
2:                const hashedResult = await hashObject(item);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:3
3:                if (hashedResult !== this.hashedLastResult) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:3
4:                    buffer.push(item);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:3
5:                    this.hashedLastResult = hashedResult;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:3
6:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:3
7:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:3
8:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:3
9:        // Process distinct query logic and update partition key range map with hashedLastResult
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:4
0:        const updatedPartitionKeyRangeMap = await processDistinctQueryAndUpdateRangeMap(dataToProcess, 
partitionKeyRangeMap, hashObject);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:4
1:        // Return in the new structure format using the utility function
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:4
2:        const result = createParallelQueryResult(buffer, updatedPartitionKeyRangeMap, updatedContinuationRanges, 
orderByItems);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:4
3:        return {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:4
4:            result,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:4
5:            headers: response.headers,
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:4
6:        };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:4
7:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:4
8:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js:4
9://# sourceMappingURL=OrderedDistinctEndpointComponent.js.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\OrderedDistinctEndpointComponent.js.m
ap:1:{"version":3,"file":"OrderedDistinctEndpointComponent.js","sourceRoot":"","sources":["../../../../src/queryExecuti
onContext/EndpointComponent/OrderedDistinctEndpointComponent.ts"],"names":[],"mappings":"AAIA,OAAO,EAAE,UAAU,EAAE,MAAM,
2BAA2B,CAAC;AAEvD,OAAO,EAAE,yBAAyB,EAA4B,MAAM,2BAA2B,CAAC;AAChG,OAAO,EAAE,qCAAqC,EAAE,MAAM,2BAA2B,CAAC;AAElF,cAAc;AACd,
MAAM,OAAO,gCAAgC;IAIjC;IAHF,gBAAgB,CAAS;IAEjC,YACU,gBAAkC,EAC1C,gBAAyB;QADjB,qBAAgB,GAAhB,gBAAgB,CAAkB;QAG1C,IAAI,CAAC,
gBAAgB,GAAG,gBAAgB,CAAC;IAC3C,CAAC;IAEM,cAAc;QACnB,OAAO,IAAI,CAAC,gBAAgB,CAAC,cAAc,EAAE,CAAC;IAChD,CAAC;IAEM,KAAK,CAAC,
SAAS,CAAC,cAAuC;QAC5D,MAAM,MAAM,GAAU,EAAE,CAAC;QACzB,MAAM,QAAQ,GAAG,MAAM,IAAI,CAAC,gBAAgB,CAAC,SAAS,CAAC,cAAc,CAAC,CAAC
;QACvE,IACE,CAAC,QAAQ;YACT,CAAC,QAAQ,CAAC,MAAM;YAChB,CAAC,KAAK,CAAC,OAAO,CAAC,QAAQ,CAAC,MAAM,CAAC,MAAM,CAAC;YACtC,QAAQ,
CAAC,MAAM,CAAC,MAAM,CAAC,MAAM,KAAK,CAAC,EACnC,CAAC;YACD,OAAO,EAAE,MAAM,EAAE,QAAQ,CAAC,MAAM,EAAE,OAAO,EAAE,QAAQ,CAAC,OAA
O,EAAE,CAAC;QAChE,CAAC;QAED,MAAM,cAAc,GAAG,QAAQ,CAAC,MAA6B,CAAC;QAC9D,MAAM,aAAa,GAAU,cAAc,CAAC,MAAM,CAAC;QACnD,MAAM,oBA
AoB,GAAG,cAAc,CAAC,oBAAoB,CAAC;QACjE,MAAM,yBAAyB,GAAG,cAAc,CAAC,yBAAyB,CAAC;QAC3E,MAAM,YAAY,GAAG,cAAc,CAAC,YAAY,CAAC;QA
EjD,yEAAyE;QACzE,KAAK,MAAM,IAAI,IAAI,aAAa,EAAE,CAAC;YACjC,IAAI,IAAI,EAAE,CAAC;gBACT,MAAM,YAAY,GAAG,MAAM,UAAU,CAAC,IAAI,
CAAC,CAAC;gBAC5C,IAAI,YAAY,KAAK,IAAI,CAAC,gBAAgB,EAAE,CAAC;oBAC3C,MAAM,CAAC,IAAI,CAAC,IAAI,CAAC,CAAC;oBAClB,IAAI,CAAC,g
BAAgB,GAAG,YAAY,CAAC;gBACvC,CAAC;YACH,CAAC;QACH,CAAC;QAED,wFAAwF;QACxF,MAAM,2BAA2B,GAAG,MAAM,qCAAqC,CAC7E,aAAa,EACb,oBA
AoB,EACpB,UAAU,CACX,CAAC;QAEF,gEAAgE;QAChE,MAAM,MAAM,GAAG,yBAAyB,CACtC,MAAM,EACN,2BAA2B,EAC3B,yBAAyB,EACzB,YAAY,CACb,CA
AC;QAEF,OAAO;YACL,MAAM;YACN,OAAO,EAAE,QAAQ,CAAC,OAAO;SAC1B,CAAC;IACJ,CAAC;CACF","sourcesContent":["// Copyright (c) 
Microsoft Corporation.\n// Licensed under the MIT License.\nimport type { Response } from 
\"../../request/index.js\";\nimport type { ExecutionContext } from \"../ExecutionContext.js\";\nimport { hashObject } 
from \"../../utils/hashObject.js\";\nimport type { DiagnosticNodeInternal } from 
\"../../diagnostics/DiagnosticNodeInternal.js\";\nimport { createParallelQueryResult, type ParallelQueryResult } from 
\"../parallelQueryResult.js\";\nimport { processDistinctQueryAndUpdateRangeMap } from 
\"../PartitionRangeUtils.js\";\n\n/** @hidden */\nexport class OrderedDistinctEndpointComponent implements 
ExecutionContext {\n  private hashedLastResult: string;\n\n  constructor(\n    private executionContext: 
ExecutionContext,\n    hashedLastResult?: string,\n  ) {\n    this.hashedLastResult = hashedLastResult;\n  }\n\n  
public hasMoreResults(): boolean {\n    return this.executionContext.hasMoreResults();\n  }\n\n  public async 
fetchMore(diagnosticNode?: DiagnosticNodeInternal): Promise<Response<any>> {\n    const buffer: any[] = [];\n    const 
response = await this.executionContext.fetchMore(diagnosticNode);\n    if (\n      !response ||\n      
!response.result ||\n      !Array.isArray(response.result.buffer) ||\n      response.result.buffer.length === 0\n    ) 
{\n      return { result: response.result, headers: response.headers };\n    }\n\n    const parallelResult = 
response.result as ParallelQueryResult;\n    const dataToProcess: any[] = parallelResult.buffer;\n    const 
partitionKeyRangeMap = parallelResult.partitionKeyRangeMap;\n    const updatedContinuationRanges = 
parallelResult.updatedContinuationRanges;\n    const orderByItems = parallelResult.orderByItems;\n\n    // Process 
each item and maintain hashedLastResult for distinct filtering\n    for (const item of dataToProcess) {\n      if 
(item) {\n        const hashedResult = await hashObject(item);\n        if (hashedResult !== this.hashedLastResult) 
{\n          buffer.push(item);\n          this.hashedLastResult = hashedResult;\n        }\n      }\n    }\n\n    // 
Process distinct query logic and update partition key range map with hashedLastResult\n    const 
updatedPartitionKeyRangeMap = await processDistinctQueryAndUpdateRangeMap(\n      dataToProcess,\n      
partitionKeyRangeMap,\n      hashObject,\n    );\n\n    // Return in the new structure format using the utility 
function\n    const result = createParallelQueryResult(\n      buffer,\n      updatedPartitionKeyRangeMap,\n      
updatedContinuationRanges,\n      orderByItems,\n    );\n\n    return {\n      result,\n      headers: 
response.headers,\n    };\n  }\n}\n"]}
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.d.
ts:9:    hasMoreResults(): boolean;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.d.
ts:10:    fetchMore(diagnosticNode?: DiagnosticNodeInternal): Promise<Response<any>>;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.d.
ts:11:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.d.
ts:12://# sourceMappingURL=UnorderedDistinctEndpointComponent.d.ts.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:12:    hasMoreResults() {
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:13:        const result = this.executionContext.hasMoreResults();
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:14:        return result;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:15:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:16:    async fetchMore(diagnosticNode) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:17:        const buffer = [];
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:18:        const response = await this.executionContext.fetchMore(diagnosticNode);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:19:        if (!response) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:20:            const result = createParallelQueryResult([], new Map(), {}, undefined);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:21:            return { result, headers: getInitialHeader() };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:22:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:23:        if (response.result === undefined ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:24:            !Array.isArray(response.result.buffer) ||
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:25:            response.result.buffer.length === 0) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:26:            const result = createParallelQueryResult([], new Map(), {}, undefined);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:27:            return { result, headers: response.headers };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:28:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:29:        const parallelResult = response.result;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:30:        const dataToProcess = parallelResult.buffer;
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:31:        for (const item of dataToProcess) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:32:            if (item) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:33:                const hashedResult = await hashObject(item);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:34:                if (!this.hashedResults.has(hashedResult)) {
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:35:                    buffer.push(item);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:36:                    this.hashedResults.add(hashedResult);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:37:                }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:38:            }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:39:        }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:40:        const result = createParallelQueryResult(buffer, new Map(), undefined, undefined);
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:41:        return { result, headers: response.headers };
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:42:    }
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:43:}
  api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
:44://# sourceMappingURL=UnorderedDistinctEndpointComponent.js.map
> api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\EndpointComponent\UnorderedDistinctEndpointComponent.js
.map:1:{"version":3,"file":"UnorderedDistinctEndpointComponent.js","sourceRoot":"","sources":["../../../../src/queryExe
cutionContext/EndpointComponent/UnorderedDistinctEndpointComponent.ts"],"names":[],"mappings":"AAIA,OAAO,EAAE,UAAU,EAAE
,MAAM,2BAA2B,CAAC;AAGvD,OAAO,EAAE,yBAAyB,EAAE,MAAM,2BAA2B,CAAC;AACtE,OAAO,EAAE,gBAAgB,EAAE,MAAM,mBAAmB,CAAC;AAErD,cAAc;
AACd,MAAM,OAAO,kCAAkC;IAEzB;IADZ,aAAa,CAAc;IACnC,YAAoB,gBAAkC;QAAlC,qBAAgB,GAAhB,gBAAgB,CAAkB;QACpD,IAAI,CAAC,aAAa,GAAG
,IAAI,GAAG,EAAE,CAAC;IACjC,CAAC;IAEM,cAAc;QACnB,MAAM,MAAM,GAAG,IAAI,CAAC,gBAAgB,CAAC,cAAc,EAAE,CAAC;QACtD,OAAO,MAAM,CAA
C;IAChB,CAAC;IAEM,KAAK,CAAC,SAAS,CAAC,cAAuC;QAC5D,MAAM,MAAM,GAAU,EAAE,CAAC;QACzB,MAAM,QAAQ,GAAG,MAAM,IAAI,CAAC,gBAAgB,C
AAC,SAAS,CAAC,cAAc,CAAC,CAAC;QAEvE,IAAI,CAAC,QAAQ,EAAE,CAAC;YACd,MAAM,MAAM,GAAG,yBAAyB,CAAC,EAAE,EAAE,IAAI,GAAG,EAAE,EA
AE,EAAE,EAAE,SAAS,CAAC,CAAC;YACvE,OAAO,EAAE,MAAM,EAAE,OAAO,EAAE,gBAAgB,EAAE,EAAE,CAAC;QACjD,CAAC;QAED,IACE,QAAQ,CAAC,MA
AM,KAAK,SAAS;YAC7B,CAAC,KAAK,CAAC,OAAO,CAAC,QAAQ,CAAC,MAAM,CAAC,MAAM,CAAC;YACtC,QAAQ,CAAC,MAAM,CAAC,MAAM,CAAC,MAAM,KAAK
,CAAC,EACnC,CAAC;YACD,MAAM,MAAM,GAAG,yBAAyB,CAAC,EAAE,EAAE,IAAI,GAAG,EAAE,EAAE,EAAE,EAAE,SAAS,CAAC,CAAC;YACvE,OAAO,EAAE
,MAAM,EAAE,OAAO,EAAE,QAAQ,CAAC,OAAO,EAAE,CAAC;QAC/C,CAAC;QAED,MAAM,cAAc,GAAG,QAAQ,CAAC,MAA6B,CAAC;QAC9D,MAAM,aAAa,GAAU,
cAAc,CAAC,MAAM,CAAC;QAEnD,KAAK,MAAM,IAAI,IAAI,aAAa,EAAE,CAAC;YACjC,IAAI,IAAI,EAAE,CAAC;gBACT,MAAM,YAAY,GAAG,MAAM,UAAU,C
AAC,IAAI,CAAC,CAAC;gBAC5C,IAAI,CAAC,IAAI,CAAC,aAAa,CAAC,GAAG,CAAC,YAAY,CAAC,EAAE,CAAC;oBAC1C,MAAM,CAAC,IAAI,CAAC,IAAI,C
AAC,CAAC;oBAClB,IAAI,CAAC,aAAa,CAAC,GAAG,CAAC,YAAY,CAAC,CAAC;gBACvC,CAAC;YACH,CAAC;QACH,CAAC;QACD,MAAM,MAAM,GAAG,yBAAyB
,CAAC,MAAM,EAAE,IAAI,GAAG,EAAE,EAAE,SAAS,EAAE,SAAS,CAAC,CAAC;QAClF,OAAO,EAAE,MAAM,EAAE,OAAO,EAAE,QAAQ,CAAC,OAAO,EAAE,CA
AC;IAC/C,CAAC;CACF","sourcesContent":["// Copyright (c) Microsoft Corporation.\n// Licensed under the MIT 
License.\nimport type { Response } from \"../../request/index.js\";\nimport type { ExecutionContext } from 
\"../ExecutionContext.js\";\nimport { hashObject } from \"../../utils/hashObject.js\";\nimport type { 
DiagnosticNodeInternal } from \"../../diagnostics/DiagnosticNodeInternal.js\";\nimport type { ParallelQueryResult } 
from \"../parallelQueryResult.js\";\nimport { createParallelQueryResult } from \"../parallelQueryResult.js\";\nimport 
{ getInitialHeader } from \"../headerUtils.js\";\n\n/** @hidden */\nexport class UnorderedDistinctEndpointComponent 
implements ExecutionContext {\n  private hashedResults: Set<string>;\n  constructor(private executionContext: 
ExecutionContext) {\n    this.hashedResults = new Set();\n  }\n\n  public hasMoreResults(): boolean {\n    const 
result = this.executionContext.hasMoreResults();\n    return result;\n  }\n\n  public async fetchMore(diagnosticNode?: 
DiagnosticNodeInternal): Promise<Response<any>> {\n    const buffer: any[] = [];\n    const response = await 
this.executionContext.fetchMore(diagnosticNode);\n\n    if (!response) {\n      const result = 
createParallelQueryResult([], new Map(), {}, undefined);\n      return { result, headers: getInitialHeader() };\n    
}\n\n    if (\n      response.result === undefined ||\n      !Array.isArray(response.result.buffer) ||\n      
response.result.buffer.length === 0\n    ) {\n      const result = createParallelQueryResult([], new Map(), {}, 
undefined);\n      return { result, headers: response.headers };\n    }\n\n    const parallelResult = response.result 
as ParallelQueryResult;\n    const dataToProcess: any[] = parallelResult.buffer;\n\n    for (const item of 
dataToProcess) {\n      if (item) {\n        const hashedResult = await hashObject(item);\n        if 
(!this.hashedResults.has(hashedResult)) {\n          buffer.push(item);\n          
this.hashedResults.add(hashedResult);\n        }\n      }\n    }\n    const result = createParallelQueryResult(buffer, 
new Map(), undefined, undefined);\n    return { result, headers: response.headers };\n  }\n}\n"]}



2026-09-07T10:45:53.258011Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/node_modules/@azure/cosmos/dist/esm/queryExecutionContext/defaultQueryExecutionContext.js | Select-Object -Skip 90 -First 100' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 651ms:
        }
    }
    /**
     * Determine if there are still remaining resources to processs based on
     * the value of the continuation token or the elements remaining on the current batch in the execution context.
     *
     * @returns true if there is other elements to process in the DefaultQueryExecutionContext.
     */
    hasMoreResults() {
        return (this.state === DefaultQueryExecutionContext.STATES.start ||
            this.continuationToken !== undefined ||
            this.currentIndex < this.resources.length - 1 ||
            this.currentPartitionIndex < this.fetchFunctions.length);
    }
    /**
     * Fetches the next batch of the feed and pass them as an array to a callback
     */
    async fetchMore(diagnosticNode) {
        return addDiagnosticChild(async (childDiagnosticNode) => {
            if (this.currentPartitionIndex >= this.fetchFunctions.length) {
                return {
                    headers: getInitialHeader(),
                    result: undefined,
                };
            }
            // Keep to the original continuation and to restore the value after fetchFunction call
            const originalContinuation = this.options.continuationToken || this.options.continuation;
            this.options.continuationToken = this.continuationToken;
            // Return undefined if there is no more results
            if (this.currentPartitionIndex >= this.fetchFunctions.length) {
                return {
                    headers: getInitialHeader(),
                    result: undefined,
                };
            }
            let resources;
            let responseHeaders;
            try {
                let p;
                if (this.nextFetchFunction !== undefined) {
                    logger.verbose("using prefetch");
                    p = this.nextFetchFunction;
                    this.nextFetchFunction = undefined;
                }
                else {
                    logger.verbose("using fresh fetch");
                    p = this.fetchFunctions[this.currentPartitionIndex](childDiagnosticNode, this.options, this.correlatedActivityId);
                }
                const response = await p;
                resources = response.result;
                childDiagnosticNode.recordQueryResult(resources, CosmosDbDiagnosticLevel.debugUnsafe);
                responseHeaders = response.headers;
                this.continuationToken = responseHeaders[Constants.HttpHeaders.Continuation];
                if (!this.continuationToken) {
                    ++this.currentPartitionIndex;
                }
                if (this.options && this.options.bufferItems === true) {
                    const fetchFunction = this.fetchFunctions[this.currentPartitionIndex];
                    this.nextFetchFunction = fetchFunction
                        ? fetchFunction(childDiagnosticNode, {
                            ...this.options,
                            continuationToken: this.continuationToken,
                        }, this.correlatedActivityId)
                        : undefined;
                }
            }
            catch (err) {
                this.state = DefaultQueryExecutionContext.STATES.ended;
                // return callback(err, undefined, responseHeaders);
                // TODO: Error and data being returned is an antipattern, this might broken
                throw err;
            }
            this.state = DefaultQueryExecutionContext.STATES.inProgress;
            this.currentIndex = 0;
            this.options.continuationToken = originalContinuation;
            this.options.continuation = originalContinuation;
            // deserializing query metrics so that we aren't working with delimited strings in the rest of the code base
            if (Constants.HttpHeaders.QueryMetrics in responseHeaders) {
                const delimitedString = responseHeaders[Constants.HttpHeaders.QueryMetrics];
                let queryMetrics = QueryMetrics.createFromDelimitedString(delimitedString);
                // Add the request charge to the query metrics so that we can have per partition request charge.
                if (Constants.HttpHeaders.RequestCharge in responseHeaders) {
                    const requestCharge = Number(responseHeaders[Constants.HttpHeaders.RequestCharge]) || 0;
                    queryMetrics = new QueryMetrics(queryMetrics.retrievedDocumentCount, queryMetrics.retrievedDocumentSize, queryMetrics.outputDocumentCount, queryMetrics.outputDocumentSize, queryMetrics.indexHitDocumentCount, queryMetrics.totalQueryExecutionTime, queryMetrics.queryPreparationTimes, queryMetrics.indexLookupTime, queryMetrics.documentLoadTime, queryMetrics.vmExecutionTime, queryMetrics.runtimeExecutionTimes, queryMetrics.documentWriteTime, new ClientSideMetrics(requestCharge));
                }
                // Wraping query metrics in a object where the key is '0' just so single partition
                // and partition queries have the same response schema
                responseHeaders[Constants.HttpHeaders.QueryMetrics] = {};
                responseHeaders[Constants.HttpHeaders.QueryMetrics]["0"] = queryMetrics;
            }
            return { result: resources, headers: responseHeaders };
        }, diagnosticNode, DiagnosticNodeType.DEFAULT_QUERY_NODE, {
            queryMethodIdentifier: "fetchMore",
        });
    }
    _canFetchMore() {
        const res = this.state === DefaultQueryExecutionContext.STATES.start ||
            (this.continuationToken && this.state === DefaultQueryExecutionContext.STATES.inProgress) ||
            (this.currentPartitionIndex < this.fetchFunctions.length &&
                this.state === DefaultQueryExecutionContext.STATES.inProgress);

2026-09-07T10:45:56.500969Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem api/node_modules/@azure/cosmos/dist/esm/queryExecutionContext -Recurse -File | Select-String -Pattern "GroupBy" | Select-Object Path,LineNumber,Line -First 80' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 651ms:

Path                                                                                                                   
----                                                                                                                   
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQu...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\hybridQu...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\pipeline...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\QueryVal...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\QueryVal...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\QueryVal...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\@azure\cosmos\dist\esm\queryExecutionContext\Endpoint...



  ✓ Load repository instructions
  ✓ Inspect diff versus merge base
  ✓ Analyze changed code for bugs
  → Produce JSON findings
codex
No actionable correctness issues were found in the changed code. The nullish guards are localized and covered by relevant tests, and the API typecheck and full test suite pass.
No actionable correctness issues were found in the changed code. The nullish guards are localized and covered by relevant tests, and the API typecheck and full test suite pass.
