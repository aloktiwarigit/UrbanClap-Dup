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
 *
 * i18n rule: this module stays pure and testable, so no function here ever
 * returns a rendered, human-facing sentence — `hi` is the product's default
 * locale and every user-facing string must go through next-intl. `holdReason`
 * and `buildBalanceEvents` both produce human-facing copy (a hold's plain-
 * language explanation, and each balance event's row label); both return a
 * translation key plus params rather than a formatted string, and the caller
 * (a component that already holds a `useTranslations` instance) translates it
 * at render time. `formatINR`-formatted money strings are the exception — a
 * locale-aware number format is data shaping, not a sentence, so those are
 * still produced here and passed through as params.
 */
import { formatINR } from '@/lib/format/intl';
import type { CommissionDashboardRow, CommissionLedgerDetail } from '@/api/commissions';

export interface BalanceStack {
  commissionDuePaise: number;
  repaidPaise: number;
  settledPaise: number;
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
  // Translation key (under the `commissions` namespace) plus its interpolation params, NOT a
  // rendered string — translate with `t(labelKey, labelParams)` at the call site. See the
  // module-level i18n rule above.
  labelKey: string;
  labelParams?: Record<string, string>;
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
 * reconcile to the server's own truth by construction. The server computes
 * each receivable's own outstanding as:
 *
 *   outstandingPaise = remittanceStatus === 'DUE'
 *     ? Math.max(0, commissionDue - (remittedAmount ?? 0))
 *     : 0
 *
 * — note it gates on `=== 'DUE'`, not `!== 'WAIVED'`: a REMITTED row is
 * also defined to have zero outstanding, even if `commissionDue -
 * remittedAmount` isn't exactly zero (reachable on real data — the retired
 * E21-S01 remit endpoint stored the admin-entered amount verbatim and only
 * rejected amounts *below* the due, so a rounded overpayment like
 * `due 13478 / remitted 13500 / status REMITTED` is a real shape). This
 * function's `balancePaise` matches that sum exactly:
 *
 *   balancePaise === Σ receivables[].outstandingPaise
 *
 * `commissionDuePaise` sums every receivable's `commissionDue`.
 * `repaidPaise` sums `remittedAmount ?? 0` — the server's own aggregate of
 * every non-waiver allocation against that receivable (cash and incentive
 * alike; `mergeAllocation` excludes only WAIVER allocations from this sum).
 * `settledPaise` sums, for every receivable whose status is NOT `'DUE'`
 * (REMITTED and WAIVED alike), whatever residue is left in
 * `commissionDue - (remittedAmount ?? 0)` — both a waived row's forgiven
 * remainder and an over/under-settled REMITTED row's rounding residue,
 * because the server treats both the same way: zero outstanding,
 * unconditionally, once a row leaves `'DUE'`. `commissionDuePaise -
 * repaidPaise - settledPaise` collapses algebraically to
 * `Σ_{DUE rows} (commissionDue - remittedAmount)` — the server's own
 * expression, restricted to `DUE` rows.
 *
 * `balancePaise` itself is computed directly as that same expression
 * — `Σ_{DUE rows} Math.max(0, commissionDue - (remittedAmount ?? 0))` —
 * rather than via the subtraction above, so the `Math.max(0, …)` clamp
 * applies per row exactly as the server applies it. The two derivations
 * agree whenever no `DUE` row has `remittedAmount` exceeding
 * `commissionDue`; computing `balancePaise` directly means a pathological
 * DUE row (a partial-remittance data-entry error) can't push the balance
 * negative even though the un-clamped subtraction would still be `due -
 * repaid - settled` in every other respect.
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
  const settledPaise = detail.receivables
    .filter((r) => r.remittanceStatus !== 'DUE')
    .reduce((sum, r) => sum + (r.commissionDue - (r.remittedAmount ?? 0)), 0);
  const balancePaise = detail.receivables
    .filter((r) => r.remittanceStatus === 'DUE')
    .reduce((sum, r) => sum + Math.max(0, r.commissionDue - (r.remittedAmount ?? 0)), 0);
  return {
    commissionDuePaise,
    repaidPaise,
    settledPaise,
    balancePaise,
    creditAppliedPaise: detail.creditAppliedPaise,
  };
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
 * by `id` instead ties the order to something that never changes. An `at`
 * that fails to parse (`NaN` from `new Date(...)`) sorts after every
 * parseable timestamp rather than comparing as equal to everything — the
 * default `NaN` comparator result would otherwise silently fall back to
 * push order for that event, undermining the id-based tie-break above.
 *
 * KNOWN LIMITATION: this function's running-balance total will diverge
 * from `buildBalanceStack`'s `balancePaise` for a technician whose
 * `receivables[]` include a row with `remittedAmount` set but with no
 * corresponding document in `remittances[]` or `credits[]` — e.g. a
 * legacy/backfilled receivable. `buildBalanceStack` reads `remittedAmount`
 * directly, but this function can only build a REMITTANCE or CREDIT event
 * from an actual remittance/credit *document*; it deliberately does not
 * synthesise an event to make the trail's total agree with the stack's
 * total, since inventing a ledger row nobody recorded is worse than the
 * two numbers disagreeing honestly. As of 2026-09-07 this is unreachable
 * in production (the `commission_receivables` container is new and every
 * backfilled row has `remittedAmount` absent) but callers should not rely
 * on that staying true — do not assume `buildBalanceEvents(d).at(-1)
 * ?.balancePaise === buildBalanceStack(d).balancePaise` for arbitrary `d`.
 */
export function buildBalanceEvents(detail: CommissionLedgerDetail): BalanceEvent[] {
  const dueEvents: BalanceEvent[] = detail.receivables.map((r) => ({
    id: `due:${r.id}`,
    at: r.createdAt,
    kind: 'DUE' as const,
    ...(r.serviceName !== undefined
      ? { labelKey: 'detail.events.labels.dueWithService', labelParams: { serviceName: r.serviceName } }
      : { labelKey: 'detail.events.labels.due' }),
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
        labelKey: 'detail.events.labels.waiver',
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
      labelKey: 'detail.events.labels.remittance',
      labelParams: { method: rem.method },
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
      labelKey: 'detail.events.labels.credit',
      labelParams: { source: credit.source },
      bookingId: consumption.bookingId,
      ref: credit.refId,
      changePaise: -consumption.paise,
      balancePaise: 0,
    })),
  );

  const events = [...dueEvents, ...waiverEvents, ...remittanceEvents, ...creditEvents];
  events.sort((a, b) => {
    const aTime = new Date(a.at).getTime();
    const bTime = new Date(b.at).getTime();
    const aValid = !Number.isNaN(aTime);
    const bValid = !Number.isNaN(bTime);
    if (aValid && bValid) {
      const byTime = aTime - bTime;
      return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
    }
    // Fail closed rather than returning NaN (which every sort engine
    // treats as "equal", silently reintroducing the push-order dependence
    // the id tie-break above exists to remove): an event with an
    // unparseable `at` always sorts after every event with a valid one.
    if (aValid !== bValid) {
      return aValid ? -1 : 1;
    }
    return a.id.localeCompare(b.id);
  });

  let runningBalance = 0;
  return events.map((event) => {
    runningBalance += event.changePaise;
    return { ...event, balancePaise: runningBalance };
  });
}

