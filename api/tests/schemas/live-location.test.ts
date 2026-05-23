import { describe, it, expect } from 'vitest';
import { PostLocationRequestSchema } from '../../src/schemas/live-location.js';

const validPayload = {
  lat: 28.5,
  lng: 77.1,
  accuracyMeters: 10,
  capturedAt: 1234567890000,
};

describe('live-location schema', () => {
  it('valid payload passes', () => {
    const result = PostLocationRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('lat=91 fails validation', () => {
    const result = PostLocationRequestSchema.safeParse({ ...validPayload, lat: 91 });
    expect(result.success).toBe(false);
  });

  it('lat=-91 fails validation', () => {
    const result = PostLocationRequestSchema.safeParse({ ...validPayload, lat: -91 });
    expect(result.success).toBe(false);
  });

  it('lng=181 fails validation', () => {
    const result = PostLocationRequestSchema.safeParse({ ...validPayload, lng: 181 });
    expect(result.success).toBe(false);
  });

  it('lng=-181 fails validation', () => {
    const result = PostLocationRequestSchema.safeParse({ ...validPayload, lng: -181 });
    expect(result.success).toBe(false);
  });

  it('accuracyMeters=-1 fails', () => {
    const result = PostLocationRequestSchema.safeParse({ ...validPayload, accuracyMeters: -1 });
    expect(result.success).toBe(false);
  });

  it('accuracyMeters=1001 fails', () => {
    const result = PostLocationRequestSchema.safeParse({ ...validPayload, accuracyMeters: 1001 });
    expect(result.success).toBe(false);
  });

  it('capturedAt=1.5 (non-integer) fails', () => {
    const result = PostLocationRequestSchema.safeParse({ ...validPayload, capturedAt: 1.5 });
    expect(result.success).toBe(false);
  });

  it('attestation is optional (absent payload still valid)', () => {
    const result = PostLocationRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attestation).toBeUndefined();
    }
  });

  it('attestation with valid isMock+gpsAccuracyM passes', () => {
    const result = PostLocationRequestSchema.safeParse({
      ...validPayload,
      attestation: { isMock: false, gpsAccuracyM: 8.5 },
    });
    expect(result.success).toBe(true);
  });
});
