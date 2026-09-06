/**
 * E21-S02: pure builder for the technician-facing GET /v1/technicians/me/commission-due
 * response (v2). Takes the full per-technician ledger (receivables + remittances + credits),
 * the cached commission hold, and the effective commission config, and assembles the response
 * the technician app renders as a wallet. No I/O here — the handler owns fetching the inputs.
 */
import { outstandingOf, type CommissionReceivableEntry, type TechnicianCommissionDueV2 } from '../schemas/commission-receivable.js';
import type { RemittanceDoc, CreditDoc } from '../schemas/commission-ledger.js';
import type { CommissionHold } from '../schemas/technician.js';
import type { EffectiveCommissionConfig } from '../schemas/commission-config.js';
import { istWeekStart } from '../lib/ist-time.js';

export interface BuildCommissionDueInput {
  ledger: {
    receivables: CommissionReceivableEntry[];
    remittances: RemittanceDoc[];
    credits: CreditDoc[];
  };
  hold: CommissionHold | null;
  cfg: EffectiveCommissionConfig;
  now: Date;
}

function byCreatedAtDesc<T extends { createdAt: string }>(a: T, b: T): number {
  return b.createdAt.localeCompare(a.createdAt);
}

export function buildCommissionDueResponse(input: BuildCommissionDueInput): TechnicianCommissionDueV2 {
  const { ledger, hold, cfg, now } = input;
  const { receivables, remittances, credits } = ledger;

  // Outstanding = money still owed to the platform. Only DUE rows carry outstanding balance —
  // REMITTED is settled and WAIVED was written off; both must never inflate the wallet total.
  const dueReceivables = receivables.filter((r) => r.remittanceStatus === 'DUE');
  const totalOutstandingPaise = dueReceivables.reduce((sum, r) => sum + outstandingOf(r), 0);
  // A row can be status DUE with outstandingOf === 0 (e.g. remitted/credited to exactly
  // commissionDue but not yet transitioned) — that must not count as "a due job" in the UI badge.
  const dueCount = dueReceivables.filter((r) => outstandingOf(r) > 0).length;

  const entries = [...receivables].sort(byCreatedAtDesc).map((r) => ({
    bookingId: r.bookingId,
    ...(r.serviceName !== undefined ? { serviceName: r.serviceName } : {}),
    ...(r.slotDate !== undefined ? { slotDate: r.slotDate } : {}),
    bookingAmount: r.bookingAmount,
    ...(r.cashCollectedAmount !== undefined ? { cashCollectedAmount: r.cashCollectedAmount } : {}),
    commissionDue: r.commissionDue,
    remittedAmount: r.remittedAmount ?? 0,
    outstandingPaise: outstandingOf(r),
    ...(r.collectionMethod !== undefined ? { collectionMethod: r.collectionMethod } : {}),
    remittanceStatus: r.remittanceStatus,
    createdAt: r.createdAt,
  }));

  const remittancesOut = [...remittances].sort(byCreatedAtDesc).map((r) => ({
    id: r.id,
    amountPaise: r.amountPaise,
    method: r.method,
    ref: r.ref,
    createdAt: r.createdAt,
  }));

  // Oldest-first: credits are consumed oldest-first (consumePendingCredits), so surfacing them
  // in that same order lets the technician read the wallet as "what gets used up next".
  const creditsOut = credits
    .filter((c) => c.remainingPaise > 0)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((c) => ({ id: c.id, source: c.source, remainingPaise: c.remainingPaise, createdAt: c.createdAt }));

  const overrideActive = hold?.override !== undefined && new Date(hold.override.until) > now;
  const holdOut: TechnicianCommissionDueV2['hold'] = {
    state: hold?.state ?? 'CLEAR',
    warnPaise: cfg.warnThresholdPaise,
    blockPaise: cfg.blockThresholdPaise,
    enforcementEnabled: cfg.holdEnforcementEnabled,
    ...(overrideActive ? { override: { until: hold!.override!.until, reason: hold!.override!.reason } } : {}),
  };

  const weekStartIso = istWeekStart(now).toISOString();
  const weekReceivables = receivables.filter((r) => r.createdAt >= weekStartIso);
  const cashCollectedPaise = weekReceivables.reduce(
    (sum, r) => sum + (r.cashCollectedAmount ?? r.bookingAmount),
    0,
  );
  const commissionPaise = weekReceivables.reduce((sum, r) => sum + r.commissionDue, 0);
  const netPaise = Math.max(0, cashCollectedPaise - commissionPaise);

  return {
    totalOutstandingPaise,
    dueCount,
    hold: holdOut,
    entries,
    remittances: remittancesOut,
    credits: creditsOut,
    weekSummary: {
      weekStart: weekStartIso,
      jobs: weekReceivables.length,
      cashCollectedPaise,
      commissionPaise,
      netPaise,
    },
  };
}
