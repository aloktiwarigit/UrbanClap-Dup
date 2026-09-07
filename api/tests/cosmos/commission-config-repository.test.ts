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

const mockRead = vi.fn();
const mockReplace = vi.fn();
const mockCreate = vi.fn();

function makeContainer() {
  return {
    item: vi.fn().mockReturnValue({
      read: mockRead,
      replace: mockReplace,
    }),
    items: { create: mockCreate },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSystemContainer).mockReturnValue(
    makeContainer() as unknown as ReturnType<typeof getSystemContainer>,
  );
});

describe('commissionConfigRepo.getCommissionConfig', () => {
  it('returns null when the doc does not exist', async () => {
    mockRead.mockResolvedValue({ resource: undefined, etag: undefined });

    const result = await commissionConfigRepo.getCommissionConfig();
    expect(result).toBeNull();
  });

  it('returns the doc when it exists', async () => {
    mockRead.mockResolvedValue({ resource: MOCK_DOC, etag: '"1"' });

    const result = await commissionConfigRepo.getCommissionConfig();
    expect(result).toEqual(MOCK_DOC);
  });

  it('performs a point read with the singleton id', async () => {
    mockRead.mockResolvedValue({ resource: MOCK_DOC, etag: '"1"' });

    const container = getSystemContainer();
    await commissionConfigRepo.getCommissionConfig();
    expect(container.item).toHaveBeenCalledWith('commission-config', 'commission-config');
  });
});

describe('commissionConfigRepo.patchCommissionConfig', () => {
  it('merges over the existing doc under IfMatch', async () => {
    mockRead.mockResolvedValue({
      resource: {
        id: 'commission-config',
        defaultCommissionBps: 2200,
        warnThresholdPaise: 100000,
        blockThresholdPaise: 300000,
        updatedBy: 'a',
        updatedAt: 't',
      },
      etag: '"1"',
    });
    mockReplace.mockResolvedValue({});

    const doc = await commissionConfigRepo.patchCommissionConfig({ defaultCommissionBps: 2500 }, 'admin-1');

    expect(doc).toMatchObject({
      defaultCommissionBps: 2500,
      warnThresholdPaise: 100000,
      blockThresholdPaise: 300000,
      updatedBy: 'admin-1',
    });
    expect(mockReplace.mock.calls[0]![1]).toMatchObject({ accessCondition: { type: 'IfMatch', condition: '"1"' } });
  });

  it('rejects a patch whose merged warn >= stored block', async () => {
    mockRead.mockResolvedValue({
      resource: {
        id: 'commission-config',
        defaultCommissionBps: 2200,
        blockThresholdPaise: 300000,
        updatedBy: 'a',
        updatedAt: 't',
      },
      etag: '"1"',
    });

    await expect(
      commissionConfigRepo.patchCommissionConfig({ warnThresholdPaise: 300000 }, 'admin-1'),
    ).rejects.toMatchObject({ code: 'THRESHOLD_ORDER' });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('creates the doc when absent', async () => {
    mockRead.mockResolvedValue({ resource: undefined, etag: undefined });
    mockCreate.mockResolvedValue({});

    const doc = await commissionConfigRepo.patchCommissionConfig({ holdEnforcementEnabled: true }, 'admin-1');

    expect(doc).toMatchObject({
      id: 'commission-config',
      defaultCommissionBps: 2200,
      holdEnforcementEnabled: true,
    });
    expect(mockCreate).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('retries on a 412 precondition failure and succeeds on the next attempt', async () => {
    mockRead.mockResolvedValue({
      resource: { id: 'commission-config', defaultCommissionBps: 2200, updatedBy: 'a', updatedAt: 't' },
      etag: '"1"',
    });
    mockReplace
      .mockRejectedValueOnce(Object.assign(new Error('etag mismatch'), { code: 412 }))
      .mockResolvedValueOnce({});

    const doc = await commissionConfigRepo.patchCommissionConfig({ defaultCommissionBps: 2600 }, 'admin-1');

    expect(doc.defaultCommissionBps).toBe(2600);
    expect(mockReplace).toHaveBeenCalledTimes(2);
  });

  it('gives up after 3 failed attempts and rethrows', async () => {
    mockRead.mockResolvedValue({
      resource: { id: 'commission-config', defaultCommissionBps: 2200, updatedBy: 'a', updatedAt: 't' },
      etag: '"1"',
    });
    mockReplace.mockRejectedValue(Object.assign(new Error('etag mismatch'), { code: 412 }));

    await expect(
      commissionConfigRepo.patchCommissionConfig({ defaultCommissionBps: 2600 }, 'admin-1'),
    ).rejects.toThrow('etag mismatch');
    expect(mockReplace).toHaveBeenCalledTimes(3);
  });
});
