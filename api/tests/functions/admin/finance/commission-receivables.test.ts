import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpResponseInit } from '@azure/functions';
import { HttpRequest } from '@azure/functions';

vi.mock('../../../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../../../src/cosmos/technician-repository.js');
vi.mock('../../../../src/cosmos/system-docs-repository.js');
vi.mock('../../../../src/services/auditLog.service.js');

import { commissionReceivableRepo } from '../../../../src/cosmos/commission-receivable-repository.js';
import * as techRepo from '../../../../src/cosmos/technician-repository.js';
import { systemDocsRepo } from '../../../../src/cosmos/system-docs-repository.js';
import { auditLog } from '../../../../src/services/auditLog.service.js';
import {
  adminCommissionReceivablesDashboardHandler,
  adminCommissionReceivablesPerTechHandler,
  adminCommissionReceivablesRecomputeHandler,
} from '../../../../src/functions/admin/finance/commission-receivables.js';
import {
  HOLD_RECONCILIATION_SUMMARY_DOC_ID,
  type HoldReconciliationSummaryDoc,
} from '../../../../src/schemas/hold-reconciliation-summary.js';

const ctx = { adminId: 'a1', role: 'super-admin' as const, sessionId: 's1' };
const getReq = (url = 'http://localhost/api/v1/admin/finance/commission-receivables') =>
  new HttpRequest({ url, method: 'GET' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auditLog).mockResolvedValue(undefined);
});

