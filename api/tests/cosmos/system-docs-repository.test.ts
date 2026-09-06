import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
  getSystemContainer: vi.fn(),
}));

import { systemDocsRepo } from '../../src/cosmos/system-docs-repository.js';
import { getSystemContainer } from '../../src/cosmos/client.js';

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

describe('systemDocsRepo.getTechnicianClientConfig', () => {
  it('returns null when the doc does not exist', async () => {
    mockRead.mockResolvedValue({ resource: undefined, etag: undefined });
    const result = await systemDocsRepo.getTechnicianClientConfig();
    expect(result).toBeNull();
  });

  it('returns the doc when it exists', async () => {
    const doc = { id: 'technician-client-config', features: { wallet: true } };
    mockRead.mockResolvedValue({ resource: doc, etag: '"1"' });
    const result = await systemDocsRepo.getTechnicianClientConfig();
    expect(result).toEqual(doc);
  });
});

describe('systemDocsRepo.patchTechnicianClientConfig', () => {
  it('shallow-merges features over the existing doc under IfMatch', async () => {
    mockRead.mockResolvedValue({
      resource: {
        id: 'technician-client-config',
        features: { wallet: true, duesBanner: false },
        minSupportedVersionCode: 10,
      },
      etag: '"5"',
    });
    mockReplace.mockResolvedValue({});

    const doc = await systemDocsRepo.patchTechnicianClientConfig(
      { features: { duesBanner: true } },
      'admin-1',
    );

    expect(doc).toMatchObject({
      features: { wallet: true, duesBanner: true },
      minSupportedVersionCode: 10,
      updatedBy: 'admin-1',
    });
    expect(mockReplace.mock.calls[0]![1]).toMatchObject({ accessCondition: { type: 'IfMatch', condition: '"5"' } });
  });

  it('creates the doc when absent', async () => {
    mockRead.mockResolvedValue({ resource: undefined, etag: undefined });
    mockCreate.mockResolvedValue({});

    const doc = await systemDocsRepo.patchTechnicianClientConfig(
      { minSupportedVersionCode: 5 },
      'admin-1',
    );

    expect(doc).toMatchObject({ id: 'technician-client-config', minSupportedVersionCode: 5, updatedBy: 'admin-1' });
    expect(mockCreate).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe('systemDocsRepo.enqueueHoldRepair', () => {
  it('dedupes ids and creates the doc when absent', async () => {
    mockRead.mockResolvedValue({ resource: undefined, etag: undefined });
    mockCreate.mockResolvedValue({});

    await systemDocsRepo.enqueueHoldRepair(['t1', 't2', 't1']);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'hold-repair', technicianIds: ['t1', 't2'], all: false }),
    );
  });

  it('merges new ids with existing ones under IfMatch, deduped', async () => {
    mockRead.mockResolvedValue({
      resource: { id: 'hold-repair', technicianIds: ['t1'], all: false, updatedAt: 't' },
      etag: '"2"',
    });
    mockReplace.mockResolvedValue({});

    await systemDocsRepo.enqueueHoldRepair(['t2', 't1']);

    expect(mockReplace.mock.calls[0]![0]).toMatchObject({ technicianIds: ['t1', 't2'], all: false });
    expect(mockReplace.mock.calls[0]![1]).toMatchObject({ accessCondition: { type: 'IfMatch', condition: '"2"' } });
  });

  it('caps technicianIds at 5000', async () => {
    const existing = Array.from({ length: 4999 }, (_, i) => `t${i}`);
    mockRead.mockResolvedValue({
      resource: { id: 'hold-repair', technicianIds: existing, all: false, updatedAt: 't' },
      etag: '"1"',
    });
    mockReplace.mockResolvedValue({});

    await systemDocsRepo.enqueueHoldRepair(['new1', 'new2', 'new3']);

    const written = mockReplace.mock.calls[0]![0] as { technicianIds: string[] };
    expect(written.technicianIds.length).toBe(5000);
  });

  it("sets all: true when passed 'ALL'", async () => {
    mockRead.mockResolvedValue({ resource: undefined, etag: undefined });
    mockCreate.mockResolvedValue({});

    await systemDocsRepo.enqueueHoldRepair('ALL');

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ all: true }));
  });
});

describe('systemDocsRepo.drainHoldRepair', () => {
  it('returns the drained ids/all and clears the doc under IfMatch', async () => {
    mockRead.mockResolvedValue({
      resource: { id: 'hold-repair', technicianIds: ['t1', 't2'], all: true, updatedAt: 't' },
      etag: '"3"',
    });
    mockReplace.mockResolvedValue({});

    const drained = await systemDocsRepo.drainHoldRepair();

    expect(drained).toEqual({ technicianIds: ['t1', 't2'], all: true });
    expect(mockReplace.mock.calls[0]![0]).toMatchObject({ technicianIds: [], all: false });
    expect(mockReplace.mock.calls[0]![1]).toMatchObject({ accessCondition: { type: 'IfMatch', condition: '"3"' } });
  });

  it('returns empty when the doc is absent', async () => {
    mockRead.mockResolvedValue({ resource: undefined, etag: undefined });

    const drained = await systemDocsRepo.drainHoldRepair();

    expect(drained).toEqual({ technicianIds: [], all: false });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
