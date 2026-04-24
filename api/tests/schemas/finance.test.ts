import { describe, it, expect } from 'vitest';
import {
  DailyPnLEntrySchema,
  FinanceSummarySchema,
  FinanceSummaryQuerySchema,
  PayoutQueueEntrySchema,
  PayoutQueueSchema,
  ApprovePayoutsResponseSchema,
  PayoutErrorSchema,
} from '../../src/schemas/finance.js';

describe('DailyPnLEntrySchema', () => {
  it('parses a valid entry', () => {
    const result = DailyPnLEntrySchema.parse({
      date: '2026-04-14',
      grossRevenue: 150000,
      commission: 33750,
      netToOwner: 116250,
    });
    expect(result.date).toBe('2026-04-14');
  });
  it('rejects negative grossRevenue', () => {
    expect(() =>
      DailyPnLEntrySchema.parse({ date: '2026-04-14', grossRevenue: -1, commission: 0, netToOwner: 0 }),
    ).toThrow();
  });
  it('rejects invalid calendar date 9999-99-99', () => {
    expect(() =>
      DailyPnLEntrySchema.parse({ date: '9999-99-99', grossRevenue: 0, commission: 0, netToOwner: 0 }),
    ).toThrow();
  });
});

describe('FinanceSummaryQuerySchema', () => {
  it('parses valid from/to ISO dates', () => {
    const q = FinanceSummaryQuerySchema.parse({ from: '2026-04-01', to: '2026-04-30' });
    expect(q.from).toBe('2026-04-01');
  });
  it('requires both from and to', () => {
    expect(() => FinanceSummaryQuerySchema.parse({ from: '2026-04-01' })).toThrow();
  });
  it('rejects invalid calendar date 9999-99-99 in from', () => {
    expect(() => FinanceSummaryQuerySchema.parse({ from: '9999-99-99', to: '9999-99-99' })).toThrow();
  });
  it('rejects from > to', () => {
    expect(() =>
      FinanceSummaryQuerySchema.parse({ from: '2026-04-30', to: '2026-04-01' }),
    ).toThrow();
  });
  it('accepts from === to', () => {
    const q = FinanceSummaryQuerySchema.parse({ from: '2026-04-01', to: '2026-04-01' });
    expect(q.from).toBe('2026-04-01');
  });
});

describe('PayoutQueueEntrySchema', () => {
  it('parses valid entry', () => {
    const entry = PayoutQueueEntrySchema.parse({
      technicianId: 'tech-1',
      technicianName: 'Ravi Kumar',
      completedJobsThisWeek: 5,
      grossEarnings: 250000,
      commissionDeducted: 56250,
      netPayable: 193750,
    });
    expect(entry.netPayable).toBe(193750);
  });
  it('rejects negative netPayable', () => {
    expect(() =>
      PayoutQueueEntrySchema.parse({
        technicianId: 't1',
        technicianName: 'A',
        completedJobsThisWeek: 1,
        grossEarnings: 100,
        commissionDeducted: 200,
        netPayable: -100,
      }),
    ).toThrow();
  });
});

describe('PayoutErrorSchema', () => {
  it('parses valid payout error', () => {
    const e = PayoutErrorSchema.parse({ technicianId: 'tech-1', reason: 'no linked account' });
    expect(e.technicianId).toBe('tech-1');
  });
  it('rejects empty technicianId', () => {
    expect(() => PayoutErrorSchema.parse({ technicianId: '', reason: 'reason' })).toThrow();
  });
});

describe('ApprovePayoutsResponseSchema', () => {
  it('parses valid response', () => {
    const r = ApprovePayoutsResponseSchema.parse({
      approved: 3,
      failed: 1,
      errors: [{ technicianId: 't1', reason: 'no linked account' }],
    });
    expect(r.approved).toBe(3);
  });
  it('rejects error entry with empty technicianId', () => {
    expect(() =>
      ApprovePayoutsResponseSchema.parse({
        approved: 0,
        failed: 1,
        errors: [{ technicianId: '', reason: 'bad' }],
      }),
    ).toThrow();
  });
});

describe('PayoutQueueSchema', () => {
  it('parses queue with empty entries', () => {
    const q = PayoutQueueSchema.parse({
      weekStart: '2026-04-14',
      weekEnd: '2026-04-20',
      entries: [],
      totalNetPayable: 0,
    });
    expect(q.entries).toHaveLength(0);
  });
  it('rejects invalid calendar date in weekStart', () => {
    expect(() =>
      PayoutQueueSchema.parse({
        weekStart: '9999-99-99',
        weekEnd: '2026-04-20',
        entries: [],
        totalNetPayable: 0,
      }),
    ).toThrow();
  });
  it('rejects invalid calendar date in weekEnd', () => {
    expect(() =>
      PayoutQueueSchema.parse({
        weekStart: '2026-04-14',
        weekEnd: '9999-99-99',
        entries: [],
        totalNetPayable: 0,
      }),
    ).toThrow();
  });
});

describe('FinanceSummarySchema', () => {
  it('parses summary', () => {
    const s = FinanceSummarySchema.parse({ dailyPnL: [], totalGross: 0, totalCommission: 0, totalNet: 0 });
    expect(s.totalNet).toBe(0);
  });
});
