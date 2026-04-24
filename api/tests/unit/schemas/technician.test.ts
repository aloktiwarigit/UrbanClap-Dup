import { describe, it, expect } from 'vitest';
import { TechnicianProfileSchema, GeoPointSchema, AvailabilityWindowSchema } from '../../../src/schemas/technician.js';

const VALID_PROFILE = {
  id: 'tech-001',
  technicianId: 'tech-001',
  location: { type: 'Point' as const, coordinates: [77.6245, 12.9352] as [number, number] },
  skills: ['ac-deep-clean', 'ac-gas-refill'],
  availabilityWindows: [{ dayOfWeek: 1, startHour: 9, endHour: 18 }],
  isOnline: true,
  isAvailable: true,
  kycStatus: 'APPROVED' as const,
  updatedAt: '2026-04-20T00:00:00.000Z',
};

describe('TechnicianProfileSchema', () => {
  it('accepts a valid profile', () => {
    expect(() => TechnicianProfileSchema.parse(VALID_PROFILE)).not.toThrow();
  });

  it('rejects a profile with no skills', () => {
    const result = TechnicianProfileSchema.safeParse({ ...VALID_PROFILE, skills: [] });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid kycStatus', () => {
    const result = TechnicianProfileSchema.safeParse({ ...VALID_PROFILE, kycStatus: 'COMPLETE' });
    expect(result.success).toBe(false);
  });

  it('rejects a location with wrong type', () => {
    const result = TechnicianProfileSchema.safeParse({
      ...VALID_PROFILE,
      location: { type: 'MultiPoint', coordinates: [77.6245, 12.9352] },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a dayOfWeek outside 0-6', () => {
    const result = TechnicianProfileSchema.safeParse({
      ...VALID_PROFILE,
      availabilityWindows: [{ dayOfWeek: 7, startHour: 9, endHour: 18 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('GeoPointSchema', () => {
  it('accepts valid [lng, lat]', () => {
    expect(() => GeoPointSchema.parse({ type: 'Point', coordinates: [77.6245, 12.9352] })).not.toThrow();
  });

  it('rejects coordinates with wrong arity', () => {
    const result = GeoPointSchema.safeParse({ type: 'Point', coordinates: [77.6245] });
    expect(result.success).toBe(false);
  });
});

describe('AvailabilityWindowSchema', () => {
  it('rejects endHour of 0', () => {
    const result = AvailabilityWindowSchema.safeParse({ dayOfWeek: 1, startHour: 9, endHour: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts endHour of 24', () => {
    expect(() => AvailabilityWindowSchema.parse({ dayOfWeek: 0, startHour: 0, endHour: 24 })).not.toThrow();
  });
});
