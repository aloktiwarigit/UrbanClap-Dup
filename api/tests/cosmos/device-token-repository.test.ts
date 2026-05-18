import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Cosmos mock setup ──────────────────────────────────────────────────────
const mockUpsert   = vi.fn();
const mockDelete   = vi.fn();
const mockItem     = vi.fn((_id: string, _pk: string) => ({ delete: mockDelete }));
const mockFetchAll = vi.fn();
const mockQuery    = vi.fn(() => ({ fetchAll: mockFetchAll }));
const mockItems    = { upsert: mockUpsert, query: mockQuery };

vi.mock('../../src/cosmos/client.js', () => ({
  getDeviceTokensContainer: () => ({
    item:  mockItem,
    items: mockItems,
  }),
  DB_NAME: 'homeservices',
}));

import { deviceTokenRepo } from '../../src/cosmos/device-token-repository.js';

// ── Helpers ────────────────────────────────────────────────────────────────
const TOKEN_A = 'a'.repeat(152);
const TOKEN_B = 'b'.repeat(152);
const USER_ID = 'user-001';

// ── registerDeviceToken ────────────────────────────────────────────────────
describe('deviceTokenRepo.registerDeviceToken', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('upserts a document with id = userId:deviceToken', async () => {
    mockUpsert.mockResolvedValue({});

    await deviceTokenRepo.registerDeviceToken(USER_ID, 'customer', TOKEN_A, 'android');

    expect(mockUpsert).toHaveBeenCalledOnce();
    const doc = mockUpsert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(doc['id']).toBe(`${USER_ID}:${TOKEN_A}`);
  });

  it('stores userId, userType, deviceToken, platform in the upserted doc', async () => {
    mockUpsert.mockResolvedValue({});

    await deviceTokenRepo.registerDeviceToken(USER_ID, 'technician', TOKEN_A, 'web', '2.1.0');

    const doc = mockUpsert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(doc['userId']).toBe(USER_ID);
    expect(doc['userType']).toBe('technician');
    expect(doc['deviceToken']).toBe(TOKEN_A);
    expect(doc['platform']).toBe('web');
    expect(doc['appBuild']).toBe('2.1.0');
  });

  it('sets lastSeen to a valid ISO datetime string', async () => {
    mockUpsert.mockResolvedValue({});

    await deviceTokenRepo.registerDeviceToken(USER_ID, 'admin', TOKEN_A, 'android');

    const doc = mockUpsert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(typeof doc['lastSeen']).toBe('string');
    expect(() => new Date(doc['lastSeen'] as string).toISOString()).not.toThrow();
  });

  it('resolves without returning a value', async () => {
    mockUpsert.mockResolvedValue({});
    const result = await deviceTokenRepo.registerDeviceToken(USER_ID, 'customer', TOKEN_A, 'android');
    expect(result).toBeUndefined();
  });
});

// ── getDeviceTokensForUser ─────────────────────────────────────────────────
describe('deviceTokenRepo.getDeviceTokensForUser', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('queries with userId parameter and returns token strings', async () => {
    mockFetchAll.mockResolvedValue({
      resources: [{ deviceToken: TOKEN_A }, { deviceToken: TOKEN_B }],
    });

    const tokens = await deviceTokenRepo.getDeviceTokensForUser(USER_ID);

    expect(mockQuery).toHaveBeenCalledOnce();
    const queryArg = (mockQuery.mock.calls as unknown[][])[0]?.[0] as unknown as { query: string; parameters: { name: string; value: string }[] };
    expect(queryArg.parameters).toContainEqual({ name: '@userId', value: USER_ID });
    expect(tokens).toEqual([TOKEN_A, TOKEN_B]);
  });

  it('returns an empty array when no tokens exist for the user', async () => {
    mockFetchAll.mockResolvedValue({ resources: [] });

    const tokens = await deviceTokenRepo.getDeviceTokensForUser(USER_ID);

    expect(tokens).toEqual([]);
  });

  it('uses a SELECT that projects only deviceToken (PII trim)', async () => {
    mockFetchAll.mockResolvedValue({ resources: [] });

    await deviceTokenRepo.getDeviceTokensForUser(USER_ID);

    const queryArg = (mockQuery.mock.calls as unknown[][])[0]?.[0] as unknown as { query: string };
    expect(queryArg.query).toMatch(/SELECT\s+c\.deviceToken\s+FROM\s+c/i);
  });
});

