2026-09-07T11:12:58.052281Z ERROR codex_models_manager::manager: failed to load models cache: missing field `supports_parallel_tool_calls` at line 132 column 5
OpenAI Codex v0.147.0
--------
workdir: C:\Alok\Business Projects\wt-fix-cosmos-pages
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: high
reasoning summaries: none
session id: 01a07b92-4489-7281-aa3f-0f0aede3f8d3
--------
user
changes against 'main'
  → Load repository review instructions
  • Inspect diff against merge base
  • Analyze changed code for bugs
  • Produce JSON findings
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force -Recurse -Filter AGENTS* | Select-Object -ExpandProperty FullName' in C:\Alok\Business Projects\wt-fix-cosmos-pages
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --stat 5bfc0361aab64f7b637128c6c3fee9828a80393d' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 1141ms:
 api/scripts/backfill-historical-receivables.ts     |  169 +
 api/src/cosmos/commission-receivable-repository.ts |    2 +-
 api/src/schemas/commission-receivable.ts           |    8 +
 api/src/services/commission-settlement.service.ts  |   55 +-
 .../backfill-historical-receivables.test.ts        |  215 +
 .../codex-historical-receivables-20260907-0704.md  | 5933 ++++++++++++++++++++
 6 files changed, 6367 insertions(+), 15 deletions(-)
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

 succeeded in 4435ms:
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\.pnpm\teeny-request@9.0.0\node_modules\teeny-request\build\src\agents.d.ts
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\.pnpm\teeny-request@9.0.0\node_modules\teeny-request\build\src\agents.js
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\.pnpm\teeny-request@9.0.0\node_modules\teeny-request\build\src\agents.js.map

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force .agents,.codex -ErrorAction SilentlyContinue | Format-List FullName,Name,Length' in C:\Alok\Business Projects\wt-fix-cosmos-pages
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --name-only 5bfc0361aab64f7b637128c6c3fee9828a80393d' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 1070ms:
api/scripts/backfill-historical-receivables.ts
api/src/cosmos/commission-receivable-repository.ts
api/src/schemas/commission-receivable.ts
api/src/services/commission-settlement.service.ts
api/tests/scripts/backfill-historical-receivables.test.ts
docs/reviews/codex-historical-receivables-20260907-0704.md
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

