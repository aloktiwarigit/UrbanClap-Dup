import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../../../src/cosmos/complaints-repository.js', () => ({
  queryComplaints: vi.fn(),
  createComplaint: vi.fn(),
  getComplaint: vi.fn(),
  replaceComplaint: vi.fn(),
  getOverdueComplaints: vi.fn(),
  getRepeatOffenders: vi.fn(),
}));

import { getRepeatOffenders } from '../../../../src/cosmos/complaints-repository.js';
import { adminRepeatOffendersHandler } from '../../../../src/functions/admin/complaints/repeat-offenders.js';

function makeReq(): HttpRequest {
  return {
    query: { get: (_k: string) => null, has: (_k: string) => false },
    headers: { get: (_k: string) => null },
  } as unknown as HttpRequest;
}
const mockCtx = {} as InvocationContext;
const mockAdmin = { adminId: 'admin_1', role: 'super-admin' as const, sessionId: 'sess_1' };

describe('adminRepeatOffendersHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with offenders array', async () => {
    (getRepeatOffenders as ReturnType<typeof vi.fn>).mockResolvedValue([
      { technicianId: 'tech_1', count: 5 },
    ]);
    const res = await adminRepeatOffendersHandler(makeReq(), mockCtx, mockAdmin);
    expect(res.status).toBe(200);
    expect((res.jsonBody as Record<string, unknown>)['offenders']).toEqual([
      { technicianId: 'tech_1', count: 5 },
    ]);
  });

  it('passes a date 30 days ago to getRepeatOffenders', async () => {
    (getRepeatOffenders as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const before = Date.now();
    await adminRepeatOffendersHandler(makeReq(), mockCtx, mockAdmin);
    const after = Date.now();
    const calledWith = (getRepeatOffenders as ReturnType<typeof vi.fn>).mock.calls[0]![0]! as string;
    const calledDate = new Date(calledWith).getTime();
    // Should be ~30 days ago (within 1 second of tolerance)
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(calledDate).toBeGreaterThanOrEqual(before - thirtyDaysMs - 1000);
    expect(calledDate).toBeLessThanOrEqual(after - thirtyDaysMs + 1000);
  });
});
