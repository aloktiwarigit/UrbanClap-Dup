2026-09-07T11:22:48.737606Z ERROR codex_models_manager::manager: failed to load models cache: missing field `supports_parallel_tool_calls` at line 132 column 5
OpenAI Codex v0.147.0
--------
workdir: C:\Alok\Business Projects\wt-fix-cosmos-pages
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: high
reasoning summaries: none
session id: 01a07b9b-47eb-7820-82cc-c401b31a048c
--------
user
changes against 'main'
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 623ms:


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
d-----          9/7/2026   7:22 AM                api                                                                  
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Recurse -Force -Filter AGENTS*.md | Select-Object -ExpandProperty FullName' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 3695ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff 5bfc0361aab64f7b637128c6c3fee9828a80393d --stat' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 596ms:
 api/scripts/backfill-historical-receivables.ts     |  197 +
 api/src/cosmos/commission-receivable-repository.ts |    2 +-
 api/src/schemas/commission-receivable.ts           |    8 +
 api/src/services/commission-settlement.service.ts  |   55 +-
 .../backfill-historical-receivables.test.ts        |  265 +
 .../codex-historical-receivables-20260907-0704.md  | 5933 ++++++++++++++++++++
 .../reviews/codex-historical-receivables-round2.md | 3029 ++++++++++
 .../reviews/codex-historical-receivables-round3.md | 3817 +++++++++++++
 8 files changed, 13291 insertions(+), 15 deletions(-)
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff 5bfc0361aab64f7b637128c6c3fee9828a80393d -- api/scripts/backfill-historical-receivables.ts api/src/cosmos/commission-receivable-repository.ts api/src/schemas/commission-receivable.ts api/src/services/commission-settlement.service.ts api/tests/scripts/backfill-historical-receivables.test.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 538ms:
diff --git a/api/scripts/backfill-historical-receivables.ts b/api/scripts/backfill-historical-receivables.ts
new file mode 100644
index 00000000..9ab1af4d
--- /dev/null
+++ b/api/scripts/backfill-historical-receivables.ts
@@ -0,0 +1,197 @@
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
+  const cutoffRaw = cutoffArg?.slice(CUTOFF_FLAG.length);
+  // Normalise to canonical ISO before binding. Cosmos compares these timestamps
+  // lexicographically, so a parseable-but-non-ISO cutoff like "9/1/2026" would sort *after*
+  // "2026-09-07T..." and silently widen the window to include live completions — the exact
+  // thing the cutoff exists to prevent.
+  const cutoff =
+    cutoffRaw && !Number.isNaN(Date.parse(cutoffRaw)) ? new Date(cutoffRaw).toISOString() : undefined;
+  if (!cutoff) {
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
index 00000000..97e8b777
--- /dev/null
+++ b/api/tests/scripts/backfill-historical-receivables.test.ts
@@ -0,0 +1,265 @@
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
+  // Codex review round 3, 2026-09-07 (P2): Cosmos compares these lexicographically, so a
+  // non-ISO cutoff would sort after real timestamps and widen the window instead of narrowing it.
+  it('normalises a non-ISO cutoff to canonical ISO before binding it', async () => {
+    onePage([booking()]);
+
+    await main(['--completed-before=9/1/2026', '--dry-run']);
+
+    const [spec] = querySpy.mock.calls.at(-1) as [{ parameters: Array<{ name: string; value: string }> }];
+    expect(spec.parameters[0]!.value).toBe(new Date('9/1/2026').toISOString());
+    expect(spec.parameters[0]!.value).toMatch(/^\d{4}-\d{2}-\d{2}T/);
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/services/commission-settlement.service.ts -Raw' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 574ms:
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


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/schemas/commission-receivable.ts -Raw; Get-Content api/src/cosmos/commission-receivable-repository.ts -Raw' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 504ms:
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


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/package.json -Raw; Get-Content api/tsconfig.json -Raw' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 506ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/tsconfig.tests.json -Raw; Get-ChildItem api/tests/scripts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 594ms:
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "rootDir": ".",
    "types": ["node"]
  },
  "include": ["src/**/*", "tests/**/*"]
}



    Directory: C:\Alok\Business Projects\wt-fix-cosmos-pages\api\tests\scripts


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
-a----          9/7/2026   7:00 AM           2468 backfill-commission-holds.test.ts                                    
-a----          9/7/2026   7:21 AM           9822 backfill-historical-receivables.test.ts                              
-a----          9/7/2026   6:38 AM           2777 seed-technicians.test.ts                                             



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem api/scripts -File | Select-Object -First 20 -ExpandProperty Name; Get-Content api/scripts/backfill-commission-holds.ts -Raw' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 564ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/schemas/booking.ts -Raw' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 522ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git show 5bfc0361aab64f7b637128c6c3fee9828a80393d:api/src/services/commission-settlement.service.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 560ms:
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
 * E21-S02 Task 8: the CASH_ON_SERVICE commission cascade, extracted verbatim from
 * trigger-booking-completed.ts's CASH branch so both the change-feed trigger (at-least-once
 * delivery) and the synchronous job-completion endpoint (Task 9) share one implementation.
 *
 * Idempotent by bookingId: an existing receivable (or a 409 from a racing invocation) is reported
 * as `created: false` with the same commissionDue/commissionBps/commissionResolvedFrom the caller
 * would have computed anyway, so the caller can always finalize the ledger (consume credits,
 * recompute hold) regardless of whether this particular delivery created the row.
 */
export async function recordCommissionDue(booking: BookingDoc): Promise<RecordCommissionDueResult> {
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
  const commissionDue = Math.round((bookingAmount * bps) / 10000);
  const serviceName = booking.serviceName ?? service?.name;

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
  });

  if (!created) {
    // A concurrent invocation won the race and created the row first. Never fabricate the
    // returned values from what THIS invocation computed — a racing invocation may have resolved
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
 * The second step runs even when the first throws — a redelivery must still get a chance to
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
 * *creates* the commission receivable row — not to every caller that happens to invoke
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
    ctx?.log?.(`settleCashCompletion: receivable already recorded for ${booking.id} — side effects skipped`);
  }

  await finalizeLedgerForTechnician(technicianId);
  return r;
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm -C api typecheck' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 6730ms:

> homeservices-api@0.1.0 typecheck C:\Alok\Business Projects\wt-fix-cosmos-pages\api
> tsc --noEmit -p tsconfig.tests.json


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm -C api test -- tests/scripts/backfill-historical-receivables.test.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 2581ms:

> homeservices-api@0.1.0 test C:\Alok\Business Projects\wt-fix-cosmos-pages\api
> vitest run "tests/scripts/backfill-historical-receivables.test.ts"