2026-09-07T11:13:18.967395Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 1.1 seconds
Output:

 exited 1 in 1131ms:
  ✓ Load repository review instructions
  → Inspect diff against merge base
  • Analyze changed code for bugs
  • Produce JSON findings
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --find-renames --no-ext-diff 5bfc0361aab64f7b637128c6c3fee9828a80393d -- api/src/cosmos/commission-receivable-repository.ts api/src/schemas/commission-receivable.ts api/src/services/commission-settlement.service.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 815ms:
diff --git a/api/src/cosmos/commission-receivable-repository.ts b/api/src/cosmos/commission-receivable-repository.ts
index 5741edc6..7403776f 100644
--- a/api/src/cosmos/commission-receivable-repository.ts
+++ b/api/src/cosmos/commission-receivable-repository.ts
@@ -37,7 +37,7 @@ export const commissionReceivableRepo = {
         commissionDue: input.commissionDue,
         commissionResolvedFrom: input.commissionResolvedFrom,
         remittanceStatus: 'DUE',
-        createdAt: new Date().toISOString(),
+        createdAt: input.createdAt ?? new Date().toISOString(),
         ...(input.cashCollectedAmount !== undefined
           ? { cashCollectedAmount: input.cashCollectedAmount }
           : {}),
diff --git a/api/src/schemas/commission-receivable.ts b/api/src/schemas/commission-receivable.ts
index 3cc93cba..07ce412a 100644
--- a/api/src/schemas/commission-receivable.ts
+++ b/api/src/schemas/commission-receivable.ts
@@ -77,6 +77,14 @@ export type CommissionReceivableCreateInput = {
   serviceName?: string;
   slotDate?: string;
   collectionMethod?: CollectionMethod;
+  /**
+   * Overrides the row's createdAt. Only the historical backfill sets it, so a receivable
+   * reconstructed for a job completed months ago carries the date the debt was actually
+   * incurred. createdAt drives oldest-first remittance allocation and the hold's oldestDueAt,
+   * so stamping backfilled rows with the backfill run date would both mis-order future
+   * allocations and understate how overdue the debt is on the admin dashboard.
+   */
+  createdAt?: string;
 };
 
 /** Per-technician roll-up for the admin commission-collection dashboard. */
diff --git a/api/src/services/commission-settlement.service.ts b/api/src/services/commission-settlement.service.ts
index 597eaeec..eb02ec3d 100644
--- a/api/src/services/commission-settlement.service.ts
+++ b/api/src/services/commission-settlement.service.ts
@@ -14,6 +14,41 @@ export type RecordCommissionDueResult =
   | { created: boolean; commissionDue: number; commissionBps: number; commissionResolvedFrom: CommissionResolvedFrom }
   | { created: false; skipped: 'NO_TECHNICIAN' | 'NOT_COMPLETED' | 'NOT_CASH' };
 
+/**
+ * Resolves what a booking's commission *would* be, reading only. Extracted so that a caller which
+ * needs to preview an amount without writing (the historical backfill's dry-run) runs exactly the
+ * same resolution and rounding as the write path — a second copy of `(amount * bps) / 10000`
+ * elsewhere in the codebase is a money bug waiting to drift.
+ */
+export async function resolveCommissionForBooking(booking: BookingDoc): Promise<{
+  bookingAmount: number;
+  bps: number;
+  commissionDue: number;
+  commissionResolvedFrom: CommissionResolvedFrom;
+  serviceName: string | undefined;
+}> {
+  const bookingAmount = booking.finalAmount ?? booking.amount;
+  const [globalBps, service, category] = await Promise.all([
+    getGlobalCommissionBps(),
+    catalogueRepo.getServiceByIdCrossPartition(booking.serviceId),
+    catalogueRepo.getCategoryById(booking.categoryId),
+  ]);
+
+  const { bps, from: commissionResolvedFrom } = resolveCommissionBps({
+    ...(service?.commissionBps !== undefined ? { serviceBps: service.commissionBps } : {}),
+    ...(category?.commissionBps !== undefined ? { categoryBps: category.commissionBps } : {}),
+    globalBps,
+  });
+
+  return {
+    bookingAmount,
+    bps,
+    commissionDue: Math.round((bookingAmount * bps) / 10000),
+    commissionResolvedFrom,
+    serviceName: booking.serviceName ?? service?.name,
+  };
+}
+
 /**
  * E21-S02 Task 8: the CASH_ON_SERVICE commission cascade, extracted verbatim from
  * trigger-booking-completed.ts's CASH branch so both the change-feed trigger (at-least-once
@@ -24,7 +59,9 @@ export type RecordCommissionDueResult =
  * would have computed anyway, so the caller can always finalize the ledger (consume credits,
  * recompute hold) regardless of whether this particular delivery created the row.
  */
-export async function recordCommissionDue(booking: BookingDoc): Promise<RecordCommissionDueResult> {
+export async function recordCommissionDue(booking: BookingDoc,
+  opts?: { createdAt?: string },
+): Promise<RecordCommissionDueResult> {
   if (booking.status !== 'COMPLETED') return { created: false, skipped: 'NOT_COMPLETED' };
 
   const technicianId = booking.technicianId;
@@ -50,19 +87,8 @@ export async function recordCommissionDue(booking: BookingDoc): Promise<RecordCo
     };
   }
 
-  const [globalBps, service, category] = await Promise.all([
-    getGlobalCommissionBps(),
-    catalogueRepo.getServiceByIdCrossPartition(booking.serviceId),
-    catalogueRepo.getCategoryById(booking.categoryId),
-  ]);
-
-  const { bps, from: commissionResolvedFrom } = resolveCommissionBps({
-    ...(service?.commissionBps !== undefined ? { serviceBps: service.commissionBps } : {}),
-    ...(category?.commissionBps !== undefined ? { categoryBps: category.commissionBps } : {}),
-    globalBps,
-  });
-  const commissionDue = Math.round((bookingAmount * bps) / 10000);
-  const serviceName = booking.serviceName ?? service?.name;
+  const { bps, commissionResolvedFrom, commissionDue, serviceName } =
+    await resolveCommissionForBooking(booking);
 
   const created = await commissionReceivableRepo.createDueEntry({
     bookingId,
@@ -79,6 +105,7 @@ export async function recordCommissionDue(booking: BookingDoc): Promise<RecordCo
     ...(serviceName !== undefined ? { serviceName } : {}),
     slotDate: booking.slotDate,
     ...(booking.collectionMethod !== undefined ? { collectionMethod: booking.collectionMethod } : {}),
+    ...(opts?.createdAt !== undefined ? { createdAt: opts.createdAt } : {}),
   });
 
   if (!created) {
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --no-ext-diff 5bfc0361aab64f7b637128c6c3fee9828a80393d -- api/scripts/backfill-historical-receivables.ts api/tests/scripts/backfill-historical-receivables.test.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 1005ms:
diff --git a/api/scripts/backfill-historical-receivables.ts b/api/scripts/backfill-historical-receivables.ts
new file mode 100644
index 00000000..649ca1fb
--- /dev/null
+++ b/api/scripts/backfill-historical-receivables.ts
@@ -0,0 +1,169 @@
+#!/usr/bin/env tsx
+// One-off backfill for cash bookings that COMPLETED before the commission ledger physically
+// existed in an environment. In production the `commission_receivables` container was never
+// created (setup-cosmos.ts had not been run since E21-S01 shipped), so every completed cash
+// booking settled into a 404 and no receivable was ever recorded.
+//
+// Run (default, read-only): npx tsx scripts/backfill-historical-receivables.ts
+//                     apply: npx tsx scripts/backfill-historical-receivables.ts --apply
+//
+// Requires: COSMOS_CONNECTION_STRING, or COSMOS_ENDPOINT + COSMOS_KEY (see src/cosmos/client.ts).
+//
+// Deliberately calls `recordCommissionDue`, NOT `settleCashCompletion`: the latter also increments
+// completedJobCount and sends an EARNINGS_UPDATE push. Firing those for a job finished months ago
+// would double-count job totals and notify technicians about ancient work. The ledger row is what
+// is missing; the side effects already happened (or didn't) at the time.
+//
+// Idempotent: `recordCommissionDue` is keyed on bookingId and returns `created: false` for a row
+// that already exists, and this script skips such bookings before calling it at all.
+
+import { fileURLToPath } from 'node:url';
+import { argv } from 'node:process';
+import { getBookingsContainer } from '../src/cosmos/client.js';
+import { commissionReceivableRepo } from '../src/cosmos/commission-receivable-repository.js';
+import {
+  finalizeLedgerForTechnician,
+  recordCommissionDue,
+  resolveCommissionForBooking,
+} from '../src/services/commission-settlement.service.js';
+import { systemAudit } from '../src/services/auditLog.service.js';
+import { BookingDocSchema } from '../src/schemas/booking.js';
+
+const KNOWN_FLAGS = new Set(['--dry-run', '--apply']);
+
+// RAZORPAY bookings settle through the wallet-ledger path and must never get a cash receivable.
+// Legacy docs may omit paymentMethod entirely; those default to cash, matching recordCommissionDue.
+const QUERY =
+  "SELECT * FROM c WHERE c.status = 'COMPLETED' AND (NOT IS_DEFINED(c.paymentMethod) OR c.paymentMethod != 'RAZORPAY')";
+
+const rupees = (paise: number): string => `Rs ${(paise / 100).toFixed(2)}`;
+
+export async function main(argvArgs: string[]): Promise<void> {
+  const unknown = argvArgs.filter((a) => !KNOWN_FLAGS.has(a));
+  if (unknown.length > 0) {
+    console.error(`Unknown flag(s): ${unknown.join(', ')}`);
+    console.error('Usage: backfill-historical-receivables.ts [--dry-run|--apply]');
+    process.exit(2);
+    return;
+  }
+
+  const apply = argvArgs.includes('--apply');
+  if (apply && argvArgs.includes('--dry-run')) {
+    console.error('Pass either --dry-run or --apply, not both.');
+    process.exit(2);
+    return;
+  }
+
+  console.log(`historical commission-receivable backfill — mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
+  console.log('');
+
+  const iterator = getBookingsContainer().items.query({ query: QUERY }, { maxItemCount: 100 });
+  const bookings: unknown[] = [];
+  while (iterator.hasMoreResults()) {
+    const page = await iterator.fetchNext();
+    // Cosmos hands back `resources: undefined` on some pages — never spread it unguarded.
+    bookings.push(...(page.resources ?? []));
+  }
+
+  // Technicians who gained at least one row, so their credits can be consumed and their hold
+  // recomputed once at the end rather than per row.
+  const touched = new Set<string>();
+  let created = 0;
+  let alreadyPresent = 0;
+  let unparseable = 0;
+  let skipped = 0;
+  let totalPaise = 0;
+
+  for (const raw of bookings) {
+    const parsed = BookingDocSchema.safeParse(raw);
+    if (!parsed.success) {
+      unparseable += 1;
+      console.log(`  SKIP (unparseable) ${(raw as { id?: string })?.id ?? '<no id>'}`);
+      continue;
+    }
+    const booking = parsed.data;
+    if (!booking.technicianId) {
+      skipped += 1;
+      console.log(`  SKIP (no technician) ${booking.id}`);
+      continue;
+    }
+
+    const existing = await commissionReceivableRepo.getByBookingId(booking.id, booking.technicianId);
+    if (existing) {
+      alreadyPresent += 1;
+      console.log(`  HAVE ${booking.id}  ${rupees(existing.commissionDue)} already recorded`);
+      continue;
+    }
+
+    const preview = await resolveCommissionForBooking(booking);
+    totalPaise += preview.commissionDue;
+
+    if (!apply) {
+      console.log(
+        `  WOULD ADD ${booking.id}  tech=${booking.technicianId}  ${preview.serviceName ?? '<service?>'}  ` +
+          `booking=${rupees(preview.bookingAmount)}  bps=${preview.bps} (${preview.commissionResolvedFrom})  ` +
+          `commission=${rupees(preview.commissionDue)}`,
+      );
+      continue;
+    }
+
+    // Stamp the row with when the debt was actually incurred, not when this script ran:
+    // createdAt drives oldest-first remittance allocation and the hold's oldestDueAt.
+    const incurredAt = booking.completedAt ?? booking.createdAt;
+    const result = await recordCommissionDue(booking, { createdAt: incurredAt });
+    if ('skipped' in result) {
+      skipped += 1;
+      console.log(`  SKIP (${result.skipped}) ${booking.id}`);
+      continue;
+    }
+    if (!result.created) {
+      alreadyPresent += 1;
+      console.log(`  HAVE ${booking.id} (created concurrently)`);
+      continue;
+    }
+
+    created += 1;
+    touched.add(booking.technicianId);
+    console.log(
+      `  ADDED ${booking.id}  ${rupees(result.commissionDue)}  bps=${result.commissionBps}  dated ${incurredAt}`,
+    );
+    await systemAudit('COMMISSION_DUE_RECORDED', 'booking', booking.id, {
+      technicianId: booking.technicianId,
+      bookingAmount: preview.bookingAmount,
+      commissionBps: result.commissionBps,
+      commissionDue: result.commissionDue,
+      commissionResolvedFrom: result.commissionResolvedFrom,
+      // Distinguishes a retroactively created row from one the live settlement path wrote.
+      backfill: true,
+    });
+  }
+
+  // A technician may already hold open CREDIT docs (an overpaid remittance recorded before this
+  // backfill ran). New DUE rows must consume them, or the dashboard overstates what is owed.
+  // finalizeLedgerForTechnician runs consumePendingCredits and then recomputes the hold; it never
+  // throws.
+  for (const technicianId of touched) {
+    await finalizeLedgerForTechnician(technicianId);
+    console.log(`  FINALIZED ${technicianId} (credits consumed, hold recomputed)`);
+  }
+
+  console.log('');
+  console.log(
+    `scanned=${bookings.length} ${apply ? 'created' : 'wouldCreate'}=${apply ? created : bookings.length - alreadyPresent - unparseable - skipped} ` +
+      `alreadyPresent=${alreadyPresent} skipped=${skipped} unparseable=${unparseable}`,
+  );
+  console.log(`commission ${apply ? 'recorded' : 'that would be recorded'}: ${rupees(totalPaise)}`);
+  console.log('');
+  console.log(
+    apply
+      ? 'Apply complete. Holds were recomputed for every affected technician; run backfill-commission-holds.ts --apply if you want a full-roster sweep as well.'
+      : 'Dry-run complete — no writes made. Re-run with --apply to record the rows above.',
+  );
+}
+
+if (argv[1] && fileURLToPath(import.meta.url) === argv[1]) {
+  main(argv.slice(2)).catch((e) => {
+    console.error(e);
+    process.exit(1);
+  });
+}
diff --git a/api/tests/scripts/backfill-historical-receivables.test.ts b/api/tests/scripts/backfill-historical-receivables.test.ts
new file mode 100644
index 00000000..c962a8e2
--- /dev/null
+++ b/api/tests/scripts/backfill-historical-receivables.test.ts
@@ -0,0 +1,215 @@
+import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
+
+const { recordCommissionDue, resolveCommissionForBooking, settleCashCompletion, finalizeLedgerForTechnician } = vi.hoisted(() => ({
+  recordCommissionDue: vi.fn(),
+  resolveCommissionForBooking: vi.fn(),
+  settleCashCompletion: vi.fn(),
+  finalizeLedgerForTechnician: vi.fn(),
+}));
+const { systemAudit } = vi.hoisted(() => ({ systemAudit: vi.fn() }));
+const { getByBookingId } = vi.hoisted(() => ({ getByBookingId: vi.fn() }));
+const { mockFetchNext, mockHasMoreResults } = vi.hoisted(() => ({
+  mockFetchNext: vi.fn(),
+  mockHasMoreResults: vi.fn(),
+}));
+
+vi.mock('../../src/services/commission-settlement.service.js', () => ({
+  recordCommissionDue,
+  resolveCommissionForBooking,
+  settleCashCompletion,
+  finalizeLedgerForTechnician,
+}));
+vi.mock('../../src/services/auditLog.service.js', () => ({ systemAudit }));
+vi.mock('../../src/cosmos/commission-receivable-repository.js', () => ({
+  commissionReceivableRepo: { getByBookingId },
+}));
+vi.mock('../../src/cosmos/client.js', () => ({
+  getBookingsContainer: () => ({
+    items: { query: () => ({ fetchNext: mockFetchNext, hasMoreResults: mockHasMoreResults }) },
+  }),
+}));
+
+import { main } from '../../scripts/backfill-historical-receivables.js';
+
+const booking = (over: Record<string, unknown> = {}) => ({
+  id: 'bk-1',
+  customerId: 'cust-1',
+  serviceId: 'svc-1',
+  categoryId: 'cat-1',
+  slotDate: '2026-08-24',
+  slotWindow: '10:00-12:00',
+  addressText: '12 Main Road, Ayodhya',
+  addressLatLng: { lat: 26.79, lng: 82.19 },
+  status: 'COMPLETED',
+  paymentOrderId: 'order-1',
+  paymentMethod: 'CASH_ON_SERVICE',
+  paymentId: null,
+  paymentSignature: null,
+  amount: 59900,
+  technicianId: 'tech-1',
+  createdAt: '2026-08-24T10:00:00.000Z',
+  ...over,
+});
+
+/** One page of results, then done. */
+function onePage(rows: unknown[] | undefined) {
+  mockHasMoreResults.mockReturnValueOnce(true).mockReturnValue(false);
+  mockFetchNext.mockResolvedValueOnce({ resources: rows });
+}
+
+/** process.exit's signature returns never, which does not fit vi.spyOn's default generic. */
+const makeExitSpy = () => vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
+
+describe('backfill-historical-receivables CLI', () => {
+  let logSpy: ReturnType<typeof vi.spyOn>;
+  let errorSpy: ReturnType<typeof vi.spyOn>;
+  let exitSpy: ReturnType<typeof makeExitSpy>;
+
+  beforeEach(() => {
+    vi.clearAllMocks();
+    mockHasMoreResults.mockReset();
+    mockFetchNext.mockReset();
+    getByBookingId.mockResolvedValue(undefined);
+    resolveCommissionForBooking.mockResolvedValue({
+      bookingAmount: 59900,
+      bps: 2200,
+      commissionDue: 13178,
+      commissionResolvedFrom: 'GLOBAL',
+    });
+    recordCommissionDue.mockResolvedValue({
+      created: true,
+      commissionDue: 13178,
+      commissionBps: 2200,
+      commissionResolvedFrom: 'GLOBAL',
+    });
+    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
+    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
+    exitSpy = makeExitSpy();
+  });
+
+  afterEach(() => {
+    logSpy.mockRestore();
+    errorSpy.mockRestore();
+    exitSpy.mockRestore();
+  });
+
+  it('defaults to dry-run and writes nothing', async () => {
+    onePage([booking()]);
+
+    await main([]);
+
+    expect(recordCommissionDue).not.toHaveBeenCalled();
+    expect(systemAudit).not.toHaveBeenCalled();
+  });
+
+  it('dry-run previews the commission via the shared resolver, not its own arithmetic', async () => {
+    onePage([booking()]);
+
+    await main(['--dry-run']);
+
+    expect(resolveCommissionForBooking).toHaveBeenCalledTimes(1);
+    expect(recordCommissionDue).not.toHaveBeenCalled();
+  });
+
+  it('--apply records a receivable for each eligible booking', async () => {
+    onePage([booking({ id: 'bk-1' }), booking({ id: 'bk-2' })]);
+
+    await main(['--apply']);
+
+    expect(recordCommissionDue).toHaveBeenCalledTimes(2);
+  });
+
+  it('--apply audits COMMISSION_DUE_RECORDED with a backfill marker, only for rows it created', async () => {
+    onePage([booking({ id: 'bk-1' }), booking({ id: 'bk-2' })]);
+    recordCommissionDue
+      .mockResolvedValueOnce({ created: true, commissionDue: 13178, commissionBps: 2200, commissionResolvedFrom: 'GLOBAL' })
+      .mockResolvedValueOnce({ created: false, commissionDue: 13178, commissionBps: 2200, commissionResolvedFrom: 'GLOBAL' });
+
+    await main(['--apply']);
+
+    expect(systemAudit).toHaveBeenCalledTimes(1);
+    const [action, resourceType, resourceId, payload] = systemAudit.mock.calls[0] as [string, string, string, Record<string, unknown>];
+    expect(action).toBe('COMMISSION_DUE_RECORDED');
+    expect(resourceType).toBe('booking');
+    expect(resourceId).toBe('bk-1');
+    expect(payload).toMatchObject({ backfill: true });
+  });
+
+  it('never routes through settleCashCompletion, whose side effects would be wrong for old jobs', async () => {
+    onePage([booking()]);
+
+    await main(['--apply']);
+
+    // settleCashCompletion also increments completedJobCount and pushes an EARNINGS_UPDATE.
+    // Replaying those for a months-old job would double-count totals and notify the technician
+    // about ancient work, so the backfill must call recordCommissionDue directly.
+    expect(recordCommissionDue).toHaveBeenCalledTimes(1);
+    expect(settleCashCompletion).not.toHaveBeenCalled();
+  });
+
+  it('skips a booking that already has a receivable', async () => {
+    onePage([booking()]);
+    getByBookingId.mockResolvedValue({ id: 'bk-1', commissionDue: 13178 });
+
+    await main(['--apply']);
+
+    expect(recordCommissionDue).not.toHaveBeenCalled();
+    expect(systemAudit).not.toHaveBeenCalled();
+  });
+
+  it('tolerates the undefined page.resources Cosmos returns', async () => {
+    onePage(undefined);
+
+    await main(['--apply']);
+
+    expect(recordCommissionDue).not.toHaveBeenCalled();
+  });
+
+  // Codex review, 2026-09-07 (both P2, money-ledger correctness).
+  it('stamps the receivable with when the job completed, not when the backfill ran', async () => {
+    onePage([booking({ completedAt: '2026-05-08T09:30:00.000Z' })]);
+
+    await main(['--apply']);
+
+    expect(recordCommissionDue).toHaveBeenCalledWith(
+      expect.objectContaining({ id: 'bk-1' }),
+      { createdAt: '2026-05-08T09:30:00.000Z' },
+    );
+  });
+
+  it('falls back to the booking createdAt when completedAt is absent', async () => {
+    onePage([booking({ createdAt: '2026-05-01T00:00:00.000Z' })]);
+
+    await main(['--apply']);
+
+    expect(recordCommissionDue).toHaveBeenCalledWith(expect.anything(), { createdAt: '2026-05-01T00:00:00.000Z' });
+  });
+
+  it('consumes open credits and recomputes the hold once per affected technician', async () => {
+    onePage([booking({ id: 'bk-1' }), booking({ id: 'bk-2' }), booking({ id: 'bk-3', technicianId: 'tech-2' })]);
+
+    await main(['--apply']);
+
+    expect(finalizeLedgerForTechnician).toHaveBeenCalledTimes(2);
+    expect(finalizeLedgerForTechnician).toHaveBeenCalledWith('tech-1');
+    expect(finalizeLedgerForTechnician).toHaveBeenCalledWith('tech-2');
+  });
+
+  it('does not finalize a ledger when nothing was created', async () => {
+    onePage([booking()]);
+    getByBookingId.mockResolvedValue({ id: 'bk-1', commissionDue: 13178 });
+
+    await main(['--apply']);
+
+    expect(finalizeLedgerForTechnician).not.toHaveBeenCalled();
+  });
+
+  it('rejects unknown flags and both-mode invocations', async () => {
+    await main(['--nope']);
+    expect(exitSpy).toHaveBeenCalledWith(2);
+
+    exitSpy.mockClear();
+    await main(['--dry-run', '--apply']);
+    expect(exitSpy).toHaveBeenCalledWith(2);
+  });
+});
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Path api/src/services/commission-settlement.service.ts -TotalCount 260; Write-Output '--- repo'; Get-Content api/src/cosmos/commission-receivable-repository.ts -TotalCount 220; Write-Output '--- schema'; Get-Content api/src/schemas/commission-receivable.ts -TotalCount 180" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 739ms:
import * as Sentry from '@sentry/node';
import type { BookingDoc } from '../schemas/booking.js';
import type { CommissionResolvedFrom } from '../schemas/commission-config.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { commissionReceivableRepo } from '../cosmos/commission-receivable-repository.js';
import { incrementCompletedJobCount } from '../cosmos/technician-repository.js';
import { getGlobalCommissionBps, resolveCommissionBps } from './commission-config.service.js';
import { consumePendingCredits } from './commission-allocator.service.js';
import { recomputeCommissionHold } from './commission-hold.service.js';
import { sendTechEarningsUpdate } from './fcm.service.js';
import { systemAudit } from './auditLog.service.js';

export type RecordCommissionDueResult =
  | { created: boolean; commissionDue: number; commissionBps: number; commissionResolvedFrom: CommissionResolvedFrom }
  | { created: false; skipped: 'NO_TECHNICIAN' | 'NOT_COMPLETED' | 'NOT_CASH' };

/**
 * Resolves what a booking's commission *would* be, reading only. Extracted so that a caller which
 * needs to preview an amount without writing (the historical backfill's dry-run) runs exactly the
 * same resolution and rounding as the write path â€” a second copy of `(amount * bps) / 10000`
 * elsewhere in the codebase is a money bug waiting to drift.
 */
export async function resolveCommissionForBooking(booking: BookingDoc): Promise<{
  bookingAmount: number;
  bps: number;
  commissionDue: number;
  commissionResolvedFrom: CommissionResolvedFrom;
  serviceName: string | undefined;
}> {
  const bookingAmount = booking.finalAmount ?? booking.amount;
  const [globalBps, service, category] = await Promise.all([
    getGlobalCommissionBps(),
    catalogueRepo.getServiceByIdCrossPartition(booking.serviceId),
    catalogueRepo.getCategoryById(booking.categoryId),
  ]);

  const { bps, from: commissionResolvedFrom } = resolveCommissionBps({
    ...(service?.commissionBps !== undefined ? { serviceBps: service.commissionBps } : {}),
    ...(category?.commissionBps !== undefined ? { categoryBps: category.commissionBps } : {}),
    globalBps,
  });

  return {
    bookingAmount,
    bps,
    commissionDue: Math.round((bookingAmount * bps) / 10000),
    commissionResolvedFrom,
    serviceName: booking.serviceName ?? service?.name,
  };
}

/**
 * E21-S02 Task 8: the CASH_ON_SERVICE commission cascade, extracted verbatim from
 * trigger-booking-completed.ts's CASH branch so both the change-feed trigger (at-least-once
 * delivery) and the synchronous job-completion endpoint (Task 9) share one implementation.
 *
 * Idempotent by bookingId: an existing receivable (or a 409 from a racing invocation) is reported
 * as `created: false` with the same commissionDue/commissionBps/commissionResolvedFrom the caller
 * would have computed anyway, so the caller can always finalize the ledger (consume credits,
 * recompute hold) regardless of whether this particular delivery created the row.
 */
export async function recordCommissionDue(booking: BookingDoc,
  opts?: { createdAt?: string },
): Promise<RecordCommissionDueResult> {
  if (booking.status !== 'COMPLETED') return { created: false, skipped: 'NOT_COMPLETED' };

  const technicianId = booking.technicianId;
  if (!technicianId) return { created: false, skipped: 'NO_TECHNICIAN' };

  // E21-S02 Codex P1 fix: RAZORPAY bookings settle through the wallet-ledger path
  // (trigger-booking-completed.ts's RAZORPAY branch); this cascade must never record a
  // cash-style commission receivable or recompute the hold for them.
  if ((booking.paymentMethod ?? 'CASH_ON_SERVICE') === 'RAZORPAY') {
    return { created: false, skipped: 'NOT_CASH' };
  }

  const { id: bookingId } = booking;
  const bookingAmount = booking.finalAmount ?? booking.amount;

  const existing = await commissionReceivableRepo.getByBookingId(bookingId, technicianId);
  if (existing) {
    return {
      created: false,
      commissionDue: existing.commissionDue,
      commissionBps: existing.commissionBps,
      commissionResolvedFrom: existing.commissionResolvedFrom,
    };
  }

  const { bps, commissionResolvedFrom, commissionDue, serviceName } =
    await resolveCommissionForBooking(booking);

  const created = await commissionReceivableRepo.createDueEntry({
    bookingId,
    technicianId,
    serviceId: booking.serviceId,
    categoryId: booking.categoryId,
    bookingAmount,
    commissionBps: bps,
    commissionDue,
    commissionResolvedFrom,
    ...(booking.cashCollectedAmount !== undefined
      ? { cashCollectedAmount: booking.cashCollectedAmount }
      : {}),
    ...(serviceName !== undefined ? { serviceName } : {}),
    slotDate: booking.slotDate,
    ...(booking.collectionMethod !== undefined ? { collectionMethod: booking.collectionMethod } : {}),
    ...(opts?.createdAt !== undefined ? { createdAt: opts.createdAt } : {}),
  });

  if (!created) {
    // A concurrent invocation won the race and created the row first. Never fabricate the
    // returned values from what THIS invocation computed â€” a racing invocation may have resolved
    // a different commissionBps (e.g. a config edit landed between the two reads). Re-read the
    // stored row so the caller (and finalizeLedgerForTechnician) always acts on ledger truth.
    const stored = await commissionReceivableRepo.getByBookingId(bookingId, technicianId);
    if (!stored) {
      throw Object.assign(new Error('RECEIVABLE_RACE_UNREADABLE'), { code: 'RECEIVABLE_RACE_UNREADABLE' });
    }
    return {
      created: false,
      commissionDue: stored.commissionDue,
      commissionBps: stored.commissionBps,
      commissionResolvedFrom: stored.commissionResolvedFrom,
    };
  }

  return { created: true, commissionDue, commissionBps: bps, commissionResolvedFrom };
}

/**
 * Always safe to call; never throws (errors Sentry-captured). Consumes any open credits against
 * the technician's outstanding receivables, then recomputes their commissionHold absolutely.
 *
 * The second step runs even when the first throws â€” a redelivery must still get a chance to
 * refresh the hold even if credit consumption failed, and a caller (the change-feed trigger,
 * every delivery; Task 9's synchronous endpoint) must never have this call abort its own flow.
 */
export async function finalizeLedgerForTechnician(technicianId: string): Promise<void> {
  try {
    await consumePendingCredits(technicianId);
  } catch (err: unknown) {
    Sentry.captureException(err);
  }
  try {
    await recomputeCommissionHold(technicianId);
  } catch (err: unknown) {
    Sentry.captureException(err);
  }
}

/**
 * E21-S02 Codex P1 fix (branch review): side effects (COMMISSION_DUE_RECORDED audit,
 * completedJobCount increment, FCM earnings update) belong to whichever caller actually
 * *creates* the commission receivable row â€” not to every caller that happens to invoke
 * recordCommissionDue. Both the change-feed trigger (at-least-once delivery) and the
 * synchronous active-job COMPLETED transition (Task 9) call this instead of calling
 * recordCommissionDue directly, so exactly one of them fires the side effects for a given
 * booking regardless of which delivery wins the race to create the row.
 *
 * RAZORPAY bookings are guarded inside recordCommissionDue itself (`skipped: 'NOT_CASH'`):
 * this function returns immediately for them without touching the ledger.
 */
export async function settleCashCompletion(
  booking: BookingDoc,
  ctx?: { log?: (s: string) => void },
): Promise<RecordCommissionDueResult> {
  const r = await recordCommissionDue(booking);
  if ('skipped' in r) return r;

  const technicianId = booking.technicianId!;
  const bookingAmount = booking.finalAmount ?? booking.amount;

  if (r.created) {
    await systemAudit('COMMISSION_DUE_RECORDED', 'booking', booking.id, {
      technicianId,
      bookingAmount,
      commissionBps: r.commissionBps,
      commissionDue: r.commissionDue,
      commissionResolvedFrom: r.commissionResolvedFrom,
    });

    try {
      await Promise.all([
        incrementCompletedJobCount(technicianId),
        sendTechEarningsUpdate(technicianId, { bookingId: booking.id, commissionDue: r.commissionDue }),
      ]);
    } catch (err: unknown) {
      Sentry.captureException(err);
    }
  } else {
    ctx?.log?.(`settleCashCompletion: receivable already recorded for ${booking.id} â€” side effects skipped`);
  }

  await finalizeLedgerForTechnician(technicianId);
  return r;
}
--- repo
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
        createdAt: input.createdAt ?? new Date().toISOString(),
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
--- schema
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { CommissionBpsSchema, CommissionResolvedFromSchema, type CommissionResolvedFrom } from './commission-config.js';
import { HoldStateSchema } from './technician.js';

extendZodWithOpenApi(z);

/** Lifecycle of a single booking's commission owed by the technician to the platform (cash pilot). */
export const RemittanceStatusSchema = z.enum(['DUE', 'REMITTED', 'WAIVED']);
export type RemittanceStatus = z.infer<typeof RemittanceStatusSchema>;

export const RemittanceMethodSchema = z.enum(['UPI', 'CASH_DEPOSIT', 'ADJUSTMENT']);
export type RemittanceMethod = z.infer<typeof RemittanceMethodSchema>;

/** E24: how the money changed hands at the door (completion-time). Distinct from booking.paymentMethod. */
export const CollectionMethodSchema = z.enum(['CASH', 'UPI_QR']);
export type CollectionMethod = z.infer<typeof CollectionMethodSchema>;

export const AllocationSourceSchema = z.enum(['REMITTANCE', 'INCENTIVE', 'WAIVER']);
/** One credit applied to a receivable. id = `${refId}:${bookingId}` so a replay is detectable. */
export const AllocationSchema = z.object({
  id: z.string().min(1),
  source: AllocationSourceSchema,
  refId: z.string().min(1),
  paise: z.number().int().positive(),
  appliedAt: z.string(),
  byId: z.string().min(1),
});
export type Allocation = z.infer<typeof AllocationSchema>;

/**
 * E21-S01: One document per completed cash booking in the `commission_receivables` container
 * (pk /technicianId). id === bookingId for idempotent point reads. Records the commission the
 * technician OWES the platform (the platform never held the cash). `commissionBps` /
 * `commissionResolvedFrom` are snapshotted at settlement time so later config edits never
 * retroactively re-rate a recorded receivable.
 */
export const CommissionReceivableEntrySchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  technicianId: z.string(),
  partitionKey: z.string(),
  serviceId: z.string(),
  categoryId: z.string(),
  bookingAmount: z.number().int().positive(),
  cashCollectedAmount: z.number().int().nonnegative().optional(),
  commissionBps: CommissionBpsSchema,
  commissionDue: z.number().int().nonnegative(),
  commissionResolvedFrom: CommissionResolvedFromSchema,
  remittanceStatus: RemittanceStatusSchema,
  remittedAmount: z.number().int().nonnegative().optional(),
  remittedAt: z.string().optional(),
  remittanceRef: z.string().optional(),
  remittanceMethod: RemittanceMethodSchema.optional(),
  markedByAdminId: z.string().optional(),
  waivedReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  docType: z.literal('RECEIVABLE').optional(),
  allocations: z.array(AllocationSchema).optional(),
  serviceName: z.string().optional(),
  slotDate: z.string().optional(),
  collectionMethod: CollectionMethodSchema.optional(),
});
export type CommissionReceivableEntry = z.infer<typeof CommissionReceivableEntrySchema>;

export type CommissionReceivableCreateInput = {
  bookingId: string;
  technicianId: string;
  serviceId: string;
  categoryId: string;
  bookingAmount: number;
  commissionBps: number;
  commissionDue: number;
  commissionResolvedFrom: CommissionResolvedFrom;
  cashCollectedAmount?: number;
  serviceName?: string;
  slotDate?: string;
  collectionMethod?: CollectionMethod;
  /**
   * Overrides the row's createdAt. Only the historical backfill sets it, so a receivable
   * reconstructed for a job completed months ago carries the date the debt was actually
   * incurred. createdAt drives oldest-first remittance allocation and the hold's oldestDueAt,
   * so stamping backfilled rows with the backfill run date would both mis-order future
   * allocations and understate how overdue the debt is on the admin dashboard.
   */
  createdAt?: string;
};

/** Per-technician roll-up for the admin commission-collection dashboard. */
export const TechnicianOutstandingSummarySchema = z.object({
  technicianId: z.string(),
  technicianName: z.string(),
  dueCount: z.number().int().nonnegative(),
  totalCommissionDue: z.number().int().nonnegative(),
  oldestDueAt: z.string().optional(),
});
export type TechnicianOutstandingSummary = z.infer<typeof TechnicianOutstandingSummarySchema>;

export const CommissionReceivablesDashboardSchema = z.object({
  technicians: z.array(TechnicianOutstandingSummarySchema),
  totalOutstanding: z.number().int().nonnegative(),
});
export type CommissionReceivablesDashboard = z.infer<typeof CommissionReceivablesDashboardSchema>;

/** Admin action to settle (REMIT) or write off (WAIVE) a technician's commission for a booking. */
export const MarkCommissionReceivedBodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('REMIT'),
    bookingId: z.string().min(1),
    technicianId: z.string().min(1),
    remittedAmount: z.number().int().positive(),
    remittanceMethod: RemittanceMethodSchema,
    remittanceRef: z.string().min(1),
  }),
  z.object({
    action: z.literal('WAIVE'),
    bookingId: z.string().min(1),
    technicianId: z.string().min(1),
    waivedReason: z.string().min(1),
  }),
]);
export type MarkCommissionReceivedBody = z.infer<typeof MarkCommissionReceivedBodySchema>;

/** Tech-facing GET /v1/technicians/me/commission-due response. */
export const TechnicianCommissionDueSchema = z.object({
  totalOutstandingPaise: z.number().int().nonnegative(),
  dueCount: z.number().int().nonnegative(),
  entries: z.array(
    z.object({
      bookingId: z.string(),
      bookingAmount: z.number().int().nonnegative(),
      commissionDue: z.number().int().nonnegative(),
      createdAt: z.string(),
    }),
  ),
});
export type TechnicianCommissionDue = z.infer<typeof TechnicianCommissionDueSchema>;

/** Derived, never stored. */
export function outstandingOf(e: Pick<CommissionReceivableEntry, 'commissionDue' | 'remittedAmount'>): number {
  return Math.max(0, e.commissionDue - (e.remittedAmount ?? 0));
}

/**
 * E21-S02: Tech-facing GET /v1/technicians/me/commission-due response, v2. Field names of
 * `TechnicianCommissionDueSchema` (v1) are preserved (`totalOutstandingPaise`, `dueCount`,
 * `entries[].bookingId/bookingAmount/commissionDue/createdAt`) so old APKs keep parsing what
 * they already read â€” but `totalOutstandingPaise` is now NET of partial remittances/credits,
 * not gross `commissionDue`. `TechnicianCommissionDueSchema` (v1) stays registered in the
 * OpenAPI registry until Task 13 swaps it for this one.
 */
export const TechnicianCommissionDueV2Schema = z.object({
  totalOutstandingPaise: z.number().int().nonnegative(),
  dueCount: z.number().int().nonnegative(),
  hold: z.object({
    state: HoldStateSchema,
    warnPaise: z.number().int().nonnegative(),
    blockPaise: z.number().int().nonnegative(),
    enforcementEnabled: z.boolean(),
    override: z.object({ until: z.string(), reason: z.string() }).optional(),
  }),
  entries: z.array(
    z.object({
      bookingId: z.string(),
      serviceName: z.string().optional(),
      slotDate: z.string().optional(),
      bookingAmount: z.number().int().nonnegative(),
      cashCollectedAmount: z.number().int().nonnegative().optional(),
      commissionDue: z.number().int().nonnegative(),
      remittedAmount: z.number().int().nonnegative(),
      outstandingPaise: z.number().int().nonnegative(),
      collectionMethod: CollectionMethodSchema.optional(),
      remittanceStatus: RemittanceStatusSchema,
      createdAt: z.string(),
    }),
  ),
  remittances: z.array(
    z.object({
      id: z.string(),

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content api/src/schemas/booking.ts -TotalCount 220; Write-Output '--- package'; Get-Content api/package.json" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 1101ms:
import { z } from 'zod';
import { PendingAddOnSchema } from './addon-approval.js';
import { CollectionMethodSchema } from './commission-receivable.js';

const BOOKING_STATUSES = [
  'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE',
  'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED',
  'UNFULFILLED', 'CUSTOMER_CANCELLED', 'NO_SHOW_REDISPATCH',
] as const;

const PAYMENT_METHODS = ['RAZORPAY', 'CASH_ON_SERVICE'] as const;
const CASH_COLLECTION_STATUSES = ['PENDING', 'COLLECTED'] as const;

export const LatLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export const PaymentMethodSchema = z.enum(PAYMENT_METHODS);
export const CashCollectionStatusSchema = z.enum(CASH_COLLECTION_STATUSES);
/** E21-S02: why the collected cash fell short of the booking amount. Read-path widening only. */
export const ShortCollectionReasonSchema = z.enum(['customer_short', 'discount_given', 'other']);

export const BookingDocSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  serviceId: z.string(),
  serviceName: z.string().optional(),
  categoryId: z.string(),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotWindow: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/),
  addressText: z.string().min(1),
  addressLatLng: LatLngSchema,
  status: z.enum(BOOKING_STATUSES),
  paymentOrderId: z.string(),
  paymentMethod: PaymentMethodSchema.optional(),
  cashCollectionStatus: CashCollectionStatusSchema.optional(),
  /** E21-S01: ISO timestamp when the technician confirmed cash collection at job completion. Audit/visibility only â€” does not gate the commission receivable. */
  cashCollectedAt: z.string().optional(),
  /** E21-S01: Actual cash amount (paise) the technician confirmed collecting. May differ from finalAmount. */
  cashCollectedAmount: z.number().int().nonnegative().optional(),
  /** E21-S02: how the money changed hands at the door (completion-time), denormalised onto the commission receivable at settlement. Distinct from paymentMethod. Read-path widening only. */
  collectionMethod: CollectionMethodSchema.optional(),
  /** E21-S02: why the collected cash fell short of the booking amount, when the technician flags it at completion. Read-path widening only. */
  shortCollectionReason: ShortCollectionReasonSchema.optional(),
  paymentId: z.string().nullable(),
  paymentSignature: z.string().nullable(),
  amount: z.number().int().positive(),
  technicianId: z.string().optional(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  feesWaived: z.boolean().optional(),
  escalated: z.boolean().optional(),
  internalNotes: z.array(z.string()).optional(),
  photos: z.record(z.string(), z.array(z.string())).optional(),
  pendingAddOns: z.array(PendingAddOnSchema).optional(),
  approvedAddOns: z.array(PendingAddOnSchema).optional(),
  finalAmount: z.number().int().positive().optional(),
  /** ISO timestamp written atomically after redispatch offers are sent successfully. */
  noShowRedispatchAt: z.string().optional(),
  /** The technician who no-showed. Preserved separately so the exclusion filter works across timer recovery runs even after technicianId is cleared. */
  noShowTechnicianId: z.string().optional(),
  /** ISO timestamp written after the NO_SHOW_CREDIT_ISSUED FCM push is sent successfully. Prevents duplicate pushes across recovery runs. */
  noShowPushSentAt: z.string().optional(),
  /** ISO timestamp written when customer triggers Safety SOS. */
  sosActivatedAt: z.string().optional(),
  /** ISO timestamp written after sendOwnerSosAlert() succeeds. Absent = alert pending retry. */
  sosAlertSentAt: z.string().optional(),
  /**
   * ISO timestamp written atomically when the booking transitions to AWAITING_PRICE_APPROVAL
   * (i.e. when the technician requests an add-on). Used by the bookings change-feed projector
   * to anchor the ADDON_APPROVAL_REQUESTED expiresAt from the actual request time, not from
   * the booking's original createdAt (which may be >24h in the past for advance bookings).
   */
  pendingAddOnsUpdatedAt: z.string().optional(),
  /** PRD-08: Customer preference for a female technician. Stored on the booking for dispatcher awareness. */
  preferFemaleTechnician: z.boolean().optional(),
  /**
   * E13-S01 (P1-6): Wallet credit amount in paise that is PENDING debit for a Razorpay booking.
   * Written at booking creation time (before Razorpay order); deducted from the ledger only
   * after payment.captured is received from the Razorpay webhook. Absent = no credit pending.
   * Once the webhook debits the credit, this field should be removed (or left as a historical record).
   */
  pendingCreditAmountInPaise: z.number().int().nonnegative().optional(),
  /**
   * E13-S01 (P1-6): Idempotency key for the pending credit debit above.
   * Stored so the webhook can call applyCredit idempotently on re-delivery.
   */
  pendingCreditIdempotencyKey: z.string().optional(),
});

export const CreateBookingRequestSchema = z.object({
  serviceId: z.string().min(1),
  categoryId: z.string().min(1),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotWindow: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/),
  addressText: z.string().min(1),
  addressLatLng: LatLngSchema,
  paymentMethod: PaymentMethodSchema.default('RAZORPAY'),
  /**
   * E13-S01: If true, the server will attempt to apply the customer's wallet
   * credit balance against this booking's amount. The actual applied amount is
   * returned as `appliedCreditAmount` in the response (may be 0 if no balance).
   * Requires an `Idempotency-Key: <uuid>` header for replay protection.
   */
  applyCredit: z.boolean().optional().default(false),
  /** PRD-08: Customer preference for a female technician. Passed to the dispatcher. */
  preferFemaleTechnician: z.boolean().optional(),
});

export const ConfirmBookingRequestSchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const PhotoStageResponseSchema = z.object({
  urls: z.array(z.string().url()),
});

export const GetBookingResponseSchema = z.object({
  bookingId: z.string(),
  status: BookingDocSchema.shape.status,
  amount: z.number().int().positive(),
  finalAmount: z.number().int().positive().nullable(),
  pendingAddOns: z.array(PendingAddOnSchema).default([]),
  approvedAddOns: z.array(PendingAddOnSchema).default([]),
  photos: z.record(z.string(), PhotoStageResponseSchema).optional(),
  reportSignedUrl: z.string().url().nullable().optional(),
});

export type BookingDoc = z.infer<typeof BookingDocSchema>;
export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>;
export type ConfirmBookingRequest = z.infer<typeof ConfirmBookingRequestSchema>;
export type GetBookingResponse = z.infer<typeof GetBookingResponseSchema>;
--- package
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path api/src/cosmos/catalogue-repository.ts -Pattern "getCategoryById|getServiceByIdCrossPartition" -Context 2,6' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 707ms:

  api\src\cosmos\catalogue-repository.ts:43:  }
  api\src\cosmos\catalogue-repository.ts:44:
> api\src\cosmos\catalogue-repository.ts:45:  async getCategoryById(id: string): Promise<ServiceCategory | null> {
  api\src\cosmos\catalogue-repository.ts:46:    const { resources } = await this.cats.items
  api\src\cosmos\catalogue-repository.ts:47:      .query<ServiceCategory>({
  api\src\cosmos\catalogue-repository.ts:48:        query: 'SELECT * FROM c WHERE c.id = @id',
  api\src\cosmos\catalogue-repository.ts:49:        parameters: [{ name: '@id', value: id }],
  api\src\cosmos\catalogue-repository.ts:50:      })
  api\src\cosmos\catalogue-repository.ts:51:      .fetchAll();
  api\src\cosmos\catalogue-repository.ts:60:
  api\src\cosmos\catalogue-repository.ts:61:  async updateCategory(id: string, body: UpdateCategoryBody, uid: string): 
Promise<ServiceCategory | null> {
> api\src\cosmos\catalogue-repository.ts:62:    const existing = await this.getCategoryById(id);
  api\src\cosmos\catalogue-repository.ts:63:    if (!existing) return null;
  api\src\cosmos\catalogue-repository.ts:64:    const updated: ServiceCategory = { ...existing, ...definedOnly(body), 
id, updatedBy: uid, updatedAt: now() };
  api\src\cosmos\catalogue-repository.ts:65:    const { resource } = await 
this.cats.items.upsert<ServiceCategory>(updated);
  api\src\cosmos\catalogue-repository.ts:66:    return resource!;
  api\src\cosmos\catalogue-repository.ts:67:  }
  api\src\cosmos\catalogue-repository.ts:68:
  api\src\cosmos\catalogue-repository.ts:69:  async toggleCategory(id: string, uid: string): Promise<ServiceCategory | 
null> {
> api\src\cosmos\catalogue-repository.ts:70:    const existing = await this.getCategoryById(id);
  api\src\cosmos\catalogue-repository.ts:71:    if (!existing) return null;
  api\src\cosmos\catalogue-repository.ts:72:    const updated = { ...existing, isActive: !existing.isActive, 
updatedBy: uid, updatedAt: now() };
  api\src\cosmos\catalogue-repository.ts:73:    const { resource } = await 
this.cats.items.upsert<ServiceCategory>(updated);
  api\src\cosmos\catalogue-repository.ts:74:    return resource!;
  api\src\cosmos\catalogue-repository.ts:75:  }
  api\src\cosmos\catalogue-repository.ts:76:
  api\src\cosmos\catalogue-repository.ts:96:  }
  api\src\cosmos\catalogue-repository.ts:97:
> api\src\cosmos\catalogue-repository.ts:98:  async getServiceByIdCrossPartition(id: string): Promise<Service | null> {
  api\src\cosmos\catalogue-repository.ts:99:    const { resources } = await this.svcs.items
  api\src\cosmos\catalogue-repository.ts:100:      .query<Service>({ query: 'SELECT * FROM c WHERE c.id = @id', 
parameters: [{ name: '@id', value: id }] })
  api\src\cosmos\catalogue-repository.ts:101:      .fetchAll();
  api\src\cosmos\catalogue-repository.ts:102:    return resources[0] ?? null;
  api\src\cosmos\catalogue-repository.ts:103:  }
  api\src\cosmos\catalogue-repository.ts:104:
  api\src\cosmos\catalogue-repository.ts:110:
  api\src\cosmos\catalogue-repository.ts:111:  async updateService(id: string, body: UpdateServiceBody, uid: string): 
Promise<Service | null> {
> api\src\cosmos\catalogue-repository.ts:112:    const existing = await this.getServiceByIdCrossPartition(id);
  api\src\cosmos\catalogue-repository.ts:113:    if (!existing) return null;
  api\src\cosmos\catalogue-repository.ts:114:    const updated: Service = { ...existing, ...definedOnly(body), id, 
categoryId: existing.categoryId, updatedBy: uid, updatedAt: now() };
  api\src\cosmos\catalogue-repository.ts:115:    const { resource } = await this.svcs.item(id, 
existing.categoryId).replace<Service>(updated);
  api\src\cosmos\catalogue-repository.ts:116:    return resource!;
  api\src\cosmos\catalogue-repository.ts:117:  }
  api\src\cosmos\catalogue-repository.ts:118:
  api\src\cosmos\catalogue-repository.ts:119:  async toggleService(id: string, uid: string): Promise<Service | null> {
> api\src\cosmos\catalogue-repository.ts:120:    const existing = await this.getServiceByIdCrossPartition(id);
  api\src\cosmos\catalogue-repository.ts:121:    if (!existing) return null;
  api\src\cosmos\catalogue-repository.ts:122:    const updated = { ...existing, isActive: !existing.isActive, 
updatedBy: uid, updatedAt: now() };
  api\src\cosmos\catalogue-repository.ts:123:    const { resource } = await this.svcs.item(id, 
existing.categoryId).replace<Service>(updated);
  api\src\cosmos\catalogue-repository.ts:124:    return resource!;
  api\src\cosmos\catalogue-repository.ts:125:  }
  api\src\cosmos\catalogue-repository.ts:126:



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path api/src/**/*.ts,api/scripts/*.ts -Pattern "paymentMethod" -Context 1,3 | Select-Object -First 80 | ForEach-Object { $_.Path + '"':' + "'$_.LineNumber + '"':' + "'$_.Line.Trim() }' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 645ms:
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:37:const paymentMethod = req.paymentMethod ?? 'RAZORPAY';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:46:paymentMethod,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:47:...(paymentMethod === 'CASH_ON_SERVICE' ? { cashCollectionStatus: 'PENDING' as const } : {}),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:261:if (parsed.data.paymentMethod === 'CASH_ON_SERVICE') {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:300:paymentMethod: 'CASH_ON_SERVICE',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:316:paymentMethod: 'CASH_ON_SERVICE',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:324:const manualRequest = { ...parsed.data, paymentMethod: 'CASH_ON_SERVICE' as const };
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:352:paymentMethod: 'CASH_ON_SERVICE',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:458:paymentMethod: 'CREDIT_FULL',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:476:paymentMethod: 'CREDIT_FULL',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:591:paymentMethod: 'RAZORPAY',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:605:paymentMethod: 'RAZORPAY',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:697:paymentMethod: booking.paymentMethod ?? 'RAZORPAY',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:52:const paymentMethod = booking.paymentMethod ?? 'CASH_ON_SERVICE';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:62:if (paymentMethod !== 'RAZORPAY') {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:18:export const PaymentMethodSchema = z.enum(PAYMENT_METHODS);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:38:paymentMethod: PaymentMethodSchema.optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:44:/** E21-S02: how the money changed hands at the door (completion-time), denormalised onto the commission receivable at settlement. Distinct from paymentMethod. Read-path widening only. */
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:101:paymentMethod: PaymentMethodSchema.default('RAZORPAY'),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:15:/** E24: how the money changed hands at the door (completion-time). Distinct from booking.paymentMethod. */
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:73:if ((booking.paymentMethod ?? 'CASH_ON_SERVICE') === 'RAZORPAY') {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\scripts\backfill-historical-receivables.ts:35:// Legacy docs may omit paymentMethod entirely; those default to cash, matching recordCommissionDue.
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\scripts\backfill-historical-receivables.ts:37:"SELECT * FROM c WHERE c.status = 'COMPLETED' AND (NOT IS_DEFINED(c.paymentMethod) OR c.paymentMethod != 'RAZORPAY')";

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content api/src/functions/trigger-booking-completed.ts -TotalCount 140; Write-Output '--- booking repo'; Get-Content api/src/cosmos/booking-repository.ts -TotalCount 90" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 643ms:
import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'node:crypto';
import { BookingDocSchema } from '../schemas/booking.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { walletLedgerRepo } from '../cosmos/wallet-ledger-repository.js';
import { arePayoutsEnabled } from '../shared/payouts-enabled.js';
import { getTechnicianForSettlement, incrementCompletedJobCount } from '../cosmos/technician-repository.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import { calculateCommission } from '../services/commission.service.js';
import { getGlobalCommissionBps, resolveCommissionBps } from '../services/commission-config.service.js';
import { RazorpayRouteService } from '../services/razorpayRoute.service.js';
import { sendTechEarningsUpdate } from '../services/fcm.service.js';
import { settleCashCompletion } from '../services/commission-settlement.service.js';
import type { AuditAction } from '../types/admin.js';

const DB_NAME = process.env['COSMOS_DATABASE'] ?? 'homeservices';

function systemAuditEntry(action: AuditAction, resourceId: string, payload: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  return appendAuditEntry({
    id: randomUUID(),
    adminId: 'system',
    role: 'system',
    action,
    resourceType: 'booking',
    resourceId,
    payload,
    timestamp,
    partitionKey: timestamp.slice(0, 7),
  });
}

function hasRazorpayCredentials(): boolean {
  return Boolean(process.env['RAZORPAY_KEY_ID'] && process.env['RAZORPAY_KEY_SECRET']);
}

export async function settleBooking(bookingRaw: unknown, ctx: InvocationContext): Promise<void> {
  const parsed = BookingDocSchema.safeParse(bookingRaw);
  if (!parsed.success || parsed.data.status !== 'COMPLETED') return;

  const booking = parsed.data;
  const { id: bookingId, technicianId } = booking;

  if (!technicianId) {
    ctx.log(`settleBooking: COMPLETED booking ${bookingId} has no technicianId â€” skipping`);
    return;
  }

  const paymentMethod = booking.paymentMethod ?? 'CASH_ON_SERVICE';
  const bookingAmount = booking.finalAmount ?? booking.amount;

  // â”€â”€ CASH_ON_SERVICE path (pilot default) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Technician already holds the cash; platform records a commission receivable.
  // No money transfer to technician. Side effects (audit, job-count increment, FCM) live in
  // settleCashCompletion so this trigger and the synchronous active-job COMPLETED transition
  // (Task 9) share exactly-once semantics regardless of which one wins the race to create the
  // receivable row. A throwing recordCommissionDue (inside settleCashCompletion) propagates â€”
  // see handleBookingCompletedBatch below for why that must not be swallowed.
  if (paymentMethod !== 'RAZORPAY') {
    await settleCashCompletion(booking, { log: (s) => ctx.log(s) });
    return;
  }

  // â”€â”€ RAZORPAY path (guarded â€” dead in cash pilot, preserved for re-enablement) â”€
  // P0-0: credential presence is NOT a guard. This branch transfers money to the
  // technician on INSTANT cadence; it must respect the same explicit kill switch as
  // the payout timers. See shared/payouts-enabled.ts.
  if (!arePayoutsEnabled()) {
    ctx.log(`settleBooking: RAZORPAY booking ${bookingId} but PAYOUTS_DISABLED_SKIP`);
    return;
  }

  if (!hasRazorpayCredentials()) {
    ctx.log(`settleBooking: RAZORPAY booking ${bookingId} but no Razorpay credentials configured â€” skipping`);
    return;
  }

  const existingLedger = await walletLedgerRepo.getByBookingId(bookingId, technicianId);
  if (existingLedger) {
    ctx.log(`settleBooking: wallet entry already exists for ${bookingId} (status=${existingLedger.payoutStatus}) â€” skipping`);
    return;
  }

  try {
    await systemAuditEntry('ROUTE_TRANSFER_ATTEMPT', bookingId, { technicianId, bookingAmount });
  } catch (auditErr: unknown) {
    Sentry.captureException(auditErr);
  }

  const [tech, globalBpsRazorpay, serviceRazorpay, categoryRazorpay] = await Promise.all([
    getTechnicianForSettlement(technicianId),
    getGlobalCommissionBps(),
    catalogueRepo.getServiceByIdCrossPartition(booking.serviceId),
    catalogueRepo.getCategoryById(booking.categoryId),
  ]);
  const completedJobCount = tech?.completedJobCount ?? 0;
  const { bps: resolvedBps } = resolveCommissionBps({
    ...(serviceRazorpay?.commissionBps !== undefined ? { serviceBps: serviceRazorpay.commissionBps } : {}),
    ...(categoryRazorpay?.commissionBps !== undefined ? { categoryBps: categoryRazorpay.commissionBps } : {}),
    globalBps: globalBpsRazorpay,
  });
  const { commissionBps, commissionAmount, techAmount: techAmountBeforeFee } = calculateCommission(
    bookingAmount,
    resolvedBps,
  );

  const rawCadence = tech?.payoutCadence;
  const cadence: 'WEEKLY' | 'NEXT_DAY' | 'INSTANT' =
    rawCadence === 'INSTANT' || rawCadence === 'NEXT_DAY' || rawCadence === 'WEEKLY'
      ? rawCadence
      : 'WEEKLY';

  let effectiveCadence = cadence;
  let payoutFeeAmount = 0;
  let techAmount = techAmountBeforeFee;

  if (cadence === 'INSTANT') {
    if (techAmountBeforeFee > 2500) {
      payoutFeeAmount = 2500;
      techAmount = techAmountBeforeFee - 2500;
    } else {
      effectiveCadence = 'WEEKLY';
    }
  } else if (cadence === 'NEXT_DAY') {
    if (techAmountBeforeFee > 1500) {
      payoutFeeAmount = 1500;
      techAmount = techAmountBeforeFee - 1500;
    } else {
      effectiveCadence = 'WEEKLY';
    }
  }

  const heldForCadence = effectiveCadence !== 'INSTANT';

  const created = await walletLedgerRepo.createPendingEntry({
    bookingId,
    technicianId,
--- booking repo
import { randomUUID } from 'node:crypto';
import { getBookingsContainer } from './client.js';
import type { BookingDoc, CreateBookingRequest } from '../schemas/booking.js';
import type { PendingAddOn, AddOnDecision } from '../schemas/addon-approval.js';
import { normalizeAddressText } from '../shared/address-text.js';

function now() { return new Date().toISOString(); }

export interface BookingCreateMetadata {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceName?: string;
}

export interface BookingCreateCreditOptions {
  /**
   * E13-S01 (P1-6): When set, the wallet credit debit is DEFERRED to the Razorpay webhook.
   * Stored on the booking doc so the webhook can apply the credit after payment.captured.
   * Not applicable to CASH_ON_SERVICE bookings (those apply credit synchronously).
   */
  pendingCreditAmountInPaise?: number;
  /** Idempotency key for the deferred credit debit (required when pendingCreditAmountInPaise > 0). */
  pendingCreditIdempotencyKey?: string;
}

export const bookingRepo = {
  async createPending(
    req: CreateBookingRequest,
    customerId: string,
    paymentOrderId: string,
    amount: number,
    metadata: BookingCreateMetadata = {},
    bookingId?: string,
    creditOptions?: BookingCreateCreditOptions,
  ): Promise<BookingDoc> {
    const paymentMethod = req.paymentMethod ?? 'RAZORPAY';
    const doc: BookingDoc = {
      id: bookingId ?? randomUUID(), customerId, ...req,
      addressText: normalizeAddressText(req.addressText),
      ...(metadata.customerName ? { customerName: metadata.customerName } : {}),
      ...(metadata.customerPhone ? { customerPhone: metadata.customerPhone } : {}),
      ...(metadata.customerEmail ? { customerEmail: metadata.customerEmail } : {}),
      ...(metadata.serviceName ? { serviceName: metadata.serviceName } : {}),
      status: 'PENDING_PAYMENT', paymentOrderId,
      paymentMethod,
      ...(paymentMethod === 'CASH_ON_SERVICE' ? { cashCollectionStatus: 'PENDING' as const } : {}),
      paymentId: null, paymentSignature: null,
      amount, createdAt: now(),
      // E13-S01 (P1-6): Store pending credit info for deferred debit in webhook
      ...(creditOptions?.pendingCreditAmountInPaise && creditOptions.pendingCreditAmountInPaise > 0
        ? {
            pendingCreditAmountInPaise: creditOptions.pendingCreditAmountInPaise,
            pendingCreditIdempotencyKey: creditOptions.pendingCreditIdempotencyKey,
          }
        : {}),
    };
    const { resource } = await getBookingsContainer().items.create<BookingDoc>(doc);
    return resource!;
  },

  async getById(id: string): Promise<BookingDoc | null> {
    const { resource } = await getBookingsContainer().item(id, id).read<BookingDoc>();
    return resource ?? null;
  },

  async confirmPayment(
    id: string,
    paymentId: string,
    paymentSignature: string,
  ): Promise<BookingDoc | null> {
    const { resource: existing, etag } = await getBookingsContainer().item(id, id).read<BookingDoc>();
    if (!existing) return null;
    if (existing.status === 'PAID') return existing; // webhook already processed â€” idempotent success
    if (existing.status !== 'PENDING_PAYMENT') return null;
    const updated: BookingDoc = { ...existing, status: 'SEARCHING', paymentId, paymentSignature };
    const useEtag = process.env.BOOKINGS_ETAG_GUARDS === 'on';
    if (useEtag) {
      try {
        const { resource } = await getBookingsContainer()
          .item(id, id)
          .replace<BookingDoc>(updated, { accessCondition: { type: 'IfMatch', condition: etag ?? '' } });
        return resource ?? null;
      } catch (e: unknown) {
        if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: number }).code === 412) {
          return null; // lost ETag race â€” idempotent by design
        }
        throw e;
      }
    }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path api/src/functions/*.ts -Pattern "settleCashCompletion|COMPLETED" -Context 2,4 | Select-Object -First 120' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 790ms:

  api\src\functions\active-job-photos.ts:9:import { verifyTechnicianToken } from 
'../middleware/verifyTechnicianToken.js';
  api\src\functions\active-job-photos.ts:10:
> api\src\functions\active-job-photos.ts:11:const PHOTO_STAGES = ['EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED'] 
as const;
  api\src\functions\active-job-photos.ts:12:
  api\src\functions\active-job-photos.ts:13:// Each booking status maps to exactly one valid photo stage: the next 
transition target.
  api\src\functions\active-job-photos.ts:14:const VALID_PHOTO_STAGE: Partial<Record<string, string>> = {
  api\src\functions\active-job-photos.ts:15:  ASSIGNED: 'EN_ROUTE',
  api\src\functions\active-job-photos.ts:16:  EN_ROUTE: 'REACHED',
  api\src\functions\active-job-photos.ts:17:  REACHED: 'IN_PROGRESS',
> api\src\functions\active-job-photos.ts:18:  IN_PROGRESS: 'COMPLETED',
  api\src\functions\active-job-photos.ts:19:};
  api\src\functions\active-job-photos.ts:20:
  api\src\functions\active-job-photos.ts:21:// Storage path pattern: 
bookings/{bookingId}/photos/{technicianUid}/{stage}/{timestamp}.jpg
  api\src\functions\active-job-photos.ts:22:// Group 1 = bookingId, Group 2 = technicianUid, Group 3 = stage
  api\src\functions\active-job.ts:9:import { haversine } from '../cosmos/geo.js';
  api\src\functions\active-job.ts:10:import { sendBookingStatusUpdatePush, sendLocationUpdatePush } from 
'../services/fcm.service.js';
> api\src\functions\active-job.ts:11:import { settleCashCompletion } from 
'../services/commission-settlement.service.js';
  api\src\functions\active-job.ts:12:import { auditLog } from '../services/auditLog.service.js';
  api\src\functions\active-job.ts:13:import type { BookingDoc as _BookingDoc } from '../schemas/booking.js';
  api\src\functions\active-job.ts:14:import { CollectionMethodSchema } from '../schemas/commission-receivable.js';
  api\src\functions\active-job.ts:15:import { ShortCollectionReasonSchema } from '../schemas/booking.js';
  api\src\functions\active-job.ts:16:import { normalizeAddressText } from '../shared/address-text.js';
  api\src\functions\active-job.ts:17:
> api\src\functions\active-job.ts:18:const TRANSITION_ORDER = ['ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 
'COMPLETED'] as const;
  api\src\functions\active-job.ts:19:const AVG_CITY_SPEED_KMH = 20;
  api\src\functions\active-job.ts:20:type TransitionStatus = (typeof TRANSITION_ORDER)[number];
  api\src\functions\active-job.ts:21:
  api\src\functions\active-job.ts:22:function isLegalTransition(from: string, to: string): boolean {
  api\src\functions\active-job.ts:27:
  api\src\functions\active-job.ts:28:const TransitionBodySchema = z.object({
> api\src\functions\active-job.ts:29:  targetStatus: z.enum(['EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED']),
  api\src\functions\active-job.ts:30:  currentLocation: z.object({
  api\src\functions\active-job.ts:31:    lat: z.number().min(-90).max(90),
  api\src\functions\active-job.ts:32:    lng: z.number().min(-180).max(180),
  api\src\functions\active-job.ts:33:  }).optional(),
  api\src\functions\active-job.ts:36:    gpsAccuracyM: z.number(),
  api\src\functions\active-job.ts:37:  }).optional(),
> api\src\functions\active-job.ts:38:  /** E21-S01: Set true on COMPLETED to confirm the technician collected cash 
from the customer. */
  api\src\functions\active-job.ts:39:  cashCollected: z.boolean().optional(),
  api\src\functions\active-job.ts:40:  /** E21-S01: Cash amount in paise the technician collected. Only honoured when 
cashCollected=true. */
  api\src\functions\active-job.ts:41:  collectedAmount: z.number().int().nonnegative().optional(),
  api\src\functions\active-job.ts:42:  /** E21-S02: how the money changed hands at the door. Only honoured when 
cashCollected=true; defaults to CASH. */
  api\src\functions\active-job.ts:122:  const updated = await updateBookingFields(bookingId, {
  api\src\functions\active-job.ts:123:    status: body.targetStatus,
> api\src\functions\active-job.ts:124:    ...(body.targetStatus === 'COMPLETED'
  api\src\functions\active-job.ts:125:      ? {
> api\src\functions\active-job.ts:126:          completedAt: now,
  api\src\functions\active-job.ts:127:          ...(body.cashCollected === true
  api\src\functions\active-job.ts:128:            ? {
  api\src\functions\active-job.ts:129:                cashCollectionStatus: 'COLLECTED' as const,
  api\src\functions\active-job.ts:130:                cashCollectedAt: now,
  api\src\functions\active-job.ts:150:  });
  api\src\functions\active-job.ts:151:
> api\src\functions\active-job.ts:152:  if (body.targetStatus === 'COMPLETED') {
  api\src\functions\active-job.ts:153:    try {
> api\src\functions\active-job.ts:154:      // E21-S02 Codex P1 fix: settleCashCompletion internally guards RAZORPAY 
bookings
  api\src\functions\active-job.ts:155:      // (skipped: 'NOT_CASH') and only fires side effects for whichever caller 
actually
  api\src\functions\active-job.ts:156:      // creates the receivable — see commission-settlement.service.ts.
> api\src\functions\active-job.ts:157:      await settleCashCompletion(updated, { log: (s) => ctx.log(s) });
  api\src\functions\active-job.ts:158:    } catch (e: unknown) {
  api\src\functions\active-job.ts:159:      // The change-feed trigger is the at-least-once catch-up; never fail the 
transition here.
  api\src\functions\active-job.ts:160:      Sentry.captureException(e);
  api\src\functions\active-job.ts:161:    }
  api\src\functions\bookings.ts:25:import { getStorageDownloadUrlWithTtl, checkStorageFileExists } from 
'../firebase/admin.js';
  api\src\functions\bookings.ts:26:
> api\src\functions\bookings.ts:27:const PHOTO_STAGE_ORDER = ['EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED'] as 
const;
  api\src\functions\bookings.ts:28:const PHOTO_SIGNED_URL_TTL_SECONDS = 300;
  api\src\functions\bookings.ts:29:const REPORT_SIGNED_URL_TTL_SECONDS = 300;
  api\src\functions\bookings.ts:30:
  api\src\functions\bookings.ts:31:async function projectPhotos(
  api\src\functions\bookings.ts:74:  status: string,
  api\src\functions\bookings.ts:75:): Promise<string | null> {
> api\src\functions\bookings.ts:76:  if (status !== 'COMPLETED') return null;
  api\src\functions\bookings.ts:77:  const reportPath = `reports/${bookingId}/service-report.pdf`;
  api\src\functions\bookings.ts:78:  try {
  api\src\functions\bookings.ts:79:    const exists = await checkStorageFileExists(reportPath);
  api\src\functions\bookings.ts:80:    if (!exists) return null;
  api\src\functions\ratings.ts:38:  if (data.side === 'CUSTOMER_TO_TECH' && !isCustomer) return { status: 403, 
jsonBody: { code: 'FORBIDDEN' } };
  api\src\functions\ratings.ts:39:  if (data.side === 'TECH_TO_CUSTOMER' && !isTechnician) return { status: 403, 
jsonBody: { code: 'FORBIDDEN' } };
> api\src\functions\ratings.ts:40:  if (!['COMPLETED', 'PAID', 'CLOSED'].includes(booking.status)) {
  api\src\functions\ratings.ts:41:    return { status: 409, jsonBody: { code: 'BOOKING_NOT_CLOSED', status: 
booking.status } };
  api\src\functions\ratings.ts:42:  }
  api\src\functions\ratings.ts:43:  if (!booking.technicianId) return { status: 409, jsonBody: { code: 'NO_TECHNICIAN' 
} };
  api\src\functions\ratings.ts:44:  // Rating Shield (E07-S02) is advisory — it notifies the owner and starts a 2-hour 
window,
  api\src\functions\shield-report.ts:22:  'IN_PROGRESS',
  api\src\functions\shield-report.ts:23:  'AWAITING_PRICE_APPROVAL',
> api\src\functions\shield-report.ts:24:  'COMPLETED',
  api\src\functions\shield-report.ts:25:  'PAID',
  api\src\functions\shield-report.ts:26:  'CLOSED',
  api\src\functions\shield-report.ts:27:]);
  api\src\functions\shield-report.ts:28:
  api\src\functions\technicians.ts:324:              FROM c
  api\src\functions\technicians.ts:325:              WHERE c.technicianId = @techId
> api\src\functions\technicians.ts:326:                AND c.status IN ('COMPLETED', 'PAID')
  api\src\functions\technicians.ts:327:                AND c.slotDate >= @sinceDate`,
  api\src\functions\technicians.ts:328:      parameters: [
  api\src\functions\technicians.ts:329:        { name: '@techId', value: technicianId },
  api\src\functions\technicians.ts:330:        { name: '@sinceDate', value: sinceDate },
  api\src\functions\trigger-booking-completed.ts:8:import { walletLedgerRepo } from 
'../cosmos/wallet-ledger-repository.js';
  api\src\functions\trigger-booking-completed.ts:9:import { arePayoutsEnabled } from '../shared/payouts-enabled.js';
> api\src\functions\trigger-booking-completed.ts:10:import { getTechnicianForSettlement, incrementCompletedJobCount } 
from '../cosmos/technician-repository.js';
  api\src\functions\trigger-booking-completed.ts:11:import { appendAuditEntry } from 
'../cosmos/audit-log-repository.js';
  api\src\functions\trigger-booking-completed.ts:12:import { calculateCommission } from 
'../services/commission.service.js';
  api\src\functions\trigger-booking-completed.ts:13:import { getGlobalCommissionBps, resolveCommissionBps } from 
'../services/commission-config.service.js';
  api\src\functions\trigger-booking-completed.ts:14:import { RazorpayRouteService } from 
'../services/razorpayRoute.service.js';
  api\src\functions\trigger-booking-completed.ts:15:import { sendTechEarningsUpdate } from 
'../services/fcm.service.js';
> api\src\functions\trigger-booking-completed.ts:16:import { settleCashCompletion } from 
'../services/commission-settlement.service.js';
  api\src\functions\trigger-booking-completed.ts:17:import type { AuditAction } from '../types/admin.js';
  api\src\functions\trigger-booking-completed.ts:18:
  api\src\functions\trigger-booking-completed.ts:19:const DB_NAME = process.env['COSMOS_DATABASE'] ?? 'homeservices';
  api\src\functions\trigger-booking-completed.ts:20:
  api\src\functions\trigger-booking-completed.ts:40:export async function settleBooking(bookingRaw: unknown, ctx: 
InvocationContext): Promise<void> {
  api\src\functions\trigger-booking-completed.ts:41:  const parsed = BookingDocSchema.safeParse(bookingRaw);
> api\src\functions\trigger-booking-completed.ts:42:  if (!parsed.success || parsed.data.status !== 'COMPLETED') 
return;
  api\src\functions\trigger-booking-completed.ts:43:
  api\src\functions\trigger-booking-completed.ts:44:  const booking = parsed.data;
  api\src\functions\trigger-booking-completed.ts:45:  const { id: bookingId, technicianId } = booking;
  api\src\functions\trigger-booking-completed.ts:46:
  api\src\functions\trigger-booking-completed.ts:47:  if (!technicianId) {
> api\src\functions\trigger-booking-completed.ts:48:    ctx.log(`settleBooking: COMPLETED booking ${bookingId} has no 
technicianId — skipping`);
  api\src\functions\trigger-booking-completed.ts:49:    return;
  api\src\functions\trigger-booking-completed.ts:50:  }
  api\src\functions\trigger-booking-completed.ts:51:
  api\src\functions\trigger-booking-completed.ts:52:  const paymentMethod = booking.paymentMethod ?? 'CASH_ON_SERVICE';
  api\src\functions\trigger-booking-completed.ts:56:  // Technician already holds the cash; platform records a 
commission receivable.
  api\src\functions\trigger-booking-completed.ts:57:  // No money transfer to technician. Side effects (audit, 
job-count increment, FCM) live in
> api\src\functions\trigger-booking-completed.ts:58:  // settleCashCompletion so this trigger and the synchronous 
active-job COMPLETED transition
  api\src\functions\trigger-booking-completed.ts:59:  // (Task 9) share exactly-once semantics regardless of which one 
wins the race to create the
> api\src\functions\trigger-booking-completed.ts:60:  // receivable row. A throwing recordCommissionDue (inside 
settleCashCompletion) propagates —
> api\src\functions\trigger-booking-completed.ts:61:  // see handleBookingCompletedBatch below for why that must not 
be swallowed.
  api\src\functions\trigger-booking-completed.ts:62:  if (paymentMethod !== 'RAZORPAY') {
> api\src\functions\trigger-booking-completed.ts:63:    await settleCashCompletion(booking, { log: (s) => ctx.log(s) 
});
  api\src\functions\trigger-booking-completed.ts:64:    return;
  api\src\functions\trigger-booking-completed.ts:65:  }
  api\src\functions\trigger-booking-completed.ts:66:
  api\src\functions\trigger-booking-completed.ts:67:  // ── RAZORPAY path (guarded — dead in cash pilot, preserved for 
re-enablement) ─
  api\src\functions\trigger-booking-completed.ts:97:    catalogueRepo.getCategoryById(booking.categoryId),
  api\src\functions\trigger-booking-completed.ts:98:  ]);
> api\src\functions\trigger-booking-completed.ts:99:  const completedJobCount = tech?.completedJobCount ?? 0;
  api\src\functions\trigger-booking-completed.ts:100:  const { bps: resolvedBps } = resolveCommissionBps({
  api\src\functions\trigger-booking-completed.ts:101:    ...(serviceRazorpay?.commissionBps !== undefined ? { 
serviceBps: serviceRazorpay.commissionBps } : {}),
  api\src\functions\trigger-booking-completed.ts:102:    ...(categoryRazorpay?.commissionBps !== undefined ? { 
categoryBps: categoryRazorpay.commissionBps } : {}),
  api\src\functions\trigger-booking-completed.ts:103:    globalBps: globalBpsRazorpay,
  api\src\functions\trigger-booking-completed.ts:140:    technicianId,
  api\src\functions\trigger-booking-completed.ts:141:    bookingAmount,
> api\src\functions\trigger-booking-completed.ts:142:    completedJobCountAtSettlement: completedJobCount,
  api\src\functions\trigger-booking-completed.ts:143:    commissionBps,
  api\src\functions\trigger-booking-completed.ts:144:    commissionAmount,
  api\src\functions\trigger-booking-completed.ts:145:    techAmount,
  api\src\functions\trigger-booking-completed.ts:146:    payoutCadence: effectiveCadence,
  api\src\functions\trigger-booking-completed.ts:191:
  api\src\functions\trigger-booking-completed.ts:192:  try {
> api\src\functions\trigger-booking-completed.ts:193:    await incrementCompletedJobCount(technicianId);
  api\src\functions\trigger-booking-completed.ts:194:    await sendTechEarningsUpdate(technicianId, { bookingId, 
techAmount });
  api\src\functions\trigger-booking-completed.ts:195:  } catch (err: unknown) {
  api\src\functions\trigger-booking-completed.ts:196:    Sentry.captureException(err);
  api\src\functions\trigger-booking-completed.ts:197:  }
  api\src\functions\trigger-booking-completed.ts:207: * processed successfully in this batch is safe.
  api\src\functions\trigger-booking-completed.ts:208: */
> api\src\functions\trigger-booking-completed.ts:209:export async function handleBookingCompletedBatch(documents: 
unknown[], context: InvocationContext): Promise<void> {
  api\src\functions\trigger-booking-completed.ts:210:  for (const doc of documents) {
  api\src\functions\trigger-booking-completed.ts:211:    try {
  api\src\functions\trigger-booking-completed.ts:212:      await settleBooking(doc, context);
  api\src\functions\trigger-booking-completed.ts:213:    } catch (err: unknown) {
  api\src\functions\trigger-booking-completed.ts:221:}
  api\src\functions\trigger-booking-completed.ts:222:
> api\src\functions\trigger-booking-completed.ts:223:app.cosmosDB('triggerBookingCompleted', {
  api\src\functions\trigger-booking-completed.ts:224:  connection: 'COSMOS_CONNECTION_STRING',
  api\src\functions\trigger-booking-completed.ts:225:  databaseName: DB_NAME,
  api\src\functions\trigger-booking-completed.ts:226:  containerName: 'bookings',
> api\src\functions\trigger-booking-completed.ts:227:  leaseContainerName: 'booking_completed_leases',
  api\src\functions\trigger-booking-completed.ts:228:  createLeaseContainerIfNotExists: true,
  api\src\functions\trigger-booking-completed.ts:229:  startFromBeginning: false,
> api\src\functions\trigger-booking-completed.ts:230:  handler: handleBookingCompletedBatch,
  api\src\functions\trigger-booking-completed.ts:231:});
  api\src\functions\trigger-no-show-detector.ts:94:
  api\src\functions\trigger-no-show-detector.ts:95:    // ── Recovery skip check 
───────────────────────────────────────────────────────
> api\src\functions\trigger-no-show-detector.ts:96:    // On recovery (creditCreated=false), check which downstream 
steps already completed.
  api\src\functions\trigger-no-show-detector.ts:97:    // `noShowRedispatchAt` is set after successful offers-sent.
  api\src\functions\trigger-no-show-detector.ts:98:    // `noShowPushSentAt` is set after successful FCM push.
  api\src\functions\trigger-no-show-detector.ts:99:    // Replacement-tech check: if ASSIGNED with a different 
technicianId and noShowTechId
  api\src\functions\trigger-no-show-detector.ts:100:    // is known, the redispatch already resolved — skip entirely.
  api\src\functions\trigger-no-show-detector.ts:126:      if (liveBooking?.noShowRedispatchAt && 
liveBooking.noShowPushSentAt) {
  api\src\functions\trigger-no-show-detector.ts:127:        // Both redispatch and push done — nothing left to do
> api\src\functions\trigger-no-show-detector.ts:128:        ctx.log(`detectNoShows: recovery skipped for ${booking.id} 
— all steps already completed`);
  api\src\functions\trigger-no-show-detector.ts:129:        continue;
  api\src\functions\trigger-no-show-detector.ts:130:      }
  api\src\functions\trigger-no-show-detector.ts:131:    }
  api\src\functions\trigger-no-show-detector.ts:132:
  api\src\functions\trigger-no-show-detector.ts:139:    let statusWriteOk = false;
  api\src\functions\trigger-no-show-detector.ts:140:    if (freshBooking.status === 'SEARCHING') {
> api\src\functions\trigger-no-show-detector.ts:141:      statusWriteOk = true; // Step 1 was completed by the prior 
run that crashed in Step 2.
  api\src\functions\trigger-no-show-detector.ts:142:    } else {
  api\src\functions\trigger-no-show-detector.ts:143:      try {
  api\src\functions\trigger-no-show-detector.ts:144:        await updateBookingFields(booking.id, {
  api\src\functions\trigger-no-show-detector.ts:145:          status: 'NO_SHOW_REDISPATCH',
  api\src\functions\trigger-no-show-detector.ts:156:    // ── Step 2: Redispatch 
────────────────────────────────────────────────────────
  api\src\functions\trigger-no-show-detector.ts:157:    // Only when status write succeeded (dispatcher checks for 
NO_SHOW_REDISPATCH status).
> api\src\functions\trigger-no-show-detector.ts:158:    // Skip if noShowRedispatchAt already set (recovery: prior run 
completed this step).
  api\src\functions\trigger-no-show-detector.ts:159:    // noShowTechId is passed explicitly so the exclusion filter 
survives even after
  api\src\functions\trigger-no-show-detector.ts:160:    // technicianId was cleared from the booking doc in Step 1.
  api\src\functions\trigger-no-show-detector.ts:161:    let redispatchOk = false;
  api\src\functions\trigger-no-show-detector.ts:162:    if (statusWriteOk && !freshBooking.noShowRedispatchAt) {
  api\src\functions\trigger-no-show-detector.ts:165:      const preDispatchDoc = await bookingRepo.getById(booking.id);
  api\src\functions\trigger-no-show-detector.ts:166:      if (preDispatchDoc?.noShowRedispatchAt) {
> api\src\functions\trigger-no-show-detector.ts:167:        // Concurrent run completed the step.
  api\src\functions\trigger-no-show-detector.ts:168:        redispatchOk = true;
> api\src\functions\trigger-no-show-detector.ts:169:        ctx.log(`detectNoShows: redispatch already completed 
concurrently for ${booking.id}`);
  api\src\functions\trigger-no-show-detector.ts:170:      } else if (preDispatchDoc?.status === 'SEARCHING') {
  api\src\functions\trigger-no-show-detector.ts:171:        // Prior run called redispatch() (moving the booking to 
SEARCHING) but crashed before
  api\src\functions\trigger-no-show-detector.ts:172:        // writing noShowRedispatchAt. The dispatch attempt is 
live — just write the timestamp.
  api\src\functions\trigger-no-show-detector.ts:173:        await updateBookingFields(booking.id, { 
noShowRedispatchAt: new Date().toISOString() });
  api\src\functions\trigger-no-show-detector.ts:204:      // Redispatch was already done on a prior run — mark ok for 
logging
  api\src\functions\trigger-no-show-detector.ts:205:      redispatchOk = true;
> api\src\functions\trigger-no-show-detector.ts:206:      ctx.log(`detectNoShows: redispatch already completed for 
${booking.id}`);
  api\src\functions\trigger-no-show-detector.ts:207:    }
  api\src\functions\trigger-no-show-detector.ts:208:
  api\src\functions\trigger-no-show-detector.ts:209:    // ── Step 3: FCM push 
──────────────────────────────────────────────────────────
  api\src\functions\trigger-no-show-detector.ts:210:    // Send when:
  api\src\functions\trigger-projector-bookings.ts:90:    const actionId = 
buildPendingActionId('ADDON_APPROVAL_REQUESTED', customerId, bookingId);
  api\src\functions\trigger-projector-bookings.ts:91:    await resolveAction(actionId, customerId);
> api\src\functions\trigger-projector-bookings.ts:92:  } else if (status === 'COMPLETED') {
  api\src\functions\trigger-projector-bookings.ts:93:    // Prompt customer to rate the technician.
> api\src\functions\trigger-projector-bookings.ts:94:    // expiresAt derived from booking.completedAt (stable) so 
replays are idempotent.
  api\src\functions\trigger-projector-bookings.ts:95:    const actionId = 
buildPendingActionId('RATING_PROMPT_CUSTOMER', customerId, bookingId);
  api\src\functions\trigger-projector-bookings.ts:96:    const { doc: upserted, noOp } = await upsertAction({
  api\src\functions\trigger-projector-bookings.ts:97:      id: actionId,
  api\src\functions\trigger-projector-bookings.ts:98:      userId: customerId,
  api\src\functions\trigger-projector-bookings.ts:100:      role: 'customer',
  api\src\functions\trigger-projector-bookings.ts:101:      sourceId: bookingId,
> api\src\functions\trigger-projector-bookings.ts:102:      expiresAt: stableExpiryFrom(doc.completedAt ?? 
doc.createdAt, RATING_PROMPT_EXPIRY_MS),
  api\src\functions\trigger-projector-bookings.ts:103:      priority: 5,
  api\src\functions\trigger-projector-bookings.ts:104:      payload: { bookingId, technicianId: doc.technicianId },
  api\src\functions\trigger-projector-bookings.ts:105:    });
  api\src\functions\trigger-projector-bookings.ts:106:    if (!noOp) {
  api\src\functions\trigger-reconcile-payouts.ts:5:import { randomUUID } from 'node:crypto';
  api\src\functions\trigger-reconcile-payouts.ts:6:import { walletLedgerRepo } from 
'../cosmos/wallet-ledger-repository.js';
> api\src\functions\trigger-reconcile-payouts.ts:7:import { getTechnicianForSettlement, incrementCompletedJobCount } 
from '../cosmos/technician-repository.js';
  api\src\functions\trigger-reconcile-payouts.ts:8:import { appendAuditEntry } from 
'../cosmos/audit-log-repository.js';
  api\src\functions\trigger-reconcile-payouts.ts:9:import { RazorpayRouteService } from 
'../services/razorpayRoute.service.js';
  api\src\functions\trigger-reconcile-payouts.ts:10:import { sendTechEarningsUpdate, sendOwnerRouteAlert } from 
'../services/fcm.service.js';
  api\src\functions\trigger-reconcile-payouts.ts:11:import { arePayoutsEnabled } from '../shared/payouts-enabled.js';
  api\src\functions\trigger-reconcile-payouts.ts:82:    await systemAuditEntry('RECON_RETRY_SUCCESS', { bookingId: 
entry.bookingId, transferId });
  api\src\functions\trigger-reconcile-payouts.ts:83:    try {
> api\src\functions\trigger-reconcile-payouts.ts:84:      await incrementCompletedJobCount(entry.technicianId);
  api\src\functions\trigger-reconcile-payouts.ts:85:      await sendTechEarningsUpdate(entry.technicianId, {
  api\src\functions\trigger-reconcile-payouts.ts:86:        bookingId: entry.bookingId,
  api\src\functions\trigger-reconcile-payouts.ts:87:        techAmount: entry.techAmount,
  api\src\functions\trigger-reconcile-payouts.ts:88:      });
  api\src\functions\trigger-service-report.ts:30:): Promise<void> {
  api\src\functions\trigger-service-report.ts:31:  const parsed = BookingDocSchema.safeParse(bookingRaw);
> api\src\functions\trigger-service-report.ts:32:  if (!parsed.success || parsed.data.status !== 'COMPLETED') return;
  api\src\functions\trigger-service-report.ts:33:
  api\src\functions\trigger-service-report.ts:34:  const booking = parsed.data;
  api\src\functions\trigger-service-report.ts:35:  if (!booking.technicianId) { ctx.log(`no technicianId on 
${booking.id}`); return; }
  api\src\functions\trigger-service-report.ts:36:



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm -C api typecheck' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 8869ms:

> homeservices-api@0.1.0 typecheck C:\Alok\Business Projects\wt-fix-cosmos-pages\api
> tsc --noEmit -p tsconfig.tests.json


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm -C api test -- tests/scripts/backfill-historical-receivables.test.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 2161ms:

> homeservices-api@0.1.0 test C:\Alok\Business Projects\wt-fix-cosmos-pages\api
> vitest run "tests/scripts/backfill-historical-receivables.test.ts"


[1m[7m[36m RUN [39m[27m[22m [36mv2.1.9 [39m[90mC:/Alok/Business Projects/wt-fix-cosmos-pages/api[39m

 [32m✓[39m tests/scripts/backfill-historical-receivables.test.ts [2m([22m[2m12 tests[22m[2m)[22m[90m 9[2mms[22m[39m

[2m Test Files [22m [1m[32m1 passed[39m[22m[90m (1)[39m
[2m      Tests [22m [1m[32m12 passed[39m[22m[90m (12)[39m
[2m   Start at [22m 07:14:44
[2m   Duration [22m 515ms[2m (transform 77ms, setup 0ms, collect 116ms, tests 9ms, environment 0ms, prepare 210ms)[22m


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --no-ext-diff --unified=80 5bfc0361aab64f7b637128c6c3fee9828a80393d -- api/scripts/backfill-historical-receivables.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 760ms:
diff --git a/api/scripts/backfill-historical-receivables.ts b/api/scripts/backfill-historical-receivables.ts
new file mode 100644
index 00000000..649ca1fb
--- /dev/null
+++ b/api/scripts/backfill-historical-receivables.ts
@@ -0,0 +1,169 @@
+#!/usr/bin/env tsx
+// One-off backfill for cash bookings that COMPLETED before the commission ledger physically
+// existed in an environment. In production the `commission_receivables` container was never
+// created (setup-cosmos.ts had not been run since E21-S01 shipped), so every completed cash
+// booking settled into a 404 and no receivable was ever recorded.
+//
+// Run (default, read-only): npx tsx scripts/backfill-historical-receivables.ts
+//                     apply: npx tsx scripts/backfill-historical-receivables.ts --apply
+//
+// Requires: COSMOS_CONNECTION_STRING, or COSMOS_ENDPOINT + COSMOS_KEY (see src/cosmos/client.ts).
+//
+// Deliberately calls `recordCommissionDue`, NOT `settleCashCompletion`: the latter also increments
+// completedJobCount and sends an EARNINGS_UPDATE push. Firing those for a job finished months ago
+// would double-count job totals and notify technicians about ancient work. The ledger row is what
+// is missing; the side effects already happened (or didn't) at the time.
+//
+// Idempotent: `recordCommissionDue` is keyed on bookingId and returns `created: false` for a row
+// that already exists, and this script skips such bookings before calling it at all.
+
+import { fileURLToPath } from 'node:url';
+import { argv } from 'node:process';
+import { getBookingsContainer } from '../src/cosmos/client.js';
+import { commissionReceivableRepo } from '../src/cosmos/commission-receivable-repository.js';
+import {
+  finalizeLedgerForTechnician,
+  recordCommissionDue,
+  resolveCommissionForBooking,
+} from '../src/services/commission-settlement.service.js';
+import { systemAudit } from '../src/services/auditLog.service.js';
+import { BookingDocSchema } from '../src/schemas/booking.js';
+
+const KNOWN_FLAGS = new Set(['--dry-run', '--apply']);
+
+// RAZORPAY bookings settle through the wallet-ledger path and must never get a cash receivable.
+// Legacy docs may omit paymentMethod entirely; those default to cash, matching recordCommissionDue.
+const QUERY =
+  "SELECT * FROM c WHERE c.status = 'COMPLETED' AND (NOT IS_DEFINED(c.paymentMethod) OR c.paymentMethod != 'RAZORPAY')";
+
+const rupees = (paise: number): string => `Rs ${(paise / 100).toFixed(2)}`;
+
+export async function main(argvArgs: string[]): Promise<void> {
+  const unknown = argvArgs.filter((a) => !KNOWN_FLAGS.has(a));
+  if (unknown.length > 0) {
+    console.error(`Unknown flag(s): ${unknown.join(', ')}`);
+    console.error('Usage: backfill-historical-receivables.ts [--dry-run|--apply]');
+    process.exit(2);
+    return;
+  }
+
+  const apply = argvArgs.includes('--apply');
+  if (apply && argvArgs.includes('--dry-run')) {
+    console.error('Pass either --dry-run or --apply, not both.');
+    process.exit(2);
+    return;
+  }
+
+  console.log(`historical commission-receivable backfill — mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
+  console.log('');
+
+  const iterator = getBookingsContainer().items.query({ query: QUERY }, { maxItemCount: 100 });
+  const bookings: unknown[] = [];
+  while (iterator.hasMoreResults()) {
+    const page = await iterator.fetchNext();
+    // Cosmos hands back `resources: undefined` on some pages — never spread it unguarded.
+    bookings.push(...(page.resources ?? []));
+  }
+
+  // Technicians who gained at least one row, so their credits can be consumed and their hold
+  // recomputed once at the end rather than per row.
+  const touched = new Set<string>();
+  let created = 0;
+  let alreadyPresent = 0;
+  let unparseable = 0;
+  let skipped = 0;
+  let totalPaise = 0;
+
+  for (const raw of bookings) {
+    const parsed = BookingDocSchema.safeParse(raw);
+    if (!parsed.success) {
+      unparseable += 1;
+      console.log(`  SKIP (unparseable) ${(raw as { id?: string })?.id ?? '<no id>'}`);
+      continue;
+    }
+    const booking = parsed.data;
+    if (!booking.technicianId) {
+      skipped += 1;
+      console.log(`  SKIP (no technician) ${booking.id}`);
+      continue;
+    }
+
+    const existing = await commissionReceivableRepo.getByBookingId(booking.id, booking.technicianId);
+    if (existing) {
+      alreadyPresent += 1;
+      console.log(`  HAVE ${booking.id}  ${rupees(existing.commissionDue)} already recorded`);
+      continue;
+    }
+
+    const preview = await resolveCommissionForBooking(booking);
+    totalPaise += preview.commissionDue;
+
+    if (!apply) {
+      console.log(
+        `  WOULD ADD ${booking.id}  tech=${booking.technicianId}  ${preview.serviceName ?? '<service?>'}  ` +
+          `booking=${rupees(preview.bookingAmount)}  bps=${preview.bps} (${preview.commissionResolvedFrom})  ` +
+          `commission=${rupees(preview.commissionDue)}`,
+      );
+      continue;
+    }
+
+    // Stamp the row with when the debt was actually incurred, not when this script ran:
+    // createdAt drives oldest-first remittance allocation and the hold's oldestDueAt.
+    const incurredAt = booking.completedAt ?? booking.createdAt;
+    const result = await recordCommissionDue(booking, { createdAt: incurredAt });
+    if ('skipped' in result) {
+      skipped += 1;
+      console.log(`  SKIP (${result.skipped}) ${booking.id}`);
+      continue;
+    }
+    if (!result.created) {
+      alreadyPresent += 1;
+      console.log(`  HAVE ${booking.id} (created concurrently)`);
+      continue;
+    }
+
+    created += 1;
+    touched.add(booking.technicianId);
+    console.log(
+      `  ADDED ${booking.id}  ${rupees(result.commissionDue)}  bps=${result.commissionBps}  dated ${incurredAt}`,
+    );
+    await systemAudit('COMMISSION_DUE_RECORDED', 'booking', booking.id, {
+      technicianId: booking.technicianId,
+      bookingAmount: preview.bookingAmount,
+      commissionBps: result.commissionBps,
+      commissionDue: result.commissionDue,
+      commissionResolvedFrom: result.commissionResolvedFrom,
+      // Distinguishes a retroactively created row from one the live settlement path wrote.
+      backfill: true,
+    });
+  }
+
+  // A technician may already hold open CREDIT docs (an overpaid remittance recorded before this
+  // backfill ran). New DUE rows must consume them, or the dashboard overstates what is owed.
+  // finalizeLedgerForTechnician runs consumePendingCredits and then recomputes the hold; it never
+  // throws.
+  for (const technicianId of touched) {
+    await finalizeLedgerForTechnician(technicianId);
+    console.log(`  FINALIZED ${technicianId} (credits consumed, hold recomputed)`);
+  }
+
+  console.log('');
+  console.log(
+    `scanned=${bookings.length} ${apply ? 'created' : 'wouldCreate'}=${apply ? created : bookings.length - alreadyPresent - unparseable - skipped} ` +
+      `alreadyPresent=${alreadyPresent} skipped=${skipped} unparseable=${unparseable}`,
+  );
+  console.log(`commission ${apply ? 'recorded' : 'that would be recorded'}: ${rupees(totalPaise)}`);
+  console.log('');
+  console.log(
+    apply
+      ? 'Apply complete. Holds were recomputed for every affected technician; run backfill-commission-holds.ts --apply if you want a full-roster sweep as well.'
+      : 'Dry-run complete — no writes made. Re-run with --apply to record the rows above.',
+  );
+}
+
+if (argv[1] && fileURLToPath(import.meta.url) === argv[1]) {
+  main(argv.slice(2)).catch((e) => {
+    console.error(e);
+    process.exit(1);
+  });
+}
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path api/src/**/*.ts,api/scripts/*.ts -Pattern \"createDueEntry\\(|recordCommissionDue\\(\" | ForEach-Object { "'$_.Path + '"':' + "'$_.LineNumber + '"':' + "'$_.Line.Trim() }' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 825ms:
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-receivable-repository.ts:26:async createDueEntry(input: CommissionReceivableCreateInput): Promise<boolean> {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:62:export async function recordCommissionDue(booking: BookingDoc,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:93:const created = await commissionReceivableRepo.createDueEntry({
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:168:const r = await recordCommissionDue(booking);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\scripts\backfill-historical-receivables.ts:113:const result = await recordCommissionDue(booking, { createdAt: incurredAt });

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/services/auditLog.service.ts -TotalCount 160; Select-String -Path api/src/types/admin.ts -Pattern "COMMISSION_DUE_RECORDED|AuditAction" -Context 0,4' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 794ms:
import * as Sentry from '@sentry/node';
import { randomUUID } from 'node:crypto';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import type { AdminRole, AuditAction } from '../types/admin.js';
import type { AuditLogDoc } from '../schemas/audit-log.js';

export interface AuditLogContext {
  adminId: string;
  role: AdminRole;
  sessionId?: string;
}

export async function auditLog(
  ctx: AuditLogContext,
  action: AuditAction,
  resourceType: string,
  resourceId: string,
  payload: Record<string, unknown>,
  extras?: { ip?: string; userAgent?: string },
): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const base: Omit<AuditLogDoc, 'ip' | 'userAgent'> = {
      id: randomUUID(),
      adminId: ctx.adminId,
      role: ctx.role,
      action,
      resourceType,
      resourceId,
      payload,
      timestamp,
      partitionKey: timestamp.slice(0, 7),
    };
    const doc: AuditLogDoc = {
      ...base,
      ...(extras?.ip !== undefined && { ip: extras.ip }),
      ...(extras?.userAgent !== undefined && { userAgent: extras.userAgent }),
    };
    await appendAuditEntry(doc);
  } catch (err) {
    Sentry.captureException(err);
  }
}

/**
 * Convenience helper for system-initiated audit entries (E21-S02 Task 12).
 * Calls auditLog with adminId='system' and role='system'.
 */
export async function systemAudit(
  action: AuditAction,
  resourceType: string,
  resourceId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  return auditLog({ adminId: 'system', role: 'system' }, action, resourceType, resourceId, payload);
}

> api\src\types\admin.ts:22:export type AuditAction =
  api\src\types\admin.ts:23:  // Admin auth (lowercase w/ dots for API compatibility)
  api\src\types\admin.ts:24:  | 'admin.login'
  api\src\types\admin.ts:25:  | 'admin.logout'
  api\src\types\admin.ts:26:  | 'admin.totp_setup'
> api\src\types\admin.ts:34:  | 'COMMISSION_DUE_RECORDED'
  api\src\types\admin.ts:35:  | 'COMMISSION_HOLD_OVERRIDDEN'
  api\src\types\admin.ts:36:  | 'COMMISSION_HOLD_OVERRIDE_CLEARED'
  api\src\types\admin.ts:37:  | 'COMMISSION_HOLD_RECOMPUTE_REQUESTED'
  api\src\types\admin.ts:38:  | 'COMMISSION_REMITTANCE_RECORDED'



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path api/src/**/*.ts -Pattern \"status: 'PAID'|status = 'PAID'|PAID|CLOSED\" -Context 1,2 | Select-Object -First 100" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 831ms:

  api\src\cosmos\booking-repository.ts:73:    if (!existing) return null;
> api\src\cosmos\booking-repository.ts:74:    if (existing.status === 'PAID') return existing; // webhook already 
processed — idempotent success
  api\src\cosmos\booking-repository.ts:75:    if (existing.status !== 'PENDING_PAYMENT') return null;
  api\src\cosmos\booking-repository.ts:76:    const updated: BookingDoc = { ...existing, status: 'SEARCHING', 
paymentId, paymentSignature };
  api\src\cosmos\booking-repository.ts:104:
> api\src\cosmos\booking-repository.ts:105:  async markPaid(id: string, paymentId: string): Promise<BookingDoc | null> 
{
  api\src\cosmos\booking-repository.ts:106:    const { resource: existing, etag } = await 
getBookingsContainer().item(id, id).read<BookingDoc>();
  api\src\cosmos\booking-repository.ts:107:    if (!existing || (existing.status !== 'SEARCHING' && existing.status 
!== 'PENDING_PAYMENT')) return null;
> api\src\cosmos\booking-repository.ts:108:    const updated: BookingDoc = { ...existing, status: 'PAID', paymentId };
  api\src\cosmos\booking-repository.ts:109:    const useEtag = process.env.BOOKINGS_ETAG_GUARDS === 'on';
  api\src\cosmos\booking-repository.ts:110:    if (useEtag) {
  api\src\cosmos\booking-repository.ts:137:      query: `SELECT * FROM c
> api\src\cosmos\booking-repository.ts:138:              WHERE c.status IN ('PAID', 'UNFULFILLED')
  api\src\cosmos\booking-repository.ts:139:                AND (NOT IS_DEFINED(c.technicianId) OR 
IS_NULL(c.technicianId))`,
  api\src\cosmos\booking-repository.ts:140:      parameters: [],
  api\src\cosmos\booking-repository.ts:161:                    'ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS',
> api\src\cosmos\booking-repository.ts:162:                    'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED'
  api\src\cosmos\booking-repository.ts:163:                  )`,
  api\src\cosmos\booking-repository.ts:164:        parameters: [{ name: '@technicianId', value: technicianId }],
  api\src\cosmos\commission-receivable-repository.ts:103:   * request. Earnings need ALL of them, not just DUE: a job 
whose commission was
> api\src\cosmos\commission-receivable-repository.ts:104:   * later remitted or waived was still a job the technician 
did and got paid for.
  api\src\cosmos\commission-receivable-repository.ts:105:   */
  api\src\cosmos\commission-receivable-repository.ts:106:  async getAllByTechnician(technicianId: string): 
Promise<CommissionReceivableEntry[]> {
  api\src\cosmos\wallet-ledger-repository.ts:37:
> api\src\cosmos\wallet-ledger-repository.ts:38:  async markPaid(bookingId: string, technicianId: string, 
razorpayTransferId: string): Promise<void> {
  api\src\cosmos\wallet-ledger-repository.ts:39:    const { resource } = await getWalletLedgerContainer()
  api\src\cosmos\wallet-ledger-repository.ts:40:      .item(bookingId, technicianId)
  api\src\cosmos\wallet-ledger-repository.ts:46:        ...resource,
> api\src\cosmos\wallet-ledger-repository.ts:47:        payoutStatus: 'PAID',
  api\src\cosmos\wallet-ledger-repository.ts:48:        razorpayTransferId,
  api\src\cosmos\wallet-ledger-repository.ts:49:        settledAt: new Date().toISOString(),
  api\src\cosmos\wallet-ledger-repository.ts:114:
> api\src\cosmos\wallet-ledger-repository.ts:115:  /** Returns only PENDING and PAID entries for the given technician 
(FAILED excluded at query level). */
  api\src\cosmos\wallet-ledger-repository.ts:116:  async getAllByTechnicianId(technicianId: string): 
Promise<WalletLedgerEntry[]> {
  api\src\cosmos\wallet-ledger-repository.ts:117:    const { resources } = await getWalletLedgerContainer()
  api\src\cosmos\wallet-ledger-repository.ts:118:      .items.query<WalletLedgerEntry>(
> api\src\cosmos\wallet-ledger-repository.ts:119:        { query: `SELECT * FROM c WHERE c.payoutStatus IN ('PENDING', 
'PAID')` },
  api\src\cosmos\wallet-ledger-repository.ts:120:        { partitionKey: technicianId },
  api\src\cosmos\wallet-ledger-repository.ts:121:      )
  api\src\functions\bookings.ts:269:    );
> api\src\functions\bookings.ts:270:    const paid = await bookingRepo.markPaid(booking.id, 'cash_on_service_pending');
> api\src\functions\bookings.ts:271:    if (!paid) return { status: 500, jsonBody: { code: 
'BOOKING_CONFIRMATION_FAILED' } };
  api\src\functions\bookings.ts:272:
  api\src\functions\bookings.ts:273:    // E16-S02: Commit hold — converts 30 s soft hold to permanent slot record.
  api\src\functions\bookings.ts:331:    );
> api\src\functions\bookings.ts:332:    const paid = await bookingRepo.markPaid(booking.id, 
'manual_payment_not_configured');
> api\src\functions\bookings.ts:333:    if (!paid) return { status: 500, jsonBody: { code: 
'BOOKING_CONFIRMATION_FAILED' } };
  api\src\functions\bookings.ts:334:
  api\src\functions\bookings.ts:335:    // E16-S02: Commit hold (non-fatal)
  api\src\functions\bookings.ts:363:  // The actual ledger CREDIT_APPLIED entry is written in the Razorpay webhook 
(payment.captured),
> api\src\functions\bookings.ts:364:  // NOT here. This prevents the "debit-before-payment" bug where an 
unpaid/abandoned booking
  api\src\functions\bookings.ts:365:  // permanently consumes the customer's wallet credit.
  api\src\functions\bookings.ts:366:  //
> api\src\functions\bookings.ts:367:  // For the fully-credit-paid path (P1-5): if credit covers 100% of the booking, 
we skip
> api\src\functions\bookings.ts:368:  // Razorpay entirely and mark the booking PAID directly — no payment intent is 
needed.
  api\src\functions\bookings.ts:369:  let pendingCreditAmount = 0;
  api\src\functions\bookings.ts:370:  const creditEnabled = parsed.data.applyCredit && idempotencyKey
  api\src\functions\bookings.ts:381:
> api\src\functions\bookings.ts:382:  // P1-5: Credit covers 100% — skip Razorpay, mark PAID directly
  api\src\functions\bookings.ts:383:  if (payableAmount <= 0 && pendingCreditAmount > 0) {
  api\src\functions\bookings.ts:384:    const fullCreditOrderId = `credit_${randomUUID()}`;
  api\src\functions\bookings.ts:398:
> api\src\functions\bookings.ts:399:    // Apply credit synchronously for the fully-credit-paid path (no payment to 
wait for)
  api\src\functions\bookings.ts:400:    const appliedCreditAmount = await attemptCreditApplication(
  api\src\functions\bookings.ts:401:      customer.customerId,
  api\src\functions\bookings.ts:406:
> api\src\functions\bookings.ts:407:    // P1-1: Verify the credit was actually applied before marking PAID.
  api\src\functions\bookings.ts:408:    //
  api\src\functions\bookings.ts:409:    // attemptCreditApplication returns 0 (or a partial amount) when:
  api\src\functions\bookings.ts:412:    //
> api\src\functions\bookings.ts:413:    // If we mark PAID without the credit being applied, the customer gets a free
> api\src\functions\bookings.ts:414:    // or underpaid booking (the Razorpay order was skipped entirely).
  api\src\functions\bookings.ts:415:    //
  api\src\functions\bookings.ts:416:    // Safe fallback: reject with 409 so the customer retries. We cannot safely
  api\src\functions\bookings.ts:440:
> api\src\functions\bookings.ts:441:    // Mark PAID immediately (no Razorpay payment involved)
> api\src\functions\bookings.ts:442:    const paid = await bookingRepo.markPaid(booking.id, 'credit_full_payment');
> api\src\functions\bookings.ts:443:    if (!paid) return { status: 500, jsonBody: { code: 
'BOOKING_CONFIRMATION_FAILED' } };
  api\src\functions\bookings.ts:444:
  api\src\functions\bookings.ts:445:    // E16-S02: Commit hold — converts 30 s soft hold to permanent slot record.
  api\src\functions\bookings.ts:631:
> api\src\functions\bookings.ts:632:  // Only audit when this call actually performed the transition. If status is 
PAID the webhook
  api\src\functions\bookings.ts:633:  // already processed the booking — this is an idempotent confirm, not a new 
event.
  api\src\functions\bookings.ts:634:  if (confirmed.status === 'SEARCHING') {
  api\src\functions\rating-escalate.ts:35:  if (booking.customerId !== customer.customerId) return { status: 403, 
jsonBody: { code: 'FORBIDDEN' } };
> api\src\functions\rating-escalate.ts:36:  if (booking.status !== 'CLOSED') return { status: 409, jsonBody: { code: 
'BOOKING_NOT_CLOSED' } };
  api\src\functions\rating-escalate.ts:37:  if (!booking.technicianId) return { status: 409, jsonBody: { code: 
'NO_TECHNICIAN' } };
  api\src\functions\rating-escalate.ts:38:
  api\src\functions\ratings.ts:39:  if (data.side === 'TECH_TO_CUSTOMER' && !isTechnician) return { status: 403, 
jsonBody: { code: 'FORBIDDEN' } };
> api\src\functions\ratings.ts:40:  if (!['COMPLETED', 'PAID', 'CLOSED'].includes(booking.status)) {
> api\src\functions\ratings.ts:41:    return { status: 409, jsonBody: { code: 'BOOKING_NOT_CLOSED', status: 
booking.status } };
  api\src\functions\ratings.ts:42:  }
  api\src\functions\ratings.ts:43:  if (!booking.technicianId) return { status: 409, jsonBody: { code: 'NO_TECHNICIAN' 
} };
  api\src\functions\shield-report.ts:24:  'COMPLETED',
> api\src\functions\shield-report.ts:25:  'PAID',
> api\src\functions\shield-report.ts:26:  'CLOSED',
  api\src\functions\shield-report.ts:27:]);
  api\src\functions\shield-report.ts:28:
  api\src\functions\technicians.ts:325:              WHERE c.technicianId = @techId
> api\src\functions\technicians.ts:326:                AND c.status IN ('COMPLETED', 'PAID')
  api\src\functions\technicians.ts:327:                AND c.slotDate >= @sinceDate`,
  api\src\functions\technicians.ts:328:      parameters: [
  api\src\functions\trigger-booking-completed.ts:188:
> api\src\functions\trigger-booking-completed.ts:189:  await walletLedgerRepo.markPaid(bookingId, technicianId, 
transferId);
  api\src\functions\trigger-booking-completed.ts:190:  await systemAuditEntry('ROUTE_TRANSFER_INSTANT', bookingId, { 
transferId, techAmount, payoutFeeAmount });
  api\src\functions\trigger-booking-completed.ts:191:
  api\src\functions\trigger-next-day-payout.ts:72:
> api\src\functions\trigger-next-day-payout.ts:73:    await walletLedgerRepo.markPaid(bookingId, technicianId, 
transferId);
  api\src\functions\trigger-next-day-payout.ts:74:
  api\src\functions\trigger-next-day-payout.ts:75:    try {
  api\src\functions\trigger-projector-bookings.ts:87:    }
> api\src\functions\trigger-projector-bookings.ts:88:  } else if (status === 'PAID' || status === 'IN_PROGRESS') {
  api\src\functions\trigger-projector-bookings.ts:89:    // Booking moved past price-approval — resolve any pending 
ADDON_APPROVAL_REQUESTED
  api\src\functions\trigger-projector-bookings.ts:90:    const actionId = 
buildPendingActionId('ADDON_APPROVAL_REQUESTED', customerId, bookingId);
  api\src\functions\trigger-projector-complaints.ts:38:  bookingId: string;
> api\src\functions\trigger-projector-complaints.ts:39:  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  api\src\functions\trigger-projector-complaints.ts:40:  createdAt?: string;
  api\src\functions\trigger-projector-complaints.ts:41:}
  api\src\functions\trigger-projector-complaints.ts:45:/** Statuses that indicate closure */
> api\src\functions\trigger-projector-complaints.ts:46:const CLOSED_STATUSES = new Set(['RESOLVED', 'CLOSED']);
  api\src\functions\trigger-projector-complaints.ts:47:
  api\src\functions\trigger-projector-complaints.ts:48:/**
  api\src\functions\trigger-projector-complaints.ts:86:    }
> api\src\functions\trigger-projector-complaints.ts:87:  } else if (CLOSED_STATUSES.has(status)) {
  api\src\functions\trigger-projector-complaints.ts:88:    // Complaint resolved — close the pending action
  api\src\functions\trigger-projector-complaints.ts:89:    await resolveAction(actionId, customerId);
  api\src\functions\trigger-rating-prompt.ts:18:  const parsed = BookingDocSchema.safeParse(bookingRaw);
> api\src\functions\trigger-rating-prompt.ts:19:  if (!parsed.success || parsed.data.status !== 'CLOSED') return;
  api\src\functions\trigger-rating-prompt.ts:20:  const booking = parsed.data;
  api\src\functions\trigger-rating-prompt.ts:21:  if (!booking.technicianId) { ctx.log(`no technicianId on 
${booking.id}`); return; }
  api\src\functions\trigger-reconcile-payouts.ts:80:    // Transfer succeeded
> api\src\functions\trigger-reconcile-payouts.ts:81:    await walletLedgerRepo.markPaid(entry.bookingId, 
entry.technicianId, transferId);
  api\src\functions\trigger-reconcile-payouts.ts:82:    await systemAuditEntry('RECON_RETRY_SUCCESS', { bookingId: 
entry.bookingId, transferId });
  api\src\functions\trigger-reconcile-payouts.ts:83:    try {
  api\src\functions\webhooks.ts:59:
> api\src\functions\webhooks.ts:60:  if (booking.status === 'PAID') {
  api\src\functions\webhooks.ts:61:    return { status: 200, jsonBody: { received: true } };
  api\src\functions\webhooks.ts:62:  }
  api\src\functions\webhooks.ts:63:
> api\src\functions\webhooks.ts:64:  const updated = await bookingRepo.markPaid(booking.id, paymentId);
  api\src\functions\webhooks.ts:65:  if (!updated) {
  api\src\functions\webhooks.ts:66:    return { status: 200, jsonBody: { received: true } };
  api\src\functions\webhooks.ts:71:  // "debit-before-payment" bug. Now that payment is confirmed, debit the ledger.
> api\src\functions\webhooks.ts:72:  // Non-fatal: if credit application fails, the booking is already PAID — log and 
continue.
  api\src\functions\webhooks.ts:73:  if (
  api\src\functions\webhooks.ts:74:    booking.pendingCreditAmountInPaise &&
  api\src\functions\webhooks.ts:101:    } catch (creditErr: unknown) {
> api\src\functions\webhooks.ts:102:      // Credit application failure is non-fatal — booking is already PAID.
  api\src\functions\webhooks.ts:103:      // The pending credit fields remain on the booking doc for manual 
reconciliation.
  api\src\functions\webhooks.ts:104:      Sentry.captureException(creditErr);
  api\src\functions\webhooks.ts:116:      distinctId: booking.customerId,
> api\src\functions\webhooks.ts:117:      event: 'booking-paid',
  api\src\functions\webhooks.ts:118:      properties: {
  api\src\functions\webhooks.ts:119:        bookingId: booking.id,
  api\src\functions\webhooks.ts:126:
> api\src\functions\webhooks.ts:127:  // Event-ID replay defense written AFTER successful markPaid so a transient
  api\src\functions\webhooks.ts:128:  // Cosmos failure before this point does not permanently suppress Razorpay 
retries.
  api\src\functions\webhooks.ts:129:  // Best-effort: non-409 Cosmos errors are logged but never block the webhook ack.
  api\src\schemas\booking.ts:6:  'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE',
> api\src\schemas\booking.ts:7:  'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED',
  api\src\schemas\booking.ts:8:  'UNFULFILLED', 'CUSTOMER_CANCELLED', 'NO_SHOW_REDISPATCH',
  api\src\schemas\booking.ts:9:] as const;
  api\src\schemas\order.ts:7:  'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE', 'REACHED',
> api\src\schemas\order.ts:8:  'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED',
  api\src\schemas\order.ts:9:  'UNFULFILLED', 'CUSTOMER_CANCELLED', 'NO_SHOW_REDISPATCH',
  api\src\schemas\order.ts:10:  // Legacy alias used by older clients — kept for backward-compat
  api\src\schemas\wallet-ledger.ts:2:
> api\src\schemas\wallet-ledger.ts:3:export const WalletLedgerPayoutStatusSchema = z.enum(['PENDING', 'PAID', 
'FAILED']);
  api\src\schemas\wallet-ledger.ts:4:export type WalletLedgerPayoutStatus = z.infer<typeof 
WalletLedgerPayoutStatusSchema>;
  api\src\schemas\wallet-ledger.ts:5:
  api\src\services\commission-allocator.service.ts:28:  if (allocs.some((a) => a.source === 'WAIVER')) return 'WAIVED';
> api\src\services\commission-allocator.service.ts:29:  const paid = allocs.reduce((s, a) => s + a.paise, 0);
> api\src\services\commission-allocator.service.ts:30:  return paid >= e.commissionDue ? 'REMITTED' : 'DUE';
  api\src\services\commission-allocator.service.ts:31:}
  api\src\services\commission-allocator.service.ts:32:
  api\src\services\commission-allocator.service.ts:59:   *  `matches` validates a replayed CONFLICT against the 
request (idempotency-key mismatch guard);
> api\src\services\commission-allocator.service.ts:60:   *  the default is FAIL-CLOSED — it requires 
`existing.amountPaise` to be a number equal to
  api\src\services\commission-allocator.service.ts:61:   *  `input.paise`, and rejects (IDEMPOTENCY_MISMATCH) on 
anything else, including it being absent
  api\src\services\commission-allocator.service.ts:62:   *  or non-numeric. Any anchor type that does not carry 
`amountPaise` MUST supply its own `matches`. */
  api\src\services\commission-allocator.service.ts:121:      if (existing) {
> api\src\services\commission-allocator.service.ts:122:        // Fail-closed default: an anchor type without a 
numeric amountPaise MUST supply `matches`.
  api\src\services\commission-allocator.service.ts:123:        const matches = input.anchor.matches
  api\src\services\commission-allocator.service.ts:124:          ? input.anchor.matches(existing)
  api\src\services\dispatcher.service.ts:74:      console.log(`DISPATCH_WAITING_FOR_TECHS bookingId=${bookingId}`);
> api\src\services\dispatcher.service.ts:75:      if (booking.status !== 'PAID') {
> api\src\services\dispatcher.service.ts:76:        await updateBookingFields(bookingId, { status: 'PAID' });
  api\src\services\dispatcher.service.ts:77:      }
  api\src\services\dispatcher.service.ts:78:      return false;
  api\src\services\dispatcher.service.ts:143:    const booking = await bookingRepo.getById(bookingId);
> api\src\services\dispatcher.service.ts:144:    if (!booking || booking.status !== 'PAID') {
  api\src\services\dispatcher.service.ts:145:      console.log(`DISPATCH_SKIP bookingId=${bookingId} 
status=${booking?.status ?? 'NOT_FOUND'}`);
  api\src\services\dispatcher.service.ts:146:      return;
  api\src\services\featureFlags.service.ts:77: * When false: `applyCredit: true` in the booking request is silently 
ignored
> api\src\services\featureFlags.service.ts:78: * (no credit applied, no error) — safe fail-closed so credit spend is 
controlled.
  api\src\services\featureFlags.service.ts:79: * When true: credit is applied up to min(balance, bookingAmount), a 
CREDIT_APPLIED
  api\src\services\featureFlags.service.ts:80: * ledger entry is written, and `appliedCreditAmount` is returned.
  api\src\services\featureFlags.service.ts:85: *
> api\src\services\featureFlags.service.ts:86: * Fail-closed contracts (credit = money — never silently spend):
  api\src\services\featureFlags.service.ts:87: *   - init() resolves with success=false → return false
  api\src\services\featureFlags.service.ts:88: *   - init() throws → return false
  api\src\services\featureFlags.service.ts:98:    const result = await gb.init({ timeout: 1000 });
> api\src\services\featureFlags.service.ts:99:    if (!result.success) return false; // timeout → fail closed
  api\src\services\featureFlags.service.ts:100:    return gb.isOn('customer.wallet-credit.enabled');
  api\src\services\featureFlags.service.ts:101:  } catch {
> api\src\services\featureFlags.service.ts:102:    return false; // unexpected SDK throw → fail closed
  api\src\services\featureFlags.service.ts:103:  }
  api\src\services\featureFlags.service.ts:104:}
  api\src\services\pending-action-projector.ts:171:/**
> api\src\services\pending-action-projector.ts:172: * Mark a pending action as RESOLVED (e.g., booking moves to PAID 
after add-on).
  api\src\services\pending-action-projector.ts:173: * Bumps version via ETag optimistic concurrency. Is a no-op if 
already RESOLVED.
  api\src\services\pending-action-projector.ts:174: */
  api\src\services\service-area.service.ts:24: * @param lng     - Longitude (WGS-84). Valid range: -180..180.
> api\src\services\service-area.service.ts:25: * @param polygon - A GeoJSON Feature<Polygon> with a closed exterior 
ring
  api\src\services\service-area.service.ts:26: *                  (first coordinate === last coordinate).
  api\src\services\service-area.service.ts:27: *
  api\src\shared\payouts-enabled.ts:1:/**
> api\src\shared\payouts-enabled.ts:2: * P0-0 — Kill switch for the dormant prepaid (Razorpay Route) payout machinery.
  api\src\shared\payouts-enabled.ts:3: *
  api\src\shared\payouts-enabled.ts:4: * The pilot is cash-only: the technician collects cash at the door and *owes* 
the
> api\src\shared\payouts-enabled.ts:5: * platform a commission (see `commission_receivables`). The prepaid-era code 
paths
  api\src\shared\payouts-enabled.ts:6: * move money in the opposite direction — they pay the technician out.
  api\src\shared\payouts-enabled.ts:7: *



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/active-job.ts -TotalCount 190' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 754ms:
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import { type HttpHandler, type InvocationContext, app } from '@azure/functions';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { requireIntegrity } from '../middleware/requireIntegrity.js';
import { bookingRepo, updateBookingFields } from '../cosmos/booking-repository.js';
import { bookingEventRepo } from '../cosmos/booking-event-repository.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { haversine } from '../cosmos/geo.js';
import { sendBookingStatusUpdatePush, sendLocationUpdatePush } from '../services/fcm.service.js';
import { settleCashCompletion } from '../services/commission-settlement.service.js';
import { auditLog } from '../services/auditLog.service.js';
import type { BookingDoc as _BookingDoc } from '../schemas/booking.js';
import { CollectionMethodSchema } from '../schemas/commission-receivable.js';
import { ShortCollectionReasonSchema } from '../schemas/booking.js';
import { normalizeAddressText } from '../shared/address-text.js';

const TRANSITION_ORDER = ['ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED'] as const;
const AVG_CITY_SPEED_KMH = 20;
type TransitionStatus = (typeof TRANSITION_ORDER)[number];

function isLegalTransition(from: string, to: string): boolean {
  const fromIdx = TRANSITION_ORDER.indexOf(from as TransitionStatus);
  const toIdx = TRANSITION_ORDER.indexOf(to as TransitionStatus);
  return fromIdx !== -1 && toIdx === fromIdx + 1;
}

const TransitionBodySchema = z.object({
  targetStatus: z.enum(['EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED']),
  currentLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  attestation: z.object({
    isMock: z.boolean(),
    gpsAccuracyM: z.number(),
  }).optional(),
  /** E21-S01: Set true on COMPLETED to confirm the technician collected cash from the customer. */
  cashCollected: z.boolean().optional(),
  /** E21-S01: Cash amount in paise the technician collected. Only honoured when cashCollected=true. */
  collectedAmount: z.number().int().nonnegative().optional(),
  /** E21-S02: how the money changed hands at the door. Only honoured when cashCollected=true; defaults to CASH. */
  collectionMethod: CollectionMethodSchema.optional(),
  /** E21-S02: why the collected amount fell short of the booking amount. */
  shortCollectionReason: ShortCollectionReasonSchema.optional(),
});

export const getActiveJobHandler: HttpHandler = async (req, _ctx: InvocationContext) => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  }

  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.technicianId !== uid) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };

  const service = await catalogueRepo.getServiceByIdCrossPartition(booking.serviceId);

  return {
    status: 200,
    jsonBody: {
      bookingId: booking.id,
      customerId: booking.customerId,
      serviceId: booking.serviceId,
      serviceName: service?.name ?? '',
      addressText: normalizeAddressText(booking.addressText),
      addressLatLng: booking.addressLatLng,
      status: booking.status,
      slotDate: booking.slotDate,
      slotWindow: booking.slotWindow,
    },
  };
};

export const transitionStatusHandler: HttpHandler = async (req, ctx: InvocationContext) => {
  let uid: string;
  try {
    ({ uid } = await verifyTechnicianToken(req));
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  }

  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.technicianId !== uid) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };

  let body: z.infer<typeof TransitionBodySchema>;
  try {
    const raw: unknown = await req.json();
    const result = TransitionBodySchema.safeParse(raw);
    if (!result.success) {
      return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: result.error.issues } };
    }
    body = result.data;
  } catch {
    return { status: 400, jsonBody: { code: 'PARSE_ERROR' } };
  }

  if (!isLegalTransition(booking.status, body.targetStatus)) {
    return {
      status: 409,
      jsonBody: { code: 'ILLEGAL_TRANSITION', from: booking.status, to: body.targetStatus },
    };
  }

  // Warn in Sentry if the technician's device reported a mock/spoofed GPS fix.
  // Non-blocking: we allow the transition through and flag for investigation.
  if (body.attestation?.isMock === true) {
    Sentry.withScope((scope) => {
      scope.setLevel('warning');
      scope.setExtras({ bookingId, technicianId: uid, gpsAccuracyM: body.attestation!.gpsAccuracyM });
      Sentry.captureMessage('MARK_REACHED with mock location');
    });
  }

  const now = new Date().toISOString();
  const updated = await updateBookingFields(bookingId, {
    status: body.targetStatus,
    ...(body.targetStatus === 'COMPLETED'
      ? {
          completedAt: now,
          ...(body.cashCollected === true
            ? {
                cashCollectionStatus: 'COLLECTED' as const,
                cashCollectedAt: now,
                ...(body.collectedAmount !== undefined
                  ? { cashCollectedAmount: body.collectedAmount }
                  : {}),
                collectionMethod: body.collectionMethod ?? 'CASH',
                ...(body.shortCollectionReason !== undefined
                  ? { shortCollectionReason: body.shortCollectionReason }
                  : {}),
              }
            : {}),
        }
      : {}),
  });
  if (!updated) return { status: 500, jsonBody: { code: 'UPDATE_FAILED' } };

  await bookingEventRepo.append({
    bookingId,
    event: 'STATUS_TRANSITION',
    technicianId: uid,
    metadata: { from: booking.status, to: body.targetStatus },
  });

  if (body.targetStatus === 'COMPLETED') {
    try {
      // E21-S02 Codex P1 fix: settleCashCompletion internally guards RAZORPAY bookings
      // (skipped: 'NOT_CASH') and only fires side effects for whichever caller actually
      // creates the receivable â€” see commission-settlement.service.ts.
      await settleCashCompletion(updated, { log: (s) => ctx.log(s) });
    } catch (e: unknown) {
      // The change-feed trigger is the at-least-once catch-up; never fail the transition here.
      Sentry.captureException(e);
    }
    if (body.cashCollected === true) {
      await auditLog({ adminId: 'system', role: 'system' }, 'CASH_COLLECTION_RECORDED', 'booking', bookingId, {
        technicianId: uid,
        collectedAmount: body.collectedAmount,
        collectionMethod: body.collectionMethod ?? 'CASH',
        shortCollectionReason: body.shortCollectionReason,
      });
    }
  }

  await sendBookingStatusUpdatePush({
    customerId: updated.customerId,
    bookingId,
    status: updated.status,
  }).catch((err: unknown) => ctx.error('FCM BOOKING_STATUS_UPDATE failed', err));
  if (body.currentLocation) {
    const etaMinutes = Math.max(
      0,
      Math.round(
        (haversine(
          body.currentLocation.lat,
          body.currentLocation.lng,
          updated.addressLatLng.lat,
          updated.addressLatLng.lng,
        ) / AVG_CITY_SPEED_KMH) * 60,
      ),
    );
    await sendLocationUpdatePush({
      customerId: updated.customerId,

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content api/src/functions/ratings.ts -TotalCount 140; Select-String -Path api/src/**/*.ts -Pattern \"updateBookingFields\\(.*CLOSED|status.*CLOSED\" -Context 0,3" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 919ms:
import { type HttpHandler, type HttpResponseInit, type InvocationContext, app } from '@azure/functions';
import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { ratingRepo } from '../cosmos/rating-repository.js';
import { SubmitRatingRequestSchema, type GetRatingResponse } from '../schemas/rating.js';
import type { CustomerSubScores, TechSubScores } from '../schemas/rating.js';
import { sendRatingReceivedPush } from '../services/fcm.service.js';
import * as Sentry from '@sentry/node';

async function uidFromAuth(authHeader: string): Promise<string | null> {
  if (!authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = await verifyFirebaseIdToken(authHeader.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

export const submitRatingHandler: HttpHandler = async (req, _ctx: InvocationContext) => {
  const uid = await uidFromAuth(req.headers.get('authorization') ?? '');
  if (!uid) return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };

  let body: unknown;
  try { body = await req.json(); } catch { return { status: 400, jsonBody: { code: 'PARSE_ERROR' } }; }
  const parsed = SubmitRatingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }
  const data = parsed.data;

  const booking = await bookingRepo.getById(data.bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };

  const isCustomer = booking.customerId === uid;
  const isTechnician = booking.technicianId === uid;
  if (!isCustomer && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (data.side === 'CUSTOMER_TO_TECH' && !isCustomer) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (data.side === 'TECH_TO_CUSTOMER' && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (!['COMPLETED', 'PAID', 'CLOSED'].includes(booking.status)) {
    return { status: 409, jsonBody: { code: 'BOOKING_NOT_CLOSED', status: booking.status } };
  }
  if (!booking.technicianId) return { status: 409, jsonBody: { code: 'NO_TECHNICIAN' } };
  // Rating Shield (E07-S02) is advisory â€” it notifies the owner and starts a 2-hour window,
  // but the customer can always post their rating at any time ("Post anyway" button, or after
  // the timer expires). The shield does NOT block submission here; enforcement is client-side.
  // See docs/stories/E07-S02-rating-shield-escalation.md Â§ AC-4 and AC-5.

  const result = await ratingRepo.submitSide({
    bookingId: data.bookingId,
    customerId: booking.customerId,
    technicianId: booking.technicianId,
    side: data.side,
    overall: data.overall,
    subScores: data.subScores,
    ...(data.comment !== undefined ? { comment: data.comment } : {}),
  });
  if (!result) return { status: 409, jsonBody: { code: 'RATING_ALREADY_SUBMITTED' } };
  if (
    data.side === 'CUSTOMER_TO_TECH' &&
    data.overall < 5 &&
    data.comment &&
    data.comment.trim().length > 0 &&
    booking.technicianId
  ) {
    try {
      await sendRatingReceivedPush(booking.technicianId, {
        bookingId: data.bookingId,
        overall: data.overall,
        comment: data.comment,
      });
    } catch (err) {
      Sentry.captureException(err);
    }
  }
  return { status: 201, jsonBody: { bookingId: result.bookingId } };
};

type SideProjection =
  | { status: 'PENDING' }
  | { status: 'SUBMITTED'; overall: number; subScores: CustomerSubScores | TechSubScores; submittedAt: string; comment?: string };

function projectSide(
  overall: number | undefined,
  subScores: CustomerSubScores | TechSubScores | undefined,
  comment: string | undefined,
  submittedAt: string | undefined,
  reveal: boolean,
): SideProjection {
  if (!submittedAt || overall === undefined || !subScores) return { status: 'PENDING' };
  if (!reveal) return { status: 'PENDING' };
  return {
    status: 'SUBMITTED',
    overall,
    subScores,
    submittedAt,
    ...(comment !== undefined ? { comment } : {}),
  };
}

export const getRatingHandler: HttpHandler = async (req, _ctx: InvocationContext): Promise<HttpResponseInit> => {
  const uid = await uidFromAuth(req.headers.get('authorization') ?? '');
  if (!uid) return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };

  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  const isCustomer = booking.customerId === uid;
  const isTechnician = booking.technicianId === uid;
  if (!isCustomer && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };

  const doc = await ratingRepo.getByBookingId(bookingId);
  if (!doc) {
    const empty: GetRatingResponse = {
      bookingId, status: 'PENDING',
      customerSide: { status: 'PENDING' }, techSide: { status: 'PENDING' },
    };
    return { status: 200, jsonBody: empty };
  }

  const customerHas = doc.customerSubmittedAt !== undefined;
  const techHas = doc.techSubmittedAt !== undefined;
  const revealed = customerHas && techHas;
  const status: GetRatingResponse['status'] = revealed
    ? 'REVEALED'
    : (customerHas || techHas ? 'PARTIALLY_SUBMITTED' : 'PENDING');

  const customerVisible = revealed || (isCustomer && customerHas);
  const techVisible = revealed || (isTechnician && techHas);

  const response: GetRatingResponse = {
    bookingId,
    status,
    ...(doc.revealedAt !== undefined ? { revealedAt: doc.revealedAt } : {}),
    customerSide: projectSide(
      doc.customerOverall, doc.customerSubScores, doc.customerComment,
      doc.customerSubmittedAt, customerVisible,
    ),
    techSide: projectSide(
      doc.techOverall, doc.techSubScores, doc.techComment,

> api\src\functions\rating-escalate.ts:36:  if (booking.status !== 'CLOSED') return { status: 409, jsonBody: { code: 
'BOOKING_NOT_CLOSED' } };
  api\src\functions\rating-escalate.ts:37:  if (!booking.technicianId) return { status: 409, jsonBody: { code: 
'NO_TECHNICIAN' } };
  api\src\functions\rating-escalate.ts:38:
  api\src\functions\rating-escalate.ts:39:  // Both pre-create checks query Cosmos — wrap together so a 404 from an 
unprovisioned
> api\src\functions\ratings.ts:41:    return { status: 409, jsonBody: { code: 'BOOKING_NOT_CLOSED', status: 
booking.status } };
  api\src\functions\ratings.ts:42:  }
  api\src\functions\ratings.ts:43:  if (!booking.technicianId) return { status: 409, jsonBody: { code: 'NO_TECHNICIAN' 
} };
  api\src\functions\ratings.ts:44:  // Rating Shield (E07-S02) is advisory — it notifies the owner and starts a 2-hour 
window,
> api\src\functions\trigger-projector-complaints.ts:39:  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  api\src\functions\trigger-projector-complaints.ts:40:  createdAt?: string;
  api\src\functions\trigger-projector-complaints.ts:41:}
  api\src\functions\trigger-projector-complaints.ts:42:
> api\src\functions\trigger-projector-complaints.ts:46:const CLOSED_STATUSES = new Set(['RESOLVED', 'CLOSED']);
  api\src\functions\trigger-projector-complaints.ts:47:
  api\src\functions\trigger-projector-complaints.ts:48:/**
  api\src\functions\trigger-projector-complaints.ts:49: * Exported for unit testing without Azure Functions runtime.
> api\src\functions\trigger-rating-prompt.ts:19:  if (!parsed.success || parsed.data.status !== 'CLOSED') return;
  api\src\functions\trigger-rating-prompt.ts:20:  const booking = parsed.data;
  api\src\functions\trigger-rating-prompt.ts:21:  if (!booking.technicianId) { ctx.log(`no technicianId on 
${booking.id}`); return; }
  api\src\functions\trigger-rating-prompt.ts:22:



  ✓ Load repository review instructions
  ✓ Inspect diff against merge base
  ✓ Analyze changed code for bugs
  → Produce JSON findings
codex
The new backfill can interfere with live cash settlement by creating receivables for current completions before the normal side-effecting path runs. This can leave current bookings without their expected completed-job count and notification side effects.

Review comment:

- [P2] Constrain the backfill to historical completions — C:\Alok\Business Projects\wt-fix-cosmos-pages\api\scripts\backfill-historical-receivables.ts:37-37
  When this is run with `--apply` in a live environment, this query also picks up newly completed cash bookings that do not yet have a receivable because `active-job.ts` writes `status: 'COMPLETED'` before calling `settleCashCompletion`. If the backfill creates that row first, the normal settlement path will see it as already recorded and skip the side effects that belong to current jobs, including completed-job count and earnings push. Add a cutoff or other guard so only bookings from before the ledger/container outage are eligible.
The new backfill can interfere with live cash settlement by creating receivables for current completions before the normal side-effecting path runs. This can leave current bookings without their expected completed-job count and notification side effects.

Review comment:

- [P2] Constrain the backfill to historical completions — C:\Alok\Business Projects\wt-fix-cosmos-pages\api\scripts\backfill-historical-receivables.ts:37-37
  When this is run with `--apply` in a live environment, this query also picks up newly completed cash bookings that do not yet have a receivable because `active-job.ts` writes `status: 'COMPLETED'` before calling `settleCashCompletion`. If the backfill creates that row first, the normal settlement path will see it as already recorded and skip the side effects that belong to current jobs, including completed-job count and earnings push. Add a cutoff or other guard so only bookings from before the ledger/container outage are eligible.
