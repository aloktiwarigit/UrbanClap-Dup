import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, InvocationContext, type HttpResponseInit } from '@azure/functions';
import type { AdminContext } from '../../src/types/admin.js';

vi.mock('../../src/cosmos/erasure-request-repository.js', () => ({
  getErasureRequestById: vi.fn(),
  replaceErasureRequest: vi.fn(),
}));

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
    scheduledDeletionAt: '2026-04-22T00:00:00.000Z',
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

describe('PATCH /v1/admin/erasure-requests/:id (DENY)', () => {
  let denyHandler: typeof import('../../src/functions/admin/erasure-requests/deny.js').denyErasureRequestHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/admin/erasure-requests/deny.js');
    denyHandler = mod.denyErasureRequestHandler;
  });

  it('returns 404 when request does not exist', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    (repo.getErasureRequestById as MockFn).mockResolvedValue(null);

    const res = (await denyHandler(
      makePatch('er-x', { action: 'DENY', reason: 'legal-hold' }),
      new InvocationContext(),
      adminCtx,
    )) as HttpResponseInit;
    expect(res.status).toBe(404);
  });

  it('returns 409 when not PENDING', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    (repo.getErasureRequestById as MockFn).mockResolvedValue({
      doc: pendingRequest({ status: 'EXECUTED' }),
      etag: 'e1',
    });

    const res = (await denyHandler(
      makePatch('er-1', { action: 'DENY', reason: 'legal-hold' }),
      new InvocationContext(),
      adminCtx,
    )) as HttpResponseInit;
    expect(res.status).toBe(409);
  });

  it('returns 400 when reason is not in the allowed enum', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    (repo.getErasureRequestById as MockFn).mockResolvedValue({
      doc: pendingRequest(),
      etag: 'e1',
    });

    const res = (await denyHandler(
      makePatch('er-1', { action: 'DENY', reason: 'I-just-feel-like-it' }),
      new InvocationContext(),
      adminCtx,
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
  });

  it('returns 400 when reason is missing', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    (repo.getErasureRequestById as MockFn).mockResolvedValue({
      doc: pendingRequest(),
      etag: 'e1',
    });

    const res = (await denyHandler(
      makePatch('er-1', { action: 'DENY' }),
      new InvocationContext(),
      adminCtx,
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
  });

  it('returns 200 with status DENIED, writes audit log, notifies user via FCM', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    const auditService = await import('../../src/services/auditLog.service.js');
    const fcm = await import('../../src/services/fcm.service.js');

    (repo.getErasureRequestById as MockFn).mockResolvedValue({
      doc: pendingRequest(),
      etag: 'e1',
    });
    (repo.replaceErasureRequest as MockFn).mockResolvedValue(undefined);

    const res = (await denyHandler(
      makePatch('er-1', { action: 'DENY', reason: 'fraud-investigation' }),
      new InvocationContext(),
      adminCtx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as { status: string; denialReason: string };
    expect(body.status).toBe('DENIED');
    expect(body.denialReason).toBe('fraud-investigation');

    const replaced = (repo.replaceErasureRequest as MockFn).mock.calls[0]![0] as Record<string, unknown>;
    expect(replaced['status']).toBe('DENIED');
    expect(replaced['denialReason']).toBe('fraud-investigation');
    expect(typeof replaced['deniedAt']).toBe('string');

    expect(auditService.auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'admin-1', role: 'super-admin' }),
      'ERASURE_DENIED',
      'user',
      'cust-1',
      expect.objectContaining({ reason: 'fraud-investigation' }),
    );

    expect(fcm.sendErasureDenied).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'cust-1', reason: 'fraud-investigation' }),
    );
  });

  it('accepts each of the three legal denial reasons', async () => {
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    for (const reason of ['legal-hold', 'regulatory-retention-conflict', 'fraud-investigation']) {
      (repo.getErasureRequestById as MockFn).mockResolvedValue({
        doc: pendingRequest(),
        etag: 'e1',
      });
      (repo.replaceErasureRequest as MockFn).mockResolvedValue(undefined);

      const res = (await denyHandler(
        makePatch('er-1', { action: 'DENY', reason }),
        new InvocationContext(),
        adminCtx,
      )) as HttpResponseInit;
      expect(res.status).toBe(200);
    }
  });
});
