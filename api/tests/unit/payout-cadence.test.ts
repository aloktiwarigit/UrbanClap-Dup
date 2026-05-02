import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../src/cosmos/technician-repository.js', () => ({
  updatePayoutCadence: vi.fn(),
}));
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { updatePayoutCadenceHandler } from '../../src/functions/payout-cadence.js';
import { verifyTechnicianToken } from '../../src/middleware/verifyTechnicianToken.js';
import * as techRepo from '../../src/cosmos/technician-repository.js';

const ctx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

function makeReq(body: unknown, auth = 'Bearer tok'): HttpRequest {
  return {
    headers: { get: (h: string) => h.toLowerCase() === 'authorization' ? auth : null },
    json: async () => body,
  } as unknown as HttpRequest;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-1' });
  vi.mocked(techRepo.updatePayoutCadence).mockResolvedValue(undefined);
});

describe('PATCH /v1/technicians/me/payout-cadence', () => {
  it('returns 401 when token is invalid', async () => {
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('bad token'));
    const res = await updatePayoutCadenceHandler(makeReq({ cadence: 'WEEKLY' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(401);
    expect((res.jsonBody as any).code).toBe('UNAUTHENTICATED');
  });

  it('returns 400 when cadence is missing', async () => {
    const res = await updatePayoutCadenceHandler(makeReq({}), ctx) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as any).code).toBe('INVALID_CADENCE');
  });

  it('returns 400 when cadence is an invalid value', async () => {
    const res = await updatePayoutCadenceHandler(makeReq({ cadence: 'BIWEEKLY' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as any).code).toBe('INVALID_CADENCE');
  });

  it('returns 200 with WEEKLY cadence and correct nextPayoutAt', async () => {
    vi.useFakeTimers();
    // Friday 2026-05-01 10:00 IST = 2026-05-01T04:30:00Z
    vi.setSystemTime(new Date('2026-05-01T04:30:00.000Z'));

    const res = await updatePayoutCadenceHandler(makeReq({ cadence: 'WEEKLY' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(200);
    const body = res.jsonBody as any;
    expect(body.cadence).toBe('WEEKLY');
    // Next Monday from Friday is 2026-05-04
    expect(body.nextPayoutAt).toMatch(/^2026-05-04/);

    vi.useRealTimers();
  });

  it('returns 200 with NEXT_DAY cadence and tomorrow 10AM IST', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T10:00:00.000Z'));

    const res = await updatePayoutCadenceHandler(makeReq({ cadence: 'NEXT_DAY' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(200);
    const body = res.jsonBody as any;
    expect(body.cadence).toBe('NEXT_DAY');
    // tomorrow T04:30 UTC = 10AM IST
    expect(body.nextPayoutAt).toMatch(/^2026-05-02T04:30/);

    vi.useRealTimers();
  });

  it('returns 200 with INSTANT cadence and null nextPayoutAt', async () => {
    const res = await updatePayoutCadenceHandler(makeReq({ cadence: 'INSTANT' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(200);
    const body = res.jsonBody as any;
    expect(body.cadence).toBe('INSTANT');
    expect(body.nextPayoutAt).toBeNull();
  });

  it('calls updatePayoutCadence with correct technicianId and cadence', async () => {
    await updatePayoutCadenceHandler(makeReq({ cadence: 'NEXT_DAY' }), ctx);
    expect(techRepo.updatePayoutCadence).toHaveBeenCalledWith('tech-1', 'NEXT_DAY');
  });

  it('returns 500 when updatePayoutCadence throws', async () => {
    vi.mocked(techRepo.updatePayoutCadence).mockRejectedValue(new Error('Cosmos error'));
    const res = await updatePayoutCadenceHandler(makeReq({ cadence: 'WEEKLY' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(500);
  });
});
