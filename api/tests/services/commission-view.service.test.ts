import { describe, it, expect } from 'vitest';
import { buildCommissionDueResponse } from '../../src/services/commission-view.service.js';
import { istWeekStart } from '../../src/lib/ist-time.js';
import type { CommissionReceivableEntry } from '../../src/schemas/commission-receivable.js';
import type { RemittanceDoc, CreditDoc } from '../../src/schemas/commission-ledger.js';
import type { CommissionHold } from '../../src/schemas/technician.js';
import type { EffectiveCommissionConfig } from '../../src/schemas/commission-config.js';

const NOW = new Date('2026-05-06T10:00:00.000Z'); // Wed 15:30 IST
const WEEK_START_ISO = istWeekStart(NOW).toISOString(); // Mon 2026-05-04 00:00 IST
const LAST_WEEK_CREATED_AT = '2026-04-28T09:00:00.000Z'; // Tue of the prior IST week

const cfg: EffectiveCommissionConfig = {
  defaultCommissionBps: 2200,
  warnThresholdPaise: 250_000,
  blockThresholdPaise: 500_000,
  holdEnforcementEnabled: true,
  enforceKycInDispatch: false,
  updatedBy: 'admin-1',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function receivable(overrides: Partial<CommissionReceivableEntry>): CommissionReceivableEntry {
  return {
    id: overrides.bookingId ?? 'booking-x',
    bookingId: overrides.bookingId ?? 'booking-x',
    technicianId: 'tech-1',
    partitionKey: 'tech-1',
    serviceId: 'svc-1',
    categoryId: 'cat-1',
    bookingAmount: 50_000,
    commissionBps: 2200,
    commissionDue: 10_000,
    commissionResolvedFrom: 'GLOBAL',
    remittanceStatus: 'DUE',
    createdAt: '2026-05-06T09:00:00.000Z',
    ...overrides,
  };
}

describe('buildCommissionDueResponse', () => {
  it('totalOutstandingPaise is net (sum of outstandingOf) over DUE rows only', () => {
    const partial = receivable({
      bookingId: 'partial',
      commissionDue: 8000,
      remittedAmount: 3000, // outstanding 5000
      createdAt: '2026-05-05T08:00:00.000Z',
    });
    const untouched = receivable({
      bookingId: 'untouched',
      commissionDue: 10_000,
      createdAt: '2026-05-06T09:00:00.000Z',
    });
    const remitted = receivable({
      bookingId: 'remitted',
      remittanceStatus: 'REMITTED',
      commissionDue: 6000,
      remittedAmount: 6000,
      createdAt: '2026-05-05T09:00:00.000Z',
    });

    const res = buildCommissionDueResponse({
      ledger: { receivables: [partial, untouched, remitted], remittances: [], credits: [] },
      hold: null,
      cfg,
      now: NOW,
    });

    expect(res.totalOutstandingPaise).toBe(15_000); // 5000 + 10000; REMITTED excluded
  });

  it('dueCount excludes a fully-credited row that is still marked DUE', () => {
    const fullyCredited = receivable({
      bookingId: 'fully-credited',
      commissionDue: 4000,
      remittedAmount: 4000, // outstanding 0, but status still DUE
      remittanceStatus: 'DUE',
    });
    const stillDue = receivable({ bookingId: 'still-due', commissionDue: 1000 });

    const res = buildCommissionDueResponse({
      ledger: { receivables: [fullyCredited, stillDue], remittances: [], credits: [] },
      hold: null,
      cfg,
      now: NOW,
    });

    expect(res.dueCount).toBe(1);
    const entry = res.entries.find((e) => e.bookingId === 'fully-credited');
    expect(entry?.outstandingPaise).toBe(0);
    expect(res.totalOutstandingPaise).toBe(1000); // fully-credited contributes 0
  });

  it('entries are sorted newest-first by createdAt', () => {
    const oldest = receivable({ bookingId: 'oldest', createdAt: '2026-05-01T00:00:00.000Z' });
    const newest = receivable({ bookingId: 'newest', createdAt: '2026-05-06T09:00:00.000Z' });
    const middle = receivable({ bookingId: 'middle', createdAt: '2026-05-03T00:00:00.000Z' });

    const res = buildCommissionDueResponse({
      ledger: { receivables: [oldest, newest, middle], remittances: [], credits: [] },
      hold: null,
      cfg,
      now: NOW,
    });

    expect(res.entries.map((e) => e.bookingId)).toEqual(['newest', 'middle', 'oldest']);
  });

  it('entries carry remittedAmount defaulted to 0 and the derived outstandingPaise', () => {
    const untouched = receivable({ bookingId: 'untouched', commissionDue: 10_000 });
    const res = buildCommissionDueResponse({
      ledger: { receivables: [untouched], remittances: [], credits: [] },
      hold: null,
      cfg,
      now: NOW,
    });
    expect(res.entries[0]).toMatchObject({ remittedAmount: 0, outstandingPaise: 10_000 });
  });

  it('hold falls back to CLEAR with cfg thresholds when null', () => {
    const res = buildCommissionDueResponse({
      ledger: { receivables: [], remittances: [], credits: [] },
      hold: null,
      cfg,
      now: NOW,
    });
    expect(res.hold).toEqual({
      state: 'CLEAR',
      warnPaise: 250_000,
      blockPaise: 500_000,
      enforcementEnabled: true,
    });
  });

  it('hold copies warnPaise/blockPaise/enforcementEnabled from cfg, not the hold doc', () => {
    const hold: CommissionHold = {
      outstandingPaise: 999,
      dueCount: 3,
      state: 'WARN',
      evaluatedAt: '2026-05-06T00:00:00.000Z',
    };
    const res = buildCommissionDueResponse({
      ledger: { receivables: [], remittances: [], credits: [] },
      hold,
      cfg,
      now: NOW,
    });
    expect(res.hold).toEqual({
      state: 'WARN',
      warnPaise: 250_000,
      blockPaise: 500_000,
      enforcementEnabled: true,
    });
  });

  it('includes override only when present and still active (until > now)', () => {
    const activeOverride: CommissionHold = {
      outstandingPaise: 999,
      dueCount: 3,
      state: 'BLOCKED',
      evaluatedAt: '2026-05-06T00:00:00.000Z',
      override: { until: '2026-05-07T00:00:00.000Z', byAdminId: 'admin-1', reason: 'goodwill' },
    };
    const res = buildCommissionDueResponse({
      ledger: { receivables: [], remittances: [], credits: [] },
      hold: activeOverride,
      cfg,
      now: NOW,
    });
    expect(res.hold.override).toEqual({ until: '2026-05-07T00:00:00.000Z', reason: 'goodwill' });
  });

  it('omits an expired override (until <= now)', () => {
    const expiredOverride: CommissionHold = {
      outstandingPaise: 999,
      dueCount: 3,
      state: 'BLOCKED',
      evaluatedAt: '2026-05-06T00:00:00.000Z',
      override: { until: '2026-05-01T00:00:00.000Z', byAdminId: 'admin-1', reason: 'goodwill' },
    };
    const res = buildCommissionDueResponse({
      ledger: { receivables: [], remittances: [], credits: [] },
      hold: expiredOverride,
      cfg,
      now: NOW,
    });
    expect(res.hold.override).toBeUndefined();
  });

  it('weekSummary counts only receivables with createdAt >= istWeekStart(now), including non-DUE rows', () => {
    const inWeekDue = receivable({
      bookingId: 'in-week-due',
      createdAt: '2026-05-06T09:00:00.000Z',
      bookingAmount: 50_000,
      cashCollectedAmount: 50_000,
      commissionDue: 11_000,
    });
    const inWeekWaived = receivable({
      bookingId: 'in-week-waived',
      remittanceStatus: 'WAIVED',
      createdAt: '2026-05-05T09:00:00.000Z',
      bookingAmount: 30_000,
      cashCollectedAmount: 30_000,
      commissionDue: 6_600,
    });
    const lastWeek = receivable({
      bookingId: 'last-week',
      createdAt: LAST_WEEK_CREATED_AT,
      bookingAmount: 20_000,
      cashCollectedAmount: 20_000,
      commissionDue: 4_400,
    });

    const res = buildCommissionDueResponse({
      ledger: { receivables: [inWeekDue, inWeekWaived, lastWeek], remittances: [], credits: [] },
      hold: null,
      cfg,
      now: NOW,
    });

    expect(res.weekSummary.weekStart).toBe(WEEK_START_ISO);
    expect(res.weekSummary.jobs).toBe(2); // last-week excluded; waived still counts as a job
    expect(res.weekSummary.cashCollectedPaise).toBe(80_000); // 50000 + 30000
    expect(res.weekSummary.commissionPaise).toBe(17_600); // 11000 + 6600
    expect(res.weekSummary.netPaise).toBe(62_400); // 80000 - 17600
  });

  it('weekSummary falls back to bookingAmount when cashCollectedAmount is absent', () => {
    const noCashField = receivable({
      bookingId: 'no-cash-field',
      createdAt: '2026-05-06T09:00:00.000Z',
      bookingAmount: 40_000,
      cashCollectedAmount: undefined,
      commissionDue: 8_800,
    });
    const res = buildCommissionDueResponse({
      ledger: { receivables: [noCashField], remittances: [], credits: [] },
      hold: null,
      cfg,
      now: NOW,
    });
    expect(res.weekSummary.cashCollectedPaise).toBe(40_000);
  });

  it('netPaise floors at 0 when commission exceeds cash collected', () => {
    const negativeNet = receivable({
      bookingId: 'negative-net',
      createdAt: '2026-05-06T09:00:00.000Z',
      bookingAmount: 1000,
      cashCollectedAmount: 1000,
      commissionDue: 5000, // absurd but exercises the floor
    });
    const res = buildCommissionDueResponse({
      ledger: { receivables: [negativeNet], remittances: [], credits: [] },
      hold: null,
      cfg,
      now: NOW,
    });
    expect(res.weekSummary.netPaise).toBe(0);
  });

  it('remittances are sorted newest-first', () => {
    const remittances: RemittanceDoc[] = [
      {
        id: 'rem:old', docType: 'REMITTANCE', technicianId: 'tech-1', partitionKey: 'tech-1',
        amountPaise: 1000, method: 'UPI', ref: 'r1', allocations: [], creditCreatedPaise: 0,
        recordedByAdminId: 'admin-1', idempotencyKey: 'idem-1', createdAt: '2026-05-01T00:00:00.000Z',
      },
      {
        id: 'rem:new', docType: 'REMITTANCE', technicianId: 'tech-1', partitionKey: 'tech-1',
        amountPaise: 2000, method: 'CASH_DEPOSIT', ref: 'r2', allocations: [], creditCreatedPaise: 0,
        recordedByAdminId: 'admin-1', idempotencyKey: 'idem-2', createdAt: '2026-05-05T00:00:00.000Z',
      },
    ];
    const res = buildCommissionDueResponse({
      ledger: { receivables: [], remittances, credits: [] },
      hold: null,
      cfg,
      now: NOW,
    });
    expect(res.remittances.map((r) => r.id)).toEqual(['rem:new', 'rem:old']);
  });

  it('credits exclude fully-consumed rows (remainingPaise === 0) and sort oldest-first', () => {
    const credits: CreditDoc[] = [
      {
        id: 'cr:newer', docType: 'CREDIT', technicianId: 'tech-1', partitionKey: 'tech-1',
        source: 'INCENTIVE', refId: 'ref-2', originalPaise: 500, remainingPaise: 500,
        consumedBy: [], createdAt: '2026-05-05T00:00:00.000Z',
      },
      {
        id: 'cr:older', docType: 'CREDIT', technicianId: 'tech-1', partitionKey: 'tech-1',
        source: 'OVERPAYMENT', refId: 'ref-1', originalPaise: 1000, remainingPaise: 300,
        consumedBy: [], createdAt: '2026-05-01T00:00:00.000Z',
      },
      {
        id: 'cr:spent', docType: 'CREDIT', technicianId: 'tech-1', partitionKey: 'tech-1',
        source: 'OVERPAYMENT', refId: 'ref-3', originalPaise: 1000, remainingPaise: 0,
        consumedBy: [], createdAt: '2026-04-01T00:00:00.000Z',
      },
    ];
    const res = buildCommissionDueResponse({
      ledger: { receivables: [], remittances: [], credits },
      hold: null,
      cfg,
      now: NOW,
    });
    expect(res.credits.map((c) => c.id)).toEqual(['cr:older', 'cr:newer']);
  });
});
