import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import { getCosmosClient } from '../../src/cosmos/client.js';
import {
  getKycByTechnicianId,
  getTechnicianServiceProfile,
  listAllTechniciansWithHold,
  listTechniciansWithExpiredOverride,
  listTechniciansWithHold,
  patchCommissionHold,
  patchPaymentProfile,
  patchTechnicianServiceProfile,
  readCommissionHold,
  upsertKycStatus,
} from '../../src/cosmos/technician-repository.js';
import type { CommissionHold } from '../../src/schemas/technician.js';

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

describe('readCommissionHold', () => {
  it('returns exists:true and the commissionHold when the technician doc has one', async () => {
    const hold: CommissionHold = { outstandingPaise: 300000, dueCount: 1, state: 'WARN', evaluatedAt: '2026-09-01T00:00:00.000Z' };
    const mockRead = vi.fn().mockResolvedValue({ resource: { id: 't1', commissionHold: hold } });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ read: mockRead }) }) }),
    });

    expect(await readCommissionHold('t1')).toEqual({ exists: true, hold });
  });

  it('returns exists:true, hold:null when the doc exists but has no commissionHold field', async () => {
    const mockRead = vi.fn().mockResolvedValue({ resource: { id: 't1' } });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ read: mockRead }) }) }),
    });

    expect(await readCommissionHold('t1')).toEqual({ exists: true, hold: null });
  });

  it('returns exists:false, hold:null when the technician doc is absent', async () => {
    const mockRead = vi.fn().mockResolvedValue({ resource: undefined });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ read: mockRead }) }) }),
    });

    expect(await readCommissionHold('ghost')).toEqual({ exists: false, hold: null });
  });
});

describe('patchCommissionHold', () => {
  const hold: CommissionHold = { outstandingPaise: 300000, dueCount: 1, state: 'WARN', evaluatedAt: '2026-09-01T00:00:00.000Z' };
  const readStartedAt = '2026-09-01T00:00:00.000Z';

  it('patches /commissionHold with a condition string containing readStartedAt and returns APPLIED', async () => {
    const mockPatch = vi.fn().mockResolvedValue({});
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ patch: mockPatch }) }) }),
    });

    const result = await patchCommissionHold('t1', hold, readStartedAt);

    expect(result).toBe('APPLIED');
    expect(mockPatch).toHaveBeenCalledTimes(1);
    const call = mockPatch.mock.calls[0]![0] as { operations: Array<{ op: string; path: string; value: unknown }>; condition: string };
    expect(call.operations).toEqual([{ op: 'set', path: '/commissionHold', value: hold }]);
    expect(call.condition).toBe(
      `FROM c WHERE NOT IS_DEFINED(c.commissionHold) OR NOT IS_DEFINED(c.commissionHold.evaluatedAt) OR c.commissionHold.evaluatedAt < "${readStartedAt}"`,
    );
  });

  it('maps a 412 precondition failure to STALE', async () => {
    const mockPatch = vi.fn().mockRejectedValue({ code: 412 });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ patch: mockPatch }) }) }),
    });

    expect(await patchCommissionHold('t1', hold, readStartedAt)).toBe('STALE');
  });

  it('maps a 404 not-found to MISSING', async () => {
    const mockPatch = vi.fn().mockRejectedValue({ code: 404 });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ patch: mockPatch }) }) }),
    });

    expect(await patchCommissionHold('t1', hold, readStartedAt)).toBe('MISSING');
  });

  it('rethrows any other error code', async () => {
    const mockPatch = vi.fn().mockRejectedValue({ code: 429 });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ patch: mockPatch }) }) }),
    });

    await expect(patchCommissionHold('t1', hold, readStartedAt)).rejects.toMatchObject({ code: 429 });
  });
});

describe('listTechniciansWithHold', () => {
  it('queries IS_DEFINED(c.commissionHold), maxItemCount 50, and sorts the page by outstandingPaise desc', async () => {
    const page = {
      resources: [
        { id: 't1', displayName: 'Low', commissionHold: { outstandingPaise: 100, dueCount: 1, state: 'WARN', evaluatedAt: 'x' } },
        { id: 't2', displayName: 'High', commissionHold: { outstandingPaise: 900000, dueCount: 3, state: 'BLOCKED', evaluatedAt: 'x' } },
      ],
      continuationToken: undefined,
    };
    const mockFetchNext = vi.fn().mockResolvedValue(page);
    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
    });

    const result = await listTechniciansWithHold();

    expect(mockQuery).toHaveBeenCalledWith(
      { query: 'SELECT c.id, c.displayName, c.name, c.commissionHold FROM c WHERE IS_DEFINED(c.commissionHold)' },
      { maxItemCount: 50 },
    );
    expect(result.items.map((i) => i.id)).toEqual(['t2', 't1']);
    expect(result.continuationToken).toBeUndefined();
  });

  it('passes continuationToken through to the query options and back out', async () => {
    const mockFetchNext = vi.fn().mockResolvedValue({ resources: [], continuationToken: 'next-token' });
    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
    });

    const result = await listTechniciansWithHold('prev-token');

    expect(mockQuery).toHaveBeenCalledWith(
      { query: 'SELECT c.id, c.displayName, c.name, c.commissionHold FROM c WHERE IS_DEFINED(c.commissionHold)' },
      { maxItemCount: 50, continuationToken: 'prev-token' },
    );
    expect(result.continuationToken).toBe('next-token');
  });

  it('falls back to c.name when displayName is absent, and omits name when neither is set', async () => {
    const mockFetchNext = vi.fn().mockResolvedValue({
      resources: [
        { id: 't1', name: 'Legacy Name', commissionHold: { outstandingPaise: 100, dueCount: 1, state: 'WARN', evaluatedAt: 'x' } },
        { id: 't2', commissionHold: { outstandingPaise: 50, dueCount: 1, state: 'WARN', evaluatedAt: 'x' } },
      ],
    });
    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
    });

    const result = await listTechniciansWithHold();

    expect(result.items[0]).toMatchObject({ id: 't1', name: 'Legacy Name' });
    expect(result.items[1]).not.toHaveProperty('name');
  });
});

