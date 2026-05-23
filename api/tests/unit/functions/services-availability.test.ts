import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn().mockResolvedValue({ uid: 'cust-1' }),
}));
vi.mock('../../../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: { getServiceByIdCrossPartition: vi.fn() },
}));
vi.mock('../../../src/cosmos/slot-holds-repository.js', () => ({
  slotHoldsRepo: { listHolds: vi.fn() },
}));
vi.mock('../../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getBookedWindowsByServiceDate: vi.fn() },
}));

import { availabilityHandler } from '../../../src/functions/services-availability.js';
import { catalogueRepo } from '../../../src/cosmos/catalogue-repository.js';
import { slotHoldsRepo } from '../../../src/cosmos/slot-holds-repository.js';
import { bookingRepo } from '../../../src/cosmos/booking-repository.js';
import type { Service } from '../../../src/schemas/service.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ctx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;
const CUSTOMER = { customerId: 'cust-1' };

// A date 3 days from now — always within the 7-day window regardless of timezone
const VALID_DATE = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10)!;

function makeReq(serviceId: string, date: string): HttpRequest {
  return {
    params: { id: serviceId },
    query: { get: (k: string) => (k === 'date' ? date : null) },
    headers: { get: () => 'Bearer token' },
  } as unknown as HttpRequest;
}

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: 'svc-ac',
    categoryId: 'cat-1',
    name: 'AC Deep Clean',
    shortDescription: 'Deep clean',
    heroImageUrl: 'https://example.com/img.jpg',
    basePrice: 59900,
    commissionBps: 2000,
    durationMinutes: 60,
    includes: [],
    faq: [],
    addOns: [],
    photoStages: [],
    isActive: true,
    updatedBy: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue(makeService());
  vi.mocked(slotHoldsRepo.listHolds).mockResolvedValue([]);
  vi.mocked(bookingRepo.getBookedWindowsByServiceDate).mockResolvedValue([]);
});

describe('GET /v1/services/{id}/availability', () => {
  describe('happy path', () => {
    it('returns 200 with all slots available when no holds or bookings exist', async () => {
      const res = await availabilityHandler(makeReq('svc-ac', VALID_DATE), ctx, CUSTOMER as any);

      expect(res.status).toBe(200);
      const body = res.jsonBody as { slots: { window: string; available: boolean }[]; slotGranularityMinutes: number };
      expect(body.slotGranularityMinutes).toBe(60);
      expect(body.slots.length).toBeGreaterThan(0);
      expect(body.slots.every((s) => s.available)).toBe(true);
    });

    it('marks a held slot as unavailable', async () => {
      const service = makeService({ workStart: '08:00', workEnd: '09:00', durationMinutes: 60 });
      vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue(service);
      vi.mocked(slotHoldsRepo.listHolds).mockResolvedValue([
        { id: 'x', servicePartitionKey: 'y', serviceId: 'svc-ac', date: VALID_DATE, window: '08:00-09:00', customerId: 'other', heldAt: new Date().toISOString() },
      ]);

      const res = await availabilityHandler(makeReq('svc-ac', VALID_DATE), ctx, CUSTOMER as any);

      expect(res.status).toBe(200);
      const body = res.jsonBody as { slots: { window: string; available: boolean }[] };
      expect(body.slots[0]!.available).toBe(false);
    });

    it('marks a hard-booked slot as unavailable', async () => {
      const service = makeService({ workStart: '08:00', workEnd: '09:00', durationMinutes: 60 });
      vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue(service);
      vi.mocked(bookingRepo.getBookedWindowsByServiceDate).mockResolvedValue(['08:00-09:00']);

      const res = await availabilityHandler(makeReq('svc-ac', VALID_DATE), ctx, CUSTOMER as any);

      expect(res.status).toBe(200);
      const body = res.jsonBody as { slots: { window: string; available: boolean }[] };
      expect(body.slots[0]!.available).toBe(false);
    });
  });

  describe('date validation (422)', () => {
    it('rejects a past date', async () => {
      const res = await availabilityHandler(makeReq('svc-ac', '2020-01-01'), ctx, CUSTOMER as any);
      expect(res.status).toBe(422);
      const body = res.jsonBody as { code: string };
      expect(body.code).toBe('INVALID_DATE_RANGE');
    });

    it('rejects a date more than 7 days in the future', async () => {
      const res = await availabilityHandler(makeReq('svc-ac', '2099-12-31'), ctx, CUSTOMER as any);
      expect(res.status).toBe(422);
      const body = res.jsonBody as { code: string };
      expect(body.code).toBe('INVALID_DATE_RANGE');
    });

    it('rejects a malformed date string', async () => {
      const res = await availabilityHandler(makeReq('svc-ac', '2026-13-01'), ctx, CUSTOMER as any);
      expect(res.status).toBe(422);
    });

    it('rejects a missing date query param', async () => {
      const req = { ...makeReq('svc-ac', ''), query: { get: () => null } } as unknown as HttpRequest;
      const res = await availabilityHandler(req, ctx, CUSTOMER as any);
      expect(res.status).toBe(422);
    });
  });

  describe('service lookup', () => {
    it('returns 404 when service does not exist', async () => {
      vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue(null);

      const res = await availabilityHandler(makeReq('svc-unknown', VALID_DATE), ctx, CUSTOMER as any);
      expect(res.status).toBe(404);
    });

    it('returns 404 when service exists but is inactive', async () => {
      vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue(makeService({ isActive: false }));

      const res = await availabilityHandler(makeReq('svc-ac', VALID_DATE), ctx, CUSTOMER as any);
      expect(res.status).toBe(404);
    });
  });
});
