import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import {
  upsertTechnicianProfile,
  getTechniciansWithinRadius,
} from '../../../src/cosmos/technician-repository.js';
import { getCosmosClient } from '../../../src/cosmos/client.js';
import type { TechnicianProfile } from '../../../src/schemas/technician.js';

const VALID_PROFILE: TechnicianProfile = {
  id: 'tech-001',
  technicianId: 'tech-001',
  location: { type: 'Point', coordinates: [77.6245, 12.9352] },
  skills: ['ac-deep-clean', 'plumbing-pipe-fix'],
  availabilityWindows: [{ dayOfWeek: 1, startHour: 9, endHour: 18 }],
  isOnline: true,
  isAvailable: true,
  kycStatus: 'APPROVED',
  updatedAt: '2026-04-20T00:00:00.000Z',
};

const makeContainer = (overrides: Record<string, unknown> = {}) => ({
  item: vi.fn(),
  items: { upsert: vi.fn(), query: vi.fn() },
  ...overrides,
});

describe('upsertTechnicianProfile', () => {
  let container: ReturnType<typeof makeContainer>;

  beforeEach(() => {
    container = makeContainer();
    vi.mocked(getCosmosClient).mockReturnValue({
      database: () => ({ container: () => container }),
    } as any);
  });

  it('calls container.items.upsert with the profile', async () => {
    container.items.upsert = vi.fn().mockResolvedValue({});
    await upsertTechnicianProfile(VALID_PROFILE);
    expect(container.items.upsert).toHaveBeenCalledWith(VALID_PROFILE);
  });
});

describe('getTechniciansWithinRadius', () => {
  let container: ReturnType<typeof makeContainer>;
  let capturedQuery: { query: string; parameters: { name: string; value: unknown }[] };

  beforeEach(() => {
    container = makeContainer();
    container.items.query = vi.fn().mockImplementation((q: typeof capturedQuery) => {
      capturedQuery = q;
      return { fetchAll: async () => ({ resources: [VALID_PROFILE] }) };
    });
    vi.mocked(getCosmosClient).mockReturnValue({
      database: () => ({ container: () => container }),
    } as any);
  });

  it('returns technicians array from Cosmos result', async () => {
    const results = await getTechniciansWithinRadius(12.9352, 77.6245, 5, 'ac-deep-clean');
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(VALID_PROFILE);
  });

  it('query SQL includes ST_WITHIN', async () => {
    await getTechniciansWithinRadius(12.9352, 77.6245, 5, 'ac-deep-clean');
    expect(capturedQuery.query).toContain('ST_WITHIN');
  });

  it('query SQL filters on ARRAY_CONTAINS skills', async () => {
    await getTechniciansWithinRadius(12.9352, 77.6245, 5, 'ac-deep-clean');
    expect(capturedQuery.query).toContain('ARRAY_CONTAINS');
    expect(capturedQuery.query).toContain('@serviceId');
  });

  it('query SQL filters on kycStatus APPROVED, isOnline, isAvailable', async () => {
    await getTechniciansWithinRadius(12.9352, 77.6245, 5, 'ac-deep-clean');
    expect(capturedQuery.query).toContain('kycStatus');
    expect(capturedQuery.query).toContain('APPROVED');
    expect(capturedQuery.query).toContain('isOnline');
    expect(capturedQuery.query).toContain('isAvailable');
  });

  it('passes @serviceId parameter with correct value', async () => {
    await getTechniciansWithinRadius(12.9352, 77.6245, 5, 'pipe-leak-fix');
    const serviceIdParam = capturedQuery.parameters.find((p) => p.name === '@serviceId');
    expect(serviceIdParam?.value).toBe('pipe-leak-fix');
  });

  it('passes @polygon parameter as a Polygon GeoJSON', async () => {
    await getTechniciansWithinRadius(12.9352, 77.6245, 5, 'ac-deep-clean');
    const polygonParam = capturedQuery.parameters.find((p) => p.name === '@polygon');
    expect((polygonParam?.value as { type: string }).type).toBe('Polygon');
  });
});
