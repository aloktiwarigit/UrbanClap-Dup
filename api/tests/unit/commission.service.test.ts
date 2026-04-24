import { describe, it, expect } from 'vitest';
import { calculateCommission } from '../../src/services/commission.service.js';

describe('calculateCommission', () => {
  it('applies 22% (2200 bps) when completedJobCount is 0', () => {
    const result = calculateCommission(0, 10000);
    expect(result).toEqual({ commissionBps: 2200, commissionAmount: 2200, techAmount: 7800 });
  });

  it('applies 22% (2200 bps) when completedJobCount is 49', () => {
    const result = calculateCommission(49, 10000);
    expect(result).toEqual({ commissionBps: 2200, commissionAmount: 2200, techAmount: 7800 });
  });

  it('applies 25% (2500 bps) when completedJobCount is exactly 50', () => {
    const result = calculateCommission(50, 10000);
    expect(result).toEqual({ commissionBps: 2500, commissionAmount: 2500, techAmount: 7500 });
  });

  it('applies 25% (2500 bps) when completedJobCount is above 50', () => {
    const result = calculateCommission(99, 50000);
    expect(result).toEqual({ commissionBps: 2500, commissionAmount: 12500, techAmount: 37500 });
  });

  it('rounds commission to nearest integer paise', () => {
    // 9999 * 0.22 = 2199.78 → rounds to 2200; techAmount = 7799
    const result = calculateCommission(0, 9999);
    expect(result.commissionAmount).toBe(2200);
    expect(result.techAmount).toBe(7799);
    expect(result.commissionAmount + result.techAmount).toBe(9999);
  });

  it('techAmount + commissionAmount always equals bookingAmount', () => {
    for (const amount of [1, 100, 9999, 50000, 99999, 500000]) {
      const r22 = calculateCommission(0, amount);
      expect(r22.commissionAmount + r22.techAmount).toBe(amount);
      const r25 = calculateCommission(50, amount);
      expect(r25.commissionAmount + r25.techAmount).toBe(amount);
    }
  });
});
