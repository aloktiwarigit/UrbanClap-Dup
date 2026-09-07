import { describe, it, expect } from 'vitest';
import {
  buildBalanceStack,
  buildBalanceEvents,
  holdReason,
  isStale,
  thresholdImpact,
} from '@/lib/commissions/derive';
import type { CommissionLedgerDetail } from '@/api/commissions';

// Fixture deliberately carries only the fields these derive functions read —
// not every required field of the generated CommissionLedgerDetail schema
// (e.g. partitionKey, serviceId, categoryId, bookingAmount, commissionBps,
// commissionResolvedFrom, docType). Cast through `unknown` rather than
// hand-declaring a parallel interface, per the task-5 brief.
const detail = {
  technicianId: 't1',
  hold: null,
  receivables: [
    {
      id: 'b1',
      bookingId: 'b1',
      commissionDue: 13478,
      remittedAmount: 0,
      remittanceStatus: 'DUE',
      createdAt: '2026-05-08T04:57:40.119Z',
      outstandingPaise: 13478,
      serviceName: 'AC Deep Clean',
    },
    {
      id: 'b2',
      bookingId: 'b2',
      commissionDue: 13478,
      remittedAmount: 13478,
      remittanceStatus: 'REMITTED',
      createdAt: '2026-05-09T03:26:15.061Z',
      outstandingPaise: 0,
      serviceName: 'AC Deep Clean',
    },
  ],
  remittances: [
    {
      id: 'rem:k1',
      amountPaise: 13478,
      method: 'UPI',
      ref: 'upi-1',
      allocations: [{ bookingId: 'b2', paise: 13478 }],
      creditCreatedPaise: 0,
      recordedByAdminId: 'admin-1',
      createdAt: '2026-09-02T10:00:00.000Z',
    },
  ],
  credits: [],
  cashCollectedPaise: 619300,
  creditAppliedPaise: 0,
} as unknown as CommissionLedgerDetail;

describe('buildBalanceStack', () => {
  it('balance stack states commission due, what was repaid, what was credited, and the balance', () => {
    expect(buildBalanceStack(detail)).toEqual({
      commissionDuePaise: 26956,
      repaidPaise: 13478,
      creditedPaise: 0,
      balancePaise: 13478,
    });
  });

  it('balance stack never includes cashCollectedPaise in any line', () => {
    const stack = buildBalanceStack(detail);
    expect(Object.values(stack)).not.toContain(detail.cashCollectedPaise);
    // Cash is evidence for why commission exists, not a balance line. Guarding this
    // in a test because it is the single easiest mistake to make on this screen.
    expect(stack.balancePaise).toBe(stack.commissionDuePaise - stack.repaidPaise - stack.creditedPaise);
  });
});

describe('buildBalanceEvents', () => {
  it('balance events run chronologically with a correct running balance', () => {
    const events = buildBalanceEvents(detail);
    expect(events.map((e) => [e.kind, e.changePaise, e.balancePaise])).toEqual([
      ['DUE', 13478, 13478],
      ['DUE', 13478, 26956],
      ['REMITTANCE', -13478, 13478],
    ]);
  });

  it('balance events carry the booking id and the reference for a dispute call', () => {
    const events = buildBalanceEvents(detail);
    expect(events[0]).toMatchObject({ bookingId: 'b1' });
    expect(events[2]).toMatchObject({ ref: 'upi-1', actorId: 'admin-1' });
  });
});

describe('holdReason', () => {
  it('holdReason explains a BLOCKED state in money terms', () => {
    const reason = holdReason(
      { state: 'BLOCKED', outstandingPaise: 524000, dueCount: 3, evaluatedAt: 'x' },
      { warnPaise: 250000, blockPaise: 500000 },
      'en',
    );
    expect(reason).toContain('₹5,240.00');
    expect(reason).toContain('₹5,000.00');
  });
});

describe('isStale', () => {
  it('isStale is true only past staleAfter', () => {
    expect(isStale({ staleAfter: '2026-09-07T12:00:00.000Z' }, new Date('2026-09-07T11:59:00.000Z'))).toBe(
      false,
    );
    expect(isStale({ staleAfter: '2026-09-07T12:00:00.000Z' }, new Date('2026-09-07T12:01:00.000Z'))).toBe(
      true,
    );
  });
});

describe('thresholdImpact', () => {
  it('thresholdImpact counts who would be blocked at a candidate threshold', () => {
    const rows = [
      { technicianName: 'Ramesh', outstandingPaise: 139346 },
      { technicianName: 'Suresh', outstandingPaise: 20206 },
    ];
    expect(thresholdImpact(rows, 500000)).toEqual({ blockedCount: 0, sample: [] });
    expect(thresholdImpact(rows, 100000)).toEqual({ blockedCount: 1, sample: ['Ramesh'] });
  });
});
