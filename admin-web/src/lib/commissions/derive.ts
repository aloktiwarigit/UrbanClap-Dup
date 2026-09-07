/**
 * Pure derivation library for the admin commission console. No React, no
 * fetch — just arithmetic and shaping over the server-computed ledger
 * (`CommissionLedgerDetail`) and dashboard rows. Every screen's numbers
 * come from these functions so the money logic exists in exactly one place.
 *
 * Binding rule from the design spec: `cashCollectedPaise` is evidence for
 * *why* a commission exists (money that passed through the technician's
 * hands at the customer's door) — it is never a balance line. Only credits
 * (once applied) reduce the balance. `buildBalanceStack` must never fold
 * `cashCollectedPaise` into any of its four outputs.
 *
 * All money arithmetic here is integer paise. Never convert to rupees and
 * never round inside these functions — rounding is the server's job and it
 * has already happened by the time this data arrives.
 */
import { formatINR } from '@/lib/format/intl';
import type { CommissionDashboardRow, CommissionLedgerDetail } from '@/api/commissions';

export interface BalanceStack {
  commissionDuePaise: number;
  repaidPaise: number;
  creditedPaise: number;
  balancePaise: number;
}

export type BalanceEventKind = 'DUE' | 'REMITTANCE' | 'CREDIT' | 'WAIVER';

export interface BalanceEvent {
  id: string;
  at: string;
  kind: BalanceEventKind;
  label: string;
  bookingId?: string;
  ref?: string;
  actorId?: string;
  changePaise: number;
  balancePaise: number;
}

export type CommissionHold = CommissionLedgerDetail['hold'];

export interface HoldThresholds {
  warnPaise: number;
  blockPaise: number;
}

// Cap how many names a threshold-impact preview surfaces — the settings
// screen shows this inline next to the input, not as a full table.
const THRESHOLD_IMPACT_SAMPLE_SIZE = 5;

/**
 * The accounting stack a technician's ledger detail resolves to: what
 * commission is due in total, how much of that was actually repaid via
 * remittance, how much was covered by applying an existing credit, and the
 * balance that remains. `cashCollectedPaise` never enters this — it is not
 * read anywhere in this function.
 */
export function buildBalanceStack(detail: CommissionLedgerDetail): BalanceStack {
  const commissionDuePaise = detail.receivables.reduce((sum, r) => sum + r.commissionDue, 0);
  const repaidPaise = detail.receivables.reduce((sum, r) => sum + (r.remittedAmount ?? 0), 0);
  const creditedPaise = detail.creditAppliedPaise;
  const balancePaise = commissionDuePaise - repaidPaise - creditedPaise;
  return { commissionDuePaise, repaidPaise, creditedPaise, balancePaise };
}

/**
 * Merges receivables, remittances, and credit consumptions into one
 * chronological event list with a running balance, for the ledger detail
 * screen's audit trail.
 *
 * - Each receivable becomes a positive DUE event at its `createdAt` (and,
 *   if it was waived, an additional negative WAIVER event forgiving
 *   whatever was still outstanding on it).
 * - Each remittance becomes a negative REMITTANCE event at its `createdAt`
 *   for the portion actually applied against dues — `amountPaise` minus
 *   whatever portion of that remittance became a credit
 *   (`creditCreatedPaise`), since an unconsumed credit doesn't reduce the
 *   balance yet (see the CREDIT case below).
 * - Each credit's `consumedBy` entry becomes a negative CREDIT event at its
 *   `appliedAt` — this is where a credit actually reduces the balance, on
 *   consumption, not on creation.
 *
 * Tie-break for events sharing an identical timestamp: `Array.prototype
 * .sort` is stable (guaranteed since ES2019), and events are pushed into
 * the pre-sort array in a fixed order — dues, then waivers, then
 * remittances, then credit consumptions. Two events with the same `at`
 * therefore always land in that same relative order across renders,
 * instead of flickering based on incidental array-scan order.
 */