[1m[7m[36m RUN [39m[27m[22m [36mv2.1.9 [39m[90mC:/Alok/Business Projects/wt-fix-cosmos-pages/api[39m

 [32m✓[39m tests/scripts/backfill-historical-receivables.test.ts [2m([22m[2m16 tests[22m[2m)[22m[90m 9[2mms[22m[39m

[2m Test Files [22m [1m[32m1 passed[39m[22m[90m (1)[39m
[2m      Tests [22m [1m[32m16 passed[39m[22m[90m (16)[39m
[2m   Start at [22m 07:23:59
[2m   Duration [22m 477ms[2m (transform 116ms, setup 0ms, collect 139ms, tests 9ms, environment 0ms, prepare 153ms)[22m


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem api/src -Recurse -Filter '*booking*' | Select-String -Pattern 'paymentOrderId|paymentId|paymentSignature|paymentMethod' -Context 1,2" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 606ms:

  api\src\cosmos\booking-repository.ts:30:    customerId: string,
> api\src\cosmos\booking-repository.ts:31:    paymentOrderId: string,
  api\src\cosmos\booking-repository.ts:32:    amount: number,
  api\src\cosmos\booking-repository.ts:33:    metadata: BookingCreateMetadata = {},
  api\src\cosmos\booking-repository.ts:36:  ): Promise<BookingDoc> {
> api\src\cosmos\booking-repository.ts:37:    const paymentMethod = req.paymentMethod ?? 'RAZORPAY';
  api\src\cosmos\booking-repository.ts:38:    const doc: BookingDoc = {
  api\src\cosmos\booking-repository.ts:39:      id: bookingId ?? randomUUID(), customerId, ...req,
  api\src\cosmos\booking-repository.ts:44:      ...(metadata.serviceName ? { serviceName: metadata.serviceName } : {}),
> api\src\cosmos\booking-repository.ts:45:      status: 'PENDING_PAYMENT', paymentOrderId,
> api\src\cosmos\booking-repository.ts:46:      paymentMethod,
> api\src\cosmos\booking-repository.ts:47:      ...(paymentMethod === 'CASH_ON_SERVICE' ? { cashCollectionStatus: 
'PENDING' as const } : {}),
> api\src\cosmos\booking-repository.ts:48:      paymentId: null, paymentSignature: null,
  api\src\cosmos\booking-repository.ts:49:      amount, createdAt: now(),
  api\src\cosmos\booking-repository.ts:50:      // E13-S01 (P1-6): Store pending credit info for deferred debit in 
webhook
  api\src\cosmos\booking-repository.ts:68:    id: string,
> api\src\cosmos\booking-repository.ts:69:    paymentId: string,
> api\src\cosmos\booking-repository.ts:70:    paymentSignature: string,
  api\src\cosmos\booking-repository.ts:71:  ): Promise<BookingDoc | null> {
  api\src\cosmos\booking-repository.ts:72:    const { resource: existing, etag } = await 
getBookingsContainer().item(id, id).read<BookingDoc>();
  api\src\cosmos\booking-repository.ts:75:    if (existing.status !== 'PENDING_PAYMENT') return null;
> api\src\cosmos\booking-repository.ts:76:    const updated: BookingDoc = { ...existing, status: 'SEARCHING', 
paymentId, paymentSignature };
  api\src\cosmos\booking-repository.ts:77:    const useEtag = process.env.BOOKINGS_ETAG_GUARDS === 'on';
  api\src\cosmos\booking-repository.ts:78:    if (useEtag) {
  api\src\cosmos\booking-repository.ts:94:
> api\src\cosmos\booking-repository.ts:95:  async getByPaymentOrderId(orderId: string): Promise<BookingDoc | null> {
  api\src\cosmos\booking-repository.ts:96:    const { resources } = await getBookingsContainer()
  api\src\cosmos\booking-repository.ts:97:      .items.query<BookingDoc>({
> api\src\cosmos\booking-repository.ts:98:        query: 'SELECT * FROM c WHERE c.paymentOrderId = @orderId',
  api\src\cosmos\booking-repository.ts:99:        parameters: [{ name: '@orderId', value: orderId }],
  api\src\cosmos\booking-repository.ts:100:      })
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
  api\src\functions\bookings.ts:10:import { bookingRepo, updateBookingFields, type BookingCreateCreditOptions } from 
'../cosmos/booking-repository.js';
> api\src\functions\bookings.ts:11:import { createRazorpayOrder, verifyPaymentSignature } from 
'../services/razorpay.service.js';
  api\src\functions\bookings.ts:12:import { catalogueRepo } from '../cosmos/catalogue-repository.js';
  api\src\functions\bookings.ts:13:import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
  api\src\functions\bookings.ts:260:
> api\src\functions\bookings.ts:261:  if (parsed.data.paymentMethod === 'CASH_ON_SERVICE') {
  api\src\functions\bookings.ts:262:    const cashOrderId = `cash_${randomUUID()}`;
  api\src\functions\bookings.ts:263:    const booking = await bookingRepo.createPending(
  api\src\functions\bookings.ts:299:          serviceId: parsed.data.serviceId,
> api\src\functions\bookings.ts:300:          paymentMethod: 'CASH_ON_SERVICE',
  api\src\functions\bookings.ts:301:          appliedCreditAmount,
  api\src\functions\bookings.ts:302:        },
  api\src\functions\bookings.ts:315:        requiresPayment: false,
> api\src\functions\bookings.ts:316:        paymentMethod: 'CASH_ON_SERVICE',
  api\src\functions\bookings.ts:317:        appliedCreditAmount,
  api\src\functions\bookings.ts:318:      },
  api\src\functions\bookings.ts:323:    const manualOrderId = `manual_${randomUUID()}`;
> api\src\functions\bookings.ts:324:    const manualRequest = { ...parsed.data, paymentMethod: 'CASH_ON_SERVICE' as 
const };
  api\src\functions\bookings.ts:325:    const booking = await bookingRepo.createPending(
  api\src\functions\bookings.ts:326:      manualRequest,
  api\src\functions\bookings.ts:351:        requiresPayment: false,
> api\src\functions\bookings.ts:352:        paymentMethod: 'CASH_ON_SERVICE',
  api\src\functions\bookings.ts:353:        appliedCreditAmount: 0,
  api\src\functions\bookings.ts:354:      },
  api\src\functions\bookings.ts:457:          serviceId: parsed.data.serviceId,
> api\src\functions\bookings.ts:458:          paymentMethod: 'CREDIT_FULL',
  api\src\functions\bookings.ts:459:          appliedCreditAmount,
  api\src\functions\bookings.ts:460:        },
  api\src\functions\bookings.ts:475:        requiresPayment: false,
> api\src\functions\bookings.ts:476:        paymentMethod: 'CREDIT_FULL',
  api\src\functions\bookings.ts:477:        appliedCreditAmount,
  api\src\functions\bookings.ts:478:      },
  api\src\functions\bookings.ts:590:        serviceId: parsed.data.serviceId,
> api\src\functions\bookings.ts:591:        paymentMethod: 'RAZORPAY',
  api\src\functions\bookings.ts:592:        // appliedCreditAmount reported as 0 here — actual debit happens 
post-payment
  api\src\functions\bookings.ts:593:        appliedCreditAmount: 0,
  api\src\functions\bookings.ts:604:      requiresPayment: true,
> api\src\functions\bookings.ts:605:      paymentMethod: 'RAZORPAY',
  api\src\functions\bookings.ts:606:      // Report pending credit to client so the UI can show "₹X will be applied 
after payment"
  api\src\functions\bookings.ts:607:      appliedCreditAmount: 0,
  api\src\functions\bookings.ts:622:
> api\src\functions\bookings.ts:623:  if (!verifyPaymentSignature({
  api\src\functions\bookings.ts:624:    razorpayOrderId: parsed.data.razorpayOrderId,
> api\src\functions\bookings.ts:625:    razorpayPaymentId: parsed.data.razorpayPaymentId,
  api\src\functions\bookings.ts:626:    razorpaySignature: parsed.data.razorpaySignature,
  api\src\functions\bookings.ts:627:  })) return { status: 400, jsonBody: { code: 'SIGNATURE_INVALID' } };
  api\src\functions\bookings.ts:628:
> api\src\functions\bookings.ts:629:  const confirmed = await bookingRepo.confirmPayment(id, 
parsed.data.razorpayPaymentId, parsed.data.razorpaySignature);
  api\src\functions\bookings.ts:630:  if (!confirmed) return { status: 409, jsonBody: { code: 
'BOOKING_ALREADY_PROCESSED' } };
  api\src\functions\bookings.ts:631:
  api\src\functions\bookings.ts:635:    const _ts = new Date().toISOString();
> api\src\functions\bookings.ts:636:    void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', 
action: 'CUSTOMER_CONFIRMED_PAYMENT', resourceType: 'booking', resourceId: confirmed.id, payload: { bookingId: 
confirmed.id, paymentId: parsed.data.razorpayPaymentId }, timestamp: _ts, partitionKey: _ts.slice(0, 7) 
}).catch(Sentry.captureException);
  api\src\functions\bookings.ts:637:  }
  api\src\functions\bookings.ts:638:
  api\src\functions\bookings.ts:696:          amount: booking.finalAmount ?? booking.amount,
> api\src\functions\bookings.ts:697:          paymentMethod: booking.paymentMethod ?? 'RAZORPAY',
> api\src\functions\bookings.ts:698:          razorpayOrderId: booking.paymentOrderId,
  api\src\functions\bookings.ts:699:          createdAt: booking.createdAt,
  api\src\functions\bookings.ts:700:        })),
  api\src\functions\trigger-booking-completed.ts:51:
> api\src\functions\trigger-booking-completed.ts:52:  const paymentMethod = booking.paymentMethod ?? 'CASH_ON_SERVICE';
  api\src\functions\trigger-booking-completed.ts:53:  const bookingAmount = booking.finalAmount ?? booking.amount;
  api\src\functions\trigger-booking-completed.ts:54:
  api\src\functions\trigger-booking-completed.ts:61:  // see handleBookingCompletedBatch below for why that must not 
be swallowed.
> api\src\functions\trigger-booking-completed.ts:62:  if (paymentMethod !== 'RAZORPAY') {
  api\src\functions\trigger-booking-completed.ts:63:    await settleCashCompletion(booking, { log: (s) => ctx.log(s) 
});
  api\src\functions\trigger-booking-completed.ts:64:    return;
  api\src\schemas\booking.ts:17:});
> api\src\schemas\booking.ts:18:export const PaymentMethodSchema = z.enum(PAYMENT_METHODS);
  api\src\schemas\booking.ts:19:export const CashCollectionStatusSchema = z.enum(CASH_COLLECTION_STATUSES);
  api\src\schemas\booking.ts:20:/** E21-S02: why the collected cash fell short of the booking amount. Read-path 
widening only. */
  api\src\schemas\booking.ts:36:  status: z.enum(BOOKING_STATUSES),
> api\src\schemas\booking.ts:37:  paymentOrderId: z.string(),
> api\src\schemas\booking.ts:38:  paymentMethod: PaymentMethodSchema.optional(),
  api\src\schemas\booking.ts:39:  cashCollectionStatus: CashCollectionStatusSchema.optional(),
  api\src\schemas\booking.ts:40:  /** E21-S01: ISO timestamp when the technician confirmed cash collection at job 
completion. Audit/visibility only — does not gate the commission receivable. */
  api\src\schemas\booking.ts:43:  cashCollectedAmount: z.number().int().nonnegative().optional(),
> api\src\schemas\booking.ts:44:  /** E21-S02: how the money changed hands at the door (completion-time), denormalised 
onto the commission receivable at settlement. Distinct from paymentMethod. Read-path widening only. */
  api\src\schemas\booking.ts:45:  collectionMethod: CollectionMethodSchema.optional(),
  api\src\schemas\booking.ts:46:  /** E21-S02: why the collected cash fell short of the booking amount, when the 
technician flags it at completion. Read-path widening only. */
  api\src\schemas\booking.ts:47:  shortCollectionReason: ShortCollectionReasonSchema.optional(),
> api\src\schemas\booking.ts:48:  paymentId: z.string().nullable(),
> api\src\schemas\booking.ts:49:  paymentSignature: z.string().nullable(),
  api\src\schemas\booking.ts:50:  amount: z.number().int().positive(),
  api\src\schemas\booking.ts:51:  technicianId: z.string().optional(),
  api\src\schemas\booking.ts:100:  addressLatLng: LatLngSchema,
> api\src\schemas\booking.ts:101:  paymentMethod: PaymentMethodSchema.default('RAZORPAY'),
  api\src\schemas\booking.ts:102:  /**
  api\src\schemas\booking.ts:103:   * E13-S01: If true, the server will attempt to apply the customer's wallet
  api\src\schemas\booking.ts:113:export const ConfirmBookingRequestSchema = z.object({
> api\src\schemas\booking.ts:114:  razorpayPaymentId: z.string().min(1),
  api\src\schemas\booking.ts:115:  razorpayOrderId: z.string().min(1),
  api\src\schemas\booking.ts:116:  razorpaySignature: z.string().min(1),



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/bookings.ts -TotalCount 520 | Select-Object -Skip 430 -First 60' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 561ms:
      // leave it; it will expire naturally (stale-booking cleanup handles it).
      return {
        status: 409,
        jsonBody: {
          code: 'CREDIT_RACE',
          message: 'Credit application conflict â€” please retry. Your wallet balance is unchanged.',
        },
      };
    }

    // Mark PAID immediately (no Razorpay payment involved)
    const paid = await bookingRepo.markPaid(booking.id, 'credit_full_payment');
    if (!paid) return { status: 500, jsonBody: { code: 'BOOKING_CONFIRMATION_FAILED' } };

    // E16-S02: Commit hold â€” converts 30 s soft hold to permanent slot record.
    slotHoldsRepo.commitHold(holdId, holdPk, booking.id).catch((err: unknown) => {
      Sentry.captureException(err);
      console.warn('[createBooking] commitHold failed (non-fatal)', { holdId, bookingId: booking.id, err });
    });

    try {
      posthog.capture({
        distinctId: customer.customerId,
        event: 'booking-created',
        properties: {
          bookingId: booking.id,
          serviceId: parsed.data.serviceId,
          paymentMethod: 'CREDIT_FULL',
          appliedCreditAmount,
        },
      });
    } catch { /* never break the main path */ }

    dispatcherService.triggerDispatch(booking.id).catch((err: unknown) => {
      Sentry.captureException(err);
      console.error('[createBooking] credit-full dispatch failed', { bookingId: booking.id, err });
    });

    return {
      status: 201,
      jsonBody: {
        bookingId: booking.id,
        razorpayOrderId: fullCreditOrderId,
        amount: service.basePrice,
        requiresPayment: false,
        paymentMethod: 'CREDIT_FULL',
        appliedCreditAmount,
      },
    };
  }

  // Partial or no credit â€” create Razorpay order for the payable portion.
  //
  // P1-2: Reserve the credit BEFORE creating the discounted Razorpay order.
  //
  // Problem without reservation: `pendingCreditAmount` is only a balance peek. If:
  //   (a) The same idempotency key is replayed (client retry), a second discounted
  //       Razorpay order is created, potentially granting the discount twice.
  //   (b) The wallet balance is spent elsewhere between here and payment.captured,
  //       the webhook tries to apply a credit that no longer exists â€” the Razorpay

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/bookings.ts -TotalCount 440 | Select-Object -Skip 390 -First 50; Get-Content api/src/cosmos/booking-repository.ts -Raw' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 563ms:
      customer.customerId,
      fullCreditOrderId,
      service.basePrice,
      bookingMetadata(customer, service.name),
      preGeneratedBookingId,
      fullCreditCreditOptions,
    );

    // Apply credit synchronously for the fully-credit-paid path (no payment to wait for)
    const appliedCreditAmount = await attemptCreditApplication(
      customer.customerId,
      booking.id,
      pendingCreditAmount,
      idempotencyKey,
    );

    // P1-1: Verify the credit was actually applied before marking PAID.
    //
    // attemptCreditApplication returns 0 (or a partial amount) when:
    //   - A 412 ETag conflict (race with another concurrent apply) exhausted all retries.
    //   - An unexpected Cosmos error was swallowed by the non-blocking path.
    //
    // If we mark PAID without the credit being applied, the customer gets a free
    // or underpaid booking (the Razorpay order was skipped entirely).
    //
    // Safe fallback: reject with 409 so the customer retries. We cannot safely
    // fall back to Razorpay here because the booking doc was already created and
    // the Razorpay order amount would need to be recomputed â€” doing so in a partially
    // applied state risks double-charging or missed credit.
    if (appliedCreditAmount < pendingCreditAmount) {
      console.warn('[createBooking] full-credit path: applied amount < expected; rejecting with 409', {
        customerId: customer.customerId,
        bookingId: booking.id,
        expected: pendingCreditAmount,
        applied: appliedCreditAmount,
      });
      Sentry.captureException(
        new Error(`CREDIT_RACE: applied ${appliedCreditAmount} < expected ${pendingCreditAmount}`),
      );
      // Booking is in PENDING_PAYMENT state and no Razorpay order was created â€” safe to
      // leave it; it will expire naturally (stale-booking cleanup handles it).
      return {
        status: 409,
        jsonBody: {
          code: 'CREDIT_RACE',
          message: 'Credit application conflict â€” please retry. Your wallet balance is unchanged.',
        },
      };
    }

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
    if (!existing || existing.customerId !== customerId) return null;
    if (existing.status !== 'AWAITING_PRICE_APPROVAL') return null;
    const pending = existing.pendingAddOns ?? [];
    const approved = pending.filter(a => decisions.find(d => d.name === a.name && d.approved));
    const updated: BookingDoc = {
      ...existing,
      status: 'IN_PROGRESS',
      pendingAddOns: [],
      approvedAddOns: [...(existing.approvedAddOns ?? []), ...approved],
      finalAmount: (existing.finalAmount ?? existing.amount) + approved.reduce((s, a) => s + a.price, 0),
    };
    const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
    return resource!;
  },

  async addPhoto(
    bookingId: string,
    stage: string,
    photoUrl: string,
  ): Promise<BookingDoc | null> {
    const { resource: existing, etag } = await getBookingsContainer()
      .item(bookingId, bookingId)
      .read<BookingDoc>();
    if (!existing) return null;
    const stagePhotos = existing.photos?.[stage] ?? [];
    const updated: BookingDoc = {
      ...existing,
      photos: { ...existing.photos, [stage]: [...stagePhotos, photoUrl] },
    };
    // Use ETag optimistic concurrency so concurrent uploads for the same
    // booking/stage don't silently drop each other's photo URL.
    const { resource } = await getBookingsContainer()
      .item(bookingId, bookingId)
      .replace<BookingDoc>(updated, { accessCondition: { type: 'IfMatch', condition: etag ?? '' } });
    return resource ?? null;
  },

  async markSosActivated(id: string): Promise<BookingDoc | null> {
    const { resource: existing, etag } = await getBookingsContainer().item(id, id).read<BookingDoc>();
    if (!existing) return null;
    if (existing.sosActivatedAt) return existing; // already activated â€” concurrent request lost the race
    const updated: BookingDoc = { ...existing, sosActivatedAt: new Date().toISOString() };
    try {
      const { resource } = await getBookingsContainer()
        .item(id, id)
        .replace<BookingDoc>(updated, { accessCondition: { type: 'IfMatch', condition: etag ?? '' } });
      return resource ?? null;
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: number }).code === 412) {
        return null; // lost ETag race â€” caller handles as already-activated
      }
      throw e;
    }
  },

  // E16-S02: Returns slotWindow strings for all active (non-cancelled/unfulfilled) bookings
  // for a given service on a given date. Used by the availability handler to mark slots
  // as hard-booked. Cross-partition scan â€” acceptable at pilot scale (â‰¤5,000 bookings/mo).
  async getBookedWindowsByServiceDate(serviceId: string, date: string): Promise<string[]> {
    const { resources } = await getBookingsContainer()
      .items.query<{ slotWindow: string }>({
        query: `SELECT c.slotWindow FROM c
                WHERE c.serviceId = @serviceId
                  AND c.slotDate = @date
                  AND c.status NOT IN ('CUSTOMER_CANCELLED', 'UNFULFILLED')`,
        parameters: [
          { name: '@serviceId', value: serviceId },
          { name: '@date', value: date },
        ],
      })
      .fetchAll();
    return resources.map((r) => r.slotWindow);
  },
};

export async function updateBookingFields(
  id: string,
  fields: Partial<BookingDoc>,
): Promise<BookingDoc | null> {
  const existing = await bookingRepo.getById(id);
  if (!existing) return null;
  const updated: BookingDoc = { ...existing, ...fields };
  const { resource } = await getBookingsContainer().item(id, id).replace<BookingDoc>(updated);
  return resource ?? null;
}

// â”€â”€ Admin roster helpers (E09-S07a) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getActiveBookingCountForTechnician(technicianId: string): Promise<number> {
  const { resources } = await getBookingsContainer()
    .items.query<number>({
      query: `SELECT VALUE COUNT(1) FROM c
              WHERE c.technicianId = @technicianId
                AND c.status IN ('ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL')`,
      parameters: [{ name: '@technicianId', value: technicianId }],
    })
    .fetchAll();
  return resources[0] ?? 0;
}

// â”€â”€ Customer roster helpers (E09-S07a A4) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface CustomerBookingSummary {
  customerId: string;
  bookingCount: number;
  lastBookingDate?: string;
  lastCity?: string;
  recentBookings: Array<{
    date: string; serviceId: string; technicianId: string; status: string;
  }>;
}

export async function getCustomerSummaries(): Promise<CustomerBookingSummary[]> {
  const { resources } = await getBookingsContainer()
    .items.query<{
      customerId: string; slotDate: string; serviceId: string;
      technicianId: string; status: string; addressText: string;
    }>(`SELECT c.customerId, c.slotDate, c.serviceId, c.technicianId,
              c.status, c.addressText
        FROM c`)
    .fetchAll();

  const map = new Map<string, CustomerBookingSummary>();
  for (const r of resources) {
    const cid = r.customerId;
    if (!cid) continue;
    if (!map.has(cid)) {
      const rawCity = typeof r.addressText === 'string' ? r.addressText.split(',').pop()?.trim() : undefined;
      const entry: CustomerBookingSummary = {
        customerId: cid,
        bookingCount: 0,
        recentBookings: [],
      };
      if (r.slotDate) entry.lastBookingDate = r.slotDate;
      if (rawCity) entry.lastCity = rawCity;
      map.set(cid, entry);
    }
    const entry = map.get(cid)!;
    entry.bookingCount++;
    if (entry.recentBookings.length < 5) {
      entry.recentBookings.push({
        date: r.slotDate,
        serviceId: r.serviceId,
        technicianId: r.technicianId ?? '',
        status: r.status,
      });
    }
  }
  return [...map.values()];
}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/services/auditLog.service.ts -Raw' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 524ms:
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


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content api/scripts/backfill-historical-receivables.ts | ForEach-Object { '"'{0,4}: {1}' -f "'$i, $_; $i++ }' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 580ms:
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
  61:   const cutoffRaw = cutoffArg?.slice(CUTOFF_FLAG.length);
  62:   // Normalise to canonical ISO before binding. Cosmos compares these timestamps
  63:   // lexicographically, so a parseable-but-non-ISO cutoff like "9/1/2026" would sort *after*
  64:   // "2026-09-07T..." and silently widen the window to include live completions â€” the exact
  65:   // thing the cutoff exists to prevent.
  66:   const cutoff =
  67:     cutoffRaw && !Number.isNaN(Date.parse(cutoffRaw)) ? new Date(cutoffRaw).toISOString() : undefined;
  68:   if (!cutoff) {
  69:     console.error('--completed-before=<ISO timestamp> is required (e.g. --completed-before=2026-09-01T00:00:00.000Z).');
  70:     console.error('Only bookings completed strictly before it are eligible, so a job settling right now is never claimed.');
  71:     process.exit(2);
  72:     return;
  73:   }
  74: 
  75:   const apply = argvArgs.includes('--apply');
  76:   if (apply && argvArgs.includes('--dry-run')) {
  77:     console.error('Pass either --dry-run or --apply, not both.');
  78:     process.exit(2);
  79:     return;
  80:   }
  81: 
  82:   console.log(`historical commission-receivable backfill â€” mode=${apply ? 'APPLY' : 'DRY-RUN'} cutoff=${cutoff}`);
  83:   console.log('');
  84: 
  85:   const iterator = getBookingsContainer().items.query(
  86:     { query: QUERY, parameters: [{ name: '@cutoff', value: cutoff }] },
  87:     { maxItemCount: 100 },
  88:   );
  89:   const bookings: unknown[] = [];
  90:   while (iterator.hasMoreResults()) {
  91:     const page = await iterator.fetchNext();
  92:     // Cosmos hands back `resources: undefined` on some pages â€” never spread it unguarded.
  93:     bookings.push(...(page.resources ?? []));
  94:   }
  95: 
  96:   // Technicians who gained at least one row, so their credits can be consumed and their hold
  97:   // recomputed once at the end rather than per row.
  98:   const touched = new Set<string>();
  99:   let created = 0;
 100:   let alreadyPresent = 0;
 101:   let unparseable = 0;
 102:   let skipped = 0;
 103:   let totalPaise = 0;
 104: 
 105:   for (const raw of bookings) {
 106:     const parsed = BookingDocSchema.safeParse(raw);
 107:     if (!parsed.success) {
 108:       unparseable += 1;
 109:       console.log(`  SKIP (unparseable) ${(raw as { id?: string })?.id ?? '<no id>'}`);
 110:       continue;
 111:     }
 112:     const booking = parsed.data;
 113:     if (!booking.technicianId) {
 114:       skipped += 1;
 115:       console.log(`  SKIP (no technician) ${booking.id}`);
 116:       continue;
 117:     }
 118: 
 119:     const existing = await commissionReceivableRepo.getByBookingId(booking.id, booking.technicianId);
 120:     if (existing) {
 121:       alreadyPresent += 1;
 122:       console.log(`  HAVE ${booking.id}  ${rupees(existing.commissionDue)} already recorded`);
 123:       continue;
 124:     }
 125: 
 126:     const preview = await resolveCommissionForBooking(booking);
 127:     totalPaise += preview.commissionDue;
 128: 
 129:     if (!apply) {
 130:       console.log(
 131:         `  WOULD ADD ${booking.id}  tech=${booking.technicianId}  ${preview.serviceName ?? '<service?>'}  ` +
 132:           `booking=${rupees(preview.bookingAmount)}  bps=${preview.bps} (${preview.commissionResolvedFrom})  ` +
 133:           `commission=${rupees(preview.commissionDue)}`,
 134:       );
 135:       continue;
 136:     }
 137: 
 138:     // Stamp the row with when the debt was actually incurred, not when this script ran:
 139:     // createdAt drives oldest-first remittance allocation and the hold's oldestDueAt.
 140:     const incurredAt = booking.completedAt ?? booking.createdAt;
 141:     const result = await recordCommissionDue(booking, { createdAt: incurredAt });
 142:     if ('skipped' in result) {
 143:       skipped += 1;
 144:       console.log(`  SKIP (${result.skipped}) ${booking.id}`);
 145:       continue;
 146:     }
 147:     if (!result.created) {
 148:       alreadyPresent += 1;
 149:       console.log(`  HAVE ${booking.id} (created concurrently)`);
 150:       continue;
 151:     }
 152: 
 153:     created += 1;
 154:     touched.add(booking.technicianId);
 155:     console.log(
 156:       `  ADDED ${booking.id}  ${rupees(result.commissionDue)}  bps=${result.commissionBps}  dated ${incurredAt}`,
 157:     );
 158:     await systemAudit('COMMISSION_DUE_RECORDED', 'booking', booking.id, {
 159:       technicianId: booking.technicianId,
 160:       bookingAmount: preview.bookingAmount,
 161:       commissionBps: result.commissionBps,
 162:       commissionDue: result.commissionDue,
 163:       commissionResolvedFrom: result.commissionResolvedFrom,
 164:       // Distinguishes a retroactively created row from one the live settlement path wrote.
 165:       backfill: true,
 166:     });
 167:   }
 168: 
 169:   // A technician may already hold open CREDIT docs (an overpaid remittance recorded before this
 170:   // backfill ran). New DUE rows must consume them, or the dashboard overstates what is owed.
 171:   // finalizeLedgerForTechnician runs consumePendingCredits and then recomputes the hold; it never
 172:   // throws.
 173:   for (const technicianId of touched) {
 174:     await finalizeLedgerForTechnician(technicianId);
 175:     console.log(`  FINALIZED ${technicianId} (credits consumed, hold recomputed)`);
 176:   }
 177: 
 178:   console.log('');
 179:   console.log(
 180:     `scanned=${bookings.length} ${apply ? 'created' : 'wouldCreate'}=${apply ? created : bookings.length - alreadyPresent - unparseable - skipped} ` +
 181:       `alreadyPresent=${alreadyPresent} skipped=${skipped} unparseable=${unparseable}`,
 182:   );
 183:   console.log(`commission ${apply ? 'recorded' : 'that would be recorded'}: ${rupees(totalPaise)}`);
 184:   console.log('');
 185:   console.log(
 186:     apply
 187:       ? 'Apply complete. Holds were recomputed for every affected technician; run backfill-commission-holds.ts --apply if you want a full-roster sweep as well.'
 188:       : 'Dry-run complete â€” no writes made. Re-run with --apply to record the rows above.',
 189:   );
 190: }
 191: 
 192: if (argv[1] && fileURLToPath(import.meta.url) === argv[1]) {
 193:   main(argv.slice(2)).catch((e) => {
 194:     console.error(e);
 195:     process.exit(1);
 196:   });
 197: }

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem api/src -Recurse | Select-String -Pattern 'completedAt' -Context 1,2" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 625ms:

  api\src\cosmos\finance-repository.ts:11:  finalAmount?: number;
> api\src\cosmos\finance-repository.ts:12:  completedAt: string;
  api\src\cosmos\finance-repository.ts:13:}
  api\src\cosmos\finance-repository.ts:14:
  api\src\cosmos\finance-repository.ts:110:      {
> api\src\cosmos\finance-repository.ts:111:        query: `SELECT c.id, c.technicianId, c.technicianName, c.amount, 
c.finalAmount, c.completedAt
  api\src\cosmos\finance-repository.ts:112:                FROM c
  api\src\cosmos\finance-repository.ts:113:                WHERE c.status = 'COMPLETED'
> api\src\cosmos\finance-repository.ts:114:                  AND c.completedAt >= @from
> api\src\cosmos\finance-repository.ts:115:                  AND c.completedAt <= @toEnd`,
  api\src\cosmos\finance-repository.ts:116:        parameters: [
  api\src\cosmos\finance-repository.ts:117:          { name: '@from', value: `${from}T00:00:00.000Z` },
  api\src\cosmos\finance-repository.ts:131:  for (const b of bookings) {
> api\src\cosmos\finance-repository.ts:132:    const date = b.completedAt.slice(0, 10);
  api\src\cosmos\finance-repository.ts:133:    const gross = grossOf(b);
  api\src\cosmos\finance-repository.ts:134:    const commission = commissionOf(b, recorded);
  api\src\functions\active-job.ts:125:      ? {
> api\src\functions\active-job.ts:126:          completedAt: now,
  api\src\functions\active-job.ts:127:          ...(body.cashCollected === true
  api\src\functions\active-job.ts:128:            ? {
  api\src\functions\trigger-projector-bookings.ts:93:    // Prompt customer to rate the technician.
> api\src\functions\trigger-projector-bookings.ts:94:    // expiresAt derived from booking.completedAt (stable) so 
replays are idempotent.
  api\src\functions\trigger-projector-bookings.ts:95:    const actionId = 
buildPendingActionId('RATING_PROMPT_CUSTOMER', customerId, bookingId);
  api\src\functions\trigger-projector-bookings.ts:96:    const { doc: upserted, noOp } = await upsertAction({
  api\src\functions\trigger-projector-bookings.ts:101:      sourceId: bookingId,
> api\src\functions\trigger-projector-bookings.ts:102:      expiresAt: stableExpiryFrom(doc.completedAt ?? 
doc.createdAt, RATING_PROMPT_EXPIRY_MS),
  api\src\functions\trigger-projector-bookings.ts:103:      priority: 5,
  api\src\functions\trigger-projector-bookings.ts:104:      payload: { bookingId, technicianId: doc.technicianId },
  api\src\schemas\booking.ts:52:  createdAt: z.string(),
> api\src\schemas\booking.ts:53:  completedAt: z.string().optional(),
  api\src\schemas\booking.ts:54:  feesWaived: z.boolean().optional(),
  api\src\schemas\booking.ts:55:  escalated: z.boolean().optional(),
  api\src\schemas\report.ts:4:  categoryId: string;
> api\src\schemas\report.ts:5:  completedAt: string;
  api\src\schemas\report.ts:6:  warrantyExpiresAt: string;
  api\src\schemas\report.ts:7:  nextServiceRecommendation: string;
  api\src\services\dataExport.service.ts:62:    createdAt: b['createdAt'],
> api\src\services\dataExport.service.ts:63:    completedAt: b['completedAt'],
  api\src\services\dataExport.service.ts:64:  };
  api\src\services\dataExport.service.ts:65:}
  api\src\services\pdf-generator.service.ts:23:       .text(`Service: ${report.serviceName}`)
> api\src\services\pdf-generator.service.ts:24:       .text(`Completed: ${fmtDate(report.completedAt)}`).moveDown();
  api\src\services\pdf-generator.service.ts:25:
  api\src\services\pdf-generator.service.ts:26:    doc.fontSize(14).font('Helvetica-Bold').text('Technician');
  api\src\services\report-data.service.ts:15:export async function assembleReportData(booking: BookingDoc): 
Promise<ReportData> {
> api\src\services\report-data.service.ts:16:  const completedAt = booking.completedAt ?? new Date().toISOString();
  api\src\services\report-data.service.ts:17:  const warrantyExpiresAt = new Date(
> api\src\services\report-data.service.ts:18:    new Date(completedAt).getTime() + 7 * 24 * 60 * 60 * 1000,
  api\src\services\report-data.service.ts:19:  ).toISOString();
  api\src\services\report-data.service.ts:20:
  api\src\services\report-data.service.ts:32:    categoryId: booking.categoryId,
> api\src\services\report-data.service.ts:33:    completedAt,
  api\src\services\report-data.service.ts:34:    warrantyExpiresAt,
  api\src\services\report-data.service.ts:35:    nextServiceRecommendation:
  api\src\services\ssc-levy.service.ts:40:    .items.query<number>({
> api\src\services\ssc-levy.service.ts:41:      // Use completedAt (realized revenue) consistent with finance 
queryCompletedBookings.
  api\src\services\ssc-levy.service.ts:42:      // Jobs that are booked in one quarter and completed in another are 
attributed to
  api\src\services\ssc-levy.service.ts:43:      // the quarter in which the work was actually delivered.
  api\src\services\ssc-levy.service.ts:45:              WHERE c.status = 'COMPLETED'
> api\src\services\ssc-levy.service.ts:46:                AND c.completedAt >= @from
> api\src\services\ssc-levy.service.ts:47:                AND c.completedAt <= @to`,
  api\src\services\ssc-levy.service.ts:48:      parameters: [
  api\src\services\ssc-levy.service.ts:49:        { name: '@from', value: fromIso },



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm -C api lint' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 9896ms:

> homeservices-api@0.1.0 lint C:\Alok\Business Projects\wt-fix-cosmos-pages\api
> eslint . --max-warnings 0


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/cosmos/catalogue-repository.ts -Raw' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 522ms:
import { getCatalogueContainers } from './client.js';
import type { ServiceCategory, CreateCategoryBody, UpdateCategoryBody } from '../schemas/service-category.js';
import type { Service, CreateServiceBody, UpdateServiceBody } from '../schemas/service.js';

function now(): string {
  return new Date().toISOString();
}

/**
 * P0-3: drop keys whose value is `undefined` before merging a patch body over a
 * stored document. Zod's `.partial()` omits absent keys rather than setting them to
 * `undefined`, so this is belt-and-braces â€” but a body assembled dynamically by a
 * future caller could carry explicit `undefined`, and a blind spread would then
 * overwrite stored content with nothing. That is exactly the failure mode this
 * story exists to remove.
 */
type Defined<T> = { [K in keyof T]?: Exclude<T[K], undefined> };

function definedOnly<T extends object>(patch: T): Defined<T> {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as Defined<T>;
}

export class CatalogueRepository {
  private get cats() { return getCatalogueContainers().categories; }
  private get svcs() { return getCatalogueContainers().services; }

  // â”€â”€ Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async listActiveCategories(): Promise<ServiceCategory[]> {
    const { resources } = await this.cats.items
      .query<ServiceCategory>('SELECT * FROM c WHERE c.isActive = true ORDER BY c.sortOrder ASC')
      .fetchAll();
    return resources;
  }

  async listAllCategories(): Promise<ServiceCategory[]> {
    const { resources } = await this.cats.items
      .query<ServiceCategory>('SELECT * FROM c ORDER BY c.sortOrder ASC')
      .fetchAll();
    return resources;
  }

  async getCategoryById(id: string): Promise<ServiceCategory | null> {
    const { resources } = await this.cats.items
      .query<ServiceCategory>({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }],
      })
      .fetchAll();
    return resources[0] ?? null;
  }

  async createCategory(body: CreateCategoryBody, uid: string): Promise<ServiceCategory> {
    const doc: ServiceCategory = { ...body, isActive: true, updatedBy: uid, createdAt: now(), updatedAt: now() };
    const { resource } = await this.cats.items.create<ServiceCategory>(doc);
    return resource!;
  }

  async updateCategory(id: string, body: UpdateCategoryBody, uid: string): Promise<ServiceCategory | null> {
    const existing = await this.getCategoryById(id);
    if (!existing) return null;
    const updated: ServiceCategory = { ...existing, ...definedOnly(body), id, updatedBy: uid, updatedAt: now() };
    const { resource } = await this.cats.items.upsert<ServiceCategory>(updated);
    return resource!;
  }

  async toggleCategory(id: string, uid: string): Promise<ServiceCategory | null> {
    const existing = await this.getCategoryById(id);
    if (!existing) return null;
    const updated = { ...existing, isActive: !existing.isActive, updatedBy: uid, updatedAt: now() };
    const { resource } = await this.cats.items.upsert<ServiceCategory>(updated);
    return resource!;
  }

  async upsertCategory(doc: ServiceCategory): Promise<void> {
    await this.cats.items.upsert(doc);
  }

  // â”€â”€ Services â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async listAllActiveServices(): Promise<Service[]> {
    const { resources } = await this.svcs.items
      .query<Service>('SELECT * FROM c WHERE c.isActive = true')
      .fetchAll();
    return resources;
  }

  async listServicesByCategory(categoryId: string, activeOnly = false): Promise<Service[]> {
    const q = activeOnly
      ? { query: 'SELECT * FROM c WHERE c.categoryId = @cid AND c.isActive = true', parameters: [{ name: '@cid', value: categoryId }] }
      : { query: 'SELECT * FROM c WHERE c.categoryId = @cid', parameters: [{ name: '@cid', value: categoryId }] };
    const { resources } = await this.svcs.items.query<Service>(q).fetchAll();
    return resources;
  }

  async getServiceByIdCrossPartition(id: string): Promise<Service | null> {
    const { resources } = await this.svcs.items
      .query<Service>({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: id }] })
      .fetchAll();
    return resources[0] ?? null;
  }

  async createService(body: CreateServiceBody, uid: string): Promise<Service> {
    const doc: Service = { ...body, isActive: true, updatedBy: uid, createdAt: now(), updatedAt: now() };
    const { resource } = await this.svcs.items.create<Service>(doc);
    return resource!;
  }

  async updateService(id: string, body: UpdateServiceBody, uid: string): Promise<Service | null> {
    const existing = await this.getServiceByIdCrossPartition(id);
    if (!existing) return null;
    const updated: Service = { ...existing, ...definedOnly(body), id, categoryId: existing.categoryId, updatedBy: uid, updatedAt: now() };
    const { resource } = await this.svcs.item(id, existing.categoryId).replace<Service>(updated);
    return resource!;
  }

  async toggleService(id: string, uid: string): Promise<Service | null> {
    const existing = await this.getServiceByIdCrossPartition(id);
    if (!existing) return null;
    const updated = { ...existing, isActive: !existing.isActive, updatedBy: uid, updatedAt: now() };
    const { resource } = await this.svcs.item(id, existing.categoryId).replace<Service>(updated);
    return resource!;
  }

  async upsertService(doc: Service): Promise<void> {
    await this.svcs.items.upsert(doc);
  }
}

export const catalogueRepo = new CatalogueRepository();


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem api/src/types -File | Select-String -Pattern 'COMMISSION_DUE_RECORDED' -Context 0,1" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 613ms:

> api\src\types\admin.ts:34:  | 'COMMISSION_DUE_RECORDED'
  api\src\types\admin.ts:35:  | 'COMMISSION_HOLD_OVERRIDDEN'



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm -C api test' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 19302ms:

> homeservices-api@0.1.0 test C:\Alok\Business Projects\wt-fix-cosmos-pages\api
> vitest run


[1m[7m[36m RUN [39m[27m[22m [36mv2.1.9 [39m[90mC:/Alok/Business Projects/wt-fix-cosmos-pages/api[39m

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mupsertAction[2m > [22m[2mcreates a new action when it does not exist
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":0,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"create","ts":"2026-09-07T11:25:15.604Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mupsertAction[2m > [22m[2mis idempotent: duplicate change-feed event does NOT bump version
[22m[39m{"event":"pending_action_stale_drop","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","existing_version":3,"incoming_version":3,"ts":"2026-09-07T11:25:15.605Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mupsertAction[2m > [22m[2mbumps version when payload changes (real mutation)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T11:25:15.606Z"}

 [32m✓[39m tests/unit/cosmos/customer-credit-ledger-repository.test.ts [2m([22m[2m18 tests[22m[2m)[22m[90m 69[2mms[22m[39m
 [32m✓[39m tests/cosmos/technician-repository.test.ts [2m([22m[2m52 tests[22m[2m)[22m[90m 27[2mms[22m[39m
[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mskips when booking status is not PAID
[22m[39mDISPATCH_SKIP bookingId=bk-1 status=SEARCHING

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mskips when booking not found
[22m[39mDISPATCH_SKIP bookingId=bk-1 status=NOT_FOUND

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mmarks booking UNFULFILLED when 0 technicians found
[22m[39mDISPATCH_NO_TECHS bookingId=bk-1

[90mstdout[2m | tests/unit/dispatcher.service.test.ts[2m > [22m[2mdispatcherService.triggerDispatch[2m > [22m[2mkeeps a future paid booking retryable when 0 technicians are currently found
[22m[39mDISPATCH_WAITING_FOR_TECHS bookingId=bk-1

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

 [32m✓[39m tests/unit/dispatcher.service.test.ts [2m([22m[2m29 tests[22m[2m)[22m[90m 19[2mms[22m[39m
[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mupsertAction[2m > [22m[2mretries on 412 ETag conflict (max 3 attempts)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":3,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T11:25:15.771Z"}

 [32m✓[39m tests/cosmos/commission-receivable-repository.test.ts [2m([22m[2m27 tests[22m[2m)[22m[90m 13[2mms[22m[39m
[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mresolveAction[2m > [22m[2msets status=RESOLVED and bumps version
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":3,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"transition_to_resolved","ts":"2026-09-07T11:25:15.944Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mexpireAction[2m > [22m[2msets status=EXPIRED and bumps version
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"transition_to_expired","ts":"2026-09-07T11:25:15.944Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mstale-state cleanup[2m > [22m[2mresolves ADDON_APPROVAL_REQUESTED when booking transitions to PAID
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:customer-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"transition_to_resolved","ts":"2026-09-07T11:25:15.945Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mFCM strict ordering[2m > [22m[2memitFcmForAction succeeds and resolves without throwing
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:25:15.945Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T11:25:15.945Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mFCM strict ordering[2m > [22m[2memitFcmForAction with technician role also resolves
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:25:15.946Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T11:25:15.946Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mFCM strict ordering[2m > [22m[2memitFcmForAction swallows Error thrown by FCM send (err instanceof Error branch)
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:25:15.946Z"}
{"event":"fcm_send_failure","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","error_code":"FCM_QUOTA_EXCEEDED","ts":"2026-09-07T11:25:15.946Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mFCM strict ordering[2m > [22m[2memitFcmForAction swallows non-Error thrown by FCM send (String(err) branch)
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:25:15.946Z"}
{"event":"fcm_send_failure","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","error_code":"network-timeout","ts":"2026-09-07T11:25:15.946Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mFCM strict ordering[2m > [22m[2memitFcmForAction omits payload key in FCM data when doc.payload is undefined
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:25:15.947Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T11:25:15.947Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2misSemanticNoOp — early-exit branches[2m > [22m[2mis NOT a no-op when existing status is RESOLVED (status !== ACTIVE branch)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T11:25:15.947Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2misSemanticNoOp — early-exit branches[2m > [22m[2mis NOT a no-op when type changes (type !== input.type branch)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":3,"action_type":"RATING_PROMPT_CUSTOMER","projector_source":"update","ts":"2026-09-07T11:25:15.947Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2misSemanticNoOp — early-exit branches[2m > [22m[2mis NOT a no-op when expiresAt changes (expiresAt !== input.expiresAt branch)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T11:25:15.947Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2misSemanticNoOp — early-exit branches[2m > [22m[2mis NOT a no-op when priority changes (priority !== input.priority branch)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T11:25:15.948Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2misSemanticNoOp — early-exit branches[2m > [22m[2mtreats missing payload on both sides as equal (payload ?? {} branch)
[22m[39m{"event":"pending_action_stale_drop","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","existing_version":2,"incoming_version":2,"ts":"2026-09-07T11:25:15.948Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP2-5: upsertAction reactivates RESOLVED/EXPIRED actions[2m > [22m[2msets status=ACTIVE when upserting into an existing RESOLVED action
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":4,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T11:25:15.948Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP2-5: upsertAction reactivates RESOLVED/EXPIRED actions[2m > [22m[2msets status=ACTIVE when upserting into an existing EXPIRED action
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":3,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T11:25:15.948Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP1-3: emitFcmForAction includes legacy-client compat fields[2m > [22m[2mincludes bookingId top-level for ADDON_APPROVAL_REQUESTED
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:25:15.948Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T11:25:15.948Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP1-3: emitFcmForAction includes legacy-client compat fields[2m > [22m[2mincludes bookingId top-level for RATING_PROMPT_CUSTOMER
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:25:15.948Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T11:25:15.948Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP1-3: emitFcmForAction includes legacy-client compat fields[2m > [22m[2mincludes overall top-level (as string) for RATING_RECEIVED
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:25:15.949Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T11:25:15.949Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP1-3: emitFcmForAction includes legacy-client compat fields[2m > [22m[2mdoes NOT add bookingId for action types that do not need it
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:25:15.949Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T11:25:15.949Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP1-3: emitFcmForAction includes legacy-client compat fields[2m > [22m[2msame change-feed event delivered twice → no version bump
[22m[39m{"event":"pending_action_stale_drop","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","existing_version":1,"incoming_version":1,"ts":"2026-09-07T11:25:15.949Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2m_transitionStatus — ETag fallback and retry exhaustion[2m > [22m[2mfalls back to empty etag string when _etag is undefined on resolveAction
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"transition_to_resolved","ts":"2026-09-07T11:25:15.949Z"}

 [32m✓[39m tests/webhooks/razorpay-webhook.test.ts [2m([22m[2m16 tests[22m[2m)[22m[90m 14[2mms[22m[39m
 [32m✓[39m tests/functions/active-job.test.ts [2m([22m[2m20 tests[22m[2m)[22m[33m 595[2mms[22m[39m
 [32m✓[39m tests/unit/pending-action-projector.test.ts [2m([22m[2m30 tests[22m[2m)[22m[33m 682[2mms[22m[39m
 [32m✓[39m tests/services/commission-view.service.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 12[2mms[22m[39m
 [32m✓[39m tests/services/commission-allocator.apply.test.ts [2m([22m[2m17 tests[22m[2m)[22m[90m 14[2mms[22m[39m
 [32m✓[39m tests/services/commission-settlement.service.test.ts [2m([22m[2m28 tests[22m[2m)[22m[90m 16[2mms[22m[39m
 [32m✓[39m tests/functions/active-job-location.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 215[2mms[22m[39m
 [32m✓[39m tests/functions/admin/complaints/patch.test.ts [2m([22m[2m17 tests[22m[2m)[22m[90m 12[2mms[22m[39m
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
  bookingId: [32m'aa398a54-d765-44c6-92c6-073cdc3d2f2e'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — P1-2 reserve-before-Razorpay (partial credit path)[2m > [22m[2mP1-2d: reserveCredit NOT called when pendingCreditAmount is 0
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

 [32m✓[39m tests/bookings/create-apply-credit.test.ts [2m([22m[2m19 tests[22m[2m)[22m[90m 19[2mms[22m[39m
 [32m✓[39m tests/services/commission-hold.service.test.ts [2m([22m[2m27 tests[22m[2m)[22m[90m 35[2mms[22m[39m
 [32m✓[39m tests/kyc/submit-pan-ocr.test.ts [2m([22m[2m10 tests[22m[2m)[22m[33m 371[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-no-show-detector.test.ts [2m([22m[2m19 tests[22m[2m)[22m[90m 29[2mms[22m[39m
 [32m✓[39m tests/cosmos/audit-log-immutability.test.ts [2m([22m[2m40 tests[22m[2m)[22m[90m 27[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/commission-remittances.test.ts [2m([22m[2m17 tests[22m[2m)[22m[90m 23[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-projectors.test.ts [2m([22m[2m38 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/functions/admin/compliance/ssc-levy.test.ts [2m([22m[2m20 tests[22m[2m)[22m[90m 33[2mms[22m[39m
 [32m✓[39m tests/cosmos/device-token-repository.test.ts [2m([22m[2m19 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/catalogue-admin.test.ts [2m([22m[2m21 tests[22m[2m)[22m[90m 17[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/commission-receivables.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/commission-hold-override.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 16[2mms[22m[39m
 [32m✓[39m tests/scripts/backfill-historical-receivables.test.ts [2m([22m[2m16 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/functions/devices.test.ts [2m([22m[2m17 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-etag.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 6[2mms[22m[39m
[90mstdout[2m | tests/functions/admin/orders/overrides.test.ts[2m > [22m[2mrefundOrderHandler[2m > [22m[2mreturns 202 with REFUND_INITIATED on happy path (stub)
[22m[39mREFUND_INITIATED { orderId: [32m'ord_1'[39m, reason: [32m'Customer unhappy with service'[39m }

 [32m✓[39m tests/functions/admin/orders/overrides.test.ts [2m([22m[2m18 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/cosmos/finance-repository.test.ts [2m([22m[2m14 tests[22m[2m)[22m[90m 17[2mms[22m[39m
 [32m✓[39m tests/cosmos/orders-repository.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-booking-completed.test.ts [2m([22m[2m19 tests[22m[2m)[22m[90m 14[2mms[22m[39m
 [32m✓[39m tests/kyc/kyc-status.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 151[2mms[22m[39m
 [32m✓[39m tests/bookings/accept-decline.test.ts [2m([22m[2m7 tests[22m[2m)[22m[33m 675[2mms[22m[39m
   [33m[2m✓[22m[39m PATCH /v1/technicians/job-offers/:bookingId/accept[2m > [22mreturns 200 ASSIGNED on first caller [33m634[2mms[22m[39m
 [32m✓[39m tests/unit/ratings.test.ts [2m([22m[2m16 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/functions/admin/complaints/sla-timer.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/unit/technician-dashboard.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/functions/admin/users/patch.test.ts [2m([22m[2m18 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/cosmos/cross-partition-tenant-filter.test.ts [2m([22m[2m21 tests[22m[2m)[22m[90m 37[2mms[22m[39m
 [32m✓[39m tests/integration/auth.integration.test.ts [2m([22m[2m14 tests[22m[2m)[22m[90m 142[2mms[22m[39m
 [32m✓[39m tests/unit/users-erasure-request.test.ts [2m([22m[2m10 tests[22m[2m)[22m[33m 1617[2mms[22m[39m
   [33m[2m✓[22m[39m POST /v1/users/me/erasure-request[2m > [22mreturns 401 without Authorization [33m1509[2mms[22m[39m
 [32m✓[39m tests/schemas/catalogue-bilingual.test.ts [2m([22m[2m30 tests[22m[2m)[22m[90m 14[2mms[22m[39m
 [32m✓[39m tests/unit/earnings-cash.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/webhooks/razorpay-webhook-credit.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 15[2mms[22m[39m
 [32m✓[39m tests/functions/complaints/partner-create.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/unit/admin-erasure-execute.test.ts [2m([22m[2m7 tests[22m[2m)[22m[33m 1481[2mms[22m[39m
   [33m[2m✓[22m[39m PATCH /v1/admin/erasure-requests/:id (EXECUTE)[2m > [22mreturns 404 when erasure request does not exist [33m1451[2mms[22m[39m
 [32m✓[39m tests/unit/commission-config.service.test.ts [2m([22m[2m20 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/functions/job-offers-expire-stale.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/unit/dataExport-service.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 63[2mms[22m[39m
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

 [32m✓[39m tests/unit/functions/bookings-slot-gate.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 77[2mms[22m[39m
 [32m✓[39m tests/unit/pending-actions-read-api.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/cosmos/finance-pnl-truth.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 6[2mms[22m[39m
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

 [32m✓[39m tests/bookings/create-service-area.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 13[2mms[22m[39m
[90mstdout[2m | tests/bookings/create-service-area.test.ts[2m > [22m[2mPOST /v1/bookings — service-area gating (E16-S01)[2m > [22m[2minside-polygon + flag ON → 201 (flag only applies to out-of-area)
[22m[39mservice_area_check {
  customerId: [32m'cust-area-1'[39m,
  lat: [33m26.7958[39m,
  lng: [33m82.1947[39m,
  inside: [33mtrue[39m,
  mode: [32m'fail'[39m
}

 [32m✓[39m tests/services/fcm.service.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 8[2mms[22m[39m
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

[90mstdout[2m | tests/bookings/create.test.ts[2m > [22m[2mPOST /v1/bookings[2m > [22m[2mreturns 404 when service not found
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m0[39m,
  lng: [33m0[39m,
  inside: [33mfalse[39m,
  mode: [32m'warn-only'[39m
}

 [32m✓[39m tests/bookings/create.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 17[2mms[22m[39m
 [32m✓[39m tests/catalogue-public.test.ts [2m([22m[2m12 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/cosmos/rate-limit-repository.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/catalogue-patch-semantics.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/functions/technician-bookings.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 58[2mms[22m[39m
 [32m✓[39m tests/unit/earnings.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 16[2mms[22m[39m
 [32m✓[39m tests/functions/rating-escalate.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/functions/wallet.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/bookings/price-approval.test.ts [2m([22m[2m13 tests[22m[2m)[22m[90m 14[2mms[22m[39m
 [32m✓[39m tests/unit/technicians.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/mark-commission-received.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 12[2mms[22m[39m
 [32m✓[39m tests/waitlist.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m tests/integration/admin-routes-unauth.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 16[2mms[22m[39m
 [32m✓[39m tests/unit/users-data-export.test.ts [2m([22m[2m5 tests[22m[2m)[22m[33m 1510[2mms[22m[39m
   [33m[2m✓[22m[39m GET /v1/users/me/data-export[2m > [22mreturns 401 when Authorization header is missing [33m1381[2mms[22m[39m
 [32m✓[39m tests/middleware/requireIntegrity.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 53[2mms[22m[39m
 [32m✓[39m tests/unit/functions/services-availability.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/unit/earnings.service.test.ts [2m([22m[2m17 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/functions/admin/catalogue/commission-config.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/functions/webhook-fast-path.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 16[2mms[22m[39m
 [32m✓[39m tests/unit/sos.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/functions/admin/auth/login.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m tests/webhooks/razorpay-webhook-branch-coverage.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/unit/withRateLimit.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 41[2mms[22m[39m
 [32m✓[39m tests/services/formRecognizer.service.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 56[2mms[22m[39m
 [32m✓[39m tests/unit/admin-erasure-deny.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 68[2mms[22m[39m
 [32m✓[39m tests/unit/payouts-kill-switch.test.ts [2m([22m[2m18 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/cosmos/system-docs-repository.test.ts [2m([22m[2m12 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/bookings/bookings-get-photos.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-applyAddOnDecisions.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/functions/auth/truecaller-verify.test.ts [2m([22m[2m5 tests[22m[2m)[22m[33m 427[2mms[22m[39m
 [32m✓[39m tests/services/admin-session-rotate.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-addPhoto.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/kyc/submit-aadhaar.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 120[2mms[22m[39m
[90mstdout[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2mfinds zero overdue → no-op
[22m[39mprocessOverdueErasures: 0 overdue PENDING request(s) at 2026-09-07T11:25:24.106Z
processOverdueErasures done: processed=0 executed=0 failed=0 skipped=0

 [32m✓[39m tests/unit/trigger-reconcile-payouts.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 8[2mms[22m[39m
[90mstdout[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2mprocesses overdue PENDING requests, runs cascade, marks EXECUTED
[22m[39mprocessOverdueErasures: 2 overdue PENDING request(s) at 2026-09-07T11:25:24.116Z
processOverdueErasures done: processed=2 executed=2 failed=0 skipped=0

[90mstdout[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2misolates per-request failures: one cascade error does not abort the batch
[22m[39mprocessOverdueErasures: 3 overdue PENDING request(s) at 2026-09-07T11:25:24.124Z
processOverdueErasures done: processed=3 executed=2 failed=1 skipped=0

 [32m✓[39m tests/integration/erasure-cron.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 1682[2mms[22m[39m
   [33m[2m✓[22m[39m trigger-erasure-deadline (Azure timer trigger)[2m > [22mfinds zero overdue → no-op [33m1657[2mms[22m[39m
[90mstdout[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2mskips entries that no longer exist or have changed status (race-free)
[22m[39mprocessOverdueErasures: 1 overdue PENDING request(s) at 2026-09-07T11:25:24.132Z
processOverdueErasures done: processed=1 executed=0 failed=0 skipped=1

 [32m✓[39m tests/unit/rating-appeal.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/technicians/active-job-photos.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/slot-holds-repository.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/unit/tech-ratings.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 12[2mms[22m[39m
 [32m✓[39m tests/integration/handlers.integration.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 53[2mms[22m[39m
 [32m✓[39m tests/functions/config/technician.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/approve-payouts.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/bookings/branch-coverage.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m tests/cosmos/commission-config-repository.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 19[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-next-day-payout.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/middleware/withRateLimit.keyExtractor.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-requestAddOn.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/functions/complaints/partner-get.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/functions/admin/sos/playback-token.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/functions/technicians/commission-due.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 14[2mms[22m[39m
 [32m✓[39m tests/unit/adminUser.service.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/integration/dpdp-data-inventory.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 18[2mms[22m[39m
 [32m✓[39m tests/unit/shield-report.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/services/truecaller.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/functions/admin/dashboard/summary.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 34[2mms[22m[39m
 [32m✓[39m tests/catalogue-seed.test.ts [2m([22m[2m53 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/services/service-area.service.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/services/fcm-technician.service.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/schemas/finance.test.ts [2m([22m[2m18 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/unit/launch-gate.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-markPaid.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/technicians/confidence-score.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/unit/report-data.service.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/integration/dispatcher-up-ranking.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 2[2mms[22m[39m
 [32m✓[39m tests/functions/admin/auth/setup-totp.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/functions/technician-availability.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 581[2mms[22m[39m
   [33m[2m✓[22m[39m technician availability handlers[2m > [22mreturns current technician availability [33m574[2mms[22m[39m
 [32m✓[39m tests/kyc/submit-aadhaar-idor.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 52[2mms[22m[39m
 [32m✓[39m tests/functions/sos-key.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/functions/admin/dashboard/feed.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-service-report.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/unit/requireAdmin.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 22[2mms[22m[39m
 [32m✓[39m tests/cosmos/client-retry.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 38[2mms[22m[39m
 [32m✓[39m tests/observability/sentry-before-send.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/functions/admin/audit-log/list.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 37[2mms[22m[39m
 [32m✓[39m tests/middleware/withCorrelationId.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/integration/dispatcher-data-isolation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/payout-cadence.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/services/piiCrypto.service.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/schemas/commission-receivable.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m tests/static/ledger-batch-only.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 78[2mms[22m[39m
 [32m✓[39m tests/catalogue-repository.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/functions/admin/dashboard/tech-locations.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-updateBookingFields.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-confirmPayment.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/rating-repository.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/cosmos/live-location-repository.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/functions/admin/complaints/create.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/functions/users-erasure-request.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/unit/acs-email.service.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/cosmos/audit-log-repository.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/technician-geospatial.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/services/commission-allocator.pure.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/bookings/confirm.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 12[2mms[22m[39m
 [32m✓[39m tests/unit/adminSession.service.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/booking-repository.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m tests/integration/rbac.integration.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 27[2mms[22m[39m
 [32m✓[39m tests/unit/auditLog.service.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/openapi/registry-e21-s02.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 23[2mms[22m[39m
 [32m✓[39m tests/schemas/audit-log.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/bookings/list.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 689[2mms[22m[39m
   [33m[2m✓[22m[39m GET /v1/bookings[2m > [22mreturns current customer bookings with service names and final amount [33m688[2mms[22m[39m
 [32m✓[39m tests/unit/verifyTechnicianToken.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/schemas/webhook.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/services/pan.utils.test.ts [2m([22m[2m16 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/commission-routes-rbac.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/shared/slot-utils.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/schemas/order.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/unit/jwt.service.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 30[2mms[22m[39m
 [32m✓[39m tests/scripts/seed-technicians.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/cosmos/dispatch-attempt-repository.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-getByPaymentOrderId.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/schemas/booking.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/services/razorpayRoute.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/schemas/commission-ledger.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/scripts/backfill-commission-holds.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/services/dispatcher.service.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/unit/schemas/technician.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/summary.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/functions/admin/complaints/list.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/geo.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 2[2mms[22m[39m
 [32m✓[39m tests/schemas/commission-config.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-getStaleSearching.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/schemas/service-category.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/functions/integrity/nonce.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 1152[2mms[22m[39m
   [33m[2m✓[22m[39m GET /v1/integrity/nonce[2m > [22mreturns 200 with a nonce field that is a valid UUID v4 [33m1134[2mms[22m[39m
 [32m✓[39m tests/schemas/live-location.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/functions/admin/orders/candidates.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/schemas/kyc.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/unit/schemas/slot-hold.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 17[2mms[22m[39m
 [32m✓[39m tests/lib/ist-time.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/integration/audit-log-coverage-invariant.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/schemas/service.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/shared/timing-safe.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/unit/commission.service.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/unit/totp.service.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-rating-prompt.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/functions/admin/complaints/repeat-offenders.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/unit/semgrep-fcm-ordering.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 633[2mms[22m[39m
   [33m[2m✓[22m[39m Semgrep FCM ordering invariant[2m > [22mpending-action-projector exports both upsertAction and emitFcmForAction [33m630[2mms[22m[39m
 [32m✓[39m tests/unit/requireCustomer.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/functions/admin/orders/detail.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 2[2mms[22m[39m
 [32m✓[39m tests/schemas/commission-config-v2.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/customer-credit-repository.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/functions/admin/orders/list.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/cosmos/seed-merge.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 2[2mms[22m[39m
 [32m✓[39m tests/cosmos/retry-utils.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 2[2mms[22m[39m
 [32m✓[39m tests/unit/razorpay.service.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-hasActiveBookingForTechnician.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 2[2mms[22m[39m
 [32m✓[39m tests/functions/admin/users/list.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/zod-pattern.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/pdf-generator.service.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 117[2mms[22m[39m
 [32m✓[39m tests/observability.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/services/auditLog.service.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/version.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 2[2mms[22m[39m
 [32m✓[39m tests/unit/cookies.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/shared/address-text.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 2[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/payout-queue.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/functions/timers/prune-device-tokens.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/health.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/weekly-aggregate.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/openapi-build.test.ts [2m([22m[2m6 tests[22m[2m)[22m[33m 3793[2mms[22m[39m
   [33m[2m✓[22m[39m openapi:build[2m > [22mis byte-deterministic across two runs [33m1100[2mms[22m[39m

[2m Test Files [22m [1m[32m211 passed[39m[22m[90m (211)[39m
[2m      Tests [22m [1m[32m1963 passed[39m[22m[90m (1963)[39m
[2m   Start at [22m 07:25:14
[2m   Duration [22m 17.89s[2m (transform 27.42s, setup 0ms, collect 127.50s, tests 18.95s, environment 33ms, prepare 23.57s)[22m

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

[90mstderr[2m | tests/webhooks/razorpay-webhook.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "razorpayWebhook" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "reconcileStaleBookings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mE21-S01: cash collection on COMPLETED transition[2m > [22m[2msets cashCollectionStatus=COLLECTED when cashCollected=true
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mE21-S01: cash collection on COMPLETED transition[2m > [22m[2mdoes NOT set cashCollectionStatus when cashCollected is absent
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/active-job.test.ts[2m > [22m[2mPATCH /v1/technicians/active-job/:bookingId/transition[2m > [22m[2mE21-S02: synchronous settlement + collectionMethod + cash audit[2m > [22m[2mpatches all four cash fields, calls settleCashCompletion with the updated booking, and writes CASH_COLLECTION_RECORDED audit
[22m[39mWARNING: Skipping call to register function "getActiveJob" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "transitionActiveJobStatus" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/bookings/create-apply-credit.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "createBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "confirmBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyBookings" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "requestAddon" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveFinalPrice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "cancelBooking" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-pan-ocr.test.ts[2m > [22m[2mPOST /v1/kyc/pan-ocr[2m > [22m[2mreturns 200 with panMaskedNumber on OCR success (cleartext PAN never in response)
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "submitPanOcr" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-pan-ocr.test.ts[2m > [22m[2mPOST /v1/kyc/pan-ocr[2m > [22m[2mreturns 200 with MANUAL_REVIEW on OCR failure
[22m[39mWARNING: Skipping call to register function "submitPanOcr" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-pan-ocr.test.ts[2m > [22m[2mPOST /v1/kyc/pan-ocr[2m > [22m[2m[E19-S01-P2B] MANUAL_REVIEW clears stale panMaskedNumber + panHash from previous successful scan
[22m[39mWARNING: Skipping call to register function "submitPanOcr" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/unit/trigger-projectors.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerProjectorBookings" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/functions/admin/finance/commission-remittances.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "recordCommissionRemittance" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-projectors.test.ts
[22m[39mWARNING: Skipping call to register function "triggerProjectorComplaints" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/compliance/ssc-levy.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "sscLevyQuarterly" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "listSscLevies" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveSscLevy" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/functions/admin/finance/commission-receivables.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminCommissionReceivablesDashboard" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminCommissionReceivablesPerTech" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminCommissionReceivablesRecompute" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/finance/commission-hold-override.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "setCommissionHoldOverride" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "clearCommissionHoldOverride" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/unit/trigger-booking-completed.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerBookingCompleted" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/kyc-status.test.ts[2m > [22m[2mGET /v1/kyc/status[2m > [22m[2mreturns 200 with KYC status for authenticated technician
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getKycStatus" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/kyc-status.test.ts[2m > [22m[2mGET /v1/kyc/status[2m > [22m[2mreturns 404 when no KYC record found
[22m[39mWARNING: Skipping call to register function "getKycStatus" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/bookings/accept-decline.test.ts[2m > [22m[2mPATCH /v1/technicians/job-offers/:bookingId/accept[2m > [22m[2mreturns 200 ASSIGNED on first caller
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "acceptJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "declineJobOffer" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "expireStaleOffers" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/integration/auth.integration.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminLogin" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/ratings.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "submitRating" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getRating" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/complaints/sla-timer.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "slaBreachTimer" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/auth.integration.test.ts
[22m[39m[SECURITY] ADMIN_SETUP_SECRET is not set — TOTP setup endpoint is open to any caller. Set this env var before production deploy.
WARNING: Skipping call to register function "adminSetupTotpGet" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminSetupTotpPost" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/users/patch.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminPatchUser" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/technician-dashboard.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "technicianDashboard" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/webhooks/razorpay-webhook-credit.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "razorpayWebhook" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "reconcileStaleBookings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/earnings-cash.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getEarnings" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/functions/complaints/partner-create.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "partnerCreateComplaint" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/bookings/create-service-area.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "createBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "confirmBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyBookings" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "requestAddon" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveFinalPrice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "cancelBooking" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/services/fcm.service.test.ts[2m > [22m[2msendOwnerSosAlert[2m > [22m[2msendOwnerSosAlert_does_not_leak_address_in_fcm_payload
[22m[39m[FCM] no admin device tokens, falling back to owner_alerts topic

[90mstderr[2m | tests/services/fcm.service.test.ts[2m > [22m[2msendAbusiveShieldAlert[2m > [22m[2mdoes not include customerId in the FCM payload
[22m[39m[FCM] no admin device tokens, falling back to owner_alerts topic

[90mstderr[2m | tests/services/fcm.service.test.ts[2m > [22m[2msendBookingStatusUpdatePush — device-token send[2m > [22m[2mfans out to customer device tokens
[22m[39m[FCM] stale single token for user cust-20, skipping send

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

[90mstderr[2m | tests/catalogue-public.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getCategories" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getServiceById" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/earnings.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getEarnings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/technician-bookings.test.ts[2m > [22m[2mGET /v1/technicians/me/bookings[2m > [22m[2mreturns 401 when technician auth fails
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getMyTechnicianBookings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/rating-escalate.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "escalateRating" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/wallet.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getWalletBalance" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getWalletLedger" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/unit/technicians.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "patchTechnicianFcmToken" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyTechnicianAvailability" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "patchMyTechnicianAvailability" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyTechnicianServiceProfile" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "patchMyTechnicianServiceProfile" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getTechnicianProfile" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getConfidenceScore" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Skipping call to register function "adminGetOrder" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Skipping call to register function "adminSosPlaybackToken" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Skipping call to register function "adminGetSosIncident" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/waitlist.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "waitlist" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/functions/admin/catalogue/commission-config.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getAdminCommissionConfig" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "putAdminCommissionConfig" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/webhook-fast-path.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "razorpayWebhook" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "reconcileStaleBookings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/sos.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "sos" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/auth/login.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminLogin" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/webhooks/razorpay-webhook-branch-coverage.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "razorpayWebhook" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "reconcileStaleBookings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/payouts-kill-switch.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerNextDayPayout" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/payouts-kill-switch.test.ts
[22m[39mWARNING: Skipping call to register function "triggerReconcilePayouts" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/payouts-kill-switch.test.ts
[22m[39mWARNING: Skipping call to register function "adminApprovePayouts" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/functions/auth/truecaller-verify.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "truecallerVerify" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-aadhaar.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar[2m > [22m[2mreturns 200 with masked number on successful DigiLocker exchange
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-aadhaar.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar[2m > [22m[2mreturns 200 with PENDING_MANUAL when DigiLocker returns null
[22m[39mWARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-aadhaar.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar[2m > [22m[2memits KYC_AADHAAR_VERIFIED audit entry on successful DigiLocker exchange
[22m[39mWARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-aadhaar.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar[2m > [22m[2memits KYC_AADHAAR_REJECTED audit entry when DigiLocker returns null
[22m[39mWARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-reconcile-payouts.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerReconcilePayouts" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-aadhaar.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar[2m > [22m[2mreturns 401 on invalid token
[22m[39mWARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/technicians/active-job-photos.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "activeJobPhotos" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/handlers.integration.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminRefresh" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/handlers.integration.test.ts
[22m[39mWARNING: Skipping call to register function "adminLogout" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/handlers.integration.test.ts
[22m[39mWARNING: Skipping call to register function "adminMe" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/tech-ratings.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getTechRatings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/cosmos/slot-holds-repository.test.ts[2m > [22m[2mslotHoldsRepo.commitHold[2m > [22m[2msilently returns when hold has already expired (Cosmos 404)
[22m[39m[slotHoldsRepo] commitHold: hold already expired (non-fatal) { holdId: [32m'svc-ac|2026-05-20|10:00-11:00'[39m, bookingId: [32m'bk-1'[39m }

[90mstderr[2m | tests/functions/config/technician.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "technicianConfig" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/unit/trigger-next-day-payout.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerNextDayPayout" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/complaints/partner-get.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "partnerGetComplaints" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/sos/playback-token.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminSosPlaybackToken" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/technicians/commission-due.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "techCommissionDue" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/shield-report.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "shieldReport" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/unit/trigger-service-report.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerServiceReport" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/audit-log/list.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminAuditLogList" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/payout-cadence.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "updatePayoutCadence" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/functions/admin/finance/summary.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminFinanceSummary" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/complaints/list.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminListComplaints" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/unit/trigger-rating-prompt.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerRatingPrompt" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/complaints/repeat-offenders.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminRepeatOffenders" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/orders/detail.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminGetOrder" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/orders/list.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminListOrders" because the "@azure/functions" package is in test mode.

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


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem api/src -Recurse | Select-String -Pattern \"status.*'CLOSED'|CLOSED\" -Context 1,2" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 660ms:

  api\src\cosmos\booking-repository.ts:161:                    'ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS',
> api\src\cosmos\booking-repository.ts:162:                    'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED'
  api\src\cosmos\booking-repository.ts:163:                  )`,
  api\src\cosmos\booking-repository.ts:164:        parameters: [{ name: '@technicianId', value: technicianId }],
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
  api\src\functions\shield-report.ts:25:  'PAID',
> api\src\functions\shield-report.ts:26:  'CLOSED',
  api\src\functions\shield-report.ts:27:]);
  api\src\functions\shield-report.ts:28:
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
  api\src\functions\admin\dashboard\feed.ts:21:  }
> api\src\functions\admin\dashboard\feed.ts:22:  if (['COMPLETED', 'PAID', 'CLOSED'].includes(status)) return 
'completed';
  api\src\functions\admin\dashboard\feed.ts:23:  if (['UNFULFILLED', 'CUSTOMER_CANCELLED', 'NO_SHOW_REDISPATCH', 
'CANCELLED'].includes(status)) {
  api\src\functions\admin\dashboard\feed.ts:24:    return 'alert';
  api\src\functions\complaints\partner-create.ts:44:  if (!isCustomer && !isTechnician) return { status: 403, 
jsonBody: { code: 'FORBIDDEN' } };
> api\src\functions\complaints\partner-create.ts:45:  if (!['COMPLETED', 'PAID', 'CLOSED'].includes(booking.status)) {
  api\src\functions\complaints\partner-create.ts:46:    return { status: 409, jsonBody: { code: 
'BOOKING_NOT_ELIGIBLE', status: booking.status } };
  api\src\functions\complaints\partner-create.ts:47:  }
  api\src\schemas\booking.ts:6:  'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE',
> api\src\schemas\booking.ts:7:  'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED',
  api\src\schemas\booking.ts:8:  'UNFULFILLED', 'CUSTOMER_CANCELLED', 'NO_SHOW_REDISPATCH',
  api\src\schemas\booking.ts:9:] as const;
  api\src\schemas\order.ts:7:  'PENDING_PAYMENT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE', 'REACHED',
> api\src\schemas\order.ts:8:  'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL', 'COMPLETED', 'PAID', 'CLOSED',
  api\src\schemas\order.ts:9:  'UNFULFILLED', 'CUSTOMER_CANCELLED', 'NO_SHOW_REDISPATCH',
  api\src\schemas\order.ts:10:  // Legacy alias used by older clients — kept for backward-compat
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
  api\src\services\service-area.service.ts:24: * @param lng     - Longitude (WGS-84). Valid range: -180..180.
> api\src\services\service-area.service.ts:25: * @param polygon - A GeoJSON Feature<Polygon> with a closed exterior 
ring
  api\src\services\service-area.service.ts:26: *                  (first coordinate === last coordinate).
  api\src\services\service-area.service.ts:27: *



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem api/src -Recurse | Select-String -Pattern \"status: 'CLOSED'|status = 'CLOSED'|CLOSED'\" | Select-Object Path,LineNumber,Line" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 917ms:

Path                                                                                            LineNumber Line        
----                                                                                            ---------- ----        
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts                     162          ...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\rating-escalate.ts                      36   if (boo...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\ratings.ts                              40   if (!['...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\ratings.ts                              41     retur...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\shield-report.ts                        26   'CLOSED', 
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-projector-complaints.ts         39   status:...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-projector-complaints.ts         46 const CLO...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-rating-prompt.ts                19   if (!pa...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\dashboard\feed.ts                 22   if (['C...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\complaints\partner-create.ts            45   if (!['...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts                                 7   'REACHE...
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\order.ts                                   8   'IN_PRO...



2026-09-07T11:25:48.255687Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/active-job.ts -TotalCount 180 | Select-Object -Skip 90 -First 70' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 879ms:

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

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/active-job.ts -TotalCount 220 | Select-Object -Skip 160 -First 60' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 628ms:
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
      bookingId,
      lat: body.currentLocation.lat,
      lng: body.currentLocation.lng,
      etaMinutes,
    }).catch((err: unknown) => ctx.error('FCM LOCATION_UPDATE failed', err));
  }

  const service = await catalogueRepo.getServiceByIdCrossPartition(updated.serviceId);

  return {
    status: 200,
    jsonBody: {
      bookingId: updated.id,
      customerId: updated.customerId,
      serviceId: updated.serviceId,
      serviceName: service?.name ?? '',
      addressText: normalizeAddressText(updated.addressText),
      addressLatLng: updated.addressLatLng,
      status: updated.status,
      slotDate: updated.slotDate,
      slotWindow: updated.slotWindow,
    },
  };
};

app.http('getActiveJob', {
  route: 'v1/technicians/active-job/{bookingId}',
  methods: ['GET'],
  handler: getActiveJobHandler,
});

2026-09-07T11:25:55.769637Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/tests/services/commission-settlement.service.test.ts -Raw' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 722ms:
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../src/cosmos/catalogue-repository.js');
vi.mock('../../src/cosmos/technician-repository.js');
vi.mock('../../src/services/commission-config.service.js');
vi.mock('../../src/services/commission-allocator.service.js');
vi.mock('../../src/services/commission-hold.service.js');
vi.mock('../../src/services/fcm.service.js');
vi.mock('../../src/services/auditLog.service.js');
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import {
  recordCommissionDue,
  finalizeLedgerForTechnician,
  settleCashCompletion,
} from '../../src/services/commission-settlement.service.js';
import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';
import { catalogueRepo } from '../../src/cosmos/catalogue-repository.js';
import { incrementCompletedJobCount } from '../../src/cosmos/technician-repository.js';
import * as configSvc from '../../src/services/commission-config.service.js';
import { consumePendingCredits } from '../../src/services/commission-allocator.service.js';
import { recomputeCommissionHold } from '../../src/services/commission-hold.service.js';
import { sendTechEarningsUpdate } from '../../src/services/fcm.service.js';
import { systemAudit } from '../../src/services/auditLog.service.js';
import * as Sentry from '@sentry/node';
import type { BookingDoc } from '../../src/schemas/booking.js';

const cashBooking: BookingDoc = {
  id: 'booking-abc',
  customerId: 'customer-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-04-24',
  slotWindow: '09:00-11:00',
  addressText: '123 Main St',
  addressLatLng: { lat: 12.9, lng: 77.6 },
  status: 'COMPLETED',
  paymentOrderId: 'order-1',
  paymentMethod: 'CASH_ON_SERVICE',
  paymentId: 'pay-1',
  paymentSignature: 'sig-1',
  amount: 50000,
  technicianId: 'tech-1',
  createdAt: '2026-04-24T09:00:00.000Z',
};

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(commissionReceivableRepo.getByBookingId).mockResolvedValue(null);
  vi.mocked(commissionReceivableRepo.createDueEntry).mockResolvedValue(true);
  vi.mocked(configSvc.getGlobalCommissionBps).mockResolvedValue(2200);
  vi.mocked(configSvc.resolveCommissionBps).mockReturnValue({ bps: 2200, from: 'GLOBAL' });
  vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue(null);
  vi.mocked(catalogueRepo.getCategoryById).mockResolvedValue(null);

  vi.mocked(consumePendingCredits).mockResolvedValue({ consumedPaise: 0 });
  vi.mocked(recomputeCommissionHold).mockResolvedValue({ hold: null, status: 'MISSING' });

  vi.mocked(incrementCompletedJobCount).mockResolvedValue(undefined);
  vi.mocked(sendTechEarningsUpdate).mockResolvedValue(undefined);
  vi.mocked(systemAudit).mockResolvedValue(undefined);
});

describe('recordCommissionDue â€” cascade precedence (moved from trigger test)', () => {
  it('creates a DUE commission receivable with global bps when no service/category override', async () => {
    const r = await recordCommissionDue(cashBooking);

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: 'booking-abc',
        technicianId: 'tech-1',
        serviceId: 'svc-1',
        categoryId: 'cat-1',
        bookingAmount: 50000,
        commissionBps: 2200,
        commissionDue: 11000,
        commissionResolvedFrom: 'GLOBAL',
      }),
    );
    expect(r).toEqual({ created: true, commissionDue: 11000, commissionBps: 2200, commissionResolvedFrom: 'GLOBAL' });
  });

  it('resolves service-level bps when service has commissionBps override', async () => {
    vi.mocked(configSvc.resolveCommissionBps).mockReturnValue({ bps: 2500, from: 'SERVICE' });
    vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue({ commissionBps: 2500 } as never);

    const r = await recordCommissionDue(cashBooking);

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ commissionBps: 2500, commissionDue: 12500, commissionResolvedFrom: 'SERVICE' }),
    );
    expect(r).toMatchObject({ created: true, commissionBps: 2500, commissionDue: 12500, commissionResolvedFrom: 'SERVICE' });
  });

  it('resolves category-level bps when category has override but service does not', async () => {
    vi.mocked(configSvc.resolveCommissionBps).mockReturnValue({ bps: 3000, from: 'CATEGORY' });
    vi.mocked(catalogueRepo.getCategoryById).mockResolvedValue({ commissionBps: 3000 } as never);

    const r = await recordCommissionDue(cashBooking);

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ commissionBps: 3000, commissionDue: 15000, commissionResolvedFrom: 'CATEGORY' }),
    );
    expect(r).toMatchObject({ created: true, commissionBps: 3000, commissionDue: 15000, commissionResolvedFrom: 'CATEGORY' });
  });

  it('passes cashCollectedAmount to createDueEntry when present on booking', async () => {
    await recordCommissionDue({ ...cashBooking, cashCollectedAmount: 50000 });

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ cashCollectedAmount: 50000 }),
    );
  });

  it('omits cashCollectedAmount when absent on booking', async () => {
    await recordCommissionDue(cashBooking);

    const call = vi.mocked(commissionReceivableRepo.createDueEntry).mock.calls[0]![0];
    expect(Object.prototype.hasOwnProperty.call(call, 'cashCollectedAmount')).toBe(false);
  });

  it('uses finalAmount over amount for commissionDue calculation', async () => {
    // finalAmount=60000 at 2200 bps -> commissionDue = round(60000*2200/10000) = 13200
    const r = await recordCommissionDue({ ...cashBooking, finalAmount: 60000, amount: 50000 });

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ bookingAmount: 60000, commissionDue: 13200 }),
    );
    expect(r).toMatchObject({ commissionDue: 13200 });
  });
});

describe('recordCommissionDue â€” denormalised fields', () => {
  it('includes serviceName from booking.serviceName when present', async () => {
    await recordCommissionDue({ ...cashBooking, serviceName: 'Deep Clean' });

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ serviceName: 'Deep Clean' }),
    );
  });

  it('falls back to the catalogue service name when booking.serviceName is absent', async () => {
    vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue({ name: 'AC Repair' } as never);

    await recordCommissionDue(cashBooking);

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ serviceName: 'AC Repair' }),
    );
  });

  it('omits serviceName entirely when both booking.serviceName and the catalogue service name are absent', async () => {
    await recordCommissionDue(cashBooking);

    const call = vi.mocked(commissionReceivableRepo.createDueEntry).mock.calls[0]![0];
    expect(Object.prototype.hasOwnProperty.call(call, 'serviceName')).toBe(false);
  });

  it('always passes slotDate from the booking', async () => {
    await recordCommissionDue(cashBooking);

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ slotDate: '2026-04-24' }),
    );
  });

  it('passes collectionMethod when present on the booking', async () => {
    await recordCommissionDue({ ...cashBooking, collectionMethod: 'UPI_QR' });

    expect(commissionReceivableRepo.createDueEntry).toHaveBeenCalledWith(
      expect.objectContaining({ collectionMethod: 'UPI_QR' }),
    );
  });

  it('omits collectionMethod entirely when absent on the booking', async () => {
    await recordCommissionDue(cashBooking);

    const call = vi.mocked(commissionReceivableRepo.createDueEntry).mock.calls[0]![0];
    expect(Object.prototype.hasOwnProperty.call(call, 'collectionMethod')).toBe(false);
  });
});

describe('recordCommissionDue â€” guards', () => {
  it('returns skipped NOT_COMPLETED for a non-COMPLETED booking, without reading the ledger', async () => {
    const r = await recordCommissionDue({ ...cashBooking, status: 'IN_PROGRESS' });

    expect(r).toEqual({ created: false, skipped: 'NOT_COMPLETED' });
    expect(commissionReceivableRepo.getByBookingId).not.toHaveBeenCalled();
  });

  it('returns skipped NO_TECHNICIAN when technicianId is missing, without reading the ledger', async () => {
    const r = await recordCommissionDue({ ...cashBooking, technicianId: undefined });

    expect(r).toEqual({ created: false, skipped: 'NO_TECHNICIAN' });
    expect(commissionReceivableRepo.getByBookingId).not.toHaveBeenCalled();
  });

  it('returns skipped NOT_CASH for a RAZORPAY booking, without touching the receivable repo', async () => {
    const r = await recordCommissionDue({ ...cashBooking, paymentMethod: 'RAZORPAY' });

    expect(r).toEqual({ created: false, skipped: 'NOT_CASH' });
    expect(commissionReceivableRepo.getByBookingId).not.toHaveBeenCalled();
    expect(commissionReceivableRepo.createDueEntry).not.toHaveBeenCalled();
    expect(configSvc.getGlobalCommissionBps).not.toHaveBeenCalled();
  });
});

describe('recordCommissionDue â€” existing-row and 409 paths', () => {
  it('returns created:false with the stored values when the receivable already exists', async () => {
    vi.mocked(commissionReceivableRepo.getByBookingId).mockResolvedValue({
      id: 'booking-abc',
      bookingId: 'booking-abc',
      technicianId: 'tech-1',
      partitionKey: 'tech-1',
      serviceId: 'svc-1',
      categoryId: 'cat-1',
      bookingAmount: 50000,
      commissionBps: 2500,
      commissionDue: 12500,
      commissionResolvedFrom: 'SERVICE',
      remittanceStatus: 'DUE',
      createdAt: '2026-04-24T10:00:00.000Z',
    });

    const r = await recordCommissionDue(cashBooking);

    expect(r).toEqual({ created: false, commissionDue: 12500, commissionBps: 2500, commissionResolvedFrom: 'SERVICE' });
    expect(commissionReceivableRepo.createDueEntry).not.toHaveBeenCalled();
    expect(configSvc.getGlobalCommissionBps).not.toHaveBeenCalled();
  });

  it('returns created:false with the STORED row values (not the locally computed ones) when createDueEntry 409s', async () => {
    vi.mocked(commissionReceivableRepo.getByBookingId)
      .mockResolvedValueOnce(null) // initial existence check: row doesn't exist yet
      .mockResolvedValueOnce({
        // re-read after the 409: the racing invocation resolved a different bps than we did.
        id: 'booking-abc',
        bookingId: 'booking-abc',
        technicianId: 'tech-1',
        partitionKey: 'tech-1',
        serviceId: 'svc-1',
        categoryId: 'cat-1',
        bookingAmount: 50000,
        commissionBps: 2500,
        commissionDue: 12500,
        commissionResolvedFrom: 'SERVICE',
        remittanceStatus: 'DUE',
        createdAt: '2026-04-24T10:00:00.000Z',
      });
    vi.mocked(commissionReceivableRepo.createDueEntry).mockResolvedValue(false);

    const r = await recordCommissionDue(cashBooking);

    expect(r).toEqual({ created: false, commissionDue: 12500, commissionBps: 2500, commissionResolvedFrom: 'SERVICE' });
    expect(commissionReceivableRepo.getByBookingId).toHaveBeenCalledTimes(2);
  });

  it('throws RECEIVABLE_RACE_UNREADABLE when createDueEntry 409s but the re-read comes back null', async () => {
    vi.mocked(commissionReceivableRepo.getByBookingId).mockResolvedValue(null);
    vi.mocked(commissionReceivableRepo.createDueEntry).mockResolvedValue(false);

    await expect(recordCommissionDue(cashBooking)).rejects.toMatchObject({
      message: 'RECEIVABLE_RACE_UNREADABLE',
      code: 'RECEIVABLE_RACE_UNREADABLE',
    });
  });
});

describe('finalizeLedgerForTechnician', () => {
  it('calls consumePendingCredits then recomputeCommissionHold, in order', async () => {
    const order: string[] = [];
    vi.mocked(consumePendingCredits).mockImplementation(async () => {
      order.push('consume');
      return { consumedPaise: 500 };
    });
    vi.mocked(recomputeCommissionHold).mockImplementation(async () => {
      order.push('recompute');
      return { hold: null, status: 'MISSING' };
    });

    await finalizeLedgerForTechnician('tech-1');

    expect(consumePendingCredits).toHaveBeenCalledWith('tech-1');
    expect(recomputeCommissionHold).toHaveBeenCalledWith('tech-1');
    expect(order).toEqual(['consume', 'recompute']);
  });

  it('captures the error with Sentry and still calls recomputeCommissionHold when consumePendingCredits throws', async () => {
    const err = new Error('consume boom');
    vi.mocked(consumePendingCredits).mockRejectedValue(err);

    await expect(finalizeLedgerForTechnician('tech-1')).resolves.toBeUndefined();

    expect(Sentry.captureException).toHaveBeenCalledWith(err);
    expect(recomputeCommissionHold).toHaveBeenCalledWith('tech-1');
  });

  it('captures the error with Sentry when recomputeCommissionHold throws, without rethrowing', async () => {
    const err = new Error('recompute boom');
    vi.mocked(recomputeCommissionHold).mockRejectedValue(err);

    await expect(finalizeLedgerForTechnician('tech-1')).resolves.toBeUndefined();

    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });

  it('never throws even when both steps reject', async () => {
    vi.mocked(consumePendingCredits).mockRejectedValue(new Error('a'));
    vi.mocked(recomputeCommissionHold).mockRejectedValue(new Error('b'));

    await expect(finalizeLedgerForTechnician('tech-1')).resolves.toBeUndefined();
    expect(Sentry.captureException).toHaveBeenCalledTimes(2);
  });
});

describe('settleCashCompletion (E21-S02 Codex P1 fix)', () => {
  it('on created:true â€” audits COMMISSION_DUE_RECORDED once with the payload, increments job count and sends FCM once, and finalizes', async () => {
    const r = await settleCashCompletion(cashBooking);

    expect(r).toEqual({ created: true, commissionDue: 11000, commissionBps: 2200, commissionResolvedFrom: 'GLOBAL' });
    expect(systemAudit).toHaveBeenCalledTimes(1);
    expect(systemAudit).toHaveBeenCalledWith('COMMISSION_DUE_RECORDED', 'booking', 'booking-abc', {
      technicianId: 'tech-1',
      bookingAmount: 50000,
      commissionBps: 2200,
      commissionDue: 11000,
      commissionResolvedFrom: 'GLOBAL',
    });
    expect(incrementCompletedJobCount).toHaveBeenCalledTimes(1);
    expect(incrementCompletedJobCount).toHaveBeenCalledWith('tech-1');
    expect(sendTechEarningsUpdate).toHaveBeenCalledTimes(1);
    expect(sendTechEarningsUpdate).toHaveBeenCalledWith('tech-1', { bookingId: 'booking-abc', commissionDue: 11000 });
    expect(consumePendingCredits).toHaveBeenCalledWith('tech-1');
    expect(recomputeCommissionHold).toHaveBeenCalledWith('tech-1');
  });

  it('on created:false â€” does not audit/increment/send FCM, but still finalizes the ledger', async () => {
    vi.mocked(commissionReceivableRepo.getByBookingId).mockResolvedValue({
      id: 'booking-abc',
      bookingId: 'booking-abc',
      technicianId: 'tech-1',
      partitionKey: 'tech-1',
      serviceId: 'svc-1',
      categoryId: 'cat-1',
      bookingAmount: 50000,
      commissionBps: 2200,
      commissionDue: 11000,
      commissionResolvedFrom: 'GLOBAL',
      remittanceStatus: 'DUE',
      createdAt: '2026-04-24T10:00:00.000Z',
    });

    const log = vi.fn();
    const r = await settleCashCompletion(cashBooking, { log });

    expect(r).toEqual({ created: false, commissionDue: 11000, commissionBps: 2200, commissionResolvedFrom: 'GLOBAL' });
    expect(systemAudit).not.toHaveBeenCalled();
    expect(incrementCompletedJobCount).not.toHaveBeenCalled();
    expect(sendTechEarningsUpdate).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('booking-abc'));
    expect(consumePendingCredits).toHaveBeenCalledWith('tech-1');
    expect(recomputeCommissionHold).toHaveBeenCalledWith('tech-1');
  });

  it('on skipped (e.g. RAZORPAY/NOT_CASH) â€” calls nothing and does not finalize', async () => {
    const r = await settleCashCompletion({ ...cashBooking, paymentMethod: 'RAZORPAY' });

    expect(r).toEqual({ created: false, skipped: 'NOT_CASH' });
    expect(systemAudit).not.toHaveBeenCalled();
    expect(incrementCompletedJobCount).not.toHaveBeenCalled();
    expect(sendTechEarningsUpdate).not.toHaveBeenCalled();
    expect(consumePendingCredits).not.toHaveBeenCalled();
    expect(recomputeCommissionHold).not.toHaveBeenCalled();
  });

  it('propagates a throwing recordCommissionDue (createDueEntry throws)', async () => {
    const err = new Error('cosmos boom');
    vi.mocked(commissionReceivableRepo.createDueEntry).mockRejectedValue(err);

    await expect(settleCashCompletion(cashBooking)).rejects.toThrow(err);
    expect(consumePendingCredits).not.toHaveBeenCalled();
  });

  it('Sentry-captures a throwing incrementCompletedJobCount and still finalizes the ledger', async () => {
    const err = new Error('increment boom');
    vi.mocked(incrementCompletedJobCount).mockRejectedValue(err);

    await expect(settleCashCompletion(cashBooking)).resolves.toMatchObject({ created: true });

    expect(Sentry.captureException).toHaveBeenCalledWith(err);
    expect(consumePendingCredits).toHaveBeenCalledWith('tech-1');
    expect(recomputeCommissionHold).toHaveBeenCalledWith('tech-1');
  });

  it('exactly-once property: calling twice for the same booking fires side effects exactly once, finalizes twice', async () => {
    // First call creates the row.
    await settleCashCompletion(cashBooking);

    // Second call: the receivable now exists, so recordCommissionDue reports created:false.
    vi.mocked(commissionReceivableRepo.getByBookingId).mockResolvedValue({
      id: 'booking-abc',
      bookingId: 'booking-abc',
      technicianId: 'tech-1',
      partitionKey: 'tech-1',
      serviceId: 'svc-1',
      categoryId: 'cat-1',
      bookingAmount: 50000,
      commissionBps: 2200,
      commissionDue: 11000,
      commissionResolvedFrom: 'GLOBAL',
      remittanceStatus: 'DUE',
      createdAt: '2026-04-24T10:00:00.000Z',
    });
    await settleCashCompletion(cashBooking);

    expect(systemAudit).toHaveBeenCalledTimes(1);
    expect(incrementCompletedJobCount).toHaveBeenCalledTimes(1);
    expect(sendTechEarningsUpdate).toHaveBeenCalledTimes(1);
    expect(consumePendingCredits).toHaveBeenCalledTimes(2);
    expect(recomputeCommissionHold).toHaveBeenCalledTimes(2);
  });
});


2026-09-07T11:26:03.622208Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff 5bfc0361aab64f7b637128c6c3fee9828a80393d --name-only' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 565ms:
api/scripts/backfill-historical-receivables.ts
api/src/cosmos/commission-receivable-repository.ts
api/src/schemas/commission-receivable.ts
api/src/services/commission-settlement.service.ts
api/tests/scripts/backfill-historical-receivables.test.ts
docs/reviews/codex-historical-receivables-20260907-0704.md
docs/reviews/codex-historical-receivables-round2.md
docs/reviews/codex-historical-receivables-round3.md
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

2026-09-07T11:26:17.220886Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=1; Get-Content api/src/services/commission-settlement.service.ts | ForEach-Object { if ($i -ge 24 -and $i -le 110) { '"'{0,4}: {1}' -f "'$i, $_ }; $i++ }' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 889ms:
  24:   bookingAmount: number;
  25:   bps: number;
  26:   commissionDue: number;
  27:   commissionResolvedFrom: CommissionResolvedFrom;
  28:   serviceName: string | undefined;
  29: }> {
  30:   const bookingAmount = booking.finalAmount ?? booking.amount;
  31:   const [globalBps, service, category] = await Promise.all([
  32:     getGlobalCommissionBps(),
  33:     catalogueRepo.getServiceByIdCrossPartition(booking.serviceId),
  34:     catalogueRepo.getCategoryById(booking.categoryId),
  35:   ]);
  36: 
  37:   const { bps, from: commissionResolvedFrom } = resolveCommissionBps({
  38:     ...(service?.commissionBps !== undefined ? { serviceBps: service.commissionBps } : {}),
  39:     ...(category?.commissionBps !== undefined ? { categoryBps: category.commissionBps } : {}),
  40:     globalBps,
  41:   });
  42: 
  43:   return {
  44:     bookingAmount,
  45:     bps,
  46:     commissionDue: Math.round((bookingAmount * bps) / 10000),
  47:     commissionResolvedFrom,
  48:     serviceName: booking.serviceName ?? service?.name,
  49:   };
  50: }
  51: 
  52: /**
  53:  * E21-S02 Task 8: the CASH_ON_SERVICE commission cascade, extracted verbatim from
  54:  * trigger-booking-completed.ts's CASH branch so both the change-feed trigger (at-least-once
  55:  * delivery) and the synchronous job-completion endpoint (Task 9) share one implementation.
  56:  *
  57:  * Idempotent by bookingId: an existing receivable (or a 409 from a racing invocation) is reported
  58:  * as `created: false` with the same commissionDue/commissionBps/commissionResolvedFrom the caller
  59:  * would have computed anyway, so the caller can always finalize the ledger (consume credits,
  60:  * recompute hold) regardless of whether this particular delivery created the row.
  61:  */
  62: export async function recordCommissionDue(booking: BookingDoc,
  63:   opts?: { createdAt?: string },
  64: ): Promise<RecordCommissionDueResult> {
  65:   if (booking.status !== 'COMPLETED') return { created: false, skipped: 'NOT_COMPLETED' };
  66: 
  67:   const technicianId = booking.technicianId;
  68:   if (!technicianId) return { created: false, skipped: 'NO_TECHNICIAN' };
  69: 
  70:   // E21-S02 Codex P1 fix: RAZORPAY bookings settle through the wallet-ledger path
  71:   // (trigger-booking-completed.ts's RAZORPAY branch); this cascade must never record a
  72:   // cash-style commission receivable or recompute the hold for them.
  73:   if ((booking.paymentMethod ?? 'CASH_ON_SERVICE') === 'RAZORPAY') {
  74:     return { created: false, skipped: 'NOT_CASH' };
  75:   }
  76: 
  77:   const { id: bookingId } = booking;
  78:   const bookingAmount = booking.finalAmount ?? booking.amount;
  79: 
  80:   const existing = await commissionReceivableRepo.getByBookingId(bookingId, technicianId);
  81:   if (existing) {
  82:     return {
  83:       created: false,
  84:       commissionDue: existing.commissionDue,
  85:       commissionBps: existing.commissionBps,
  86:       commissionResolvedFrom: existing.commissionResolvedFrom,
  87:     };
  88:   }
  89: 
  90:   const { bps, commissionResolvedFrom, commissionDue, serviceName } =
  91:     await resolveCommissionForBooking(booking);
  92: 
  93:   const created = await commissionReceivableRepo.createDueEntry({
  94:     bookingId,
  95:     technicianId,
  96:     serviceId: booking.serviceId,
  97:     categoryId: booking.categoryId,
  98:     bookingAmount,
  99:     commissionBps: bps,
 100:     commissionDue,
 101:     commissionResolvedFrom,
 102:     ...(booking.cashCollectedAmount !== undefined
 103:       ? { cashCollectedAmount: booking.cashCollectedAmount }
 104:       : {}),
 105:     ...(serviceName !== undefined ? { serviceName } : {}),
 106:     slotDate: booking.slotDate,
 107:     ...(booking.collectionMethod !== undefined ? { collectionMethod: booking.collectionMethod } : {}),
 108:     ...(opts?.createdAt !== undefined ? { createdAt: opts.createdAt } : {}),
 109:   });
 110: 

2026-09-07T11:26:41.212604Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/cosmos/client.ts -Raw' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 536ms:
import { CosmosClient, type Container } from '@azure/cosmos';

let _client: CosmosClient | null = null;

const RETRY_OPTIONS = {
  maxRetryAttemptsOnThrottledRequests: 9,
  maxWaitTimeInSeconds: 30,
} as const;

/**
 * Parse a Cosmos DB connection string into endpoint + key components.
 * Format: AccountEndpoint=https://...;AccountKey=<base64>=;
 */
function parseConnectionString(cs: string): { endpoint: string; key: string } {
  const endpointMatch = /AccountEndpoint=([^;]+)/i.exec(cs);
  const keyMatch = /AccountKey=([^;]+)/i.exec(cs);
  if (!endpointMatch || !keyMatch) {
    throw new Error('Invalid COSMOS_CONNECTION_STRING: missing AccountEndpoint or AccountKey');
  }
  return { endpoint: endpointMatch[1]!, key: keyMatch[1]! };
}

export function getCosmosClient(): CosmosClient {
  if (!_client) {
    const connectionString = process.env.COSMOS_CONNECTION_STRING;
    const userAgentSuffix = `homeservices-api/${process.env.GIT_SHA || 'local'}`;

    if (connectionString) {
      const { endpoint, key } = parseConnectionString(connectionString);
      _client = new CosmosClient({
        endpoint,
        key,
        connectionPolicy: { retryOptions: RETRY_OPTIONS },
        userAgentSuffix,
      });
    } else {
      const endpoint = process.env.COSMOS_ENDPOINT;
      const key = process.env.COSMOS_KEY;
      if (!endpoint || !key) {
        throw new Error('Missing COSMOS_CONNECTION_STRING or COSMOS_ENDPOINT+COSMOS_KEY');
      }
      _client = new CosmosClient({
        endpoint,
        key,
        connectionPolicy: { retryOptions: RETRY_OPTIONS },
        userAgentSuffix,
      });
    }
  }
  return _client;
}

export const DB_NAME = process.env.COSMOS_DATABASE ?? 'homeservices';

export function getCatalogueContainers(): { categories: Container; services: Container } {
  const db = getCosmosClient().database(DB_NAME);
  return {
    categories: db.container('service_categories'),
    services: db.container('services'),
  };
}

export function getBookingsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('bookings');
}

export function getDispatchAttemptsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('dispatch_attempts');
}

export function getBookingEventsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('booking_events');
}

export function getSscLeviesContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('ssc_levies');
}

export function getWalletLedgerContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('wallet_ledger');
}

export function getRatingsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('ratings');
}

export function getCustomerCreditsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('customer_credits');
}

