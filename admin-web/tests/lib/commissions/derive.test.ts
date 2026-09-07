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

// Reconciliation fixture: one partially-remitted (still DUE) row, one
// WAIVED row that was partially remitted before being waived, and one
// fully REMITTED row. Chosen specifically to exercise the C1 regression
// (fix round 1 review) — a waived receivable's `remittedAmount` does not
// include the waiver itself, so a stack that only subtracts `repaidPaise`
// would show this technician as still owing the waived row's full
// commissionDue even though the server's own `outstandingPaise` is 0 for it.
const reconcileDetail = {
  technicianId: 't2',
  hold: null,
  receivables: [
    {
      id: 'rA',
      bookingId: 'rA',
      commissionDue: 10000,
      remittedAmount: 4000,
      remittanceStatus: 'DUE',
      createdAt: '2026-01-01T00:00:00.000Z',
      outstandingPaise: 6000,
    },
    {
      id: 'rB',
      bookingId: 'rB',
      commissionDue: 8000,
      remittedAmount: 2000,
      remittanceStatus: 'WAIVED',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-05T00:00:00.000Z',
      outstandingPaise: 0,
      waivedReason: 'goodwill',
      markedByAdminId: 'admin-2',
    },
    {
      id: 'rC',
      bookingId: 'rC',
      commissionDue: 5000,
      remittedAmount: 5000,
      remittanceStatus: 'REMITTED',
      createdAt: '2026-01-03T00:00:00.000Z',
      outstandingPaise: 0,
    },
  ],
  remittances: [
    {
      id: 'remA',
      amountPaise: 4000,
      method: 'UPI',
      ref: 'ref-a',
      allocations: [{ bookingId: 'rA', paise: 4000 }],
      creditCreatedPaise: 0,
      recordedByAdminId: 'admin-1',
      createdAt: '2026-01-01T01:00:00.000Z',
    },
    {
      id: 'remB',
      amountPaise: 2000,
      method: 'UPI',
      ref: 'ref-b',
      allocations: [{ bookingId: 'rB', paise: 2000 }],
      creditCreatedPaise: 0,
      recordedByAdminId: 'admin-1',
      createdAt: '2026-01-02T01:00:00.000Z',
    },
    {
      id: 'remC',
      amountPaise: 5000,
      method: 'UPI',
      ref: 'ref-c',
      allocations: [{ bookingId: 'rC', paise: 5000 }],
      creditCreatedPaise: 0,
      recordedByAdminId: 'admin-1',
      createdAt: '2026-01-03T01:00:00.000Z',
    },
  ],
  credits: [],
  cashCollectedPaise: 11000,
  creditAppliedPaise: 0,
} as unknown as CommissionLedgerDetail;

describe('buildBalanceStack', () => {
  it('balance stack states commission due, what was repaid, what was waived, and the balance', () => {
    expect(buildBalanceStack(detail)).toEqual({
      commissionDuePaise: 26956,
      repaidPaise: 13478,
      waivedPaise: 0,
      balancePaise: 13478,
      creditAppliedPaise: 0,
    });
  });

  it('balance stack is invariant to cashCollectedPaise — cash is evidence, not a balance line', () => {
    // A `not.toContain` check on the raw cash figure cannot do this job: on
    // real data, when remittances are fully allocated, repaidPaise
    // legitimately *equals* cashCollectedPaise by coincidence, and such a
    // check would misfire on correct code. A perturbation test is immune
    // to that — it proves the value is never read, not merely that it
    // doesn't happen to match a line today.
    expect(buildBalanceStack({ ...detail, cashCollectedPaise: 999_999_999 })).toEqual(
      buildBalanceStack(detail),
    );
  });

  it('reconciles to the server truth across DUE, REMITTED, and WAIVED rows (regression: a waived row must not read as still owed)', () => {
    expect(buildBalanceStack(reconcileDetail).balancePaise).toBe(
      reconcileDetail.receivables.reduce((sum, r) => sum + r.outstandingPaise, 0),
    );
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

  it('the last balance event matches the balance stack total, including a waived row', () => {
    const events = buildBalanceEvents(reconcileDetail);
    expect(events.at(-1)?.balancePaise).toBe(buildBalanceStack(reconcileDetail).balancePaise);
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
