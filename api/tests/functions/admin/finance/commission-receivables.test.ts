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
      { id: 'tech-1', name: 'Ravi', commissionHold: holdWarn },
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
      staleAfter: '2026-09-01T06:00:00.000Z', // evaluatedAt + 6h
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
    expect(body.cashCollectedPaise).toBe(7000); // Σ remittances.amountPaise only
    expect(body.creditAppliedPaise).toBe(4000); // Σ INCENTIVE allocations only, never REMITTANCE
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
    // cash/credit aggregates are untouched by the outstandingPaise gate
    expect(body.cashCollectedPaise).toBe(7000);
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