export function getWebhookEventsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('webhook_events');
}

export function getSystemContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('system');
}

/**
 * E21-S01: Commission owed by technicians to the platform (cash pilot).
 * One doc per completed cash booking, partitioned by /technicianId so per-tech
 * outstanding reads are single-partition. id === bookingId for idempotent settlement.
 */
export function getCommissionReceivablesContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('commission_receivables');
}

export function getPendingActionsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('pending_actions');
}

/**
 * E13-S01: Customer credit ledger entries (issued / applied / refunded).
 * Stored in the existing `customer_credits` container, partitioned by /customerId.
 * No new container â€” the original `CustomerCreditDoc` records remain; we add
 * new `CustomerCreditLedgerDoc` records alongside them with type='CREDIT_APPLIED'.
 */
export function getCustomerCreditLedgerContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('customer_credits');
}

/**
 * E13-S01: Applied-credit idempotency dedup.
 * Separate container so TTL can be set at the container level (86400 s = 24h).
 * Partitioned by /customerId (same access pattern as credits).
 */
export function getAppliedCreditIdempotencyContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('applied_credit_idempotency');
}

/**
 * E16-S02: Slot holds for conflict locking.
 * Partitioned by /servicePartitionKey ("<serviceId>|<date>"). Default TTL = 30 s.
 * commitHold sets ttl=-1 on committed docs to make them permanent.
 */