export function buildBalanceEvents(detail: CommissionLedgerDetail): BalanceEvent[] {
  const dueEvents: BalanceEvent[] = detail.receivables.map((r) => ({
    id: `due:${r.id}`,
    at: r.createdAt,
    kind: 'DUE' as const,
    label: r.serviceName !== undefined ? `Commission due — ${r.serviceName}` : 'Commission due',
    bookingId: r.bookingId,
    changePaise: r.commissionDue,
    balancePaise: 0, // recomputed below once sorted
  }));

  const waiverEvents: BalanceEvent[] = detail.receivables
    .filter((r) => r.remittanceStatus === 'WAIVED')
    .map((r) => {
      const forgivenPaise = r.commissionDue - (r.remittedAmount ?? 0);
      return {
        id: `waiver:${r.id}`,
        at: r.updatedAt ?? r.createdAt,
        kind: 'WAIVER' as const,
        label: 'Commission waived',
        bookingId: r.bookingId,
        ...(r.waivedReason !== undefined ? { ref: r.waivedReason } : {}),
        ...(r.markedByAdminId !== undefined ? { actorId: r.markedByAdminId } : {}),
        changePaise: -forgivenPaise,
        balancePaise: 0,
      };
    });

  const remittanceEvents: BalanceEvent[] = detail.remittances.map((rem) => {
    const appliedPaise = rem.amountPaise - rem.creditCreatedPaise;
    const soleAllocation = rem.allocations.length === 1 ? rem.allocations[0] : undefined;
    return {
      id: `remittance:${rem.id}`,
      at: rem.createdAt,
      kind: 'REMITTANCE' as const,
      label: `Remittance recorded — ${rem.method}`,
      ...(soleAllocation !== undefined ? { bookingId: soleAllocation.bookingId } : {}),
      ref: rem.ref,
      actorId: rem.recordedByAdminId,
      changePaise: -appliedPaise,
      balancePaise: 0,
    };
  });

  const creditEvents: BalanceEvent[] = detail.credits.flatMap((credit) =>
    credit.consumedBy.map((consumption, index) => ({
      id: `credit:${credit.id}:${index}`,
      at: consumption.appliedAt,
      kind: 'CREDIT' as const,
      label: `Credit applied — ${credit.source}`,
      bookingId: consumption.bookingId,
      ref: credit.refId,
      changePaise: -consumption.paise,
      balancePaise: 0,
    })),
  );

  const events = [...dueEvents, ...waiverEvents, ...remittanceEvents, ...creditEvents];
  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  let runningBalance = 0;
  return events.map((event) => {
    runningBalance += event.changePaise;
    return { ...event, balancePaise: runningBalance };
  });
}

/**
 * Explains a technician's hold state in money terms — the one function in
 * this module allowed to produce a human-facing string, because it must
 * quote the actual thresholds involved. Formats every amount through
 * `formatINR`; never hand-format money.
 */
export function holdReason(hold: CommissionHold, thresholds: HoldThresholds, locale: string): string {
  if (hold === null) {
    return '';
  }
  const outstanding = formatINR(hold.outstandingPaise, locale);
  const bookingsWord = hold.dueCount === 1 ? 'booking' : 'bookings';
  switch (hold.state) {
    case 'BLOCKED': {
      const blockLimit = formatINR(thresholds.blockPaise, locale);
      return `Blocked: outstanding commission of ${outstanding} exceeds the ${blockLimit} block threshold (${hold.dueCount} ${bookingsWord} due).`;
    }
    case 'WARN': {
      const warnLimit = formatINR(thresholds.warnPaise, locale);
      return `Warning: outstanding commission of ${outstanding} has passed the ${warnLimit} warn threshold (${hold.dueCount} ${bookingsWord} due).`;
    }
    case 'CLEAR':
      return `Clear: outstanding commission of ${outstanding} (${hold.dueCount} ${bookingsWord} due).`;
    default:
      return `Outstanding commission of ${outstanding} (${hold.dueCount} ${bookingsWord} due).`;
  }
}

/**
 * Whether a dashboard row's cached hold figure is stale relative to `now`.
 * Takes `now` as a parameter (never reads the clock itself) so callers —
 * and tests — get a deterministic answer instead of one that depends on
 * when the function happens to run.
 */
export function isStale(row: { staleAfter: string }, now: Date): boolean {
  return now.getTime() > new Date(row.staleAfter).getTime();
}

/**
 * Counts how many technicians a *candidate* block threshold would affect,
 * and names a sample of them, so the settings screen can preview the blast
 * radius of a threshold change before it's saved. Takes only the two
 * fields it needs (not a full dashboard row) so callers — including tests
 * — can pass minimal fixtures.
 */
export function thresholdImpact(
  rows: Pick<CommissionDashboardRow, 'technicianName' | 'outstandingPaise'>[],
  blockThresholdPaise: number,
): { blockedCount: number; sample: string[] } {
  const blocked = rows.filter((row) => row.outstandingPaise >= blockThresholdPaise);
  const sample = blocked
    .slice()
    .sort((a, b) => b.outstandingPaise - a.outstandingPaise)
    .slice(0, THRESHOLD_IMPACT_SAMPLE_SIZE)
    .map((row) => row.technicianName);
  return { blockedCount: blocked.length, sample };
}
