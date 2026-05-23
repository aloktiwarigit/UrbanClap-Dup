import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Cosmos client before importing the module under test.
vi.mock('../../src/cosmos/client.js', () => ({
  getBookingsContainer: vi.fn(),
}));

import { getBookingsContainer } from '../../src/cosmos/client.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';

function makeContainer(resources: unknown[]) {
  return {
    items: {
      query: vi.fn().mockReturnValue({
        fetchNext: vi.fn().mockResolvedValue({ resources }),
      }),
    },
  };
}

describe('bookingRepo.hasActiveBookingForTechnician', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true when an active booking exists', async () => {
    vi.mocked(getBookingsContainer).mockReturnValue(
      makeContainer([{ id: 'bk-1', status: 'IN_PROGRESS' }]) as never,
    );

    const result = await bookingRepo.hasActiveBookingForTechnician('tech-123');

    expect(result).toBe(true);
  });

  it('returns false when no active bookings exist', async () => {
    vi.mocked(getBookingsContainer).mockReturnValue(
      makeContainer([]) as never,
    );

    const result = await bookingRepo.hasActiveBookingForTechnician('tech-123');

    expect(result).toBe(false);
  });
});
