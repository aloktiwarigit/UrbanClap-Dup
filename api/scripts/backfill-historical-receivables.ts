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
  recordCommissionDue,
  resolveCommissionForBooking,
} from '../src/services/commission-settlement.service.js';
import { systemAudit } from '../src/services/auditLog.service.js';
import { BookingDocSchema } from '../src/schemas/booking.js';

const KNOWN_FLAGS = new Set(['--dry-run', '--apply']);

// RAZORPAY bookings settle through the wallet-ledger path and must never get a cash receivable.
// Legacy docs may omit paymentMethod entirely; those default to cash, matching recordCommissionDue.
const QUERY =
  "SELECT * FROM c WHERE c.status = 'COMPLETED' AND (NOT IS_DEFINED(c.paymentMethod) OR c.paymentMethod != 'RAZORPAY')";

const rupees = (paise: number): string => `Rs ${(paise / 100).toFixed(2)}`;

export async function main(argvArgs: string[]): Promise<void> {
  const unknown = argvArgs.filter((a) => !KNOWN_FLAGS.has(a));
  if (unknown.length > 0) {
    console.error(`Unknown flag(s): ${unknown.join(', ')}`);
    console.error('Usage: backfill-historical-receivables.ts [--dry-run|--apply]');
    process.exit(2);
    return;
  }

  const apply = argvArgs.includes('--apply');
  if (apply && argvArgs.includes('--dry-run')) {
    console.error('Pass either --dry-run or --apply, not both.');
    process.exit(2);
    return;
  }

  console.log(`historical commission-receivable backfill — mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log('');

  const iterator = getBookingsContainer().items.query({ query: QUERY }, { maxItemCount: 100 });
  const bookings: unknown[] = [];
  while (iterator.hasMoreResults()) {
    const page = await iterator.fetchNext();
    // Cosmos hands back `resources: undefined` on some pages — never spread it unguarded.
    bookings.push(...(page.resources ?? []));
  }

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

    const result = await recordCommissionDue(booking);
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
    console.log(`  ADDED ${booking.id}  ${rupees(result.commissionDue)}  bps=${result.commissionBps}`);
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

  console.log('');
  console.log(
    `scanned=${bookings.length} ${apply ? 'created' : 'wouldCreate'}=${apply ? created : bookings.length - alreadyPresent - unparseable - skipped} ` +
      `alreadyPresent=${alreadyPresent} skipped=${skipped} unparseable=${unparseable}`,
  );
  console.log(`commission ${apply ? 'recorded' : 'that would be recorded'}: ${rupees(totalPaise)}`);
  console.log('');
  console.log(
    apply
      ? 'Apply complete. Run backfill-commission-holds.ts --apply next to compute the holds.'
      : 'Dry-run complete — no writes made. Re-run with --apply to record the rows above.',
  );
}

if (argv[1] && fileURLToPath(import.meta.url) === argv[1]) {
  main(argv.slice(2)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
