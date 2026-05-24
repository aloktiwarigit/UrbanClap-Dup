import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Cosmos client before any imports that depend on it
vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
  getSystemContainer: vi.fn(),
}));

import { commissionConfigRepo } from '../../src/cosmos/commission-config-repository.js';
import { getSystemContainer } from '../../src/cosmos/client.js';
import type { CommissionConfigDoc } from '../../src/schemas/commission-config.js';

const MOCK_DOC: CommissionConfigDoc = {
  id: 'commission-config',
  defaultCommissionBps: 2200,
  updatedBy: 'admin@test.com',
  updatedAt: '2026-05-24T00:00:00.000Z',
};

function makeContainer(readResource: unknown, mockUpsert = vi.fn().mockResolvedValue({})) {
  return {
    item: vi.fn().mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: readResource }),
    }),
    items: { upsert: mockUpsert },
  };
}

describe('commissionConfigRepo.getCommissionConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when the doc does not exist', async () => {
    const container = makeContainer(undefined);
    vi.mocked(getSystemContainer).mockReturnValue(
      container as unknown as ReturnType<typeof getSystemContainer>,
    );

    const result = await commissionConfigRepo.getCommissionConfig();
    expect(result).toBeNull();
  });

  it('returns the doc when it exists', async () => {
    const container = makeContainer(MOCK_DOC);
    vi.mocked(getSystemContainer).mockReturnValue(
      container as unknown as ReturnType<typeof getSystemContainer>,
    );

    const result = await commissionConfigRepo.getCommissionConfig();
    expect(result).toEqual(MOCK_DOC);
  });

  it('performs a point read with the singleton id', async () => {
    const container = makeContainer(MOCK_DOC);
    vi.mocked(getSystemContainer).mockReturnValue(
      container as unknown as ReturnType<typeof getSystemContainer>,
    );

    await commissionConfigRepo.getCommissionConfig();
    expect(container.item).toHaveBeenCalledWith('commission-config', 'commission-config');
  });
});

describe('commissionConfigRepo.upsertCommissionConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('upserts a doc with the correct id and returns it', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    const container = makeContainer(undefined, mockUpsert);
    vi.mocked(getSystemContainer).mockReturnValue(
      container as unknown as ReturnType<typeof getSystemContainer>,
    );

    const result = await commissionConfigRepo.upsertCommissionConfig(2500, 'admin@test.com');

    expect(result.id).toBe('commission-config');
    expect(result.defaultCommissionBps).toBe(2500);
    expect(result.updatedBy).toBe('admin@test.com');
    expect(result.updatedAt).toBeTruthy();
  });

  it('writes the doc to Cosmos via upsert', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    const container = makeContainer(undefined, mockUpsert);
    vi.mocked(getSystemContainer).mockReturnValue(
      container as unknown as ReturnType<typeof getSystemContainer>,
    );

    await commissionConfigRepo.upsertCommissionConfig(3000, 'owner');

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'commission-config',
        defaultCommissionBps: 3000,
        updatedBy: 'owner',
      }),
    );
  });

  it('sets updatedAt to a valid ISO datetime string', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    const container = makeContainer(undefined, mockUpsert);
    vi.mocked(getSystemContainer).mockReturnValue(
      container as unknown as ReturnType<typeof getSystemContainer>,
    );

    const result = await commissionConfigRepo.upsertCommissionConfig(2200, 'admin');
    expect(() => new Date(result.updatedAt)).not.toThrow();
    expect(new Date(result.updatedAt).toISOString()).toBe(result.updatedAt);
  });
});
