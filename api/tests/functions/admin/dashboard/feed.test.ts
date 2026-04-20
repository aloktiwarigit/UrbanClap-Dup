import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';
process.env.COSMOS_ENDPOINT = 'https://fake.documents.azure.com';
process.env.COSMOS_KEY = 'ZmFrZWtleQ==';

vi.mock('../../../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

vi.mock('../../../../src/services/adminSession.service.js', () => ({
  touchAndGetSession: vi.fn(),
}));

import { feedHandler } from '../../../../src/functions/admin/dashboard/feed.js';
import { getCosmosClient } from '../../../../src/cosmos/client.js';
import { touchAndGetSession } from '../../../../src/services/adminSession.service.js';
import { requireAdmin } from '../../../../src/middleware/requireAdmin.js';
import { HttpRequest } from '@azure/functions';
import type { InvocationContext, HttpResponseInit } from '@azure/functions';
import { BookingEventsResponseSchema } from '../../../../src/schemas/dashboard.js';

const fakeCtx = { error: vi.fn() } as unknown as InvocationContext;

function makeReq(cookieHeader?: string): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/admin/dashboard/feed',
    method: 'GET',
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

const fakeEvents = [
  {
    id: 'evt-1',
    bookingId: 'b-1',
    status: 'completed',
    customerId: 'c-1',
    technicianId: 't-1',
    serviceId: 'svc-1',
    amount: 50000,
    createdAt: '2026-04-19T10:00:00Z',
    kind: 'completed',
    title: 'Booking completed',
  },
];

describe('GET /v1/admin/dashboard/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    const wrapped = requireAdmin(['super-admin', 'ops-manager'])(feedHandler);
    const res = (await wrapped(makeReq(), fakeCtx)) as HttpResponseInit;
    expect(res.status).toBe(401);
  });

  it('returns 502 UPSTREAM_ERROR on Cosmos failure', async () => {
    vi.mocked(getCosmosClient).mockReturnValue({
      database: () => ({
        container: () => ({
          items: {
            query: vi.fn().mockReturnValue({
              fetchAll: vi.fn().mockRejectedValue(new Error('Cosmos down')),
            }),
          },
        }),
      }),
    } as any);

    const res = (await feedHandler(makeReq(), fakeCtx, {
      adminId: 'u1',
      role: 'super-admin',
      sessionId: 's1',
    })) as HttpResponseInit;

    expect(res.status).toBe(502);
    expect((res.jsonBody as any).code).toBe('UPSTREAM_ERROR');
  });

  it('returns 200 with BookingEventsResponse on happy path', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);

    vi.mocked(getCosmosClient).mockReturnValue({
      database: () => ({
        container: () => ({
          items: {
            query: vi.fn().mockReturnValue({
              fetchAll: vi.fn().mockResolvedValue({ resources: fakeEvents }),
            }),
          },
        }),
      }),
    } as any);

    const res = (await feedHandler(makeReq(), fakeCtx, {
      adminId: 'u1',
      role: 'super-admin',
      sessionId: 's1',
    })) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(res.headers).toMatchObject({ 'Cache-Control': 'no-store' });

    const parsed = BookingEventsResponseSchema.safeParse(res.jsonBody);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.events).toHaveLength(1);
      expect(parsed.data.total).toBe(1);
    }
  });

  it('response body passes BookingEventsResponseSchema validation', async () => {
    vi.mocked(getCosmosClient).mockReturnValue({
      database: () => ({
        container: () => ({
          items: {
            query: vi.fn().mockReturnValue({
              fetchAll: vi.fn().mockResolvedValue({ resources: [] }),
            }),
          },
        }),
      }),
    } as any);

    const res = (await feedHandler(makeReq(), fakeCtx, {
      adminId: 'u1',
      role: 'super-admin',
      sessionId: 's1',
    })) as HttpResponseInit;

    const parsed = BookingEventsResponseSchema.safeParse(res.jsonBody);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(Array.isArray(parsed.data.events)).toBe(true);
      expect(parsed.data.total).toBe(0);
    }
  });
});
