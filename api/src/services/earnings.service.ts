/**
 * P0-1 — One definition of "what a technician earned", shared by every surface
 * that shows it.
 *
 * Before this existed there were two answers in the same app:
 *
 *   - `GET /v1/technicians/me/earnings` summed `wallet_ledger.techAmount`, which
 *     the cash path never writes — so it reported ₹0 for the entire pilot.
 *   - `GET /v1/technicians/me/dashboard` summed `finalAmount ?? amount` for
 *     today's completed bookings — GROSS, with no commission subtracted.
 *
 * A technician could see ₹0 lifetime and ₹999 today for the same single job.
 * Both surfaces now build their numbers from `buildEarningEvents`, so they cannot
 * disagree again without someone deliberately bypassing it.
 */

import type { WalletLedgerEntry } from '../schemas/wallet-ledger.js';
import type { CommissionReceivableEntry } from '../schemas/commission-receivable.js';

/** Technicians work in India; every period boundary is an IST calendar boundary. */
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** IST calendar date (YYYY-MM-DD) for a UTC ISO timestamp stored in Cosmos. */
export function toIstDateStr(utcIso: string): string {
  return new Date(new Date(utcIso).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * One completed job the technician earned money on, independent of how the money
 * moved.
 *
 * `netPaise` is what the technician keeps:
 *   - cash  (live)    `bookingAmount − commissionDue` — they hold the cash and owe the commission
 *   - route (dormant) `techAmount`                    — the platform already transferred it
 */
export interface EarningEvent {
  bookingId: string;
  createdAt: string;
  netPaise: number;
}

/**
 * Union both ledgers into one list of earning events, keyed by `bookingId` so a
 * booking can never be counted twice.
 *
 * The two paths are mutually exclusive in `trigger-booking-completed` (CASH writes
 * a commission receivable, RAZORPAY writes a wallet-ledger row) and each container
 * stores exactly one document per booking (`id` IS the bookingId). Deduping anyway
 * is deliberate: double-counting a technician's money is the worst failure mode
 * available here, and the guard costs nothing.
 *
 * Commission is taken as CHARGED, not as remitted. A waiver or a remittance months
 * later must not retroactively change what a past period reported, so REMITTED and
 * WAIVED receivables are included at their original `commissionDue`.
 */
export function buildEarningEvents(
  ledgerEntries: readonly WalletLedgerEntry[],
  receivables: readonly CommissionReceivableEntry[],
): EarningEvent[] {
  const byBooking = new Map<string, EarningEvent>();

  for (const entry of ledgerEntries) {
    // A failed Razorpay transfer never reached the technician.
    if (entry.payoutStatus === 'FAILED') continue;
    byBooking.set(entry.bookingId, {
      bookingId: entry.bookingId,
      createdAt: entry.createdAt,
      netPaise: entry.techAmount,
    });
  }

  for (const receivable of receivables) {
    // Prefer what the technician actually collected over what was booked. The two
    // can differ (a short collection at the door), and reporting money they never
    // took would be wrong in the direction that matters. `cashCollectedAmount` is
    // absent until the technician app starts sending it (P0-2), so this reads as
    // `bookingAmount` today.
    //
    // Commission is still owed on the BOOKED amount regardless of what was
    // collected — under-collecting does not reduce the debt.
    const collected = receivable.cashCollectedAmount ?? receivable.bookingAmount;

    // Clamp: a collection smaller than the commission owed yields a negative net.
    // That is an anomaly worth investigating (see scripts/reconcile-earnings-p0-1.ts,
    // which reports it) but it must not produce a negative earnings figure —
    // TechnicianDashboardResponseSchema declares todayEarningsInPaise nonnegative
    // and is parsed, so an unclamped negative would 500 the technician's dashboard.
    const net = Math.max(0, collected - receivable.commissionDue);

    // The cash model is the live one, so it wins any (unexpected) collision.
    byBooking.set(receivable.bookingId, {
      bookingId: receivable.bookingId,
      createdAt: receivable.createdAt,
      netPaise: net,
    });
  }

  return [...byBooking.values()];
}

/** Net earnings for one IST calendar date. */
export function sumNetForIstDate(events: readonly EarningEvent[], istDateStr: string): number {
  return events
    .filter((e) => toIstDateStr(e.createdAt) === istDateStr)
    .reduce((sum, e) => sum + e.netPaise, 0);
}
