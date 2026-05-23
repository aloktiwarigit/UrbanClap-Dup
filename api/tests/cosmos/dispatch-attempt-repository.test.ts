import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DispatchAttemptDoc } from '../../src/schemas/dispatch-attempt.js';

const mockRead = vi.fn();
const mockReplace = vi.fn();
const mockItem = vi.fn(() => ({ read: mockRead, replace: mockReplace }));

vi.mock('../../src/cosmos/client.js', () => ({
  getDispatchAttemptsContainer: () => ({
    items: { query: vi.fn(() => ({ fetchAll: vi.fn() })) },
    item: mockItem,
  }),
  DB_NAME: 'homeservices',
}));

import { dispatchAttemptRepo } from '../../src/cosmos/dispatch-attempt-repository.js';

const pendingAttempt: DispatchAttemptDoc = {
  id: 'da-1',
  bookingId: 'bk-1',
  technicianIds: ['tech-1'],
  sentAt: '2026-05-08T02:00:00.000Z',
  expiresAt: '2099-01-01T02:00:30.000Z',
  status: 'PENDING',
};

describe('dispatchAttemptRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('acceptAttempt reads and replaces with id as partition key', async () => {
    mockRead.mockResolvedValue({ resource: { ...pendingAttempt, _etag: '"etag-1"' } });
    mockReplace.mockResolvedValue({ resource: { ...pendingAttempt, status: 'ACCEPTED' } });

    const result = await dispatchAttemptRepo.acceptAttempt('da-1', 'bk-1');

    expect(mockItem).toHaveBeenCalledWith('da-1', 'da-1');
    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'da-1', bookingId: 'bk-1', status: 'ACCEPTED' }),
      { accessCondition: { type: 'IfMatch', condition: '"etag-1"' } },
    );
    expect(result?.status).toBe('ACCEPTED');
  });

  it('declineAttempt reads and replaces with id as partition key', async () => {
    mockRead.mockResolvedValue({ resource: { ...pendingAttempt, _etag: '"etag-2"' } });
    mockReplace.mockResolvedValue({ resource: { ...pendingAttempt, status: 'EXPIRED' } });

    const result = await dispatchAttemptRepo.declineAttempt('da-1', 'bk-1');

    expect(mockItem).toHaveBeenCalledWith('da-1', 'da-1');
    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'da-1', bookingId: 'bk-1', status: 'EXPIRED' }),
      { accessCondition: { type: 'IfMatch', condition: '"etag-2"' } },
    );
    expect(result?.status).toBe('EXPIRED');
  });

  it('does not update an attempt when the booking id does not match', async () => {
    mockRead.mockResolvedValue({ resource: { ...pendingAttempt, bookingId: 'other-booking', _etag: '"etag-3"' } });

    const result = await dispatchAttemptRepo.acceptAttempt('da-1', 'bk-1');

    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
