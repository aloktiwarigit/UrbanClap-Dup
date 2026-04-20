import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import { getCosmosClient } from '../../src/cosmos/client.js';
import { upsertKycStatus, getKycByTechnicianId } from '../../src/cosmos/technician-repository.js';

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
