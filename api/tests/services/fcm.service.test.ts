import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  getFirebaseAdmin: vi.fn(),
}));

import { sendOwnerSosAlert } from '../../src/services/fcm.service.js';
import { getFirebaseAdmin } from '../../src/services/firebaseAdmin.js';

const mockSend = vi.fn().mockResolvedValue('msg-id');

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getFirebaseAdmin).mockReturnValue({
    messaging: () => ({ send: mockSend }),
  } as any);
});

describe('sendOwnerSosAlert', () => {
  it('sendOwnerSosAlert_does_not_leak_address_in_fcm_payload', async () => {
    await sendOwnerSosAlert({
      bookingId: 'bk-1',
      customerId: 'cust-1',
      technicianId: 'tech-1',
      incidentId: 'bk-1',
    });

    expect(mockSend).toHaveBeenCalledOnce();
    const firstCall = mockSend.mock.calls[0]!;
    const message = firstCall[0] as { data: Record<string, string>; topic: string };
    expect(message.data).not.toHaveProperty('slotAddress');
    expect(message.data.type).toBe('SOS_ALERT');
    expect(message.data.incidentId).toBe('bk-1');
  });
});
