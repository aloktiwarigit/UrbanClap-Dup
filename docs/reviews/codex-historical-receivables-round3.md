2026-09-07T11:17:44.121760Z ERROR codex_models_manager::manager: failed to load models cache: missing field `supports_parallel_tool_calls` at line 132 column 5
OpenAI Codex v0.147.0
--------
workdir: C:\Alok\Business Projects\wt-fix-cosmos-pages
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: high
reasoning summaries: none
session id: 01a07b96-a1f3-71e1-8334-978c15e5bcbe
--------
user
changes against 'main'
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force; Get-ChildItem -Recurse -Force -Filter AGENTS.md | Select-Object -ExpandProperty FullName; Get-ChildItem -Recurse -Force -Filter AGENTS.override.md | Select-Object -ExpandProperty FullName' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 3872ms:


    Directory: C:\Alok\Business Projects\wt-fix-cosmos-pages


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
d-----          9/7/2026   6:38 AM                .claire                                                              
d-----          9/7/2026   6:38 AM                .firebase                                                            
d-----          9/7/2026   6:38 AM                .githooks                                                            
d-----          9/7/2026   6:38 AM                .github                                                              
d-----          9/7/2026   6:38 AM                .serena                                                              
d-----          9/7/2026   6:38 AM                .superpowers                                                         
d-----          9/7/2026   6:38 AM                admin-web                                                            
d-----          9/7/2026   7:17 AM                api                                                                  
d-----          9/7/2026   6:38 AM                artifacts                                                            
d-----          9/7/2026   6:38 AM                commonMain                                                           
d-----          9/7/2026   6:38 AM                core-nav                                                             
d-----          9/7/2026   6:38 AM                customer-app                                                         
d-----          9/7/2026   6:38 AM                design-system                                                        
d-----          9/7/2026   7:00 AM                docs                                                                 
d-----          9/7/2026   6:38 AM                figma                                                                
d-----          9/7/2026   6:38 AM                firebase                                                             
d-----          9/7/2026   6:38 AM                infra                                                                
d-----          9/7/2026   6:38 AM                moto-g-snapshots                                                     
d-----          9/7/2026   7:00 AM                plans                                                                
d-----          9/7/2026   6:38 AM                play-store-assets                                                    
d-----          9/7/2026   6:38 AM                technician-app                                                       
d-----          9/7/2026   6:38 AM                tools                                                                
d-----          9/7/2026   6:38 AM                _bmad                                                                
d-----          9/7/2026   6:38 AM                _bmad-output                                                         
-a----          9/7/2026   6:38 AM             26 .bmad-readiness-passed                                               
-a----          9/7/2026   7:00 AM            219 .codex-review-passed                                                 
-a----          9/7/2026   6:38 AM             63 .firebaserc                                                          
-a-h--          9/7/2026   6:38 AM             83 .git                                                                 
-a----          9/7/2026   6:38 AM            659 .gitattributes                                                       
-a----          9/7/2026   6:38 AM           3617 .gitignore                                                           
-a----          9/7/2026   6:38 AM            694 .semgrepignore                                                       
-a----          9/7/2026   6:38 AM          14551 CLAUDE.md                                                            
-a----          9/7/2026   6:38 AM            252 firebase.json                                                        
-a----          9/7/2026   6:38 AM           1346 TOKEN-SYNC.md                                                        



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --stat 5bfc0361aab64f7b637128c6c3fee9828a80393d; git diff --name-only 5bfc0361aab64f7b637128c6c3fee9828a80393d' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 714ms:
 api/scripts/backfill-historical-receivables.ts     |  191 +
 api/src/cosmos/commission-receivable-repository.ts |    2 +-
 api/src/schemas/commission-receivable.ts           |    8 +
 api/src/services/commission-settlement.service.ts  |   55 +-
 .../backfill-historical-receivables.test.ts        |  253 +
 .../codex-historical-receivables-20260907-0704.md  | 5933 ++++++++++++++++++++
 .../reviews/codex-historical-receivables-round2.md | 3029 ++++++++++
 7 files changed, 9456 insertions(+), 15 deletions(-)
api/scripts/backfill-historical-receivables.ts
api/src/cosmos/commission-receivable-repository.ts
api/src/schemas/commission-receivable.ts
api/src/services/commission-settlement.service.ts
api/tests/scripts/backfill-historical-receivables.test.ts
docs/reviews/codex-historical-receivables-20260907-0704.md
docs/reviews/codex-historical-receivables-round2.md
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff -- api/src/cosmos/commission-receivable-repository.ts api/src/schemas/commission-receivable.ts api/src/services/commission-settlement.service.ts api/scripts/backfill-historical-receivables.ts api/tests/scripts/backfill-historical-receivables.test.ts 5bfc0361aab64f7b637128c6c3fee9828a80393d' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 585ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff 5bfc0361aab64f7b637128c6c3fee9828a80393d -- api/src/cosmos/commission-receivable-repository.ts api/src/schemas/commission-receivable.ts api/src/services/commission-settlement.service.ts api/scripts/backfill-historical-receivables.ts api/tests/scripts/backfill-historical-receivables.test.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 615ms:
diff --git a/api/scripts/backfill-historical-receivables.ts b/api/scripts/backfill-historical-receivables.ts
new file mode 100644
index 00000000..04229265
--- /dev/null
+++ b/api/scripts/backfill-historical-receivables.ts
@@ -0,0 +1,191 @@
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
+const CUTOFF_FLAG = '--completed-before=';
+
+// RAZORPAY bookings settle through the wallet-ledger path and must never get a cash receivable.
+// Legacy docs may omit paymentMethod entirely; those default to cash, matching recordCommissionDue.
+//
+// The @cutoff bound is not cosmetic (Codex review, 2026-09-07): active-job.ts writes
+// status: 'COMPLETED' and only *then* calls settleCashCompletion. A backfill running inside that
+// window would create the receivable first, so the live path would see `created: false` and skip
+// the side effects that belong to a current job — the technician would silently lose a
+// completedJobCount increment and an EARNINGS_UPDATE push. Only ever backfill jobs old enough
+// that their settlement has certainly already been attempted.
+const QUERY =
+  "SELECT * FROM c WHERE c.status = 'COMPLETED' AND (NOT IS_DEFINED(c.paymentMethod) OR c.paymentMethod != 'RAZORPAY') AND ((IS_DEFINED(c.completedAt) AND c.completedAt < @cutoff) OR (NOT IS_DEFINED(c.completedAt) AND c.createdAt < @cutoff))";
+
+const rupees = (paise: number): string => `Rs ${(paise / 100).toFixed(2)}`;
+
+export async function main(argvArgs: string[]): Promise<void> {
+  const cutoffArg = argvArgs.find((a) => a.startsWith(CUTOFF_FLAG));
+  const unknown = argvArgs.filter((a) => !KNOWN_FLAGS.has(a) && !a.startsWith(CUTOFF_FLAG));
+  if (unknown.length > 0) {
+    console.error(`Unknown flag(s): ${unknown.join(', ')}`);
+    console.error('Usage: backfill-historical-receivables.ts [--dry-run|--apply] --completed-before=<ISO>');
+    process.exit(2);
+    return;
+  }
+
+  // Fail closed: an operator must state the cutoff, rather than inherit a default that silently
+  // swallows a job completed thirty seconds ago.
+  const cutoff = cutoffArg?.slice(CUTOFF_FLAG.length);
+  if (!cutoff || Number.isNaN(Date.parse(cutoff))) {
+    console.error('--completed-before=<ISO timestamp> is required (e.g. --completed-before=2026-09-01T00:00:00.000Z).');
+    console.error('Only bookings completed strictly before it are eligible, so a job settling right now is never claimed.');
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
+  console.log(`historical commission-receivable backfill — mode=${apply ? 'APPLY' : 'DRY-RUN'} cutoff=${cutoff}`);
+  console.log('');
+
+  const iterator = getBookingsContainer().items.query(
+    { query: QUERY, parameters: [{ name: '@cutoff', value: cutoff }] },
+    { maxItemCount: 100 },
+  );
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
diff --git a/api/tests/scripts/backfill-historical-receivables.test.ts b/api/tests/scripts/backfill-historical-receivables.test.ts
new file mode 100644
index 00000000..a92543b4
--- /dev/null
+++ b/api/tests/scripts/backfill-historical-receivables.test.ts
@@ -0,0 +1,253 @@
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
+const { mockFetchNext, mockHasMoreResults, querySpy } = vi.hoisted(() => ({
+  mockFetchNext: vi.fn(),
+  mockHasMoreResults: vi.fn(),
+  querySpy: vi.fn(),
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
+    items: {
+      query: (...args: unknown[]) => {
+        querySpy(...args);
+        return { fetchNext: mockFetchNext, hasMoreResults: mockHasMoreResults };
+      },
+    },
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
+const CUTOFF = '--completed-before=2026-09-01T00:00:00.000Z';
+
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
+    await main([CUTOFF]);
+
+    expect(recordCommissionDue).not.toHaveBeenCalled();
+    expect(systemAudit).not.toHaveBeenCalled();
+  });
+
+  it('dry-run previews the commission via the shared resolver, not its own arithmetic', async () => {
+    onePage([booking()]);
+
+    await main([CUTOFF, '--dry-run']);
+
+    expect(resolveCommissionForBooking).toHaveBeenCalledTimes(1);
+    expect(recordCommissionDue).not.toHaveBeenCalled();
+  });
+
+  it('--apply records a receivable for each eligible booking', async () => {
+    onePage([booking({ id: 'bk-1' }), booking({ id: 'bk-2' })]);
+
+    await main([CUTOFF, '--apply']);
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
+    await main([CUTOFF, '--apply']);
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
+    await main([CUTOFF, '--apply']);
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
+    await main([CUTOFF, '--apply']);
+
+    expect(recordCommissionDue).not.toHaveBeenCalled();
+    expect(systemAudit).not.toHaveBeenCalled();
+  });
+
+  it('tolerates the undefined page.resources Cosmos returns', async () => {
+    onePage(undefined);
+
+    await main([CUTOFF, '--apply']);
+
+    expect(recordCommissionDue).not.toHaveBeenCalled();
+  });
+
+  // Codex review, 2026-09-07 (both P2, money-ledger correctness).
+  it('stamps the receivable with when the job completed, not when the backfill ran', async () => {
+    onePage([booking({ completedAt: '2026-05-08T09:30:00.000Z' })]);
+
+    await main([CUTOFF, '--apply']);
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
+    await main([CUTOFF, '--apply']);
+
+    expect(recordCommissionDue).toHaveBeenCalledWith(expect.anything(), { createdAt: '2026-05-01T00:00:00.000Z' });
+  });
+
+  it('consumes open credits and recomputes the hold once per affected technician', async () => {
+    onePage([booking({ id: 'bk-1' }), booking({ id: 'bk-2' }), booking({ id: 'bk-3', technicianId: 'tech-2' })]);
+
+    await main([CUTOFF, '--apply']);
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
+    await main([CUTOFF, '--apply']);
+
+    expect(finalizeLedgerForTechnician).not.toHaveBeenCalled();
+  });
+
+  // Codex review round 2, 2026-09-07 (P2): active-job.ts writes COMPLETED before calling
+  // settleCashCompletion, so a backfill without a cutoff can claim a job that is settling right
+  // now and rob it of its completedJobCount increment and earnings push.
+  it('requires an explicit --completed-before cutoff', async () => {
+    await main(['--apply']);
+
+    expect(exitSpy).toHaveBeenCalledWith(2);
+    expect(recordCommissionDue).not.toHaveBeenCalled();
+  });
+
+  it('rejects an unparseable cutoff', async () => {
+    await main(['--completed-before=not-a-date', '--apply']);
+
+    expect(exitSpy).toHaveBeenCalledWith(2);
+    expect(recordCommissionDue).not.toHaveBeenCalled();
+  });
+
+  it('passes the cutoff to Cosmos as a bound parameter', async () => {
+    onePage([booking()]);
+
+    await main([CUTOFF, '--dry-run']);
+
+    expect(querySpy).toHaveBeenCalledWith(
+      expect.objectContaining({
+        parameters: [{ name: '@cutoff', value: '2026-09-01T00:00:00.000Z' }],
+      }),
+      expect.anything(),
+    );
+  });
+
+  it('rejects unknown flags and both-mode invocations', async () => {
+    await main([CUTOFF, '--nope']);
+    expect(exitSpy).toHaveBeenCalledWith(2);
+
+    exitSpy.mockClear();
+    await main([CUTOFF, '--dry-run', '--apply']);
+    expect(exitSpy).toHaveBeenCalledWith(2);
+  });
+});
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Raw api/src/services/commission-settlement.service.ts; Write-Output '--- repo'; Get-Content -Raw api/src/cosmos/commission-receivable-repository.ts; Write-Output '--- schema'; Get-Content -Raw api/src/schemas/commission-receivable.ts" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 578ms:
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
      amountPaise: z.number().int().nonnegative(),
      method: RemittanceMethodSchema,
      ref: z.string(),
      createdAt: z.string(),
    }),
  ),
  credits: z.array(
    z.object({
      id: z.string(),
      source: z.enum(['OVERPAYMENT', 'INCENTIVE']),
      remainingPaise: z.number().int().nonnegative(),
      createdAt: z.string(),
    }),
  ),
  weekSummary: z.object({
    weekStart: z.string(),
    jobs: z.number().int().nonnegative(),
    cashCollectedPaise: z.number().int().nonnegative(),
    commissionPaise: z.number().int().nonnegative(),
    netPaise: z.number().int().nonnegative(),
  }),
});
export type TechnicianCommissionDueV2 = z.infer<typeof TechnicianCommissionDueV2Schema>;


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Raw api/src/schemas/booking.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 537ms:
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


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem api; Get-Content -Raw api/package.json; Get-Content -Raw api/tsconfig.json' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 627ms:


    Directory: C:\Alok\Business Projects\wt-fix-cosmos-pages\api


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
d-----          9/7/2026   6:38 AM                .claude                                                              
d-----          9/7/2026   6:38 AM                docs                                                                 
d-----          9/7/2026   6:41 AM                node_modules                                                         
d-----          9/7/2026   6:38 AM                plans                                                                
d-----          9/7/2026   7:02 AM                scripts                                                              
d-----          9/7/2026   6:38 AM                specs                                                                
d-----          9/7/2026   7:00 AM                src                                                                  
d-----          9/7/2026   7:00 AM                tests                                                                
-a----          9/7/2026   6:38 AM            147 .editorconfig                                                        
-a----          9/7/2026   6:38 AM            305 .funcignore                                                          
-a----          9/7/2026   6:38 AM              3 .nvmrc                                                               
-a----          9/7/2026   6:38 AM             45 .prettierignore                                                      
-a----          9/7/2026   6:38 AM             89 .prettierrc.json                                                     
-a----          9/7/2026   7:00 AM          11974 .semgrep.yml                                                         
-a----          9/7/2026   6:38 AM             26 .spectral.yaml                                                       
-a----          9/7/2026   6:38 AM           6656 CLAUDE.md                                                            
-a----          9/7/2026   6:38 AM           1469 eslint.config.mjs                                                    
-a----          9/7/2026   6:38 AM            289 host.json                                                            
-a----          9/7/2026   6:38 AM            570 local.settings.example.json                                          
-a----          9/7/2026   7:17 AM         172406 openapi.json                                                         
-a----          9/7/2026   6:38 AM         503789 package-lock.json                                                    
-a----          9/7/2026   6:38 AM           2398 package.json                                                         
-a----          9/7/2026   6:38 AM         299204 pnpm-lock.yaml                                                       
-a----          9/7/2026   6:38 AM           3981 README.md                                                            
-a----          9/7/2026   6:38 AM            469 tsconfig.json                                                        
-a----          9/7/2026   6:38 AM            166 tsconfig.tests.json                                                  
-a----          9/7/2026   6:38 AM           5396 vitest.config.ts                                                     
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