describe('listAllTechniciansWithHold', () => {
  it('drains every page via hasMoreResults() and maps rows the same as the paged variant', async () => {
    const mockHasMoreResults = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(false);
    const mockFetchNext = vi.fn()
      .mockResolvedValueOnce({ resources: [{ id: 't1', displayName: 'Low', commissionHold: { outstandingPaise: 100, dueCount: 1, state: 'WARN', evaluatedAt: 'x' } }] })
      .mockResolvedValueOnce({ resources: [{ id: 't2', commissionHold: { outstandingPaise: 900000, dueCount: 3, state: 'BLOCKED', evaluatedAt: 'x' } }] });
    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext, hasMoreResults: mockHasMoreResults });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
    });

    const result = await listAllTechniciansWithHold();

    expect(mockQuery).toHaveBeenCalledWith(
      { query: 'SELECT c.id, c.displayName, c.name, c.commissionHold FROM c WHERE IS_DEFINED(c.commissionHold)' },
      { maxItemCount: 50 },
    );
    expect(mockFetchNext).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      { id: 't1', name: 'Low', commissionHold: { outstandingPaise: 100, dueCount: 1, state: 'WARN', evaluatedAt: 'x' } },
      { id: 't2', commissionHold: { outstandingPaise: 900000, dueCount: 3, state: 'BLOCKED', evaluatedAt: 'x' } },
    ]);
  });

  it('returns an empty array when no technician has a commissionHold', async () => {
    const mockHasMoreResults = vi.fn().mockReturnValue(false);
    const mockFetchNext = vi.fn();
    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext, hasMoreResults: mockHasMoreResults });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
    });

    expect(await listAllTechniciansWithHold()).toEqual([]);
    expect(mockFetchNext).not.toHaveBeenCalled();
  });
});

describe('listTechniciansWithExpiredOverride', () => {
  it('queries with a parameterised @now and drains every page', async () => {
    const mockHasMoreResults = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
    const mockFetchNext = vi.fn().mockResolvedValueOnce({ resources: [{ id: 't1' }, { id: 't2' }] });
    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext, hasMoreResults: mockHasMoreResults });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
    });
    const nowIso = '2026-09-05T00:00:00.000Z';

    const result = await listTechniciansWithExpiredOverride(nowIso);

    expect(mockQuery).toHaveBeenCalledWith(
      {
        query: 'SELECT c.id FROM c WHERE IS_DEFINED(c.commissionHold.override) AND c.commissionHold.override.until <= @now',
        parameters: [{ name: '@now', value: nowIso }],
      },
      { maxItemCount: 100 },
    );
    expect(result).toEqual(['t1', 't2']);
  });

  it('returns an empty array when no technician has an expired override', async () => {
    const mockHasMoreResults = vi.fn().mockReturnValue(false);
    const mockFetchNext = vi.fn();
    const mockQuery = vi.fn().mockReturnValue({ fetchNext: mockFetchNext, hasMoreResults: mockHasMoreResults });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: mockQuery } }) }),
    });

    expect(await listTechniciansWithExpiredOverride('2026-09-05T00:00:00.000Z')).toEqual([]);
    expect(mockFetchNext).not.toHaveBeenCalled();
  });
});

describe('patchPaymentProfile', () => {
  it('patches /paymentProfile', async () => {
    const mockPatch = vi.fn().mockResolvedValue({});
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ patch: mockPatch }) }) }),
    });
    const profile = { upiVpa: 'tech@upi', upiUpdatedAt: '2026-09-01T00:00:00.000Z' };

    await patchPaymentProfile('t1', profile);

    expect(mockPatch).toHaveBeenCalledWith({ operations: [{ op: 'set', path: '/paymentProfile', value: profile }] });
  });

  it('maps a 404 to a TECHNICIAN_NOT_FOUND error', async () => {
    const mockPatch = vi.fn().mockRejectedValue({ code: 404 });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ patch: mockPatch }) }) }),
    });

    await expect(patchPaymentProfile('ghost', { upiVpa: 'x@upi', upiUpdatedAt: 'x' }))
      .rejects.toMatchObject({ code: 'TECHNICIAN_NOT_FOUND' });
  });

  it('rethrows any other error code', async () => {
    const mockPatch = vi.fn().mockRejectedValue({ code: 500 });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ item: () => ({ patch: mockPatch }) }) }),
    });

    await expect(patchPaymentProfile('t1', { upiVpa: 'x@upi', upiUpdatedAt: 'x' })).rejects.toMatchObject({ code: 500 });
  });
});
