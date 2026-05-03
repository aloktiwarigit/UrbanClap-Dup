import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';

vi.mock('../../src/bootstrap.js', () => ({}));
vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../src/cosmos/technician-repository.js', () => ({
  getTechnicianAvailability: vi.fn(),
  patchTechnicianAvailability: vi.fn(),
}));

type MockFn = ReturnType<typeof vi.fn>;

function makeReq(method: string, body?: unknown): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/technicians/me/availability',
    method,
    headers: { Authorization: 'Bearer test-token' },
    ...(body !== undefined ? { body: { string: JSON.stringify(body) } } : {}),
  });
}

const ctx = { error: vi.fn() } as unknown as InvocationContext;

describe('technician availability handlers', () => {
  let getHandler: typeof import('../../src/functions/technicians.js').getMyTechnicianAvailabilityHandler;
  let patchHandler: typeof import('../../src/functions/technicians.js').patchMyTechnicianAvailabilityHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../../src/functions/technicians.js');
    getHandler = module.getMyTechnicianAvailabilityHandler;
    patchHandler = module.patchMyTechnicianAvailabilityHandler;
  });

  it('returns current technician availability', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { getTechnicianAvailability } = await import('../../src/cosmos/technician-repository.js');
    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (getTechnicianAvailability as MockFn).mockResolvedValue({
      isOnline: true,
      isAvailable: true,
      availabilityWindows: [{ dayOfWeek: 1, startHour: 8, endHour: 12 }],
    });

    const res = (await getHandler(makeReq('GET'), ctx)) as HttpResponseInit;

    expect(getTechnicianAvailability).toHaveBeenCalledWith('tech-1');
    expect(res.status).toBe(200);
    expect(res.jsonBody).toEqual({
      isOnline: true,
      isAvailable: true,
      availabilityWindows: [{ dayOfWeek: 1, startHour: 8, endHour: 12 }],
    });
  });

  it('patches technician availability', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { patchTechnicianAvailability } = await import('../../src/cosmos/technician-repository.js');
    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (patchTechnicianAvailability as MockFn).mockResolvedValue({
      isOnline: false,
      isAvailable: false,
      availabilityWindows: [],
    });

    const body = { isOnline: false, isAvailable: false, availabilityWindows: [] };
    const res = (await patchHandler(makeReq('PATCH', body), ctx)) as HttpResponseInit;

    expect(patchTechnicianAvailability).toHaveBeenCalledWith('tech-1', body);
    expect(res.status).toBe(200);
    expect(res.jsonBody).toEqual({
      isOnline: false,
      isAvailable: false,
      availabilityWindows: [],
    });
  });

  it('rejects invalid availability windows', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });

    const res = (await patchHandler(
      makeReq('PATCH', { availabilityWindows: [{ dayOfWeek: 8, startHour: 12, endHour: 8 }] }),
      ctx,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect(res.jsonBody).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('returns 401 when technician auth fails', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    (verifyTechnicianToken as MockFn).mockRejectedValue(new Error('bad token'));

    const res = (await getHandler(makeReq('GET'), ctx)) as HttpResponseInit;

    expect(res.status).toBe(401);
    expect(res.jsonBody).toEqual({ code: 'UNAUTHENTICATED' });
  });
});
