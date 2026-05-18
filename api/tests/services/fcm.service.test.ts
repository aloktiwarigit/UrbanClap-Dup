import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mocks before imports so module-level vi.mock factories can reference them.
const { mockSend, mockSendEachForMulticast, mockGetDeviceTokens, mockGetAdminDeviceTokens } = vi.hoisted(() => ({
  mockSend: vi.fn().mockResolvedValue('msg-id'),
  mockSendEachForMulticast: vi.fn().mockResolvedValue({
    successCount: 1,
    failureCount: 0,
    responses: [{ success: true }],
  }),
  mockGetDeviceTokens: vi.fn<(userId: string) => Promise<string[]>>(),
  // Default empty: exercises the topic fallback path for owner alerts
  mockGetAdminDeviceTokens: vi.fn<() => Promise<string[]>>().mockResolvedValue([]),
}));

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  getFirebaseAdmin: () => ({
    messaging: () => ({
      send: mockSend,
      sendEachForMulticast: mockSendEachForMulticast,
    }),
  }),
}));

vi.mock('../../src/cosmos/device-token-repository.js', () => ({
  deviceTokenRepo: {
    getDeviceTokensForUser: mockGetDeviceTokens,
    getAllAdminDeviceTokens: mockGetAdminDeviceTokens,
  },
}));

import {
  sendOwnerSosAlert,
  sendPriceApprovalPush,
  sendBookingStatusUpdatePush,
  sendOwnerRouteAlert,
  sendAbusiveShieldAlert,
} from '../../src/services/fcm.service.js';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// sendOwnerSosAlert — PII trim
// ---------------------------------------------------------------------------
describe('sendOwnerSosAlert', () => {
  it('sendOwnerSosAlert_does_not_leak_address_in_fcm_payload', async () => {
    await sendOwnerSosAlert({
      bookingId: 'bk-1',
      customerId: 'cust-1',
      technicianId: 'tech-1',
      incidentId: 'inc-1',
    });

    expect(mockSend).toHaveBeenCalledOnce();
    const message = mockSend.mock.calls[0]![0] as { data: Record<string, string>; topic: string };
    expect(message.data).not.toHaveProperty('slotAddress');
    expect(message.data).not.toHaveProperty('customerId');
    expect(message.data).not.toHaveProperty('technicianId');
    expect(message.data.type).toBe('SOS_ALERT');
    expect(message.data.incidentId).toBe('inc-1');
    expect(message.data.bookingId).toBe('bk-1');
    // SOS stays on owner_alerts topic until admin device enrollment is live (ADR-0026 §5)
    expect(message.topic).toBe('owner_alerts');
  });
});

// ---------------------------------------------------------------------------
// sendAbusiveShieldAlert — PII trim (customerId removed)
// ---------------------------------------------------------------------------
describe('sendAbusiveShieldAlert', () => {
  it('does not include customerId in the FCM payload', async () => {
    await sendAbusiveShieldAlert({
      bookingId: 'bk-2',
      technicianId: 'tech-2',
      customerId: 'cust-2',
    });

    expect(mockSend).toHaveBeenCalledOnce();
    const message = mockSend.mock.calls[0]![0] as { data: Record<string, string> };
    expect(message.data).not.toHaveProperty('customerId');
    expect(message.data.technicianId).toBe('tech-2');
    expect(message.data.type).toBe('ABUSIVE_SHIELD_ALERT');
  });
});

// ---------------------------------------------------------------------------
// sendOwnerRouteAlert — approved non-PII topic exception
// ---------------------------------------------------------------------------
describe('sendOwnerRouteAlert', () => {
  it('uses owner_alerts topic and contains only aggregate counts', async () => {
    await sendOwnerRouteAlert({ stalePending: 3, failed: 1 });

    expect(mockSend).toHaveBeenCalledOnce();
    const message = mockSend.mock.calls[0]![0] as { data: Record<string, string>; topic: string };
    expect(message.topic).toBe('owner_alerts');
    expect(message.data.type).toBe('RECON_MISMATCH_ALERT');
    expect(message.data.stalePending).toBe('3');
    expect(message.data.failed).toBe('1');
    // Must not contain any user-identifying fields
    expect(message.data).not.toHaveProperty('customerId');
    expect(message.data).not.toHaveProperty('technicianId');
    expect(message.data).not.toHaveProperty('userId');
  });
});

// ---------------------------------------------------------------------------
// Group A — customer device-token sends
// ---------------------------------------------------------------------------
describe('sendPriceApprovalPush — device-token send', () => {
  it('calls sendEachForMulticast with all customer tokens when multiple exist', async () => {
    mockGetDeviceTokens.mockResolvedValue(['tok-a', 'tok-b']);

    await sendPriceApprovalPush('cust-10', 'bk-10');

    expect(mockGetDeviceTokens).toHaveBeenCalledWith('cust-10');
    expect(mockSendEachForMulticast).toHaveBeenCalledOnce();
    const call = mockSendEachForMulticast.mock.calls[0]![0] as {
      tokens: string[];
      data: Record<string, string>;
    };
    expect(call.tokens).toEqual(['tok-a', 'tok-b']);
    expect(call.data.type).toBe('ADDON_APPROVAL_REQUESTED');
    expect(call.data.bookingId).toBe('bk-10');
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('calls send (single) when customer has exactly one token', async () => {
    mockGetDeviceTokens.mockResolvedValue(['tok-single']);

    await sendPriceApprovalPush('cust-11', 'bk-11');

    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0]![0] as { token: string; data: Record<string, string> };
    expect(call.token).toBe('tok-single');
    expect(call.data.type).toBe('ADDON_APPROVAL_REQUESTED');
    expect(mockSendEachForMulticast).not.toHaveBeenCalled();
  });

  it('skips send when customer has no registered tokens', async () => {
    mockGetDeviceTokens.mockResolvedValue([]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await sendPriceApprovalPush('cust-no-device', 'bk-12');

    expect(mockSend).not.toHaveBeenCalled();
    expect(mockSendEachForMulticast).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no device tokens'));
    warnSpy.mockRestore();
  });
});

describe('sendBookingStatusUpdatePush — device-token send', () => {
  it('fans out to customer device tokens', async () => {
    mockGetDeviceTokens.mockResolvedValue(['tok-c']);

    await sendBookingStatusUpdatePush({
      customerId: 'cust-20',
      bookingId: 'bk-20',
      status: 'COMPLETED',
    });

    expect(mockGetDeviceTokens).toHaveBeenCalledWith('cust-20');
    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0]![0] as { token: string; data: Record<string, string> };
    expect(call.token).toBe('tok-c');
    expect(call.data.status).toBe('COMPLETED');
    // Must not use topic-based send
    expect(call).not.toHaveProperty('topic');
  });
});