{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}




exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Raw api/tsconfig.tests.json; Get-Content -Raw api/vitest.config.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 554ms:
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "rootDir": ".",
    "types": ["node"]
  },
  "include": ["src/**/*", "tests/**/*"]
}

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Several suites re-import a heavy module graph inside beforeEach
    // (`vi.resetModules()` + `await import('../../src/functions/bookings.js')`,
    // which pulls in Cosmos, Razorpay and FCM). Under parallel load that
    // re-transform exceeds vitest's 10s default and the suite fails
    // intermittently with "Hook timed out in 10000ms" â€” files that pass in
    // isolation. Raised, not removed: a genuinely hung hook still fails.
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/bootstrap.ts',
        // OTel SDK init requires real Azure Monitor connection string â€” mocked in tests.
        'src/observability/otel.ts',
        // PostHog client self-inits on import â€” integration-tested via mock.
        'src/observability/posthog.ts',
        // OpenAPI build + registry are exercised end-to-end via execSync in
        // tests/openapi-build.test.ts (6 assertions against the real output),
        // but v8 coverage cannot instrument a subprocess invocation.
        'src/openapi/**',
        '**/*.config.*',
        // Cloud-infra singletons â€” require real Cosmos/Firebase credentials;
        // tested indirectly via mocks throughout the integration suite.
        'src/cosmos/client.ts',
        'src/services/firebaseAdmin.ts',
        'src/services/fcm.service.ts',
        'src/services/adminUser.service.ts',
        // Cosmos repositories added in E06-S04/S05 â€” cloud singletons,
        // exercised indirectly via mocks in trigger and service tests.
        'src/cosmos/booking-event-repository.ts',
        'src/cosmos/complaints-repository.ts',
        'src/cosmos/dispatch-attempt-repository.ts',
        'src/cosmos/ssc-levy-repository.ts',
        'src/cosmos/wallet-ledger-repository.ts',
        'src/cosmos/seeds/**',
        // Firebase helpers â€” require real Firebase Storage credentials;
        // mocked in trigger-service-report and active-job tests.
        'src/firebase/admin.ts',
        'src/firebase/booking-event.ts',
        // Function handlers requiring end-to-end Azure Functions runtime.
        'src/functions/dispatch-attempt.ts',
        // Schema route files with zero coverage â€” no test suite for these routes yet.
        'src/cosmos/catalogue.ts',
        'src/cosmos/complaints.ts',
        'src/cosmos/report.ts',
        'src/cosmos/ssc-levy.ts',
        'src/cosmos/wallet-ledger.ts',
        // Zod schema files with no test coverage yet (added E06-S04/S05).
        'src/schemas/booking-event.ts',
        'src/schemas/dispatch-attempt.ts',
        'src/schemas/report.ts',
        'src/schemas/ssc-levy.ts',
        'src/schemas/wallet-ledger.ts',
        // Azure Form Recognizer singleton â€” requires real Azure AI credentials.
        'src/services/formRecognizer.service.ts',
        // DigiLocker OAuth2 service â€” always mocked in KYC tests;
        // requires real DigiLocker API credentials to exercise directly.
        'src/services/digilocker.service.ts',
        // SSC levy service cloud functions â€” Cosmos + FCM require real credentials;
        // pure helper functions (getPriorQuarter, quarterBounds, computeLevyAmount)
        // are covered by the ssc-levy function test suite via the service mock.
        'src/services/ssc-levy.service.ts',
        // DPDP cascade modules added in E10-S05 â€” cloud singletons; exercised
        // indirectly via mocks in users-data-export, users-erasure-request,
        // admin-erasure-{execute,deny}, erasure-cron, and dpdp-data-inventory tests.
        'src/cosmos/erasure-request-repository.ts',
        'src/cosmos/user-data-export-reads.ts',
        'src/cosmos/user-data-cascade-writes.ts',
        'src/services/erasureCascade.service.ts',
        'src/services/userRole.service.ts',
        // DPDP function entry points â€” Azure Functions runtime registration
        // around thin handlers; the action handlers are unit-tested directly.
        'src/functions/admin/erasure-requests/list.ts',
        'src/functions/admin/erasure-requests/patch.ts',
        'src/functions/users-data-export.ts',
        'src/functions/trigger-erasure-deadline.ts',
        // Type-only declarations â€” zero executable statements.
        'src/types/**',
        // E16-S04: pure constant table (list of catalogue service IDs). Tested
        // indirectly via waitlist.test.ts (UNKNOWN_SERVICE path) and the seed
        // suite, but coverage tool can't instrument a static array.
        'src/data/catalogue-ids.ts',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        // Functions threshold lowered to 79% on 2026-05-18 because the merge of
        // E11-S05b-2 (SOS) + E17-S02 (location) + E16-S04 (waitlist) accumulated
        // a handful of pre-existing untested admin handlers (admin/customers/*,
        // admin/technicians/*, admin/wallet/*) just over the 80% line. The drop
        // is 0.15%. Restore to 80% once a dedicated coverage-cleanup story lands
        // (tracked in docs/launch-readiness.md Â§1c).
        functions: 79,
        statements: 80,
      },
    },
  },
});


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm -s typecheck' in C:\Alok\Business Projects\wt-fix-cosmos-pages\api
 succeeded in 42813ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Raw api/src/services/auditLog.service.ts; Get-ChildItem api/scripts -File | Select-Object -ExpandProperty Name; Get-Content -Raw api/scripts/backfill-commission-holds.ts -ErrorAction SilentlyContinue' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 609ms:
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

backfill-commission-holds.ts
backfill-historical-receivables.ts
backfill-pan-mask.ts
invite-admin.ts
migrate-pan-to-hash.ts
provision-cosmos-indexes.ts
reconcile-earnings-p0-1.ts
seed-admin.ts
seed-technicians.ts
setup-cosmos.ts
#!/usr/bin/env tsx
// Production backfill for E21-S02's commissionHold cache. Run once after `setup-cosmos.ts` has
// seeded the new system docs, and again any time the hold-repair queue needs a full manual
// reconcile outside of the E21-S04 timer.
//
// Run (default, read-only): npx tsx scripts/backfill-commission-holds.ts
//                     apply: npx tsx scripts/backfill-commission-holds.ts --apply
//
// Requires: COSMOS_CONNECTION_STRING, or COSMOS_ENDPOINT + COSMOS_KEY (see src/cosmos/client.ts).
//
// `--dry-run` is the default and performs zero writes â€” it recomputes every technician's hold in
// memory and reports drift against what's currently stored, via `sweepAllHolds`'s own `log`
// callback (`hold drift (dry-run) <id>: <before state>/<before paise> â†’ <after state>/<after
// paise>`). `--apply` runs the real conditional-patch sweep and persists the recomputed holds.

import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';
import { sweepAllHolds } from '../src/services/commission-hold.service.js';

const KNOWN_FLAGS = new Set(['--dry-run', '--apply']);

/**
 * Exported so the unit test can drive the CLI without spawning a process. `argvArgs` is the
 * flag list only (i.e. `process.argv.slice(2)`).
 */
export async function main(argvArgs: string[]): Promise<void> {
  const unknown = argvArgs.filter((a) => !KNOWN_FLAGS.has(a));
  if (unknown.length > 0) {
    console.error(`Unknown flag(s): ${unknown.join(', ')}`);
    console.error('Usage: backfill-commission-holds.ts [--dry-run|--apply]');
    process.exit(2);
    return;
  }

  const apply = argvArgs.includes('--apply');
  if (apply && argvArgs.includes('--dry-run')) {
    console.error('Pass either --dry-run or --apply, not both.');
    process.exit(2);
    return;
  }

  const mode = apply ? 'APPLY' : 'DRY-RUN';
  console.log(`commission-hold backfill â€” mode=${mode}`);
  console.log('');

  const result = await sweepAllHolds({
    dryRun: !apply,
    log: (line: string) => console.log(`  ${line}`),
  });

  console.log('');
  console.log(`recomputed=${result.recomputed} drifted=${result.drifted}`);

  if (!apply) {
    console.log(
      result.drifted > 0
        ? 'Dry-run complete â€” no writes made. Re-run with --apply to persist the drift above.'
        : 'Dry-run complete â€” no writes made. No drift found; --apply would be a no-op.',
    );
  } else {
    console.log('Apply complete â€” commissionHold patched for every technician listed above.');
  }
}

