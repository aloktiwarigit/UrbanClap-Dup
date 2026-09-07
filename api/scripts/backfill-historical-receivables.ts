#!/usr/bin/env tsx
// One-off backfill for cash bookings that COMPLETED before the commission ledger physically
// existed in an environment. In production the `commission_receivables` container was never
// created (setup-cosmos.ts had not been run since E21-S01 shipped), so every completed cash
// booking settled into a 404 and no receivable was ever recorded.
//
// Run (default, read-only): npx tsx scripts/backfill-historical-receivables.ts
//                     apply: npx tsx scripts/backfill-historical-receivables.ts --apply
//
// Requires: COSMOS_CONNECTION_STRING, or COSMOS_ENDPOINT + COSMOS_KEY (see src/cosmos/client.ts).
//
// Deliberately calls `recordCommissionDue`, NOT `settleCashCompletion`: the latter also increments
// completedJobCount and sends an EARNINGS_UPDATE push. Firing those for a job finished months ago
// would double-count job totals and notify technicians about ancient work. The ledger row is what
// is missing; the side effects already happened (or didn't) at the time.
//
// Idempotent: `recordCommissionDue` is keyed on bookingId and returns `created: false` for a row
// that already exists, and this script skips such bookings before calling it at all.

import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';
import { getBookingsContainer } from '../src/cosmos/client.js';
import { commissionReceivableRepo } from '../src/cosmos/commission-receivable-repository.js';
import {
  finalizeLedgerForTechnician,
  recordCommissionDue,
  resolveCommissionForBooking,
} from '../src/services/commission-settlement.service.js';
import { systemAudit } from '../src/services/auditLog.service.js';
import { BookingDocSchema } from '../src/schemas/booking.js';

const KNOWN_FLAGS = new Set(['--dry-run', '--apply']);
const CUTOFF_FLAG = '--completed-before=';

// RAZORPAY bookings settle through the wallet-ledger path and must never get a cash receivable.
// Legacy docs may omit paymentMethod entirely; those default to cash, matching recordCommissionDue.
//
// The @cutoff bound is not cosmetic (Codex review, 2026-09-07): active-job.ts writes
// status: 'COMPLETED' and only *then* calls settleCashCompletion. A backfill running inside that
// window would create the receivable first, so the live path would see `created: false` and skip
// the side effects that belong to a current job — the technician would silently lose a
// completedJobCount increment and an EARNINGS_UPDATE push. Only ever backfill jobs old enough
// that their settlement has certainly already been attempted.
const QUERY =
  "SELECT * FROM c WHERE c.status = 'COMPLETED' AND (NOT IS_DEFINED(c.paymentMethod) OR c.paymentMethod != 'RAZORPAY') AND ((IS_DEFINED(c.completedAt) AND c.completedAt < @cutoff) OR (NOT IS_DEFINED(c.completedAt) AND c.createdAt < @cutoff))";

const rupees = (paise: number): string => `Rs ${(paise / 100).toFixed(2)}`;

