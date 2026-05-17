import { describe, it, expect } from 'vitest';
import { generateSlots } from '../../../src/shared/slot-utils.js';
import type { Service } from '../../../src/schemas/service.js';

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: 'svc-ac',
    categoryId: 'cat-1',
    name: 'AC Deep Clean',
    shortDescription: 'Deep clean',
    heroImageUrl: 'https://example.com/img.jpg',
    basePrice: 59900,
    commissionBps: 2000,
    durationMinutes: 60,
    includes: [],
    faq: [],
    addOns: [],
    photoStages: [],
    isActive: true,
    updatedBy: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('generateSlots', () => {
  it('generates 12 hourly slots for a 60-min service with default 08:00–20:00 window', () => {
    const slots = generateSlots(makeService(), '2026-05-20');
    expect(slots).toHaveLength(12);
    expect(slots[0]).toBe('08:00-09:00');
    expect(slots[11]).toBe('19:00-20:00');
  });

  it('generates 6 slots for a 120-min service with default window', () => {
    const slots = generateSlots(makeService({ durationMinutes: 120 }), '2026-05-20');
    expect(slots).toHaveLength(6);
    expect(slots[0]).toBe('08:00-10:00');
    expect(slots[5]).toBe('18:00-20:00');
  });

  it('respects custom workStart and workEnd', () => {
    const slots = generateSlots(makeService({ workStart: '09:00', workEnd: '12:00' }), '2026-05-20');
    // 3 × 60-min slots: 09:00, 10:00, 11:00
    expect(slots).toHaveLength(3);
    expect(slots[0]).toBe('09:00-10:00');
    expect(slots[2]).toBe('11:00-12:00');
  });

  it('returns empty array when workStart equals workEnd', () => {
    const slots = generateSlots(makeService({ workStart: '08:00', workEnd: '08:00' }), '2026-05-20');
    expect(slots).toHaveLength(0);
  });

  it('does not include a slot whose end would exceed workEnd', () => {
    // 90-min service, 08:00–11:00 → fits: 08:00-09:30, 09:30-11:00; next would be 11:00-12:30 (exceeds 11:00)
    const slots = generateSlots(makeService({ durationMinutes: 90, workStart: '08:00', workEnd: '11:00' }), '2026-05-20');
    expect(slots).toHaveLength(2);
    expect(slots[1]).toBe('09:30-11:00');
  });

  it('formats minutes correctly (e.g., 08:30-09:30)', () => {
    const slots = generateSlots(makeService({ durationMinutes: 30, workStart: '08:00', workEnd: '09:30' }), '2026-05-20');
    expect(slots).toContain('08:00-08:30');
    expect(slots).toContain('08:30-09:00');
    expect(slots).toContain('09:00-09:30');
  });
});
