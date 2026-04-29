import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';
process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret';

vi.mock('../../../../src/cosmos/finance-repository.js', () => ({
  getPayoutQueue: vi.fn(),
  getWeekSnapshot: vi.fn(),
  getLedgerTransfer: vi.fn(),
  writeLedgerEntry: vi.fn(),
  getTechnicianLinkedAccount: vi.fn(),
}));
vi.mock('../../../../src/cosmos/technician-repository.js', () => ({
  getTechnicianPayoutCadence: vi.fn().mockResolvedValue(null), // null = WEEKLY — passes through
}));
vi.mock('../../../../src/services/adminSession.service.js', () => ({
  touchAndGetSession: vi.fn().mockResolvedValue({ sessionId: 's1' }),
}));
vi.mock('../../../../src/services/auditLog.service.js', () => ({ auditLog: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../../../../src/services/razorpayRoute.service.js', () => ({
  RazorpayRouteService: vi.fn().mockImplementation(() => ({ transfer: vi.fn() })),
}));

import { HttpRequest } from '@azure/functions';
import { adminApprovePayoutsHandler } from '../../../../src/functions/admin/finance/approve-payouts.js';
import {
  getWeekSnapshot, getLedgerTransfer, writeLedgerEntry, getTechnicianLinkedAccount,
} from '../../../../src/cosmos/finance-repository.js';
import { RazorpayRouteService } from '../../../../src/services/razorpayRoute.service.js';
import { auditLog } from '../../../../src/services/auditLog.service.js';

const req = new HttpRequest({ url: 'http://localhost/api/v1/admin/finance/payouts/approve-all', method: 'POST' });
const superAdminCtx = { adminId: 'admin-1', role: 'super-admin' as const, sessionId: 's1' };
const opsCtx = { adminId: 'admin-2', role: 'ops-manager' as const, sessionId: 's1' };

const sampleEntry = {
  technicianId: 'tech-1',
  technicianName: 'Ravi',
  completedJobsThisWeek: 3,
  grossEarnings: 150000,
  commissionDeducted: 33750,
  netPayable: 116250,
};
const sampleQueue = { weekStart: '2026-04-14', weekEnd: '2026-04-20', entries: [sampleEntry], totalNetPayable: 116250 };

describe('adminApprovePayoutsHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 when role is ops-manager', async () => {
    const res = await adminApprovePayoutsHandler(req, {} as any, opsCtx);
    expect(res.status).toBe(403);
  });

  it('skips transfer when ledger transfer already exists (idempotency)', async () => {
    vi.mocked(getWeekSnapshot).mockResolvedValue(sampleQueue);
    vi.mocked(getLedgerTransfer).mockResolvedValue({
      id: 'lt-1', type: 'TRANSFER', technicianId: 'tech-1', weekStart: '2026-04-14',
      razorpayTransferId: 'trf_existing', amount: 116250, createdAt: '2026-04-21T01:00:00.000Z',
    } as any);
    const res = await adminApprovePayoutsHandler(req, {} as any, superAdminCtx);
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).approved).toBe(1);
    expect(writeLedgerEntry).not.toHaveBeenCalled();
  });

  it('calls razorpay transfer and writes ledger on success', async () => {
    vi.mocked(getWeekSnapshot).mockResolvedValue(sampleQueue);
    vi.mocked(getLedgerTransfer).mockResolvedValue(null);
    vi.mocked(getTechnicianLinkedAccount).mockResolvedValue('rpacc_test123');
    vi.mocked(RazorpayRouteService).mockImplementation(() => ({
      transfer: vi.fn().mockResolvedValue({ transferId: 'trf_new123' }),
    }) as unknown as RazorpayRouteService);
    const res = await adminApprovePayoutsHandler(req, {} as any, superAdminCtx);
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).approved).toBe(1);
    expect((res.jsonBody as any).failed).toBe(0);
    expect(writeLedgerEntry).toHaveBeenCalledOnce();
    expect(auditLog).toHaveBeenCalledOnce();
  });

  it('records failure when tech has no linked Razorpay account', async () => {
    vi.mocked(getWeekSnapshot).mockResolvedValue(sampleQueue);
    vi.mocked(getLedgerTransfer).mockResolvedValue(null);
    vi.mocked(getTechnicianLinkedAccount).mockResolvedValue(null);
    const res = await adminApprovePayoutsHandler(req, {} as any, superAdminCtx);
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).failed).toBe(1);
    expect((res.jsonBody as any).errors).toHaveLength(1);
    expect(writeLedgerEntry).not.toHaveBeenCalled();
  });

  it('skips transfer and records failure when netPayable is zero', async () => {
    const zeroEntry = { ...sampleEntry, netPayable: 0 };
    const zeroQueue = { ...sampleQueue, entries: [zeroEntry] };
    vi.mocked(getWeekSnapshot).mockResolvedValue(zeroQueue);
    vi.mocked(getLedgerTransfer).mockResolvedValue(null);
    const res = await adminApprovePayoutsHandler(req, {} as any, superAdminCtx);
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).failed).toBe(1);
    expect((res.jsonBody as any).errors[0].reason).toContain('netPayable');
    expect(writeLedgerEntry).not.toHaveBeenCalled();
  });

  it('records failure when Razorpay transfer throws', async () => {
    vi.mocked(getWeekSnapshot).mockResolvedValue(sampleQueue);
    vi.mocked(getLedgerTransfer).mockResolvedValue(null);
    vi.mocked(getTechnicianLinkedAccount).mockResolvedValue('rpacc_test123');
    vi.mocked(RazorpayRouteService).mockImplementation(() => ({
      transfer: vi.fn().mockRejectedValue(new Error('Razorpay API error')),
    }) as unknown as RazorpayRouteService);
    const res = await adminApprovePayoutsHandler(req, {} as any, superAdminCtx);
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).failed).toBe(1);
    expect((res.jsonBody as any).errors[0].reason).toContain('Razorpay API error');
  });
});