describe('adminCommissionReceivablesDashboardHandler', () => {
  it('returns empty dashboard when no technicians carry a hold', async () => {
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([]);
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([]);

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(res.jsonBody).toEqual({
      technicians: [],
      totalOutstanding: 0,
      unreconciledTechnicianCount: 0,
    });
    expect(techRepo.getTechniciansByIds).not.toHaveBeenCalled();
  });

  it('returns enriched rows with technician names, filters CLEAR/zero rows, sums totalOutstanding, includes staleAfter', async () => {
    const holdWarn = { outstandingPaise: 5000, dueCount: 1, state: 'WARN' as const, evaluatedAt: '2026-09-01T00:00:00.000Z' };
    const holdClearZero = { outstandingPaise: 0, dueCount: 0, state: 'CLEAR' as const, evaluatedAt: '2026-09-01T00:00:00.000Z' };
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([
      // tech-1 deliberately has no roster `name` (E21-S04: the read path only calls
      // getTechniciansByIds for rows lacking a resolved technicianName — see
      // commission-receivables.ts) so this still exercises the profile-lookup enrichment path.
      { id: 'tech-1', commissionHold: holdWarn },
      { id: 'tech-2', name: 'Suresh', commissionHold: holdClearZero }, // filtered out: CLEAR + 0
    ]);
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([]);
    vi.mocked(techRepo.getTechniciansByIds).mockResolvedValue([
      { id: 'tech-1', technicianId: 'tech-1', displayName: 'Ravi Kumar' },
    ]);

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(techRepo.getTechniciansByIds).toHaveBeenCalledWith(['tech-1']);
    const body = res.jsonBody as {
      technicians: Array<Record<string, unknown>>;
      totalOutstanding: number;
      unreconciledTechnicianCount: number;
      continuationToken?: string;
    };
    expect(body.technicians).toHaveLength(1);
    expect(body.technicians[0]).toMatchObject({
      technicianId: 'tech-1',
      technicianName: 'Ravi Kumar',
      outstandingPaise: 5000,
      dueCount: 1,
      state: 'WARN',
      staleAfter: '2026-09-01T01:30:00.000Z', // evaluatedAt + 90min (E21-S04 corrected HOLD_STALE_AFTER_MS, was 6h)
    });
    expect(body.totalOutstanding).toBe(5000);
    expect(body.continuationToken).toBeUndefined();
  });

  it('computes unreconciledTechnicianCount as a two-direction union: mismatched DUE groups AND holds with no DUE group at all', async () => {
    const holdMatching = { outstandingPaise: 5000, dueCount: 1, state: 'WARN' as const, evaluatedAt: '2026-09-01T00:00:00.000Z' };
    const holdMismatched = { outstandingPaise: 5000, dueCount: 1, state: 'WARN' as const, evaluatedAt: '2026-09-01T00:00:00.000Z' };
    const holdWithNoDueGroup = { outstandingPaise: 4200, dueCount: 1, state: 'WARN' as const, evaluatedAt: '2026-09-01T00:00:00.000Z' };
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([
      { id: 'tech-1', commissionHold: holdMismatched }, // hold 5000 vs DUE aggregate 7000 -> unreconciled
      { id: 'tech-3', commissionHold: holdMatching }, // hold matches its DUE group exactly -> reconciled
      { id: 'tech-4', commissionHold: holdWithNoDueGroup }, // non-zero hold, no DUE group at all -> unreconciled (the blind spot)
    ]);
    // tech-2 has DUE receivables but no hold at all -> unreconciled.
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([
      { technicianId: 'tech-1', outstandingPaise: 7000, dueCount: 2, oldestDueAt: '2026-08-01T00:00:00.000Z' },
      { technicianId: 'tech-2', outstandingPaise: 3000, dueCount: 1, oldestDueAt: '2026-08-15T00:00:00.000Z' },
      { technicianId: 'tech-3', outstandingPaise: 5000, dueCount: 1, oldestDueAt: '2026-08-20T00:00:00.000Z' },
    ]);
    vi.mocked(techRepo.getTechniciansByIds).mockResolvedValue([]);

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    const body = res.jsonBody as { unreconciledTechnicianCount: number };
    expect(body.unreconciledTechnicianCount).toBe(3); // tech-1, tech-2, tech-4 — NOT tech-3
  });

  it('does NOT count a technician whose cached hold is already zero and has no DUE group (nothing to reconcile)', async () => {
    const holdClearZero = { outstandingPaise: 0, dueCount: 0, state: 'CLEAR' as const, evaluatedAt: '2026-09-01T00:00:00.000Z' };
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([{ id: 'tech-5', commissionHold: holdClearZero }]);
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([]);
    vi.mocked(techRepo.getTechniciansByIds).mockResolvedValue([]);

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    const body = res.jsonBody as { unreconciledTechnicianCount: number };
    expect(body.unreconciledTechnicianCount).toBe(0);
  });

  it('pages in memory over the full roster sorted by outstandingPaise desc: page 1 is the 50 largest with a token, page 2 is the remaining 10 with none', async () => {
    const roster = Array.from({ length: 60 }, (_, i) => ({
      id: `tech-${String(i).padStart(3, '0')}`,
      commissionHold: {
        outstandingPaise: (i + 1) * 100, // tech-000 smallest, tech-059 largest
        dueCount: 1,
        state: 'WARN' as const,
        evaluatedAt: '2026-09-01T00:00:00.000Z',
      },
    }));
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue(roster);
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([]);
    vi.mocked(techRepo.getTechniciansByIds).mockResolvedValue([]);

    const page1 = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;
    const body1 = page1.jsonBody as { technicians: Array<{ technicianId: string; outstandingPaise: number }>; continuationToken?: string };
    expect(body1.technicians).toHaveLength(50);
    expect(body1.technicians[0]).toMatchObject({ technicianId: 'tech-059', outstandingPaise: 6000 });
    expect(body1.technicians[49]).toMatchObject({ technicianId: 'tech-010', outstandingPaise: 1100 });
    // strictly descending
    for (let i = 1; i < body1.technicians.length; i++) {
      expect(body1.technicians[i]!.outstandingPaise).toBeLessThanOrEqual(body1.technicians[i - 1]!.outstandingPaise);
    }
    expect(body1.continuationToken).toBeDefined();

    const page2 = (await adminCommissionReceivablesDashboardHandler(
      getReq(`http://localhost/api/v1/admin/finance/commission-receivables?continuationToken=${body1.continuationToken}`),
      {} as never,
      ctx,
    )) as HttpResponseInit;
    const body2 = page2.jsonBody as { technicians: Array<{ technicianId: string; outstandingPaise: number }>; continuationToken?: string };
    expect(body2.technicians).toHaveLength(10);
    expect(body2.technicians[0]).toMatchObject({ technicianId: 'tech-009', outstandingPaise: 1000 });
    expect(body2.technicians[9]).toMatchObject({ technicianId: 'tech-000', outstandingPaise: 100 });
    expect(body2.continuationToken).toBeUndefined();
  });

  it('totalOutstanding is page-independent: identical on page 1 and page 2, and equals the sum over all 60', async () => {
    const roster = Array.from({ length: 60 }, (_, i) => ({
      id: `tech-${String(i).padStart(3, '0')}`,
      commissionHold: {
        outstandingPaise: (i + 1) * 100,
        dueCount: 1,
        state: 'WARN' as const,
        evaluatedAt: '2026-09-01T00:00:00.000Z',
      },
    }));
    const expectedTotal = roster.reduce((sum, t) => sum + t.commissionHold.outstandingPaise, 0);
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue(roster);
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([]);
    vi.mocked(techRepo.getTechniciansByIds).mockResolvedValue([]);

    const page1 = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;
    const body1 = page1.jsonBody as { totalOutstanding: number; continuationToken?: string };
    expect(body1.totalOutstanding).toBe(expectedTotal);
    expect(expectedTotal).toBe(183000); // sum(100..6000 step 100) = 100 * (60*61/2)

    const page2 = (await adminCommissionReceivablesDashboardHandler(
      getReq(`http://localhost/api/v1/admin/finance/commission-receivables?continuationToken=${body1.continuationToken}`),
      {} as never,
      ctx,
    )) as HttpResponseInit;
    const body2 = page2.jsonBody as { totalOutstanding: number };
    expect(body2.totalOutstanding).toBe(expectedTotal);
  });

  it('totalOutstanding: a DUE group with no hold contributes its DUE amount; a technician in both contributes only its hold value', async () => {
    const holdOnly = { outstandingPaise: 5000, dueCount: 1, state: 'WARN' as const, evaluatedAt: '2026-09-01T00:00:00.000Z' };
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([
      { id: 'tech-1', commissionHold: holdOnly }, // present in both -> hold value (5000) only, not +7000
    ]);
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([
      { technicianId: 'tech-1', outstandingPaise: 7000, dueCount: 2, oldestDueAt: '2026-08-01T00:00:00.000Z' },
      { technicianId: 'tech-2', outstandingPaise: 3000, dueCount: 1, oldestDueAt: '2026-08-15T00:00:00.000Z' }, // no hold at all -> falls back to DUE
    ]);
    vi.mocked(techRepo.getTechniciansByIds).mockResolvedValue([]);

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    const body = res.jsonBody as { totalOutstanding: number };
    expect(body.totalOutstanding).toBe(8000); // 5000 (hold, tech-1) + 3000 (DUE fallback, tech-2) — NOT 5000+7000+3000
  });

  it('returns 400 INVALID_CONTINUATION_TOKEN for a malformed token', async () => {
    const res = (await adminCommissionReceivablesDashboardHandler(
      getReq('http://localhost/api/v1/admin/finance/commission-receivables?continuationToken=not-a-valid-token!!!'),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('INVALID_CONTINUATION_TOKEN');
    expect(techRepo.listAllTechniciansWithHold).not.toHaveBeenCalled();
  });

  it('returns 502 when a repository call throws', async () => {
    vi.mocked(techRepo.listAllTechniciansWithHold).mockRejectedValue(new Error('cosmos down'));
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([]);

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    expect(res.status).toBe(502);
  });
});

describe('adminCommissionReceivablesPerTechHandler', () => {
  const makeTechReq = (techId: string) => {
    const req = new HttpRequest({
      url: `http://localhost/api/v1/admin/finance/commission-receivables/${techId}`,
      method: 'GET',
    });
    Object.assign(req, { params: { technicianId: techId } });
    return req;
  };

  const receivableDue = {
    id: 'booking-1', bookingId: 'booking-1', technicianId: 'tech-1', partitionKey: 'tech-1',
    serviceId: 'svc-1', categoryId: 'cat-1', bookingAmount: 50000, commissionBps: 2200,
    commissionDue: 11000, commissionResolvedFrom: 'GLOBAL' as const, remittanceStatus: 'DUE' as const,
    createdAt: '2026-05-01T00:00:00.000Z',
  };
  const receivableWithIncentive = {
    ...receivableDue,
    id: 'booking-2', bookingId: 'booking-2', remittanceStatus: 'REMITTED' as const,
    remittedAmount: 11000,
    createdAt: '2026-06-01T00:00:00.000Z',
    allocations: [
      { id: 'incentive-1:booking-2', source: 'INCENTIVE' as const, refId: 'incentive-1', paise: 4000, appliedAt: '2026-06-01T00:00:00.000Z', byId: 'system:credit' },
      { id: 'rem:key-1:booking-2', source: 'REMITTANCE' as const, refId: 'rem:key-1', paise: 7000, appliedAt: '2026-06-01T00:00:00.000Z', byId: 'admin-1' },
    ],
  };
  const remittance = {
    id: 'rem:key-1', docType: 'REMITTANCE' as const, technicianId: 'tech-1', partitionKey: 'tech-1',
    amountPaise: 7000, method: 'UPI' as const, ref: 'ref-1', allocations: [{ bookingId: 'booking-2', paise: 7000 }],
    creditCreatedPaise: 0, recordedByAdminId: 'admin-1', idempotencyKey: 'key-1', createdAt: '2026-06-01T00:00:00.000Z',
  };
  const hold = { outstandingPaise: 11000, dueCount: 1, state: 'WARN' as const, evaluatedAt: '2026-09-01T00:00:00.000Z' };

  it('returns ledger detail with outstandingPaise per receivable, sums cash and credit separately', async () => {
    vi.mocked(commissionReceivableRepo.listLedger).mockResolvedValue({
      receivables: [receivableDue, receivableWithIncentive],
      remittances: [remittance],
      credits: [],
      awards: [],
    });
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ hold, exists: true });

    const res = (await adminCommissionReceivablesPerTechHandler(
      makeTechReq('tech-1'),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as {
      technicianId: string;
      hold: unknown;
      receivables: Array<{ id: string; outstandingPaise: number }>;
      remittances: unknown[];
      credits: unknown[];
      cashCollectedPaise: number;
      creditAppliedPaise: number;
    };
    expect(body.technicianId).toBe('tech-1');
    expect(body.hold).toEqual(hold);
    expect(body.receivables).toHaveLength(2);
    // newest first
    expect(body.receivables[0]!.id).toBe('booking-2');
    expect(body.receivables.find((r) => r.id === 'booking-1')!.outstandingPaise).toBe(11000);
    expect(body.receivables.find((r) => r.id === 'booking-2')!.outstandingPaise).toBe(0);
    // Σ receivables (cashCollectedAmount ?? bookingAmount), NOT Σ remittances.amountPaise (7000) —
    // see the dedicated pinning test below for a fixture where these two values differ starkly.
    expect(body.cashCollectedPaise).toBe(100000);
    expect(body.creditAppliedPaise).toBe(4000); // Σ INCENTIVE allocations only, never REMITTANCE
  });

  it('derives cashCollectedPaise from receivables (cashCollectedAmount ?? bookingAmount), never from remittances', async () => {
    // Mirrors the technician-facing sibling (commission-view.service.ts). Deliberately construct
    // a fixture where the remittance-sum formula and the receivable-sum formula give very
    // different answers, so a regression back to summing remittances fails this test loudly.
    const receivableWithCashOverride = {
      ...receivableDue,
      id: 'booking-5', bookingId: 'booking-5', bookingAmount: 50000, cashCollectedAmount: 30000,
      createdAt: '2026-08-01T00:00:00.000Z',
    };
    const receivableNoCashOverride = {
      ...receivableDue,
      id: 'booking-6', bookingId: 'booking-6', bookingAmount: 20000,
      createdAt: '2026-08-02T00:00:00.000Z',
    };
    const unrelatedRemittance = { ...remittance, amountPaise: 999_999 };
    vi.mocked(commissionReceivableRepo.listLedger).mockResolvedValue({
      receivables: [receivableWithCashOverride, receivableNoCashOverride],
      remittances: [unrelatedRemittance],
      credits: [],
      awards: [],
    });
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ hold, exists: true });

    const res = (await adminCommissionReceivablesPerTechHandler(
      makeTechReq('tech-1'),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as { cashCollectedPaise: number };
    // 30000 (cashCollectedAmount override) + 20000 (bookingAmount fallback) = 50000.
    // Under the old (wrong) formula this would have been 999999 (Σ remittances.amountPaise).
    expect(body.cashCollectedPaise).toBe(50000);
  });

  it('gates per-receivable outstandingPaise on remittanceStatus === DUE: WAIVED and REMITTED read 0, a partially remitted DUE row reads commissionDue - remittedAmount', async () => {
    const receivableWaived = {
      ...receivableDue,
      id: 'booking-3', bookingId: 'booking-3', remittanceStatus: 'WAIVED' as const,
      // WAIVER allocations are deliberately excluded from remittedAmount, so remittedAmount stays
      // 0 even though the debt was forgiven — outstandingOf() alone would read the full
      // commissionDue as still owed.
      remittedAmount: 0,
      createdAt: '2026-07-01T00:00:00.000Z',
      allocations: [
        { id: 'waiver-1:booking-3', source: 'WAIVER' as const, refId: 'waiver-1', paise: 11000, appliedAt: '2026-07-01T00:00:00.000Z', byId: 'admin-1' },
      ],
    };
    const receivablePartial = {
      ...receivableDue,
      id: 'booking-4', bookingId: 'booking-4', remittanceStatus: 'DUE' as const,
      commissionDue: 11000, remittedAmount: 4000,
      createdAt: '2026-07-15T00:00:00.000Z',
    };
    vi.mocked(commissionReceivableRepo.listLedger).mockResolvedValue({
      receivables: [receivableDue, receivableWithIncentive, receivableWaived, receivablePartial],
      remittances: [remittance],
      credits: [],
      awards: [],
    });
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ hold, exists: true });

    const res = (await adminCommissionReceivablesPerTechHandler(
      makeTechReq('tech-1'),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as {
      receivables: Array<{ id: string; outstandingPaise: number; commissionDue: number; remittedAmount?: number }>;
      cashCollectedPaise: number;
      creditAppliedPaise: number;
    };
    const byId = (id: string) => body.receivables.find((r) => r.id === id)!;
    expect(byId('booking-3').outstandingPaise).toBe(0); // WAIVED -> 0, not full commissionDue
    expect(byId('booking-2').outstandingPaise).toBe(0); // REMITTED -> 0
    expect(byId('booking-4').outstandingPaise).toBe(7000); // partial DUE -> commissionDue - remittedAmount
    expect(byId('booking-1').outstandingPaise).toBe(11000); // untouched DUE row unaffected
    // other fields on the gated rows are unchanged
    expect(byId('booking-3').commissionDue).toBe(11000);
    expect(byId('booking-4').commissionDue).toBe(11000);
    expect(byId('booking-4').remittedAmount).toBe(4000);
    // cash/credit aggregates are untouched by the outstandingPaise gate. All four receivables
    // fall back to bookingAmount (50000 each, no cashCollectedAmount override) -> 200000, NOT the
    // single remittance's amountPaise (7000).
    expect(body.cashCollectedPaise).toBe(200000);
    expect(body.creditAppliedPaise).toBe(4000);
  });

  it('returns 400 when technicianId param missing', async () => {
    const req = new HttpRequest({ url: 'http://localhost/api/v1/admin/finance/commission-receivables/', method: 'GET' });
    Object.assign(req, { params: {} });

    const res = (await adminCommissionReceivablesPerTechHandler(req, {} as never, ctx)) as HttpResponseInit;
    expect(res.status).toBe(400);
  });

  it('returns 502 on upstream error', async () => {
    vi.mocked(commissionReceivableRepo.listLedger).mockRejectedValue(new Error('timeout'));
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ hold: null, exists: true });

    const res = (await adminCommissionReceivablesPerTechHandler(
      makeTechReq('tech-1'),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(502);
  });

  it('passes awards through and keeps credit applied separate from cash collected', async () => {
    // Arrange listLedger (mocked as the sibling cases in this file already do) to return one
    // award plus a receivable carrying a 30_000 INCENTIVE allocation.
    const awardDoc = {
      id: 'award-1', docType: 'INCENTIVE_AWARD' as const, technicianId: 'tech-1', partitionKey: 'tech-1',
      awardPaise: 5000, appliedAt: '2026-09-01T00:00:00.000Z', periodStart: '2026-08-25T00:00:00.000Z',
      periodEnd: '2026-09-01T00:00:00.000Z', createdAt: '2026-09-01T00:00:00.000Z',
    };
    const receivableWithIncentive = {
      ...receivableDue,
      id: 'booking-2', bookingId: 'booking-2', bookingAmount: 50000,
      createdAt: '2026-06-01T00:00:00.000Z',
      allocations: [
        { id: 'incentive-1:booking-2', source: 'INCENTIVE' as const, refId: 'incentive-1', paise: 30000, appliedAt: '2026-06-01T00:00:00.000Z', byId: 'system:credit' },
      ],
    };
    vi.mocked(commissionReceivableRepo.listLedger).mockResolvedValue({
      receivables: [receivableWithIncentive],
      remittances: [],
      credits: [],
      awards: [awardDoc],
    });
    vi.mocked(techRepo.readCommissionHold).mockResolvedValue({ hold, exists: true });

    const res = (await adminCommissionReceivablesPerTechHandler(
      makeTechReq('tech-1'),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    const body = res.jsonBody as { awards: unknown[]; creditAppliedPaise: number; cashCollectedPaise: number };
    expect(res.status).toBe(200);
    expect(body.awards).toHaveLength(1);
    expect(body.creditAppliedPaise).toBe(30000);
    // Never summed with cash: cash changed hands at the door, credit is commission offset.
    expect(body.cashCollectedPaise).toBe(50000);
    expect(body.cashCollectedPaise).not.toBe(body.creditAppliedPaise);
  });
});

describe('adminCommissionReceivablesRecomputeHandler', () => {
  it('enqueues an ALL hold repair, audits, and returns 202', async () => {
    vi.mocked(systemDocsRepo.enqueueHoldRepair).mockResolvedValue(undefined);

    const req = new HttpRequest({ url: 'http://localhost/api/v1/admin/finance/commission-receivables/recompute', method: 'POST' });
    const res = (await adminCommissionReceivablesRecomputeHandler(req, {} as never, ctx)) as HttpResponseInit;

    expect(res.status).toBe(202);
    expect(res.jsonBody).toEqual({ queued: true });
    expect(systemDocsRepo.enqueueHoldRepair).toHaveBeenCalledWith('ALL');
    expect(auditLog).toHaveBeenCalledWith(ctx, 'COMMISSION_HOLD_RECOMPUTE_REQUESTED', 'commission_hold', 'ALL', {});
  });

  it('returns 502 on upstream error', async () => {
    vi.mocked(systemDocsRepo.enqueueHoldRepair).mockRejectedValue(new Error('cosmos down'));

    const req = new HttpRequest({ url: 'http://localhost/api/v1/admin/finance/commission-receivables/recompute', method: 'POST' });
    const res = (await adminCommissionReceivablesRecomputeHandler(req, {} as never, ctx)) as HttpResponseInit;

    expect(res.status).toBe(502);
  });
});

// ── E21-S04: summary-backed dashboard ────────────────────────────────────────

const freshSummary = (over: Partial<HoldReconciliationSummaryDoc> = {}): HoldReconciliationSummaryDoc => ({
  id: HOLD_RECONCILIATION_SUMMARY_DOC_ID,
  computedAt: new Date().toISOString(),
  totalTechnicianCount: 1,
  totalOutstandingPaise: 5000,
  unreconciledTechnicianCount: 0,
  topN: 100,
  top: [{
    technicianId: 'tech-1', technicianName: 'Ravi Kumar', outstandingPaise: 5000,
    dueCount: 1, state: 'WARN', evaluatedAt: '2026-09-08T00:00:00.000Z',
  }],
  ...over,
});

// Distinctive drain-path fixture used by every fallback test below so the assertions discriminate
// "drained AND served" from "drained but the response still reflects something else" (e.g. stale
// summary values left over from a previous call). totalOutstanding here (9999) can never collide
// with freshSummary()'s totalOutstandingPaise (5000).
const drainHold = { outstandingPaise: 9999, dueCount: 3, state: 'WARN' as const, evaluatedAt: '2026-09-08T00:00:00.000Z' };
const mockDrainRoster = () => {
  vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([
    { id: 'tech-drain', name: 'Drain Tech', commissionHold: drainHold },
  ]);
  vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([
    { technicianId: 'tech-drain', outstandingPaise: 9999, dueCount: 3, oldestDueAt: '2026-09-01T00:00:00.000Z' },
  ]);
};

describe('dashboard summary fast path', () => {
  it('serves from the summary and performs NO drain', async () => {
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(freshSummary());

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(techRepo.listAllTechniciansWithHold).not.toHaveBeenCalled();
    expect(commissionReceivableRepo.sumDueGroupedByTechnician).not.toHaveBeenCalled();
    expect(res.jsonBody).toMatchObject({
      totalOutstanding: 5000,
      unreconciledTechnicianCount: 0,
      technicians: [expect.objectContaining({ technicianId: 'tech-1', technicianName: 'Ravi Kumar' })],
    });
  });

  it('falls back to the live drain when the summary is absent', async () => {
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(null);
    mockDrainRoster();

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(techRepo.listAllTechniciansWithHold).toHaveBeenCalled();
    // Discriminates "fell back AND served the drained data" from "fell back but still returned
    // something else" — 9999 (drain) can't be confused with 5000 (a freshSummary() would give).
    expect((res.jsonBody as { totalOutstanding: number }).totalOutstanding).toBe(9999);
    expect((res.jsonBody as { technicians: Array<{ technicianName: string }> }).technicians[0]!.technicianName).toBe('Drain Tech');
  });

  it('falls back when the summary is older than 45 minutes', async () => {
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(
      freshSummary({ computedAt: new Date(Date.now() - 46 * 60 * 1000).toISOString() }),
    );
    mockDrainRoster();

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    expect(techRepo.listAllTechniciansWithHold).toHaveBeenCalled();
    expect((res.jsonBody as { totalOutstanding: number }).totalOutstanding).toBe(9999);
  });

  it('serves from the summary (no drain) when it is fresh at 44 minutes old', async () => {
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(
      freshSummary({ computedAt: new Date(Date.now() - 44 * 60 * 1000).toISOString() }),
    );
    mockDrainRoster(); // present but must NOT be used

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(techRepo.listAllTechniciansWithHold).not.toHaveBeenCalled();
    expect(commissionReceivableRepo.sumDueGroupedByTechnician).not.toHaveBeenCalled();
    expect((res.jsonBody as { totalOutstanding: number }).totalOutstanding).toBe(5000);
  });

  it('falls back when the requested page runs past topN', async () => {
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(
      freshSummary({ topN: 100, totalTechnicianCount: 500 }),
    );
    mockDrainRoster();
    const token = Buffer.from('100').toString('base64');

    const res = (await adminCommissionReceivablesDashboardHandler(
      getReq(`http://localhost/api/v1/admin/finance/commission-receivables?continuationToken=${token}`),
      {} as never, ctx,
    )) as HttpResponseInit;

    expect(techRepo.listAllTechniciansWithHold).toHaveBeenCalled();
    expect((res.jsonBody as { totalOutstanding: number }).totalOutstanding).toBe(9999);
  });

  it('falls back when reading the summary throws', async () => {
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockRejectedValue(new Error('boom'));
    mockDrainRoster();

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(techRepo.listAllTechniciansWithHold).toHaveBeenCalled();
    expect((res.jsonBody as { totalOutstanding: number }).totalOutstanding).toBe(9999);
  });

  it('paginates correctly ON the summary path: offset 50 of a 150-technician roster still yields a continuationToken', async () => {
    // Regression test for the Task 10 review Critical: `rows = summary.top` is capped at `topN`
    // (100), but the true roster is `totalTechnicianCount` (150) — `hasMore` must be derived from
    // the latter, not from `rows.length`, or the last 50 technicians silently vanish with no
    // continuationToken to reach them.
    // Every row carries technicianName, matching a real reconciler-written summary (resolved at
    // write time — see hold-reconciliation-summary.ts) — this keeps the test self-contained
    // instead of relying on getTechniciansByIds behaving any particular way.
    const top100 = Array.from({ length: 100 }, (_, i) => ({
      technicianId: `tech-${String(i).padStart(3, '0')}`,
      technicianName: `Tech ${i}`,
      outstandingPaise: 10000 - i, // strictly descending, matches the documented ordering
      dueCount: 1,
      state: 'WARN' as const,
      evaluatedAt: '2026-09-08T00:00:00.000Z',
    }));
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(
      freshSummary({ topN: 100, totalTechnicianCount: 150, top: top100 }),
    );
    const token = Buffer.from('50').toString('base64');

    const res = (await adminCommissionReceivablesDashboardHandler(
      getReq(`http://localhost/api/v1/admin/finance/commission-receivables?continuationToken=${token}`),
      {} as never, ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(techRepo.listAllTechniciansWithHold).not.toHaveBeenCalled(); // still served from the summary
    const body = res.jsonBody as { technicians: unknown[]; continuationToken?: string };
    expect(body.technicians).toHaveLength(50); // rows 50..99 of top100
    expect(body.continuationToken).toBeDefined();
    expect(Buffer.from(body.continuationToken!, 'base64').toString('utf8')).toBe('100');

    // Follow-on: offset 100 now runs past topN (100+50 > 100) and correctly falls back to drain.
    vi.clearAllMocks();
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(
      freshSummary({ topN: 100, totalTechnicianCount: 150, top: top100 }),
    );
    mockDrainRoster();
    const nextToken = body.continuationToken!;
    await adminCommissionReceivablesDashboardHandler(
      getReq(`http://localhost/api/v1/admin/finance/commission-receivables?continuationToken=${nextToken}`),
      {} as never, ctx,
    );
    expect(techRepo.listAllTechniciansWithHold).toHaveBeenCalled();
  });

  it('summary path and drain path produce identical JSON for the same underlying data (multi-row, oldestDueAt, override)', async () => {
    // This is the guarantee that an admin can never see different money depending on which path
    // served the request — deliberately the strongest test in the file: 3 rows with distinct
    // outstandingPaise (exercises sort), one carrying oldestDueAt, one carrying an override.
    const holdWithOldest = {
      outstandingPaise: 8000, dueCount: 2, state: 'WARN' as const,
      evaluatedAt: '2026-09-08T00:00:00.000Z', oldestDueAt: '2026-08-01T00:00:00.000Z',
    };
    const holdWithOverride = {
      outstandingPaise: 5000, dueCount: 1, state: 'WARN' as const,
      evaluatedAt: '2026-09-08T00:00:00.000Z',
      override: { until: '2026-10-01T00:00:00.000Z', byAdminId: 'admin-9', reason: 'grace period' },
    };
    const holdPlain = {
      outstandingPaise: 3000, dueCount: 1, state: 'WARN' as const,
      evaluatedAt: '2026-09-08T00:00:00.000Z',
    };

    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(null);
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([
      { id: 'tech-1', name: 'Alpha One', commissionHold: holdWithOldest },
      { id: 'tech-2', name: 'Beta Two', commissionHold: holdWithOverride },
      { id: 'tech-3', name: 'Gamma Three', commissionHold: holdPlain },
    ]);
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([
      { technicianId: 'tech-1', outstandingPaise: 8000, dueCount: 2, oldestDueAt: '2026-08-01T00:00:00.000Z' },
      { technicianId: 'tech-2', outstandingPaise: 5000, dueCount: 1, oldestDueAt: '2026-08-15T00:00:00.000Z' },
      { technicianId: 'tech-3', outstandingPaise: 3000, dueCount: 1, oldestDueAt: '2026-08-20T00:00:00.000Z' },
    ]);
    const drained = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    vi.clearAllMocks();
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(freshSummary({
      totalTechnicianCount: 3,
      totalOutstandingPaise: 16000,
      unreconciledTechnicianCount: 0,
      topN: 100,
      top: [
        { technicianId: 'tech-1', technicianName: 'Alpha One', outstandingPaise: 8000, dueCount: 2, oldestDueAt: '2026-08-01T00:00:00.000Z', state: 'WARN', evaluatedAt: '2026-09-08T00:00:00.000Z' },
        { technicianId: 'tech-2', technicianName: 'Beta Two', outstandingPaise: 5000, dueCount: 1, state: 'WARN', evaluatedAt: '2026-09-08T00:00:00.000Z', override: { until: '2026-10-01T00:00:00.000Z', byAdminId: 'admin-9', reason: 'grace period' } },
        { technicianId: 'tech-3', technicianName: 'Gamma Three', outstandingPaise: 3000, dueCount: 1, state: 'WARN', evaluatedAt: '2026-09-08T00:00:00.000Z' },
      ],
    }));
    const fromSummary = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    expect(fromSummary.jsonBody).toEqual(drained.jsonBody);
    // Sanity: the shared fixture actually produced the richer fields this test claims to cover.
    const rows = (drained.jsonBody as { technicians: Array<Record<string, unknown>> }).technicians;
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ technicianId: 'tech-1', oldestDueAt: '2026-08-01T00:00:00.000Z' });
    expect(rows[1]).toMatchObject({ technicianId: 'tech-2', override: { until: '2026-10-01T00:00:00.000Z', byAdminId: 'admin-9', reason: 'grace period' } });
  });
});

describe('technicianName precedence between roster and profile lookup (E21-S04)', () => {
  it('a name already present on the roster wins, and getTechniciansByIds is not called for that row', async () => {
    // The roster's own name and the admin-profile displayName come from the SAME underlying
    // technician document in production — `toHoldItem` (technician-repository.ts) sets
    // `name = displayName ?? name` from that document, so the two sources cannot disagree there.
    // This test pins the precedence anyway (roster name wins when present) so a future change to
    // that invariant is caught here rather than discovered by an admin seeing the wrong name.
    const hold = { outstandingPaise: 4200, dueCount: 1, state: 'WARN' as const, evaluatedAt: '2026-09-08T00:00:00.000Z' };
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(null);
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([
      { id: 'tech-1', name: 'Roster Name', commissionHold: hold },
    ]);
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([]);
    // If the (unreachable in prod) lookup fired anyway, it would return a different name — the
    // test would fail loudly rather than silently coincide.
    vi.mocked(techRepo.getTechniciansByIds).mockResolvedValue([
      { id: 'tech-1', technicianId: 'tech-1', displayName: 'Profile Name' },
    ]);

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(techRepo.getTechniciansByIds).not.toHaveBeenCalled();
    expect((res.jsonBody as { technicians: Array<{ technicianName: string }> }).technicians[0]!.technicianName).toBe('Roster Name');
  });
});

describe('HOLD_STALE_AFTER_MS matches the reconciler cadence', () => {
  it('staleAfter is 90 minutes after evaluatedAt, not 6 hours', async () => {
    vi.mocked(systemDocsRepo.getHoldReconciliationSummary).mockResolvedValue(freshSummary());
    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;
    const row = (res.jsonBody as { technicians: Array<{ evaluatedAt: string; staleAfter: string }> }).technicians[0]!;
    expect(new Date(row.staleAfter).getTime() - new Date(row.evaluatedAt).getTime()).toBe(90 * 60 * 1000);
  });
});
