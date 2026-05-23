import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import { getCosmosClient } from '../../src/cosmos/client.js';
import {
  getKycByTechnicianId,
  getTechnicianServiceProfile,
  patchTechnicianServiceProfile,
  upsertKycStatus,
} from '../../src/cosmos/technician-repository.js';

describe('upsertKycStatus', () => {
  it('upserts with merged kyc fields', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    const mockRead = vi.fn().mockResolvedValue({ resource: { id: 'tech_1' } });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: mockRead }),
        items: { upsert: mockUpsert },
      }) }),
    });

    await upsertKycStatus('tech_1', { kycStatus: 'AADHAAR_DONE', aadhaarVerified: true, aadhaarMaskedNumber: 'XXXX-XXXX-1234' });
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      kyc: expect.objectContaining({ kycStatus: 'AADHAAR_DONE', aadhaarVerified: true }),
    }));
  });

  it('creates new document when technician does not exist', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    const mockRead = vi.fn().mockResolvedValue({ resource: undefined });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: mockRead }),
        items: { upsert: mockUpsert },
      }) }),
    });

    await upsertKycStatus('tech_new', { kycStatus: 'PENDING' });
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      id: 'tech_new',
      kyc: expect.objectContaining({ kycStatus: 'PENDING' }),
    }));
  });

  it('[E19-S01] writes panMaskedNumber + panHash when provided, zeroes raw panNumber', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    const mockRead = vi.fn().mockResolvedValue({ resource: { id: 'tech_1' } });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: mockRead }),
        items: { upsert: mockUpsert },
      }) }),
    });

    const fakeHash = 'a'.repeat(64);
    await upsertKycStatus('tech_1', {
      kycStatus: 'PAN_DONE',
      panMaskedNumber: 'XXXXX1234F',
      panHash: fakeHash,
      panNumber: null,
    });

    const call = mockUpsert.mock.calls[0];
    const kyc = (call?.[0] as Record<string, unknown>)['kyc'] as Record<string, unknown>;
    expect(kyc['panMaskedNumber']).toBe('XXXXX1234F');
    expect(kyc['panHash']).toBe(fakeHash);
    expect(kyc['panNumber']).toBeNull();
  });

  it('[E19-S01] initializes panMaskedNumber and panHash to null for new docs', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    const mockRead = vi.fn().mockResolvedValue({ resource: undefined });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: mockRead }),
        items: { upsert: mockUpsert },
      }) }),
    });

    await upsertKycStatus('tech_fresh', { kycStatus: 'PENDING' });

    const call = mockUpsert.mock.calls[0];
    const kyc = (call?.[0] as Record<string, unknown>)['kyc'] as Record<string, unknown>;
    expect(kyc['panMaskedNumber']).toBeNull();
    expect(kyc['panHash']).toBeNull();
  });
});

describe('getKycByTechnicianId', () => {
  it('returns kyc subdocument when present', async () => {
    const mockKyc = { aadhaarVerified: true, aadhaarMaskedNumber: 'XXXX-XXXX-1234', panNumber: null, panImagePath: null, kycStatus: 'AADHAAR_DONE', updatedAt: '2026-01-01T00:00:00.000Z' };
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: vi.fn().mockResolvedValue({ resource: { id: 'tech_1', kyc: mockKyc } }) }),
      }) }),
    });
    const result = await getKycByTechnicianId('tech_1');
    expect(result?.kycStatus).toBe('AADHAAR_DONE');
  });

  it('returns null when technician has no kyc', async () => {
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: vi.fn().mockResolvedValue({ resource: { id: 'tech_1' } }) }),
      }) }),
    });
    const result = await getKycByTechnicianId('tech_1');
    expect(result).toBeNull();
  });

  it('returns null when technician document does not exist', async () => {
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: vi.fn().mockResolvedValue({ resource: undefined }) }),
      }) }),
    });
    const result = await getKycByTechnicianId('tech_missing');
    expect(result).toBeNull();
  });
});

describe('technician service profile helpers', () => {
  it('returns empty skills and null location when document is missing', async () => {
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: vi.fn().mockRejectedValue({ code: 404 }) }),
      }) }),
    });

    const result = await getTechnicianServiceProfile('tech_missing');

    expect(result).toEqual({ skills: [], location: null });
  });

  it('maps GeoJSON coordinates to lat/lng on read', async () => {
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({
          read: vi.fn().mockResolvedValue({
            resource: {
              id: 'tech_1',
              skills: ['svc-plumbing'],
              location: { type: 'Point', coordinates: [77.5946, 12.9716] },
            },
          }),
        }),
      }) }),
    });

    const result = await getTechnicianServiceProfile('tech_1');

    expect(result).toEqual({
      skills: ['svc-plumbing'],
      location: { lat: 12.9716, lng: 77.5946 },
    });
  });

  it('patches skills and location while initializing non-dispatchable defaults', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: vi.fn().mockResolvedValue({ resource: undefined }) }),
        items: { upsert: mockUpsert },
      }) }),
    });

    const result = await patchTechnicianServiceProfile('tech_new', {
      skills: ['svc-plumbing'],
      location: { lat: 12.9716, lng: 77.5946 },
    });

    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      id: 'tech_new',
      technicianId: 'tech_new',
      skills: ['svc-plumbing'],
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      availabilityWindows: [],
      isOnline: false,
      isAvailable: false,
      kycStatus: 'PENDING',
    }));
    expect(result).toEqual({
      skills: ['svc-plumbing'],
      location: { lat: 12.9716, lng: 77.5946 },
    });
  });

  it('preserves existing dispatch and KYC fields when patching skills only', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    const existing = {
      id: 'tech_1',
      technicianId: 'tech_1',
      displayName: 'Existing Tech',
      skills: ['svc-old'],
      location: { type: 'Point', coordinates: [77.5, 12.9] },
      availabilityWindows: [{ dayOfWeek: 1, startHour: 8, endHour: 12 }],
      isOnline: true,
      isAvailable: true,
      kycStatus: 'APPROVED',
    };
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({
        item: () => ({ read: vi.fn().mockResolvedValue({ resource: existing }) }),
        items: { upsert: mockUpsert },
      }) }),
    });

    await patchTechnicianServiceProfile('tech_1', { skills: ['svc-plumbing'] });

    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      displayName: 'Existing Tech',
      skills: ['svc-plumbing'],
      location: { type: 'Point', coordinates: [77.5, 12.9] },
      availabilityWindows: [{ dayOfWeek: 1, startHour: 8, endHour: 12 }],
      isOnline: true,
      isAvailable: true,
      kycStatus: 'APPROVED',
    }));
  });
});
