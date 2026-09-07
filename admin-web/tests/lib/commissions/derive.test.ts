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
//
// Row rA's 4000 remitted is deliberately split across a real remittance
// (2500, via `remA`) and an INCENTIVE-source credit consumption (1500, via
// `credit-inc-1`), with `creditAppliedPaise: 1500` on the detail — this is
// the C2 regression guard (fix round 2 review): both fixtures in round 1
// had `creditAppliedPaise: 0` and `credits: []`, so a reintroduced
// `- creditAppliedPaise` in `buildBalanceStack` would still have passed
// every test. With a genuine non-zero `creditAppliedPaise` here, that
// regression would pull `balancePaise` away from `Σ outstandingPaise` and
// the reconciliation test below would catch it.
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
      allocations: [
        { id: 'alloc-a1', source: 'REMITTANCE', refId: 'remA', paise: 2500, appliedAt: '2026-01-01T01:00:00.000Z', byId: 'admin-1' },
        { id: 'alloc-a2', source: 'INCENTIVE', refId: 'credit-inc-1', paise: 1500, appliedAt: '2026-01-01T00:30:00.000Z', byId: 'admin-3' },
      ],
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
      amountPaise: 2500,
      method: 'UPI',
      ref: 'ref-a',
      allocations: [{ bookingId: 'rA', paise: 2500 }],
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
  credits: [
    {
      id: 'credit-inc-1',
      source: 'INCENTIVE',
      refId: 'incentive-run-9',
      originalPaise: 1500,
      remainingPaise: 0,
      consumedBy: [{ bookingId: 'rA', paise: 1500, appliedAt: '2026-01-01T00:30:00.000Z' }],
      createdAt: '2025-12-28T00:00:00.000Z',
    },
  ],
  cashCollectedPaise: 9500,
  creditAppliedPaise: 1500,
} as unknown as CommissionLedgerDetail;

// A REMITTED row can carry rounding residue: the retired E21-S01 remit
// endpoint stored the admin-entered amount verbatim and only rejected
// amounts below the due, so a technician who paid a rounded ₹135.00
// against a ₹134.78 due settles as `remitted 13500 / status REMITTED`.
// The server's outstandingPaise is 0 regardless — it gates on `=== 'DUE'`,
// not on the arithmetic residue. This is the C3 regression fixture.
const overSettledDetail = {
  technicianId: 't3',
  hold: null,
  receivables: [
    {
      id: 'rD',
      bookingId: 'rD',
      commissionDue: 13478,
      remittedAmount: 13500,
      remittanceStatus: 'REMITTED',
      createdAt: '2026-02-01T00:00:00.000Z',
      outstandingPaise: 0,
    },
  ],
  remittances: [],
  credits: [],
  cashCollectedPaise: 13500,
  creditAppliedPaise: 0,
} as unknown as CommissionLedgerDetail;

describe('buildBalanceStack', () => {
  it('balance stack states commission due, what was repaid, what was settled, and the balance', () => {
    expect(buildBalanceStack(detail)).toEqual({
      commissionDuePaise: 26956,
      repaidPaise: 13478,
      settledPaise: 0,
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
    // doesn't happen to match a line today. Perturbed twice — once to a
    // large value, once to zero — so neither a straight pass-through nor a
    // clamp/predicate read of cashCollectedPaise could slip past unnoticed.
    expect(buildBalanceStack({ ...detail, cashCollectedPaise: 999_999_999 })).toEqual(
      buildBalanceStack(detail),
    );
    expect(buildBalanceStack({ ...detail, cashCollectedPaise: 0 })).toEqual(buildBalanceStack(detail));
  });

  it('reconciles to the server truth across DUE, REMITTED, and WAIVED rows, with a non-zero creditAppliedPaise in play (regression: a waived row must not read as still owed, and creditAppliedPaise must not be double-subtracted)', () => {
    expect(buildBalanceStack(reconcileDetail).balancePaise).toBe(
      reconcileDetail.receivables.reduce((sum, r) => sum + r.outstandingPaise, 0),
    );
  });

  it('a REMITTED row with rounding residue (remitted > due) reads as fully settled, not still owed (regression: the server gates on state === "DUE", not state !== "WAIVED")', () => {
    const stack = buildBalanceStack(overSettledDetail);
    expect(stack.balancePaise).toBe(0);
    expect(stack.balancePaise).toBe(
      overSettledDetail.receivables.reduce((sum, r) => sum + r.outstandingPaise, 0),
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

  it('the last balance event matches the balance stack total when remittances[] and credits[] fully account for remittedAmount (including a waived row and a credit-consumption event)', () => {
    // This equality is NOT a general invariant — see the KNOWN LIMITATION
    // comment on buildBalanceEvents. It holds here specifically because
    // every paise of every receivable's remittedAmount in this fixture is
    // backed by an actual remittance or credit document. A legacy
    // receivable with remittedAmount set but no corresponding document
    // (e.g. a pre-ledger backfill) would make the events trail's total
    // diverge from the stack's total — deliberately: this module does not
    // synthesise events to force the two to agree.
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

  it('fails closed on an unparseable staleAfter — a corrupt row reads as stale, not fresh', () => {
    expect(isStale({ staleAfter: 'not-a-date' }, new Date('2026-09-07T12:00:00.000Z'))).toBe(true);
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
