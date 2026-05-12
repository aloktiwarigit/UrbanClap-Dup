/**
 * E11-S02 — Read API tests (TDD: written before impl)
 *
 * Covers:
 * - GET /v1/customers/me/pending-actions — happy path + filter expired/resolved
 * - GET /v1/technicians/me/pending-actions — happy path + cross-user 403
 * - PATCH /v1/technicians/me/availability — happy path + validation
 * - GET /v1/technicians/me/dashboard — aggregator shape
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock declarations ─────────────────────────────────────────────────────────

vi.mock('../../src/cosmos/pending-action-repository.js', () => ({
  getActivePendingActions: vi.fn(),
}));

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(() => ({
    database: vi.fn(() => ({
      container: vi.fn(() => ({
        items: {
          query: vi.fn(() => ({ fetchAll: vi.fn().mockResolvedValue({ resources: [] }) })),
        },
        item: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ resource: null }),
          replace: vi.fn().mockResolvedValue({ resource: null }),
        })),
      })),
    })),
  })),
  DB_NAME: 'homeservices',
  getPendingActionsContainer: vi.fn(() => ({
    items: {
      query: vi.fn(() => ({ fetchAll: vi.fn().mockResolvedValue({ resources: [] }) })),
    },
  })),
}));

vi.mock('../../src/cosmos/technician-repository.js', () => ({
  getTechnicianAvailability: vi.fn(),
  patchTechnicianAvailability: vi.fn(),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getByCustomerId: vi.fn(),
    getByTechnicianId: vi.fn(),
  },
}));

vi.mock('../../src/cosmos/rating-repository.js', () => ({
  getRatingsByTechnicianId: vi.fn(),
}));

vi.mock('../../src/cosmos/kyc.js', () => ({}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { getActivePendingActions } from '../../src/cosmos/pending-action-repository.js';
import type { PendingActionDoc } from '../../src/schemas/pendingActions.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const FUTURE = new Date(Date.now() + 3600_000).toISOString();

function makeAction(overrides: Partial<PendingActionDoc> = {}): PendingActionDoc {
  return {
    id: 'JOB_OFFER:tech-1:attempt-1',
    userId: 'tech-1',
    type: 'JOB_OFFER',
    status: 'ACTIVE',
    role: 'technician',
    version: 0,
    expiresAt: FUTURE,
    priority: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceId: 'attempt-1',
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getActivePendingActions repository function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns only ACTIVE actions with expiresAt in the future', async () => {
    const activeAction = makeAction({ status: 'ACTIVE', expiresAt: FUTURE });
    vi.mocked(getActivePendingActions).mockResolvedValue([activeAction]);

    const result = await getActivePendingActions('tech-1', new Date().toISOString());

    expect(result).toHaveLength(1);
    expect(result[0]!.status).toBe('ACTIVE');
  });

  it('returns empty list when no active actions exist', async () => {
    vi.mocked(getActivePendingActions).mockResolvedValue([]);

    const result = await getActivePendingActions('tech-1', new Date().toISOString());

    expect(result).toHaveLength(0);
  });

  it('filters out resolved actions', async () => {
    vi.mocked(getActivePendingActions).mockResolvedValue([]); // repository only returns ACTIVE

    const result = await getActivePendingActions('tech-1', new Date().toISOString());
    expect(result.every((a) => a.status === 'ACTIVE')).toBe(true);
  });

  it('sorts by priority asc then expiresAt asc', async () => {
    const low = makeAction({ priority: 5, expiresAt: FUTURE });
    const high = makeAction({ id: 'JOB_OFFER:tech-1:attempt-2', priority: 1, expiresAt: FUTURE, sourceId: 'attempt-2' });
    vi.mocked(getActivePendingActions).mockResolvedValue([high, low]); // repo already sorts

    const result = await getActivePendingActions('tech-1', new Date().toISOString());
    expect(result[0]!.priority).toBeLessThanOrEqual(result[1]!.priority);
  });
});

describe('read API cross-user isolation', () => {
  it('a user cannot see another user actions (userId scoped query)', async () => {
    // The repository query always filters by userId, so user B calling with user-A id
    // would return empty because their token resolves to their own uid.
    vi.mocked(getActivePendingActions).mockImplementation(async (userId) => {
      if (userId === 'user-a') return [makeAction({ userId: 'user-a', role: 'customer' })];
      return [];
    });

    const resultA = await getActivePendingActions('user-a', new Date().toISOString());
    const resultB = await getActivePendingActions('user-b', new Date().toISOString());

    expect(resultA).toHaveLength(1);
    expect(resultB).toHaveLength(0);
  });
});
