import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../../../src/cosmos/orders-repository.js', () => ({
  queryOrders: vi.fn(),
}));

import { queryOrders } from '../../../../src/cosmos/orders-repository.js';
import { adminListOrdersHandler } from '../../../../src/functions/admin/orders/list.js';

function makeReq(query: Record<string, string> = {}): HttpRequest {
  const params = new URLSearchParams(query);
  return {
    query: { get: (k: string) => params.get(k), has: (k: string) => params.has(k) },
  } as unknown as HttpRequest;
}
const mockCtx = {} as InvocationContext;
const mockAdmin = { adminId: 'admin_1', role: 'super-admin' as const, sessionId: 'sess_1' };

describe('adminListOrdersHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with order list on valid request', async () => {
    (queryOrders as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [], total: 0, page: 1, pageSize: 50, totalPages: 0,
    });
    const res = await adminListOrdersHandler(makeReq(), mockCtx, mockAdmin);
    expect(res.status).toBe(200);
  });

  it('passes status array to queryOrders', async () => {
    (queryOrders as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [], total: 0, page: 1, pageSize: 50, totalPages: 0,
    });
    await adminListOrdersHandler(makeReq({ status: 'ASSIGNED,COMPLETED' }), mockCtx, mockAdmin);
    const calledWith = (queryOrders as ReturnType<typeof vi.fn>).mock.calls[0]![0]!;
    expect(calledWith.status).toEqual(['ASSIGNED', 'COMPLETED']);
  });

  it('returns 400 on validation error (non-numeric page)', async () => {
    const res = await adminListOrdersHandler(makeReq({ page: 'notanumber' }), mockCtx, mockAdmin);
    expect(res.status).toBe(400);
  });
});
