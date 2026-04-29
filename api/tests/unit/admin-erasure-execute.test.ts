import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, InvocationContext, type HttpResponseInit } from '@azure/functions';
import type { AdminContext } from '../../src/types/admin.js';

vi.mock('../../src/cosmos/erasure-request-repository.js', () => ({
  getErasureRequestById: vi.fn(),
  replaceErasureRequest: vi.fn(),
}));

vi.mock('../../src/services/erasureCascade.service.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/erasureCascade.service.js')>(
    '../../src/services/erasureCascade.service.js',
  );
  return {
    ...actual,
    // Only the cascade is mocked — computeAnonymizedHash stays real so the
    // execute handler still produces a valid SHA-256 hex hash.
    executeErasureCascade: vi.fn(),
  };
});

vi.mock('../../src/services/auditLog.service.js', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/services/fcm.service.js', () => ({
  sendErasureFinalNotice: vi.fn().mockResolvedValue(undefined),
  sendErasureDenied: vi.fn().mockResolvedValue(undefined),
  sendOwnerComplaintFiled: vi.fn().mockResolvedValue(undefined),
  sendTechEarningsUpdate: vi.fn().mockResolvedValue(undefined),
}));

type MockFn = ReturnType<typeof vi.fn>;

const adminCtx: AdminContext = {
  adminId: 'admin-1',
  role: 'super-admin',
  sessionId: 'sess-1',
};

function pendingRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 'er-1',
    partitionKey: 'er-1',
    userId: 'cust-1',
    userRole: 'CUSTOMER' as const,
    status: 'PENDING' as const,
    requestedAt: '2026-04-15T00:00:00.000Z',
    scheduledDeletionAt: '2026-04-22T00:00:00.000Z', // past
    anonymizationSalt: 'salt-1234567890abcdef',
    ...overrides,
  };
}

function makePatch(id: string, body: unknown): HttpRequest {
  const req = new HttpRequest({
    url: `http://localhost/api/v1/admin/erasure-requests/${id}`,
    method: 'PATCH',
    headers: { cookie: 'hs_access=admin-token' },
    body: { string: JSON.stringify(body) },
  });
  Object.assign(req, { params: { id } });
  return req;
}

