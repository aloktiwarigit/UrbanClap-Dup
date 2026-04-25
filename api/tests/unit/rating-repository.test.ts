import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockItem, mockContainer } = vi.hoisted(() => {
  const mockItem = { read: vi.fn(), replace: vi.fn() };
  const mockContainer = {
    item: vi.fn(() => mockItem),
    items: { create: vi.fn() },
  };
  return { mockItem, mockContainer };
});

vi.mock('../../src/cosmos/client.js', () => ({
  getRatingsContainer: () => mockContainer,
}));

import { ratingRepo } from '../../src/cosmos/rating-repository.js';

const baseDoc = { id: 'bk-1', bookingId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1' };

beforeEach(() => {
  vi.resetAllMocks();
  mockContainer.item.mockReturnValue(mockItem);
  mockItem.read.mockResolvedValue({ resource: undefined });
  mockItem.replace.mockImplementation((doc: any) => Promise.resolve({ resource: doc }));
  mockContainer.items.create.mockImplementation((doc: any) => Promise.resolve({ resource: doc }));
});

describe('ratingRepo.submitSide', () => {
  it('creates a fresh doc with customer fields when no doc exists and side is CUSTOMER_TO_TECH', async () => {
    const result = await ratingRepo.submitSide({
      bookingId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
      side: 'CUSTOMER_TO_TECH',
      overall: 5, subScores: { punctuality: 5, skill: 5, behaviour: 5 }, comment: 'great',
    });
    expect(mockContainer.items.create).toHaveBeenCalled();
    const created = mockContainer.items.create.mock.calls[0]?.[0] as { id: string } | undefined;
    expect(created?.id).toBe('bk-1');
    expect(result?.customerOverall).toBe(5);
    expect(result?.customerSubmittedAt).toBeTruthy();
    expect(result?.revealedAt).toBeUndefined();
  });

  it('updates existing doc with tech fields and sets revealedAt when both sides present', async () => {
    mockItem.read.mockResolvedValue({
      resource: {
        ...baseDoc,
        customerOverall: 5, customerSubScores: { punctuality: 5, skill: 5, behaviour: 5 },
        customerSubmittedAt: '2026-04-24T12:00:00.000Z',
      },
    });
    const result = await ratingRepo.submitSide({
      bookingId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
      side: 'TECH_TO_CUSTOMER',
      overall: 4, subScores: { behaviour: 4, communication: 5 },
    });
    expect(result?.techOverall).toBe(4);
    expect(result?.revealedAt).toBeTruthy();
    expect(result?.customerOverall).toBe(5);
  });

  it('returns null on duplicate submission for the same side', async () => {
    mockItem.read.mockResolvedValue({
      resource: {
        ...baseDoc, customerOverall: 5,
        customerSubScores: { punctuality: 5, skill: 5, behaviour: 5 },
        customerSubmittedAt: '2026-04-24T12:00:00.000Z',
      },
    });
    const result = await ratingRepo.submitSide({
      bookingId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
      side: 'CUSTOMER_TO_TECH',
      overall: 1, subScores: { punctuality: 1, skill: 1, behaviour: 1 },
    });
    expect(result).toBeNull();
  });
});

describe('ratingRepo.getByBookingId', () => {
  it('returns null when doc does not exist', async () => {
    mockItem.read.mockResolvedValue({ resource: undefined });
    expect(await ratingRepo.getByBookingId('bk-missing')).toBeNull();
  });

  it('returns the doc when found', async () => {
    mockItem.read.mockResolvedValue({ resource: { ...baseDoc, customerOverall: 5 } });
    const doc = await ratingRepo.getByBookingId('bk-1');
    expect(doc?.customerOverall).toBe(5);
  });
});
