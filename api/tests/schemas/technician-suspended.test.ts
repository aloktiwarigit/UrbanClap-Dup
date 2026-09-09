import { describe, it, expect } from 'vitest';
import { TechnicianProfileSchema } from '../../src/schemas/technician.js';

const base = {
  id: 'tech-1',
  technicianId: 'tech-1',
  location: { type: 'Point' as const, coordinates: [77.5946, 12.9716] as [number, number] },
  skills: ['svc-plumbing'],
  availabilityWindows: [],
  isOnline: true,
  isAvailable: true,
  kycStatus: 'APPROVED' as const,
};

describe('TechnicianProfileSchema.suspended', () => {
  it('accepts a document with no suspended field (every stored doc today)', () => {
    const parsed = TechnicianProfileSchema.parse(base);
    expect(parsed.suspended).toBeUndefined();
  });

  it('parses suspended:true and preserves it', () => {
    expect(TechnicianProfileSchema.parse({ ...base, suspended: true }).suspended).toBe(true);
  });

  it('parses suspended:false and preserves it', () => {
    expect(TechnicianProfileSchema.parse({ ...base, suspended: false }).suspended).toBe(false);
  });

  it('rejects a non-boolean suspended (write-path strictness is unchanged)', () => {
    expect(() => TechnicianProfileSchema.parse({ ...base, suspended: 'yes' })).toThrow();
  });
});
