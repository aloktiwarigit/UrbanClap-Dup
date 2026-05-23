import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  reassignOrder,
  completeOrder,
  refundOrder,
  waiveFeeOrder,
  escalateOrder,
  addOrderNote,
  fetchTechnicianCandidatesForOrder,
} from '../src/api/orders';

const mockOrder = {
  id: 'ord_1',
  customerId: 'c1',
  customerName: 'Test',
  customerPhone: '9999999999',
  status: 'ASSIGNED' as const,
  city: 'Bengaluru',
  scheduledAt: new Date().toISOString(),
  amount: 500,
  createdAt: new Date().toISOString(),
};

describe('order override API clients', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOrder,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reassignOrder calls correct URL and method', async () => {
    const result = await reassignOrder('ord_1', { technicianId: 'tech_2', reason: 'Customer request' });
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/admin-api/v1/admin/orders/ord_1/reassign'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.id).toBe('ord_1');
  });

  it('completeOrder calls correct URL and method', async () => {
    const result = await completeOrder('ord_1', { reason: 'Job done' });
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/admin-api/v1/admin/orders/ord_1/complete'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.id).toBe('ord_1');
  });

  it('refundOrder calls correct URL and method', async () => {
    const result = await refundOrder('ord_1', { reason: 'Service not rendered', amountPaise: 50000 });
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/admin-api/v1/admin/orders/ord_1/refund'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.id).toBe('ord_1');
  });

  it('waiveFeeOrder calls correct URL and method', async () => {
    const result = await waiveFeeOrder('ord_1', { reason: 'Goodwill gesture' });
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/admin-api/v1/admin/orders/ord_1/waive-fee'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.id).toBe('ord_1');
  });

  it('escalateOrder calls correct URL and method', async () => {
    const result = await escalateOrder('ord_1', { reason: 'Customer complaint', priority: 'HIGH' });
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/admin-api/v1/admin/orders/ord_1/escalate'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.id).toBe('ord_1');
  });

  it('addOrderNote calls correct /note URL and method', async () => {
    const result = await addOrderNote('ord_1', { note: 'Follow up needed' });
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/admin-api/v1/admin/orders/ord_1/note'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.id).toBe('ord_1');
  });

  it('fetchTechnicianCandidatesForOrder calls candidate URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ technicians: [{ technicianId: 'tech_2', displayName: 'Ravi', distanceKm: 1.2, isOnline: true, isAvailable: true }] }),
      }),
    );
    const result = await fetchTechnicianCandidatesForOrder('ord_1');
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/admin-api/v1/admin/orders/ord_1/technician-candidates'),
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(result[0]?.technicianId).toBe('tech_2');
  });

  it('reassignOrder throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422 }));
    await expect(
      reassignOrder('ord_1', { technicianId: 't', reason: 'x' }),
    ).rejects.toThrow('422');
  });
});
