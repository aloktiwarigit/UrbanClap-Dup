// api/tests/functions/admin/compliance/ssc-levy.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';
process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret';
process.env.SSC_FUND_ACCOUNT_ID = 'fa_test_ssc';

vi.mock('../../../../src/cosmos/ssc-levy-repository.js', () => ({
  sscLevyRepo: {
    getLevyByQuarter: vi.fn(),
    createLevy: vi.fn(),
    updateLevy: vi.fn(),
    getLevyById: vi.fn(),
  },
}));

vi.mock('../../../../src/services/ssc-levy.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../src/services/ssc-levy.service.js')>();
  return {
    ...actual,
    calculateQuarterlyGmv: vi.fn(),
    sendOwnerFcmNotification: vi.fn().mockResolvedValue(undefined),
    sendOwnerEmail: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../../../../src/services/razorpay.service.js', () => ({
  createRazorpayOrder: vi.fn(),
  verifyPaymentSignature: vi.fn(),
  createTransfer: vi.fn(),
}));

vi.mock('../../../../src/services/auditLog.service.js', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../../src/services/adminSession.service.js', () => ({
  touchAndGetSession: vi.fn().mockResolvedValue({ sessionId: 's1' }),
}));

import type { Timer, InvocationContext } from '@azure/functions';
import { HttpRequest } from '@azure/functions';
import {
  sscLevyTimerHandler,
  approveSscLevyHandler,
} from '../../../../src/functions/admin/compliance/ssc-levy.js';
import { sscLevyRepo } from '../../../../src/cosmos/ssc-levy-repository.js';
import { calculateQuarterlyGmv } from '../../../../src/services/ssc-levy.service.js';
import { createTransfer } from '../../../../src/services/razorpay.service.js';
import { auditLog } from '../../../../src/services/auditLog.service.js';

const mockTimer = {} as Timer;
const mockCtx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;
const superAdminCtx = { adminId: 'admin-1', role: 'super-admin' as const, sessionId: 's1' };
const opsCtx = { adminId: 'admin-2', role: 'ops-manager' as const, sessionId: 's1' };

const sampleLevy = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  quarter: '2026-Q1',
  gmv: 10_000_000,       // ₹1,00,000 in paise
  levyRate: 0.01 as const,
  levyAmount: 100_000,   // ₹1,000 in paise = round(10_000_000 * 0.01)
  status: 'PENDING_APPROVAL' as const,
  createdAt: '2026-04-01T00:00:00.000Z',
};

describe('sscLevyTimerHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates PENDING_APPROVAL levy when none exists for the quarter', async () => {
    vi.mocked(sscLevyRepo.getLevyByQuarter).mockResolvedValue(null);
    vi.mocked(calculateQuarterlyGmv).mockResolvedValue(10_000_000);
    vi.mocked(sscLevyRepo.createLevy).mockResolvedValue(sampleLevy);

    await sscLevyTimerHandler(mockTimer, mockCtx);

    expect(sscLevyRepo.getLevyByQuarter).toHaveBeenCalledOnce();
    expect(sscLevyRepo.createLevy).toHaveBeenCalledOnce();
    const created = vi.mocked(sscLevyRepo.createLevy).mock.calls[0]![0]!
    expect(created.status).toBe('PENDING_APPROVAL');
    expect(created.levyRate).toBe(0.01);
    expect(created.levyAmount).toBe(100_000);
    expect(created.gmv).toBe(10_000_000);
  });

  it('skips creation when levy already exists for the quarter (idempotency)', async () => {
    vi.mocked(sscLevyRepo.getLevyByQuarter).mockResolvedValue(sampleLevy);

    await sscLevyTimerHandler(mockTimer, mockCtx);

    expect(sscLevyRepo.createLevy).not.toHaveBeenCalled();
    expect(calculateQuarterlyGmv).not.toHaveBeenCalled();
  });

  it('sends FCM and email notifications after creating the levy doc', async () => {
    vi.mocked(sscLevyRepo.getLevyByQuarter).mockResolvedValue(null);
    vi.mocked(calculateQuarterlyGmv).mockResolvedValue(10_000_000);
    vi.mocked(sscLevyRepo.createLevy).mockResolvedValue(sampleLevy);

    const { sendOwnerFcmNotification, sendOwnerEmail } = await import(
      '../../../../src/services/ssc-levy.service.js'
    );

    await sscLevyTimerHandler(mockTimer, mockCtx);

    expect(vi.mocked(sendOwnerFcmNotification)).toHaveBeenCalledOnce();
    expect(vi.mocked(sendOwnerEmail)).toHaveBeenCalledOnce();
  });
});

