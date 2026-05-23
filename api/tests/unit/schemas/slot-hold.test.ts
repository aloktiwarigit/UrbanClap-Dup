import { describe, it, expect } from 'vitest';
import { SlotHoldDocSchema, type SlotHoldDoc } from '../../../src/schemas/slot-hold.js';

const VALID_HOLD: SlotHoldDoc = {
  id: 'svc-ac|2026-05-20|10:00-11:00',
  servicePartitionKey: 'svc-ac|2026-05-20',
  serviceId: 'svc-ac',
  date: '2026-05-20',
  window: '10:00-11:00',
  customerId: 'cust-1',
  heldAt: '2026-05-20T04:30:00.000Z',
};

describe('SlotHoldDocSchema', () => {
  it('accepts a valid soft hold (no bookingId / ttl)', () => {
    expect(() => SlotHoldDocSchema.parse(VALID_HOLD)).not.toThrow();
  });

  it('accepts a committed hold with bookingId and ttl=-1', () => {
    const committed = { ...VALID_HOLD, bookingId: 'bk-999', ttl: -1 };
    expect(() => SlotHoldDocSchema.parse(committed)).not.toThrow();
  });

  it('rejects when required field id is missing', () => {
    const { id: _id, ...without } = VALID_HOLD;
    expect(SlotHoldDocSchema.safeParse(without).success).toBe(false);
  });

  it('rejects malformed date (wrong format)', () => {
    const result = SlotHoldDocSchema.safeParse({ ...VALID_HOLD, date: '20-05-2026' });
    expect(result.success).toBe(false);
  });

  it('rejects malformed window (missing separator)', () => {
    const result = SlotHoldDocSchema.safeParse({ ...VALID_HOLD, window: '1000-1100' });
    expect(result.success).toBe(false);
  });

  it('rejects non-datetime heldAt', () => {
    const result = SlotHoldDocSchema.safeParse({ ...VALID_HOLD, heldAt: '2026-05-20' });
    expect(result.success).toBe(false);
  });
});

describe('AvailabilityResponseSchema', () => {
  it('round-trips a mixed-availability slot array', async () => {
    const { AvailabilityResponseSchema } = await import('../../../src/schemas/service.js');
    const input = {
      serviceId: 'svc-ac',
      date: '2026-05-20',
      slotGranularityMinutes: 60,
      slots: [
        { window: '08:00-09:00', available: true },
        { window: '09:00-10:00', available: false },
        { window: '10:00-11:00', available: true },
      ],
    };
    const result = AvailabilityResponseSchema.parse(input);
    expect(result.slots).toHaveLength(3);
    expect(result.slots[1]!.available).toBe(false);
  });
});