describe('PATCH /v1/admin/erasure-requests/:id (EXECUTE)', () => {
  let executeHandler: typeof import('../../src/functions/admin/erasure-requests/execute.js').executeErasureRequestHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/admin/erasure-requests/execute.js');
    executeHandler = mod.executeErasureRequestHandler;
  });

  it('returns 404 when erasure request does not exist', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    (repo.getErasureRequestById as MockFn).mockResolvedValue(null);

    const res = (await executeHandler(
      makePatch('er-missing', { action: 'EXECUTE' }),
      new InvocationContext(),
      adminCtx,
    )) as HttpResponseInit;
    expect(res.status).toBe(404);
  });

  it('returns 409 when request is not PENDING', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    (repo.getErasureRequestById as MockFn).mockResolvedValue({
      doc: pendingRequest({ status: 'EXECUTED' }),
      etag: 'e1',
    });

    const res = (await executeHandler(
      makePatch('er-1', { action: 'EXECUTE' }),
      new InvocationContext(),
      adminCtx,
    )) as HttpResponseInit;
    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('NOT_PENDING');
  });

  it('returns 409 when scheduledDeletionAt has not yet passed (cool-off enforced)', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    (repo.getErasureRequestById as MockFn).mockResolvedValue({
      doc: pendingRequest({ scheduledDeletionAt: future }),
      etag: 'e1',
    });

    const res = (await executeHandler(
      makePatch('er-1', { action: 'EXECUTE' }),
      new InvocationContext(),
      adminCtx,
    )) as HttpResponseInit;
    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('COOL_OFF_NOT_ELAPSED');
  });

  it('returns 400 for invalid action body', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    (repo.getErasureRequestById as MockFn).mockResolvedValue({
      doc: pendingRequest(),
      etag: 'e1',
    });

    const res = (await executeHandler(
      makePatch('er-1', { action: 'NUKE' }),
      new InvocationContext(),
      adminCtx,
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
  });

  it('returns 200 with deletedCounts and runs the cascade on the happy path', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    const cascade = await import('../../src/services/erasureCascade.service.js');
    const auditService = await import('../../src/services/auditLog.service.js');

    (repo.getErasureRequestById as MockFn).mockResolvedValue({
      doc: pendingRequest(),
      etag: 'e1',
    });
    (repo.replaceErasureRequest as MockFn).mockResolvedValue(undefined);
    (cascade.executeErasureCascade as MockFn).mockResolvedValue({
      bookings: 3,
      ratings: 2,
      complaints: 1,
      walletLedgerAnonymized: 3,
      bookingEventsAnonymized: 5,
      dispatchAttemptsAnonymized: 1,
      auditLogAnonymized: 7,
      technicianHardDeleted: false,
      kycHardDeleted: false,
      fcmTokensCleared: true,
    });

    const res = (await executeHandler(
      makePatch('er-1', { action: 'EXECUTE' }),
      new InvocationContext(),
      adminCtx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as { erasureId: string; status: string; deletedCounts: Record<string, unknown> };
    expect(body.status).toBe('EXECUTED');
    expect(body.deletedCounts.bookings).toBe(3);

    expect(cascade.executeErasureCascade).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'cust-1' }),
    );
    // Three writes expected: EXECUTING marker (with anonymizedHash), then EXECUTED
    const replaceCalls = (repo.replaceErasureRequest as MockFn).mock.calls;
    expect(replaceCalls.length).toBeGreaterThanOrEqual(2);
    const last = replaceCalls[replaceCalls.length - 1]![0] as Record<string, unknown>;
    expect(last['status']).toBe('EXECUTED');
    expect(typeof last['anonymizedHash']).toBe('string');
    expect((last['anonymizedHash'] as string).length).toBe(64); // SHA-256 hex

    // After fix P1 #2: post-cascade audit entry uses anonymizedHash (NOT raw uid)
    // so no audit row links the natural-person uid to a deleted account.
    const erasureExecutedCall = (auditService.auditLog as MockFn).mock.calls.find(
      (call: unknown[]) => call[1] === 'ERASURE_EXECUTED',
    );
    expect(erasureExecutedCall).toBeDefined();
    const auditedResourceId = erasureExecutedCall![3] as string;
    expect(auditedResourceId).toMatch(/^[0-9a-f]{64}$/);
    expect(auditedResourceId).not.toBe('cust-1');
  });

  it('returns 500 with FAILED state when cascade throws', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    const cascade = await import('../../src/services/erasureCascade.service.js');

    (repo.getErasureRequestById as MockFn).mockResolvedValue({
      doc: pendingRequest(),
      etag: 'e1',
    });
    (repo.replaceErasureRequest as MockFn).mockResolvedValue(undefined);
    (cascade.executeErasureCascade as MockFn).mockRejectedValue(new Error('cosmos timeout'));

    const res = (await executeHandler(
      makePatch('er-1', { action: 'EXECUTE' }),
      new InvocationContext(),
      adminCtx,
    )) as HttpResponseInit;
    expect(res.status).toBe(500);
    const replaceCalls = (repo.replaceErasureRequest as MockFn).mock.calls;
    const last = replaceCalls[replaceCalls.length - 1]![0] as Record<string, unknown>;
    expect(last['status']).toBe('FAILED');
    expect(typeof last['failureReason']).toBe('string');
  });

  it('SHA-256 hash is 64 hex chars and salt-derived (not raw uid)', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    const cascade = await import('../../src/services/erasureCascade.service.js');

    (repo.getErasureRequestById as MockFn).mockResolvedValue({
      doc: pendingRequest(),
      etag: 'e1',
    });
    (repo.replaceErasureRequest as MockFn).mockResolvedValue(undefined);
    (cascade.executeErasureCascade as MockFn).mockResolvedValue({
      bookings: 0,
      ratings: 0,
      complaints: 0,
      walletLedgerAnonymized: 0,
      bookingEventsAnonymized: 0,
      dispatchAttemptsAnonymized: 0,
      auditLogAnonymized: 0,
      technicianHardDeleted: false,
      kycHardDeleted: false,
      fcmTokensCleared: false,
    });

    await executeHandler(
      makePatch('er-1', { action: 'EXECUTE' }),
      new InvocationContext(),
      adminCtx,
    );

    const replaceCalls = (repo.replaceErasureRequest as MockFn).mock.calls;
    const last = replaceCalls[replaceCalls.length - 1]![0] as Record<string, unknown>;
    const hash = last['anonymizedHash'] as string;
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    // The hash MUST NOT equal the userId (one-way property)
    expect(hash).not.toBe('cust-1');
    // Hash includes salt → not just sha256(uid)
    const { createHash } = await import('node:crypto');
    const naive = createHash('sha256').update('cust-1').digest('hex');
    expect(hash).not.toBe(naive);
  });
});
