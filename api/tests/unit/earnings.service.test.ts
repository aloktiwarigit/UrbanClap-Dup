// P0-1 — Unit tests for the single shared definition of technician earnings.
//
// Both `GET /v1/technicians/me/earnings` and `GET /v1/technicians/me/dashboard`
// build their numbers from these functions, so pinning the behaviour here is what
// stops the two surfaces disagreeing again.

import { describe, it, expect } from 'vitest';
import {
  buildEarningEvents,
  sumNetForIstDate,
  toIstDateStr,
  IST_OFFSET_MS,
} from '../../src/services/earnings.service.js';
import type { WalletLedgerEntry } from '../../src/schemas/wallet-ledger.js';
import type { CommissionReceivableEntry } from '../../src/schemas/commission-receivable.js';

function receivable(
  bookingId: string,
  createdAt: string,
  bookingAmount: number,
  commissionDue: number,
  remittanceStatus: 'DUE' | 'REMITTED' | 'WAIVED' = 'DUE',
): CommissionReceivableEntry {
  return {
    id: bookingId,
    bookingId,
    technicianId: 'tech-1',
    partitionKey: 'tech-1',
    serviceId: 'ac-deep-clean',
    categoryId: 'ac-repair',
    bookingAmount,
    commissionBps: 2200,
    commissionDue,
    commissionResolvedFrom: 'GLOBAL',
    remittanceStatus,
    createdAt,
  } as CommissionReceivableEntry;
}

function ledger(
  bookingId: string,
  createdAt: string,
  techAmount: number,
  payoutStatus: 'PENDING' | 'PAID' | 'FAILED' = 'PAID',
): WalletLedgerEntry {
  return {
    id: bookingId,
    bookingId,
    technicianId: 'tech-1',
    partitionKey: 'tech-1',
    bookingAmount: techAmount + 10000,
    completedJobCountAtSettlement: 1,
    commissionBps: 2200,
    commissionAmount: 10000,
    techAmount,
    payoutStatus,
    createdAt,
  } as WalletLedgerEntry;
}

describe('IST helpers', () => {
  it('IST_OFFSET_MS is +5:30', () => {
    expect(IST_OFFSET_MS).toBe(19_800_000);
  });

  it('maps a late-evening UTC timestamp onto the next IST calendar day', () => {
    // 2026-04-14T20:00Z is 2026-04-15T01:30 IST.
    expect(toIstDateStr('2026-04-14T20:00:00.000Z')).toBe('2026-04-15');
  });

  it('keeps an early-evening UTC timestamp on the same IST day', () => {
    // 2026-04-14T17:00Z is 2026-04-14T22:30 IST.
    expect(toIstDateStr('2026-04-14T17:00:00.000Z')).toBe('2026-04-14');
  });
});

describe('buildEarningEvents', () => {
  const T = '2026-04-15T06:00:00.000Z';

  it('nets commission off a cash job — the technician keeps the difference', () => {
    const events = buildEarningEvents([], [receivable('bk-1', T, 99900, 21978)]);

    expect(events).toEqual([{ bookingId: 'bk-1', createdAt: T, netPaise: 77922 }]);
  });

  it('takes techAmount as-is for a Razorpay-era ledger row', () => {
    const events = buildEarningEvents([ledger('bk-1', T, 40000)], []);

    expect(events[0]?.netPaise).toBe(40000);
  });

  it('unions both ledgers', () => {
    const events = buildEarningEvents(
      [ledger('bk-rzp', T, 40000)],
      [receivable('bk-cash', T, 50000, 11000)],
    );

    expect(events).toHaveLength(2);
    expect(events.reduce((s, e) => s + e.netPaise, 0)).toBe(79000);
  });

  it('drops FAILED payouts — that money never reached the technician', () => {
    expect(buildEarningEvents([ledger('bk-1', T, 40000, 'FAILED')], [])).toEqual([]);
  });

  it('keeps PENDING payouts — held is not lost', () => {
    expect(buildEarningEvents([ledger('bk-1', T, 40000, 'PENDING')], [])).toHaveLength(1);
  });

  it('counts a booking once when it appears in both ledgers, preferring the cash model', () => {
    const events = buildEarningEvents(
      [ledger('bk-dupe', T, 40000)],
      [receivable('bk-dupe', T, 50000, 11000)],
    );

    expect(events).toHaveLength(1);
    expect(events[0]?.netPaise).toBe(39000);
  });

  it('counts REMITTED and WAIVED receivables at their original charge', () => {
    // Settling or forgiving commission later must not rewrite history.
    const events = buildEarningEvents([], [
      receivable('bk-1', T, 50000, 11000, 'REMITTED'),
      receivable('bk-2', T, 50000, 11000, 'WAIVED'),
    ]);

    expect(events).toHaveLength(2);
    expect(events.every((e) => e.netPaise === 39000)).toBe(true);
  });

  it('returns an empty list for a technician with no history', () => {
    expect(buildEarningEvents([], [])).toEqual([]);
  });

  // cashCollectedAmount is absent in production until the technician app starts
  // sending it (P0-2), but the schema allows it to differ from the booked amount.
  it('prefers what was actually collected over what was booked', () => {
    const short = { ...receivable('bk-1', T, 99900, 21978), cashCollectedAmount: 80000 };
    const events = buildEarningEvents([], [short as CommissionReceivableEntry]);

    expect(events[0]?.netPaise).toBe(80000 - 21978);
  });

  it('falls back to the booked amount when nothing was recorded', () => {
    const events = buildEarningEvents([], [receivable('bk-1', T, 99900, 21978)]);

    expect(events[0]?.netPaise).toBe(99900 - 21978);
  });

  it('clamps at zero when the collection is smaller than the commission owed', () => {
    // Would otherwise be negative, and TechnicianDashboardResponseSchema declares
    // todayEarningsInPaise nonnegative AND parses it — an unclamped negative would
    // 500 the technician's dashboard rather than merely look wrong.
    const barely = { ...receivable('bk-1', T, 99900, 21978), cashCollectedAmount: 1000 };
    const events = buildEarningEvents([], [barely as CommissionReceivableEntry]);

    expect(events[0]?.netPaise).toBe(0);
  });

  it('clamping never turns a whole period negative', () => {
    const bad = { ...receivable('bk-bad', T, 99900, 21978), cashCollectedAmount: 0 };
    const good = receivable('bk-good', T, 50000, 11000);
    const total = buildEarningEvents([], [bad as CommissionReceivableEntry, good])
      .reduce((sum, e) => sum + e.netPaise, 0);

    expect(total).toBe(39000);
    expect(total).toBeGreaterThanOrEqual(0);
  });
});

describe('sumNetForIstDate', () => {
  it('sums only the events falling on that IST calendar day', () => {
    const events = buildEarningEvents([], [
      receivable('bk-today', '2026-04-15T06:00:00.000Z', 50000, 11000),
      // 01:30 IST on the 15th — same IST day despite the UTC date being the 14th.
      receivable('bk-late', '2026-04-14T20:00:00.000Z', 50000, 11000),
      // 22:30 IST on the 14th — previous IST day.
      receivable('bk-prev', '2026-04-14T17:00:00.000Z', 50000, 11000),
    ]);

    expect(sumNetForIstDate(events, '2026-04-15')).toBe(2 * 39000);
    expect(sumNetForIstDate(events, '2026-04-14')).toBe(39000);
  });

  it('is zero for a day with no jobs', () => {
    expect(sumNetForIstDate([], '2026-04-15')).toBe(0);
  });
});