if (argv[1] && fileURLToPath(import.meta.url) === argv[1]) {
  main(argv.slice(2)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Raw api/src/services/commission-allocator.service.ts; Get-Content -Raw api/src/services/commission-hold.service.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 524ms:
import type { OperationInput } from '@azure/cosmos';
import type { Allocation, CommissionReceivableEntry, RemittanceStatus } from '../schemas/commission-receivable.js';
import { commissionReceivableRepo } from '../cosmos/commission-receivable-repository.js';
import { allocationId, creditDocId, type CreditDoc } from '../schemas/commission-ledger.js';

export type OutstandingRow = { entry: CommissionReceivableEntry; etag: string; outstandingPaise: number };

export type AllocationPlan = { allocations: Array<{ bookingId: string; paise: number }>; leftoverPaise: number };

export const MAX_ALLOCATION_ROWS = 98; // 100-op batch limit minus anchor doc and optional credit doc

export function allocateOldestFirst(rows: OutstandingRow[], paise: number, maxRows = MAX_ALLOCATION_ROWS): AllocationPlan {
  const sorted = [...rows].filter((r) => r.outstandingPaise > 0)
    .sort((a, b) => (a.entry.createdAt < b.entry.createdAt ? -1 : a.entry.createdAt > b.entry.createdAt ? 1 : a.entry.bookingId.localeCompare(b.entry.bookingId)));
  const allocations: Array<{ bookingId: string; paise: number }> = [];
  let remaining = paise;
  for (const row of sorted) {
    if (remaining <= 0 || allocations.length >= maxRows) break;
    const take = Math.min(remaining, row.outstandingPaise);
    allocations.push({ bookingId: row.entry.bookingId, paise: take });
    remaining -= take;
  }
  return { allocations, leftoverPaise: remaining };
}

export function deriveStatus(e: Pick<CommissionReceivableEntry, 'commissionDue' | 'allocations' | 'remittanceStatus'>): RemittanceStatus {
  const allocs = e.allocations ?? [];
  if (allocs.some((a) => a.source === 'WAIVER')) return 'WAIVED';
  const paid = allocs.reduce((s, a) => s + a.paise, 0);
  return paid >= e.commissionDue ? 'REMITTED' : 'DUE';
}

/** Idempotent merge: same allocation id twice is a no-op. All derived fields recomputed absolutely. */
export function mergeAllocation(entry: CommissionReceivableEntry, alloc: Allocation): CommissionReceivableEntry {
  const existing = entry.allocations ?? [];
  // Early return if this allocation is already present (replay safety)
  if (existing.some((a) => a.id === alloc.id)) return entry;

  const allocations = [...existing, alloc];
  const remittedAmount = allocations.filter((a) => a.source !== 'WAIVER').reduce((s, a) => s + a.paise, 0);
  const next: CommissionReceivableEntry = { ...entry, allocations, remittedAmount, updatedAt: alloc.appliedAt };
  const status = deriveStatus(next);
  return {
    ...next,
    remittanceStatus: status,
    ...(status === 'REMITTED' && !entry.remittedAt ? { remittedAt: alloc.appliedAt } : {}),
    ...(alloc.source === 'WAIVER' ? { waivedReason: entry.waivedReason ?? alloc.refId, markedByAdminId: alloc.byId } : {}),
  };
}

export type ApplyCreditInput = {
  technicianId: string;
  refId: string;
  source: 'REMITTANCE' | 'INCENTIVE';
  paise: number;
  byId: string;
  /** Deterministic anchor document created in the same batch; its 409 is the replay signal.
   *  `build` receives the final plan so the anchor can embed it (a remittance receipt lists its allocations).
   *  `matches` validates a replayed CONFLICT against the request (idempotency-key mismatch guard);
   *  the default is FAIL-CLOSED â€” it requires `existing.amountPaise` to be a number equal to
   *  `input.paise`, and rejects (IDEMPOTENCY_MISMATCH) on anything else, including it being absent
   *  or non-numeric. Any anchor type that does not carry `amountPaise` MUST supply its own `matches`. */
  anchor: { id: string; build: (plan: AllocationPlan) => Record<string, unknown>; matches?: (existing: Record<string, unknown>) => boolean };
};
export type ApplyCreditResult =
  | { replayed: true; anchorId: string }
  | { replayed: false; anchorId: string; allocations: Array<{ bookingId: string; paise: number }>; creditCreatedPaise: number };

const MAX_ATTEMPTS = 3;

/**
 * Single-partition transactional batch per attempt: [anchor create, replace per allocated row,
 * optional credit create]. The anchor's deterministic id makes a replayed call surface as a 409
 * on the FIRST op â€” detected before any row is touched, so a replay is a true no-op. A concurrent
 * edit on any row surfaces as a 412 across the whole batch (Cosmos batches are all-or-nothing),
 * which we treat as "re-read and re-plan", never as partial application.
 */
export async function applyCredit(input: ApplyCreditInput): Promise<ApplyCreditResult> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const rows = await commissionReceivableRepo.getOutstandingByTechnician(input.technicianId);
    const plan = allocateOldestFirst(rows, input.paise);
    const now = new Date().toISOString();
    const byBooking = new Map(rows.map((r) => [r.entry.bookingId, r]));
    const ops: OperationInput[] = [{ operationType: 'Create', resourceBody: input.anchor.build(plan) as never }];
    for (const a of plan.allocations) {
      const row = byBooking.get(a.bookingId)!;
      const merged = mergeAllocation(row.entry, {
        id: allocationId(input.refId, a.bookingId),
        source: input.source,
        refId: input.refId,
        paise: a.paise,
        appliedAt: now,
        byId: input.byId,
      });
      ops.push({ operationType: 'Replace', id: a.bookingId, ifMatch: row.etag, resourceBody: merged as never });
    }
    if (plan.leftoverPaise > 0) {
      const credit: CreditDoc = {
        id: creditDocId(input.refId),
        docType: 'CREDIT',
        technicianId: input.technicianId,
        partitionKey: input.technicianId,
        source: input.source === 'REMITTANCE' ? 'OVERPAYMENT' : 'INCENTIVE',
        refId: input.refId,
        originalPaise: plan.leftoverPaise,
        remainingPaise: plan.leftoverPaise,
        consumedBy: [],
        createdAt: now,
      };
      ops.push({ operationType: 'Create', resourceBody: credit as never });
    }
    const res = await commissionReceivableRepo.runLedgerBatch(input.technicianId, ops);
    if (res.ok) {
      return { replayed: false, anchorId: input.anchor.id, allocations: plan.allocations, creditCreatedPaise: plan.leftoverPaise };
    }
    if (res.reason === 'CONFLICT') {
      // A 409 on this batch only PROVES the anchor's deterministic id already exists if we can
      // read it back â€” the credit doc's Create op can also 409 on a rare id race. Never trust a
      // bare CONFLICT as "this was a replay" without confirming it's the anchor.
      const existing = await commissionReceivableRepo.readLedgerDoc<Record<string, unknown>>(input.technicianId, input.anchor.id);
      if (existing) {
        // Fail-closed default: an anchor type without a numeric amountPaise MUST supply `matches`.
        const matches = input.anchor.matches
          ? input.anchor.matches(existing)
          : typeof existing['amountPaise'] === 'number' && existing['amountPaise'] === input.paise;
        if (!matches) {
          throw Object.assign(new Error('IDEMPOTENCY_MISMATCH'), { code: 'IDEMPOTENCY_MISMATCH', anchorId: input.anchor.id });
        }
        return { replayed: true, anchorId: input.anchor.id };
      }
      // Anchor is NOT the doc that conflicted (e.g. the credit doc raced) â€” this wasn't a replay,
      // it's a concurrent-edit race. Re-read fresh rows/etags and re-plan, same as PRECONDITION.
      if (attempt === MAX_ATTEMPTS) {
        throw Object.assign(new Error('ledger PRECONDITION after retries'), { code: 'PRECONDITION' });
      }
      continue;
    }
    // PRECONDITION: some row moved under us â€” re-read fresh rows and re-plan.
    if (attempt === MAX_ATTEMPTS) {
      throw Object.assign(new Error('ledger PRECONDITION after retries'), { code: 'PRECONDITION' });
    }
  }
  throw new Error('unreachable');
}

/**
 * Applies every open credit (oldest-first) against the technician's current DUE rows. Each credit
 * is driven to exhaustion â€” remainingPaise === 0, or no DUE row has outstanding > 0 â€” via
 * however many single-partition batches that takes (bounded by MAX_ALLOCATION_ROWS+1 rows per
 * batch), BEFORE moving on to the next credit; a newer credit must never see a batch while an
 * older one still has remainingPaise > 0 and DUE rows exist to consume it against. Each batch
 * attempt gets its own â‰¤3-try PRECONDITION-retry budget; a CONFLICT or an exhausted retry budget
 * abandons that credit (never throws) so one stuck credit cannot block the others â€” the caller can
 * re-run consumePendingCredits later.
 */
export async function consumePendingCredits(technicianId: string): Promise<{ consumedPaise: number }> {
  let consumed = 0;
  const credits = (await commissionReceivableRepo.getOpenCredits(technicianId))
    .sort((a, b) => a.doc.createdAt.localeCompare(b.doc.createdAt));

  for (const initial of credits) {
    let doc = initial.doc;
    let etag = initial.etag;

    // Drive THIS credit to exhaustion before moving to the next one.
    while (doc.remainingPaise > 0) {
      let progressed = false;
      let stopAll = false;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const rows = await commissionReceivableRepo.getOutstandingByTechnician(technicianId);
        if (rows.every((r) => r.outstandingPaise === 0)) { stopAll = true; break; } // no DUE rows left for anyone
        const plan = allocateOldestFirst(rows, doc.remainingPaise, MAX_ALLOCATION_ROWS + 1);
        if (plan.allocations.length === 0) break; // nothing allocatable; give up on this credit

        const now = new Date().toISOString();
        const consumedBy = [
          ...doc.consumedBy,
          ...plan.allocations.map((a) => ({ bookingId: a.bookingId, paise: a.paise, appliedAt: now })),
        ];
        const remainingPaise = doc.originalPaise - consumedBy.reduce((s, c) => s + c.paise, 0); // absolute recompute
        const ops: OperationInput[] = [
          { operationType: 'Replace', id: doc.id, ifMatch: etag, resourceBody: { ...doc, consumedBy, remainingPaise, updatedAt: now } as never },
        ];
        const byBooking = new Map(rows.map((r) => [r.entry.bookingId, r]));
        for (const a of plan.allocations) {
          const row = byBooking.get(a.bookingId)!;
          const source = doc.source === 'INCENTIVE' ? 'INCENTIVE' : 'REMITTANCE';
          ops.push({
            operationType: 'Replace',
            id: a.bookingId,
            ifMatch: row.etag,
            resourceBody: mergeAllocation(row.entry, {
              id: allocationId(doc.id, a.bookingId),
              source,
              refId: doc.id,
              paise: a.paise,
              appliedAt: now,
              byId: 'system:credit',
            }) as never,
          });
        }

        const res = await commissionReceivableRepo.runLedgerBatch(technicianId, ops);
        if (res.ok) {
          consumed += plan.allocations.reduce((s, a) => s + a.paise, 0);
          doc = { ...doc, consumedBy, remainingPaise, updatedAt: now };
          progressed = true;
          if (remainingPaise > 0) {
            // More to consume on THIS credit â€” refresh its doc/etag before the next batch so the
            // next Replace carries a live etag (our own write above just moved it).
            const fresh = (await commissionReceivableRepo.getOpenCredits(technicianId)).find((c) => c.doc.id === doc.id);
            if (fresh) { doc = fresh.doc; etag = fresh.etag; } else { doc = { ...doc, remainingPaise: 0 }; }
          }
          break;
        }
        // CONFLICT: abandon this credit, never throw.
        if (res.reason === 'CONFLICT') break;
        // PRECONDITION: something (the credit doc or a row) moved under us.
        if (attempt === MAX_ATTEMPTS) break; // retries exhausted for this batch attempt â€” abandon this credit
        const fresh = (await commissionReceivableRepo.getOpenCredits(technicianId)).find((c) => c.doc.id === doc.id);
        if (fresh) { doc = fresh.doc; etag = fresh.etag; } else { break; } // credit was fully consumed/removed elsewhere
      }

      if (stopAll) return { consumedPaise: consumed }; // no DUE rows anywhere; nothing left for any credit
      if (!progressed) break; // CONFLICT / retries exhausted / nothing allocatable â€” move to next credit
      // else: this credit made progress; the while-condition re-checks doc.remainingPaise
    }
  }
  return { consumedPaise: consumed };
}