export function getSlotHoldsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('slot_holds');
}

/**
 * E11-S05b-2: Per-incident AES key docs. Partitioned by /customerId.
 * defaultTtl=604800 (7 days) set at provisioning time â€” see infra/firebase/sos-audio-lifecycle.json
 * and docs/runbook.md â†’ "SOS audio retention".
 */
export function getSosIncidentKeysContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('sos_incident_keys');
}

/**
 * E19-S02: FCM device tokens â€” one doc per (userId, deviceToken) pair.
 * Partitioned by /userId for single-partition reads per user.
 * No container-level TTL; stale docs pruned manually by a daily timer trigger.
 */
export function getDeviceTokensContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('device_tokens');
}

/** Inject a mock CosmosClient in tests. */
export function _setCosmosClientForTest(mock: CosmosClient): void {
  _client = mock;
}


2026-09-07T11:26:48.923984Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force .. -Filter AGENTS*.md | Select-Object -ExpandProperty FullName' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 934ms:
codex
The changes preserve the existing commission settlement behavior while adding a guarded, dry-run-by-default backfill path. Typecheck, lint, and the relevant/full test suites pass, and I did not identify any discrete correctness issues introduced by the diff.
The changes preserve the existing commission settlement behavior while adding a guarded, dry-run-by-default backfill path. Typecheck, lint, and the relevant/full test suites pass, and I did not identify any discrete correctness issues introduced by the diff.
