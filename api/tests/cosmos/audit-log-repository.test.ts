import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuditLogDoc, AuditLogQuery } from '../../src/schemas/audit-log.js';

// --- Mocks ---
const mockCreate = vi.fn();
const mockFetchNext = vi.fn();
const mockQuery = vi.fn(() => ({ fetchNext: mockFetchNext }));

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: () => ({
    database: () => ({
      container: () => ({
        items: {
          create: mockCreate,
          query: mockQuery,
        },
      }),
    }),
  }),
  DB_NAME: 'homeservices',
}));

import {
  appendAuditEntry,
  queryAuditLog,
} from '../../src/cosmos/audit-log-repository.js';

const sampleDoc: AuditLogDoc = {
  id: '00000000-0000-0000-0000-000000000001',
  adminId: 'admin-1',
  role: 'super-admin',
  action: 'admin.login',
  resourceType: 'admin_session',
  resourceId: 'sess-abc',
  payload: { ip: '1.2.3.4' },
  timestamp: '2026-04-20T10:00:00.000Z',
  partitionKey: '2026-04',
};

describe('appendAuditEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ resource: sampleDoc });
  });

  it('calls container.items.create with the full doc', async () => {
    await appendAuditEntry(sampleDoc);
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate).toHaveBeenCalledWith(sampleDoc);
  });

  it('propagates Cosmos errors to the caller', async () => {
    mockCreate.mockRejectedValue(new Error('Cosmos unavailable'));
    await expect(appendAuditEntry(sampleDoc)).rejects.toThrow('Cosmos unavailable');
  });
});

describe('queryAuditLog', () => {
  const baseQuery: AuditLogQuery = { pageSize: 20 };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchNext.mockResolvedValue({ resources: [sampleDoc], continuationToken: undefined });
    mockQuery.mockReturnValue({ fetchNext: mockFetchNext });
  });

  it('returns entries from Cosmos', async () => {
    const result = await queryAuditLog(baseQuery);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.id).toBe(sampleDoc.id);
  });

  it('strips partitionKey from returned entries', async () => {
    const result = await queryAuditLog(baseQuery);
    expect((result.entries[0] as Record<string, unknown>)['partitionKey']).toBeUndefined();
  });

  it('returns continuationToken when present', async () => {
    mockFetchNext.mockResolvedValue({ resources: [sampleDoc], continuationToken: 'next-page' });
    const result = await queryAuditLog(baseQuery);
    expect(result.continuationToken).toBe('next-page');
  });

  it('omits continuationToken when undefined', async () => {
    const result = await queryAuditLog(baseQuery);
    expect(result.continuationToken).toBeUndefined();
  });

  it('calls fetchNext once per call', async () => {
    await queryAuditLog(baseQuery);
    expect(mockFetchNext).toHaveBeenCalledOnce();
  });

  it('passes continuationToken option to Cosmos query', async () => {
    await queryAuditLog({ ...baseQuery, continuationToken: 'existing-tok' });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.any(String) }),
      expect.objectContaining({ continuationToken: 'existing-tok' }),
    );
  });
});
