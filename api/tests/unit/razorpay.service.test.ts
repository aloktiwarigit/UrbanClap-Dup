import { describe, it, expect, vi } from 'vitest';
import { createHmac } from 'node:crypto';

vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test_key');
vi.stubEnv('RAZORPAY_KEY_SECRET', 'rzp_test_secret');

vi.mock('razorpay', () => ({
  default: vi.fn().mockImplementation(() => ({
    orders: { create: vi.fn().mockResolvedValue({ id: 'order_abc', amount: 59900, currency: 'INR' }) },
  })),
}));

import { createRazorpayOrder, verifyPaymentSignature } from '../../src/services/razorpay.service.js';

describe('createRazorpayOrder', () => {
  it('returns id and amount from Razorpay', async () => {
    const r = await createRazorpayOrder({ amount: 59900, currency: 'INR', receipt: 'bk-1' });
    expect(r.id).toBe('order_abc');
    expect(r.amount).toBe(59900);
  });
});

describe('verifyPaymentSignature', () => {
  it('returns true for valid HMAC', () => {
    const sig = createHmac('sha256', 'rzp_test_secret').update('order_1|pay_1').digest('hex');
    expect(verifyPaymentSignature({ razorpayOrderId: 'order_1', razorpayPaymentId: 'pay_1', razorpaySignature: sig })).toBe(true);
  });
  it('returns false for tampered signature', () => {
    expect(verifyPaymentSignature({ razorpayOrderId: 'o1', razorpayPaymentId: 'p1', razorpaySignature: 'tampered' })).toBe(false);
  });
});
