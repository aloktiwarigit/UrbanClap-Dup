/**
 * Pure derivation library for the admin commission console. No React, no
 * fetch — just arithmetic and shaping over the server-computed ledger
 * (`CommissionLedgerDetail`) and dashboard rows. Every screen's numbers
 * come from these functions so the money logic exists in exactly one place.
 *
 * Binding rule from the design spec: `cashCollectedPaise` is evidence for
 * *why* a commission exists (money that passed through the technician's
 * hands at the customer's door) — it is never a balance line.
 * `buildBalanceStack` must never fold `cashCollectedPaise` into any of its
 * outputs.
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
  waivedPaise: number;
  balancePaise: number;
  // Informational only — never subtracted here. `remittedAmount` on each
  // receivable already folds in every non-waiver allocation, credit
  // consumptions included (`consumePendingCredits` writes those allocations
  // with source `'REMITTANCE'`), so `repaidPaise` above already reflects
  // them. Subtracting this too would double-count. Exposed so the UI can
  // annotate the repayments line ("includes ₹X applied from credit")
  // without folding it into the arithmetic.
  creditAppliedPaise: number;
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
 * The accounting stack a technician's ledger detail resolves to. Built to
 * reconcile to the server's own truth by construction — for every
 * receivable regardless of status (DUE, REMITTED, or WAIVED), this
 * identity holds:
 *
 *   balancePaise === Σ receivables[].outstandingPaise
 *
 * `commissionDuePaise` sums every receivable's `commissionDue`.
 * `repaidPaise` sums `remittedAmount ?? 0` — the server's own aggregate of
 * every non-waiver allocation against that receivable (cash and incentive
 * alike; `mergeAllocation` excludes only WAIVER allocations from this sum).
 * `waivedPaise` separately sums, for receivables the server marked WAIVED,
 * whatever was still outstanding at the moment of waiver
 * (`commissionDue - (remittedAmount ?? 0)`) — this line is required
 * because a waived receivable's `remittedAmount` does NOT include the
 * waiver itself, so without it a forgiven balance would still read as
 * owed. `balancePaise` is `commissionDuePaise - repaidPaise - waivedPaise`.
 *
 * `creditAppliedPaise` is carried through as an informational field only
 * (see its doc comment) — never subtracted here, to avoid double-counting
 * credit consumptions already folded into `repaidPaise`.
 *
 * `cashCollectedPaise` never enters this function at all — it is not read
 * anywhere in this body, by construction, not by convention.
 */
export function buildBalanceStack(detail: CommissionLedgerDetail): BalanceStack {
  const commissionDuePaise = detail.receivables.reduce((sum, r) => sum + r.commissionDue, 0);
  const repaidPaise = detail.receivables.reduce((sum, r) => sum + (r.remittedAmount ?? 0), 0);
  const waivedPaise = detail.receivables
    .filter((r) => r.remittanceStatus === 'WAIVED')
    .reduce((sum, r) => sum + (r.commissionDue - (r.remittedAmount ?? 0)), 0);
  const balancePaise = commissionDuePaise - repaidPaise - waivedPaise;
  return { commissionDuePaise, repaidPaise, waivedPaise, balancePaise, creditAppliedPaise: detail.creditAppliedPaise };
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
 * Tie-break for events sharing an identical timestamp: after comparing
 * `at`, ties are broken by `id.localeCompare` — a stable secondary key
 * derived from each record's own permanent id, not from array-scan order.
 * This matters because the upstream arrays are not reliably ordered
 * either: the server's own comparators for receivables and remittances
 * also return 0 on equal `createdAt` and fall through to raw Cosmos
 * iteration order (which is not guaranteed stable across reads), and
 * `credits` is not sorted by the server at all. Relying on input-array
 * order for the tie-break would let the running balance's intermediate
 * values (though never its final total) flicker between renders. Sorting
 * by `id` instead ties the order to something that never changes.
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
        // `-forgivenPaise || 0` rather than bare `-forgivenPaise`: when a
        // waived receivable was already fully remitted (forgivenPaise === 0,
        // an edge case but a real one), negating a literal 0 produces -0.
        // -0 === 0 arithmetically, but it can render as the literal text
        // "-0" wherever this value is stringified — `|| 0` collapses the
        // falsy -0 back to a plain 0 before it reaches a screen.
        changePaise: -forgivenPaise || 0,
        balancePaise: 0,
      };
    });

  const remittanceEvents: BalanceEvent[] = detail.remittances.map((rem) => {
    // `?? 0` defends against a historical/malformed remittance record
    // missing this field despite the schema declaring it required — one
    // `undefined` here would turn `appliedPaise` into `NaN`, and every
    // event from that point in the running-balance accumulation onward
    // would render as NaN on the audit trail.
    const appliedPaise = rem.amountPaise - (rem.creditCreatedPaise ?? 0);
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
  events.sort((a, b) => {
    const byTime = new Date(a.at).getTime() - new Date(b.at).getTime();
    return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
  });

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
 *
 * Fails closed: an unparseable `staleAfter` (a corrupt or malformed row)
 * is treated as stale rather than fresh. `new Date(invalid).getTime()` is
 * `NaN`, and every comparison against `NaN` is `false` — a naive
 * `now > staleAfterTime` would silently read a corrupt row as "not stale"
 * and let the UI show a cached figure nobody can vouch for.
 */
export function isStale(row: { staleAfter: string }, now: Date): boolean {
  const staleAfterTime = new Date(row.staleAfter).getTime();
  if (Number.isNaN(staleAfterTime)) {
    return true;
  }
  return now.getTime() > staleAfterTime;
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
