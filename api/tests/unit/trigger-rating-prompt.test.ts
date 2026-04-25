import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../src/services/fcm.service.js');
vi.mock('../../src/cosmos/rating-repository.js', () => ({
  ratingRepo: { getByBookingId: vi.fn() },
}));

import { dispatchRatingPrompt } from '../../src/functions/trigger-rating-prompt.js';
import { sendRatingPromptCustomerPush, sendRatingPromptTechnicianPush }
  from '../../src/services/fcm.service.js';
import { ratingRepo } from '../../src/cosmos/rating-repository.js';

const ctx = { log: vi.fn() } as unknown as InvocationContext;

const closed = {
  id: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1', status: 'CLOSED',
  serviceId: 's', categoryId: 'c', slotDate: '2026-04-24', slotWindow: '09:00-11:00',
  addressText: 'x', addressLatLng: { lat: 0, lng: 0 }, paymentOrderId: 'o', paymentId: 'p',
  paymentSignature: 's', amount: 100, createdAt: '2026-04-24T09:00:00.000Z',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(ratingRepo.getByBookingId).mockResolvedValue(null);
  vi.mocked(sendRatingPromptCustomerPush).mockResolvedValue(undefined);
  vi.mocked(sendRatingPromptTechnicianPush).mockResolvedValue(undefined);
});

describe('dispatchRatingPrompt', () => {
  it('skips when status is not CLOSED', async () => {
    await dispatchRatingPrompt({ ...closed, status: 'PAID' }, ctx);
    expect(sendRatingPromptCustomerPush).not.toHaveBeenCalled();
  });

  it('skips silently when technicianId is missing', async () => {
    await dispatchRatingPrompt({ ...closed, technicianId: undefined }, ctx);
    expect(sendRatingPromptCustomerPush).not.toHaveBeenCalled();
  });

  it('skips on idempotency hit (rating doc already exists)', async () => {
    vi.mocked(ratingRepo.getByBookingId).mockResolvedValue({ bookingId: 'bk-1' } as any);
    await dispatchRatingPrompt(closed, ctx);
    expect(sendRatingPromptCustomerPush).not.toHaveBeenCalled();
    expect(sendRatingPromptTechnicianPush).not.toHaveBeenCalled();
  });

  it('sends FCM to both sides on first CLOSED fire', async () => {
    await dispatchRatingPrompt(closed, ctx);
    expect(sendRatingPromptCustomerPush).toHaveBeenCalledWith('cust-1', 'bk-1');
    expect(sendRatingPromptTechnicianPush).toHaveBeenCalledWith('tech-1', 'bk-1');
  });

  it('isolates errors — one push failure does not abort the other', async () => {
    vi.mocked(sendRatingPromptCustomerPush).mockRejectedValue(new Error('FCM down'));
    await expect(dispatchRatingPrompt(closed, ctx)).resolves.toBeUndefined();
    expect(sendRatingPromptTechnicianPush).toHaveBeenCalled();
  });
});