export async function main(argvArgs: string[]): Promise<void> {
  const cutoffArg = argvArgs.find((a) => a.startsWith(CUTOFF_FLAG));
  const unknown = argvArgs.filter((a) => !KNOWN_FLAGS.has(a) && !a.startsWith(CUTOFF_FLAG));
  if (unknown.length > 0) {
    console.error(`Unknown flag(s): ${unknown.join(', ')}`);
    console.error('Usage: backfill-historical-receivables.ts [--dry-run|--apply] --completed-before=<ISO>');
    process.exit(2);
    return;
  }

  // Fail closed: an operator must state the cutoff, rather than inherit a default that silently
  // swallows a job completed thirty seconds ago.
  const cutoff = cutoffArg?.slice(CUTOFF_FLAG.length);
  if (!cutoff || Number.isNaN(Date.parse(cutoff))) {
    console.error('--completed-before=<ISO timestamp> is required (e.g. --completed-before=2026-09-01T00:00:00.000Z).');
    console.error('Only bookings completed strictly before it are eligible, so a job settling right now is never claimed.');
    process.exit(2);
    return;
  }

  const apply = argvArgs.includes('--apply');
  if (apply && argvArgs.includes('--dry-run')) {
    console.error('Pass either --dry-run or --apply, not both.');
    process.exit(2);
    return;
  }

  console.log(`historical commission-receivable backfill — mode=${apply ? 'APPLY' : 'DRY-RUN'} cutoff=${cutoff}`);
  console.log('');

  const iterator = getBookingsContainer().items.query(
    { query: QUERY, parameters: [{ name: '@cutoff', value: cutoff }] },
    { maxItemCount: 100 },
  );
  const bookings: unknown[] = [];
  while (iterator.hasMoreResults()) {
    const page = await iterator.fetchNext();
    // Cosmos hands back `resources: undefined` on some pages — never spread it unguarded.
    bookings.push(...(page.resources ?? []));
  }

  // Technicians who gained at least one row, so their credits can be consumed and their hold
  // recomputed once at the end rather than per row.
  const touched = new Set<string>();
  let created = 0;
  let alreadyPresent = 0;
  let unparseable = 0;
  let skipped = 0;
  let totalPaise = 0;

  for (const raw of bookings) {
    const parsed = BookingDocSchema.safeParse(raw);
    if (!parsed.success) {
      unparseable += 1;
      console.log(`  SKIP (unparseable) ${(raw as { id?: string })?.id ?? '<no id>'}`);
      continue;
    }
    const booking = parsed.data;
    if (!booking.technicianId) {
      skipped += 1;
      console.log(`  SKIP (no technician) ${booking.id}`);
      continue;
    }

    const existing = await commissionReceivableRepo.getByBookingId(booking.id, booking.technicianId);
    if (existing) {
      alreadyPresent += 1;
      console.log(`  HAVE ${booking.id}  ${rupees(existing.commissionDue)} already recorded`);
      continue;
    }

    const preview = await resolveCommissionForBooking(booking);
    totalPaise += preview.commissionDue;

    if (!apply) {
      console.log(
        `  WOULD ADD ${booking.id}  tech=${booking.technicianId}  ${preview.serviceName ?? '<service?>'}  ` +
          `booking=${rupees(preview.bookingAmount)}  bps=${preview.bps} (${preview.commissionResolvedFrom})  ` +
          `commission=${rupees(preview.commissionDue)}`,
      );
      continue;
    }

    // Stamp the row with when the debt was actually incurred, not when this script ran:
    // createdAt drives oldest-first remittance allocation and the hold's oldestDueAt.
    const incurredAt = booking.completedAt ?? booking.createdAt;
    const result = await recordCommissionDue(booking, { createdAt: incurredAt });
    if ('skipped' in result) {
      skipped += 1;
      console.log(`  SKIP (${result.skipped}) ${booking.id}`);
      continue;
    }
    if (!result.created) {
      alreadyPresent += 1;
      console.log(`  HAVE ${booking.id} (created concurrently)`);
      continue;
    }

    created += 1;
    touched.add(booking.technicianId);
    console.log(
      `  ADDED ${booking.id}  ${rupees(result.commissionDue)}  bps=${result.commissionBps}  dated ${incurredAt}`,
    );
    await systemAudit('COMMISSION_DUE_RECORDED', 'booking', booking.id, {
      technicianId: booking.technicianId,
      bookingAmount: preview.bookingAmount,
      commissionBps: result.commissionBps,
      commissionDue: result.commissionDue,
      commissionResolvedFrom: result.commissionResolvedFrom,
      // Distinguishes a retroactively created row from one the live settlement path wrote.
      backfill: true,
    });
  }

  // A technician may already hold open CREDIT docs (an overpaid remittance recorded before this
  // backfill ran). New DUE rows must consume them, or the dashboard overstates what is owed.
  // finalizeLedgerForTechnician runs consumePendingCredits and then recomputes the hold; it never
  // throws.
  for (const technicianId of touched) {
    await finalizeLedgerForTechnician(technicianId);
    console.log(`  FINALIZED ${technicianId} (credits consumed, hold recomputed)`);
  }

  console.log('');
  console.log(
    `scanned=${bookings.length} ${apply ? 'created' : 'wouldCreate'}=${apply ? created : bookings.length - alreadyPresent - unparseable - skipped} ` +
      `alreadyPresent=${alreadyPresent} skipped=${skipped} unparseable=${unparseable}`,
  );
  console.log(`commission ${apply ? 'recorded' : 'that would be recorded'}: ${rupees(totalPaise)}`);
  console.log('');
  console.log(
    apply
      ? 'Apply complete. Holds were recomputed for every affected technician; run backfill-commission-holds.ts --apply if you want a full-roster sweep as well.'
      : 'Dry-run complete — no writes made. Re-run with --apply to record the rows above.',
  );
}

if (argv[1] && fileURLToPath(import.meta.url) === argv[1]) {
  main(argv.slice(2)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