import { commissionReceivableRepo } from '../cosmos/commission-receivable-repository.js';
import {
  listAllTechniciansWithHold,
  listTechniciansWithExpiredOverride,
  patchCommissionHold,
  readCommissionHold,
} from '../cosmos/technician-repository.js';
import { getCommissionConfig } from './commission-config.service.js';
import type { CommissionHold, HoldState } from '../schemas/technician.js';

/**
 * Number of retries after an initial STALE patch, each with a completely fresh read (including a
 * new `readStartedAt`). The conditional-patch guard is millisecond-granular string comparison
 * (`evaluatedAt < readStartedAt`), so two recomputes that both start within the same millisecond
 * can each see the other as "not fresher" and both come back STALE against each other's write â€”
 * retrying with a fresh read breaks that tie on the next attempt instead of silently giving up on
 * the first race.
 */
const MAX_STALE_RETRIES = 2;

/**
 * Pure threshold evaluator. Thresholds are inclusive: `>= block` wins over `>= warn`.
 * An active override (until strictly after `now`) forces CLEAR regardless of outstanding.
 */
export function evaluateState(
  outstandingPaise: number,
  cfg: { warnThresholdPaise: number; blockThresholdPaise: number },
  override?: { until: string },
  now: Date = new Date(),
): HoldState {
  if (override && override.until > now.toISOString()) return 'CLEAR';
  if (outstandingPaise >= cfg.blockThresholdPaise) return 'BLOCKED';
  if (outstandingPaise >= cfg.warnThresholdPaise) return 'WARN';
  return 'CLEAR';
}

/**
 * All the reads needed to recompute a technician's commissionHold, with no write. Returns null
 * when the technician doc does not exist. `readStartedAt` is captured BEFORE the reads so a
 * caller writing with it can never accept its own write from a run that started before one that
 * already applied.
 *
 * A single `evaluationNow` is captured ONCE, after the reads complete, and used both to decide
 * whether the current hold's override is still active and to evaluate the resulting state â€” so
 * an override that expires between the read and the evaluation is judged consistently in both
 * places rather than being preserved in the data but ignored in the state (or vice versa).
 */
export async function computeCommissionHold(
  technicianId: string,
): Promise<{ hold: CommissionHold; readStartedAt: string } | null> {
  const readStartedAt = new Date().toISOString();
  const [rows, cfg, current] = await Promise.all([
    commissionReceivableRepo.getOutstandingByTechnician(technicianId),
    getCommissionConfig(),
    readCommissionHold(technicianId),
  ]);
  if (!current.exists) return null;

  const evaluationNow = new Date();
  const evaluationNowIso = evaluationNow.toISOString();
  const outstandingPaise = rows.reduce((sum, r) => sum + r.outstandingPaise, 0);
  const due = rows.filter((r) => r.outstandingPaise > 0);
  const override =
    current.hold?.override && current.hold.override.until > evaluationNowIso ? current.hold.override : undefined;

  const hold: CommissionHold = {
    outstandingPaise,
    dueCount: due.length,
    ...(due.length ? { oldestDueAt: due.map((r) => r.entry.createdAt).sort()[0]! } : {}),
    state: evaluateState(outstandingPaise, cfg, override, evaluationNow),
    evaluatedAt: evaluationNowIso,
    ...(override ? { override } : {}),
  };
  return { hold, readStartedAt };
}

/**
 * Recomputes a technician's commissionHold absolutely from their outstanding receivables (never
 * incremented) and writes it via a conditional Cosmos patch so a stale recompute can never
 * overwrite a fresher one.
 *
 * Returns `status: 'MISSING'` (hold: null) when the technician doc does not exist. Returns
 * `status: 'APPLIED'` with the written hold on success. On a `STALE` patch â€” another recompute's
 * write landed first â€” retries up to `MAX_STALE_RETRIES` more times with a completely fresh
 * `computeCommissionHold` call (fresh reads, fresh `readStartedAt`) before giving up with
 * `status: 'STALE'` and the last hold it computed (superseded, not wrong â€” a caller comparing
 * against `before` should not count this as drift it actually applied).
 */
export async function recomputeCommissionHold(
  technicianId: string,
): Promise<{ hold: CommissionHold | null; status: 'APPLIED' | 'STALE' | 'MISSING' }> {
  let lastHold: CommissionHold | null = null;
  for (let attempt = 0; attempt <= MAX_STALE_RETRIES; attempt++) {
    const computed = await computeCommissionHold(technicianId);
    if (!computed) return { hold: null, status: 'MISSING' };
    lastHold = computed.hold;

    const status = await patchCommissionHold(technicianId, computed.hold, computed.readStartedAt);
    if (status === 'APPLIED') return { hold: computed.hold, status: 'APPLIED' };
    if (status === 'MISSING') return { hold: null, status: 'MISSING' };
    // STALE: loop and retry with a completely fresh read.
  }
  return { hold: lastHold, status: 'STALE' };
}

/**
 * Recomputes technician commissionHolds in one of two scopes:
 *
 * - `'FULL'` (default): every technician that either has an outstanding DUE receivable or
 *   currently carries a commissionHold â€” the union guarantees a technician whose balance just
 *   dropped to zero still gets swept down to CLEAR/0.
 * - `'EXPIRED_OVERRIDES'`: only technicians whose commissionHold.override has expired as of now.
 *   An expired override otherwise sits inert until something else touches that technician's
 *   receivables and triggers a recompute, silently under-enforcing a hold that should have
 *   resumed. **The E21-S04 reconciler must run this scope on a schedule (every 15 minutes)** so
 *   an expired override is cleared promptly instead of only on the next unrelated recompute.
 *
 * In `dryRun`, no patch is issued: each candidate is still evaluated (via `computeCommissionHold`,
 * not `recomputeCommissionHold`) so drift can be reported without writing anything. Drift outside
 * `dryRun` is only counted when the recompute's status was `'APPLIED'` â€” a `STALE` result did not
 * actually change anything this process wrote, so it must not be counted as drift this sweep
 * caused.
 */
export async function sweepAllHolds(
  opts: { dryRun?: boolean; log?: (s: string) => void; scope?: 'FULL' | 'EXPIRED_OVERRIDES' } = {},
): Promise<{ recomputed: number; drifted: number }> {
  const scope = opts.scope ?? 'FULL';
  const ids = scope === 'EXPIRED_OVERRIDES' ? await listTechniciansWithExpiredOverride(new Date().toISOString()) : await collectFullScopeIds();

  let recomputed = 0;
  let drifted = 0;
  for (const id of ids) {
    const before = (await readCommissionHold(id)).hold;

    if (opts.dryRun) {
      const computed = await computeCommissionHold(id);
      recomputed++;
      if (computed && (before?.outstandingPaise !== computed.hold.outstandingPaise || before?.state !== computed.hold.state)) {
        drifted++;
        opts.log?.(
          `hold drift (dry-run) ${id}: ${before?.state ?? 'none'}/${before?.outstandingPaise ?? 0} â†’ ${computed.hold.state}/${computed.hold.outstandingPaise}`,
        );
      }
      continue;
    }

    const { hold: after, status } = await recomputeCommissionHold(id);
    recomputed++;
    if (
      status === 'APPLIED' &&
      after &&
      (before?.outstandingPaise !== after.outstandingPaise || before?.state !== after.state)
    ) {
      drifted++;
      opts.log?.(
        `hold drift ${id}: ${before?.state ?? 'none'}/${before?.outstandingPaise ?? 0} â†’ ${after.state}/${after.outstandingPaise}`,
      );
    }
  }
  return { recomputed, drifted };
}

async function collectFullScopeIds(): Promise<string[]> {
  const seen = new Set<string>();
  const dueGroups = await commissionReceivableRepo.sumDueGroupedByTechnician();
  for (const group of dueGroups) seen.add(group.technicianId);
  const holders = await listAllTechniciansWithHold();
  for (const t of holders) seen.add(t.id);
  return [...seen];
}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm -s test -- tests/scripts/backfill-historical-receivables.test.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages\api
 succeeded in 1855ms:

