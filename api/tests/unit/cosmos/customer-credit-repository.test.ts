import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/cosmos/client.js', () => ({
  getCustomerCreditsContainer: vi.fn(),
}));

import { customerCreditRepo } from '../../../src/cosmos/customer-credit-repository.js';
import { getCustomerCreditsContainer } from '../../../src/cosmos/client.js';
import type { CustomerCreditDoc } from '../../../src/schemas/customer-credit.js';

const mockCreate = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCustomerCreditsContainer).mockReturnValue({
    items: { create: mockCreate },
  } as any);
});

const sampleDoc: CustomerCreditDoc = {
  id: 'bk-1',
  customerId: 'cust-1',
  bookingId: 'bk-1',
  amount: 50_000,
  reason: 'NO_SHOW',
  createdAt: '2026-04-25T04:30:00.000Z',
};

describe('customerCreditRepo.createCreditIfAbsent', () => {
  it('creates document and returns true when no prior entry', async () => {
    mockCreate.mockResolvedValue({});
    const result = await customerCreditRepo.createCreditIfAbsent(sampleDoc);
    expect(result).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith(sampleDoc);
  });

  it('returns false (without throwing) on 409 Conflict', async () => {
    mockCreate.mockRejectedValue({ code: 409 });
    const result = await customerCreditRepo.createCreditIfAbsent(sampleDoc);
    expect(result).toBe(false);
  });

  it('rethrows non-409 errors', async () => {
    mockCreate.mockRejectedValue(new Error('cosmos timeout'));
    await expect(customerCreditRepo.createCreditIfAbsent(sampleDoc))
      .rejects.toThrow('cosmos timeout');
  });
});
