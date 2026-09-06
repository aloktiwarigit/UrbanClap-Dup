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
    vi.mocked(techRepo.listTechniciansWithHold).mockResolvedValue({ items: [] });
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

  it('returns enriched rows with technician names, filters CLEAR/zero rows, sums totalOutstanding, forwards continuationToken', async () => {
    const holdWarn = { outstandingPaise: 5000, dueCount: 1, state: 'WARN' as const, evaluatedAt: '2026-09-01T00:00:00.000Z' };
    const holdClearZero = { outstandingPaise: 0, dueCount: 0, state: 'CLEAR' as const, evaluatedAt: '2026-09-01T00:00:00.000Z' };
    vi.mocked(techRepo.listTechniciansWithHold).mockResolvedValue({
      items: [
        { id: 'tech-1', name: 'Ravi', commissionHold: holdWarn },
        { id: 'tech-2', name: 'Suresh', commissionHold: holdClearZero }, // filtered out: CLEAR + 0
      ],
      continuationToken: 'next-page',
    });
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([
      { id: 'tech-1', commissionHold: holdWarn },
      { id: 'tech-2', commissionHold: holdClearZero },
    ]);
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([]);
    vi.mocked(techRepo.getTechniciansByIds).mockResolvedValue([
      { id: 'tech-1', technicianId: 'tech-1', displayName: 'Ravi Kumar' },
    ]);

    const res = (await adminCommissionReceivablesDashboardHandler(
      getReq('http://localhost/api/v1/admin/finance/commission-receivables?continuationToken=abc'),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(techRepo.listTechniciansWithHold).toHaveBeenCalledWith('abc');
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
    });
    expect(body.totalOutstanding).toBe(5000);
    expect(body.continuationToken).toBe('next-page');
  });

  it('computes unreconciledTechnicianCount from the full roster, not just the current page', async () => {
    const hold = { outstandingPaise: 5000, dueCount: 1, state: 'WARN' as const, evaluatedAt: '2026-09-01T00:00:00.000Z' };
    vi.mocked(techRepo.listTechniciansWithHold).mockResolvedValue({ items: [{ id: 'tech-1', commissionHold: hold }] });
    vi.mocked(techRepo.listAllTechniciansWithHold).mockResolvedValue([{ id: 'tech-1', commissionHold: hold }]);
    // tech-2 has DUE receivables but no hold at all -> unreconciled.
    // tech-1 has a hold whose outstandingPaise (5000) doesn't match the DUE aggregate (7000) -> unreconciled.
    vi.mocked(commissionReceivableRepo.sumDueGroupedByTechnician).mockResolvedValue([
      { technicianId: 'tech-1', outstandingPaise: 7000, dueCount: 2, oldestDueAt: '2026-08-01T00:00:00.000Z' },
      { technicianId: 'tech-2', outstandingPaise: 3000, dueCount: 1, oldestDueAt: '2026-08-15T00:00:00.000Z' },
    ]);
    vi.mocked(techRepo.getTechniciansByIds).mockResolvedValue([]);

    const res = (await adminCommissionReceivablesDashboardHandler(getReq(), {} as never, ctx)) as HttpResponseInit;

    const body = res.jsonBody as { unreconciledTechnicianCount: number };
    expect(body.unreconciledTechnicianCount).toBe(2);
  });

  it('returns 502 when a repository call throws', async () => {
    vi.mocked(techRepo.listTechniciansWithHold).mockRejectedValue(new Error('cosmos down'));

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