/** A translation key plus its interpolation params — see the module-level i18n rule above. */
export interface HoldReasonMessage {
  key: string;
  params: { outstanding: string; count: number; limit?: string };
}

/**
 * Explains a technician's hold state in money terms. Quotes the actual thresholds involved, so it
 * still formats every amount through `formatINR` (locale-aware number formatting, not a sentence)
 * — but it does NOT assemble the surrounding sentence itself. It returns a translation key plus
 * params; the caller (which already holds a `useTranslations('commissions')` instance) translates
 * it, so the sentence goes through `hi.json`/`en.json` like every other user-facing string
 * instead of always rendering in English regardless of locale.
 */
export function holdReason(
  hold: CommissionHold,
  thresholds: HoldThresholds,
  locale: string,
): HoldReasonMessage | null {
  if (hold === null) {
    return null;
  }
  const outstanding = formatINR(hold.outstandingPaise, locale);
  switch (hold.state) {
    case 'BLOCKED':
      return {
        key: 'detail.hold.reason.blocked',
        params: { outstanding, limit: formatINR(thresholds.blockPaise, locale), count: hold.dueCount },
      };
    case 'WARN':
      return {
        key: 'detail.hold.reason.warn',
        params: { outstanding, limit: formatINR(thresholds.warnPaise, locale), count: hold.dueCount },
      };
    case 'CLEAR':
      return { key: 'detail.hold.reason.clear', params: { outstanding, count: hold.dueCount } };
    default:
      return { key: 'detail.hold.reason.default', params: { outstanding, count: hold.dueCount } };
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
