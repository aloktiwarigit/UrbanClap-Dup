import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures sendMock exists before the hoisted vi.mock factory runs,
// preventing any TDZ/initialization-order failure across Vitest versions.
const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn().mockResolvedValue('mid-1'),
}));

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  getFirebaseAdmin: () => ({ messaging: () => ({ send: sendMock }) }),
}));

import { sendTechnicianBookingStatusUpdatePush } from '../../src/services/fcm.service.js';

beforeEach(() => sendMock.mockClear());

describe('sendTechnicianBookingStatusUpdatePush', () => {
  it('targets the technician_<id> topic', async () => {
    await sendTechnicianBookingStatusUpdatePush({
      technicianId: 'tech-9',
      bookingId: 'bk-1',
      status: 'PRICE_APPROVED',
    });
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0]?.[0].topic).toBe('technician_tech-9');
  });

  it('emits BOOKING_STATUS_UPDATE with the canonical status key', async () => {
    await sendTechnicianBookingStatusUpdatePush({
      technicianId: 'tech-9',
      bookingId: 'bk-1',
      status: 'PRICE_APPROVED',
    });
    const data = sendMock.mock.calls[0]?.[0].data;
    expect(data.type).toBe('BOOKING_STATUS_UPDATE');
    expect(data.bookingId).toBe('bk-1');
    expect(data.status).toBe('PRICE_APPROVED');
  });

  it('serialises priceApprovedPaise as a string when provided', async () => {
    await sendTechnicianBookingStatusUpdatePush({
      technicianId: 'tech-9',
      bookingId: 'bk-1',
      status: 'PRICE_APPROVED',
      priceApprovedPaise: 12500,
    });
    expect(sendMock.mock.calls[0]?.[0].data.priceApprovedPaise).toBe('12500');
  });

  it('omits priceApprovedPaise when not provided', async () => {
    await sendTechnicianBookingStatusUpdatePush({
      technicianId: 'tech-9',
      bookingId: 'bk-1',
      status: 'ASSIGNED',
    });
    expect(sendMock.mock.calls[0]?.[0].data.priceApprovedPaise).toBeUndefined();
  });
});
