import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, InvocationContext, type HttpResponseInit } from '@azure/functions';

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));

vi.mock('../../src/services/userRole.service.js', () => ({
  inferUserRole: vi.fn().mockResolvedValue('CUSTOMER'),
}));

vi.mock('../../src/cosmos/erasure-request-repository.js', () => ({
  createErasureRequest: vi.fn(),
  getErasureRequestById: vi.fn(),
  getPendingErasureRequestForUser: vi.fn(),
  replaceErasureRequest: vi.fn(),
}));

vi.mock('../../src/services/auditLog.service.js', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));

type MockFn = ReturnType<typeof vi.fn>;

function makePost(body: unknown, withAuth = true): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/users/me/erasure-request',
    method: 'POST',
    headers: withAuth ? { authorization: 'Bearer test-token' } : {},
    body: { string: JSON.stringify(body) },
  });
}

function makeDelete(withAuth = true): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/users/me/erasure-request',
    method: 'DELETE',
    headers: withAuth ? { authorization: 'Bearer test-token' } : {},
  });
}

describe('POST /v1/users/me/erasure-request', () => {
  let submitHandler: typeof import('../../src/functions/users-erasure-request.js').submitErasureRequestHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/users-erasure-request.js');
    submitHandler = mod.submitErasureRequestHandler;
  });

  it('returns 401 without Authorization', async () => {
    const res = (await submitHandler(
      makePost({ confirmationPhrase: 'DELETE MY ACCOUNT' }, false),
      new InvocationContext(),
    )) as HttpResponseInit;
    expect(res.status).toBe(401);
  });

  it('returns 400 when confirmationPhrase is missing', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });

    const res = (await submitHandler(
      makePost({}),
      new InvocationContext(),
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when confirmationPhrase is wrong (defends against accidental deletion)', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });

    const res = (await submitHandler(
      makePost({ confirmationPhrase: 'delete my account' }),
      new InvocationContext(),
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
  });

  it('returns 400 when confirmationPhrase is "DELETE" alone', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });

    const res = (await submitHandler(
      makePost({ confirmationPhrase: 'DELETE' }),
      new InvocationContext(),
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
  });

  it('returns 409 when a PENDING erasure request already exists for the user', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });
    (repo.getPendingErasureRequestForUser as MockFn).mockResolvedValue({
      id: 'er-existing',
      userId: 'cust-1',
      status: 'PENDING',
      requestedAt: '2026-04-25T00:00:00.000Z',
      scheduledDeletionAt: '2026-05-02T00:00:00.000Z',
    });

    const res = (await submitHandler(
      makePost({ confirmationPhrase: 'DELETE MY ACCOUNT' }),
      new InvocationContext(),
    )) as HttpResponseInit;
    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('ERASURE_REQUEST_PENDING');
  });

  it('returns 201 with erasureId and scheduledDeletionAt 7 days out', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });
    (repo.getPendingErasureRequestForUser as MockFn).mockResolvedValue(null);
    (repo.createErasureRequest as MockFn).mockResolvedValue(undefined);

    const before = Date.now();
    const res = (await submitHandler(
      makePost({ confirmationPhrase: 'DELETE MY ACCOUNT', reason: 'no longer using' }),
      new InvocationContext(),
    )) as HttpResponseInit;
    const after = Date.now();

    expect(res.status).toBe(201);
    const body = res.jsonBody as { erasureId: string; scheduledDeletionAt: string; status: string };
    expect(body.erasureId).toMatch(/[0-9a-f-]{36}/);
    expect(body.status).toBe('PENDING');
    const scheduled = Date.parse(body.scheduledDeletionAt);
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    expect(scheduled).toBeGreaterThanOrEqual(before + SEVEN_DAYS - 5_000);
    expect(scheduled).toBeLessThanOrEqual(after + SEVEN_DAYS + 5_000);

    // Persisted with PENDING status + per-request salt for irreversible anonymization
    const created = (repo.createErasureRequest as MockFn).mock.calls[0]![0] as Record<string, unknown>;
    expect(created['status']).toBe('PENDING');
    expect(created['userId']).toBe('cust-1');
    expect(typeof created['anonymizationSalt']).toBe('string');
    expect((created['anonymizationSalt'] as string).length).toBeGreaterThanOrEqual(16);
    expect(created['reason']).toBe('no longer using');
  });

  it('writes ERASURE_REQUESTED audit log entry', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    const auditService = await import('../../src/services/auditLog.service.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });
    (repo.getPendingErasureRequestForUser as MockFn).mockResolvedValue(null);
    (repo.createErasureRequest as MockFn).mockResolvedValue(undefined);

    await submitHandler(
      makePost({ confirmationPhrase: 'DELETE MY ACCOUNT', reason: 'r' }),
      new InvocationContext(),
    );

    expect(auditService.auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'cust-1', role: 'system' }),
      'ERASURE_REQUESTED',
      'user',
      'cust-1',
      expect.any(Object),
    );
  });
});

describe('DELETE /v1/users/me/erasure-request', () => {
  let revokeHandler: typeof import('../../src/functions/users-erasure-request.js').revokeErasureRequestHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/users-erasure-request.js');
    revokeHandler = mod.revokeErasureRequestHandler;
  });

  it('returns 401 without Authorization', async () => {
    const res = (await revokeHandler(makeDelete(false), new InvocationContext())) as HttpResponseInit;
    expect(res.status).toBe(401);
  });

  it('returns 404 when no PENDING request exists', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });
    (repo.getPendingErasureRequestForUser as MockFn).mockResolvedValue(null);

    const res = (await revokeHandler(makeDelete(), new InvocationContext())) as HttpResponseInit;
    expect(res.status).toBe(404);
  });

  it('returns 204 and marks request REVOKED with audit entry', async () => {
    const { verifyFirebaseIdToken } = await import('../../src/services/firebaseAdmin.js');
    const repo = await import('../../src/cosmos/erasure-request-repository.js');
    const auditService = await import('../../src/services/auditLog.service.js');
    (verifyFirebaseIdToken as MockFn).mockResolvedValue({ uid: 'cust-1' });
    const pending = {
      id: 'er-1',
      partitionKey: 'er-1',
      userId: 'cust-1',
      userRole: 'CUSTOMER' as const,
      status: 'PENDING' as const,
      requestedAt: '2026-04-25T00:00:00.000Z',
      scheduledDeletionAt: '2026-05-02T00:00:00.000Z',
      anonymizationSalt: 'salt-1234567890abcd',
    };
    (repo.getPendingErasureRequestForUser as MockFn).mockResolvedValue(pending);
    (repo.replaceErasureRequest as MockFn).mockResolvedValue(undefined);

    const res = (await revokeHandler(makeDelete(), new InvocationContext())) as HttpResponseInit;
    expect(res.status).toBe(204);
    const replaced = (repo.replaceErasureRequest as MockFn).mock.calls[0]![0] as Record<string, unknown>;
    expect(replaced['status']).toBe('REVOKED');
    expect(typeof replaced['revokedAt']).toBe('string');

    expect(auditService.auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'cust-1' }),
      'ERASURE_REVOKED',
      'user',
      'cust-1',
      expect.any(Object),
    );
  });
});
