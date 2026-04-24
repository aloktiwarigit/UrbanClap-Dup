import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('razorpay', () => {
  const MockRazorpay = vi.fn().mockImplementation(() => ({
    transfers: { create: vi.fn() },
  }));
  return { default: MockRazorpay };
});

import Razorpay from 'razorpay';
import { RazorpayRouteService } from '../../src/services/razorpayRoute.service.js';

function getMockTransfers() {
  const instance = vi.mocked(Razorpay).mock.results[0]?.value as {
    transfers: { create: ReturnType<typeof vi.fn> };
  };
  return instance.transfers;
}

describe('RazorpayRouteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret';
  });

  it('calls transfers.create with correct params and returns transferId', async () => {
    const service = new RazorpayRouteService();
    getMockTransfers().create.mockResolvedValue({ id: 'trf_abc123' });

    const result = await service.transfer({
      accountId: 'rpacc_test',
      amount: 193750,
      notes: { weekStart: '2026-04-14', technicianId: 'tech-1' },
    });

    expect(getMockTransfers().create).toHaveBeenCalledWith(
      {
        account: 'rpacc_test',
        amount: 193750,
        currency: 'INR',
        on_hold: 0,
        notes: { weekStart: '2026-04-14', technicianId: 'tech-1' },
      },
      undefined,
    );
    expect(result.transferId).toBe('trf_abc123');
  });

  it('passes idempotency key as request header when provided', async () => {
    const createMock = vi.fn().mockResolvedValue({ id: 'trf_idem' });
    vi.mocked(Razorpay).mockImplementation(() => ({
      transfers: { create: createMock },
    }) as unknown as InstanceType<typeof Razorpay>);
    const svc = new RazorpayRouteService();
    await svc.transfer({ accountId: 'acc_1', amount: 100, notes: {}, idempotencyKey: 'tech-1-2026-04-14' });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ account: 'acc_1', amount: 100 }),
      { headers: { 'X-Razorpay-Idempotency-Key': 'tech-1-2026-04-14' } },
    );
  });

  it('throws when RAZORPAY_KEY_ID env var is missing', () => {
    delete process.env.RAZORPAY_KEY_ID;
    expect(() => new RazorpayRouteService()).toThrow('RAZORPAY_KEY_ID');
  });

  it('throws when RAZORPAY_KEY_SECRET env var is missing', () => {
    delete process.env.RAZORPAY_KEY_SECRET;
    expect(() => new RazorpayRouteService()).toThrow('RAZORPAY_KEY_SECRET');
  });
});