describe('approveSscLevyHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  const makeReq = (levyId: string) =>
    new HttpRequest({
      url: `http://localhost/api/v1/admin/compliance/ssc-levy/${levyId}/approve`,
      method: 'POST',
      params: { id: levyId },
    });

  it('returns 403 when role is ops-manager', async () => {
    const res = await approveSscLevyHandler(makeReq(sampleLevy.id), mockCtx, opsCtx);
    expect(res.status).toBe(403);
  });

  it('returns 404 when levy does not exist', async () => {
    vi.mocked(sscLevyRepo.getLevyById).mockResolvedValue(null);
    const res = await approveSscLevyHandler(makeReq('nonexistent-id'), mockCtx, superAdminCtx);
    expect(res.status).toBe(404);
  });

  it('returns 409 when levy is already TRANSFERRED', async () => {
    vi.mocked(sscLevyRepo.getLevyById).mockResolvedValue({
      ...sampleLevy,
      status: 'TRANSFERRED',
      razorpayTransferId: 'trf_old',
    });
    const res = await approveSscLevyHandler(makeReq(sampleLevy.id), mockCtx, superAdminCtx);
    expect(res.status).toBe(409);
  });

  it('allows re-approval (retry) when levy is in FAILED state', async () => {
    const failedLevy = { ...sampleLevy, status: 'FAILED' as const };
    vi.mocked(sscLevyRepo.getLevyById).mockResolvedValue(failedLevy);
    vi.mocked(sscLevyRepo.updateLevy).mockResolvedValue({ ...failedLevy, status: 'APPROVED' });
    vi.mocked(createTransfer).mockResolvedValue({ transferId: 'trf_retry_ok' });

    const res = await approveSscLevyHandler(makeReq(sampleLevy.id), mockCtx, superAdminCtx);

    expect(res.status).toBe(200);
    expect(createTransfer).toHaveBeenCalledOnce();
    const secondUpdate = vi.mocked(sscLevyRepo.updateLevy).mock.calls[1]![2]!;
    expect(secondUpdate.status).toBe('TRANSFERRED');
  });

  it('sets TRANSFERRED status and returns 200 on successful approval', async () => {
    vi.mocked(sscLevyRepo.getLevyById).mockResolvedValue(sampleLevy);
    vi.mocked(sscLevyRepo.updateLevy).mockResolvedValue({ ...sampleLevy, status: 'APPROVED' });
    vi.mocked(createTransfer).mockResolvedValue({ transferId: 'trf_ssc_test123' });

    const res = await approveSscLevyHandler(makeReq(sampleLevy.id), mockCtx, superAdminCtx);

    expect(res.status).toBe(200);
    expect(createTransfer).toHaveBeenCalledOnce();
    const transferCall = vi.mocked(createTransfer).mock.calls[0]![0]!
    expect(transferCall.accountId).toBe('fa_test_ssc');
    expect(transferCall.amount).toBe(100_000);
    // handler calls updateLevy twice: first APPROVED, then TRANSFERRED
    expect(sscLevyRepo.updateLevy).toHaveBeenCalledTimes(2);
    const secondUpdate = vi.mocked(sscLevyRepo.updateLevy).mock.calls[1]![2]!
    expect(secondUpdate.status).toBe('TRANSFERRED');
    expect(secondUpdate.razorpayTransferId).toBe('trf_ssc_test123');
    expect(auditLog).toHaveBeenCalledOnce();
  });

  it('sets FAILED status and returns 502 when Razorpay transfer throws', async () => {
    vi.mocked(sscLevyRepo.getLevyById).mockResolvedValue(sampleLevy);
    vi.mocked(sscLevyRepo.updateLevy).mockResolvedValue({ ...sampleLevy, status: 'APPROVED' });
    vi.mocked(createTransfer).mockRejectedValue(new Error('Razorpay API error'));

    const res = await approveSscLevyHandler(makeReq(sampleLevy.id), mockCtx, superAdminCtx);

    expect(res.status).toBe(502);
    expect(sscLevyRepo.updateLevy).toHaveBeenCalledTimes(2);
    const failUpdate = vi.mocked(sscLevyRepo.updateLevy).mock.calls[1]![2]!
    expect(failUpdate.status).toBe('FAILED');
  });
});
