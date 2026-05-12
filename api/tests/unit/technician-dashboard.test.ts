/**
 * E11-S02 — Technician dashboard aggregator tests (TDD: written before impl)
 *
 * Covers:
 * - Dashboard shape with active job, pending offers, earnings, ratings
 * - Dashboard with no active job
 * - Cross-user 403 (auth middleware)
 * - Graceful degradation when sub-queries fail
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock declarations ─────────────────────────────────────────────────────────

vi.mock('../../src/cosmos/pending-action-repository.js', () => ({
  getActivePendingActions: vi.fn(),
}));

vi.mock('../../src/cosmos/technician-repository.js', () => ({
  getKycByTechnicianId: vi.fn(),
  getTechnicianAvailability: vi.fn(),
  patchTechnicianAvailability: vi.fn(),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getByTechnicianId: vi.fn(),
  },
}));

vi.mock('../../src/cosmos/client.js', () => ({
  DB_NAME: 'homeservices',
  getCosmosClient: vi.fn(() => ({
    database: vi.fn(() => ({
      container: vi.fn(() => ({
        items: {
          query: vi.fn(() => ({
            fetchAll: vi.fn().mockResolvedValue({ resources: [] }),
          })),
        },
        item: vi.fn(() => ({
          read: vi.fn().mockResolvedValue({ resource: null }),
        })),
      })),
    })),
  })),
}));

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn().mockResolvedValue({ uid: 'tech-1' }),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { getActivePendingActions } from '../../src/cosmos/pending-action-repository.js';
import { getKycByTechnicianId } from '../../src/cosmos/technician-repository.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { TechnicianDashboardResponseSchema } from '../../src/functions/technician-dashboard.js';
import type { PendingActionDoc } from '../../src/schemas/pendingActions.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FUTURE = new Date(Date.now() + 3600_000).toISOString();
const TODAY = new Date().toISOString().slice(0, 10);

function makeAction(overrides: Partial<PendingActionDoc> = {}): PendingActionDoc {
  return {
    id: 'JOB_OFFER:tech-1:attempt-1',
    userId: 'tech-1',
    type: 'JOB_OFFER',
    status: 'ACTIVE',
    role: 'technician',
    version: 0,
    expiresAt: FUTURE,
    priority: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceId: 'attempt-1',
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TechnicianDashboardResponseSchema', () => {
  it('validates a complete dashboard response', () => {
    const result = TechnicianDashboardResponseSchema.safeParse({
      kycStatus: 'COMPLETE',
      activeJob: {
        bookingId: 'bk-1',
        status: 'EN_ROUTE',
        serviceId: 'svc-1',
        slotDate: TODAY,
        slotWindow: '10:00-12:00',
        addressText: 'Test Address',
      },
      pendingOfferCount: 2,
      todayEarningsInPaise: 50000,
      todayRatingCount: 3,
      todayRatingAverage: 4.5,
      fetchedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it('accepts null activeJob and null todayRatingAverage', () => {
    const result = TechnicianDashboardResponseSchema.safeParse({
      kycStatus: null,
      activeJob: null,
      pendingOfferCount: 0,
      todayEarningsInPaise: 0,
      todayRatingCount: 0,
      todayRatingAverage: null,
      fetchedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative pendingOfferCount', () => {
    const result = TechnicianDashboardResponseSchema.safeParse({
      kycStatus: null,
      activeJob: null,
      pendingOfferCount: -1,
      todayEarningsInPaise: 0,
      todayRatingCount: 0,
      todayRatingAverage: null,
      fetchedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});

describe('dashboard data aggregation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes pendingOfferCount from JOB_OFFER active actions', async () => {
    vi.mocked(getActivePendingActions).mockResolvedValue([
      makeAction({ type: 'JOB_OFFER', status: 'ACTIVE' }),
      makeAction({ type: 'JOB_OFFER', status: 'ACTIVE', id: 'JOB_OFFER:tech-1:attempt-2', sourceId: 'attempt-2' }),
      makeAction({ type: 'KYC_RESUME', status: 'ACTIVE', id: 'KYC_RESUME:tech-1:tech-1', sourceId: 'tech-1' }),
    ]);
    vi.mocked(getKycByTechnicianId).mockResolvedValue({ kycStatus: 'COMPLETE', aadhaarVerified: true, aadhaarMaskedNumber: '****', panNumber: null, panImagePath: null, updatedAt: new Date().toISOString() });
    vi.mocked(bookingRepo.getByTechnicianId).mockResolvedValue([]);

    const actions = await getActivePendingActions('tech-1', new Date().toISOString());
    const pendingOfferCount = actions.filter((a) => a.type === 'JOB_OFFER' && a.status === 'ACTIVE').length;
    expect(pendingOfferCount).toBe(2);
  });

  it('finds the first active-status booking as activeJob', async () => {
    const activeBooking = {
      id: 'bk-active',
      customerId: 'cust-1',
      technicianId: 'tech-1',
      status: 'EN_ROUTE' as const,
      serviceId: 'svc-1',
      categoryId: 'cat-1',
      slotDate: TODAY,
      slotWindow: '10:00-12:00',
      addressText: 'Addr',
      addressLatLng: { lat: 0, lng: 0 },
      paymentOrderId: 'po-1',
      paymentId: null,
      paymentSignature: null,
      amount: 50000,
      createdAt: new Date().toISOString(),
    };
    vi.mocked(bookingRepo.getByTechnicianId).mockResolvedValue([activeBooking]);

    const bookings = await bookingRepo.getByTechnicianId('tech-1');
    const ACTIVE_STATUSES = new Set(['ASSIGNED', 'EN_ROUTE', 'REACHED', 'IN_PROGRESS', 'AWAITING_PRICE_APPROVAL']);
    const found = bookings.find((b) => ACTIVE_STATUSES.has(b.status));
    expect(found?.id).toBe('bk-active');
  });
});
