import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpResponseInit } from '@azure/functions';
import { HttpRequest } from '@azure/functions';

vi.mock('../../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../../src/cosmos/technician-repository.js', () => ({
  readCommissionHold: vi.fn(),
}));
vi.mock('../../../src/services/commission-config.service.js', () => ({
  getCommissionConfig: vi.fn(),
}));

import { verifyTechnicianToken } from '../../../src/middleware/verifyTechnicianToken.js';
import { commissionReceivableRepo } from '../../../src/cosmos/commission-receivable-repository.js';
import { readCommissionHold } from '../../../src/cosmos/technician-repository.js';
import { getCommissionConfig } from '../../../src/services/commission-config.service.js';
import { techCommissionDueHandler } from '../../../src/functions/technicians/commission-due.js';
import {
  TechnicianCommissionDueV2Schema,
  type TechnicianCommissionDueV2,
} from '../../../src/schemas/commission-receivable.js';
import type { EffectiveCommissionConfig } from '../../../src/schemas/commission-config.js';

const req = new HttpRequest({
  url: 'http://localhost/api/v1/technicians/me/commission-due',
  method: 'GET',
  headers: { authorization: 'Bearer test-token' },
});

const cfg: EffectiveCommissionConfig = {
  defaultCommissionBps: 2200,
  warnThresholdPaise: 250_000,
  blockThresholdPaise: 500_000,
  holdEnforcementEnabled: true,
  enforceKycInDispatch: false,
  updatedBy: 'admin-1',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const dueEntry = {
  id: 'booking-1', bookingId: 'booking-1', technicianId: 'tech-1', partitionKey: 'tech-1',
  serviceId: 'svc-1', categoryId: 'cat-1', bookingAmount: 50000, commissionBps: 2200,
  commissionDue: 11000, commissionResolvedFrom: 'GLOBAL' as const, remittanceStatus: 'DUE' as const,
  createdAt: '2026-05-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-1' } as never);
  vi.mocked(readCommissionHold).mockResolvedValue({ hold: null, exists: true });
  vi.mocked(getCommissionConfig).mockResolvedValue(cfg);
});

describe('techCommissionDueHandler', () => {
  it('returns 200 with totalOutstandingPaise equal to the sum of entries[].outstandingPaise, including a WAIVED row', async () => {
    const entry2 = { ...dueEntry, bookingId: 'booking-2', id: 'booking-2', commissionDue: 8000, remittedAmount: 3000 };
    // A WAIVED row never partially remitted (remittedAmount absent) — must contribute 0 to both
    // entries[].outstandingPaise and totalOutstandingPaise, not its full commissionDue.
    const waivedEntry = {
      ...dueEntry,
      bookingId: 'booking-3',
      id: 'booking-3',
      commissionDue: 9000,
      remittanceStatus: 'WAIVED' as const,
      remittedAmount: undefined,
    };
    vi.mocked(commissionReceivableRepo.listLedger).mockResolvedValue({
      receivables: [dueEntry, entry2, waivedEntry],
      remittances: [],
      credits: [],
    });

    const res = (await techCommissionDueHandler(req, {} as never)) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as TechnicianCommissionDueV2;
    const sum = body.entries.reduce((s, e) => s + e.outstandingPaise, 0);
    expect(body.totalOutstandingPaise).toBe(sum);
    expect(body.totalOutstandingPaise).toBe(11000 + 5000);
    const waived = body.entries.find((e) => e.bookingId === 'booking-3');
    expect(waived?.outstandingPaise).toBe(0);
  });

  it('parses a response built from legacy-shaped receivables (no allocations/remittedAmount) against TechnicianCommissionDueV2Schema', async () => {
    vi.mocked(commissionReceivableRepo.listLedger).mockResolvedValue({
      receivables: [dueEntry], // no allocations, no remittedAmount — legacy E21-S01 shape
      remittances: [],
      credits: [],
    });

    const res = (await techCommissionDueHandler(req, {} as never)) as HttpResponseInit;

    expect(res.status).toBe(200);
    const parsed = TechnicianCommissionDueV2Schema.safeParse(res.jsonBody);
    expect(parsed.success).toBe(true);
  });

  it('returns zero totals when the ledger is empty', async () => {
    vi.mocked(commissionReceivableRepo.listLedger).mockResolvedValue({
      receivables: [],
      remittances: [],
      credits: [],
    });

    const res = (await techCommissionDueHandler(req, {} as never)) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as TechnicianCommissionDueV2;
    expect(body.totalOutstandingPaise).toBe(0);
    expect(body.dueCount).toBe(0);
    expect(body.entries).toHaveLength(0);
  });

  it('falls back to a CLEAR hold when readCommissionHold returns null', async () => {
    vi.mocked(commissionReceivableRepo.listLedger).mockResolvedValue({
      receivables: [],
      remittances: [],
      credits: [],
    });
    vi.mocked(readCommissionHold).mockResolvedValue({ hold: null, exists: true });

    const res = (await techCommissionDueHandler(req, {} as never)) as HttpResponseInit;
    const body = res.jsonBody as TechnicianCommissionDueV2;
    expect(body.hold.state).toBe('CLEAR');
  });

  it('returns 401 when token is invalid', async () => {
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('invalid token'));

    const res = (await techCommissionDueHandler(req, {} as never)) as HttpResponseInit;

    expect(res.status).toBe(401);
  });

  it('returns 502 on upstream error', async () => {
    vi.mocked(commissionReceivableRepo.listLedger).mockRejectedValue(new Error('cosmos timeout'));

    const res = (await techCommissionDueHandler(req, {} as never)) as HttpResponseInit;

    expect(res.status).toBe(502);
  });
});
