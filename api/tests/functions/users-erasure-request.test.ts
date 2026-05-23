import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../src/bootstrap.js', () => ({}));
vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));
vi.mock('../../src/services/userRole.service.js', () => ({
  inferUserRole: vi.fn(),
}));
vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { hasActiveBookingForTechnician: vi.fn() },
}));
vi.mock('../../src/cosmos/erasure-request-repository.js', () => ({
  createErasureRequest: vi.fn(),
  DuplicatePendingError: class DuplicatePendingError extends Error {
    constructor() { super('ERASURE_REQUEST_PENDING'); }
  },
  getActiveErasureRequestForUser: vi.fn(),
  replaceErasureRequest: vi.fn(),
}));
vi.mock('../../src/services/auditLog.service.js', () => ({
  auditLog: vi.fn(),
}));

import { verifyFirebaseIdToken } from '../../src/services/firebaseAdmin.js';
import { inferUserRole } from '../../src/services/userRole.service.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { createErasureRequest } from '../../src/cosmos/erasure-request-repository.js';
import { submitErasureRequestHandler } from '../../src/functions/users-erasure-request.js';

function makeRequest(body: unknown, token: string | null = 'valid-token'): HttpRequest {
  return {
    headers: {
      get: (k: string) => {
        if (k !== 'authorization') return null;
        return token !== null ? `Bearer ${token}` : null;
      },
    },
    json: async () => body,
  } as unknown as HttpRequest;
}

const ctx = {} as InvocationContext;

describe('submitErasureRequestHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'user-1' } as never);
    vi.mocked(inferUserRole).mockResolvedValue('TECHNICIAN');
    vi.mocked(bookingRepo.hasActiveBookingForTechnician).mockResolvedValue(false);
    vi.mocked(createErasureRequest).mockResolvedValue(undefined);
  });

  it('returns 201 when no active job and valid phrase', async () => {
    const req = makeRequest({ confirmationPhrase: 'DELETE MY ACCOUNT' });

    const res = await submitErasureRequestHandler(req, ctx);

    expect(res.status).toBe(201);
    expect((res.jsonBody as { status: string }).status).toBe('PENDING');
  });

  it('returns 409 ACTIVE_JOB_EXISTS when technician has an active booking', async () => {
    vi.mocked(bookingRepo.hasActiveBookingForTechnician).mockResolvedValue(true);
    const req = makeRequest({ confirmationPhrase: 'DELETE MY ACCOUNT' });

    const res = await submitErasureRequestHandler(req, ctx);

    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('ACTIVE_JOB_EXISTS');
    expect(createErasureRequest).not.toHaveBeenCalled();
  });

  it('returns 400 when confirmation phrase is wrong', async () => {
    const req = makeRequest({ confirmationPhrase: 'delete account' });

    const res = await submitErasureRequestHandler(req, ctx);

    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 when no auth header', async () => {
    const req = makeRequest({ confirmationPhrase: 'DELETE MY ACCOUNT' }, null);

    const res = await submitErasureRequestHandler(req, ctx);

    expect(res.status).toBe(401);
  });
});
