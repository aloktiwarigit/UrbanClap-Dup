import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/middleware/requireCustomer.js', () => ({
  requireCustomer: (handler: any) => handler,
}));
vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import { getConfidenceScoreHandler } from '../../src/functions/technicians.js';
import { getCosmosClient } from '../../src/cosmos/client.js';
import type { HttpRequest, InvocationContext } from '@azure/functions';
import type { CustomerContext } from '../../src/types/customer.js';

function makeRequest(techId: string, lat = '12.97', lng = '77.59'): HttpRequest {
  return {
    params: { id: techId },
    query: { get: (k: string) => ({ lat, lng }[k as 'lat' | 'lng'] ?? null) },
    headers: { get: () => 'Bearer tok' },
  } as unknown as HttpRequest;
}

const FAKE_TECH = { id: 'tech-1', location: { type: 'Point', coordinates: [77.59, 12.97] }, rating: 4.5 };
const CUSTOMER: CustomerContext = { customerId: 'cust-1' };

describe('GET /v1/technicians/:id/confidence-score', () => {
  let bookingsContainer: any;
  let techsContainer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    bookingsContainer = {
      items: { query: vi.fn().mockReturnValue({ fetchAll: vi.fn().mockResolvedValue({ resources: [] }) }) },
    };
    techsContainer = {
      item: vi.fn().mockReturnValue({ read: vi.fn().mockResolvedValue({ resource: FAKE_TECH }) }),
    };
    vi.mocked(getCosmosClient).mockReturnValue({
      database: () => ({ container: (name: string) => name === 'bookings' ? bookingsContainer : techsContainer }),
    } as any);
  });

  it('returns 400 when lat/lng missing', async () => {
    const req = { params: { id: 'tech-1' }, query: { get: () => null }, headers: { get: () => 'Bearer tok' } } as unknown as HttpRequest;
    const res = await getConfidenceScoreHandler(req, {} as InvocationContext, CUSTOMER);
    expect(res.status).toBe(400);
  });

  it('returns isLimitedData=true when no completed bookings', async () => {
    const res = await getConfidenceScoreHandler(makeRequest('tech-1'), {} as InvocationContext, CUSTOMER);
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).isLimitedData).toBe(true);
    expect((res.jsonBody as any).dataPointCount).toBe(0);
  });

  it('computes onTimePercent=50 when 1 of 2 bookings started within 15 min of slot', async () => {
    const slotDate = '2026-04-01';
    const slotWindow = '09:00-11:00';
    bookingsContainer.items.query.mockReturnValue({
      fetchAll: vi.fn().mockResolvedValue({
        resources: [
          { id: 'b1', status: 'COMPLETED', slotDate, slotWindow, startedAt: '2026-04-01T09:05:00.000Z' },
          { id: 'b2', status: 'PAID',      slotDate, slotWindow, startedAt: '2026-04-01T09:20:00.000Z' },
        ],
      }),
    });
    const res = await getConfidenceScoreHandler(makeRequest('tech-1'), {} as InvocationContext, CUSTOMER);
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).onTimePercent).toBe(50);
    expect((res.jsonBody as any).dataPointCount).toBe(2);
  });

  it('returns nearestEtaMinutes ≈ 0 when tech coords match customer', async () => {
    const res = await getConfidenceScoreHandler(makeRequest('tech-1', '12.97', '77.59'), {} as InvocationContext, CUSTOMER);
    expect((res.jsonBody as any).nearestEtaMinutes).toBeCloseTo(0, 0);
  });

  it('returns nearestEtaMinutes=null when tech has no location', async () => {
    techsContainer.item.mockReturnValue({ read: vi.fn().mockResolvedValue({ resource: { id: 'tech-1' } }) });
    const res = await getConfidenceScoreHandler(makeRequest('tech-1'), {} as InvocationContext, CUSTOMER);
    expect((res.jsonBody as any).nearestEtaMinutes).toBeNull();
  });

  it('returns 404 when technician does not exist', async () => {
    techsContainer.item.mockReturnValue({ read: vi.fn().mockResolvedValue({ resource: undefined }) });
    const res = await getConfidenceScoreHandler(makeRequest('unknown-tech'), {} as InvocationContext, CUSTOMER);
    expect(res.status).toBe(404);
  });

  it('returns areaRating=null (no per-booking ratings collected yet)', async () => {
    const res = await getConfidenceScoreHandler(makeRequest('tech-1'), {} as InvocationContext, CUSTOMER);
    expect((res.jsonBody as any).areaRating).toBeNull();
  });

  it('returns nearestEtaMinutes=null when customer lat/lng are (0,0) sentinel', async () => {
    const req = makeRequest('tech-1', '0', '0');
    const res = await getConfidenceScoreHandler(req, {} as InvocationContext, CUSTOMER);
    expect((res.jsonBody as any).nearestEtaMinutes).toBeNull();
  });
});
