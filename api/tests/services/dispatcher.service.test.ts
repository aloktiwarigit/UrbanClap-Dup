/**
 * Smoke tests for dispatcher.service — verifies it wires to the correct log
 * paths. Full behavioural coverage lives in tests/unit/dispatcher.service.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
  updateBookingFields: vi.fn(),
}));
vi.mock('../../src/cosmos/technician-repository.js', () => ({
  getTechniciansWithinRadius: vi.fn(),
}));
vi.mock('firebase-admin/messaging', () => ({
  getMessaging: vi.fn(),
}));
vi.mock('../../src/cosmos/client.js', () => ({
  getDispatchAttemptsContainer: vi.fn(),
  DB_NAME: 'homeservices',
}));

import { dispatcherService } from '../../src/services/dispatcher.service.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { getTechniciansWithinRadius } from '../../src/cosmos/technician-repository.js';
import { getMessaging } from 'firebase-admin/messaging';
import { getDispatchAttemptsContainer } from '../../src/cosmos/client.js';

describe('dispatcherService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDispatchAttemptsContainer).mockReturnValue({ items: { create: vi.fn().mockResolvedValue({}) } } as any);
    vi.mocked(getMessaging).mockReturnValue({ send: vi.fn().mockResolvedValue('id') } as any);
  });

  it('logs DISPATCH_SKIP when booking is not PAID', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({
      id: 'bk-1', status: 'SEARCHING',
    } as any);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await dispatcherService.triggerDispatch('bk-1');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('DISPATCH_SKIP'));
    spy.mockRestore();
  });

  it('logs DISPATCH_NO_TECHS and resolves when no techs found', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({
      id: 'bk-2', status: 'PAID',
      addressLatLng: { lat: 12.9, lng: 77.5 },
      serviceId: 'svc-1',
    } as any);
    vi.mocked(getTechniciansWithinRadius).mockResolvedValue([]);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await expect(dispatcherService.triggerDispatch('bk-2')).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('DISPATCH_NO_TECHS'));
    spy.mockRestore();
  });
});