// ── unregisterDeviceToken ──────────────────────────────────────────────────
describe('deviceTokenRepo.unregisterDeviceToken', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls item delete with id=userId:deviceToken and partitionKey=userId', async () => {
    mockDelete.mockResolvedValue({});

    await deviceTokenRepo.unregisterDeviceToken(USER_ID, TOKEN_A);

    expect(mockItem).toHaveBeenCalledWith(`${USER_ID}:${TOKEN_A}`, USER_ID);
    expect(mockDelete).toHaveBeenCalledOnce();
  });

  it('resolves without returning a value', async () => {
    mockDelete.mockResolvedValue({});
    const result = await deviceTokenRepo.unregisterDeviceToken(USER_ID, TOKEN_A);
    expect(result).toBeUndefined();
  });

  it('swallows 404 (token already removed)', async () => {
    const err404 = Object.assign(new Error('Not found'), { code: 404 });
    mockDelete.mockRejectedValue(err404);

    await expect(deviceTokenRepo.unregisterDeviceToken(USER_ID, TOKEN_A)).resolves.toBeUndefined();
  });

  it('re-throws non-404 Cosmos errors', async () => {
    const err500 = Object.assign(new Error('Cosmos down'), { code: 500 });
    mockDelete.mockRejectedValue(err500);

    await expect(deviceTokenRepo.unregisterDeviceToken(USER_ID, TOKEN_A)).rejects.toThrow('Cosmos down');
  });
});

// ── unregisterAllForUser ───────────────────────────────────────────────────
describe('deviceTokenRepo.unregisterAllForUser', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('queries for all docs for the user then deletes each one', async () => {
    const docs = [
      { id: `${USER_ID}:${TOKEN_A}`, userId: USER_ID },
      { id: `${USER_ID}:${TOKEN_B}`, userId: USER_ID },
    ];
    mockFetchAll.mockResolvedValue({ resources: docs });
    mockDelete.mockResolvedValue({});

    await deviceTokenRepo.unregisterAllForUser(USER_ID);

    expect(mockItem).toHaveBeenCalledTimes(2);
    expect(mockItem).toHaveBeenCalledWith(`${USER_ID}:${TOKEN_A}`, USER_ID);
    expect(mockItem).toHaveBeenCalledWith(`${USER_ID}:${TOKEN_B}`, USER_ID);
    expect(mockDelete).toHaveBeenCalledTimes(2);
  });

  it('resolves with no error when user has no tokens', async () => {
    mockFetchAll.mockResolvedValue({ resources: [] });

    await expect(deviceTokenRepo.unregisterAllForUser(USER_ID)).resolves.toBeUndefined();
    expect(mockDelete).not.toHaveBeenCalled();
  });
});

// ── pruneStaleTokens ───────────────────────────────────────────────────────
describe('deviceTokenRepo.pruneStaleTokens', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('queries with a cutoff based on olderThanDays and deletes each stale doc', async () => {
    const staleDocs = [
      { id: 'user-a:tok1', userId: 'user-a' },
      { id: 'user-b:tok2', userId: 'user-b' },
    ];
    mockFetchAll.mockResolvedValue({ resources: staleDocs });
    mockDelete.mockResolvedValue({});

    const count = await deviceTokenRepo.pruneStaleTokens(60);

    expect(mockQuery).toHaveBeenCalledOnce();
    const queryArg = (mockQuery.mock.calls as unknown[][])[0]?.[0] as unknown as { query: string; parameters: { name: string; value: string }[] };
    expect(queryArg.query).toMatch(/lastSeen\s*<\s*@cutoff/i);
    expect(queryArg.parameters[0]?.name).toBe('@cutoff');

    expect(mockDelete).toHaveBeenCalledTimes(2);
    expect(count).toBe(2);
  });

  it('passes a cutoff ISO string that is olderThanDays days in the past', async () => {
    mockFetchAll.mockResolvedValue({ resources: [] });

    const before = new Date();
    await deviceTokenRepo.pruneStaleTokens(30);
    const after = new Date();

    const cutoffStr = ((mockQuery.mock.calls as unknown[][])[0]?.[0] as unknown as { parameters: { value: string }[] }).parameters[0]?.value as string;
    const cutoff = new Date(cutoffStr);

    const expectedMs30DaysAgo = before.getTime() - 30 * 24 * 60 * 60 * 1000;
    expect(cutoff.getTime()).toBeGreaterThanOrEqual(expectedMs30DaysAgo - 1000);
    expect(cutoff.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('returns 0 when there are no stale tokens', async () => {
    mockFetchAll.mockResolvedValue({ resources: [] });
    const count = await deviceTokenRepo.pruneStaleTokens(60);
    expect(count).toBe(0);
  });
});
