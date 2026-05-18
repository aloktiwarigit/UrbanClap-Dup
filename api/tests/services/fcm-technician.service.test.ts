import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures mocks exist before the hoisted vi.mock factory runs,
// preventing any TDZ/initialization-order failure across Vitest versions.
const { sendMock, sendEachForMulticastMock, mockGetDeviceTokens } = vi.hoisted(() => ({
  sendMock: vi.fn().mockResolvedValue('mid-1'),
  sendEachForMulticastMock: vi.fn().mockResolvedValue({
    successCount: 2,
    failureCount: 0,
    responses: [{ success: true }, { success: true }],
  }),
  mockGetDeviceTokens: vi.fn<(userId: string) => Promise<string[]>>(),
}));

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  getFirebaseAdmin: () => ({
    messaging: () => ({
      send: sendMock,
      sendEachForMulticast: sendEachForMulticastMock,
    }),
  }),
}));

vi.mock('../../src/cosmos/device-token-repository.js', () => ({
  deviceTokenRepo: { getDeviceTokensForUser: mockGetDeviceTokens },
}));

import { sendTechnicianBookingStatusUpdatePush } from '../../src/services/fcm.service.js';

beforeEach(() => {
  sendMock.mockClear();
  sendEachForMulticastMock.mockClear();
  mockGetDeviceTokens.mockClear();
});

describe('sendTechnicianBookingStatusUpdatePush', () => {
  it('sends to technician device token (single device)', async () => {
    mockGetDeviceTokens.mockResolvedValue(['tok-tech-9']);

    await sendTechnicianBookingStatusUpdatePush({
      technicianId: 'tech-9',
      bookingId: 'bk-1',
      status: 'PRICE_APPROVED',
    });

    expect(mockGetDeviceTokens).toHaveBeenCalledWith('tech-9');
    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0]?.[0] as { token: string; data: Record<string, string> };
    expect(call.token).toBe('tok-tech-9');
    // Must NOT use topic-based send
    expect(call).not.toHaveProperty('topic');
  });

  it('uses sendEachForMulticast when technician has multiple devices', async () => {
    mockGetDeviceTokens.mockResolvedValue(['tok-tech-a', 'tok-tech-b']);

    await sendTechnicianBookingStatusUpdatePush({
      technicianId: 'tech-9',
      bookingId: 'bk-1',
      status: 'PRICE_APPROVED',
    });

    expect(sendEachForMulticastMock).toHaveBeenCalledTimes(1);
    const call = sendEachForMulticastMock.mock.calls[0]?.[0] as {
      tokens: string[];
      data: Record<string, string>;
    };
    expect(call.tokens).toEqual(['tok-tech-a', 'tok-tech-b']);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('emits BOOKING_STATUS_UPDATE with the canonical status key', async () => {
    mockGetDeviceTokens.mockResolvedValue(['tok-tech-9']);

    await sendTechnicianBookingStatusUpdatePush({
      technicianId: 'tech-9',
      bookingId: 'bk-1',
      status: 'PRICE_APPROVED',
    });

    const data = sendMock.mock.calls[0]?.[0].data as Record<string, string>;
    expect(data.type).toBe('BOOKING_STATUS_UPDATE');
    expect(data.bookingId).toBe('bk-1');
    expect(data.status).toBe('PRICE_APPROVED');
  });

  it('serialises priceApprovedPaise as a string when provided', async () => {
    mockGetDeviceTokens.mockResolvedValue(['tok-tech-9']);

    await sendTechnicianBookingStatusUpdatePush({
      technicianId: 'tech-9',
      bookingId: 'bk-1',
      status: 'PRICE_APPROVED',
      priceApprovedPaise: 12500,
    });

    const data = sendMock.mock.calls[0]?.[0].data as Record<string, string>;
    expect(data.priceApprovedPaise).toBe('12500');
  });

  it('omits priceApprovedPaise when not provided', async () => {
    mockGetDeviceTokens.mockResolvedValue(['tok-tech-9']);

    await sendTechnicianBookingStatusUpdatePush({
      technicianId: 'tech-9',
      bookingId: 'bk-1',
      status: 'ASSIGNED',
    });

    const data = sendMock.mock.calls[0]?.[0].data as Record<string, string>;
    expect(data.priceApprovedPaise).toBeUndefined();
  });

  it('skips send when technician has no registered tokens', async () => {
    mockGetDeviceTokens.mockResolvedValue([]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await sendTechnicianBookingStatusUpdatePush({
      technicianId: 'tech-no-device',
      bookingId: 'bk-1',
      status: 'ASSIGNED',
    });

    expect(sendMock).not.toHaveBeenCalled();
    expect(sendEachForMulticastMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no device tokens'));
    warnSpy.mockRestore();
  });
});
