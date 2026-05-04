import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
  getSystemContainer: vi.fn(),
}));

// node-fetch is used by the service to fetch the Truecaller public key.
// We mock the global fetch to avoid real network calls.
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { getTruecallerPublicKey, _resetCacheForTest } from '../../src/services/truecaller.service.js';
import { getSystemContainer } from '../../src/cosmos/client.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const FAKE_PUB_KEY = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq...\n-----END PUBLIC KEY-----';
const NOW = 1_700_000_000_000; // fixed epoch ms

function makeCosmosContainer(storedItem: unknown) {
  return {
    item: vi.fn().mockReturnValue({
      read: vi.fn().mockResolvedValue(storedItem ? { resource: storedItem } : { resource: undefined }),
    }),
    items: {
      upsert: vi.fn().mockResolvedValue({}),
    },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('truecaller.service — getTruecallerPublicKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(NOW);
    _resetCacheForTest();
  });

  it('returns cached key from Cosmos when within TTL (24h)', async () => {
    const fetchedAt = NOW - 1000 * 60 * 60; // 1 hour ago — within 24h TTL
    const container = makeCosmosContainer({
      id: 'truecaller-pubkey',
      publicKey: FAKE_PUB_KEY,
      fetchedAt,
    });
    vi.mocked(getSystemContainer).mockReturnValue(container as unknown as ReturnType<typeof getSystemContainer>);

    const key = await getTruecallerPublicKey();

    expect(key).toBe(FAKE_PUB_KEY);
    // Should NOT have called the Truecaller API
    expect(mockFetch).not.toHaveBeenCalled();
    // Should NOT have written back to Cosmos
    expect(container.items.upsert).not.toHaveBeenCalled();
  });

  it('fetches from Truecaller API when no entry exists in Cosmos (cache miss)', async () => {
    // Cosmos returns no item
    const container = makeCosmosContainer(null);
    vi.mocked(getSystemContainer).mockReturnValue(container as unknown as ReturnType<typeof getSystemContainer>);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: FAKE_PUB_KEY }),
    });

    const key = await getTruecallerPublicKey();

    expect(key).toBe(FAKE_PUB_KEY);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api4.truecaller.com/v1/key',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(container.items.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'truecaller-pubkey',
        publicKey: FAKE_PUB_KEY,
        fetchedAt: NOW,
      }),
    );
  });

  it('re-fetches from Truecaller API when cached entry is stale (>24h)', async () => {
    const fetchedAt = NOW - 1000 * 60 * 60 * 25; // 25 hours ago — stale
    const container = makeCosmosContainer({
      id: 'truecaller-pubkey',
      publicKey: 'OLD_KEY',
      fetchedAt,
    });
    vi.mocked(getSystemContainer).mockReturnValue(container as unknown as ReturnType<typeof getSystemContainer>);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: FAKE_PUB_KEY }),
    });

    const key = await getTruecallerPublicKey();

    expect(key).toBe(FAKE_PUB_KEY);
    expect(mockFetch).toHaveBeenCalled();
    expect(container.items.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ publicKey: FAKE_PUB_KEY, fetchedAt: NOW }),
    );
  });

  it('throws when Truecaller API returns non-ok response', async () => {
    const container = makeCosmosContainer(null);
    vi.mocked(getSystemContainer).mockReturnValue(container as unknown as ReturnType<typeof getSystemContainer>);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(getTruecallerPublicKey()).rejects.toThrow(/Truecaller public key fetch failed/);
  });
});
