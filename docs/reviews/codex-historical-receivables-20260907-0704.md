2026-09-07T11:04:20.169220Z ERROR codex_models_manager::manager: failed to load models cache: missing field `supports_parallel_tool_calls` at line 132 column 5
OpenAI Codex v0.147.0
--------
workdir: C:\Alok\Business Projects\wt-fix-cosmos-pages
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: high
reasoning summaries: none
session id: 01a07b8a-5d5d-7451-9966-47e65773d744
--------
user
changes against 'main'
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Force -Name' in C:\Alok\Business Projects\wt-fix-cosmos-pages
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --stat 5bfc0361aab64f7b637128c6c3fee9828a80393d' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 536ms:
.claire
.firebase
.githooks
.github
.serena
.superpowers
admin-web
api
artifacts
commonMain
core-nav
customer-app
design-system
docs
figma
firebase
infra
moto-g-snapshots
plans
play-store-assets
technician-app
tools
_bmad
_bmad-output
.bmad-readiness-passed
.codex-review-passed
.firebaserc
.git
.gitattributes
.gitignore
.semgrepignore
CLAUDE.md
firebase.json
TOKEN-SYNC.md

 succeeded in 626ms:
 api/scripts/backfill-historical-receivables.ts     | 150 ++++++++++++++++++
 api/src/services/commission-settlement.service.ts  |  50 ++++--
 .../backfill-historical-receivables.test.ts        | 174 +++++++++++++++++++++
 3 files changed, 361 insertions(+), 13 deletions(-)
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Path . -Filter AGENTS* -Recurse -Force | Select-Object -ExpandProperty FullName' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 1944ms:
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\.pnpm\teeny-request@9.0.0\node_modules\teeny-request\build\src\agents.d.ts
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\.pnpm\teeny-request@9.0.0\node_modules\teeny-request\build\src\agents.js
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\node_modules\.pnpm\teeny-request@9.0.0\node_modules\teeny-request\build\src\agents.js.map

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --no-ext-diff --unified=80 5bfc0361aab64f7b637128c6c3fee9828a80393d -- api/scripts/backfill-historical-receivables.ts api/src/services/commission-settlement.service.ts api/src/__tests__/backfill-historical-receivables.test.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 515ms:
diff --git a/api/scripts/backfill-historical-receivables.ts b/api/scripts/backfill-historical-receivables.ts
new file mode 100644
index 00000000..136b34f5
--- /dev/null
+++ b/api/scripts/backfill-historical-receivables.ts
@@ -0,0 +1,150 @@
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
+    const result = await recordCommissionDue(booking);
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
+    console.log(`  ADDED ${booking.id}  ${rupees(result.commissionDue)}  bps=${result.commissionBps}`);
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
+  console.log('');
+  console.log(
+    `scanned=${bookings.length} ${apply ? 'created' : 'wouldCreate'}=${apply ? created : bookings.length - alreadyPresent - unparseable - skipped} ` +
+      `alreadyPresent=${alreadyPresent} skipped=${skipped} unparseable=${unparseable}`,
+  );
+  console.log(`commission ${apply ? 'recorded' : 'that would be recorded'}: ${rupees(totalPaise)}`);
+  console.log('');
+  console.log(
+    apply
+      ? 'Apply complete. Run backfill-commission-holds.ts --apply next to compute the holds.'
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
diff --git a/api/src/services/commission-settlement.service.ts b/api/src/services/commission-settlement.service.ts
index 597eaeec..1a59a0ac 100644
--- a/api/src/services/commission-settlement.service.ts
+++ b/api/src/services/commission-settlement.service.ts
@@ -1,145 +1,169 @@
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
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --no-ext-diff --unified=80 5bfc0361aab64f7b637128c6c3fee9828a80393d -- api/src/services/commission-settlement.service.ts | Select-Object -Skip 160' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 625ms:
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
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path api/src/services/commission-settlement.service.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 546ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --no-ext-diff --unified=120 5bfc0361aab64f7b637128c6c3fee9828a80393d -- api/src/__tests__/backfill-historical-receivables.test.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 694ms:
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --name-only 5bfc0361aab64f7b637128c6c3fee9828a80393d' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 542ms:
api/scripts/backfill-historical-receivables.ts
api/src/services/commission-settlement.service.ts
api/tests/scripts/backfill-historical-receivables.test.ts
warning: unable to access 'C:\Users\alokt/.config/git/ignore': Permission denied

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git diff --no-ext-diff --unified=120 5bfc0361aab64f7b637128c6c3fee9828a80393d -- api/tests/scripts/backfill-historical-receivables.test.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 576ms:
diff --git a/api/tests/scripts/backfill-historical-receivables.test.ts b/api/tests/scripts/backfill-historical-receivables.test.ts
new file mode 100644
index 00000000..fe2fa542
--- /dev/null
+++ b/api/tests/scripts/backfill-historical-receivables.test.ts
@@ -0,0 +1,174 @@
+import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
+
+const { recordCommissionDue, resolveCommissionForBooking, settleCashCompletion } = vi.hoisted(() => ({
+  recordCommissionDue: vi.fn(),
+  resolveCommissionForBooking: vi.fn(),
+  settleCashCompletion: vi.fn(),
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path api/src/schemas/booking.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path api/package.json' in C:\Alok\Business Projects\wt-fix-cosmos-pages
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path api/src/cosmos/commission-receivable-repository.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 748ms:
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

 succeeded in 768ms:
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

 succeeded in 805ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Path api/scripts -Filter '*commission*' | Select-Object Name; Get-ChildItem -Path api/scripts -Filter '*receivables*' | Select-Object Name" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 542ms:

Name                              
----                              
backfill-commission-holds.ts      
backfill-historical-receivables.ts



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path api/scripts/backfill-commission-holds.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 702ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem -Path api/src -Recurse -Filter *.ts | Select-String -Pattern "paymentOrderId|CASH_ON_SERVICE" | Select-Object -First 200 | ForEach-Object { "$($_.Path):$($_.LineNumber):$($_.Line.Trim())" }' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 684ms:
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:20:* Not applicable to CASH_ON_SERVICE bookings (those apply credit synchronously).
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:31:paymentOrderId: string,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:45:status: 'PENDING_PAYMENT', paymentOrderId,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:47:...(paymentMethod === 'CASH_ON_SERVICE' ? { cashCollectionStatus: 'PENDING' as const } : {}),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:95:async getByPaymentOrderId(orderId: string): Promise<BookingDoc | null> {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:98:query: 'SELECT * FROM c WHERE c.paymentOrderId = @orderId',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:261:if (parsed.data.paymentMethod === 'CASH_ON_SERVICE') {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:270:const paid = await bookingRepo.markPaid(booking.id, 'cash_on_service_pending');
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:300:paymentMethod: 'CASH_ON_SERVICE',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:316:paymentMethod: 'CASH_ON_SERVICE',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:324:const manualRequest = { ...parsed.data, paymentMethod: 'CASH_ON_SERVICE' as const };
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:352:paymentMethod: 'CASH_ON_SERVICE',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:698:razorpayOrderId: booking.paymentOrderId,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:52:const paymentMethod = booking.paymentMethod ?? 'CASH_ON_SERVICE';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:55:// ── CASH_ON_SERVICE path (pilot default) ────────────────────────────────────
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\webhooks.ts:53:booking = await bookingRepo.getByPaymentOrderId(orderId);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:11:const PAYMENT_METHODS = ['RAZORPAY', 'CASH_ON_SERVICE'] as const;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:37:paymentOrderId: z.string(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\webhook.ts:16:*         order_id: string,   // maps to booking.paymentOrderId
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:53:* E21-S02 Task 8: the CASH_ON_SERVICE commission cascade, extracted verbatim from
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:71:if ((booking.paymentMethod ?? 'CASH_ON_SERVICE') === 'RAZORPAY') {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path api/src/cosmos/booking-repository.ts -TotalCount 130; Get-Content -Path api/src/functions/bookings.ts -TotalCount 380 | Select-Object -Skip 230' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 681ms:
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
  // that pre-date the container deployment or whose hold doc expired. Check existing bookings
  // directly before attempting the hold so we never create a duplicate booking.
  const existingBookedWindows = await bookingRepo.getBookedWindowsByServiceDate(
    parsed.data.serviceId,
    parsed.data.slotDate,
  );
  if (existingBookedWindows.includes(parsed.data.slotWindow)) {
    return {
      status: 409,
      jsonBody: { code: 'SLOT_UNAVAILABLE', message: 'This time slot is no longer available.' },
    };
  }

  // E16-S02: Slot-conflict locking â€” attempt to hold the slot before writing the booking.
  // createHold returns 'CONFLICT' if another hold or booking already occupies this window.
  const holdResult = await slotHoldsRepo.createHold(
    parsed.data.serviceId,
    parsed.data.slotDate,
    parsed.data.slotWindow,
    customer.customerId,
  );
  if (holdResult === 'CONFLICT') {
    return {
      status: 409,
      jsonBody: { code: 'SLOT_UNAVAILABLE', message: 'This time slot is no longer available.' },
    };
  }
  const holdId = holdResult.id;
  const holdPk = holdResult.servicePartitionKey;

  if (parsed.data.paymentMethod === 'CASH_ON_SERVICE') {
    const cashOrderId = `cash_${randomUUID()}`;
    const booking = await bookingRepo.createPending(
      parsed.data,
      customer.customerId,
      cashOrderId,
      service.basePrice,
      bookingMetadata(customer, service.name),
    );
    const paid = await bookingRepo.markPaid(booking.id, 'cash_on_service_pending');
    if (!paid) return { status: 500, jsonBody: { code: 'BOOKING_CONFIRMATION_FAILED' } };

    // E16-S02: Commit hold â€” converts 30 s soft hold to permanent slot record.
    slotHoldsRepo.commitHold(holdId, holdPk, booking.id).catch((err: unknown) => {
      Sentry.captureException(err);
      console.warn('[createBooking] commitHold failed (non-fatal)', { holdId, bookingId: booking.id, err });
    });

    // E13-S01: Apply wallet credit for cash bookings
    let appliedCreditAmount = 0;
    if (parsed.data.applyCredit && idempotencyKey) {
      const creditEnabled = await isWalletCreditEnabled(customer.customerId);
      if (creditEnabled) {
        appliedCreditAmount = await attemptCreditApplication(
          customer.customerId,
          booking.id,
          service.basePrice,
          idempotencyKey,
        );
      }
    }

    try {
      posthog.capture({
        distinctId: customer.customerId,
        event: 'booking-created',
        properties: {
          bookingId: booking.id,
          serviceId: parsed.data.serviceId,
          paymentMethod: 'CASH_ON_SERVICE',
          appliedCreditAmount,
        },
      });
    } catch { /* never break the main path */ }
    dispatcherService.triggerDispatch(booking.id).catch((err: unknown) => {
      Sentry.captureException(err);
      console.error('[createBooking] cash-on-service dispatch failed', { bookingId: booking.id, err });
    });
    return {
      status: 201,
      jsonBody: {
        bookingId: booking.id,
        razorpayOrderId: cashOrderId,
        amount: service.basePrice,
        requiresPayment: false,
        paymentMethod: 'CASH_ON_SERVICE',
        appliedCreditAmount,
      },
    };
  }

  if (!hasRazorpayCredentials()) {
    const manualOrderId = `manual_${randomUUID()}`;
    const manualRequest = { ...parsed.data, paymentMethod: 'CASH_ON_SERVICE' as const };
    const booking = await bookingRepo.createPending(
      manualRequest,
      customer.customerId,
      manualOrderId,
      service.basePrice,
      bookingMetadata(customer, service.name),
    );
    const paid = await bookingRepo.markPaid(booking.id, 'manual_payment_not_configured');
    if (!paid) return { status: 500, jsonBody: { code: 'BOOKING_CONFIRMATION_FAILED' } };

    // E16-S02: Commit hold (non-fatal)
    slotHoldsRepo.commitHold(holdId, holdPk, booking.id).catch((err: unknown) => {
      Sentry.captureException(err);
      console.warn('[createBooking] commitHold failed (non-fatal)', { holdId, bookingId: booking.id, err });
    });

    dispatcherService.triggerDispatch(booking.id).catch((err: unknown) => {
      Sentry.captureException(err);
      console.error('[createBooking] manual-payment dispatch failed', { bookingId: booking.id, err });
    });
    return {
      status: 201,
      jsonBody: {
        bookingId: booking.id,
        razorpayOrderId: manualOrderId,
        amount: service.basePrice,
        requiresPayment: false,
        paymentMethod: 'CASH_ON_SERVICE',
        appliedCreditAmount: 0,
      },
    };
  }

  // Pre-generate booking ID so we can embed it in Razorpay notes for the fast path.
  // The webhook can then do a cheap point-read (getById) instead of a cross-partition scan.
  const preGeneratedBookingId = randomUUID();

  // E13-S01 (P1-6): Determine intended credit amount WITHOUT writing to the ledger yet.
  // The actual ledger CREDIT_APPLIED entry is written in the Razorpay webhook (payment.captured),
  // NOT here. This prevents the "debit-before-payment" bug where an unpaid/abandoned booking
  // permanently consumes the customer's wallet credit.
  //
  // For the fully-credit-paid path (P1-5): if credit covers 100% of the booking, we skip
  // Razorpay entirely and mark the booking PAID directly â€” no payment intent is needed.
  let pendingCreditAmount = 0;
  const creditEnabled = parsed.data.applyCredit && idempotencyKey
    ? await isWalletCreditEnabled(customer.customerId)
    : false;

  if (creditEnabled) {
    // Peek at current balance; we don't write the ledger entry here.
    const { balanceInPaise } = await customerCreditLedgerRepo.getBalance(customer.customerId);
    pendingCreditAmount = Math.min(balanceInPaise, service.basePrice);
  }

  const payableAmount = service.basePrice - pendingCreditAmount;

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm -C api test -- backfill-historical-receivables' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 2009ms:

> homeservices-api@0.1.0 test C:\Alok\Business Projects\wt-fix-cosmos-pages\api
> vitest run "backfill-historical-receivables"


[1m[7m[36m RUN [39m[27m[22m [36mv2.1.9 [39m[90mC:/Alok/Business Projects/wt-fix-cosmos-pages/api[39m

 [32m✓[39m tests/scripts/backfill-historical-receivables.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 7[2mms[22m[39m

[2m Test Files [22m [1m[32m1 passed[39m[22m[90m (1)[39m
[2m      Tests [22m [1m[32m8 passed[39m[22m[90m (8)[39m
[2m   Start at [22m 07:05:36
[2m   Duration [22m 462ms[2m (transform 86ms, setup 0ms, collect 111ms, tests 7ms, environment 0ms, prepare 152ms)[22m


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm -C api typecheck' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 8593ms:

> homeservices-api@0.1.0 typecheck C:\Alok\Business Projects\wt-fix-cosmos-pages\api
> tsc --noEmit -p tsconfig.tests.json


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Path api/src -Recurse -Filter *.ts | Select-String -Pattern \"recordCommissionDue\\(|settleCashCompletion\\(|resolveCommissionForBooking\" | ForEach-Object { \""'$($_.Path):$($_.LineNumber):$($_.Line.Trim())" }' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 855ms:
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\active-job.ts:157:await settleCashCompletion(updated, { log: (s) => ctx.log(s) });
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:63:await settleCashCompletion(booking, { log: (s) => ctx.log(s) });
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:23:export async function resolveCommissionForBooking(booking: BookingDoc): Promise<{
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:62:export async function recordCommissionDue(booking: BookingDoc): Promise<RecordCommissionDueResult> {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:89:await resolveCommissionForBooking(booking);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:161:export async function settleCashCompletion(
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:165:const r = await recordCommissionDue(booking);

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/trigger-booking-completed.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/functions/active-job.ts -TotalCount 210' in C:\Alok\Business Projects\wt-fix-cosmos-pages
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/services/commission-config.service.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 998ms:
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

 succeeded in 1038ms:
import * as Sentry from '@sentry/node';
import { commissionConfigRepo } from '../cosmos/commission-config-repository.js';
import {
  MIN_COMMISSION_BPS,
  MAX_COMMISSION_BPS,
  toEffectiveConfig,
  type CommissionResolvedFrom,
  type EffectiveCommissionConfig,
} from '../schemas/commission-config.js';

/** Platform default when no commission-config doc exists in Cosmos. */
export const DEFAULT_COMMISSION_BPS = 2200;

/** Cache TTL: 5 minutes. */
const CACHE_TTL_MS = 5 * 60 * 1000;

let _cachedConfig: EffectiveCommissionConfig | null = null;
let _cacheExpiresAt = 0;

/** Reset in-process cache â€” used by tests only. */
export function _resetCommissionConfigCacheForTest(): void {
  _cachedConfig = null;
  _cacheExpiresAt = 0;
}

function isValidBps(x: number | undefined): x is number {
  return x !== undefined && Number.isInteger(x) && x >= MIN_COMMISSION_BPS && x <= MAX_COMMISSION_BPS;
}

/**
 * Pure resolver â€” applies the service > category > global precedence cascade.
 * "valid" = Number.isInteger(x) && 1500 <= x <= 3500.
 * Throws if globalBps is not valid (config is broken at the root).
 */
export function resolveCommissionBps(input: {
  serviceBps?: number;
  categoryBps?: number;
  globalBps: number;
}): { bps: number; from: CommissionResolvedFrom } {
  if (isValidBps(input.serviceBps)) {
    return { bps: input.serviceBps, from: 'SERVICE' };
  }
  if (isValidBps(input.categoryBps)) {
    return { bps: input.categoryBps, from: 'CATEGORY' };
  }
  if (!isValidBps(input.globalBps)) {
    throw new Error('commission config invalid: globalBps out of range');
  }
  return { bps: input.globalBps, from: 'GLOBAL' };
}

/**
 * Returns the fully-resolved commission config (defaults applied for every
 * unset field). Cached in-process with a 5-minute TTL to avoid hammering
 * Cosmos on hot paths. Emits a Sentry warning when no commission-config doc
 * has been written yet (falls back to platform defaults in that case).
 */
export async function getCommissionConfig(): Promise<EffectiveCommissionConfig> {
  const now = Date.now();
  if (_cachedConfig !== null && now < _cacheExpiresAt) {
    return _cachedConfig;
  }

  const doc = await commissionConfigRepo.getCommissionConfig();
  if (!doc) {
    Sentry.captureMessage(
      'commission-config doc missing in Cosmos; falling back to DEFAULT_COMMISSION_BPS',
      'warning',
    );
  }
  const effective = toEffectiveConfig(doc);

  _cachedConfig = effective;
  _cacheExpiresAt = now + CACHE_TTL_MS;

  return effective;
}

/**
 * Returns the platform-wide default commission rate in basis points.
 * Backed by the same 5-minute cache as getCommissionConfig().
 */
export async function getGlobalCommissionBps(): Promise<number> {
  return (await getCommissionConfig()).defaultCommissionBps;
}

 succeeded in 1168ms:
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
});

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path CLAUDE.md -TotalCount 200' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 736ms:
# homeservices-mvp â€” Project-Level CLAUDE.md

**Placeholder name:** `homeservices-mvp` (will be renamed once brand-name is locked in Phase 2)
**Owner:** Alok Tiwari
**Stack:** multi-repo monorepo â€” Kotlin+Compose (2 Android apps) + Next.js (admin) + Node (API)
**Build constraint:** â‚¹0/month operational infra at pilot scale (Firebase + Azure free tiers; FCM as universal messaging spine)

## Repository shape

```
/
â”œâ”€â”€ customer-app/       # Android (Kotlin + Compose) â€” customer-facing
â”œâ”€â”€ technician-app/     # Android (Kotlin + Compose) â€” vendor/partner-facing
â”œâ”€â”€ admin-web/          # Next.js 15 + TypeScript â€” owner dashboard
â”œâ”€â”€ api/                # Node 22 + TypeScript (Fastify/Hono) â€” backend
â”œâ”€â”€ docs/               # Project-level BMAD artifacts (PRD, architecture, ADRs, stories, threat-model, runbook, ux-design, brainstorm)
â”œâ”€â”€ tools/              # Cross-cutting scripts (mdâ†’docx converter, etc.)
â”œâ”€â”€ _bmad/              # BMAD method config + skills scaffolding
â””â”€â”€ _bmad-output/       # BMAD intermediate outputs (planning-artifacts/, implementation-artifacts/)
```

Each sub-project has its own `CLAUDE.md` with stack-specific rules. **This root file governs cross-cutting concerns only.**

## Production deployment ownership

- **Admin web canonical production frontend:** Azure Container Apps resource `aca-admin-homeservices-prod` in `rg-homeservices-prod`.
- **Canonical admin URL:** `https://aca-admin-homeservices-prod.icybush-b2e9c876.centralindia.azurecontainerapps.io`.
- **Canonical admin image registry:** GHCR image `ghcr.io/aloktiwarigit/urbanclap-dup-admin-web:<tag>`, updated on the ACA resource.
- **Admin API production backend:** Azure Functions resource `func-homeservices-prod`; admin-web must call it through same-origin `/admin-api/*` unless a task explicitly says otherwise.
- **Do not use Azure Static Web Apps for production admin validation or access.** Any `swa-homeservices-admin-prod`, `black-river-*.azurestaticapps.net`, or `.github/workflows/admin-ship.yml` references are legacy unless the user explicitly approves a new cutover.
- If admin deployment instructions conflict, ACA wins. Update the conflicting doc before proceeding.
- **Admin-web deploy runbook:** use `admin-web/CLAUDE.md` -> "Production deployment" for the exact Docker/GHCR/ACA PowerShell sequence and smoke checks. Do not deploy admin-web from `.github/workflows/admin-ship.yml`; that workflow is legacy SWA-oriented.

## Phase gate (enforced across all sub-projects)

**No `src/` or `app/src/` edits in any sub-project** until ALL of the following exist and are committed:

- `docs/prd.md` (BMAD Phase 2)
- `docs/ux-design.md` (BMAD Phase 3)
- `docs/architecture.md` (BMAD Phase 4)
- `docs/adr/0001-*.md` + subsequent ADRs (initial stack decisions)
- `docs/stories/` â€” at least one story file per sub-project
- `docs/threat-model.md` (STRIDE, Phase 4.5)
- `docs/runbook.md` (Phase 4.5)
- `.bmad-readiness-passed` marker

Per-sub-project hooks in `.claude/settings.json` enforce this. Root also enforces it.

## Model routing (within Claude Max)

**Mandatory self-selection rules live in `~/.claude/CLAUDE.md` â†’ "Model routing â€¦ MANDATORY self-selection".** Every session announces its tier on turn 1 and offers a downgrade prompt when the task fits Sonnet/Haiku. Do not silently stay on Opus.

Project-specific trigger map (overrides the generic tiers only where noted):

- **Opus 4.7 (1M ctx)** â€” BMAD Phase 2 (PRD), Phase 4 (architecture + cross-cutting ADRs), Phase 4.5 adversarial review, Codex review synthesis, plans for high-blast-radius stories (auth, payments, dispatch, Cosmos schema changes)
- **Sonnet 4.6 (default)** â€” per-story implementation, TDD cycles, BMAD Phase 3 (UX), 4.5 stub-filling, Phase 5 (epics/stories â€” parallel per epic), routine debugging
- **Haiku 4.5** â€” codemod fanouts: renames, mechanical refactors, lint-fix passes, doc-index updates, Paparazzi golden re-records driven by a mechanical rule

Dispatch subagents in parallel whenever tasks are independent (e.g. 3 epics being decomposed into stories simultaneously). Subagents inherit the parent's model unless the dispatch explicitly picks a cheaper tier â€” prefer `model: "sonnet"` or `"haiku"` on the Agent call when the subtask is mechanical.

## Per-story execution (mandatory flow)

### Story ceremony tiers â€” scale effort to blast radius

Before invoking any planning skill, classify the story into one of three tiers.

| Tier | When | Ceremony | Target wall-clock |
|---|---|---|---|
| **Foundation** | E01-* stories, migrations, architectural refactors, new module introductions, auth/security-sensitive work | Brainstorm â†’ plan (4-6 work streams, parallel agent dispatch) â†’ execute â†’ smoke gate â†’ Codex + /security-review (parallel) + CI | 3.5â€“4.5h |
| **Feature** | E02+ user-facing stories, new screens, endpoints built on existing foundation | Plan (brainstorm embedded, â‰¤800 lines) â†’ execute (same session, default) â†’ smoke gate â†’ Codex + CI | 1.5â€“2.5h |
| **Codemod / mechanical** | Renames, lint sweeps, doc-index updates, libs sync | No brainstorm, no plan doc. One-shot Haiku execution. | 30â€“45min |

**TDD + smoke gate + Codex + CI are non-negotiable across ALL tiers.**

### Work-stream structure (Foundation + Feature plans)

Plans use work streams instead of micro-tasks. Streams run in dependency order; independent streams dispatch as parallel agents.

```
WS-A: Domain models + data layer
      [customer-app or technician-app: sealed classes, SessionManager, Room/Prefs, ProGuard rules]
      Runs first. WS-B depends on WS-A types.

WS-B: Use cases + orchestrator  (parallel per use case â€” each is independent)
      [TruecallerUseCase, FirebaseOtpUseCase, BiometricGateUseCase, etc. â€” fan out to subagents]
      TDD: test file first, then implementation. Runs after WS-A models are committed.

WS-C: Hilt DI module + security gates  (parallel with WS-D after WS-B)
      [AuthModule, @Binds/@Provides, ProGuard keep rules, AndroidManifest entries]
      Runs parallel with WS-D.

WS-D: Compose UI + ViewModel + Navigation + Paparazzi  (parallel with WS-C)
      [ViewModel â†’ Screen â†’ AppNavigation â†’ MainActivity integration â†’ Paparazzi test stubs]
      Runs parallel with WS-C. Paparazzi goldens recorded on CI only (see docs/patterns/paparazzi-cross-os-goldens.md).

WS-E: Pre-Codex smoke gate â†’ review
      bash tools/pre-codex-smoke.sh <customer-app|technician-app>
      Runs after WS-B/C/D complete. Non-zero exit = stop and fix before Codex.
      Then: codex review --base main AND /security-review (auth/payment/dispatch stories) simultaneously.
```

For API (`api/`) stories: WS-A = Cosmos schema + Zod types, WS-B = repo + service + controller, WS-C = Semgrep rules + auth middleware, WS-D = (skip), WS-E = `bash tools/pre-codex-smoke-api.sh`.
For web (`admin-web/`) stories: WS-A = API types, WS-B = Next.js API routes, WS-C = auth guards, WS-D = React components + Storybook, WS-E = `bash tools/pre-codex-smoke-web.sh`.

### Story size gate (mandatory at plan-write time)

After drafting a plan, check its line count before committing:

```bash
wc -l plans/E##-S##*.md
# Feature tier: >500 lines â†’ warning; >800 lines â†’ split required
# Foundation tier: >1200 lines â†’ warning; >1500 lines â†’ split required
```

**Split rule:** If any 3 of the following are true, split by layer:
- New files > 20
- All 4 Android layers touched (domain + data + UI + nav)
- â‰¥2 external SDK integrations
- â‰¥10 test files required

**Split pattern:** Story A = WS-A + WS-B (domain + data); Story B = WS-C + WS-D (DI + UI), depends on A.

### Foundation-tier flow

For each foundation-tier story in `docs/stories/`:

1. Fresh session â†’ `/superpowers:brainstorming` (explore design before code)
2. `/superpowers:writing-plans` â†’ commit `plans/<story-id>.md` using work-stream structure above. Auth/RLS/money/crypto: fresh session for context quarantine; all other Foundation stories: same session permitted.
3. `/superpowers:executing-plans` â†’ dispatch parallel agents per work stream using `superpowers:dispatching-parallel-agents`. Fan out WS-B use cases to separate Sonnet subagents (each owns one use case + its test file).
4. TDD per work stream: test file committed before implementation file. Work-stream TDD completion IS verification â€” no separate verify step.
5. **Pre-Codex smoke gate (mandatory):**
   ```bash
   bash tools/pre-codex-smoke.sh <customer-app|technician-app>
   # Non-zero exit = stop and fix before invoking /codex-review-gate
   ```
6. **Review gate â€” local only (no CI ceremony):**
   - `codex review --base main` â†’ `.codex-review-passed` (local, before push)
   - `/security-review` (auth/payment/dispatch/PII trigger) â€” local, parallel with Codex
   - Drop `/code-review`, `/bmad-code-review`, `/superpowers:requesting-code-review` â€” echo-chamber
7. `git push` â†’ PR auto-merges on CI green (no approval gate â€” solo project).
   **CI is lint + tests + Semgrep only.** BMAD gate and Codex marker check removed from CI â€” enforced locally.

### Feature-tier flow (lean)

1. `/superpowers:writing-plans` (brainstorm embedded; plan â‰¤800 lines; reference `docs/patterns/` for known gotchas)
2. `/superpowers:executing-plans` in same session. Fan out independent use cases as subagents if â‰¥3.
3. Pre-Codex smoke gate (same script as Foundation).
4. Codex review â†’ CI. `/security-review` only on auth/payment trigger.

### Android story invariants (all tiers)

- **libs.versions.toml sync:** First task of every `technician-app` story = copy `customer-app/gradle/libs.versions.toml` to `technician-app/gradle/libs.versions.toml`. Prevents post-Codex drift.
- **Paparazzi goldens:** Never record on Windows. Delete before push; trigger `paparazzi-record.yml` workflow_dispatch on CI. See `docs/patterns/paparazzi-cross-os-goldens.md`.
- **Known gotchas:** Every Android plan's opening section cites the relevant `docs/patterns/` files for Firebase, Hilt, Paparazzi, and explicit-API traps.

### Pattern library

`docs/patterns/` contains hard-won solutions from previous stories. Read before writing any plan that touches these areas:

| Pattern file | Read before... |
|---|---|
| `paparazzi-cross-os-goldens.md` | Any story adding or changing Compose screens |
| `firebase-callbackflow-lifecycle.md` | Any story with Firebase Auth, FCM, or async SDK callbacks |
| `firebase-errorcode-mapping.md` | Any story handling Firebase or payment error codes |
| `hilt-module-android-test-scope.md` | Any story introducing new Hilt-injected classes |
| `kotlin-explicit-api-public-modifier.md` | Any story adding new public Kotlin files |

## Zero-cost infra (the binding architectural constraint)

Every architectural decision across all sub-projects must preserve â‚¹0/month operational cost at pilot scale (â‰¤5,000 bookings/mo). See `docs/architecture.md` for the service-by-service free-tier budget.

Summary of the â‚¹0 stack:

| Concern | Service | Free tier ceiling |
|---|---|---|
| Backend compute | Azure Functions (Consumption) | 1M execs + 400k GB-sec/mo |
| Database | Azure Cosmos DB (Serverless) | 1000 RU/s + 25 GB forever |
| Messaging / real-time | FCM (Firebase Cloud Messaging) | Unlimited forever |
| Auth | Firebase Phone Auth + Truecaller SDK + Google Sign-In | <100 SMS/mo at steady state |
| Photo storage | Firebase Storage | 5 GB + 1 GB/day download |
| Web admin hosting | Azure Container Apps (Consumption) + GHCR | Keep min replicas 0 / max replicas 1 for pilot cost control |
| Maps | Google Maps Platform | $200/mo recurring credit |
| Payments | Razorpay | â‚¹0 onboarding (2% of GMV txn fee) |
| KYC | DigiLocker (Govt of India) | Free Aadhaar consent |
| Email | Azure Communication Services | 100 emails/day |
| Analytics | PostHog Cloud | 1M events/mo |
| Errors | Sentry | 5k errors/mo |
| ML | Azure ML | 8 hrs/mo compute |
| CI | GitHub Actions | 2000 mins/mo |

**Any PR that introduces a paid SaaS dependency must create an ADR and get explicit user approval.**

## Enterprise floor (ships with every template)

Every sub-project's template includes:

- `.github/workflows/ship.yml` â€” type-check, lint, tests â‰¥80% coverage, Semgrep, axe-core (web), Lighthouse CI (web), Codex review marker check, BMAD artifact gate
- Sentry + OpenTelemetry instrumentation
- GrowthBook OSS feature flags
- Storybook (web) / Paparazzi (Android) screenshot tests

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Path api/CLAUDE.md -TotalCount 220' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 529ms:
# Client Project - Enterprise Baseline (Node API)

## Phase Gate

Same as sibling templates. `src/` gated until BMAD artifacts exist.

## Stack

- Node 22 LTS + TypeScript `strict: true`
- Fastify or Hono for HTTP; Zod for validation
- Sentry Node SDK + OpenTelemetry auto-instrumentation
- GrowthBook Node SDK (OSS)
- PostHog Node SDK
- Prisma or Drizzle (per ADR)
- Vitest, Supertest, and Testcontainers
- Semgrep SAST and dependency audit

## CI

- Typecheck, ESLint with 0 warnings, and Vitest
- Integration tests against Testcontainers where applicable
- Semgrep with OWASP, TypeScript, Node.js, secrets, and `api/.semgrep.yml`
- OpenAPI spec build and lint
- API deployment is handled by `.github/workflows/api-ship.yml`

## Deployment - Azure Functions (func-homeservices-prod, centralindia)

Last known good production deployment:
- Commit: `8555ae3a`
- GitHub Actions run: `25203003001`
- Date: 2026-05-01
- Result: Oryx remote build succeeded, `/api/v1/health` returned `status=ok`, and the runtime admin endpoint showed 82 indexed functions.

### Canonical Deploy Path

Use `.github/workflows/api-ship.yml`. Do not hand-build a zip from Windows and do not use `Azure/functions-action@v1`.

Deploy is automatic on push to `main` when `api/**` or `.github/workflows/api-ship.yml` changes. Manual deploy:

```bash
gh workflow run api-ship.yml --ref main
gh run list --workflow api-ship.yml --limit 5
gh run watch <run-id> --exit-status
```

The deploy job must:

1. Run on `ubuntu-latest`.
2. Install and build from `api/` with Node 22.
3. Authenticate with `az login --service-principal`, not `azure/login@v2`.
4. Delete stale `WEBSITE_RUN_FROM_PACKAGE` before publish.
5. Enable Oryx remote build on the function app.
6. Publish with `func azure functionapp publish "$AZURE_FUNCTIONAPP_NAME" --javascript --build remote --verbose`.
7. List indexed functions after publish.
8. Poll `https://func-homeservices-prod.azurewebsites.net/api/v1/health`.
9. Require the health payload commit to match `${GITHUB_SHA:0:8}` so an old deployment cannot pass.

### Required Oryx App Settings

These settings are not optional. They prevent the exact failures seen on 2026-05-01.

```bash
az functionapp config appsettings delete \
  --name func-homeservices-prod \
  --resource-group rg-homeservices-prod \
  --setting-names WEBSITE_RUN_FROM_PACKAGE \
  --output none || true

az functionapp config appsettings set \
  --name func-homeservices-prod \
  --resource-group rg-homeservices-prod \
  --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    ENABLE_ORYX_BUILD=true \
    NPM_CONFIG_INCLUDE=dev \
    NPM_CONFIG_PRODUCTION=false \
    NODE_ENV=production \
    GIT_SHA="$GITHUB_SHA" \
    AzureWebJobsFeatureFlags=EnableWorkerIndexing \
  --output none
```

Why `NPM_CONFIG_INCLUDE=dev` matters: Oryx runs `npm install` and then `npm run build`. Without dev dependencies, `typescript` is missing and the remote build fails with `sh: 1: tsc: not found`.

Why delete `WEBSITE_RUN_FROM_PACKAGE`: a stale blob URL can override newly published content and keep serving an old or empty app.

### Required Ignore Rules

`api/.funcignore` must keep the Oryx upload source-build friendly:

```text
node_modules/
.pnpm-store/
local.settings.json
tests/
coverage/
docs/
specs/
plans/
```

Do not exclude `src/`, `dist/`, `host.json`, `package.json`, `pnpm-lock.yaml`, or `tsconfig*.json`.

### GitHub Secrets Required

The workflow expects these repository secrets:

```text
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
```

If the service-principal secret fails with `AADSTS7000215`, regenerate it with Azure CLI and paste the raw secret value into GitHub Secrets. Avoid PowerShell commands that capture warning text into the secret.

### Cosmos DB Pre-Provisioning

These lease containers must exist before the function app starts. Cosmos Serverless cannot auto-create these leases with provisioned throughput from the trigger extension.

```text
booking_completed_leases       partition key: /id
booking_rating_prompt_leases   partition key: /id
booking_report_leases          partition key: /id
```

These app settings must also exist for the Cosmos extension bundle used in production:

```text
COSMOS_CONNECTION_STRING
COSMOS_CONNECTION_STRING__accountEndpoint
COSMOS_CONNECTION_STRING__accountKey
COSMOS_DATABASE
```

### Verification Commands

Health:

```bash
curl https://func-homeservices-prod.azurewebsites.net/api/v1/health
```

Expected shape:

```json
{"status":"ok","version":"0.1.0","commit":"<first-8-of-git-sha>"}
```

List indexed functions from Azure:

```bash
az functionapp function list \
  --name func-homeservices-prod \
  --resource-group rg-homeservices-prod \
  --query "[].name" \
  -o tsv
```

Runtime admin verification when function list is suspicious:

```powershell
$key = az functionapp keys list --name func-homeservices-prod --resource-group rg-homeservices-prod --query masterKey -o tsv
$headers = @{ 'x-functions-key' = $key }
$functions = Invoke-RestMethod -Uri "https://func-homeservices-prod.azurewebsites.net/admin/functions" -Headers $headers
@($functions).Count
```

### Known Bad Paths

| Approach | Failure mode |
|---|---|
| Local `func publish` from Windows | Uploads Windows-built `node_modules`; Linux Azure can crash or load zero functions. |
| `func publish --no-build` | Depends on locally built artifacts and local module ABI. |
| Manual blob zip with `WEBSITE_RUN_FROM_PACKAGE` | Easy to leave a stale package mounted; caused health 404 after trigger sync. |
| `Azure/functions-action@v1` with publish profile | Kudu/SCM is unreliable or unreachable on Linux Consumption. |
| `azure/login@v2` in this repo | Previously fell into OIDC or malformed creds issues. Use direct `az login --service-principal`. |
| Oryx without `NPM_CONFIG_INCLUDE=dev` | Remote build fails with `tsc: not found`. |
| Continuing after failed Oryx publish without checking logs | Health will stay 404 because no new build was deployed. |

### Debugging Failed Future Deploys

1. Read the deploy step logs first:
   ```bash
   gh run view <run-id> --log-failed
   gh run view <run-id> --job <deploy-job-id> --log
   ```
2. Search for `Remote build failed`, `tsc: not found`, `Deployment successful`, `Syncing triggers`, and `Functions in func-homeservices-prod`.
3. If health is 404, check whether Oryx actually reached `Deployment successful`.
4. If Oryx succeeded but functions are empty, inspect `/admin/functions` with the master key and then Azure Portal Log stream.
5. If functions are indexed but health is old or 404, check `WEBSITE_RUN_FROM_PACKAGE`, `GIT_SHA`, and the health route commit.

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm -C api lint' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 11794ms:

> homeservices-api@0.1.0 lint C:\Alok\Business Projects\wt-fix-cosmos-pages\api
> eslint . --max-warnings 0


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem api/src -Recurse -Filter *.ts | Select-String -Pattern "finalAmount|feesWaived|amount:" | ForEach-Object { "$($_.Path):$($_.LineNumber):$($_.Line.Trim())" } | Select-Object -First 200' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 653ms:
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:32:amount: number,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\booking-repository.ts:230:finalAmount: (existing.finalAmount ?? existing.amount) + approved.reduce((s, a) => s + a.price, 0),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-receivable-repository.ts:35:bookingAmount: input.bookingAmount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-receivable-repository.ts:42:? { cashCollectedAmount: input.cashCollectedAmount }
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\customer-credit-ledger-repository.ts:21:*     { id: bookingId, customerId, bookingId, amount: <paise>, reason: 'NO_SHOW', createdAt }
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:9:amount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:11:finalAmount?: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:52:db.container('wallet_ledger').items.query<{ bookingId: string; commissionAmount: number; payoutStatus: string }>({
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:76:return b.finalAmount ?? b.amount;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:92:amount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:98:amount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:111:query: `SELECT c.id, c.technicianId, c.technicianName, c.amount, c.finalAmount, c.completedAt
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\orders-repository.ts:104:amount: asNumber(raw['finalAmount']) ?? asNumber(raw['amount']) ?? 0,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\wallet-ledger-repository.ts:19:bookingAmount: input.bookingAmount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\wallet-ledger-repository.ts:22:commissionAmount: input.commissionAmount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\wallet-ledger-repository.ts:23:techAmount: input.techAmount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\wallet-ledger-repository.ts:27:...(input.payoutFeeAmount !== undefined ? { payoutFeeAmount: input.payoutFeeAmount } : {}),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\active-job.ts:41:collectedAmount: z.number().int().nonnegative().optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\active-job.ts:132:? { cashCollectedAmount: body.collectedAmount }
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\active-job.ts:165:collectedAmount: body.collectedAmount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:134:bookingAmount: number,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:314:amount: service.basePrice,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:350:amount: service.basePrice,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:353:appliedCreditAmount: 0,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:474:amount: service.basePrice,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:540:amount: payableAmount > 0 ? payableAmount : service.basePrice,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:593:appliedCreditAmount: 0,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:603:amount: order.amount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:607:appliedCreditAmount: 0,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:661:amount: booking.amount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:662:finalAmount: booking.finalAmount ?? null,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:696:amount: booking.finalAmount ?? booking.amount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:749:...(anyApproved && updated.finalAmount !== undefined
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:750:? { priceApprovedPaise: updated.finalAmount }
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\bookings.ts:758:return { status: 200, jsonBody: { bookingId: updated.id, status: updated.status, finalAmount: updated.finalAmount } };
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\technician-bookings.ts:67:const amount = safeAmount(booking.finalAmount, safeAmount(booking.amount, 0));
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\technician-dashboard.ts:116:// This previously summed `finalAmount ?? amount` for bookings with
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:53:const bookingAmount = booking.finalAmount ?? booking.amount;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:105:const { commissionBps, commissionAmount, techAmount: techAmountBeforeFee } = calculateCommission(
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:176:amount: techAmount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-next-day-payout.ts:60:amount: techAmount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-no-show-detector.ts:77:amount: NO_SHOW_CREDIT_PAISE,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-no-show-detector.ts:90:void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', action: 'NO_SHOW_CREDIT_ISSUED', resourceType: 'booking', resourceId: booking.id, payload: { bookingId: booking.id, creditAmount: NO_SHOW_CREDIT_PAISE }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-reconcile-payouts.ts:66:amount: entry.techAmount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-reconcile-payouts.ts:87:techAmount: entry.techAmount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\compliance\ssc-levy.ts:161:amount: levy.levyAmount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\compliance\ssc-levy.ts:197:{ quarter: levy.quarter, levyAmount: levy.levyAmount, razorpayTransferId: transferId },
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\dashboard\feed.ts:56:amount: asNumber(raw['finalAmount']) ?? asNumber(raw['amount']) ?? 0,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\dashboard\feed.ts:73:query: `SELECT TOP ${FEED_LIMIT} c.id, c.status, c.customerId, c.technicianId, c.serviceId, c.amount, c.finalAmount, c.createdAt, c.slotDate, c.slotWindow, c.addressText FROM c ORDER BY c.createdAt DESC`,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\dashboard\summary.ts:60:'SELECT VALUE SUM(IIF(IS_DEFINED(c.finalAmount), c.finalAmount, c.amount)) FROM c WHERE c.slotDate = @todayDate OR c.createdAt >= @todayStart',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\finance\approve-payouts.ts:84:amount: entry.netPayable,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\finance\approve-payouts.ts:90:amount: entry.netPayable,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\orders\overrides.ts:172:const updated = await updateBookingFields(id, { feesWaived: true });
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:42:/** E21-S01: Actual cash amount (paise) the technician confirmed collecting. May differ from finalAmount. */
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:43:cashCollectedAmount: z.number().int().nonnegative().optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:50:amount: z.number().int().positive(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:54:feesWaived: z.boolean().optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:60:finalAmount: z.number().int().positive().optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:126:amount: z.number().int().positive(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\booking.ts:127:finalAmount: z.number().int().positive().nullable(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:45:bookingAmount: z.number().int().positive(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:46:cashCollectedAmount: z.number().int().nonnegative().optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:51:remittedAmount: z.number().int().nonnegative().optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:72:bookingAmount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:104:remittedAmount: z.number().int().positive(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:124:bookingAmount: z.number().int().nonnegative(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:160:bookingAmount: z.number().int().nonnegative(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:161:cashCollectedAmount: z.number().int().nonnegative().optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:163:remittedAmount: z.number().int().nonnegative(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\customer-credit.ts:7:amount: z.number().int().positive(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\dashboard.ts:15:amount: z.number().int().nonnegative(), // paise
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\order.ts:32:amount: z.number().nonnegative(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\order.ts:35:feesWaived: z.boolean().optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\order.ts:51:minAmount: z.coerce.number().optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\order.ts:52:maxAmount: z.coerce.number().optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\report.ts:11:baseAmount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\report.ts:13:finalAmount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\ssc-levy.ts:15:levyAmount: z.number().int().nonnegative(),  // paise
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\wallet-ledger.ts:14:bookingAmount: z.number().int().positive(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\wallet-ledger.ts:17:commissionAmount: z.number().int().nonnegative(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\wallet-ledger.ts:18:techAmount: z.number().int().positive(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\wallet-ledger.ts:25:payoutFeeAmount: z.number().int().nonnegative().optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\wallet-ledger.ts:34:bookingAmount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\wallet-ledger.ts:37:commissionAmount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\wallet-ledger.ts:38:techAmount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\webhook.ts:17:*         amount: number,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:24:bookingAmount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:30:const bookingAmount = booking.finalAmount ?? booking.amount;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:76:const bookingAmount = booking.finalAmount ?? booking.amount;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:101:? { cashCollectedAmount: booking.cashCollectedAmount }
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:169:const bookingAmount = booking.finalAmount ?? booking.amount;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-view.service.ts:44:bookingAmount: r.bookingAmount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-view.service.ts:45:...(r.cashCollectedAmount !== undefined ? { cashCollectedAmount: r.cashCollectedAmount } : {}),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-view.service.ts:47:remittedAmount: r.remittedAmount ?? 0,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission.service.ts:3:commissionAmount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission.service.ts:4:techAmount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\dataExport.service.ts:58:amount: b['amount'],
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\dataExport.service.ts:59:finalAmount: b['finalAmount'],
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\dataExport.service.ts:172:bookingAmount: l.bookingAmount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\dataExport.service.ts:173:commissionAmount: l.commissionAmount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\dataExport.service.ts:174:techAmount: l.techAmount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\dispatcher.service.ts:124:amount: String(booking.amount),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\earnings.service.ts:9:*   - `GET /v1/technicians/me/dashboard` summed `finalAmount ?? amount` for
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\fcm.service.ts:126:creditAmount: number,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\fcm.service.ts:131:creditAmount: String(creditAmount),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\fcm.service.ts:180:...(payload.techAmount !== undefined ? { techAmount: String(payload.techAmount) } : {}),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\pdf-generator.service.ts:34:doc.font('Helvetica-Bold').text(`Total: ${paise(report.priceBreakdown.finalAmount)}`);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\razorpay.service.ts:17:amount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\razorpay.service.ts:23:return { id: order.id, amount: order.amount, currency: order.currency };
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\razorpay.service.ts:42:amount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\razorpay.service.ts:53:amount: opts.amount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\razorpayRoute.service.ts:5:amount: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\razorpayRoute.service.ts:34:{ account: input.accountId, amount: input.amount, currency: 'INR', on_hold: 0, notes: input.notes },
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\report-data.service.ts:47:baseAmount: booking.amount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\report-data.service.ts:49:finalAmount: booking.finalAmount ?? booking.amount,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\ssc-levy.service.ts:64:levyAmount: String(levy.levyAmount),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\ssc-levy.service.ts:87:`Levy amount: ₹${(levy.levyAmount / 100).toFixed(2)}`,

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/cosmos/booking-repository.ts -TotalCount 280 | Select-Object -Skip 190' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 560ms:
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

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/tsconfig.json; Get-Content api/tsconfig.tests.json' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 523ms:
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
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "rootDir": ".",
    "types": ["node"]
  },
  "include": ["src/**/*", "tests/**/*"]
}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
import { fileURLToPath } from 'node:url';
console.log(fileURLToPath(import.meta.url));
console.log(process.argv);
'@ | Set-Content -Path api/tmp-argv-check.ts; pnpm -C api exec tsx tmp-argv-check.ts; Remove-Item -LiteralPath api/tmp-argv-check.ts" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 1427ms:
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\tmp-argv-check.ts
[
  'C:\\Program Files\\nodejs\\node.exe',
  'C:\\Alok\\Business Projects\\wt-fix-cosmos-pages\\api\\tmp-argv-check.ts'
]

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'pnpm -C api test' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 26377ms:

> homeservices-api@0.1.0 test C:\Alok\Business Projects\wt-fix-cosmos-pages\api
> vitest run


[1m[7m[36m RUN [39m[27m[22m [36mv2.1.9 [39m[90mC:/Alok/Business Projects/wt-fix-cosmos-pages/api[39m

 [32m✓[39m tests/unit/cosmos/customer-credit-ledger-repository.test.ts [2m([22m[2m18 tests[22m[2m)[22m[90m 69[2mms[22m[39m
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

 [32m✓[39m tests/cosmos/technician-repository.test.ts [2m([22m[2m52 tests[22m[2m)[22m[90m 21[2mms[22m[39m
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
[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mupsertAction[2m > [22m[2mcreates a new action when it does not exist
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":0,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"create","ts":"2026-09-07T11:07:00.889Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mupsertAction[2m > [22m[2mis idempotent: duplicate change-feed event does NOT bump version
[22m[39m{"event":"pending_action_stale_drop","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","existing_version":3,"incoming_version":3,"ts":"2026-09-07T11:07:00.890Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mupsertAction[2m > [22m[2mbumps version when payload changes (real mutation)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T11:07:00.891Z"}

 [32m✓[39m tests/cosmos/commission-receivable-repository.test.ts [2m([22m[2m27 tests[22m[2m)[22m[90m 14[2mms[22m[39m
[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mupsertAction[2m > [22m[2mretries on 412 ETag conflict (max 3 attempts)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":3,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T11:07:01.070Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mresolveAction[2m > [22m[2msets status=RESOLVED and bumps version
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":3,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"transition_to_resolved","ts":"2026-09-07T11:07:01.278Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mexpireAction[2m > [22m[2msets status=EXPIRED and bumps version
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"transition_to_expired","ts":"2026-09-07T11:07:01.279Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mstale-state cleanup[2m > [22m[2mresolves ADDON_APPROVAL_REQUESTED when booking transitions to PAID
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:customer-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"transition_to_resolved","ts":"2026-09-07T11:07:01.282Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mFCM strict ordering[2m > [22m[2memitFcmForAction succeeds and resolves without throwing
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:07:01.286Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":2,"ts":"2026-09-07T11:07:01.288Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mFCM strict ordering[2m > [22m[2memitFcmForAction with technician role also resolves
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:07:01.290Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":2,"ts":"2026-09-07T11:07:01.292Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mFCM strict ordering[2m > [22m[2memitFcmForAction swallows Error thrown by FCM send (err instanceof Error branch)
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:07:01.292Z"}
{"event":"fcm_send_failure","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","error_code":"FCM_QUOTA_EXCEEDED","ts":"2026-09-07T11:07:01.292Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mFCM strict ordering[2m > [22m[2memitFcmForAction swallows non-Error thrown by FCM send (String(err) branch)
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:07:01.293Z"}
{"event":"fcm_send_failure","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","error_code":"network-timeout","ts":"2026-09-07T11:07:01.293Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mFCM strict ordering[2m > [22m[2memitFcmForAction omits payload key in FCM data when doc.payload is undefined
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:07:01.294Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T11:07:01.294Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2misSemanticNoOp — early-exit branches[2m > [22m[2mis NOT a no-op when existing status is RESOLVED (status !== ACTIVE branch)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T11:07:01.294Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2misSemanticNoOp — early-exit branches[2m > [22m[2mis NOT a no-op when type changes (type !== input.type branch)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":3,"action_type":"RATING_PROMPT_CUSTOMER","projector_source":"update","ts":"2026-09-07T11:07:01.295Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2misSemanticNoOp — early-exit branches[2m > [22m[2mis NOT a no-op when expiresAt changes (expiresAt !== input.expiresAt branch)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T11:07:01.296Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2misSemanticNoOp — early-exit branches[2m > [22m[2mis NOT a no-op when priority changes (priority !== input.priority branch)
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T11:07:01.296Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2misSemanticNoOp — early-exit branches[2m > [22m[2mtreats missing payload on both sides as equal (payload ?? {} branch)
[22m[39m{"event":"pending_action_stale_drop","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","existing_version":2,"incoming_version":2,"ts":"2026-09-07T11:07:01.296Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP2-5: upsertAction reactivates RESOLVED/EXPIRED actions[2m > [22m[2msets status=ACTIVE when upserting into an existing RESOLVED action
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":4,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T11:07:01.298Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP2-5: upsertAction reactivates RESOLVED/EXPIRED actions[2m > [22m[2msets status=ACTIVE when upserting into an existing EXPIRED action
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":3,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"update","ts":"2026-09-07T11:07:01.298Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP1-3: emitFcmForAction includes legacy-client compat fields[2m > [22m[2mincludes bookingId top-level for ADDON_APPROVAL_REQUESTED
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:07:01.299Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T11:07:01.299Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP1-3: emitFcmForAction includes legacy-client compat fields[2m > [22m[2mincludes bookingId top-level for RATING_PROMPT_CUSTOMER
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:07:01.302Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T11:07:01.302Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP1-3: emitFcmForAction includes legacy-client compat fields[2m > [22m[2mincludes overall top-level (as string) for RATING_RECEIVED
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:07:01.303Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T11:07:01.303Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP1-3: emitFcmForAction includes legacy-client compat fields[2m > [22m[2mdoes NOT add bookingId for action types that do not need it
[22m[39m{"event":"fcm_send_attempt","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","target_user_id":"user-1","ts":"2026-09-07T11:07:01.303Z"}
{"event":"fcm_send_success","action_id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","ms_elapsed":0,"ts":"2026-09-07T11:07:01.303Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2mP1-3: emitFcmForAction includes legacy-client compat fields[2m > [22m[2msame change-feed event delivered twice → no version bump
[22m[39m{"event":"pending_action_stale_drop","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","existing_version":1,"incoming_version":1,"ts":"2026-09-07T11:07:01.304Z"}

[90mstdout[2m | tests/unit/pending-action-projector.test.ts[2m > [22m[2m_transitionStatus — ETag fallback and retry exhaustion[2m > [22m[2mfalls back to empty etag string when _etag is undefined on resolveAction
[22m[39m{"event":"pending_action_upsert","id":"ADDON_APPROVAL_REQUESTED:user-1:booking-1","version":2,"action_type":"ADDON_APPROVAL_REQUESTED","projector_source":"transition_to_resolved","ts":"2026-09-07T11:07:01.305Z"}

 [32m✓[39m tests/functions/active-job.test.ts [2m([22m[2m20 tests[22m[2m)[22m[33m 582[2mms[22m[39m
 [32m✓[39m tests/unit/pending-action-projector.test.ts [2m([22m[2m30 tests[22m[2m)[22m[33m 754[2mms[22m[39m
 [32m✓[39m tests/webhooks/razorpay-webhook.test.ts [2m([22m[2m16 tests[22m[2m)[22m[90m 17[2mms[22m[39m
 [32m✓[39m tests/services/commission-view.service.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/services/commission-allocator.apply.test.ts [2m([22m[2m17 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/functions/active-job-location.test.ts [2m([22m[2m11 tests[22m[2m)[22m[33m 451[2mms[22m[39m
   [33m[2m✓[22m[39m POST /v1/technicians/active-job/:bookingId/location[2m > [22mreturns 401 for missing/invalid JWT [33m385[2mms[22m[39m
 [32m✓[39m tests/functions/admin/complaints/patch.test.ts [2m([22m[2m17 tests[22m[2m)[22m[90m 12[2mms[22m[39m
 [32m✓[39m tests/services/commission-settlement.service.test.ts [2m([22m[2m28 tests[22m[2m)[22m[90m 14[2mms[22m[39m
 [32m✓[39m tests/services/commission-hold.service.test.ts [2m([22m[2m27 tests[22m[2m)[22m[90m 10[2mms[22m[39m
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
  bookingId: [32m'5387e188-b417-480b-a269-829ed1e5678b'[39m
}

[90mstdout[2m | tests/bookings/create-apply-credit.test.ts[2m > [22m[2mPOST /v1/bookings — P1-2 reserve-before-Razorpay (partial credit path)[2m > [22m[2mP1-2d: reserveCredit NOT called when pendingCreditAmount is 0
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m26.79[39m,
  lng: [33m82.19[39m,
  inside: [33mtrue[39m,
  mode: [32m'warn-only'[39m
}

 [32m✓[39m tests/bookings/create-apply-credit.test.ts [2m([22m[2m19 tests[22m[2m)[22m[90m 29[2mms[22m[39m
 [32m✓[39m tests/kyc/submit-pan-ocr.test.ts [2m([22m[2m10 tests[22m[2m)[22m[33m 304[2mms[22m[39m
 [32m✓[39m tests/cosmos/audit-log-immutability.test.ts [2m([22m[2m40 tests[22m[2m)[22m[90m 102[2mms[22m[39m
 [32m✓[39m tests/catalogue-admin.test.ts [2m([22m[2m21 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-no-show-detector.test.ts [2m([22m[2m19 tests[22m[2m)[22m[90m 23[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/commission-remittances.test.ts [2m([22m[2m17 tests[22m[2m)[22m[90m 20[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/commission-receivables.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 19[2mms[22m[39m
 [32m✓[39m tests/cosmos/device-token-repository.test.ts [2m([22m[2m19 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/commission-hold-override.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 22[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-etag.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-projectors.test.ts [2m([22m[2m38 tests[22m[2m)[22m[90m 16[2mms[22m[39m
 [32m✓[39m tests/functions/admin/compliance/ssc-levy.test.ts [2m([22m[2m20 tests[22m[2m)[22m[90m 21[2mms[22m[39m
 [32m✓[39m tests/cosmos/orders-repository.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/cosmos/finance-repository.test.ts [2m([22m[2m14 tests[22m[2m)[22m[90m 9[2mms[22m[39m
[90mstdout[2m | tests/functions/admin/orders/overrides.test.ts[2m > [22m[2mrefundOrderHandler[2m > [22m[2mreturns 202 with REFUND_INITIATED on happy path (stub)
[22m[39mREFUND_INITIATED { orderId: [32m'ord_1'[39m, reason: [32m'Customer unhappy with service'[39m }

 [32m✓[39m tests/functions/admin/orders/overrides.test.ts [2m([22m[2m18 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-booking-completed.test.ts [2m([22m[2m19 tests[22m[2m)[22m[90m 29[2mms[22m[39m
 [32m✓[39m tests/functions/devices.test.ts [2m([22m[2m17 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/bookings/accept-decline.test.ts [2m([22m[2m7 tests[22m[2m)[22m[33m 667[2mms[22m[39m
   [33m[2m✓[22m[39m PATCH /v1/technicians/job-offers/:bookingId/accept[2m > [22mreturns 200 ASSIGNED on first caller [33m626[2mms[22m[39m
 [32m✓[39m tests/kyc/kyc-status.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 224[2mms[22m[39m
 [32m✓[39m tests/functions/admin/complaints/sla-timer.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/cosmos/cross-partition-tenant-filter.test.ts [2m([22m[2m21 tests[22m[2m)[22m[90m 42[2mms[22m[39m
 [32m✓[39m tests/schemas/catalogue-bilingual.test.ts [2m([22m[2m30 tests[22m[2m)[22m[90m 17[2mms[22m[39m
 [32m✓[39m tests/functions/admin/users/patch.test.ts [2m([22m[2m18 tests[22m[2m)[22m[90m 41[2mms[22m[39m
 [32m✓[39m tests/unit/technician-dashboard.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/integration/auth.integration.test.ts [2m([22m[2m14 tests[22m[2m)[22m[90m 209[2mms[22m[39m
 [32m✓[39m tests/functions/complaints/partner-create.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/unit/ratings.test.ts [2m([22m[2m16 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/webhooks/razorpay-webhook-credit.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 15[2mms[22m[39m
 [32m✓[39m tests/unit/users-erasure-request.test.ts [2m([22m[2m10 tests[22m[2m)[22m[33m 2252[2mms[22m[39m
   [33m[2m✓[22m[39m POST /v1/users/me/erasure-request[2m > [22mreturns 401 without Authorization [33m2028[2mms[22m[39m
 [32m✓[39m tests/unit/admin-erasure-execute.test.ts [2m([22m[2m7 tests[22m[2m)[22m[33m 2021[2mms[22m[39m
   [33m[2m✓[22m[39m PATCH /v1/admin/erasure-requests/:id (EXECUTE)[2m > [22mreturns 404 when erasure request does not exist [33m1984[2mms[22m[39m
 [32m✓[39m tests/unit/earnings-cash.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/unit/commission-config.service.test.ts [2m([22m[2m20 tests[22m[2m)[22m[90m 9[2mms[22m[39m
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
 [32m✓[39m tests/functions/job-offers-expire-stale.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/unit/pending-actions-read-api.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/cosmos/finance-pnl-truth.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/unit/dataExport-service.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 259[2mms[22m[39m
 [32m✓[39m tests/services/fcm.service.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 9[2mms[22m[39m
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

 [32m✓[39m tests/bookings/create.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 18[2mms[22m[39m
[90mstdout[2m | tests/bookings/create.test.ts[2m > [22m[2mPOST /v1/bookings[2m > [22m[2mreturns 404 when service not found
[22m[39mservice_area_check {
  customerId: [32m'cust-1'[39m,
  lat: [33m0[39m,
  lng: [33m0[39m,
  inside: [33mfalse[39m,
  mode: [32m'warn-only'[39m
}

 [32m✓[39m tests/catalogue-public.test.ts [2m([22m[2m12 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m tests/catalogue-patch-semantics.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/cosmos/rate-limit-repository.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/unit/earnings.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/functions/rating-escalate.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 43[2mms[22m[39m
 [32m✓[39m tests/functions/technician-bookings.test.ts [2m([22m[2m6 tests[22m[2m)[22m[33m 354[2mms[22m[39m
   [33m[2m✓[22m[39m GET /v1/technicians/me/bookings[2m > [22mreturns 401 when technician auth fails [33m349[2mms[22m[39m
 [32m✓[39m tests/bookings/price-approval.test.ts [2m([22m[2m13 tests[22m[2m)[22m[90m 19[2mms[22m[39m
 [32m✓[39m tests/functions/wallet.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/unit/technicians.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/mark-commission-received.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m tests/integration/admin-routes-unauth.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 17[2mms[22m[39m
 [32m✓[39m tests/middleware/requireIntegrity.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 18[2mms[22m[39m
 [32m✓[39m tests/waitlist.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/unit/functions/services-availability.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/unit/earnings.service.test.ts [2m([22m[2m17 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/unit/sos.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/functions/webhook-fast-path.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 17[2mms[22m[39m
 [32m✓[39m tests/webhooks/razorpay-webhook-branch-coverage.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 22[2mms[22m[39m
 [32m✓[39m tests/functions/admin/auth/login.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m tests/unit/users-data-export.test.ts [2m([22m[2m5 tests[22m[2m)[22m[33m 2293[2mms[22m[39m
   [33m[2m✓[22m[39m GET /v1/users/me/data-export[2m > [22mreturns 401 when Authorization header is missing [33m2251[2mms[22m[39m
 [32m✓[39m tests/functions/admin/catalogue/commission-config.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/bookings/bookings-get-photos.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/unit/withRateLimit.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/unit/payouts-kill-switch.test.ts [2m([22m[2m18 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/functions/auth/truecaller-verify.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 176[2mms[22m[39m
 [32m✓[39m tests/scripts/backfill-historical-receivables.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/services/formRecognizer.service.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 206[2mms[22m[39m
 [32m✓[39m tests/unit/admin-erasure-deny.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 219[2mms[22m[39m
 [32m✓[39m tests/cosmos/system-docs-repository.test.ts [2m([22m[2m12 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-applyAddOnDecisions.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-reconcile-payouts.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/services/admin-session-rotate.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-addPhoto.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/kyc/submit-aadhaar.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 88[2mms[22m[39m
[90mstdout[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2mfinds zero overdue → no-op
[22m[39mprocessOverdueErasures: 0 overdue PENDING request(s) at 2026-09-07T11:07:12.242Z
processOverdueErasures done: processed=0 executed=0 failed=0 skipped=0

[90mstdout[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2mprocesses overdue PENDING requests, runs cascade, marks EXECUTED
[22m[39mprocessOverdueErasures: 2 overdue PENDING request(s) at 2026-09-07T11:07:12.260Z
processOverdueErasures done: processed=2 executed=2 failed=0 skipped=0

[90mstdout[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2misolates per-request failures: one cascade error does not abort the batch
[22m[39mprocessOverdueErasures: 3 overdue PENDING request(s) at 2026-09-07T11:07:12.273Z
processOverdueErasures done: processed=3 executed=2 failed=1 skipped=0

[90mstdout[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2mskips entries that no longer exist or have changed status (race-free)
[22m[39mprocessOverdueErasures: 1 overdue PENDING request(s) at 2026-09-07T11:07:12.287Z
processOverdueErasures done: processed=1 executed=0 failed=0 skipped=1

 [32m✓[39m tests/integration/erasure-cron.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 2384[2mms[22m[39m
   [33m[2m✓[22m[39m trigger-erasure-deadline (Azure timer trigger)[2m > [22mfinds zero overdue → no-op [33m2340[2mms[22m[39m
 [32m✓[39m tests/unit/tech-ratings.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/technicians/active-job-photos.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/unit/rating-appeal.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/integration/handlers.integration.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 84[2mms[22m[39m
 [32m✓[39m tests/middleware/withRateLimit.keyExtractor.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/approve-payouts.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/functions/config/technician.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/slot-holds-repository.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/cosmos/commission-config-repository.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 15[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-requestAddOn.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/functions/admin/sos/playback-token.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/bookings/branch-coverage.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 13[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-next-day-payout.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/unit/shield-report.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/functions/technicians/commission-due.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 14[2mms[22m[39m
 [32m✓[39m tests/services/truecaller.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/unit/adminUser.service.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 16[2mms[22m[39m
 [32m✓[39m tests/functions/complaints/partner-get.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/integration/dpdp-data-inventory.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 25[2mms[22m[39m
 [32m✓[39m tests/services/service-area.service.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/schemas/finance.test.ts [2m([22m[2m18 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/catalogue-seed.test.ts [2m([22m[2m53 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/functions/admin/dashboard/summary.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 61[2mms[22m[39m
 [32m✓[39m tests/services/fcm-technician.service.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/technicians/confidence-score.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/unit/launch-gate.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-markPaid.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/report-data.service.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/integration/dispatcher-up-ranking.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/kyc/submit-aadhaar-idor.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 49[2mms[22m[39m
 [32m✓[39m tests/functions/admin/auth/setup-totp.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/functions/sos-key.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 20[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-service-report.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/functions/admin/audit-log/list.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 38[2mms[22m[39m
 [32m✓[39m tests/observability/sentry-before-send.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/functions/technician-availability.test.ts [2m([22m[2m4 tests[22m[2m)[22m[33m 824[2mms[22m[39m
   [33m[2m✓[22m[39m technician availability handlers[2m > [22mreturns current technician availability [33m816[2mms[22m[39m
 [32m✓[39m tests/cosmos/client-retry.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 16[2mms[22m[39m
 [32m✓[39m tests/functions/admin/dashboard/feed.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m tests/unit/requireAdmin.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 79[2mms[22m[39m
 [32m✓[39m tests/unit/payout-cadence.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m tests/static/ledger-batch-only.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 134[2mms[22m[39m
 [32m✓[39m tests/middleware/withCorrelationId.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/services/piiCrypto.service.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-updateBookingFields.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/functions/admin/dashboard/tech-locations.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/schemas/commission-receivable.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/bookings/confirm.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/unit/rating-repository.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/functions/admin/complaints/create.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/catalogue-repository.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/integration/dispatcher-data-isolation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/cosmos/live-location-repository.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-confirmPayment.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/functions/users-erasure-request.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/technician-geospatial.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/cosmos/audit-log-repository.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/unit/acs-email.service.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/services/commission-allocator.pure.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 14[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/booking-repository.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/unit/adminSession.service.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/unit/auditLog.service.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/schemas/audit-log.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/integration/rbac.integration.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 67[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/commission-routes-rbac.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/bookings/list.test.ts [2m([22m[2m2 tests[22m[2m)[22m[33m 1054[2mms[22m[39m
   [33m[2m✓[22m[39m GET /v1/bookings[2m > [22mreturns current customer bookings with service names and final amount [33m1051[2mms[22m[39m
 [32m✓[39m tests/unit/verifyTechnicianToken.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/services/pan.utils.test.ts [2m([22m[2m16 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/openapi/registry-e21-s02.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 33[2mms[22m[39m
 [32m✓[39m tests/schemas/webhook.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/schemas/order.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/unit/jwt.service.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 44[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-getByPaymentOrderId.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 2[2mms[22m[39m
 [32m✓[39m tests/cosmos/dispatch-attempt-repository.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/summary.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/scripts/seed-technicians.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/services/razorpayRoute.service.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/shared/slot-utils.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/schemas/booking.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/functions/admin/complaints/list.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/scripts/backfill-commission-holds.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 15[2mms[22m[39m
 [32m✓[39m tests/services/dispatcher.service.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/schemas/commission-ledger.test.ts [2m([22m[2m4 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/geo.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/unit/schemas/technician.test.ts [2m([22m[2m9 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-getStaleSearching.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/schemas/commission-config.test.ts [2m([22m[2m11 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/schemas/live-location.test.ts [2m([22m[2m10 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/schemas/kyc.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/schemas/service-category.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/unit/schemas/slot-hold.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 14[2mms[22m[39m
 [32m✓[39m tests/functions/integrity/nonce.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 1755[2mms[22m[39m
   [33m[2m✓[22m[39m GET /v1/integrity/nonce[2m > [22mreturns 200 with a nonce field that is a valid UUID v4 [33m1700[2mms[22m[39m
 [32m✓[39m tests/lib/ist-time.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/functions/admin/orders/candidates.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/schemas/service.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/unit/semgrep-fcm-ordering.test.ts [2m([22m[2m3 tests[22m[2m)[22m[33m 566[2mms[22m[39m
   [33m[2m✓[22m[39m Semgrep FCM ordering invariant[2m > [22mpending-action-projector exports both upsertAction and emitFcmForAction [33m564[2mms[22m[39m
 [32m✓[39m tests/functions/admin/complaints/repeat-offenders.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/unit/commission.service.test.ts [2m([22m[2m6 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/integration/audit-log-coverage-invariant.test.ts [2m([22m[2m15 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/shared/timing-safe.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/totp.service.test.ts [2m([22m[2m7 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m tests/unit/trigger-rating-prompt.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 7[2mms[22m[39m
 [32m✓[39m tests/unit/requireCustomer.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m tests/schemas/commission-config-v2.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/cosmos/customer-credit-repository.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/cosmos/seed-merge.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/functions/admin/orders/list.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/functions/admin/orders/detail.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 2[2mms[22m[39m
 [32m✓[39m tests/cosmos/retry-utils.test.ts [2m([22m[2m8 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/services/auditLog.service.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/unit/pdf-generator.service.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 42[2mms[22m[39m
 [32m✓[39m tests/unit/razorpay.service.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/functions/admin/users/list.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/observability.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/unit/cookies.test.ts [2m([22m[2m5 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m tests/version.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m tests/zod-pattern.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m tests/shared/address-text.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 2[2mms[22m[39m
 [32m✓[39m tests/cosmos/booking-repository-hasActiveBookingForTechnician.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 2[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/payout-queue.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 3[2mms[22m[39m
 [32m✓[39m tests/functions/admin/finance/weekly-aggregate.test.ts [2m([22m[2m2 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/health.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m tests/functions/timers/prune-device-tokens.test.ts [2m([22m[2m3 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m tests/openapi-build.test.ts [2m([22m[2m6 tests[22m[2m)[22m[33m 5865[2mms[22m[39m
   [33m[2m✓[22m[39m openapi:build[2m > [22mis byte-deterministic across two runs [33m1607[2mms[22m[39m

[2m Test Files [22m [1m[32m211 passed[39m[22m[90m (211)[39m
[2m      Tests [22m [1m[32m1955 passed[39m[22m[90m (1955)[39m
[2m   Start at [22m 07:06:59
[2m   Duration [22m 24.52s[2m (transform 54.71s, setup 0ms, collect 179.27s, tests 26.00s, environment 35ms, prepare 28.90s)[22m

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

[90mstderr[2m | tests/webhooks/razorpay-webhook.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "razorpayWebhook" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "reconcileStaleBookings" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/kyc/submit-pan-ocr.test.ts[2m > [22m[2mPOST /v1/kyc/pan-ocr[2m > [22m[2memits KYC_PAN_VERIFIED audit entry on OCR success
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

[90mstderr[2m | tests/unit/trigger-no-show-detector.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerNoShowDetector" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-projectors.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerProjectorBookings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/finance/commission-remittances.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "recordCommissionRemittance" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/finance/commission-receivables.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminCommissionReceivablesDashboard" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminCommissionReceivablesPerTech" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminCommissionReceivablesRecompute" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-projectors.test.ts
[22m[39mWARNING: Skipping call to register function "triggerProjectorRatings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/finance/commission-hold-override.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "setCommissionHoldOverride" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "clearCommissionHoldOverride" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-projectors.test.ts
[22m[39mWARNING: Skipping call to register function "triggerProjectorKyc" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-projectors.test.ts
[22m[39mWARNING: Skipping call to register function "triggerProjectorDispatchAttempts" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-projectors.test.ts
[22m[39mWARNING: Skipping call to register function "triggerProjectorComplaints" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/compliance/ssc-levy.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "sscLevyQuarterly" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "listSscLevies" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveSscLevy" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/functions/devices.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "customerRegisterDevice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "customerUnregisterDeviceMe" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "customerUnregisterDevice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "technicianRegisterDevice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "technicianUnregisterDevice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminRegisterDevice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminUnregisterDevice" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/functions/admin/complaints/sla-timer.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "slaBreachTimer" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/auth.integration.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminLogin" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/users/patch.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminPatchUser" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/auth.integration.test.ts
[22m[39m[SECURITY] ADMIN_SETUP_SECRET is not set — TOTP setup endpoint is open to any caller. Set this env var before production deploy.
WARNING: Skipping call to register function "adminSetupTotpGet" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminSetupTotpPost" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/technician-dashboard.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "technicianDashboard" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/complaints/partner-create.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "partnerCreateComplaint" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/ratings.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "submitRating" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getRating" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/webhooks/razorpay-webhook-credit.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "razorpayWebhook" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "reconcileStaleBookings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-erasure-request.test.ts[2m > [22m[2mPOST /v1/users/me/erasure-request[2m > [22m[2mreturns 401 without Authorization
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "usersErasureRequestSubmit" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "usersErasureRequestRevoke" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/unit/earnings-cash.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getEarnings" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/catalogue-public.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getCategories" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getServiceById" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/rating-escalate.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "escalateRating" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/earnings.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getEarnings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/technician-bookings.test.ts[2m > [22m[2mGET /v1/technicians/me/bookings[2m > [22m[2mreturns 401 when technician auth fails
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getMyTechnicianBookings" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/functions/wallet.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getWalletBalance" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getWalletLedger" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminAuditLogList" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Skipping call to register function "adminPatchUser" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Skipping call to register function "adminDashboardSummary" because the "@azure/functions" package is in test mode.

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
[22m[39mWARNING: Skipping call to register function "adminListOrders" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Skipping call to register function "adminGetOrder" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/finance/mark-commission-received.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "markCommissionReceived" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Skipping call to register function "adminSosPlaybackToken" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts
[22m[39mWARNING: Skipping call to register function "adminGetSosIncident" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/admin-routes-unauth.test.ts[2m > [22m[2mAdmin login route — no requireAdmin wrapping (public endpoint)[2m > [22m[2mPOST /v1/admin/auth/login returns non-401 for missing body (validation error, not auth error)
[22m[39mWARNING: Skipping call to register function "adminLogin" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/waitlist.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "waitlist" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/functions/services-availability.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "servicesAvailability" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/sos.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "sos" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/webhook-fast-path.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "razorpayWebhook" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "reconcileStaleBookings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/webhooks/razorpay-webhook-branch-coverage.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "razorpayWebhook" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "reconcileStaleBookings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-data-export.test.ts[2m > [22m[2mGET /v1/users/me/data-export[2m > [22m[2mreturns 401 when Authorization header is missing
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "usersDataExport" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/auth/login.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminLogin" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-data-export.test.ts[2m > [22m[2mGET /v1/users/me/data-export[2m > [22m[2mreturns 401 when token verification fails
[22m[39mWARNING: Skipping call to register function "usersDataExport" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-data-export.test.ts[2m > [22m[2mGET /v1/users/me/data-export[2m > [22m[2mreturns 200 with assembled export for an authenticated customer
[22m[39mWARNING: Skipping call to register function "usersDataExport" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-data-export.test.ts[2m > [22m[2mGET /v1/users/me/data-export[2m > [22m[2mreturns 200 with technician export including KYC + wallet ledger
[22m[39mWARNING: Skipping call to register function "usersDataExport" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/users-data-export.test.ts[2m > [22m[2mGET /v1/users/me/data-export[2m > [22m[2mdoes NOT leak unmasked Aadhaar or full PAN
[22m[39mWARNING: Skipping call to register function "usersDataExport" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/catalogue/commission-config.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getAdminCommissionConfig" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "putAdminCommissionConfig" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/payouts-kill-switch.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerNextDayPayout" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/bookings-get-photos.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "createBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "confirmBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyBookings" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "requestAddon" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveFinalPrice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "cancelBooking" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/payouts-kill-switch.test.ts
[22m[39mWARNING: Skipping call to register function "triggerReconcilePayouts" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/bookings-get-photos.test.ts[2m > [22m[2mGET /v1/bookings/{id} — photos + reportSignedUrl projection[2m > [22m[2mT3 — sign failure for one photo: filter, do not fail request
[22m[39m[getBooking] photo sign failed { stage: [32m'EN_ROUTE'[39m, path: [32m'p2'[39m, signedUrl: [32m'[redacted-signed-url]'[39m }

[90mstderr[2m | tests/functions/auth/truecaller-verify.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "truecallerVerify" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/payouts-kill-switch.test.ts
[22m[39mWARNING: Skipping call to register function "adminApprovePayouts" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-reconcile-payouts.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerReconcilePayouts" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2mfinds zero overdue → no-op
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerErasureDeadline" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2mprocesses overdue PENDING requests, runs cascade, marks EXECUTED
[22m[39mWARNING: Skipping call to register function "triggerErasureDeadline" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2misolates per-request failures: one cascade error does not abort the batch
[22m[39mWARNING: Skipping call to register function "triggerErasureDeadline" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/erasure-cron.test.ts[2m > [22m[2mtrigger-erasure-deadline (Azure timer trigger)[2m > [22m[2mskips entries that no longer exist or have changed status (race-free)
[22m[39mWARNING: Skipping call to register function "triggerErasureDeadline" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/handlers.integration.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminRefresh" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/tech-ratings.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "getTechRatings" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/handlers.integration.test.ts
[22m[39mWARNING: Skipping call to register function "adminLogout" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/technicians/active-job-photos.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "activeJobPhotos" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/integration/handlers.integration.test.ts
[22m[39mWARNING: Skipping call to register function "adminMe" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/rating-appeal.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "ratingAppeal" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/finance/approve-payouts.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminApprovePayouts" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/config/technician.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "technicianConfig" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/cosmos/slot-holds-repository.test.ts[2m > [22m[2mslotHoldsRepo.commitHold[2m > [22m[2msilently returns when hold has already expired (Cosmos 404)
[22m[39m[slotHoldsRepo] commitHold: hold already expired (non-fatal) { holdId: [32m'svc-ac|2026-05-20|10:00-11:00'[39m, bookingId: [32m'bk-1'[39m }

[90mstderr[2m | tests/functions/admin/sos/playback-token.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminSosPlaybackToken" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/unit/shield-report.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "shieldReport" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/technicians/commission-due.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "techCommissionDue" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/kyc/submit-aadhaar-idor.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar — IDOR guard[2m > [22m[2mreturns 403 when authenticated uid (tech-A) differs from body technicianId (tech-B)
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-aadhaar-idor.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar — IDOR guard[2m > [22m[2mproceeds normally when authenticated uid matches body technicianId
[22m[39mWARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/kyc/submit-aadhaar-idor.test.ts[2m > [22m[2mPOST /v1/kyc/aadhaar — IDOR guard[2m > [22m[2mupsertKycStatus is never called for the forbidden (tech-B) case
[22m[39mWARNING: Skipping call to register function "submitAadhaar" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/audit-log/list.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminAuditLogList" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/sos-key.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "sosKey" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/auth/setup-totp.test.ts
[22m[39m[SECURITY] ADMIN_SETUP_SECRET is not set — TOTP setup endpoint is open to any caller. Set this env var before production deploy.
WARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminSetupTotpGet" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "adminSetupTotpPost" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/trigger-service-report.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerServiceReport" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/technician-availability.test.ts[2m > [22m[2mtechnician availability handlers[2m > [22m[2mreturns current technician availability
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "patchTechnicianFcmToken" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyTechnicianAvailability" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "patchMyTechnicianAvailability" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyTechnicianServiceProfile" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "patchMyTechnicianServiceProfile" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getTechnicianProfile" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getConfidenceScore" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/dashboard/feed.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminDashboardFeed" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/unit/payout-cadence.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "updatePayoutCadence" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/dashboard/tech-locations.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminDashboardTechLocations" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/bookings/confirm.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "createBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "confirmBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getMyBookings" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "getBooking" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "requestAddon" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "approveFinalPrice" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "cancelBooking" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/admin/complaints/create.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "adminCreateComplaint" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/users-erasure-request.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "usersErasureRequestSubmit" because the "@azure/functions" package is in test mode.
WARNING: Skipping call to register function "usersErasureRequestRevoke" because the "@azure/functions" package is in test mode.

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

[90mstderr[2m | tests/functions/admin/finance/weekly-aggregate.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "weeklyPayoutAggregate" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/health.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "health" because the "@azure/functions" package is in test mode.

[90mstderr[2m | tests/functions/timers/prune-device-tokens.test.ts
[22m[39mWARNING: Failed to detect the Azure Functions runtime. Switching "@azure/functions" package to test mode - not all features are supported.
WARNING: Skipping call to register function "triggerPruneDeviceTokens" because the "@azure/functions" package is in test mode.


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git show 5bfc0361aab64f7b637128c6c3fee9828a80393d:api/src/services/commission-settlement.service.ts | Select-Object -First 220' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 694ms:
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
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem docs -Recurse -Filter '*E21*' | Select-Object FullName" in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 1492ms:

FullName                                                                                    
--------                                                                                    
C:\Alok\Business Projects\wt-fix-cosmos-pages\docs\reviews\codex-e21-s02-20260906.summary.md
C:\Alok\Business Projects\wt-fix-cosmos-pages\docs\stories\E21-S02-commission-ledger-v2.md  
C:\Alok\Business Projects\wt-fix-cosmos-pages\docs\stories\E21-S02-interface-notes.md       



2026-09-07T11:07:45.656889Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path docs/stories/E21-S02-commission-ledger-v2.md -Pattern "completedJobCount|commissionHold|backfill|receivable|cash" -Context 2,2 | Select-Object -First 80 | ForEach-Object { "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 1112ms:
E21-S02-commission-ledger-v2.md:3: **Goal:** Extend the `commission_receivables` container (pk `/technicianId`) so remittances,
E21-S02-commission-ledger-v2.md:11: 1. Legacy receivable docs (no `docType`, no `allocations`) parse, appear in earnings,
E21-S02-commission-ledger-v2.md:17: 4. A duplicate change-feed delivery leaves one receivable and still recomputes the hold.
E21-S02-commission-ledger-v2.md:21: 7. Every technicians writer preserves `commissionHold` under concurrent hold patches.
E21-S02-commission-ledger-v2.md:25: `backfill-commission-holds.ts` are safe to run against a production environment carrying live
E21-S02-commission-ledger-v2.md:35: | `GET` | `/v1/admin/finance/commission-receivables` | Changed. Hold-based dashboard (was DUE-count dashboard), `continuationToken` pagination. |
E21-S02-commission-ledger-v2.md:36: | `POST` | `/v1/admin/finance/commission-receivables/recompute` | New (Task 10). Enqueues a full hold-repair sweep. |
E21-S02-commission-ledger-v2.md:37: | `GET` | `/v1/admin/finance/commission-receivables/{technicianId}` | Changed. Full ledger detail (receivables + remittances + credits), was DUE-entries-only. |
E21-S02-commission-ledger-v2.md:38: | `POST` | `/v1/admin/finance/commission-receivables/settle` | Changed. WAIVE-only; `action: "REMIT"` returns `410`. |

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content docs/stories/E21-S02-commission-ledger-v2.md -TotalCount 180' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 1854ms:
# E21-S02: Commission ledger v2

**Goal:** Extend the `commission_receivables` container (pk `/technicianId`) so remittances,
credits and (later) incentive awards live in the same partition under a `docType`
discriminator, with every derived money figure recomputed from source arrays rather than
incremented â€” enabling partial/overpayment remittance, technician commission holds, and
configurable warn/block thresholds without breaking any E21-S01 stored doc.

## Acceptance (story-level)

1. Legacy receivable docs (no `docType`, no `allocations`) parse, appear in earnings,
   dashboards, and technician view unchanged.
2. Partial remittance (â‚¹200 vs â‚¹220 due) leaves status DUE with correct outstanding; replaying
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
   E21-S01 data (see `docs/runbook.md` â†’ "Commission ledger v2 (E21-S02)" â†’ Rollout order); the
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

2026-09-07T11:07:58.622147Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Select-String -Path docs/runbook.md -Pattern "Commission ledger v2|backfill-commission-holds|setup-cosmos|commission_receivables" -Context 3,4 | Select-Object -First 80 | ForEach-Object { "$($_.LineNumber):$($_.Line.Trim())" }' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 986ms:
1332:commission, tracked in `commission_receivables`. The prepaid-era code moves money the other way —
1386:## Commission ledger v2 (E21-S02)
1390:configurable thresholds — all living in the same `commission_receivables` partition per
1448:reconciler and `backfill-commission-holds.ts` below — read there for the drift-detection log
1465:2. Run `npx tsx scripts/setup-cosmos.ts` against the target environment. Idempotent — safe to
1471:3. Run `npx tsx scripts/backfill-commission-holds.ts --dry-run` (the default — no flag needed, but
1479:5. Run `npx tsx scripts/backfill-commission-holds.ts --apply` once the diff looks sane. Prints

2026-09-07T11:08:03.367656Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content docs/runbook.md -TotalCount 1505 | Select-Object -Skip 1380' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 1226ms:
`RazorpayRouteService` construction. It is a static scan rather than a Semgrep rule, deliberately â€”
see the E19-S03 note in `api/.semgrep.yml` on findings blocking deploys.

---

## Commission ledger v2 (E21-S02)

Extends the E21-S01 cash-pilot commission model: remittances (a lump-sum payment against several
outstanding bookings), overpayment credit, per-technician commission holds (WARN/BLOCK), and
configurable thresholds â€” all living in the same `commission_receivables` partition per
technician, discriminated by `docType`. See `docs/adr/0031-single-partition-commission-ledger.md`
for the design rationale (why single-container/single-batch, why absolute recomputation, why the
hold is a cache with a repair queue).

### Record a commission remittance

`POST /v1/admin/finance/commission-remittances` (super-admin or finance role), body:

```json
{
  "technicianId": "tech-ayd-003",
  "amountPaise": 220000,
  "method": "UPI",
  "ref": "upi-txn-abc123",
  "idempotencyKey": "a-client-generated-uuid-per-attempt"
}
```

- `idempotencyKey` **must** be a fresh client-generated UUID per distinct remittance attempt, and
  is scoped per technician (`rem:<idempotencyKey>` inside that technician's partition). Retrying
  the *same* attempt (e.g. a timed-out request the admin's browser resubmits) with the *same* key
  is safe and returns the original receipt with `replayed: true` â€” no double-charge, no
  double-credit.
- The amount is allocated oldest-due-first across the technician's outstanding receivables. Any
  amount left over after every DUE receivable is cleared becomes a `CREDIT` doc
  (`creditCreatedPaise` in the response), which is automatically consumed by that technician's
  next dues.
- Response includes the recomputed `hold` (or `null` + `holdRecomputePending: true` if the
  best-effort recompute failed â€” the technician is queued for the async hold-repair sweep
  instead; the remittance itself is never rolled back for a hold-recompute failure).
- Error codes to know: `404 TECHNICIAN_NOT_FOUND`; `409 IDEMPOTENCY_MISMATCH` (the same
  `idempotencyKey` was reused for a *different* amount/method/ref â€” this is a client bug, not a
  legitimate replay, and is rejected rather than silently accepted); `409 LEDGER_BUSY` (ETag
  contention on the technician partition exhausted its retries â€” safe to retry the call with the
  *same* idempotency key).
- `POST .../commission-receivables/settle` with `action: "REMIT"` is retired and now returns
  `410 USE_COMMISSION_REMITTANCES` â€” it only still accepts `action: "WAIVE"` (write off a single
  booking's commission, e.g. a goodwill gesture).

### Technician says he is blocked / hold looks wrong

1. Pull the live ledger: `GET /v1/admin/finance/commission-receivables/{technicianId}` â€” returns
   `hold`, every `receivables` row (with `outstandingPaise` computed fresh), every `remittances`
   and `credits` doc, plus `cashCollectedPaise`/`creditAppliedPaise` totals. This is the
   ground truth; the cached `commissionHold` on the technician doc should match it.
2. If it doesn't match (stale cache, a recompute that failed silently), force a recompute:
   - Single technician: `POST /v1/admin/finance/commission-hold/{technicianId}/override` with
     `{ until, reason }` if you need to unblock them *immediately* while investigating (this
     forces CLEAR regardless of balance until `until`), then `DELETE` the same route to clear the
     override once the real issue is fixed.
   - Whole roster: `POST /v1/admin/finance/commission-receivables/recompute` (super-admin only,
     `202` â€” enqueues every technician onto the `system/hold-repair` queue).
3. The hold-repair queue (`system/hold-repair` doc: `{ technicianIds: [], all: boolean }`) is
   drained by the E21-S04 reconciler timer, which also runs an `EXPIRED_OVERRIDES` scope every
   run so a lapsed manual override doesn't sit inert until something else happens to touch that
   technician. `sweepAllHolds({ scope: 'FULL' | 'EXPIRED_OVERRIDES' })` in
   `api/src/services/commission-hold.service.ts` is the shared primitive behind both the
   reconciler and `backfill-commission-holds.ts` below â€” read there for the drift-detection log
   format if you're debugging why a recompute isn't converging.
4. A hold "looks wrong" because it's stale, never because the underlying receivables/remittances
   themselves are wrong â€” every derived total is recomputed absolutely from the ledger's source
   arrays on every read, never incremented. If step 1's ledger detail itself looks wrong, that's a
   data bug in the receivables/remittances, not a hold-cache staleness issue â€” escalate
   differently (check the booking-completion trigger and the remittance allocation, not the hold
   service).

### Rollout order for E21-S02

Deploying this story to an environment that already has E21-S01 data requires this exact order â€”
skipping the backfill step leaves every technician's cached `commissionHold` at its pre-v2 (or
absent) value until something incidentally triggers a recompute:

1. Deploy the Azure Functions app (new/changed handlers, the new `docType` read-path union, the
   commission-hold service).
2. Run `npx tsx scripts/setup-cosmos.ts` against the target environment. Idempotent â€” safe to
   re-run. Seeds `system/technician-client-config` (all features off) and `system/hold-repair`
   (empty queue) if absent, and read-merges `warnThresholdPaise` / `blockThresholdPaise` /
   `holdEnforcementEnabled` / `enforceKycInDispatch` onto the existing `system/commission-config`
   doc **only for keys that are currently absent** â€” an admin who already customized a threshold
   keeps their value.
3. Run `npx tsx scripts/backfill-commission-holds.ts --dry-run` (the default â€” no flag needed, but
   pass it explicitly for clarity in a runbook step). This recomputes every technician's hold in
   memory and prints the drift against what's currently cached, without writing anything.
4. **Read the diff.** Every technician who has any E21-S01 receivable history will show up as
   drift (their hold has never been computed before), which is expected the first time this runs
   in an environment. What you're actually checking for: totals that look implausible (a
   technician showing millions of paise outstanding is a sign something upstream is wrong, not
   that the backfill is wrong) before you commit to writing them.
5. Run `npx tsx scripts/backfill-commission-holds.ts --apply` once the diff looks sane. Prints
   `recomputed=<N> drifted=<N>` â€” `recomputed` should equal the number of technicians with any
   hold-relevant history; `drifted` should roughly match what the dry-run reported.
6. Verify: `GET /v1/admin/finance/commission-receivables` dashboard â†’
   `unreconciledTechnicianCount === 0`. A non-zero count here means some technician's cached hold
   still disagrees with their live DUE total â€” re-run the backfill, and if it doesn't converge,
   treat it as a P1 (a technician could be wrongly blocked, or wrongly *not* blocked, from
   dispatch/payout decisions that read the cache).

### Flags

All default **off** â€” this story ships the mechanism dark-launched, matching the â‚¹0-infra pilot
posture of shipping observable-but-inert first:

| Flag | Doc | Default | Effect when on |
|---|---|---|---|
| `holdEnforcementEnabled` | `system/commission-config` | `false` | Technician-app actually gates job acceptance/dispatch on `commissionHold.state === 'BLOCKED'` (enforcement, not just visibility) |
| `enforceKycInDispatch` | `system/commission-config` | `false` | Dispatch also gates on KYC status, independent of the commission hold |
| `features.wallet` / `duesBanner` / `upiQr` / `incentives` / `addOnRequests` | `system/technician-client-config` | all `false` | Technician-app UI surfaces for the wallet screen, dues banner, UPI QR collection flow, incentive milestones, and add-on requests respectively |

Change the commission-config flags/thresholds: `PUT /v1/admin/catalogue/commission-config`
(super-admin only), partial patch, e.g. `{ "holdEnforcementEnabled": true }` â€” rejects
`warnThresholdPaise >= blockThresholdPaise` with `400 THRESHOLD_ORDER`. Every threshold/flag key
change also enqueues a full hold-repair sweep, since the thresholds that decide WARN/BLOCK just
moved and every cached hold needs re-evaluating against them.

Change the technician-app feature flags: `PUT` on the technician-client-config doc (E21-S03 admin

2026-09-07T11:08:08.065567Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/services/commission-allocator.service.ts; Get-Content api/src/services/remittance*.ts -ErrorAction SilentlyContinue' in C:\Alok\Business Projects\wt-fix-cosmos-pages
2026-09-07T11:08:18.406382Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.8 seconds
Output:
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

 exited 1 in 807ms:
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

2026-09-07T11:08:18.425636Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/schemas/commission-receivable.ts -TotalCount 130' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 543ms:
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

2026-09-07T11:08:32.921030Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content api/scripts/backfill-historical-receivables.ts | ForEach-Object { $i++; if($i -ge 86 -and $i -le 110){"$i:$_"} }' in C:\Alok\Business Projects\wt-fix-cosmos-pages
2026-09-07T11:08:37.713019Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.7 seconds
Output:
At line:2 char:122
+ ... .ts | ForEach-Object { $i++; if($i -ge 86 -and $i -le 110){"$i:$_"} }
+                                                                 ~~~
Variable reference is not valid. ':' was not followed by a valid variable name character. Consider using ${} to 
delimit the name.
    + CategoryInfo          : ParserError: (:) [], ParentContainsErrorRecordException
    + FullyQualifiedErrorId : InvalidVariableReferenceWithDrive
 

 exited 1 in 735ms:
At line:2 char:122
+ ... .ts | ForEach-Object { $i++; if($i -ge 86 -and $i -le 110){"$i:$_"} }
+                                                                 ~~~
Variable reference is not valid. ':' was not followed by a valid variable name character. Consider using ${} to 
delimit the name.
    + CategoryInfo          : ParserError: (:) [], ParentContainsErrorRecordException
    + FullyQualifiedErrorId : InvalidVariableReferenceWithDrive
 

2026-09-07T11:08:37.724174Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content api/scripts/backfill-historical-receivables.ts | ForEach-Object { $i++; if($i -ge 86 -and $i -le 115){"${i}:$_"} }' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 624ms:
86:
87:    const existing = await commissionReceivableRepo.getByBookingId(booking.id, booking.technicianId);
88:    if (existing) {
89:      alreadyPresent += 1;
90:      console.log(`  HAVE ${booking.id}  ${rupees(existing.commissionDue)} already recorded`);
91:      continue;
92:    }
93:
94:    const preview = await resolveCommissionForBooking(booking);
95:    totalPaise += preview.commissionDue;
96:
97:    if (!apply) {
98:      console.log(
99:        `  WOULD ADD ${booking.id}  tech=${booking.technicianId}  ${preview.serviceName ?? '<service?>'}  ` +
100:          `booking=${rupees(preview.bookingAmount)}  bps=${preview.bps} (${preview.commissionResolvedFrom})  ` +
101:          `commission=${rupees(preview.commissionDue)}`,
102:      );
103:      continue;
104:    }
105:
106:    const result = await recordCommissionDue(booking);
107:    if ('skipped' in result) {
108:      skipped += 1;
109:      console.log(`  SKIP (${result.skipped}) ${booking.id}`);
110:      continue;
111:    }
112:    if (!result.created) {
113:      alreadyPresent += 1;
114:      console.log(`  HAVE ${booking.id} (created concurrently)`);
115:      continue;

2026-09-07T11:08:42.022841Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content api/src/services/commission-hold.service.ts' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 696ms:
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

2026-09-07T11:08:53.123341Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem api/src -Recurse -Filter *.ts | Select-String -Pattern "COMMISSION_CONFIG|commission-config|commissionBps" | Select-Object -First 160 | ForEach-Object { "$($_.Path):$($_.LineNumber):$($_.Line.Trim())" }' in C:\Alok\Business Projects\wt-fix-cosmos-pages
 succeeded in 945ms:
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-config-repository.ts:4:COMMISSION_CONFIG_DOC_ID,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-config-repository.ts:8:} from '../schemas/commission-config.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-config-repository.ts:13:.item(COMMISSION_CONFIG_DOC_ID, COMMISSION_CONFIG_DOC_ID)
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-config-repository.ts:32:.item(COMMISSION_CONFIG_DOC_ID, COMMISSION_CONFIG_DOC_ID)
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-config-repository.ts:36:id: COMMISSION_CONFIG_DOC_ID,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-config-repository.ts:37:defaultCommissionBps: 2200,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-config-repository.ts:46:defaultCommissionBps: patch.defaultCommissionBps ?? base.defaultCommissionBps,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-config-repository.ts:59:.item(COMMISSION_CONFIG_DOC_ID, COMMISSION_CONFIG_DOC_ID)
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\commission-receivable-repository.ts:36:commissionBps: input.commissionBps,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:20:* `c.commissionBps` from the bookings container and that field is not on
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\finance-repository.ts:21:* BookingDocSchema and is never written. `b.commissionBps ?? DEFAULT` therefore
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\wallet-ledger-repository.ts:21:commissionBps: input.commissionBps,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\seeds\catalogue.ts:30:commissionBps: 2250,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\seeds\catalogue.ts:50:commissionBps: 2250,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\seeds\catalogue.ts:73:commissionBps: 2250,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\seeds\catalogue.ts:93:commissionBps: 2000,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\seeds\catalogue.ts:114:commissionBps: 2250,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\seeds\catalogue.ts:134:commissionBps: 2250,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\seeds\catalogue.ts:155:commissionBps: 2250,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\seeds\catalogue.ts:175:commissionBps: 2250,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\seeds\catalogue.ts:195:commissionBps: 2250,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\seeds\catalogue.ts:216:commissionBps: 2250,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\seeds\catalogue.ts:236:commissionBps: 2250,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\seeds\catalogue.ts:256:commissionBps: 2250,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\seeds\catalogue.ts:277:commissionBps: 2250,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\cosmos\seeds\catalogue.ts:297:commissionBps: 2250,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:13:import { getGlobalCommissionBps, resolveCommissionBps } from '../services/commission-config.service.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:95:getGlobalCommissionBps(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:100:const { bps: resolvedBps } = resolveCommissionBps({
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:101:...(serviceRazorpay?.commissionBps !== undefined ? { serviceBps: serviceRazorpay.commissionBps } : {}),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:102:...(categoryRazorpay?.commissionBps !== undefined ? { categoryBps: categoryRazorpay.commissionBps } : {}),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:105:const { commissionBps, commissionAmount, techAmount: techAmountBeforeFee } = calculateCommission(
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:143:commissionBps,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\trigger-booking-completed.ts:202:* rejecting because `getGlobalCommissionBps` or a catalogue lookup threw) must NOT be swallowed
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\catalogue\commission-config.ts:7:import { commissionConfigRepo } from '../../../cosmos/commission-config-repository.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\catalogue\commission-config.ts:9:import { UpdateCommissionConfigBodySchema, toEffectiveConfig } from '../../../schemas/commission-config.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\catalogue\commission-config.ts:10:import { _resetCommissionConfigCacheForTest } from '../../../services/commission-config.service.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\catalogue\commission-config.ts:68:'COMMISSION_CONFIG_UPDATED',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\catalogue\commission-config.ts:69:'commission-config',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\catalogue\commission-config.ts:70:'commission-config',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\catalogue\commission-config.ts:85:route: 'v1/admin/catalogue/commission-config',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\admin\catalogue\commission-config.ts:92:route: 'v1/admin/catalogue/commission-config',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\config\technician.ts:6:import { getCommissionConfig } from '../../services/commission-config.service.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\functions\technicians\commission-due.ts:8:import { getCommissionConfig } from '../../services/commission-config.service.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\openapi\registry.ts:43:} from '../schemas/commission-config.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\openapi\registry.ts:596:method: 'get', path: '/v1/admin/catalogue/commission-config', operationId: 'getAdminCommissionConfig',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\openapi\registry.ts:607:method: 'put', path: '/v1/admin/catalogue/commission-config', operationId: 'putAdminCommissionConfig',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-config.ts:6:/** Fixed singleton id for the platform commission-config document in the `system` container. */
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-config.ts:7:export const COMMISSION_CONFIG_DOC_ID = 'commission-config';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-config.ts:13:export const CommissionBpsSchema = z
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-config.ts:26:/** Stored in the `system` Cosmos container under the fixed id `commission-config`. */
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-config.ts:29:id: z.literal(COMMISSION_CONFIG_DOC_ID),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-config.ts:30:defaultCommissionBps: CommissionBpsSchema,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-config.ts:44:defaultCommissionBps: CommissionBpsSchema.optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-config.ts:58:defaultCommissionBps: CommissionBpsSchema,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-config.ts:75:defaultCommissionBps: doc?.defaultCommissionBps ?? 2200,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:3:import { CommissionBpsSchema, CommissionResolvedFromSchema, type CommissionResolvedFrom } from './commission-config.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:34:* technician OWES the platform (the platform never held the cash). `commissionBps` /
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:47:commissionBps: CommissionBpsSchema,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\commission-receivable.ts:73:commissionBps: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\service-category.ts:21:* When absent, services fall through to the global default. A service-level `commissionBps`
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\service-category.ts:24:commissionBps: z.number().int().min(1500).max(3500).optional(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\service.ts:102:commissionBps: z.number().int().min(1500).max(3500).optional().openapi({ description: 'Commission override in basis points (2250 = 22.5%). Optional (E21-S01): when absent, the booking falls through to the category override, then the global default.' }),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\service.ts:131:commissionBps: true,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\wallet-ledger.ts:16:commissionBps: z.number().int().positive(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\schemas\wallet-ledger.ts:36:commissionBps: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-config.service.ts:2:import { commissionConfigRepo } from '../cosmos/commission-config-repository.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-config.service.ts:9:} from '../schemas/commission-config.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-config.service.ts:11:/** Platform default when no commission-config doc exists in Cosmos. */
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-config.service.ts:35:export function resolveCommissionBps(input: {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-config.service.ts:55:* Cosmos on hot paths. Emits a Sentry warning when no commission-config doc
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-config.service.ts:67:'commission-config doc missing in Cosmos; falling back to DEFAULT_COMMISSION_BPS',
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-config.service.ts:83:export async function getGlobalCommissionBps(): Promise<number> {
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-config.service.ts:84:return (await getCommissionConfig()).defaultCommissionBps;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-hold.service.ts:8:import { getCommissionConfig } from './commission-config.service.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:3:import type { CommissionResolvedFrom } from '../schemas/commission-config.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:7:import { getGlobalCommissionBps, resolveCommissionBps } from './commission-config.service.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:14:| { created: boolean; commissionDue: number; commissionBps: number; commissionResolvedFrom: CommissionResolvedFrom }
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:32:getGlobalCommissionBps(),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:37:const { bps, from: commissionResolvedFrom } = resolveCommissionBps({
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:38:...(service?.commissionBps !== undefined ? { serviceBps: service.commissionBps } : {}),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:39:...(category?.commissionBps !== undefined ? { categoryBps: category.commissionBps } : {}),
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:58:* as `created: false` with the same commissionDue/commissionBps/commissionResolvedFrom the caller
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:83:commissionBps: existing.commissionBps,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:97:commissionBps: bps,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:111:// a different commissionBps (e.g. a config edit landed between the two reads). Re-read the
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:120:commissionBps: stored.commissionBps,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:125:return { created: true, commissionDue, commissionBps: bps, commissionResolvedFrom };
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-settlement.service.ts:175:commissionBps: r.commissionBps,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission-view.service.ts:10:import type { EffectiveCommissionConfig } from '../schemas/commission-config.js';
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission.service.ts:2:commissionBps: number;
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission.service.ts:9:commissionBps: number,
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission.service.ts:11:const commissionAmount = Math.round((bookingAmountPaise * commissionBps) / 10000);
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\services\commission.service.ts:13:return { commissionBps, commissionAmount, techAmount };
C:\Alok\Business Projects\wt-fix-cosmos-pages\api\src\types\admin.ts:33:| 'COMMISSION_CONFIG_UPDATED'

2026-09-07T11:09:39.387871Z ERROR codex_models_manager::manager: failed to renew cache TTL: missing field `supports_parallel_tool_calls` at line 132 column 5
codex
The new backfill can leave ledger-derived balances incorrect in environments with existing credits and can distort receivable age/order for historical rows. These are data correctness issues in the money ledger path.

Full review comments:

- [P2] Finalize created backfill rows before recomputing holds — C:\Alok\Business Projects\wt-fix-cosmos-pages\api\scripts\backfill-historical-receivables.ts:106-106
  When this runs in an environment that already has open technician CREDIT docs (for example, an overpaid remittance created after the container was restored but before this backfill), this writes new DUE receivables but never calls `finalizeLedgerForTechnician`, so `consumePendingCredits` is not run. The suggested `backfill-commission-holds` step only recomputes holds from the current rows and does not allocate credits, leaving outstanding dues/holds overstated until another settlement happens for that technician.

- [P2] Preserve historical due dates for backfilled receivables — C:\Alok\Business Projects\wt-fix-cosmos-pages\api\scripts\backfill-historical-receivables.ts:106-106
  For backfilled historical bookings, routing through `recordCommissionDue` creates the receivable with `createdAt = new Date()` in `createDueEntry`; later remittance allocation uses `entry.createdAt` for oldest-first ordering and hold summaries use it for `oldestDueAt`. If a technician has newer live dues plus older backfilled jobs, future remittances will settle the newer rows first and the dashboard will show the backfill run date instead of the actual overdue date.
The new backfill can leave ledger-derived balances incorrect in environments with existing credits and can distort receivable age/order for historical rows. These are data correctness issues in the money ledger path.

Full review comments:

- [P2] Finalize created backfill rows before recomputing holds — C:\Alok\Business Projects\wt-fix-cosmos-pages\api\scripts\backfill-historical-receivables.ts:106-106
  When this runs in an environment that already has open technician CREDIT docs (for example, an overpaid remittance created after the container was restored but before this backfill), this writes new DUE receivables but never calls `finalizeLedgerForTechnician`, so `consumePendingCredits` is not run. The suggested `backfill-commission-holds` step only recomputes holds from the current rows and does not allocate credits, leaving outstanding dues/holds overstated until another settlement happens for that technician.

- [P2] Preserve historical due dates for backfilled receivables — C:\Alok\Business Projects\wt-fix-cosmos-pages\api\scripts\backfill-historical-receivables.ts:106-106
  For backfilled historical bookings, routing through `recordCommissionDue` creates the receivable with `createdAt = new Date()` in `createDueEntry`; later remittance allocation uses `entry.createdAt` for oldest-first ordering and hold summaries use it for `oldestDueAt`. If a technician has newer live dues plus older backfilled jobs, future remittances will settle the newer rows first and the dashboard will show the backfill run date instead of the actual overdue date.