[1m[7m[36m RUN [39m[27m[22m [36mv2.1.9 [39m[90mC:/Alok/Business Projects/wt-fix-cosmos-pages/api[39m

 [32m✓[39m tests/scripts/backfill-historical-receivables.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 10[2mms[22m[39m

[2m Test Files [22m [1m[32m1 passed[39m[22m[90m (1)[39m
[2m      Tests [22m [1m[32m15 passed[39m[22m[90m (15)[39m
[2m   Start at [22m 07:19:46
[2m   Duration [22m 426ms[2m (transform 69ms, setup 0ms, collect 115ms, tests 10ms, environment 0ms, prepare 99ms)[22m


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path api/src/**/*.ts -Pattern "settleCashCompletion|COMPLETED|completedAt" | Select-Object -First 80 | ForEach-Object { "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" }' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 608ms:
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:162: 'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED'
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\client.ts:101: * One doc per completed cash booking, partitioned by /technicianId so per-tech
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:5: interface CompletedBooking {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:12: completedAt: string;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:40: * the two are mutually exclusive in trigger-booking-completed, and each stores one
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:75: function grossOf(b: CompletedBooking): number {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:80: function commissionOf(b: CompletedBooking, recorded: Map<string, number>): number {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:105: async function queryCompletedBookings(from: string, to: string): Promise<CompletedBooking[]> {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:111: query: `SELECT c.id, c.technicianId, c.technicianName, c.amount, c.finalAmount, c.completedAt
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:113: WHERE c.status = 'COMPLETED'
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:114: AND c.completedAt >= @from
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:115: AND c.completedAt <= @toEnd`,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:123: return (resources ?? []) as CompletedBooking[];
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:127: const bookings = await queryCompletedBookings(from, to);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:132: const date = b.completedAt.slice(0, 10);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:153: const bookings = await queryCompletedBookings(weekStart, weekEnd);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:173: entries.push({ technicianId, technicianName: name, completedJobsThisWeek: jobs, grossEarnings: gross, commissionDeducted: commission, netPayable });
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\orders-repository.ts:9: const PHOTO_STAGE_ORDER = ['EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED'];
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\technician-repository.ts:332: completedJobCount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\technician-repository.ts:349: export async function incrementCompletedJobCount(technicianId: string): Promise<void> {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\technician-repository.ts:355: .read<{ id: string; completedJobCount?: number } & Record<string, unknown>>();
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\technician-repository.ts:359: { ...resource, completedJobCount: (resource.completedJobCount ?? 0) + 1 },
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\wallet-ledger-repository.ts:20: completedJobCountAtSettlement: input.completedJobCountAtSettlement,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\active-job-photos.ts:11: const PHOTO_STAGES = ['EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED'] as const;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\active-job-photos.ts:18: IN_PROGRESS: 'COMPLETED',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\active-job.ts:11: import { settleCashCompletion } from '../services/commission-settlement.service.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\active-job.ts:18: const TRANSITION_ORDER = ['ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED'] as const;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\active-job.ts:29: targetStatus: z.enum(['EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED']),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\active-job.ts:38: /** E21-S01: Set true on COMPLETED to confirm the technician collected cash from the customer. */
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\active-job.ts:124: ...(body.targetStatus === 'COMPLETED'
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\active-job.ts:126: completedAt: now,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\active-job.ts:152: if (body.targetStatus === 'COMPLETED') {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\active-job.ts:154: // E21-S02 Codex P1 fix: settleCashCompletion internally guards RAZORPAY bookings
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\active-job.ts:157: await settleCashCompletion(updated, { log: (s) => ctx.log(s) });
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:27: const PHOTO_STAGE_ORDER = ['EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'COMPLETED'] as const;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:76: if (status !== 'COMPLETED') return null;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\ratings.ts:40: if (!['COMPLETED', 'PAID', 'CLOSED'].includes(booking.status)) {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\shield-report.ts:24: 'COMPLETED',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\technicians.ts:326: AND c.status IN ('COMPLETED', 'PAID')
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:10: import { getTechnicianForSettlement, incrementCompletedJobCount } from '../cosmos/technician-repository.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:16: import { settleCashCompletion } from '../services/commission-settlement.service.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:42: if (!parsed.success || parsed.data.status !== 'COMPLETED') return;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:48: ctx.log(`settleBooking: COMPLETED booking ${bookingId} has no technicianId — skipping`);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:58: // settleCashCompletion so this trigger and the synchronous active-job COMPLETED transition
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:60: // receivable row. A throwing recordCommissionDue (inside settleCashCompletion) propagates —
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:61: // see handleBookingCompletedBatch below for why that must not be swallowed.
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:63: await settleCashCompletion(booking, { log: (s) => ctx.log(s) });
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:99: const completedJobCount = tech?.completedJobCount ?? 0;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:142: completedJobCountAtSettlement: completedJobCount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:193: await incrementCompletedJobCount(technicianId);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:209: export async function handleBookingCompletedBatch(documents: unknown[], context: InvocationContext): Promise<void> {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:223: app.cosmosDB('triggerBookingCompleted', {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:227: leaseContainerName: 'booking_completed_leases',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:230: handler: handleBookingCompletedBatch,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-no-show-detector.ts:96: // On recovery (creditCreated=false), check which downstream steps already completed.
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-no-show-detector.ts:128: ctx.log(`detectNoShows: recovery skipped for ${booking.id} — all steps already completed`);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-no-show-detector.ts:141: statusWriteOk = true; // Step 1 was completed by the prior run that crashed in Step 2.
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-no-show-detector.ts:158: // Skip if noShowRedispatchAt already set (recovery: prior run completed this step).
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-no-show-detector.ts:167: // Concurrent run completed the step.
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-no-show-detector.ts:169: ctx.log(`detectNoShows: redispatch already completed concurrently for ${booking.id}`);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-no-show-detector.ts:206: ctx.log(`detectNoShows: redispatch already completed for ${booking.id}`);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-projector-bookings.ts:92: } else if (status === 'COMPLETED') {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-projector-bookings.ts:94: // expiresAt derived from booking.completedAt (stable) so replays are idempotent.
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-projector-bookings.ts:102: expiresAt: stableExpiryFrom(doc.completedAt ?? doc.createdAt, RATING_PROMPT_EXPIRY_MS),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-reconcile-payouts.ts:7: import { getTechnicianForSettlement, incrementCompletedJobCount } from '../cosmos/technician-repository.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-reconcile-payouts.ts:84: await incrementCompletedJobCount(entry.technicianId);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-service-report.ts:32: if (!parsed.success || parsed.data.status !== 'COMPLETED') return;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:7: 'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:53: completedAt: z.string().optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:32: * E21-S01: One document per completed cash booking in the `commission_receivables` container
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:82: * reconstructed for a job completed months ago carries the date the debt was actually
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\dashboard.ts:17: kind: z.enum(['booking', 'assigned', 'completed', 'alert', 'payout', 'complaint']),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\finance.ts:41: completedJobsThisWeek: z.number().int().nonnegative(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\order.ts:8: 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\report.ts:5: completedAt: string;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\technician-dossier.ts:19: totalJobsCompleted: z.number().int().min(0).default(0),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\technician.ts:41: completedJobCount: z.number().int().min(0).optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\wallet-ledger.ts:15: completedJobCountAtSettlement: z.number().int().nonnegative(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\wallet-ledger.ts:35: completedJobCountAtSettlement: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\wallet.ts:110: * APPLIED = wallet debit completed. Legacy docs without this field = APPLIED.

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path api/src/functions/active-job.ts -TotalCount 180; Get-Content -Path api/src/functions/trigger-booking-completed.ts -TotalCount 230' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 586ms:
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
    bookingAmount,
    completedJobCountAtSettlement: completedJobCount,
    commissionBps,
    commissionAmount,
    techAmount,
    payoutCadence: effectiveCadence,
    payoutFeeAmount,
    heldForCadence,
  });
  if (!created) {
    ctx.log(`settleBooking: concurrent invocation already created wallet entry for ${bookingId} â€” skipping`);
    return;
  }

  if (heldForCadence) {
    const auditAction = effectiveCadence === 'NEXT_DAY' ? 'SETTLEMENT_HELD_NEXT_DAY' : 'SETTLEMENT_HELD_WEEKLY';
    try {
      await systemAuditEntry(auditAction, bookingId, { techAmount, payoutFeeAmount, technicianId });
    } catch (auditErr: unknown) {
      Sentry.captureException(auditErr);
    }
    return;
  }

  if (!tech?.razorpayLinkedAccountId) {
    await walletLedgerRepo.markFailed(bookingId, technicianId, 'no Razorpay linked account');
    await systemAuditEntry('ROUTE_TRANSFER_FAILED', bookingId, { reason: 'no Razorpay linked account' });
    return;
  }

  const razorpay = new RazorpayRouteService(); // nosemgrep: cash-razorpay-guard,api.cash-razorpay-guard
  let transferId: string;
  try {
    const result = await razorpay.transfer({
      accountId: tech.razorpayLinkedAccountId,
      amount: techAmount,
      notes: { bookingId, technicianId },
      idempotencyKey: bookingId,
    });
    transferId = result.transferId;
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    await walletLedgerRepo.markFailed(bookingId, technicianId, reason);
    Sentry.captureException(err);
    await systemAuditEntry('ROUTE_TRANSFER_FAILED', bookingId, { reason });
    return;
  }

  await walletLedgerRepo.markPaid(bookingId, technicianId, transferId);
  await systemAuditEntry('ROUTE_TRANSFER_INSTANT', bookingId, { transferId, techAmount, payoutFeeAmount });

  try {
    await incrementCompletedJobCount(technicianId);
    await sendTechEarningsUpdate(technicianId, { bookingId, techAmount });
  } catch (err: unknown) {
    Sentry.captureException(err);
  }
}

/**
 * P1 (Codex review, E21-S02 Task 8): a money-critical settlement failure (e.g. `recordCommissionDue`
 * rejecting because `getGlobalCommissionBps` or a catalogue lookup threw) must NOT be swallowed
 * here â€” swallowing it lets the change-feed processor checkpoint the lease, and the receivable is
 * then never created or retried. Sentry-capture and log for visibility, but rethrow so the lease is
 * NOT checkpointed and the whole batch is redelivered. settleBooking/recordCommissionDue/
 * finalizeLedgerForTechnician are all idempotent by bookingId, so redelivering documents already
 * processed successfully in this batch is safe.
 */
export async function handleBookingCompletedBatch(documents: unknown[], context: InvocationContext): Promise<void> {
  for (const doc of documents) {
    try {
      await settleBooking(doc, context);
    } catch (err: unknown) {
      Sentry.captureException(err);
      context.log(
        `settleBooking ERROR: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err;
    }
  }
}

app.cosmosDB('triggerBookingCompleted', {
  connection: 'COSMOS_CONNECTION_STRING',
  databaseName: DB_NAME,
  containerName: 'bookings',
  leaseContainerName: 'booking_completed_leases',
  createLeaseContainerIfNotExists: true,
  startFromBeginning: false,
  handler: handleBookingCompletedBatch,

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path api/src/**/*.ts -Pattern "status.*PAID|PAID|CLOSED" | ForEach-Object { "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" }' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 624ms:
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:74: if (existing.status === 'PAID') return existing; // webhook already processed — idempotent success
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:105: async markPaid(id: string, paymentId: string): Promise<BookingDoc | null> {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:108: const updated: BookingDoc = { ...existing, status: 'PAID', paymentId };
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:138: WHERE c.status IN ('PAID', 'UNFULFILLED')
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:162: 'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED'
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-receivable-repository.ts:104: * later remitted or waived was still a job the technician did and got paid for.
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\wallet-ledger-repository.ts:38: async markPaid(bookingId: string, technicianId: string, razorpayTransferId: string): Promise<void> {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\wallet-ledger-repository.ts:47: payoutStatus: 'PAID',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\wallet-ledger-repository.ts:115: /** Returns only PENDING and PAID entries for the given technician (FAILED excluded at query level). */
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\wallet-ledger-repository.ts:119: { query: `SELECT * FROM c WHERE c.payoutStatus IN ('PENDING', 'PAID')` },
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:270: const paid = await bookingRepo.markPaid(booking.id, 'cash_on_service_pending');
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:271: if (!paid) return { status: 500, jsonBody: { code: 'BOOKING_CONFIRMATION_FAILED' } };
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:332: const paid = await bookingRepo.markPaid(booking.id, 'manual_payment_not_configured');
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:333: if (!paid) return { status: 500, jsonBody: { code: 'BOOKING_CONFIRMATION_FAILED' } };
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:364: // NOT here. This prevents the "debit-before-payment" bug where an unpaid/abandoned booking
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:367: // For the fully-credit-paid path (P1-5): if credit covers 100% of the booking, we skip
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:368: // Razorpay entirely and mark the booking PAID directly — no payment intent is needed.
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:382: // P1-5: Credit covers 100% — skip Razorpay, mark PAID directly
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:399: // Apply credit synchronously for the fully-credit-paid path (no payment to wait for)
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:407: // P1-1: Verify the credit was actually applied before marking PAID.
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:413: // If we mark PAID without the credit being applied, the customer gets a free
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:414: // or underpaid booking (the Razorpay order was skipped entirely).
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:441: // Mark PAID immediately (no Razorpay payment involved)
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:442: const paid = await bookingRepo.markPaid(booking.id, 'credit_full_payment');
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:443: if (!paid) return { status: 500, jsonBody: { code: 'BOOKING_CONFIRMATION_FAILED' } };
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:632: // Only audit when this call actually performed the transition. If status is PAID the webhook
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\rating-escalate.ts:36: if (booking.status !== 'CLOSED') return { status: 409, jsonBody: { code: 'BOOKING_NOT_CLOSED' } };
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\ratings.ts:40: if (!['COMPLETED', 'PAID', 'CLOSED'].includes(booking.status)) {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\ratings.ts:41: return { status: 409, jsonBody: { code: 'BOOKING_NOT_CLOSED', status: booking.status } };
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\shield-report.ts:25: 'PAID',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\shield-report.ts:26: 'CLOSED',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\technicians.ts:326: AND c.status IN ('COMPLETED', 'PAID')
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:189: await walletLedgerRepo.markPaid(bookingId, technicianId, transferId);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-next-day-payout.ts:73: await walletLedgerRepo.markPaid(bookingId, technicianId, transferId);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-projector-bookings.ts:88: } else if (status === 'PAID' || status === 'IN_PROGRESS') {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-projector-complaints.ts:39: status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-projector-complaints.ts:46: const CLOSED_STATUSES = new Set(['RESOLVED', 'CLOSED']);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-projector-complaints.ts:87: } else if (CLOSED_STATUSES.has(status)) {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-rating-prompt.ts:19: if (!parsed.success || parsed.data.status !== 'CLOSED') return;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-reconcile-payouts.ts:81: await walletLedgerRepo.markPaid(entry.bookingId, entry.technicianId, transferId);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\webhooks.ts:60: if (booking.status === 'PAID') {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\webhooks.ts:64: const updated = await bookingRepo.markPaid(booking.id, paymentId);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\webhooks.ts:72: // Non-fatal: if credit application fails, the booking is already PAID — log and continue.
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\webhooks.ts:102: // Credit application failure is non-fatal — booking is already PAID.
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\webhooks.ts:117: event: 'booking-paid',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\webhooks.ts:127: // Event-ID replay defense written AFTER successful markPaid so a transient
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:7: 'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\order.ts:8: 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\wallet-ledger.ts:3: export const WalletLedgerPayoutStatusSchema = z.enum(['PENDING', 'PAID', 'FAILED']);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-allocator.service.ts:29: const paid = allocs.reduce((s, a) => s + a.paise, 0);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-allocator.service.ts:30: return paid >= e.commissionDue ? 'REMITTED' : 'DUE';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-allocator.service.ts:60: *  the default is FAIL-CLOSED — it requires `existing.amountPaise` to be a number equal to
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-allocator.service.ts:122: // Fail-closed default: an anchor type without a numeric amountPaise MUST supply `matches`.
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\dispatcher.service.ts:75: if (booking.status !== 'PAID') {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\dispatcher.service.ts:76: await updateBookingFields(bookingId, { status: 'PAID' });
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\dispatcher.service.ts:144: if (!booking || booking.status !== 'PAID') {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\featureFlags.service.ts:78: * (no credit applied, no error) — safe fail-closed so credit spend is controlled.
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\featureFlags.service.ts:86: * Fail-closed contracts (credit = money — never silently spend):
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\featureFlags.service.ts:99: if (!result.success) return false; // timeout → fail closed
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\featureFlags.service.ts:102: return false; // unexpected SDK throw → fail closed
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\pending-action-projector.ts:172: * Mark a pending action as RESOLVED (e.g., booking moves to PAID after add-on).
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\service-area.service.ts:25: * @param polygon - A GeoJSON Feature<Polygon> with a closed exterior ring
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\shared\payouts-enabled.ts:2: * P0-0 — Kill switch for the dormant prepaid (Razorpay Route) payout machinery.
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\shared\payouts-enabled.ts:5: * platform a commission (see `commission_receivables`). The prepaid-era code paths

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path api/src/functions/ratings.ts -TotalCount 160; Get-Content -Path api/src/functions/trigger-rating-prompt.ts -TotalCount 120' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 565ms:
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
      doc.techSubmittedAt, techVisible,
    ),
  };
  return { status: 200, jsonBody: response };
};

app.http('submitRating', { route: 'v1/ratings', methods: ['POST'], handler: submitRatingHandler });
app.http('getRating', { route: 'v1/ratings/{bookingId}', methods: ['GET'], handler: getRatingHandler });
import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { BookingDocSchema } from '../schemas/booking.js';
import { ratingRepo } from '../cosmos/rating-repository.js';
import {
  sendRatingPromptCustomerPush,
  sendRatingPromptTechnicianPush,
} from '../services/fcm.service.js';

const DB_NAME = process.env['COSMOS_DATABASE'] ?? 'homeservices';

export async function dispatchRatingPrompt(
  bookingRaw: unknown,
  ctx: InvocationContext,
): Promise<void> {
  const parsed = BookingDocSchema.safeParse(bookingRaw);
  if (!parsed.success || parsed.data.status !== 'CLOSED') return;
  const booking = parsed.data;
  if (!booking.technicianId) { ctx.log(`no technicianId on ${booking.id}`); return; }

  if (await ratingRepo.getByBookingId(booking.id)) {
    ctx.log(`rating doc exists for ${booking.id} â€” skipping prompt`);
    return;
  }

  const results = await Promise.allSettled([
    sendRatingPromptCustomerPush(booking.customerId, booking.id),
    sendRatingPromptTechnicianPush(booking.technicianId, booking.id),
  ]);
  for (const r of results) {
    if (r.status === 'rejected') {
      Sentry.captureException(r.reason);
      ctx.log(`rating-prompt push failed for ${booking.id}: ${String(r.reason)}`);
    }
  }
}

app.cosmosDB('triggerRatingPrompt', {
  connection: 'COSMOS_CONNECTION_STRING',
  databaseName: DB_NAME,
  containerName: 'bookings',
  leaseContainerName: 'booking_rating_prompt_leases',
  createLeaseContainerIfNotExists: true,
  startFromBeginning: false,
  handler: async (docs: unknown[], context: InvocationContext): Promise<void> => {
    for (const doc of docs) await dispatchRatingPrompt(doc, context);
  },
});

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path api/src/cosmos/booking-repository.ts -TotalCount 220' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 544ms:
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
    const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
    return resource!;
  },

  async getByPaymentOrderId(orderId: string): Promise<BookingDoc | null> {
    const { resources } = await getBookingsContainer()
      .items.query<BookingDoc>({
        query: 'SELECT * FROM c WHERE c.paymentOrderId = @orderId',
        parameters: [{ name: '@orderId', value: orderId }],
      })
      .fetchAll();
    return resources[0] ?? null;
  },

  async markPaid(id: string, paymentId: string): Promise<BookingDoc | null> {
    const { resource: existing, etag } = await getBookingsContainer().item(id, id).read<BookingDoc>();
    if (!existing || (existing.status !== 'SEARCHING' && existing.status !== 'PENDING_PAYMENT')) return null;
    const updated: BookingDoc = { ...existing, status: 'PAID', paymentId };
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
    const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
    return resource!;
  },

  async getStaleSearching(olderThanIso: string): Promise<BookingDoc[]> {
    const { resources } = await getBookingsContainer().items.query<BookingDoc>({
      query: "SELECT * FROM c WHERE c.status = 'SEARCHING' AND c.createdAt < @cutoff",
      parameters: [{ name: '@cutoff', value: olderThanIso }],
    }).fetchAll();
    return resources;
  },

  async getBookingsAwaitingDispatch(limit = 100): Promise<BookingDoc[]> {
    const { resources } = await getBookingsContainer().items.query<BookingDoc>({
      query: `SELECT * FROM c
              WHERE c.status IN ('PAID', 'UNFULFILLED')
                AND (NOT IS_DEFINED(c.technicianId) OR IS_NULL(c.technicianId))`,
      parameters: [],
    }).fetchAll();
    return resources.slice(0, limit);
  },

  async getAssignedBookingsBefore(slotDateCutoff: string): Promise<BookingDoc[]> {
    const { resources } = await getBookingsContainer()
      .items.query<BookingDoc>({
        query: "SELECT * FROM c WHERE (c.status IN ('ASSIGNED', 'NO_SHOW_REDISPATCH') OR (c.status = 'SEARCHING' AND IS_DEFINED(c.noShowTechnicianId))) AND c.slotDate <= @slotDate",
        parameters: [{ name: '@slotDate', value: slotDateCutoff }],
      })
      .fetchAll();
    return resources;
  },

  async getByTechnicianId(technicianId: string): Promise<BookingDoc[]> {
    const { resources } = await getBookingsContainer()
      .items.query<BookingDoc>({
        query: `SELECT * FROM c
                WHERE c.technicianId = @technicianId
                  AND c.status IN (
                    'ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS',
                    'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED'
                  )`,
        parameters: [{ name: '@technicianId', value: technicianId }],
      })
      .fetchAll();
    // Sort in-memory after the composite index is provisioned (see
    // scripts/provision-cosmos-indexes.ts). The index covers [/technicianId,
    // /slotDate, /slotWindow] so ORDER BY in the query is also valid, but
    // in-memory sort keeps this function safe even before the first index rebuild.
    return resources.sort(
      (a, b) =>
        a.slotDate.localeCompare(b.slotDate) || a.slotWindow.localeCompare(b.slotWindow),
    );
  },

  async hasActiveBookingForTechnician(technicianId: string): Promise<boolean> {
    const { resources } = await getBookingsContainer()
      .items.query<{ id: string }>({
        query: `SELECT TOP 1 c.id FROM c
                WHERE c.technicianId = @technicianId
                  AND c.status IN ('ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL')`,
        parameters: [{ name: '@technicianId', value: technicianId }],
      })
      .fetchNext();
    return resources.length > 0;
  },

  async getByCustomerId(customerId: string): Promise<BookingDoc[]> {
    const { resources } = await getBookingsContainer()
      .items.query<BookingDoc>({
        query: `SELECT * FROM c
                WHERE c.customerId = @customerId`,
        parameters: [{ name: '@customerId', value: customerId }],
      })
      .fetchAll();
    return resources.sort((a, b) => {
      const slotCompare = b.slotDate.localeCompare(a.slotDate) || b.slotWindow.localeCompare(a.slotWindow);
      return slotCompare || b.createdAt.localeCompare(a.createdAt);
    });
  },

  async requestAddOn(id: string, addOn: PendingAddOn): Promise<BookingDoc | null> {
    const existing = await this.getById(id);
    if (!existing || existing.status !== 'IN_PROGRESS') return null;
    const updated: BookingDoc = {
      ...existing,
      status: 'AWAITING_PRICE_APPROVAL',
      pendingAddOns: [...(existing.pendingAddOns ?? []), addOn],
      // Stable anchor for the ADDON_APPROVAL_REQUESTED pending-action expiry.
      // Written atomically with the status transition so the change-feed projector
      // can derive 24h from the actual request time (not the booking createdAt).
      pendingAddOnsUpdatedAt: new Date().toISOString(),
    };
    const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
    return resource!;
  },

  async applyAddOnDecisions(id: string, customerId: string, decisions: AddOnDecision[]): Promise<BookingDoc | null> {
    const existing = await this.getById(id);

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git status --short; git diff 5bfc0361aab64f7b637128c6c3fee9828a80393d -- docs/reviews/codex-historical-receivables-20260907-0704.md docs/reviews/codex-historical-receivables-round2.md | Select-Object -First 200' in C:\Alok\Business Projects\wt-fix-cosmos-pages
2026-09-07T11:20:31.682117Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.7 seconds
Output:
?? docs/reviews/codex-historical-receivables-round3.md
diff --git a/docs/reviews/codex-historical-receivables-20260907-0704.md b/docs/reviews/codex-historical-receivables-20260907-0704.md
new file mode 100644
index 00000000..e0c39bdf
--- /dev/null
+++ b/docs/reviews/codex-historical-receivables-20260907-0704.md
@@ -0,0 +1,5933 @@
+2026-09-07T11:04:20.169220Z ERROR codex_models_manager::manager: failed to load models cache: missing field `supports_parallel_tool_calls` at line 132 column 5
+OpenAI Codex v0.147.0
+--------
+workdir: C:\Alok\Business Projects\wt-fix-cosmos-pages
+model: gpt-5.5
+provider: openai
+approval: never
+sandbox: workspace-write [workdir, /tmp, $TMPDIR]
+reasoning effort: high
+reasoning summaries: none
+session id: 01a07b8a-5d5d-7451-9966-47e65773d744
+--------
+user
+changes against 'main'
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force -Name' in C:\Alok\Business Projects\wt-fix-cosmos-pages
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --stat 5bfc0361aab64f7b637128c6c3fee9828a80393d' in C:\Alok\Business Projects\wt-fix-cosmos-pages
+ succeeded in 536ms:
+.claire
+.firebase
+.githooks
+.github
+.serena
+.superpowers
+admin-web
+api
+artifacts
+commonMain
+core-nav
+customer-app
+design-system
+docs
+figma
+firebase
+infra
+moto-g-snapshots
+plans
+play-store-assets
+technician-app
+tools
+_bmad
+_bmad-output
+.bmad-readiness-passed
+.codex-review-passed
+.firebaserc
+.git
+.gitattributes
+.gitignore
+.semgrepignore
+CLAUDE.md
+firebase.json
+TOKEN-SYNC.md
+
+ succeeded in 626ms:
+ api/scripts/backfill-historical-receivables.ts     | 150 ++++++++++++++++++
+ api/src/services/commission-settlement.service.ts  |  50 ++++--
+ .../backfill-historical-receivables.test.ts        | 174 +++++++++++++++++++++
+ 3 files changed, 361 insertions(+), 13 deletions(-)
+warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied
+
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Path . -Filter AGENTS* -Recurse -Force | Select-Object -ExpandProperty FullName' in C:\Alok\Business Projects\wt-fix-cosmos-pages
+ succeeded in 1944ms:
+C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\.pnpm\teeny-request@9.0.0\node_modules\teeny-request\build\src\agents.d.ts
+C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\.pnpm\teeny-request@9.0.0\node_modules\teeny-request\build\src\agents.js
+C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\.pnpm\teeny-request@9.0.0\node_modules\teeny-request\build\src\agents.js.map
+
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --no-ext-diff --unified=80 5bfc0361aab64f7b637128c6c3fee9828a80393d -- api/scripts/backfill-historical-receivables.ts api/src/services/commission-settlement.service.ts api/src/__tests__/backfill-historical-receivables.test.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
+ succeeded in 515ms:
+diff --git a/api/scripts/backfill-historical-receivables.ts b/api/scripts/backfill-historical-receivables.ts
+new file mode 100644
+index 00000000..136b34f5
+--- /dev/null
++++ b/api/scripts/backfill-historical-receivables.ts
+@@ -0,0 +1,150 @@
++#!/usr/bin/env tsx
++// One-off backfill for cash bookings that COMPLETED before the commission ledger physically
++// existed in an environment. In production the `commission_receivables` container was never
++// created (setup-cosmos.ts had not been run since E21-S01 shipped), so every completed cash
++// booking settled into a 404 and no receivable was ever recorded.
++//
++// Run (default, read-only): npx tsx scripts/backfill-historical-receivables.ts
++//                     apply: npx tsx scripts/backfill-historical-receivables.ts --apply
++//
++// Requires: COSMOS_CONNECTION_STRING, or COSMOS_ENDPOINT + COSMOS_KEY (see src/cosmos/client.ts).
++//
++// Deliberately calls `recordCommissionDue`, NOT `settleCashCompletion`: the latter also increments
++// completedJobCount and sends an EARNINGS_UPDATE push. Firing those for a job finished months ago
++// would double-count job totals and notify technicians about ancient work. The ledger row is what
++// is missing; the side effects already happened (or didn't) at the time.
++//
++// Idempotent: `recordCommissionDue` is keyed on bookingId and returns `created: false` for a row
++// that already exists, and this script skips such bookings before calling it at all.
++
++import { fileURLToPath } from 'node:url';
++import { argv } from 'node:process';
++import { getBookingsContainer } from '../src/cosmos/client.js';
++import { commissionReceivableRepo } from '../src/cosmos/commission-receivable-repository.js';
++import {
++  recordCommissionDue,
++  resolveCommissionForBooking,
++} from '../src/services/commission-settlement.service.js';
++import { systemAudit } from '../src/services/auditLog.service.js';
++import { BookingDocSchema } from '../src/schemas/booking.js';
++
++const KNOWN_FLAGS = new Set(['--dry-run', '--apply']);
++
++// RAZORPAY bookings settle through the wallet-ledger path and must never get a cash receivable.
++// Legacy docs may omit paymentMethod entirely; those default to cash, matching recordCommissionDue.
++const QUERY =
++  "SELECT * FROM c WHERE c.status = 'COMPLETED' AND (NOT IS_DEFINED(c.paymentMethod) OR c.paymentMethod != 'RAZORPAY')";
++
++const rupees = (paise: number): string => `Rs ${(paise / 100).toFixed(2)}`;
++
++export async function main(argvArgs: string[]): Promise<void> {
++  const unknown = argvArgs.filter((a) => !KNOWN_FLAGS.has(a));
++  if (unknown.length > 0) {
++    console.error(`Unknown flag(s): ${unknown.join(', ')}`);
++    console.error('Usage: backfill-historical-receivables.ts [--dry-run|--apply]');
++    process.exit(2);
++    return;
++  }
++
++  const apply = argvArgs.includes('--apply');
++  if (apply && argvArgs.includes('--dry-run')) {
++    console.error('Pass either --dry-run or --apply, not both.');
++    process.exit(2);
++    return;
++  }
++
++  console.log(`historical commission-receivable backfill — mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
++  console.log('');
++
++  const iterator = getBookingsContainer().items.query({ query: QUERY }, { maxItemCount: 100 });
++  const bookings: unknown[] = [];
++  while (iterator.hasMoreResults()) {
++    const page = await iterator.fetchNext();
++    // Cosmos hands back `resources: undefined` on some pages — never spread it unguarded.
++    bookings.push(...(page.resources ?? []));
++  }
++
++  let created = 0;
++  let alreadyPresent = 0;
++  let unparseable = 0;
++  let skipped = 0;
++  let totalPaise = 0;
++
++  for (const raw of bookings) {
++    const parsed = BookingDocSchema.safeParse(raw);
++    if (!parsed.success) {
++      unparseable += 1;
++      console.log(`  SKIP (unparseable) ${(raw as { id?: string })?.id ?? '<no id>'}`);
++      continue;
++    }
++    const booking = parsed.data;
++    if (!booking.technicianId) {
++      skipped += 1;
++      console.log(`  SKIP (no technician) ${booking.id}`);
++      continue;
++    }
++
++    const existing = await commissionReceivableRepo.getByBookingId(booking.id, booking.technicianId);
++    if (existing) {
++      alreadyPresent += 1;
++      console.log(`  HAVE ${booking.id}  ${rupees(existing.commissionDue)} already recorded`);
++      continue;
++    }
++
++    const preview = await resolveCommissionForBooking(booking);
++    totalPaise += preview.commissionDue;
++
++    if (!apply) {
++      console.log(
++        `  WOULD ADD ${booking.id}  tech=${booking.technicianId}  ${preview.serviceName ?? '<service?>'}  ` +
++          `booking=${rupees(preview.bookingAmount)}  bps=${preview.bps} (${preview.commissionResolvedFrom})  ` +
++          `commission=${rupees(preview.commissionDue)}`,
++      );
++      continue;
++    }
++
++    const result = await recordCommissionDue(booking);
++    if ('skipped' in result) {
++      skipped += 1;
++      console.log(`  SKIP (${result.skipped}) ${booking.id}`);
++      continue;
++    }
++    if (!result.created) {
++      alreadyPresent += 1;
++      console.log(`  HAVE ${booking.id} (created concurrently)`);
++      continue;
++    }
++
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

 exited 1 in 694ms:
?? docs/reviews/codex-historical-receivables-round3.md
diff --git a/docs/reviews/codex-historical-receivables-20260907-0704.md b/docs/reviews/codex-historical-receivables-20260907-0704.md
new file mode 100644
index 00000000..e0c39bdf
--- /dev/null
+++ b/docs/reviews/codex-historical-receivables-20260907-0704.md
@@ -0,0 +1,5933 @@
+2026-09-07T11:04:20.169220Z ERROR codex_models_manager::manager: failed to load models cache: missing field `supports_parallel_tool_calls` at line 132 column 5
+OpenAI Codex v0.147.0
+--------
+workdir: C:\Alok\Business Projects\wt-fix-cosmos-pages
+model: gpt-5.5
+provider: openai
+approval: never
+sandbox: workspace-write [workdir, /tmp, $TMPDIR]
+reasoning effort: high
+reasoning summaries: none
+session id: 01a07b8a-5d5d-7451-9966-47e65773d744
+--------
+user
+changes against 'main'
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force -Name' in C:\Alok\Business Projects\wt-fix-cosmos-pages
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --stat 5bfc0361aab64f7b637128c6c3fee9828a80393d' in C:\Alok\Business Projects\wt-fix-cosmos-pages
+ succeeded in 536ms:
+.claire
+.firebase
+.githooks
+.github
+.serena
+.superpowers
+admin-web
+api
+artifacts
+commonMain
+core-nav
+customer-app
+design-system
+docs
+figma
+firebase
+infra
+moto-g-snapshots
+plans
+play-store-assets
+technician-app
+tools
+_bmad
+_bmad-output
+.bmad-readiness-passed
+.codex-review-passed
+.firebaserc
+.git
+.gitattributes
+.gitignore
+.semgrepignore
+CLAUDE.md
+firebase.json
+TOKEN-SYNC.md
+
+ succeeded in 626ms:
+ api/scripts/backfill-historical-receivables.ts     | 150 ++++++++++++++++++
+ api/src/services/commission-settlement.service.ts  |  50 ++++--
+ .../backfill-historical-receivables.test.ts        | 174 +++++++++++++++++++++
+ 3 files changed, 361 insertions(+), 13 deletions(-)
+warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied
+
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Path . -Filter AGENTS* -Recurse -Force | Select-Object -ExpandProperty FullName' in C:\Alok\Business Projects\wt-fix-cosmos-pages
+ succeeded in 1944ms:
+C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\.pnpm\teeny-request@9.0.0\node_modules\teeny-request\build\src\agents.d.ts
+C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\.pnpm\teeny-request@9.0.0\node_modules\teeny-request\build\src\agents.js
+C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\.pnpm\teeny-request@9.0.0\node_modules\teeny-request\build\src\agents.js.map
+
+exec
+"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --no-ext-diff --unified=80 5bfc0361aab64f7b637128c6c3fee9828a80393d -- api/scripts/backfill-historical-receivables.ts api/src/services/commission-settlement.service.ts api/src/__tests__/backfill-historical-receivables.test.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
+ succeeded in 515ms:
+diff --git a/api/scripts/backfill-historical-receivables.ts b/api/scripts/backfill-historical-receivables.ts
+new file mode 100644
+index 00000000..136b34f5
+--- /dev/null
++++ b/api/scripts/backfill-historical-receivables.ts
+@@ -0,0 +1,150 @@
++#!/usr/bin/env tsx
++// One-off backfill for cash bookings that COMPLETED before the commission ledger physically
++// existed in an environment. In production the `commission_receivables` container was never
++// created (setup-cosmos.ts had not been run since E21-S01 shipped), so every completed cash
++// booking settled into a 404 and no receivable was ever recorded.
++//
++// Run (default, read-only): npx tsx scripts/backfill-historical-receivables.ts
++//                     apply: npx tsx scripts/backfill-historical-receivables.ts --apply
++//
++// Requires: COSMOS_CONNECTION_STRING, or COSMOS_ENDPOINT + COSMOS_KEY (see src/cosmos/client.ts).
++//
++// Deliberately calls `recordCommissionDue`, NOT `settleCashCompletion`: the latter also increments
++// completedJobCount and sends an EARNINGS_UPDATE push. Firing those for a job finished months ago
++// would double-count job totals and notify technicians about ancient work. The ledger row is what
++// is missing; the side effects already happened (or didn't) at the time.
++//
++// Idempotent: `recordCommissionDue` is keyed on bookingId and returns `created: false` for a row
++// that already exists, and this script skips such bookings before calling it at all.
++
++import { fileURLToPath } from 'node:url';
++import { argv } from 'node:process';
++import { getBookingsContainer } from '../src/cosmos/client.js';
++import { commissionReceivableRepo } from '../src/cosmos/commission-receivable-repository.js';
++import {
++  recordCommissionDue,
++  resolveCommissionForBooking,
++} from '../src/services/commission-settlement.service.js';
++import { systemAudit } from '../src/services/auditLog.service.js';
++import { BookingDocSchema } from '../src/schemas/booking.js';
++
++const KNOWN_FLAGS = new Set(['--dry-run', '--apply']);
++
++// RAZORPAY bookings settle through the wallet-ledger path and must never get a cash receivable.
++// Legacy docs may omit paymentMethod entirely; those default to cash, matching recordCommissionDue.
++const QUERY =
++  "SELECT * FROM c WHERE c.status = 'COMPLETED' AND (NOT IS_DEFINED(c.paymentMethod) OR c.paymentMethod != 'RAZORPAY')";
++
++const rupees = (paise: number): string => `Rs ${(paise / 100).toFixed(2)}`;
++
++export async function main(argvArgs: string[]): Promise<void> {
++  const unknown = argvArgs.filter((a) => !KNOWN_FLAGS.has(a));
++  if (unknown.length > 0) {
++    console.error(`Unknown flag(s): ${unknown.join(', ')}`);
++    console.error('Usage: backfill-historical-receivables.ts [--dry-run|--apply]');
++    process.exit(2);
++    return;
++  }
++
++  const apply = argvArgs.includes('--apply');
++  if (apply && argvArgs.includes('--dry-run')) {
++    console.error('Pass either --dry-run or --apply, not both.');
++    process.exit(2);
++    return;
++  }
++
++  console.log(`historical commission-receivable backfill — mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
++  console.log('');
++
++  const iterator = getBookingsContainer().items.query({ query: QUERY }, { maxItemCount: 100 });
++  const bookings: unknown[] = [];
++  while (iterator.hasMoreResults()) {
++    const page = await iterator.fetchNext();
++    // Cosmos hands back `resources: undefined` on some pages — never spread it unguarded.
++    bookings.push(...(page.resources ?? []));
++  }
++
++  let created = 0;
++  let alreadyPresent = 0;
++  let unparseable = 0;
++  let skipped = 0;
++  let totalPaise = 0;
++
++  for (const raw of bookings) {
++    const parsed = BookingDocSchema.safeParse(raw);
++    if (!parsed.success) {
++      unparseable += 1;
++      console.log(`  SKIP (unparseable) ${(raw as { id?: string })?.id ?? '<no id>'}`);
++      continue;
++    }
++    const booking = parsed.data;
++    if (!booking.technicianId) {
++      skipped += 1;
++      console.log(`  SKIP (no technician) ${booking.id}`);
++      continue;
++    }
++
++    const existing = await commissionReceivableRepo.getByBookingId(booking.id, booking.technicianId);
++    if (existing) {
++      alreadyPresent += 1;
++      console.log(`  HAVE ${booking.id}  ${rupees(existing.commissionDue)} already recorded`);
++      continue;
++    }
++
++    const preview = await resolveCommissionForBooking(booking);
++    totalPaise += preview.commissionDue;
++
++    if (!apply) {
++      console.log(
++        `  WOULD ADD ${booking.id}  tech=${booking.technicianId}  ${preview.serviceName ?? '<service?>'}  ` +
++          `booking=${rupees(preview.bookingAmount)}  bps=${preview.bps} (${preview.commissionResolvedFrom})  ` +
++          `commission=${rupees(preview.commissionDue)}`,
++      );
++      continue;
++    }
++
++    const result = await recordCommissionDue(booking);
++    if ('skipped' in result) {
++      skipped += 1;
++      console.log(`  SKIP (${result.skipped}) ${booking.id}`);
++      continue;
++    }
++    if (!result.created) {
++      alreadyPresent += 1;
++      console.log(`  HAVE ${booking.id} (created concurrently)`);
++      continue;
++    }
++
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content api/scripts/backfill-historical-receivables.ts | ForEach-Object { "{0,4}: {1}" -f $i, $_; $i++ } | Select-Object -First 110' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 662ms:
   1: #!/usr/bin/env tsx
   2: // One-off backfill for cash bookings that COMPLETED before the commission ledger physically
   3: // existed in an environment. In production the `commission_receivables` container was never
   4: // created (setup-cosmos.ts had not been run since E21-S01 shipped), so every completed cash
   5: // booking settled into a 404 and no receivable was ever recorded.
   6: //
   7: // Run (default, read-only): npx tsx scripts/backfill-historical-receivables.ts
   8: //                     apply: npx tsx scripts/backfill-historical-receivables.ts --apply
   9: //
  10: // Requires: COSMOS_CONNECTION_STRING, or COSMOS_ENDPOINT + COSMOS_KEY (see src/cosmos/client.ts).
  11: //
  12: // Deliberately calls `recordCommissionDue`, NOT `settleCashCompletion`: the latter also increments
  13: // completedJobCount and sends an EARNINGS_UPDATE push. Firing those for a job finished months ago
  14: // would double-count job totals and notify technicians about ancient work. The ledger row is what
  15: // is missing; the side effects already happened (or didn't) at the time.
  16: //
  17: // Idempotent: `recordCommissionDue` is keyed on bookingId and returns `created: false` for a row
  18: // that already exists, and this script skips such bookings before calling it at all.
  19: 
  20: import { fileURLToPath } from 'node:url';
  21: import { argv } from 'node:process';
  22: import { getBookingsContainer } from '../src/cosmos/client.js';
  23: import { commissionReceivableRepo } from '../src/cosmos/commission-receivable-repository.js';
  24: import {
  25:   finalizeLedgerForTechnician,
  26:   recordCommissionDue,
  27:   resolveCommissionForBooking,
  28: } from '../src/services/commission-settlement.service.js';
  29: import { systemAudit } from '../src/services/auditLog.service.js';
  30: import { BookingDocSchema } from '../src/schemas/booking.js';
  31: 
  32: const KNOWN_FLAGS = new Set(['--dry-run', '--apply']);
  33: const CUTOFF_FLAG = '--completed-before=';
  34: 
  35: // RAZORPAY bookings settle through the wallet-ledger path and must never get a cash receivable.
  36: // Legacy docs may omit paymentMethod entirely; those default to cash, matching recordCommissionDue.
  37: //
  38: // The @cutoff bound is not cosmetic (Codex review, 2026-09-07): active-job.ts writes
  39: // status: 'COMPLETED' and only *then* calls settleCashCompletion. A backfill running inside that
  40: // window would create the receivable first, so the live path would see `created: false` and skip
  41: // the side effects that belong to a current job â€” the technician would silently lose a
  42: // completedJobCount increment and an EARNINGS_UPDATE push. Only ever backfill jobs old enough
  43: // that their settlement has certainly already been attempted.
  44: const QUERY =
  45:   "SELECT * FROM c WHERE c.status = 'COMPLETED' AND (NOT IS_DEFINED(c.paymentMethod) OR c.paymentMethod != 'RAZORPAY') AND ((IS_DEFINED(c.completedAt) AND c.completedAt < @cutoff) OR (NOT IS_DEFINED(c.completedAt) AND c.createdAt < @cutoff))";
  46: 
  47: const rupees = (paise: number): string => `Rs ${(paise / 100).toFixed(2)}`;
  48: 
  49: export async function main(argvArgs: string[]): Promise<void> {
  50:   const cutoffArg = argvArgs.find((a) => a.startsWith(CUTOFF_FLAG));
  51:   const unknown = argvArgs.filter((a) => !KNOWN_FLAGS.has(a) && !a.startsWith(CUTOFF_FLAG));
  52:   if (unknown.length > 0) {
  53:     console.error(`Unknown flag(s): ${unknown.join(', ')}`);
  54:     console.error('Usage: backfill-historical-receivables.ts [--dry-run|--apply] --completed-before=<ISO>');
  55:     process.exit(2);
  56:     return;
  57:   }
  58: 
  59:   // Fail closed: an operator must state the cutoff, rather than inherit a default that silently
  60:   // swallows a job completed thirty seconds ago.
  61:   const cutoff = cutoffArg?.slice(CUTOFF_FLAG.length);
  62:   if (!cutoff || Number.isNaN(Date.parse(cutoff))) {
  63:     console.error('--completed-before=<ISO timestamp> is required (e.g. --completed-before=2026-09-01T00:00:00.000Z).');
  64:     console.error('Only bookings completed strictly before it are eligible, so a job settling right now is never claimed.');
  65:     process.exit(2);
  66:     return;
  67:   }
  68: 
  69:   const apply = argvArgs.includes('--apply');
  70:   if (apply && argvArgs.includes('--dry-run')) {
  71:     console.error('Pass either --dry-run or --apply, not both.');
  72:     process.exit(2);
  73:     return;
  74:   }
  75: 
  76:   console.log(`historical commission-receivable backfill â€” mode=${apply ? 'APPLY' : 'DRY-RUN'} cutoff=${cutoff}`);
  77:   console.log('');
  78: 
  79:   const iterator = getBookingsContainer().items.query(
  80:     { query: QUERY, parameters: [{ name: '@cutoff', value: cutoff }] },
  81:     { maxItemCount: 100 },
  82:   );
  83:   const bookings: unknown[] = [];
  84:   while (iterator.hasMoreResults()) {
  85:     const page = await iterator.fetchNext();
  86:     // Cosmos hands back `resources: undefined` on some pages â€” never spread it unguarded.
  87:     bookings.push(...(page.resources ?? []));
  88:   }
  89: 
  90:   // Technicians who gained at least one row, so their credits can be consumed and their hold
  91:   // recomputed once at the end rather than per row.
  92:   const touched = new Set<string>();
  93:   let created = 0;
  94:   let alreadyPresent = 0;
  95:   let unparseable = 0;
  96:   let skipped = 0;
  97:   let totalPaise = 0;
  98: 
  99:   for (const raw of bookings) {
 100:     const parsed = BookingDocSchema.safeParse(raw);
 101:     if (!parsed.success) {
 102:       unparseable += 1;
 103:       console.log(`  SKIP (unparseable) ${(raw as { id?: string })?.id ?? '<no id>'}`);
 104:       continue;
 105:     }
 106:     const booking = parsed.data;
 107:     if (!booking.technicianId) {
 108:       skipped += 1;
 109:       console.log(`  SKIP (no technician) ${booking.id}`);
 110:       continue;

codex
The cutoff guard is intended to prevent the backfill from touching live completions, but it accepts parseable non-ISO strings that break the lexicographic Cosmos timestamp comparison. That can make the one-off script process bookings outside the intended historical window.

Review comment:

- [P2] Reject non-ISO cutoff strings — C:\Alok\Business Projects\wt-fix-cosmos-pages\api\scripts\backfill-historical-receivables.ts:62-62
  If an operator passes a parseable but non-ISO cutoff such as `9/1/2026`, this guard accepts it and sends that raw string into the Cosmos query, where `completedAt`/`createdAt` are compared lexicographically as ISO strings. Because values like `2026-09-07T...` sort before `9/1/2026`, the backfill can include current jobs and defeat the safety window, causing `recordCommissionDue` to claim live settlements before `settleCashCompletion` runs. Please reject non-canonical ISO input or normalize `cutoff` with `new Date(cutoff).toISOString()` before binding it.
The cutoff guard is intended to prevent the backfill from touching live completions, but it accepts parseable non-ISO strings that break the lexicographic Cosmos timestamp comparison. That can make the one-off script process bookings outside the intended historical window.

Review comment:

- [P2] Reject non-ISO cutoff strings — C:\Alok\Business Projects\wt-fix-cosmos-pages\api\scripts\backfill-historical-receivables.ts:62-62
  If an operator passes a parseable but non-ISO cutoff such as `9/1/2026`, this guard accepts it and sends that raw string into the Cosmos query, where `completedAt`/`createdAt` are compared lexicographically as ISO strings. Because values like `2026-09-07T...` sort before `9/1/2026`, the backfill can include current jobs and defeat the safety window, causing `recordCommissionDue` to claim live settlements before `settleCashCompletion` runs. Please reject non-canonical ISO input or normalize `cutoff` with `new Date(cutoff).toISOString()` before binding it.
