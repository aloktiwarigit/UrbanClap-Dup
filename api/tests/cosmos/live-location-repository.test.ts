import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LiveLocationDoc } from '../../src/schemas/live-location.js';

// ── Cosmos mock setup ──────────────────────────────────────────────────────
const mockUpsert = vi.fn();
const mockRead = vi.fn();
const mockItem = vi.fn((_id: string, _pk: string) => ({ read: mockRead }));
const mockItems = { upsert: mockUpsert };

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: () => ({
    database: () => ({
      container: () => ({
        item: mockItem,
        items: mockItems,
      }),
    }),
  }),
  DB_NAME: 'homeservices',
}));

import { liveLocationRepo } from '../../src/cosmos/live-location-repository.js';

// ── Fixtures ───────────────────────────────────────────────────────────────
const makeDoc = (overrides?: Partial<LiveLocationDoc>): LiveLocationDoc => ({
  id: 'bk-123',
  bookingId: 'bk-123',
  technicianId: 'tech-456',
  customerId: 'cust-789',
  lat: 26.8467,
  lng: 80.9462,
  accuracyMeters: 5,
  capturedAt: 1_700_000_000,
  isMock: false,
  receivedAt: '2026-05-17T10:00:00.000Z',
  ttl: 3600,
  ...overrides,
});

describe('liveLocationRepo.upsert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls container.items.upsert with the provided doc', async () => {
    const doc = makeDoc();
    mockUpsert.mockResolvedValue({ resource: doc });

    await liveLocationRepo.upsert(doc);

    expect(mockUpsert).toHaveBeenCalledOnce();
    expect(mockUpsert).toHaveBeenCalledWith(doc);
  });

  it('uses id equal to bookingId in the upserted doc', async () => {
    const doc = makeDoc({ id: 'bk-123', bookingId: 'bk-123' });
    mockUpsert.mockResolvedValue({ resource: doc });

    await liveLocationRepo.upsert(doc);

    const calledDoc = mockUpsert.mock.calls[0]?.[0] as LiveLocationDoc;
    expect(calledDoc.id).toBe(calledDoc.bookingId);
  });

  it('resolves without returning a value', async () => {
    mockUpsert.mockResolvedValue({});

    const result = await liveLocationRepo.upsert(makeDoc());

    expect(result).toBeUndefined();
  });
});

describe('liveLocationRepo.getLatest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls container.item with (bookingId, bookingId) for single-partition point-read', async () => {
    const doc = makeDoc();
    mockRead.mockResolvedValue({ resource: doc });

    await liveLocationRepo.getLatest('bk-123');

    expect(mockItem).toHaveBeenCalledWith('bk-123', 'bk-123');
  });

  it('returns the doc when resource is present', async () => {
    const doc = makeDoc();
    mockRead.mockResolvedValue({ resource: doc });

    const result = await liveLocationRepo.getLatest('bk-123');

    expect(result).toEqual(doc);
  });

  it('returns null when resource is undefined (doc not found)', async () => {
    mockRead.mockResolvedValue({ resource: undefined });

    const result = await liveLocationRepo.getLatest('bk-missing');

    expect(result).toBeNull();
  });

  it('returns null when resource is null', async () => {
    mockRead.mockResolvedValue({ resource: null });

    const result = await liveLocationRepo.getLatest('bk-missing');

    expect(result).toBeNull();
  });
});
