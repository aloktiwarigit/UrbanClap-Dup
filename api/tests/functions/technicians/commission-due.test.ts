import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpResponseInit } from '@azure/functions';
import { HttpRequest } from '@azure/functions';

vi.mock('../../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../../src/cosmos/commission-receivable-repository.js');

import { verifyTechnicianToken } from '../../../src/middleware/verifyTechnicianToken.js';
import { commissionReceivableRepo } from '../../../src/cosmos/commission-receivable-repository.js';
import { techCommissionDueHandler } from '../../../src/functions/technicians/commission-due.js';

const req = new HttpRequest({
  url: 'http://localhost/api/v1/technicians/me/commission-due',
  method: 'GET',
  headers: { authorization: 'Bearer test-token' },
});

const dueEntry = {
  id: 'booking-1', bookingId: 'booking-1', technicianId: 'tech-1', partitionKey: 'tech-1',
  serviceId: 'svc-1', categoryId: 'cat-1', bookingAmount: 50000, commissionBps: 2200,
  commissionDue: 11000, commissionResolvedFrom: 'GLOBAL' as const, remittanceStatus: 'DUE' as const,
  createdAt: '2026-05-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-1' } as never);
});

describe('techCommissionDueHandler', () => {
  it('returns outstanding commissions with totals', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([dueEntry]);

    const res = (await techCommissionDueHandler(req, {} as never)) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as { totalOutstandingPaise: number; dueCount: number; entries: unknown[] };
    expect(body.totalOutstandingPaise).toBe(11000);
    expect(body.dueCount).toBe(1);
    expect(body.entries).toHaveLength(1);
  });

  it('returns zero totals when no outstanding entries', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([]);

    const res = (await techCommissionDueHandler(req, {} as never)) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as { totalOutstandingPaise: number; dueCount: number };
    expect(body.totalOutstandingPaise).toBe(0);
    expect(body.dueCount).toBe(0);
  });

  it('sums multiple outstanding entries', async () => {
    const entry2 = { ...dueEntry, bookingId: 'booking-2', id: 'booking-2', commissionDue: 5500 };
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([dueEntry, entry2]);

    const res = (await techCommissionDueHandler(req, {} as never)) as HttpResponseInit;

    const body = res.jsonBody as { totalOutstandingPaise: number; dueCount: number };
    expect(body.totalOutstandingPaise).toBe(16500); // 11000 + 5500
    expect(body.dueCount).toBe(2);
  });

  it('returns 401 when token is invalid', async () => {
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('invalid token'));

    const res = (await techCommissionDueHandler(req, {} as never)) as HttpResponseInit;

    expect(res.status).toBe(401);
  });

  it('returns 502 on upstream error', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockRejectedValue(
      new Error('cosmos timeout'),
    );

    const res = (await techCommissionDueHandler(req, {} as never)) as HttpResponseInit;

    expect(res.status).toBe(502);
  });
});
