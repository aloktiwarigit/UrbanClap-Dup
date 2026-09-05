import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpResponseInit } from '@azure/functions';
import { HttpRequest } from '@azure/functions';

vi.mock('../../../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../../../src/cosmos/technician-repository.js');

import { commissionReceivableRepo } from '../../../../src/cosmos/commission-receivable-repository.js';
import * as techRepo from '../../../../src/cosmos/technician-repository.js';
import {
  adminCommissionReceivablesDashboardHandler,
  adminCommissionReceivablesPerTechHandler,
} from '../../../../src/functions/admin/finance/commission-receivables.js';

const ctx = { adminId: 'a1', role: 'super-admin' as const, sessionId: 's1' };
const getReq = (url = 'http://localhost/api/v1/admin/finance/commission-receivables') =>
  new HttpRequest({ url, method: 'GET' });

const sampleSummary = {
  technicianId: 'tech-1',
  dueCount: 2,
  totalCommissionDue: 3300,
  oldestDueAt: '2026-05-01T00:00:00.000Z',
};

beforeEach(() => vi.clearAllMocks());

describe('adminCommissionReceivablesDashboardHandler', () => {
  // E21-S02 Task 10 rewrites this handler
  it.todo('returns empty dashboard when no outstanding receivables');

  // E21-S02 Task 10 rewrites this handler
  it.todo('returns enriched summaries with technician names');

  // E21-S02 Task 10 rewrites this handler
  it.todo('falls back to technicianId as name when profile not found');

  // E21-S02 Task 10 rewrites this handler
  it.todo('returns 502 when repository throws');
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

  it('returns DUE entries for the given technician', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([
      {
        id: 'booking-1', bookingId: 'booking-1', technicianId: 'tech-1', partitionKey: 'tech-1',
        serviceId: 'svc-1', categoryId: 'cat-1', bookingAmount: 50000, commissionBps: 2200,
        commissionDue: 11000, commissionResolvedFrom: 'GLOBAL', remittanceStatus: 'DUE',
        createdAt: '2026-05-01T00:00:00.000Z',
      },
    ]);

    const res = (await adminCommissionReceivablesPerTechHandler(
      makeTechReq('tech-1'),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as { technicianId: string; entries: unknown[] };
    expect(body.technicianId).toBe('tech-1');
    expect(body.entries).toHaveLength(1);
  });

  it('returns 502 on upstream error', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockRejectedValue(
      new Error('timeout'),
    );

    const res = (await adminCommissionReceivablesPerTechHandler(
      makeTechReq('tech-1'),
      {} as never,
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(502);
  });
});
