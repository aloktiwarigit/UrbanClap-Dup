import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../../../src/cosmos/orders-repository.js', () => ({
  getOrderById: vi.fn(),
}));

import { getOrderById } from '../../../../src/cosmos/orders-repository.js';
import { adminGetOrderHandler } from '../../../../src/functions/admin/orders/detail.js';

function makeReq(id?: string): HttpRequest {
  return {
    params: id ? { id } : {},
    query: { get: () => null },
  } as unknown as HttpRequest;
}
const mockCtx = {} as InvocationContext;
const mockAdmin = { adminId: 'admin_1', role: 'super-admin' as const, sessionId: 'sess_1' };

const sampleOrder = {
  id: 'ord_1', customerId: 'cust_1', customerName: 'Rahul', customerPhone: '9999999999',
  status: 'ASSIGNED' as const, city: 'Bengaluru',
  scheduledAt: new Date().toISOString(), amount: 599, createdAt: new Date().toISOString(),
};

describe('adminGetOrderHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with order when found', async () => {
    (getOrderById as ReturnType<typeof vi.fn>).mockResolvedValue(sampleOrder);
    const res = await adminGetOrderHandler(makeReq('ord_1'), mockCtx, mockAdmin);
    expect(res.status).toBe(200);
    expect((res.jsonBody as typeof sampleOrder).id).toBe('ord_1');
  });

  it('returns 404 when order not found', async () => {
    (getOrderById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await adminGetOrderHandler(makeReq('nonexistent'), mockCtx, mockAdmin);
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('ORDER_NOT_FOUND');
  });

  it('returns 400 when id param is missing', async () => {
    const res = await adminGetOrderHandler(makeReq(), mockCtx, mockAdmin);
    expect(res.status).toBe(400);
  });
});
