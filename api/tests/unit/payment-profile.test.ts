import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../src/cosmos/technician-repository.js', () => ({
  patchPaymentProfile: vi.fn(),
}));
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { updatePaymentProfileHandler } from '../../src/functions/payment-profile.js';
import { verifyTechnicianToken } from '../../src/middleware/verifyTechnicianToken.js';
import * as techRepo from '../../src/cosmos/technician-repository.js';

const ctx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

function makeReq(body: unknown, auth = 'Bearer tok'): HttpRequest {
  return {
    headers: { get: (h: string) => (h.toLowerCase() === 'authorization' ? auth : null) },
    json: async () => body,
  } as unknown as HttpRequest;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-1' });
  vi.mocked(techRepo.patchPaymentProfile).mockResolvedValue(undefined);
});

describe('PATCH /v1/technicians/me/payment-profile', () => {
  it('returns 401 when token is invalid', async () => {
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('bad token'));
    const res = (await updatePaymentProfileHandler(
      makeReq({ upiVpa: 'a@b' }),
      ctx,
    )) as HttpResponseInit;
    expect(res.status).toBe(401);
    expect((res.jsonBody as any).code).toBe('UNAUTHENTICATED');
  });

  it('returns 400 when upiVpa is missing', async () => {
    const res = (await updatePaymentProfileHandler(makeReq({}), ctx)) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as any).code).toBe('INVALID_VPA');
  });

  it('returns 400 when upiVpa has no @', async () => {
    const res = (await updatePaymentProfileHandler(
      makeReq({ upiVpa: 'notavpa' }),
      ctx,
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as any).code).toBe('INVALID_VPA');
  });

  it('returns 400 when upiVpa has two @ characters', async () => {
    const res = (await updatePaymentProfileHandler(
      makeReq({ upiVpa: 'a@b@c' }),
      ctx,
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
  });

  it('returns 200 and calls patchPaymentProfile with the technician uid and a fresh upiUpdatedAt', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-12T10:00:00.000Z'));

    const res = (await updatePaymentProfileHandler(
      makeReq({ upiVpa: 'alok@okhdfcbank' }),
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect((res.jsonBody as any).upiVpa).toBe('alok@okhdfcbank');
    expect((res.jsonBody as any).upiUpdatedAt).toBe('2026-09-12T10:00:00.000Z');
    expect(techRepo.patchPaymentProfile).toHaveBeenCalledWith('tech-1', {
      upiVpa: 'alok@okhdfcbank',
      upiUpdatedAt: '2026-09-12T10:00:00.000Z',
    });

    vi.useRealTimers();
  });

  it('returns 404 when patchPaymentProfile reports TECHNICIAN_NOT_FOUND', async () => {
    vi.mocked(techRepo.patchPaymentProfile).mockRejectedValue(
      Object.assign(new Error('TECHNICIAN_NOT_FOUND'), { code: 'TECHNICIAN_NOT_FOUND' }),
    );
    const res = (await updatePaymentProfileHandler(
      makeReq({ upiVpa: 'alok@okhdfcbank' }),
      ctx,
    )) as HttpResponseInit;
    expect(res.status).toBe(404);
    expect((res.jsonBody as any).code).toBe('TECHNICIAN_NOT_FOUND');
  });

  it('returns 500 on any other repository error', async () => {
    vi.mocked(techRepo.patchPaymentProfile).mockRejectedValue(new Error('Cosmos error'));
    const res = (await updatePaymentProfileHandler(
      makeReq({ upiVpa: 'alok@okhdfcbank' }),
      ctx,
    )) as HttpResponseInit;
    expect(res.status).toBe(500);
  });
});
