import { describe, it, expect } from 'vitest';
import { calculateCommission } from '../../src/services/commission.service.js';

describe('calculateCommission', () => {
  it('computes commission for 2200 bps on 10000 paise', () => {
    const result = calculateCommission(10000, 2200);
    expect(result).toEqual({ commissionBps: 2200, commissionAmount: 2200, techAmount: 7800 });
  });

  it('computes commission for 2500 bps on 10000 paise', () => {
    const result = calculateCommission(10000, 2500);
    expect(result).toEqual({ commissionBps: 2500, commissionAmount: 2500, techAmount: 7500 });
  });

  it('computes commission for 2500 bps on 50000 paise', () => {
    const result = calculateCommission(50000, 2500);
    expect(result).toEqual({ commissionBps: 2500, commissionAmount: 12500, techAmount: 37500 });
  });

  it('rounds commission to nearest integer paise', () => {
    // 9999 * 2200 / 10000 = 2199.78 → rounds to 2200; techAmount = 7799
    const result = calculateCommission(9999, 2200);
    expect(result.commissionAmount).toBe(2200);
    expect(result.techAmount).toBe(7799);
    expect(result.commissionAmount + result.techAmount).toBe(9999);
  });

  it('rounds down when fractional part < 0.5', () => {
    // 10001 * 2200 / 10000 = 2200.22 → rounds to 2200; techAmount = 7801
    const result = calculateCommission(10001, 2200);
    expect(result.commissionAmount).toBe(2200);
    expect(result.techAmount).toBe(7801);
    expect(result.commissionAmount + result.techAmount).toBe(10001);
  });

  it('commissionAmount + techAmount always equals bookingAmountPaise', () => {
    for (const amount of [1, 100, 9999, 50000, 99999, 500000]) {
      const r22 = calculateCommission(amount, 2200);
      expect(r22.commissionAmount + r22.techAmount).toBe(amount);
      const r25 = calculateCommission(amount, 2500);
      expect(r25.commissionAmount + r25.techAmount).toBe(amount);
    }
  });
});
